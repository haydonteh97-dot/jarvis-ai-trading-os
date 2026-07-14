import { MARKET_ERROR_CODES, MarketDataError } from "./errors.js";
import { classifyFreshness, dataStatusForFreshness } from "./freshness.js";
import { nonNegativeOrNull, numericOrNull, parseProviderTimestamp } from "./validation.js";

function invalidResponse() {
  return new MarketDataError(MARKET_ERROR_CODES.INVALID_PROVIDER_RESPONSE, { httpStatus: 502 });
}

export function normaliseTwelveDataQuote(raw, symbolDefinition, now = Date.now()) {
  if (!raw || raw.status === "error") throw invalidResponse();
  const receivedSymbol = String(raw.symbol || "").replace("/", "").toUpperCase();
  if (receivedSymbol && receivedSymbol !== symbolDefinition.symbol) throw invalidResponse();
  const bid = nonNegativeOrNull(raw.bid);
  const ask = nonNegativeOrNull(raw.ask);
  const last = nonNegativeOrNull(raw.close ?? raw.price);
  if (last == null && bid == null && ask == null) throw invalidResponse();
  if (bid != null && ask != null && ask < bid) throw invalidResponse();
  const timestamp = parseProviderTimestamp(raw.timestamp ?? raw.datetime);
  if (!timestamp) throw invalidResponse();
  const freshnessResult = classifyFreshness({ timestamp, symbol: symbolDefinition.symbol, now });
  return {
    symbol: symbolDefinition.symbol,
    bid,
    ask,
    last,
    open: nonNegativeOrNull(raw.open),
    high: nonNegativeOrNull(raw.high),
    low: nonNegativeOrNull(raw.low),
    previousClose: nonNegativeOrNull(raw.previous_close),
    change: numericOrNull(raw.change),
    changePercent: numericOrNull(raw.percent_change),
    timestamp,
    serverReceivedAt: new Date(now).toISOString(),
    dataAgeMs: freshnessResult.dataAgeMs,
    provider: "Twelve Data",
    dataStatus: dataStatusForFreshness(freshnessResult.freshness),
    freshness: freshnessResult.freshness,
  };
}

export function normaliseTwelveDataCandles(raw, symbolDefinition, timeframeDefinition, now = Date.now()) {
  if (!raw || raw.status === "error" || !Array.isArray(raw.values)) throw invalidResponse();
  const receivedSymbol = String(raw.meta?.symbol || "").replace("/", "").toUpperCase();
  if (receivedSymbol && receivedSymbol !== symbolDefinition.symbol) throw invalidResponse();
  if (raw.meta?.interval && raw.meta.interval !== timeframeDefinition.providerInterval) throw invalidResponse();

  const unique = new Map();
  for (const value of raw.values) {
    const timestamp = parseProviderTimestamp(value.datetime ?? value.timestamp);
    const open = nonNegativeOrNull(value.open);
    const high = nonNegativeOrNull(value.high);
    const low = nonNegativeOrNull(value.low);
    const close = nonNegativeOrNull(value.close);
    if (!timestamp || [open, high, low, close].some((item) => item == null)) continue;
    if (high < Math.max(open, close) || low > Math.min(open, close) || high < low) continue;
    const providerVolume = nonNegativeOrNull(value.volume);
    const volume = symbolDefinition.assetClass === "crypto" ? providerVolume : null;
    unique.set(timestamp, {
      timestamp,
      open,
      high,
      low,
      close,
      volume,
      volumeType: volume == null ? "unavailable" : "estimated",
    });
  }
  const candles = [...unique.values()].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  if (!candles.length) throw invalidResponse();
  const lastUpdated = candles.at(-1).timestamp;
  const freshnessResult = classifyFreshness({
    timestamp: lastUpdated,
    symbol: symbolDefinition.symbol,
    timeframe: timeframeDefinition.timeframe,
    now,
  });
  return {
    symbol: symbolDefinition.symbol,
    timeframe: timeframeDefinition.timeframe,
    provider: "Twelve Data",
    dataStatus: dataStatusForFreshness(freshnessResult.freshness),
    freshness: freshnessResult.freshness,
    lastUpdated,
    serverReceivedAt: new Date(now).toISOString(),
    dataAgeMs: freshnessResult.dataAgeMs,
    candles,
  };
}
