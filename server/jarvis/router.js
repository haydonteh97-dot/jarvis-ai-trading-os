import { JarvisCoreOrchestrator } from "./orchestrator.js";
const engines = new Map();
const ERRORS = {
  AI_PROVIDER_NOT_CONFIGURED: [503, "AI provider is not configured."], AI_AUTH_FAILED: [503, "OpenAI authentication failed."], AI_MODEL_UNAVAILABLE: [503, "The configured AI model is unavailable."], AI_RATE_LIMITED: [429, "JARVIS is temporarily rate limited."], AI_TIMEOUT: [504, "JARVIS response timed out."], AI_UNAVAILABLE: [503, "JARVIS AI is temporarily unavailable."], AI_INVALID_REQUEST: [400, "The AI request is invalid."], AI_INVALID_RESPONSE: [502, "JARVIS returned an invalid response."], AI_STRUCTURED_OUTPUT_FAILED: [502, "JARVIS could not validate the structured response."], AI_TOOL_SCHEMA_INVALID: [500, "A JARVIS tool is not configured correctly."], AI_TOOL_CALL_FAILED: [502, "A JARVIS tool could not complete the request."], AI_TOOL_UNAVAILABLE: [503, "A required JARVIS tool is unavailable."], AI_MAX_TOOL_CALLS_REACHED: [422, "JARVIS reached the safe tool-call limit."], AI_CONTEXT_EXPIRED: [409, "This JARVIS conversation has expired."], AI_CONVERSATION_NOT_FOUND: [404, "Conversation not found."], AI_STREAM_INTERRUPTED: [502, "JARVIS streaming was interrupted."],
  INVALID_AI_RESPONSE: [502, "JARVIS could not complete this analysis."], CONVERSATION_NOT_FOUND: [404, "Conversation not found."], INVALID_REQUEST: [400, "The request is invalid."], UNSUPPORTED_REQUEST: [400, "This request is not supported."],
};
function engineFor(env) { const key = `${env.AI_MODE || "mock"}:${env.AI_PROVIDER || ""}:${env.OPENAI_MODEL || ""}`; if (!engines.has(key)) engines.set(key, new JarvisCoreOrchestrator({ env })); return engines.get(key); }
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
function ok(data, engine) { const status = engine.getStatus(); return json({ success: true, data, meta: { provider: status.aiProvider, timestamp: new Date().toISOString(), dataStatus: status.aiMode === "mock" ? "demo" : status.status }, error: null }); }
function fail(error, engine) { const code = error?.code || "AI_PROVIDER_UNAVAILABLE"; const [status, message] = ERRORS[code] || [503, "JARVIS could not complete this analysis."]; return json({ success: false, data: null, meta: { provider: engine.getStatus().aiProvider || null, timestamp: new Date().toISOString(), dataStatus: "unavailable" }, error: { code, message } }, status); }
export async function handleJarvisApiRequest(request, env = {}) {
  const url = new URL(request.url); if (!url.pathname.startsWith("/api/jarvis/")) return null; const engine = engineFor(env); const authenticatedUser = request.headers.get("x-jarvis-user-ref");
  try {
    if (request.method === "GET" && url.pathname === "/api/jarvis/status") return ok(await engine.verifyStatus(), engine);
    if (request.method === "GET" && url.pathname === "/api/jarvis/tools") return ok({ tools: engine.registry.list().map(({ inputSchema, outputSchema, ...tool }) => tool) }, engine);
    if (request.method === "POST" && url.pathname === "/api/jarvis/conversations") { const body = await safeBody(request); return ok(engine.createConversation({ ...body, userId: authenticatedUser || body.userId || null }), engine); }
    const match = url.pathname.match(/^\/api\/jarvis\/conversations\/([^/]+)$/); if (request.method === "GET" && match) { const conversation = engine.getConversation(decodeURIComponent(match[1])); if (!conversation || authenticatedUser && conversation.userId !== authenticatedUser) throw Object.assign(new Error(), { code: "CONVERSATION_NOT_FOUND" }); return ok(conversation, engine); }
    if (request.method === "POST" && url.pathname === "/api/jarvis/message") { const body = await safeBody(request); if (authenticatedUser && body.conversationId) { const existing = engine.getConversation(body.conversationId); if (existing && existing.userId !== authenticatedUser) throw Object.assign(new Error(), { code: "CONVERSATION_NOT_FOUND" }); } return ok(await engine.processMessage({ ...body, userId: authenticatedUser || body.userId || null }), engine); }
    throw Object.assign(new Error(), { code: "INVALID_REQUEST" });
  } catch (error) { return fail(error, engine); }
}
async function safeBody(request) { try { return await request.json(); } catch { throw Object.assign(new Error(), { code: "INVALID_REQUEST" }); } }
export function clearJarvisEngines() { engines.clear(); }
