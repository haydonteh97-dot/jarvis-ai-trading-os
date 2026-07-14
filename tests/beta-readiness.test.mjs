import assert from "node:assert/strict";
import test from "node:test";
import { createPlatformApplication } from "../server/platform/app.js";
import { validateEnvironment } from "../server/platform/env.js";
import { MemoryAuditTrail, redact } from "../server/platform/observability.js";
import { OpenAIVisionProvider } from "../server/vision/openai-vision-provider.js";

const baseEnv = {
  APP_BASE_URL: "https://jarvis.test",
  BUILD_VERSION: "beta-test",
  BETA_MODE: "true",
  BETA_ALLOWED_EMAILS: "beta@example.com",
  BETA_INVITE_CODES: "invite-code-test",
  BETA_MAX_USERS: "2",
  MARKET_DATA_MODE: "mock",
  MACRO_DATA_MODE: "mock",
  NEWS_DATA_MODE: "mock",
  AI_MODE: "mock",
  VISION_MODE: "mock",
};

const auth = `Basic ${Buffer.from("beta@example.com:invite-code-test").toString("base64")}`;
const silentLogger = { request() {}, error() {}, warn() {} };
const request = (path, options = {}) => new Request(`https://jarvis.test${path}`, { ...options, headers: { authorization: auth, ...(options.headers || {}) } });

function application(env = {}, options = {}) {
  return createPlatformApplication({ env: { ...baseEnv, ...env }, logger: silentLogger, staticHandler: async (req) => new Response(new URL(req.url).pathname === "/" ? "JARVIS" : "static", { status: 200 }), ...options });
}

test("environment validation fails closed for incomplete Beta access", () => {
  const result = validateEnvironment({ BETA_MODE: "true", APP_BASE_URL: "https://jarvis.test" });
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors.sort(), ["BETA_ALLOWED_EMAILS is required when BETA_MODE=true", "BETA_INVITE_CODES is required when BETA_MODE=true"].sort());
});

test("missing optional providers do not crash base app", () => {
  const result = validateEnvironment({ BETA_MODE: "false", APP_BASE_URL: "https://jarvis.test", MARKET_DATA_MODE: "live", AI_MODE: "live", VISION_MODE: "live" });
  assert.equal(result.valid, true);
  assert.ok(result.warnings.length >= 3);
});

test("Beta access allows configured identity and binds server user reference", async () => {
  const app = application();
  const response = await app.handle(request("/api/jarvis/conversations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId: "spoofed" }) }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.match(body.data.userId, /^beta_[a-f0-9]{16}$/);
  assert.notEqual(body.data.userId, "spoofed");
});

test("Beta access denies missing or invalid credentials without user enumeration", async () => {
  const app = application();
  for (const authorization of [null, `Basic ${Buffer.from("other@example.com:wrong").toString("base64")}`]) {
    const response = await app.handle(new Request("https://jarvis.test/api/market/status", { headers: authorization ? { authorization } : {} }));
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error.message, "Closed Beta access is required.");
  }
});

test("frontend Demo password cannot bypass the server gate", async () => {
  const app = application();
  const response = await app.handle(new Request("https://jarvis.test/api/jarvis/message", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: "apex", message: "Hello" }) }));
  assert.equal(response.status, 401);
});

test("health and status routes expose safe readiness without authentication", async () => {
  const app = application();
  const health = await app.handle(new Request("https://jarvis.test/health"));
  const status = await app.handle(new Request("https://jarvis.test/api/status"));
  assert.equal(health.status, 200);
  assert.equal(status.status, 200);
  const body = await status.json();
  assert.equal(body.data.components.authentication, "ready");
  assert.equal(JSON.stringify(body).includes("invite-code-test"), false);
});

test("every response receives a safe request ID and security headers", async () => {
  const response = await application().handle(request("/api/market/status", { headers: { "x-request-id": "request-test-123" } }));
  assert.equal(response.headers.get("x-request-id"), "request-test-123");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.match(response.headers.get("content-security-policy"), /default-src 'self'/);
});

test("oversized general and Vision requests are rejected before routing", async () => {
  const app = application({ API_MAX_BODY_BYTES: "16384" });
  const general = await app.handle(request("/api/jarvis/message", { method: "POST", headers: { "content-length": "20000", "content-type": "application/json" }, body: "{}" }));
  const vision = await app.handle(request("/api/vision/uploads", { method: "POST", headers: { "content-length": String(12 * 1024 * 1024), "content-type": "multipart/form-data; boundary=x" }, body: "x" }));
  assert.equal(general.status, 413);
  assert.equal(vision.status, 413);
});

test("malformed JSON maps to a safe client error", async () => {
  const response = await application().handle(request("/api/jarvis/message", { method: "POST", headers: { "content-type": "application/json" }, body: "{" }));
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, "INVALID_REQUEST");
});

test("general and route-specific server limits reject excess traffic", async () => {
  const app = application({ API_REQUESTS_PER_MINUTE: "10", BETA_MARKET_REQUESTS_PER_MINUTE: "1" });
  assert.equal((await app.handle(request("/api/market/status"))).status, 200);
  const limited = await app.handle(request("/api/market/status"));
  assert.equal(limited.status, 429);
  assert.equal((await limited.json()).error.code, "RATE_LIMITED");
});

test("JARVIS and Vision route limits are independently configurable", async () => {
  const jarvis = application({ BETA_JARVIS_REQUESTS_PER_MINUTE: "1" });
  const body = JSON.stringify({ message: "Hello" });
  assert.equal((await jarvis.handle(request("/api/jarvis/message", { method: "POST", headers: { "content-type": "application/json" }, body }))).status, 200);
  assert.equal((await jarvis.handle(request("/api/jarvis/message", { method: "POST", headers: { "content-type": "application/json" }, body }))).status, 429);
  const vision = application({ BETA_VISION_ANALYSES_PER_MINUTE: "1" });
  assert.notEqual((await vision.handle(request("/api/vision/analysis", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }))).status, 429);
  assert.equal((await vision.handle(request("/api/vision/analysis", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }))).status, 429);
});

test("quota remains a distinct safe Vision error without fallback", () => {
  const provider = new OpenAIVisionProvider({ env: { OPENAI_API_KEY: "test-key", OPENAI_BASE_URL: "https://api.openai.com/v1", OPENAI_VISION_MODEL: "configured-model" }, client: {} });
  const mapped = provider.mapProviderError({ status: 429, code: "insufficient_quota" });
  assert.equal(mapped.code, "VISION_QUOTA_EXCEEDED");
});

test("audit logging records access and sensitive fields are redacted", async () => {
  const audit = new MemoryAuditTrail();
  const app = application({}, { audit });
  await app.handle(request("/api/jarvis/message", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: "Hello" }) }));
  assert.ok(audit.list().some((entry) => entry.event === "beta_access_allowed"));
  assert.ok(audit.list().some((entry) => entry.event === "jarvis_request"));
  assert.deepEqual(redact({ apiKey: "secret", nested: { inviteCode: "secret" } }), { apiKey: "[REDACTED]", nested: { inviteCode: "[REDACTED]" } });
});

test("feedback endpoint validates and stores only bounded structured feedback", async () => {
  const app = application();
  const valid = await app.handle(request("/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ page: "scanner", module: "opportunity-scanner", rating: 4, comment: "Useful." }) }));
  assert.equal(valid.status, 201);
  const invalid = await app.handle(request("/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ page: "scanner", rating: 9 }) }));
  assert.equal(invalid.status, 400);
});

test("CORS is allowlisted and unsupported methods are rejected", async () => {
  const app = application();
  const denied = await app.handle(request("/api/market/status", { headers: { origin: "https://evil.example" } }));
  assert.equal(denied.status, 403);
  const method = await app.handle(request("/api/market/status", { method: "PATCH" }));
  assert.equal(method.status, 405);
});

test("MT5, broker and execution routes do not exist", async () => {
  const app = application();
  for (const path of ["/api/mt5/status", "/api/broker/account", "/api/execution/order"]) assert.equal((await app.handle(request(path))).status, 404);
});

test("memory persistence limitations are reported honestly", async () => {
  const body = await (await application().handle(new Request("https://jarvis.test/api/status"))).json();
  assert.equal(body.data.components.storage, "partial");
  assert.ok(body.data.limitations.some((item) => /lost on restart/i.test(item)));
});
