const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

function integer(value, fallback, minimum, maximum) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, minimum), maximum) : fallback;
}

export function readOpenAIConfig(env = {}) {
  return Object.freeze({
    provider: String(env.AI_PROVIDER || "").toLowerCase(),
    mode: String(env.AI_MODE || "mock").toLowerCase(),
    apiKey: String(env.OPENAI_API_KEY || ""),
    model: String(env.OPENAI_MODEL || ""),
    baseURL: String(env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, ""),
    store: TRUE_VALUES.has(String(env.OPENAI_STORE_RESPONSES || "false").toLowerCase()),
    maxOutputTokens: integer(env.OPENAI_MAX_OUTPUT_TOKENS, 1200, 200, 8000),
    maxToolCalls: integer(env.OPENAI_MAX_TOOL_CALLS, 6, 1, 12),
    maxIterations: integer(env.OPENAI_MAX_ITERATIONS, 4, 1, 8),
    requestTimeoutMs: integer(env.OPENAI_REQUEST_TIMEOUT_MS, 20000, 3000, 120000),
    reasoningEffort: String(env.OPENAI_REASONING_EFFORT || "low").toLowerCase(),
    streamingEnabled: TRUE_VALUES.has(String(env.OPENAI_STREAMING_ENABLED || "false").toLowerCase()),
    maxToolResultBytes: integer(env.OPENAI_MAX_TOOL_RESULT_BYTES, 24000, 2000, 100000),
    requestsPerMinute: integer(env.OPENAI_REQUESTS_PER_MINUTE, 12, 1, 120),
    maxConversationRequests: integer(env.OPENAI_MAX_CONVERSATION_REQUESTS, 100, 1, 1000),
  });
}

export function validateOpenAIConfig(config) {
  const errors = [];
  if (config.mode !== "live") errors.push("AI_MODE must be live");
  if (config.provider !== "openai") errors.push("AI_PROVIDER must be openai");
  if (!config.apiKey) errors.push("OPENAI_API_KEY is required");
  if (!config.model) errors.push("OPENAI_MODEL is required");
  if (!/^https:\/\/[^\s]+$/i.test(config.baseURL)) errors.push("OPENAI_BASE_URL must use HTTPS");
  return { valid: errors.length === 0, errors };
}
