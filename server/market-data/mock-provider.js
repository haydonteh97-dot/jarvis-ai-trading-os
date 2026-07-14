import { MarketDataProvider } from "./provider.js";
import { SUPPORTED_SYMBOLS, SYMBOL_REGISTRY } from "./registries.js";
import { validateLimit, validateSymbol, validateTimeframe } from "./validation.js";

const DEMO_TIMESTAMP = "2026-07-01T01:00:00.000Z";
const DEMO_PRICES = Object.freeze({ XAUUSD: 2325.4, EURUSD: 1.0825, GBPUSD: 1.2712, USDJPY: 147.25, BTCUSD: 62450 });

export class MockMarketDataProvider extends MarketDataProvider {
  get name() {
    return "MockMarketDataProvider";
  }

  normaliseSymbol(symbol) {
    return validateSymbol(symbol).symbol;
  }

  mapTimeframe(timeframe) {
    return validateTimeframe(timeframe).timeframe;
  }

  getSupportedSymbols() {
    return SUPPORTED_SYMBOLS.map((symbol) => SYMBOL_REGISTRY[symbol]);
  }

  getSymbolMetadata(symbol) {
    return validateSymbol(symbol);
  }

  getProviderStatus() {
    return {
      status: "connected",
      provider: this.name,
      configured: true,
      lastSuccessfulUpdate: DEMO_TIMESTAMP,
      message: "Demo market-data mode is active.",
    };
  }

  async getQuote(symbol) {
    const definition = validateSymbol(symbol);
    const last = DEMO_PRICES[definition.symbol];
    return {
      symbol: definition.symbol,
      bid: null,
      ask: null,
      last,
      open: null,
      high: null,
      low: null,
      previousClose: null,
      change: null,
      changePercent: null,
      timestamp: DEMO_TIMESTAMP,
      serverReceivedAt: DEMO_TIMESTAMP,
      dataAgeMs: null,
      provider: this.name,
      dataStatus: "demo",
      freshness: "unavailable",
    };
  }

  async getCandles(symbol, timeframe, limit = 300) {
    const definition = validateSymbol(symbol);
    const timeframeDefinition = validateTimeframe(timeframe);
    const safeLimit = validateLimit(limit, timeframeDefinition);
    const base = DEMO_PRICES[definition.symbol];
    const candles = Array.from({ length: safeLimit }, (_, index) => {
      const offset = safeLimit - index - 1;
      const close = base * (1 + Math.sin(index / 6) * 0.002);
      const open = close * (1 - Math.cos(index / 4) * 0.0005);
      return {
        timestamp: new Date(new Date(DEMO_TIMESTAMP).getTime() - offset * timeframeDefinition.durationMs).toISOString(),
        open,
        high: Math.max(open, close) * 1.001,
        low: Math.min(open, close) * 0.999,
        close,
        volume: null,
        volumeType: "unavailable",
      };
    });
    return {
      symbol: definition.symbol,
      timeframe: timeframeDefinition.timeframe,
      provider: this.name,
      dataStatus: "demo",
      freshness: "unavailable",
      lastUpdated: DEMO_TIMESTAMP,
      serverReceivedAt: DEMO_TIMESTAMP,
      dataAgeMs: null,
      candles,
    };
  }
}
