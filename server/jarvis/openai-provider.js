import OpenAI from "openai";
import { AIModelProvider } from "./provider.js";
import { readOpenAIConfig, validateOpenAIConfig } from "./openai-config.js";
import { JARVIS_ANSWER_SCHEMA, validateAnswer } from "./contracts.js";
import { buildCoreInstructions } from "./prompts.js";
import { resolveOpenAITool, toOpenAITools, validateToolArguments } from "./openai-tools.js";
import { AIUsageTracker, safeAIEvent } from "./usage.js";

const TRANSIENT = new Set([408, 409, 429, 500, 502, 503, 504]);

export class OpenAIResponsesProvider extends AIModelProvider {
  constructor({ env = {}, registry, client, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), now = () => Date.now(), usageTracker = new AIUsageTracker(), logger = null } = {}) {
    super();
    this.config = readOpenAIConfig(env);
    this.registry = registry;
    this.client = client || (this.config.apiKey ? new OpenAI({ apiKey: this.config.apiKey, baseURL: this.config.baseURL, timeout: this.config.requestTimeoutMs, maxRetries: 0 }) : null);
    this.sleep = sleep;
    this.now = now;
    this.usageTracker = usageTracker;
    this.logger = logger;
    this.verification = { checked: false, ready: false, errorCode: null, checkedAt: null };
  }

  get name() { return "OpenAI"; }
  validateConfiguration() { return validateOpenAIConfig(this.config); }
  getProviderStatus() {
    const validation = this.validateConfiguration();
    const ready = validation.valid && this.verification.ready;
    return {
      status: ready ? "ready" : validation.valid ? "partial" : "unavailable",
      provider: this.name,
      mode: "live",
      configured: validation.valid,
      model: this.config.model || null,
      toolCalling: true,
      structuredOutput: true,
      conversationState: true,
      streaming: this.config.streamingEnabled,
      message: ready ? "JARVIS AI is connected." : validation.valid ? "OpenAI is configured but has not completed a successful verification." : "AI provider is not configured.",
      errorCode: this.verification.errorCode,
    };
  }

  async verifyConnection() {
    const validation = this.validateConfiguration();
    if (!validation.valid) throw coded("AI_PROVIDER_NOT_CONFIGURED", validation.errors.join("; "));
    if (this.verification.ready) return this.getProviderStatus();
    try {
      await this.request({ model: this.config.model, input: "Reply with OK.", max_output_tokens: 32, store: this.config.store });
      this.verification = { checked: true, ready: true, errorCode: null, checkedAt: new Date().toISOString() };
      return this.getProviderStatus();
    } catch (error) {
      const mapped = this.mapProviderError(error);
      this.verification = { checked: true, ready: false, errorCode: mapped.code, checkedAt: new Date().toISOString() };
      throw mapped;
    }
  }

  async createResponse(request) { return this.createStructuredResponse(request); }
  async continueConversation(request) { return this.createStructuredResponse(request); }
  async createStructuredResponse(request) { return this.executeToolCallingLoop(request); }
  async streamResponse(request) {
    // Structured final output remains non-streamed; the caller may expose truthful lifecycle status events.
    return this.executeToolCallingLoop({ ...request, statusStreaming: this.config.streamingEnabled });
  }

  async executeToolCallingLoop(request) {
    const validation = this.validateConfiguration();
    if (!validation.valid) throw coded("AI_PROVIDER_NOT_CONFIGURED", validation.errors.join("; "));
    const startedAt = this.now();
    const tools = toOpenAITools(this.registry, request.allowedTools || []);
    const allowedToolNames = new Set(tools.map((tool) => tool.name));
    const toolResults = [];
    const seenCalls = new Set();
    const usage = emptyUsage();
    const statusEvents = [];
    let response;
    let input = this.initialInput(request);
    let previousResponseId = this.config.store ? request.previousResponseId || undefined : undefined;

    emitStatus(request, statusEvents, request.language === "zh" ? "正在理解你的问题" : "Understanding your question");
    for (let iteration = 0; iteration < this.config.maxIterations; iteration += 1) {
      response = await this.request(this.responseRequest({ request, input, tools, previousResponseId }));
      mergeUsage(usage, response.usage);
      const calls = (response.output || []).filter((item) => item.type === "function_call");
      if (!calls.length) break;
      if (toolResults.length + calls.length > this.config.maxToolCalls) throw withPartial("AI_MAX_TOOL_CALLS_REACHED", toolResults, usage);
      const outputs = [];
      for (const call of calls) {
        if (!allowedToolNames.has(call.name)) throw withPartial("AI_TOOL_UNAVAILABLE", toolResults, usage);
        const parsed = parseArguments(call.arguments);
        const checked = validateToolArguments(call.name, parsed);
        if (!checked.valid) throw withPartial("AI_INVALID_REQUEST", toolResults, usage);
        const fingerprint = `${call.name}:${stableStringify(checked.value)}`;
        if (seenCalls.has(fingerprint)) throw withPartial("AI_MAX_TOOL_CALLS_REACHED", toolResults, usage);
        seenCalls.add(fingerprint);
        const mapping = resolveOpenAITool(call.name);
        if (!matchesPlan(mapping.internal, checked.value, request.toolPlan || [])) throw withPartial("AI_INVALID_REQUEST", toolResults, usage);
        emitStatus(request, statusEvents, statusForTool(mapping.internal, request.language));
        const result = await this.registry.execute(mapping.internal, checked.value, request.context || {});
        toolResults.push(result);
        outputs.push({ type: "function_call_output", call_id: call.call_id, output: limitedJson(result, this.config.maxToolResultBytes) });
      }
      if (this.config.store) {
        previousResponseId = response.id;
        input = outputs;
      } else {
        input = [...(response.output || []), ...outputs];
      }
    }

    if (!response || (response.output || []).some((item) => item.type === "function_call")) throw withPartial("AI_MAX_TOOL_CALLS_REACHED", toolResults, usage);
    emitStatus(request, statusEvents, request.language === "zh" ? "正在准备回答" : "Preparing response");
    let answer = parseStructured(response.output_text);
    if (!validateAnswer(answer).valid) answer = await this.repairStructuredOutput({ request, response, toolResults, usage });
    this.verification = { checked: true, ready: true, errorCode: null, checkedAt: new Date().toISOString() };
    const durationMs = this.now() - startedAt;
    this.usageTracker.record({ ...usage, toolCalls: toolResults.length, model: this.config.model, durationMs, conversationId: request.conversationId || null });
    safeAIEvent(this.logger, { requestId: request.requestId, conversationId: request.conversationId, userKey: request.safetyIdentifier, model: this.config.model, providerResponseId: response.id, intent: request.intents?.[0], tools: toolResults.map((item) => item.tool), durationMs, usage, dataQuality: request.dataQuality, status: "completed" });
    return {
      answer,
      toolResults,
      providerMeta: {
        provider: this.name,
        model: this.config.model,
        responseId: response.id || null,
        previousResponseId: this.config.store ? response.id || null : null,
        usage,
        toolCallCount: toolResults.length,
        durationMs,
        stored: this.config.store,
        streaming: this.config.streamingEnabled,
        statusEvents,
      },
    };
  }

  async submitToolResults(request) { return this.executeToolCallingLoop(request); }

  responseRequest({ request, input, tools, previousResponseId }) {
    const payload = {
      model: this.config.model,
      instructions: buildCoreInstructions(request.language),
      input,
      tools,
      tool_choice: tools.length ? "auto" : "none",
      parallel_tool_calls: false,
      max_output_tokens: this.config.maxOutputTokens,
      store: this.config.store,
      text: { format: { type: "json_schema", name: "jarvis_answer", strict: true, schema: JARVIS_ANSWER_SCHEMA } },
      metadata: { application: "jarvis", intent: String(request.intents?.[0] || "general").slice(0, 64) },
    };
    if (previousResponseId) payload.previous_response_id = previousResponseId;
    if (this.config.reasoningEffort && this.config.reasoningEffort !== "none") payload.reasoning = { effort: this.config.reasoningEffort };
    if (request.safetyIdentifier) payload.safety_identifier = request.safetyIdentifier;
    return payload;
  }

  initialInput(request) {
    if (request.previousResponseId && this.config.store) return [{ role: "user", content: request.message }];
    const history = (request.conversationMessages || []).slice(-10).map((item) => ({ role: item.role === "jarvis" ? "assistant" : "user", content: item.role === "jarvis" ? item.response?.answer?.summary || "" : item.text || "" })).filter((item) => item.content);
    return [...history, { role: "user", content: request.message }];
  }

  async repairStructuredOutput({ request, response, toolResults, usage }) {
    const repairInput = [{ role: "user", content: "Return the final answer again using exactly the required JSON schema. Do not call tools and do not add facts." }];
    const repaired = await this.request({ ...this.responseRequest({ request, input: repairInput, tools: [], previousResponseId: this.config.store ? response.id : undefined }), tool_choice: "none" });
    mergeUsage(usage, repaired.usage);
    const answer = parseStructured(repaired.output_text);
    if (!validateAnswer(answer).valid) throw withPartial("AI_STRUCTURED_OUTPUT_FAILED", toolResults, usage);
    return answer;
  }

  async request(payload) {
    if (!this.client) throw coded("AI_PROVIDER_NOT_CONFIGURED", "OpenAI is not configured.");
    let lastError;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try { return await this.client.responses.create(payload); }
      catch (error) {
        lastError = error;
        const status = Number(error?.status || 0);
        if (attempt > 0 || !TRANSIENT.has(status)) break;
        const retryAfter = Math.min(Number(error?.headers?.get?.("retry-after") || 0) * 1000 || 300, 2000);
        await this.sleep(retryAfter);
      }
    }
    throw this.mapProviderError(lastError);
  }

  mapProviderError(error) {
    if (error?.code?.startsWith?.("AI_")) return error;
    const status = Number(error?.status || 0);
    const providerCode = String(error?.code || "").toLowerCase();
    if (status === 401 || status === 403) return coded("AI_AUTH_FAILED", "OpenAI authentication failed.");
    if (status === 404 || providerCode.includes("model")) return coded("AI_MODEL_UNAVAILABLE", "The configured OpenAI model is unavailable.");
    if (status === 429) return coded("AI_RATE_LIMITED", "OpenAI is temporarily rate limited.");
    if (providerCode.includes("timeout") || providerCode.includes("timedout") || error?.name === "AbortError") return coded("AI_TIMEOUT", "OpenAI request timed out.");
    if (status === 400) return coded("AI_INVALID_REQUEST", "OpenAI rejected the request.");
    return coded("AI_UNAVAILABLE", "OpenAI is temporarily unavailable.");
  }
}

function emptyUsage() { return { inputTokens: 0, outputTokens: 0, reasoningTokens: 0, cachedInputTokens: 0, totalTokens: 0 }; }
function mergeUsage(target, usage = {}) { target.inputTokens += usage.input_tokens || 0; target.outputTokens += usage.output_tokens || 0; target.totalTokens += usage.total_tokens || 0; target.reasoningTokens += usage.output_tokens_details?.reasoning_tokens || 0; target.cachedInputTokens += usage.input_tokens_details?.cached_tokens || 0; }
function parseArguments(value) { try { return JSON.parse(value || "{}"); } catch { throw coded("AI_INVALID_REQUEST", "OpenAI returned invalid tool arguments."); } }
function parseStructured(value) { try { return JSON.parse(value || ""); } catch { return null; } }
function stableStringify(value) { return JSON.stringify(value, Object.keys(value || {}).sort()); }
function limitedJson(value, maximumBytes) { const output = JSON.stringify(value); return new TextEncoder().encode(output).byteLength <= maximumBytes ? output : JSON.stringify({ success: false, error: { code: "AI_TOOL_RESULT_TOO_LARGE", message: "Tool result exceeded the safe payload limit." } }); }
function coded(code, message) { return Object.assign(new Error(message), { code }); }
function withPartial(code, toolResults, usage) { return Object.assign(new Error(code), { code, partialToolResults: toolResults, usage }); }
function matchesPlan(internalName, input, plan) { const expected = plan.find((item) => item.name === internalName)?.input || {}; return Object.entries(expected).every(([key, value]) => value == null || input[key] === value); }
function emitStatus(request, events, label) { events.push({ label, timestamp: new Date().toISOString() }); if (typeof request.onStatus === "function") request.onStatus(label); }
function statusForTool(name, language) { const zh = language === "zh"; if (name.startsWith("market.")) return zh ? "正在检查市场资料" : "Checking market data"; if (name.startsWith("scanner.")) return zh ? "正在检查扫描结果" : "Reviewing scanner result"; if (name.startsWith("macro.")) return zh ? "正在检查宏观背景" : "Checking macro context"; if (name.startsWith("news.")) return zh ? "正在检查新闻背景" : "Checking news context"; if (name.startsWith("planner.")) return zh ? "正在检查交易计划" : "Reviewing trade plan"; return zh ? "正在检查风险" : "Reviewing risk"; }
