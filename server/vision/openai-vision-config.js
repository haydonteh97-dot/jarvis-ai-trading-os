import { readOpenAIConfig } from "../jarvis/openai-config.js";

const DETAILS = new Set(["low", "high", "original", "auto"]);

function integer(value, fallback, minimum, maximum) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(minimum, Math.min(maximum, parsed)) : fallback;
}

export function readOpenAIVisionConfig(env = {}) {
  const shared = readOpenAIConfig(env);
  const detail = String(env.OPENAI_VISION_DETAIL || "high").toLowerCase();
  return {
    apiKey: shared.apiKey,
    baseURL: shared.baseURL,
    model: String(env.OPENAI_VISION_MODEL || "").trim(),
    detail: DETAILS.has(detail) ? detail : "invalid",
    maxOutputTokens: integer(env.OPENAI_VISION_MAX_OUTPUT_TOKENS, 2400, 400, 8000),
    requestTimeoutMs: integer(env.VISION_TIMEOUT_MS || shared.requestTimeoutMs, 15000, 3000, 120000),
    store: false,
  };
}

export function validateOpenAIVisionConfig(config) {
  const errors = [];
  if (!config.apiKey) errors.push("OPENAI_API_KEY is required");
  if (!config.model) errors.push("OPENAI_VISION_MODEL is required");
  if (!/^https:\/\/[^\s]+$/i.test(config.baseURL)) errors.push("OPENAI_BASE_URL must use HTTPS");
  if (!DETAILS.has(config.detail)) errors.push("OPENAI_VISION_DETAIL must be low, high, original or auto");
  return { valid: errors.length === 0, errors };
}
