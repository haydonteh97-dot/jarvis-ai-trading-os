export const MARKET_ERROR_CODES = Object.freeze({
  NOT_CONFIGURED: "MARKET_DATA_NOT_CONFIGURED",
  AUTH_FAILED: "MARKET_DATA_AUTH_FAILED",
  RATE_LIMITED: "MARKET_DATA_RATE_LIMITED",
  TIMEOUT: "MARKET_DATA_TIMEOUT",
  UNAVAILABLE: "MARKET_DATA_UNAVAILABLE",
  SYMBOL_UNSUPPORTED: "SYMBOL_UNSUPPORTED",
  TIMEFRAME_UNSUPPORTED: "TIMEFRAME_UNSUPPORTED",
  INVALID_PROVIDER_RESPONSE: "INVALID_PROVIDER_RESPONSE",
  STALE_DATA: "STALE_DATA",
  INVALID_REQUEST: "INVALID_REQUEST",
});

const PUBLIC_MESSAGES = Object.freeze({
  MARKET_DATA_NOT_CONFIGURED: "Market data source is not connected.",
  MARKET_DATA_AUTH_FAILED: "Market data authentication failed.",
  MARKET_DATA_RATE_LIMITED: "Market data update is temporarily delayed.",
  MARKET_DATA_TIMEOUT: "Market data provider did not respond in time.",
  MARKET_DATA_UNAVAILABLE: "Verified market data is temporarily unavailable.",
  SYMBOL_UNSUPPORTED: "This market is not supported by the connected data source.",
  TIMEFRAME_UNSUPPORTED: "This timeframe is not supported.",
  INVALID_PROVIDER_RESPONSE: "JARVIS could not verify the market-data response.",
  STALE_DATA: "Market data is stale and requires an update.",
  INVALID_REQUEST: "The market-data request is invalid.",
});

export class MarketDataError extends Error {
  constructor(code, options = {}) {
    super(options.message || PUBLIC_MESSAGES[code] || PUBLIC_MESSAGES.MARKET_DATA_UNAVAILABLE);
    this.name = "MarketDataError";
    this.code = code;
    this.httpStatus = options.httpStatus || 503;
    this.retryable = Boolean(options.retryable);
    this.cause = options.cause;
  }

  toPublicError() {
    return {
      code: this.code,
      message: PUBLIC_MESSAGES[this.code] || PUBLIC_MESSAGES.MARKET_DATA_UNAVAILABLE,
    };
  }
}

export function asMarketDataError(error) {
  if (error instanceof MarketDataError) return error;
  if (error?.name === "AbortError") {
    return new MarketDataError(MARKET_ERROR_CODES.TIMEOUT, {
      httpStatus: 504,
      retryable: true,
      cause: error,
    });
  }
  return new MarketDataError(MARKET_ERROR_CODES.UNAVAILABLE, {
    httpStatus: 503,
    retryable: true,
    cause: error,
  });
}
