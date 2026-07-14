export const INTENTS = Object.freeze(["general_conversation", "market_status", "market_analysis", "opportunity_search", "opportunity_detail", "macro_question", "news_question", "chart_analysis_question", "trade_planning", "risk_question", "platform_navigation", "clarification_required", "unsupported_request"]);
export const DECISION_STATUSES = Object.freeze(["Monitor", "Wait", "Confirmation Required", "Conditions Met", "No Valid Setup", "High Risk", "Data Required", "Chart Required", "Source Unavailable", "Preliminary"]);
export const BIASES = Object.freeze(["bullish", "bearish", "neutral", "mixed", "range", null]);
export const JARVIS_ANSWER_SCHEMA = Object.freeze({
  type: "object",
  properties: {
    headline: { type: "string", maxLength: 160 },
    summary: { type: "string", maxLength: 1200 },
    marketBias: { type: ["string", "null"], enum: ["bullish", "bearish", "neutral", "mixed", "range", null] },
    decisionStatus: { type: "string", enum: [...DECISION_STATUSES] },
    mainFactors: { type: "array", items: { type: "string", maxLength: 240 }, maxItems: 6 },
    mainRisks: { type: "array", items: { type: "string", maxLength: 240 }, maxItems: 6 },
    nextConfirmation: { type: "string", maxLength: 400 },
    riskWarning: { type: "string", maxLength: 400 },
  },
  required: ["headline", "summary", "marketBias", "decisionStatus", "mainFactors", "mainRisks", "nextConfirmation", "riskWarning"],
  additionalProperties: false,
});
export function validateConversationRequest(input) {
  const errors = []; if (!input || typeof input.message !== "string" || !input.message.trim()) errors.push("Message is required"); if (String(input?.message || "").length > 2000) errors.push("Message is too long");
  if (input?.conversationId && !/^[a-zA-Z0-9_-]{1,80}$/.test(input.conversationId)) errors.push("Conversation ID is invalid");
  return { valid: errors.length === 0, errors, value: { conversationId: input?.conversationId || null, userId: input?.userId || null, message: String(input?.message || "").trim(), language: input?.language || null, activePage: input?.activePage || "ask_jarvis", context: sanitizeContext(input?.context || {}) } };
}
export function sanitizeContext(context) { const allowed = ["selectedAsset", "selectedTimeframe", "selectedOpportunityId", "selectedNewsId", "selectedMacroEventId", "selectedTradePlanId", "uploadedChartId", "analysisSummary", "marketBias", "riskContext", "chartContext", "tradePlanContext"]; return Object.fromEntries(allowed.filter((key) => context[key] != null).map((key) => [key, typeof context[key] === "string" ? context[key].slice(0, 500) : context[key]])); }
export function validateConversationResponse(response) { return { valid: Boolean(response && response.conversationId && INTENTS.every ? Array.isArray(response.intent) && response.intent.every((item) => INTENTS.includes(item)) && DECISION_STATUSES.includes(response.answer?.decisionStatus) && BIASES.includes(response.answer?.marketBias ?? null) && typeof response.answer?.summary === "string" : false) }; }
export function validateAnswer(answer) {
  const valid = Boolean(answer && typeof answer.headline === "string" && typeof answer.summary === "string" && BIASES.includes(answer.marketBias ?? null) && DECISION_STATUSES.includes(answer.decisionStatus) && Array.isArray(answer.mainFactors) && Array.isArray(answer.mainRisks) && typeof answer.nextConfirmation === "string" && typeof answer.riskWarning === "string");
  return { valid, errors: valid ? [] : ["Structured JARVIS answer is invalid"] };
}
