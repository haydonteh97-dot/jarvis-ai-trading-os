import { MarketDataCache } from "./cache.js";
import { MARKET_ERROR_CODES, MarketDataError } from "./errors.js";
import { MockMarketDataProvider } from "./mock-provider.js";
import { SUPPORTED_SYMBOLS, TIMEFRAME_REGISTRY } from "./registries.js";
import { TwelveDataMarketDataProvider } from "./twelve-data-provider.js";
import { validateLimit, validateSymbol, validateTimeframe } from "./validation.js";

function getRuntimeValue(env, key) {
  if (env && env[key] != null) return env[key];
  if (typeof process !== "undefined" && process.env?.[key] != null) return process.env[key];
  return undefined;
}

export function readMarketDataConfig(env = {}) {
  return {
    provider: String(getRuntimeValue(env, "MARKET_DATA_PROVIDER") || "twelvedata").toLowerCase(),
    mode: String(getRuntimeValue(env, "MARKET_DATA_MODE") || "live").toLowerCase(),
    twelveDataApiKey: String(getRuntimeValue(env, "TWELVE_DATA_API_KEY") || "").trim(),
    twelveDataBaseUrl: String(getRuntimeValue(env, "TWELVE_DATA_BASE_URL") || "https://api.twelvedata.com").trim(),
  };
}

export class MarketDataService {
  constructor({ provider, cache = new MarketDataCache(), quoteCacheMs = 15_000 } = {}) {
    this.provider = provider;
    this.cache = cache;
    this.quoteCacheMs = quoteCacheMs;
  }

  getStatus() {
    return this.provider.getProviderStatus();
  }

  getSymbols() {
    return this.provider.getSupportedSymbols().map((definition) => ({
      symbol: definition.symbol,
      providerSymbol: definition.providerSymbol,
      displayName: definition.displayName,
      assetClass: definition.assetClass,
      baseCurrency: definition.baseCurrency,
      quoteCurrency: definition.quoteCurrency,
      pricePrecision: definition.pricePrecision,
      supported: definition.supported,
      timeframes: definition.supportedTimeframes,
      tickSize: definition.tickSize,
      contractSize: definition.contractSize,
      minimumSize: definition.minimumSize,
      maximumSize: definition.maximumSize,
      sizeStep: definition.sizeStep,
      contractMetadataStatus: definition.contractMetadataStatus,
    }));
  }

  getSymbolMetadata(symbol) {
    return this.provider.getSymbolMetadata(symbol);
  }

  async getQuote(symbol) {
    const definition = validateSymbol(symbol);
    const key = `${this.provider.name}:quote:${definition.symbol}`;
    return this.cache.getOrLoad(key, this.quoteCacheMs, () => this.provider.getQuote(definition.symbol));
  }

  async getCandles(symbol, timeframe, limit = 300) {
    const symbolDefinition = validateSymbol(symbol);
    const timeframeDefinition = validateTimeframe(timeframe);
    const safeLimit = validateLimit(limit, timeframeDefinition);
    const key = `${this.provider.name}:candles:${symbolDefinition.symbol}:${timeframeDefinition.timeframe}:${safeLimit}`;
    return this.cache.getOrLoad(key, timeframeDefinition.cacheMs, () => this.provider.getCandles(symbolDefinition.symbol, timeframeDefinition.timeframe, safeLimit));
  }
}

export function createMarketDataService(env = {}, options = {}) {
  const config = readMarketDataConfig(env);
  if (config.mode === "mock") {
    return new MarketDataService({ provider: new MockMarketDataProvider(), cache: options.cache });
  }
  if (config.mode !== "live" || config.provider !== "twelvedata") {
    throw new MarketDataError(MARKET_ERROR_CODES.NOT_CONFIGURED, { httpStatus: 503 });
  }
  return new MarketDataService({
    provider: new TwelveDataMarketDataProvider({
      apiKey: config.twelveDataApiKey,
      baseUrl: config.twelveDataBaseUrl,
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs,
      now: options.now,
    }),
    cache: options.cache,
  });
}

export function marketServiceCacheKey(env = {}) {
  const config = readMarketDataConfig(env);
  return [config.provider, config.mode, config.twelveDataBaseUrl, config.twelveDataApiKey].join(":");
}

export { SUPPORTED_SYMBOLS, TIMEFRAME_REGISTRY };
