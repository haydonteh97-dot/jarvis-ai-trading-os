import { createMacroEngine } from "./service.js";

const SAFE_ERRORS = {
  MACRO_DATA_NOT_CONFIGURED: [503, "Verified macro source not connected."],
  EVENT_NOT_FOUND: [404, "The requested macro event is unavailable."],
  INVALID_DATE_RANGE: [400, "The requested date range is invalid."],
  INVALID_REQUEST: [400, "The macro-data request is invalid."],
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}

function envelope(data, engine, cached = false) {
  const providerStatus = engine.getStatus();
  return { success: true, data, meta: { provider: providerStatus.provider, timestamp: new Date().toISOString(), dataStatus: providerStatus.dataStatus, cached }, error: null };
}

function failure(error, engine) {
  const code = error?.code || "MACRO_DATA_UNAVAILABLE";
  const [status, message] = SAFE_ERRORS[code] || [503, "Verified macro data is temporarily unavailable."];
  return json({ success: false, data: null, meta: { provider: engine.getStatus().provider || null, timestamp: new Date().toISOString(), dataStatus: "unavailable", cached: false }, error: { code, message } }, status);
}

export async function handleMacroApiRequest(request, env = {}) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/macro/")) return null;
  if (request.method !== "GET") return json({ success: false, error: { code: "INVALID_REQUEST", message: "Method not allowed." } }, 405);
  const engine = createMacroEngine(env);
  try {
    if (url.pathname === "/api/macro/status") return json(envelope(engine.getStatus(), engine));
    const filters = Object.fromEntries(["start", "end", "currency", "impact", "category", "timezone"].map((key) => [key, url.searchParams.get(key)]).filter(([, value]) => value));
    if (url.pathname === "/api/macro/events") {
      const result = await engine.getEvents(filters);
      return json(envelope({ events: result.events }, engine, result.cached));
    }
    if (url.pathname === "/api/macro/summary") {
      const result = await engine.getSummary(filters);
      return json(envelope(result, engine, result.cached));
    }
    const match = url.pathname.match(/^\/api\/macro\/event\/([^/]+)$/);
    if (match) {
      const event = await engine.getEventById(decodeURIComponent(match[1]));
      if (!event) { const error = new Error(); error.code = "EVENT_NOT_FOUND"; throw error; }
      return json(envelope(event, engine));
    }
    return json({ success: false, error: { code: "INVALID_REQUEST", message: "Macro route not found." } }, 404);
  } catch (error) {
    return failure(error, engine);
  }
}
