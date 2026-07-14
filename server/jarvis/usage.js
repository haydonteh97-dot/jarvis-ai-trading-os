export class AIUsageTracker {
  constructor({ maximumRecords = 500 } = {}) { this.maximumRecords = maximumRecords; this.records = []; }
  record(entry) { this.records = [...this.records, { ...entry }].slice(-this.maximumRecords); }
  aggregate() { return this.records.reduce((total, item) => ({ requests: total.requests + 1, inputTokens: total.inputTokens + (item.inputTokens || 0), outputTokens: total.outputTokens + (item.outputTokens || 0), cachedInputTokens: total.cachedInputTokens + (item.cachedInputTokens || 0), reasoningTokens: total.reasoningTokens + (item.reasoningTokens || 0), toolCalls: total.toolCalls + (item.toolCalls || 0) }), { requests: 0, inputTokens: 0, outputTokens: 0, cachedInputTokens: 0, reasoningTokens: 0, toolCalls: 0 }); }
}

export function safeAIEvent(logger, event) {
  if (!logger || typeof logger.info !== "function") return;
  logger.info("jarvis_ai", {
    requestId: event.requestId || null,
    conversationId: event.conversationId || null,
    userKey: event.userKey || null,
    model: event.model || null,
    providerResponseId: event.providerResponseId || null,
    intent: event.intent || null,
    tools: event.tools || [],
    durationMs: event.durationMs || null,
    usage: event.usage || null,
    dataQuality: event.dataQuality || null,
    status: event.status || "unknown",
  });
}
