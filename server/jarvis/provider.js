export class AIModelProvider {
  get name() { throw new Error("AIModelProvider.name must be implemented"); }
  async createResponse() { throw new Error("createResponse must be implemented"); }
  async createStructuredResponse(request) { return this.createResponse(request); }
  async continueConversation(request) { return this.createResponse(request); }
  async executeToolCallingLoop(request) { return this.createResponse(request); }
  async submitToolResults(request) { return this.createResponse(request); }
  async streamResponse(request) { return this.createResponse(request); }
  async verifyConnection() { return this.getProviderStatus(); }
  getProviderStatus() { throw new Error("getProviderStatus must be implemented"); }
  validateConfiguration() { return { valid: false }; }
  estimateRequestUsage() { return { inputTokens: null, outputTokens: null }; }
  normaliseProviderResponse(response) { return response; }
  mapProviderError(error) { return error; }
}
export class LiveAIModelProvider extends AIModelProvider {
  constructor({ providerName = null } = {}) { super(); this.providerName = providerName; }
  get name() { return this.providerName || "LiveAIModelProvider"; }
  getProviderStatus() { return { status: "unavailable", provider: this.providerName, mode: "live", configured: false, message: "AI provider is not configured." }; }
  async createResponse() { const error = new Error("AI provider is not configured."); error.code = "AI_PROVIDER_NOT_CONFIGURED"; throw error; }
}
