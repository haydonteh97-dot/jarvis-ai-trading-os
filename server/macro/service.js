import { MacroCache } from "./cache.js";
import { MockMacroProvider } from "./mock-provider.js";
import { LiveMacroDataProvider } from "./provider.js";
import { deduplicateMacroEvents } from "./normalizers.js";
import { interpretMacroEvent } from "./interpretation.js";
import { buildMacroSentiment } from "./sentiment.js";
import { eventRisk, mapAffectedAssets } from "./risk.js";
import { aiAnalysisMacroContext, askJarvisMacroHandoff, scannerMacroRiskContext, tradePlannerEventRisk } from "./integrations.js";
import { validateDateRange } from "./validation.js";

const ASSETS = ["XAUUSD", "DXY", "EURUSD", "GBPUSD", "USDJPY", "US100", "US500", "BTCUSD"];

export class MacroEngine {
  constructor({ env = {}, provider, cache = new MacroCache() } = {}) {
    this.env = env;
    this.mode = String(env.MACRO_DATA_MODE || "mock").toLowerCase();
    this.provider = provider || (this.mode === "mock"
      ? new MockMacroProvider()
      : new LiveMacroDataProvider({ providerName: env.MACRO_DATA_PROVIDER || null }));
    this.cache = cache;
  }

  getStatus() {
    const status = this.provider.getProviderStatus();
    return {
      ...status,
      supportedCurrencies: this.provider.getSupportedCurrencies(),
      supportedCategories: this.provider.getSupportedCategories(),
    };
  }

  async getEvents(filters = {}) {
    if (filters.start || filters.end) validateDateRange(filters.start, filters.end);
    const key = `events:${JSON.stringify(filters)}`;
    const cached = this.cache.get(key);
    if (cached) return { events: cached, cached: true };
    const events = await this.cache.dedupe(key, async () => deduplicateMacroEvents(await this.provider.getEvents(filters)));
    const filtered = events.filter((event) => {
      if (filters.currency && filters.currency !== "All" && event.currency !== filters.currency) return false;
      if (filters.impact && filters.impact !== "All" && event.impact !== String(filters.impact).toLowerCase()) return false;
      if (filters.category && filters.category !== "All" && event.category !== String(filters.category).toLowerCase()) return false;
      return true;
    }).map((event) => this.enrichEvent(event));
    this.cache.set(key, filtered, 60_000);
    return { events: filtered, cached: false };
  }

  enrichEvent(event) {
    return {
      ...event,
      interpretation: interpretMacroEvent(event),
      affectedAssets: mapAffectedAssets(event),
      risk: eventRisk(event),
      handoff: askJarvisMacroHandoff(event),
    };
  }

  async getEventById(eventId) {
    const event = await this.provider.getEventById(eventId);
    return event ? this.enrichEvent(event) : null;
  }

  async getSummary(filters = {}) {
    const { events, cached } = await this.getEvents(filters);
    const status = this.getStatus();
    const sentiment = buildMacroSentiment(events);
    const scanner = Object.fromEntries(ASSETS.map((asset) => [asset, scannerMacroRiskContext(events, asset)]));
    const planner = Object.fromEntries(ASSETS.map((asset) => [asset, tradePlannerEventRisk(events, asset)]));
    return {
      provider: status.provider,
      dataStatus: status.dataStatus,
      sentiment,
      riskSummary: events.length ? events.map((event) => ({ eventId: event.id, ...event.risk })) : [],
      eventCount: events.length,
      integrations: {
        scanner,
        aiAnalysis: Object.fromEntries(ASSETS.map((asset) => [asset, aiAnalysisMacroContext({ ...status, sentiment, riskSummary: events.map((event) => event.risk) }, events, asset)])),
        tradePlanner: planner,
      },
      cached,
    };
  }
}

export function createMacroEngine(env = {}) {
  return new MacroEngine({ env });
}
