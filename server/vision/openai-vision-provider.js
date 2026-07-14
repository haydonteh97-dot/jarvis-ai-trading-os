import OpenAI from "openai";
import { VisionProvider } from "./provider.js";
import { readOpenAIVisionConfig, validateOpenAIVisionConfig } from "./openai-vision-config.js";
import { buildVisionInstructions, buildVisionUserText } from "./openai-vision-prompt.js";
import { OPENAI_VISION_SCHEMA } from "./openai-vision-schema.js";
import { validateLiveProviderResult } from "./observation-validation.js";

const TRANSIENT = new Set([408, 409, 429, 500, 502, 503, 504]);
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);

export class OpenAIVisionProvider extends VisionProvider {
  constructor({ env = {}, client, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), logger = null } = {}) {
    super();
    this.config = readOpenAIVisionConfig(env);
    this.client = client || (this.config.apiKey ? new OpenAI({ apiKey: this.config.apiKey, baseURL: this.config.baseURL, timeout: this.config.requestTimeoutMs, maxRetries: 0 }) : null);
    this.sleep = sleep;
    this.logger = logger;
    this.verification = { checked: false, ready: false, errorCode: null, checkedAt: null };
  }

  get name() { return "OpenAI Vision"; }
  validateConfiguration() { return validateOpenAIVisionConfig(this.config); }
  getStatus() {
    const validation = this.validateConfiguration();
    return {
      status: this.verification.ready ? "connected" : validation.valid ? "partial" : "disconnected",
      provider: this.name,
      configured: validation.valid,
      model: this.config.model || null,
      dataStatus: this.verification.ready ? "preliminary" : "unavailable",
      message: this.verification.ready ? "OpenAI Vision is connected." : validation.valid ? "OpenAI Vision is configured but not yet verified." : "OpenAI Vision is not configured.",
      errorCode: this.verification.errorCode,
    };
  }

  async inspectImage(input) { return this.analyseChart(input); }
  async extractChartContext(input) { return (await this.analyseChart(input)).chartContext; }

  async analyseChart({ upload, image, request = {} } = {}) {
    const validation = this.validateConfiguration();
    if (!validation.valid) throw coded("VISION_PROVIDER_NOT_CONFIGURED", validation.errors.join("; "));
    const bytes = image?.bytes;
    const mimeType = image?.metadata?.detectedMime;
    if (!(bytes instanceof Uint8Array) || !bytes.byteLength || !ALLOWED_MIME.has(mimeType)) throw coded("VISION_INVALID_REQUEST", "A server-validated image is required.");
    const payload = this.buildRequest({ bytes, mimeType, request, upload });
    try {
      const response = await this.request(payload);
      const parsed = parseStructured(response.output_text);
      if (!parsed) throw coded("VISION_INVALID_RESPONSE", "OpenAI returned an invalid structured Vision response.");
      const validated = validateLiveProviderResult(parsed);
      this.verification = { checked: true, ready: true, errorCode: null, checkedAt: new Date().toISOString() };
      return { ...validated, provider: this.name, model: this.config.model, dataStatus: "preliminary", providerResponseId: response.id || null, usage: normaliseUsage(response.usage) };
    } catch (error) {
      const mapped = this.mapProviderError(error);
      this.verification = { checked: true, ready: false, errorCode: mapped.code, checkedAt: new Date().toISOString() };
      throw mapped;
    }
  }

  buildRequest({ bytes, mimeType, request, upload }) {
    const imageUrl = `data:${mimeType};base64,${Buffer.from(bytes).toString("base64")}`;
    return {
      model: this.config.model,
      instructions: buildVisionInstructions(),
      input: [{ role: "user", content: [
        { type: "input_text", text: buildVisionUserText({ requestedObservations: request.requestedObservations, userContext: { ...upload?.chartContext, ...request.userContext } }) },
        { type: "input_image", image_url: imageUrl, detail: this.config.detail },
      ] }],
      max_output_tokens: this.config.maxOutputTokens,
      store: this.config.store,
      text: { format: { type: "json_schema", name: "jarvis_chart_observations", strict: true, schema: OPENAI_VISION_SCHEMA } },
      metadata: { application: "jarvis", capability: "chart_observation" },
    };
  }

  async request(payload) {
    if (!this.client) throw coded("VISION_PROVIDER_NOT_CONFIGURED", "OpenAI Vision is not configured.");
    let lastError;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try { return await this.client.responses.create(payload); }
      catch (error) {
        lastError = error;
        const status = Number(error?.status || 0);
        const providerCode = String(error?.code || error?.error?.code || "").toLowerCase();
        if (providerCode.includes("insufficient_quota") || attempt > 0 || !TRANSIENT.has(status)) break;
        const retryAfter = Math.min(Number(error?.headers?.get?.("retry-after") || 0) * 1000 || 300, 2000);
        await this.sleep(retryAfter);
      }
    }
    throw this.mapProviderError(lastError);
  }

  mapProviderError(error) {
    if (error?.code?.startsWith?.("VISION_")) return error;
    const status = Number(error?.status || 0);
    const providerCode = String(error?.code || error?.error?.code || "").toLowerCase();
    const message = String(error?.message || error?.error?.message || "").toLowerCase();
    if (providerCode.includes("insufficient_quota")) return coded("VISION_QUOTA_EXCEEDED", "OpenAI Vision quota is unavailable.");
    if (status === 401 || status === 403) return coded("VISION_AUTH_FAILED", "OpenAI Vision authentication failed.");
    if (status === 404 || providerCode.includes("model_not_found")) return coded("VISION_MODEL_UNAVAILABLE", "The configured OpenAI Vision model is unavailable.");
    if (status === 400 && (message.includes("image") || message.includes("vision") || message.includes("modality"))) return coded("VISION_MODEL_IMAGE_UNSUPPORTED", "The configured OpenAI model does not support image input.");
    if (status === 429) return coded("VISION_PROVIDER_RATE_LIMITED", "OpenAI Vision is temporarily rate limited.");
    if (providerCode.includes("timeout") || providerCode.includes("timedout") || error?.name === "AbortError") return coded("VISION_PROVIDER_TIMEOUT", "OpenAI Vision request timed out.");
    if (status === 400) return coded("VISION_PROVIDER_INVALID_REQUEST", "OpenAI rejected the Vision request.");
    return coded("VISION_PROVIDER_UNAVAILABLE", "OpenAI Vision is temporarily unavailable.");
  }
}

function parseStructured(value) { try { return JSON.parse(value || ""); } catch { return null; } }
function coded(code, message) { return Object.assign(new Error(message), { code }); }
function normaliseUsage(usage = {}) { return { inputTokens: usage.input_tokens || 0, outputTokens: usage.output_tokens || 0, totalTokens: usage.total_tokens || 0 }; }
