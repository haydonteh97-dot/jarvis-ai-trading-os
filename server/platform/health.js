import { JarvisCoreOrchestrator } from "../jarvis/orchestrator.js";
import { createMacroEngine } from "../macro/service.js";
import { getMarketDataService } from "../market-data/router.js";
import { createNewsEngine } from "../news/service.js";
import { scannerServiceFor } from "../scanner/service.js";
import { createVisionServices } from "../vision/service.js";
import { safeEnvironmentSummary } from "./env.js";

function normalise(value, fallback = "unavailable") {
  const state = String(value || fallback).toLowerCase();
  if (["connected", "verified", "current", "completed", "ready"].includes(state)) return "ready";
  if (["partial", "preliminary", "delayed", "stale", "scanning"].includes(state)) return "partial";
  if (["mock", "demo"].includes(state)) return "demo";
  if (["error", "failed"].includes(state)) return "error";
  return "unavailable";
}

export function createHealthService({ env = {}, authGate, audit, feedbackStore } = {}) {
  return {
    snapshot() {
      const environment = safeEnvironmentSummary(env);
      const market = getMarketDataService(env).getStatus();
      const scanner = scannerServiceFor(env).getLatest();
      const macro = createMacroEngine(env).getStatus();
      const news = createNewsEngine(env).getStatus();
      const jarvis = new JarvisCoreOrchestrator({ env }).getStatus();
      const vision = createVisionServices(env).visionEngine.getStatus();
      const components = {
        app: environment.valid ? "ready" : "error",
        marketData: normalise(market.status),
        scanner: scanner ? normalise(scanner.status) : normalise(market.status) === "ready" ? "ready" : "unavailable",
        macro: normalise(macro.dataStatus || macro.status),
        news: normalise(news.dataStatus || news.status),
        jarvisAI: normalise(jarvis.status),
        vision: normalise(vision.status),
        storage: "partial",
        authentication: authGate?.getStatus().state || "unavailable",
        betaAccess: authGate?.getStatus().state || "unavailable",
      };
      const values = Object.values(components);
      const overall = values.includes("error") ? "error" : values.includes("unavailable") || values.includes("partial") ? "partial" : values.every((item) => item === "demo") ? "demo" : "ready";
      return {
        status: overall,
        buildVersion: String(env.BUILD_VERSION || "development").slice(0, 80),
        timestamp: new Date().toISOString(),
        components,
        environment: { valid: environment.valid, warnings: environment.warnings.length, errors: environment.errors.length },
        limitations: ["Process-memory state is lost on restart.", "Rate limiting is memory-local.", "OpenAI Vision live verification is blocked by provider quota."],
        audit: { storage: "memory-local", entries: audit?.list().length || 0 },
        feedback: { storage: "memory-local", entries: feedbackStore?.count() || 0 },
      };
    },
  };
}

export function healthResponse(snapshot, requestId, detailed = false) {
  const data = detailed ? snapshot : { status: snapshot.status, buildVersion: snapshot.buildVersion, timestamp: snapshot.timestamp };
  return new Response(JSON.stringify({ success: snapshot.status !== "error", data, meta: { requestId }, error: snapshot.status === "error" ? { code: "APP_NOT_READY", message: "JARVIS is not ready." } : null }), { status: snapshot.status === "error" ? 503 : 200, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}
