import { MARKET_ERROR_CODES, MarketDataError, asMarketDataError } from "./errors.js";
import { normaliseTwelveDataCandles, normaliseTwelveDataQuote } from "./normalizers.js";
import { MarketDataProvider } from "./provider.js";
import { SUPPORTED_SYMBOLS, SYMBOL_REGISTRY, getTimeframeDefinition } from "./registries.js";
import { validateLimit, validateSymbol, validateTimeframe } from "./validation.js";

const DEFAULT_BASE_URL = "https://api.twelvedata.com";

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function classifyProviderError(status, payload) {
  const providerCode = Number(payload?.code || status);
  const message = String(payload?.message || "").toLowerCase();
  if (status === 401 || status === 403 || providerCode === 401 || message.includes("api key") || message.includes("apikey")) {
    return new MarketDataError(MARKET_ERROR_CODES.AUTH_FAILED, { httpStatus: 503 });
  }
  if (status === 429 || providerCode === 429 || message.includes("credit") || message.includes("rate limit")) {
    return new MarketDataError(MARKET_ERROR_CODES.RATE_LIMITED, { httpStatus: 429, retryable: true });
  }
  return new MarketDataError(MARKET_ERROR_CODES.UNAVAILABLE, { httpStatus: 503, retryable: status >= 500 });
}

export class TwelveDataMarketDataProvider extends MarketDataProvider {
  constructor({ apiKey, baseUrl = DEFAULT_BASE_URL, fetchImpl = globalThis.fetch, timeoutMs = 8_000, now = () => Date.now() } = {}) {
    super();
    this.apiKey = String(apiKey || "").trim();
    this.baseUrl = String(baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");
    this.fetchImpl = fetchImpl;
    this.timeoutMs = timeoutMs;
    this.now = now;
    this.lastSuccessfulUpdate = null;
    this.lastFailureCode = this.apiKey ? null : MARKET_ERROR_CODES.NOT_CONFIGURED;
  }

  get name() {
    return "Twelve Data";
  }

  normaliseSymbol(symbol) {
    return validateSymbol(symbol).providerSymbol;
  }

  mapTimeframe(timeframe) {
    return validateTimeframe(timeframe).providerInterval;
  }

  getSupportedSymbols() {
    return SUPPORTED_SYMBOLS.map((symbol) => SYMBOL_REGISTRY[symbol]);
  }

  getSymbolMetadata(symbol) {
    return validateSymbol(symbol);
  }

  getProviderStatus() {
    if (!this.apiKey) {
      return {
        status: "disconnected",
        provider: this.name,
        configured: false,
        lastSuccessfulUpdate: null,
        message: "Market data source is not connected.",
      };
    }
    if (this.lastSuccessfulUpdate) {
      return {
        status: "connected",
        provider: this.name,
        configured: true,
        lastSuccessfulUpdate: this.lastSuccessfulUpdate,
        message: "Twelve Data connection verified by a successful market-data response.",
      };
    }
    return {
      status: this.lastFailureCode ? "error" : "partial",
      provider: this.name,
      configured: true,
      lastSuccessfulUpdate: null,
      message: this.lastFailureCode
        ? "Twelve Data is configured but the latest request was not verified."
        : "Twelve Data is configured and awaiting response verification.",
    };
  }

  async request(pathname, parameters) {
    if (!this.apiKey) {
      throw new MarketDataError(MARKET_ERROR_CODES.NOT_CONFIGURED, { httpStatus: 503 });
    }
    const url = new URL(`${this.baseUrl}${pathname}`);
    Object.entries({ ...parameters, apikey: this.apiKey }).forEach(([key, value]) => url.searchParams.set(key, String(value)));
    let lastError;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await this.fetchImpl(url, {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || payload?.status === "error") {
          const providerError = classifyProviderError(response.status, payload);
          this.lastFailureCode = providerError.code;
          if (providerError.retryable && attempt === 0) {
            const retryAfter = Math.min(Number(response.headers?.get?.("retry-after") || 0) * 1000 || 250, 2_000);
            await wait(retryAfter);
            lastError = providerError;
            continue;
          }
          throw providerError;
        }
        this.lastSuccessfulUpdate = new Date(this.now()).toISOString();
        this.lastFailureCode = null;
        return payload;
      } catch (error) {
        const marketError = asMarketDataError(error);
        this.lastFailureCode = marketError.code;
        if (marketError.retryable && attempt === 0) {
          await wait(250);
          lastError = marketError;
          continue;
        }
        throw marketError;
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError || new MarketDataError(MARKET_ERROR_CODES.UNAVAILABLE);
  }

  async getQuote(symbol) {
    const symbolDefinition = validateSymbol(symbol);
    const response = await this.request("/quote", {
      symbol: symbolDefinition.providerSymbol,
      timezone: "UTC",
    });
    return normaliseTwelveDataQuote(response, symbolDefinition, this.now());
  }

  async getCandles(symbol, timeframe, limit = 300) {
    const symbolDefinition = validateSymbol(symbol);
    const timeframeDefinition = validateTimeframe(timeframe);
    const safeLimit = validateLimit(limit, timeframeDefinition);
    const response = await this.request("/time_series", {
      symbol: symbolDefinition.providerSymbol,
      interval: timeframeDefinition.providerInterval,
      outputsize: safeLimit,
      order: "asc",
      timezone: "UTC",
    });
    return normaliseTwelveDataCandles(response, symbolDefinition, timeframeDefinition, this.now());
  }
}
