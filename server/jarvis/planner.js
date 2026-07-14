export function planToolCalls(intents, entities, context = {}) {
  const tools = [];
  const add = (name, input = {}) => { if (!tools.some((item) => item.name === name)) tools.push({ name, input }); };
  if (intents.includes("market_status")) add("market.getQuote", { symbol: entities.asset });
  if (intents.includes("market_analysis")) { add("market.getStatus"); add("market.getQuote", { symbol: entities.asset }); if (entities.timeframe) add("market.getCandles", { symbol: entities.asset, timeframe: entities.timeframe }); add("analysis.getStructuredAnalysis"); add("scanner.getOpportunity", { symbol: entities.asset }); }
  if (intents.includes("opportunity_search")) add("scanner.getLatestResults");
  if (intents.includes("opportunity_detail")) add("scanner.getOpportunity", { symbol: entities.asset });
  if (intents.includes("macro_question")) entities.eventId ? add("macro.getEvents") : add("macro.getSummary");
  if (intents.includes("news_question")) entities.articleId ? add("news.getArticle", { articleId: entities.articleId }) : add("news.getSummary");
  if (intents.includes("chart_analysis_question")) add("upload.getChartContext");
  if (intents.includes("trade_planning")) { add("planner.getPlan"); add("planner.validatePlan"); }
  if (intents.includes("risk_question")) add("risk.getContext");
  if ((intents.includes("market_analysis") || intents.includes("risk_question")) && !intents.includes("macro_question")) add("macro.getSummary");
  if ((intents.includes("market_analysis") || intents.includes("risk_question")) && !intents.includes("news_question")) add("news.getSummary");
  return tools.slice(0, Number(context.maximumToolCalls || 8));
}
