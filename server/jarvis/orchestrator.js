import { MockAIModelProvider } from "./mock-provider.js";
import { LiveAIModelProvider } from "./provider.js";
import { OpenAIResponsesProvider } from "./openai-provider.js";
import { validateConversationRequest, validateConversationResponse } from "./contracts.js";
import { classifyIntent, detectLanguage } from "./intent.js";
import { resolveEntities } from "./entities.js";
import { ConversationStore } from "./context.js";
import { ToolRegistry } from "./tools.js";
import { planToolCalls } from "./planner.js";
import { calculateDataQuality, containsProhibitedAction, containsPromptInjection } from "./safety.js";
import { RequestRateLimiter } from "./rate-limit.js";

export class JarvisCoreOrchestrator {
  constructor({ env = {}, provider, registry, store = new ConversationStore(), rateLimiter } = {}) { this.env = env; this.mode = String(env.AI_MODE || "mock").toLowerCase(); this.registry = registry || new ToolRegistry({ env }); this.provider = provider || this.createProvider(env); this.store = store; this.maximumToolCalls = Math.min(Math.max(Number(env.OPENAI_MAX_TOOL_CALLS || env.AI_MAX_TOOL_CALLS || 6), 1), 12); this.rateLimiter = rateLimiter || new RequestRateLimiter({ requestsPerMinute: Number(env.OPENAI_REQUESTS_PER_MINUTE || 12), maximumConversationRequests: Number(env.OPENAI_MAX_CONVERSATION_REQUESTS || 100) }); }
  createProvider(env) { if (this.mode === "mock") return new MockAIModelProvider(); if (String(env.AI_PROVIDER || "").toLowerCase() === "openai") return new OpenAIResponsesProvider({ env, registry: this.registry, logger: console }); return new LiveAIModelProvider({ providerName: env.AI_PROVIDER || null }); }
  getStatus() { const provider = this.provider.getProviderStatus(); return { status: provider.status === "demo" ? "demo" : provider.status, aiProvider: provider.provider, aiMode: provider.mode, availableTools: this.registry.list().filter((tool) => tool.enabled).map((tool) => tool.name), unavailableTools: this.registry.list().filter((tool) => !tool.enabled).map((tool) => tool.name), visionStatus: "not_connected", mt5Status: "not_connected", message: provider.message }; }
  async verifyStatus() { if (this.mode === "live") await this.provider.verifyConnection(); return { ...this.getStatus(), ...this.provider.getProviderStatus(), availableTools: this.getStatus().availableTools, unavailableTools: this.getStatus().unavailableTools, visionStatus: "not_connected", mt5Status: "not_connected" }; }
  createConversation(input = {}) { return this.store.create(input); }
  getConversation(id) { return this.store.get(id); }
  async processMessage(input) {
    const validation = validateConversationRequest(input); if (!validation.valid) throw coded("INVALID_REQUEST", validation.errors.join("; "));
    const request = validation.value; const language = request.language || detectLanguage(request.message); const conversation = request.conversationId ? this.store.upsert(request.conversationId, { language, context: request.context }) : this.store.create({ language, context: request.context, userId: request.userId });
    this.rateLimiter.check(privacyKey(request.userId), conversation.id);
    const mergedContext = { ...conversation.context, ...request.context, language, maximumToolCalls: this.maximumToolCalls }; const intents = classifyIntent(request.message, mergedContext); const entities = resolveEntities(request.message, mergedContext);
    if (intents.includes("clarification_required")) return this.finalize(conversation, request, language, intents, entities, [], { headline: language === "zh" ? "需要确认市场" : "Market Clarification Required", summary: language === "zh" ? "请确认你要分析的资产，例如 XAUUSD、EURUSD 或 BTCUSD。" : "Please confirm the asset, such as XAUUSD, EURUSD or BTCUSD.", marketBias: null, decisionStatus: "Data Required", mainFactors: [], mainRisks: ["Asset unresolved"], nextConfirmation: language === "zh" ? "确认资产。" : "Confirm the asset.", riskWarning: language === "zh" ? "最终决定由你作出。" : "The final decision remains with you." });
    const prohibited = intents.includes("unsupported_request") || containsProhibitedAction(request.message) || containsPromptInjection(request.message); const plan = prohibited ? [] : planToolCalls(intents, entities, mergedContext); let toolResults = [];
    if (this.mode === "mock") for (const call of plan) toolResults.push(await this.registry.execute(call.name, call.input, mergedContext));
    const providerResult = await this.provider.createStructuredResponse({ requestId: `req_${crypto.randomUUID()}`, conversationId: conversation.id, language, message: request.message, intents, entities, toolResults, toolPlan: plan, allowedTools: plan.map((call) => call.name), context: mergedContext, prohibited, previousResponseId: conversation.providerState.previousResponseId, conversationMessages: conversation.messages, safetyIdentifier: privacyKey(request.userId) });
    const answer = providerResult?.answer || providerResult; toolResults = providerResult?.toolResults || toolResults;
    if (providerResult?.providerMeta) this.store.setProviderState(conversation.id, { previousResponseId: providerResult.providerMeta.previousResponseId, model: providerResult.providerMeta.model, usage: providerResult.providerMeta.usage, lastResponseId: providerResult.providerMeta.responseId });
    return this.finalize(conversation, request, language, intents, entities, toolResults, answer, providerResult?.providerMeta || null);
  }
  finalize(conversation, request, language, intents, entities, toolResults, answer, providerMeta = null) {
    const missingData = toolResults.filter((item) => !item.success || item.meta.dataStatus === "unavailable").map((item) => item.tool); const sources = toolResults.filter((item) => item.success).map((item) => ({ tool: item.tool, source: item.meta.source, timestamp: item.meta.timestamp, dataStatus: item.meta.dataStatus, freshness: item.meta.freshness }));
    const response = { conversationId: conversation.id, messageId: `msg_${crypto.randomUUID()}`, language, intent: intents, status: "completed", answer, toolResults, dataQuality: calculateDataQuality(toolResults), sources, missingData, followUpOptions: followUps(intents, missingData), providerMeta: providerMeta ? { model: providerMeta.model, responseId: providerMeta.responseId, usage: providerMeta.usage, toolCallCount: providerMeta.toolCallCount, durationMs: providerMeta.durationMs, stored: providerMeta.stored, streaming: providerMeta.streaming, statusEvents: providerMeta.statusEvents } : null, createdAt: new Date().toISOString() };
    if (!validateConversationResponse(response).valid) throw coded("INVALID_AI_RESPONSE", "JARVIS could not validate the structured response.");
    this.store.addMessage(conversation.id, { role: "user", text: request.message, createdAt: response.createdAt }); this.store.addMessage(conversation.id, { role: "jarvis", response, createdAt: response.createdAt }); conversation.context = { ...conversation.context, selectedAsset: entities.asset || conversation.context.selectedAsset, selectedTimeframe: entities.timeframe || conversation.context.selectedTimeframe }; conversation.lastToolResults = toolResults; conversation.missingData = missingData; return response;
  }
}
function followUps(intents, missing) { const options = []; if (intents.includes("market_analysis")) options.push("Open AI Analysis"); if (intents.some((item) => item.startsWith("opportunity"))) options.push("View Opportunity Scanner"); if (missing.some((item) => item.startsWith("macro"))) options.push("Review Macro Events"); if (missing.some((item) => item.startsWith("news"))) options.push("Review News Risk"); if (intents.includes("chart_analysis_question")) options.push("Upload Current Chart"); if (intents.includes("trade_planning")) options.push("Create Trade Plan"); return options.slice(0, 3); }
function coded(code, message) { const error = new Error(message); error.code = code; return error; }
function privacyKey(value) { const text = String(value || "anonymous"); let hash = 2166136261; for (let index = 0; index < text.length; index += 1) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619); return `usr_${(hash >>> 0).toString(16)}`; }
