import { SUPPORTED_SYMBOLS, SUPPORTED_TIMEFRAMES } from "../market-data/registries.js";

const symbols = [...SUPPORTED_SYMBOLS];
const timeframes = [...SUPPORTED_TIMEFRAMES];
const safeId = { type: "string", pattern: "^[A-Za-z0-9_-]{1,80}$" };
const symbol = { type: "string", enum: symbols };
const timeframe = { type: "string", enum: timeframes };
const empty = { type: "object", properties: {}, required: [], additionalProperties: false };

export const OPENAI_TOOL_MAP = Object.freeze({
  market_get_status: { internal: "market.getStatus", schema: empty },
  market_get_quote: { internal: "market.getQuote", schema: object({ symbol }, ["symbol"]) },
  market_get_candles: { internal: "market.getCandles", schema: object({ symbol, timeframe, limit: { type: "integer", minimum: 20, maximum: 500 } }, ["symbol", "timeframe", "limit"]) },
  analysis_get_structured_analysis: { internal: "analysis.getStructuredAnalysis", schema: empty },
  scanner_get_latest_results: { internal: "scanner.getLatestResults", schema: empty },
  scanner_get_opportunity: { internal: "scanner.getOpportunity", schema: object({ symbol }, ["symbol"]) },
  scanner_run_scan: { internal: "scanner.runScan", schema: object({ symbols: { type: "array", items: symbol, maxItems: 5 }, minimumScore: { type: "integer", minimum: 0, maximum: 100 } }, ["symbols", "minimumScore"]) },
  macro_get_status: { internal: "macro.getStatus", schema: empty },
  macro_get_events: { internal: "macro.getEvents", schema: object({ currency: { type: ["string", "null"], maxLength: 8 }, impact: { type: ["string", "null"], enum: ["high", "medium", "low", null] } }, ["currency", "impact"]) },
  macro_get_summary: { internal: "macro.getSummary", schema: empty },
  news_get_status: { internal: "news.getStatus", schema: empty },
  news_get_articles: { internal: "news.getArticles", schema: object({ symbol: { ...symbol, type: ["string", "null"] }, limit: { type: "integer", minimum: 1, maximum: 10 } }, ["symbol", "limit"]) },
  news_get_summary: { internal: "news.getSummary", schema: empty },
  planner_get_context: { internal: "planner.getPlan", schema: empty },
  planner_validate_plan: { internal: "planner.validatePlan", schema: empty },
  upload_get_chart_context: { internal: "upload.getChartContext", schema: object({ uploadedChartId: { ...safeId, type: ["string", "null"] } }, ["uploadedChartId"]) },
});

function object(properties, required) { return { type: "object", properties, required, additionalProperties: false }; }

export function toOpenAITools(registry, allowedInternalNames) {
  const allowed = new Set(allowedInternalNames);
  return Object.entries(OPENAI_TOOL_MAP).filter(([, item]) => allowed.has(item.internal) && registry.get(item.internal)?.enabled).map(([name, item]) => ({
    type: "function",
    name,
    description: registry.get(item.internal).description,
    parameters: item.schema,
    strict: true,
  }));
}

export function resolveOpenAITool(name) { return OPENAI_TOOL_MAP[name] || null; }

export function validateToolArguments(name, input) {
  const definition = resolveOpenAITool(name);
  if (!definition) return { valid: false, error: "Tool is not allowlisted." };
  const schema = definition.schema;
  if (!input || typeof input !== "object" || Array.isArray(input)) return { valid: false, error: "Tool arguments must be an object." };
  if (Object.keys(input).some((key) => !Object.hasOwn(schema.properties, key))) return { valid: false, error: "Unexpected tool argument." };
  if (schema.required.some((key) => !(key in input))) return { valid: false, error: "Required tool argument is missing." };
  if (input.symbol != null && !symbols.includes(input.symbol)) return { valid: false, error: "Unsupported symbol." };
  if (input.timeframe != null && !timeframes.includes(input.timeframe)) return { valid: false, error: "Unsupported timeframe." };
  if (input.limit != null && (!Number.isInteger(input.limit) || input.limit < 1 || input.limit > 500)) return { valid: false, error: "Invalid result limit." };
  if (input.symbols != null && (!Array.isArray(input.symbols) || input.symbols.some((item) => !symbols.includes(item)))) return { valid: false, error: "Unsupported scan symbol." };
  return { valid: true, value: input };
}
