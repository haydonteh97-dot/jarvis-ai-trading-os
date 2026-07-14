import { getMarketDataService } from "../market-data/router.js";
import { scannerServiceFor } from "../scanner/service.js";
import { createMacroEngine } from "../macro/service.js";
import { createNewsEngine } from "../news/service.js";
import { sanitizeToolOutput } from "./safety.js";
const DEFINITIONS = [
  ["market.getStatus", "Returns market-data provider status."], ["market.getQuote", "Returns a normalized quote."], ["market.getCandles", "Returns normalized OHLC candles."],
  ["analysis.getStructuredAnalysis", "Returns existing deterministic analysis context."], ["scanner.getLatestResults", "Returns the latest deterministic scan."], ["scanner.getOpportunity", "Returns one latest opportunity."], ["scanner.runScan", "Runs the existing deterministic scanner for supported symbols."],
  ["macro.getStatus", "Returns macro source status."], ["macro.getEvents", "Returns normalized macro events."], ["macro.getSummary", "Returns deterministic macro context."],
  ["news.getStatus", "Returns news source status."], ["news.getArticles", "Returns normalized news articles."], ["news.getArticle", "Returns one news article."], ["news.getSummary", "Returns deterministic news context."],
  ["planner.getPlan", "Returns user-supplied trade-plan context."], ["planner.validatePlan", "Checks whether required plan fields exist."], ["upload.getChartContext", "Returns user-supplied chart context."], ["risk.getContext", "Combines deterministic risk availability."],
];
export class ToolRegistry {
  constructor({ env = {} } = {}) { this.env = env; this.tools = new Map(); this.registerDefaults(); }
  register(definition, handler) { if (definition.permission !== "read") throw new Error("Only read tools are allowed"); this.tools.set(definition.name, { ...definition, handler }); }
  registerDefaults() { for (const [name, description] of DEFINITIONS) this.register({ name, description, inputSchema: {}, outputSchema: {}, requiresUserConfirmation: false, deterministic: true, timeoutMs: 8000, permission: "read", dataRequirements: [], enabled: true, mayIncludeStaleData: true }, (input, context) => this.executeDefault(name, input, context)); }
  list() { return [...this.tools.values()].map(({ handler, ...definition }) => definition); }
  get(name) { return this.tools.get(name) || null; }
  async execute(name, input = {}, context = {}) { const tool = this.get(name); if (!tool?.enabled) return failed(name, "TOOL_UNAVAILABLE", "The requested tool is currently unavailable."); let timeoutId; const timeout = new Promise((_, reject) => { timeoutId = setTimeout(() => reject(Object.assign(new Error(), { code: "TOOL_TIMEOUT" })), tool.timeoutMs); }); try { const result = await Promise.race([tool.handler(input, context), timeout]); return { success: true, tool: name, data: sanitizeToolOutput(result.data), meta: { source: result.source || name.split(".")[0], dataStatus: result.dataStatus || "unavailable", freshness: result.freshness || "unavailable", timestamp: result.timestamp || null, cached: Boolean(result.cached) }, error: null }; } catch (error) { return failed(name, error.code || "TOOL_FAILED", "The requested tool is currently unavailable."); } finally { clearTimeout(timeoutId); } }
  async executeDefault(name, input, context) {
    const market = () => getMarketDataService(this.env); const macro = () => createMacroEngine(this.env); const news = () => createNewsEngine(this.env);
    if (name === "market.getStatus") { const data = market().getStatus(); return wrap(data, data.provider || "Market Data", data.dataStatus); }
    if (name === "market.getQuote") { const response = await market().getQuote(input.symbol); return wrap(response.value, response.value.provider, response.value.dataStatus, response.value.freshness, response.value.timestamp, response.cached); }
    if (name === "market.getCandles") { const response = await market().getCandles(input.symbol, input.timeframe, input.limit || 200); return wrap(response.value, response.value.provider, response.value.dataStatus, response.value.freshness, response.value.lastUpdated, response.cached); }
    if (name === "scanner.getLatestResults" || name === "scanner.getOpportunity") { const latest = scannerServiceFor(this.env).getLatest(); const data = name.endsWith("Opportunity") ? latest?.results?.find((item) => item.symbol === input.symbol) || null : latest; return wrap(data, "Opportunity Scanner", latest?.dataQuality?.toLowerCase() || "unavailable", latest?.dataFreshness || "unavailable", latest?.completedAt || null); }
    if (name === "scanner.runScan") { const data = await scannerServiceFor(this.env).runScan({ symbols: input.symbols, minimumScore: input.minimumScore, mode: "Filtered Scan" }); return wrap(data, "Opportunity Scanner", data.dataQuality?.toLowerCase() || "unavailable", data.dataFreshness || "unavailable", data.completedAt || null, data.cached); }
    if (name === "macro.getStatus") { const data = macro().getStatus(); return wrap(data, data.provider || "Macro Source", data.dataStatus); }
    if (name === "macro.getEvents") { const response = await macro().getEvents({ currency: input.currency || undefined, impact: input.impact || undefined }); return wrap(response.events, macro().getStatus().provider || "Macro Source", macro().getStatus().dataStatus, "unavailable", null, response.cached); }
    if (name === "macro.getSummary") { const data = await macro().getSummary(); return wrap(data, data.provider || "Macro Source", data.dataStatus, "unavailable", null, data.cached); }
    if (name === "news.getStatus") { const data = news().getStatus(); return wrap(data, data.provider || "News Source", data.dataStatus); }
    if (name === "news.getArticles") { const response = await news().getArticles({ asset: input.symbol || undefined, limit: input.limit || 5 }); return wrap(response.articles, news().getStatus().provider || "News Source", news().getStatus().dataStatus, "unavailable", null, response.cached); }
    if (name === "news.getArticle") { const data = await news().getArticleById(input.articleId); return wrap(data, data?.sourceName || "News Source", data?.dataStatus || "unavailable", "unavailable", data?.publishedAt || null); }
    if (name === "news.getSummary") { const data = await news().getSummary(); return wrap(data, news().getStatus().provider || "News Source", data.dataStatus, "unavailable", data.lastUpdated, data.cached); }
    if (name === "analysis.getStructuredAnalysis") return wrap(context.analysisSummary || null, "User Handoff", context.analysisSummary ? "preliminary" : "unavailable");
    if (name === "planner.getPlan") return wrap(context.tradePlanContext || null, "User Context", context.tradePlanContext ? "preliminary" : "unavailable");
    if (name === "planner.validatePlan") { const plan = context.tradePlanContext; const complete = Boolean(plan?.entry && plan?.stopLoss && plan?.risk); return wrap({ valid: complete, missing: complete ? [] : ["entry", "stopLoss", "risk"] }, "Trade Planner", complete ? "preliminary" : "unavailable"); }
    if (name === "upload.getChartContext") return wrap(context.chartContext || null, "User Upload", context.chartContext ? "preliminary" : "unavailable");
    if (name === "risk.getContext") return wrap({ macro: context.macroRisk || "Unavailable", news: context.newsRisk || "Unavailable", account: context.accountRisk || "Unavailable" }, "JARVIS Risk", "partial");
    return wrap(null, name, "unavailable");
  }
}
function wrap(data, source, dataStatus = "unavailable", freshness = "unavailable", timestamp = null, cached = false) { return { data, source, dataStatus: String(dataStatus || "unavailable").toLowerCase(), freshness, timestamp, cached }; }
function failed(tool, code, message) { return { success: false, tool, data: null, meta: { source: tool.split(".")[0], dataStatus: "unavailable", freshness: "unavailable", timestamp: null, cached: false }, error: { code, message } }; }
