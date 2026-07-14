export class MacroDataProvider {
  get name() { throw new Error("MacroDataProvider.name must be implemented"); }
  async getEvents() { throw new Error("getEvents must be implemented"); }
  async getEventById() { throw new Error("getEventById must be implemented"); }
  getProviderStatus() { throw new Error("getProviderStatus must be implemented"); }
  getSupportedCountries() { return []; }
  getSupportedCurrencies() { return []; }
  getSupportedCategories() { return []; }
  normaliseEvent(event) { return event; }
  mapImpact(impact) { return impact; }
  mapReleaseStatus(status) { return status; }
}

export class LiveMacroDataProvider extends MacroDataProvider {
  constructor({ providerName = null } = {}) {
    super();
    this.providerName = providerName;
  }
  get name() { return this.providerName || "LiveMacroDataProvider"; }
  getProviderStatus() {
    return { status: "disconnected", provider: this.providerName, configured: false, dataStatus: "unavailable", message: "Verified macro source not connected." };
  }
  async getEvents() {
    const error = new Error("Verified macro source not connected.");
    error.code = "MACRO_DATA_NOT_CONFIGURED";
    throw error;
  }
  async getEventById() { return this.getEvents(); }
}
