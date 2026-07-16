import { createNewsEngine } from "./service.js";
const SAFE_ERRORS = { NEWS_DATA_NOT_CONFIGURED: [503, "Live news source not connected."], NEWS_DATA_AUTH_FAILED: [503, "News provider authentication failed."], NEWS_DATA_RATE_LIMITED: [429, "News updates are temporarily rate limited."], NEWS_DATA_TIMEOUT: [504, "News provider request timed out."], NEWS_DATA_UNAVAILABLE: [503, "Verified market news is temporarily unavailable."], INVALID_PROVIDER_RESPONSE: [502, "JARVIS could not verify the news response."], ARTICLE_NOT_FOUND: [404, "This news detail is currently unavailable."], CATEGORY_UNSUPPORTED: [400, "This news category is not supported."], INVALID_REQUEST: [400, "The news request is invalid."] };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
function envelope(data, engine, cached = false) { const status = engine.getStatus(); return { success: true, data, meta: { provider: status.provider, timestamp: new Date().toISOString(), dataStatus: status.dataStatus, cached }, error: null }; }
function failure(error, engine) { const code = error?.code || "NEWS_DATA_UNAVAILABLE"; const [status, message] = SAFE_ERRORS[code] || [503, "Verified market news is temporarily unavailable."]; return json({ success: false, data: null, meta: { provider: engine.getStatus().provider || null, timestamp: new Date().toISOString(), dataStatus: "unavailable", cached: false }, error: { code, message } }, status); }
export async function handleNewsApiRequest(request, env = {}) {
  const url = new URL(request.url); if (!url.pathname.startsWith("/api/news/")) return null; const engine = createNewsEngine(env);
  if (request.method !== "GET") return failure(Object.assign(new Error(), { code: "INVALID_REQUEST" }), engine);
  try {
    if (url.pathname === "/api/news/status") return json(envelope(engine.getStatus(), engine));
    const filters = Object.fromEntries(["category", "impact", "source", "asset", "start", "end", "latest", "breaking", "limit", "cursor", "page"].map((key) => [key, url.searchParams.get(key)]).filter(([, value]) => value));
    if (url.pathname === "/api/news/articles") { const result = await engine.getArticles(filters); return json(envelope({ articles: result.articles }, engine, result.cached)); }
    if (url.pathname === "/api/news/top-stories") { const result = await engine.getTopStories(filters); return json(envelope({ articles: result.articles }, engine, result.cached)); }
    if (url.pathname === "/api/news/breaking") { const result = await engine.getBreaking(filters); return json(envelope({ articles: result.articles }, engine, result.cached)); }
    if (url.pathname === "/api/news/summary") { const result = await engine.getSummary(filters); return json(envelope(result, engine, result.cached)); }
    const match = url.pathname.match(/^\/api\/news\/articles\/([^/]+)$/); if (match) { const article = await engine.getArticleById(decodeURIComponent(match[1])); if (!article) throw Object.assign(new Error(), { code: "ARTICLE_NOT_FOUND" }); return json(envelope(article, engine)); }
    return failure(Object.assign(new Error(), { code: "INVALID_REQUEST" }), engine);
  } catch (error) { return failure(error, engine); }
}
