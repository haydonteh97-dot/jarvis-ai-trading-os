const RULES = [
  ["unsupported_request", /place order|execute trade|open position|close position|buy for me|sell for me|下单|自动交易|帮我买|帮我卖/i],
  ["platform_navigation", /open|navigate|go to|打开|前往|页面/i],
  ["chart_analysis_question", /chart|screenshot|图表|截图/i],
  ["opportunity_search", /find opportunit|scanner|机会|扫描/i],
  ["opportunity_detail", /this opportunit|setup score|这个机会|设置分数/i],
  ["macro_question", /cpi|nfp|fomc|gdp|pmi|macro|inflation|employment|宏观|通胀|非农/i],
  ["news_question", /news|headline|fed news|新闻|消息/i],
  ["trade_planning", /lot size|position size|entry|stop loss|take profit|trade plan|手数|仓位|止损|止盈|交易计划/i],
  ["risk_question", /risk|safe|danger|can i buy|can i sell|风险|安全吗|能买吗|卖吗/i],
  ["market_status", /price|quote|current price|market status|价格|报价/i],
  ["market_analysis", /analyse|analyze|trend|structure|affecting|buy|sell|分析|趋势|结构/i],
];
export function detectLanguage(message) { return /[\u3400-\u9fff]/.test(message) ? "zh" : "en"; }
export function classifyIntent(message, context = {}) { const found = RULES.filter(([, regex]) => regex.test(message)).map(([intent]) => intent); if (!found.length) return ["general_conversation"]; if (found.includes("unsupported_request")) return ["unsupported_request"]; if ((found.includes("market_analysis") || found.includes("risk_question")) && !resolveAssetHint(message, context)) return ["clarification_required"]; return [...new Set(found)]; }
function resolveAssetHint(message, context) { return /gold|xau|bitcoin|btc|eurusd|gbpusd|usdjpy|黄金|比特币/i.test(message) || context.selectedAsset; }
