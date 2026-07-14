import { handleJarvisApiRequest } from "../jarvis/router.js";
import { handleMacroApiRequest } from "../macro/router.js";
import { handleMarketApiRequest } from "../market-data/router.js";
import { handleNewsApiRequest } from "../news/router.js";
import { handleScannerApiRequest } from "../scanner/router.js";
import { handleVisionApiRequest } from "../vision/router.js";
import { BetaAccessGate, betaAccessDenied } from "./auth.js";
import { readPlatformConfig, validateEnvironment } from "./env.js";
import { MemoryFeedbackStore, handleFeedbackRequest } from "./feedback.js";
import { createHealthService, healthResponse } from "./health.js";
import { corsPreflight, requestIdFor, safeFailure, validateHttpRequest, withSecurityHeaders } from "./http-security.js";
import { MemoryAuditTrail, StructuredLogger } from "./observability.js";
import { PlatformRateLimiter, rateLimited } from "./rate-limit.js";

const API_ROUTERS = [handleMarketApiRequest, handleScannerApiRequest, handleMacroApiRequest, handleNewsApiRequest, handleJarvisApiRequest, handleVisionApiRequest];
const PUBLIC_PATHS = new Set(["/health", "/api/status"]);

function authenticatedRequest(request, userRef, betaEnabled) {
  if (!betaEnabled) return request;
  const headers = new Headers(request.headers);
  headers.set("x-jarvis-user-ref", userRef);
  headers.set("x-jarvis-session-id", userRef);
  return new Request(request, { headers });
}

function auditEventFor(request, response) {
  const path = new URL(request.url).pathname;
  if (path === "/api/jarvis/message") return "jarvis_request";
  if (["/api/vision/uploads", "/api/vision/upload"].includes(path)) return "vision_upload";
  if (request.method === "DELETE" && path.startsWith("/api/vision/uploads/")) return "vision_delete";
  return response.status >= 400 ? "request_rejected" : null;
}

export function createPlatformApplication({ env = {}, staticHandler, logger, audit, feedbackStore } = {}) {
  const validation = validateEnvironment(env);
  const config = readPlatformConfig(env);
  const auditTrail = audit || new MemoryAuditTrail();
  const structuredLogger = logger || new StructuredLogger({ buildVersion: config.buildVersion });
  const gate = new BetaAccessGate({ config: config.beta, audit: auditTrail });
  const limiter = new PlatformRateLimiter({ limits: config.limits, audit: auditTrail });
  const feedback = feedbackStore || new MemoryFeedbackStore();
  const health = createHealthService({ env, authGate: gate, audit: auditTrail, feedbackStore: feedback });

  async function handle(originalRequest) {
    const startedAt = Date.now();
    const requestId = requestIdFor(originalRequest);
    const url = new URL(originalRequest.url);
    const origin = originalRequest.headers.get("origin");
    let userRef = "anonymous";
    let response;
    try {
      const preflight = corsPreflight(originalRequest, config, requestId);
      if (preflight) return preflight;
      if (origin && config.appBaseUrl && origin !== config.appBaseUrl) throw Object.assign(new Error("This origin is not allowed."), { code: "ORIGIN_NOT_ALLOWED", status: 403 });
      const invalid = validateHttpRequest(originalRequest, config);
      if (invalid) throw invalid;
      if (url.pathname === "/health") response = healthResponse(health.snapshot(), requestId, false);
      else if (url.pathname === "/api/status") response = healthResponse(health.snapshot(), requestId, true);
      else {
        const access = gate.authenticate(originalRequest);
        userRef = access.userRef;
        if (!access.allowed) response = betaAccessDenied(requestId);
        else {
          const limit = limiter.consume(userRef, url.pathname);
          if (!limit.allowed) response = rateLimited(limit, requestId);
          else {
            const request = authenticatedRequest(originalRequest, userRef, config.beta.enabled);
            response = await handleFeedbackRequest(request, { store: feedback, userRef, requestId, audit: auditTrail });
            if (!response) for (const router of API_ROUTERS) { response = await router(request, env); if (response) break; }
            if (!response && staticHandler && !url.pathname.startsWith("/api/")) response = await staticHandler(request);
            if (!response) response = url.pathname.startsWith("/api/") ? safeFailure({ code: "ROUTE_NOT_FOUND", status: 404, message: "API route not found." }, requestId) : new Response("Not found", { status: 404 });
          }
        }
      }
    } catch (error) {
      const status = Number(error?.status || 500);
      response = safeFailure({ code: status >= 500 ? "INTERNAL_ERROR" : error?.code, status, message: status >= 500 ? "JARVIS could not complete this request." : error?.message }, requestId);
      structuredLogger.error("request_failed", { requestId, userRef, route: url.pathname, method: originalRequest.method, status, errorCategory: error?.code || "INTERNAL_ERROR" });
    }
    const event = auditEventFor(originalRequest, response);
    if (event) auditTrail.record(event, { requestId, userRef, route: url.pathname, method: originalRequest.method, status: response.status });
    const secured = withSecurityHeaders(response, { requestId, config, origin });
    structuredLogger.request({ requestId, userRef, route: url.pathname, method: originalRequest.method, status: secured.status, durationMs: Date.now() - startedAt });
    return secured;
  }

  return { handle, config, validation, audit: auditTrail, feedback, gate, limiter, health };
}
