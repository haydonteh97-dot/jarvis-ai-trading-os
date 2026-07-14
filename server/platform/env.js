const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

function flag(value, fallback = false) {
  if (value == null || value === "") return fallback;
  return TRUE_VALUES.has(String(value).trim().toLowerCase());
}

function integer(value, fallback, minimum, maximum) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, minimum), maximum) : fallback;
}

function list(value, transform = (item) => item) {
  return [...new Set(String(value || "").split(",").map((item) => transform(item.trim())).filter(Boolean))];
}

export function readPlatformConfig(env = {}) {
  const betaMode = flag(env.BETA_MODE, false);
  return Object.freeze({
    nodeEnv: String(env.NODE_ENV || "production").toLowerCase(),
    appBaseUrl: String(env.APP_BASE_URL || "").replace(/\/$/, ""),
    host: String(env.HOST || "127.0.0.1"),
    port: integer(env.PORT, 4174, 1, 65535),
    buildVersion: String(env.BUILD_VERSION || "development").slice(0, 80),
    beta: Object.freeze({
      enabled: betaMode,
      allowedEmails: list(env.BETA_ALLOWED_EMAILS, (item) => item.toLowerCase()),
      inviteCodes: list(env.BETA_INVITE_CODES),
      maxUsers: integer(env.BETA_MAX_USERS, 25, 1, 5000),
    }),
    limits: Object.freeze({
      bodyBytes: integer(env.API_MAX_BODY_BYTES, 1_048_576, 16_384, 10_485_760),
      generalPerMinute: integer(env.API_REQUESTS_PER_MINUTE, 120, 10, 5000),
      jarvisPerMinute: integer(env.BETA_JARVIS_REQUESTS_PER_MINUTE, 12, 1, 120),
      visionUploadPerMinute: integer(env.BETA_VISION_UPLOADS_PER_MINUTE, 6, 1, 60),
      visionAnalysisPerMinute: integer(env.BETA_VISION_ANALYSES_PER_MINUTE, 10, 1, 120),
      scannerPerMinute: integer(env.BETA_SCANNER_REQUESTS_PER_MINUTE, 6, 1, 60),
      marketPerMinute: integer(env.BETA_MARKET_REQUESTS_PER_MINUTE, 60, 1, 600),
      macroPerMinute: integer(env.BETA_MACRO_REQUESTS_PER_MINUTE, 30, 1, 300),
      newsPerMinute: integer(env.BETA_NEWS_REQUESTS_PER_MINUTE, 30, 1, 300),
      feedbackPerMinute: integer(env.BETA_FEEDBACK_REQUESTS_PER_MINUTE, 6, 1, 60),
    }),
  });
}

export function validateEnvironment(env = {}) {
  const config = readPlatformConfig(env);
  const errors = [];
  const warnings = [];
  if (config.appBaseUrl) {
    try { const url = new URL(config.appBaseUrl); if (url.protocol !== "https:" && url.hostname !== "127.0.0.1" && url.hostname !== "localhost") errors.push("APP_BASE_URL must use HTTPS outside local development"); }
    catch { errors.push("APP_BASE_URL must be a valid absolute URL"); }
  } else warnings.push("APP_BASE_URL is not configured; cross-origin API requests will be denied");
  if (config.beta.enabled && !config.beta.allowedEmails.length) errors.push("BETA_ALLOWED_EMAILS is required when BETA_MODE=true");
  if (config.beta.enabled && !config.beta.inviteCodes.length) errors.push("BETA_INVITE_CODES is required when BETA_MODE=true");
  if (String(env.MARKET_DATA_MODE || "live").toLowerCase() === "live" && !env.TWELVE_DATA_API_KEY) warnings.push("Live Market Data is unavailable without TWELVE_DATA_API_KEY");
  if (String(env.AI_MODE || "mock").toLowerCase() === "live" && (!env.OPENAI_API_KEY || !env.OPENAI_MODEL)) warnings.push("Live OpenAI text is unavailable without OPENAI_API_KEY and OPENAI_MODEL");
  if (String(env.VISION_MODE || "mock").toLowerCase() === "live" && (!env.OPENAI_API_KEY || !env.OPENAI_VISION_MODEL)) warnings.push("Live OpenAI Vision is unavailable without OPENAI_API_KEY and OPENAI_VISION_MODEL");
  return { valid: errors.length === 0, errors, warnings, config };
}

export function safeEnvironmentSummary(env = {}) {
  const validation = validateEnvironment(env);
  return {
    valid: validation.valid,
    errors: validation.errors,
    warnings: validation.warnings,
    betaMode: validation.config.beta.enabled,
    appBaseUrlConfigured: Boolean(validation.config.appBaseUrl),
    providers: {
      marketData: String(env.MARKET_DATA_MODE || "live").toLowerCase(),
      macro: String(env.MACRO_DATA_MODE || "mock").toLowerCase(),
      news: String(env.NEWS_DATA_MODE || "mock").toLowerCase(),
      jarvisAI: String(env.AI_MODE || "mock").toLowerCase(),
      vision: String(env.VISION_MODE || "mock").toLowerCase(),
    },
  };
}
