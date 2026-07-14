const symbols = [
  {
    symbol: "XAUUSD",
    providerSymbol: "XAU/USD",
    displayName: "Gold Spot / US Dollar",
    assetClass: "metal",
    baseCurrency: "XAU",
    quoteCurrency: "USD",
    pricePrecision: 2,
  },
  {
    symbol: "EURUSD",
    providerSymbol: "EUR/USD",
    displayName: "Euro / US Dollar",
    assetClass: "forex",
    baseCurrency: "EUR",
    quoteCurrency: "USD",
    pricePrecision: 5,
  },
  {
    symbol: "GBPUSD",
    providerSymbol: "GBP/USD",
    displayName: "British Pound / US Dollar",
    assetClass: "forex",
    baseCurrency: "GBP",
    quoteCurrency: "USD",
    pricePrecision: 5,
  },
  {
    symbol: "USDJPY",
    providerSymbol: "USD/JPY",
    displayName: "US Dollar / Japanese Yen",
    assetClass: "forex",
    baseCurrency: "USD",
    quoteCurrency: "JPY",
    pricePrecision: 3,
  },
  {
    symbol: "BTCUSD",
    providerSymbol: "BTC/USD",
    displayName: "Bitcoin / US Dollar",
    assetClass: "crypto",
    baseCurrency: "BTC",
    quoteCurrency: "USD",
    pricePrecision: 2,
  },
];

const timeframes = [
  { timeframe: "D1", providerInterval: "1day", durationMs: 86_400_000, safeLimit: 1000, cacheMs: 1_800_000 },
  { timeframe: "H4", providerInterval: "4h", durationMs: 14_400_000, safeLimit: 1000, cacheMs: 900_000 },
  { timeframe: "H1", providerInterval: "1h", durationMs: 3_600_000, safeLimit: 1000, cacheMs: 300_000 },
  { timeframe: "M30", providerInterval: "30min", durationMs: 1_800_000, safeLimit: 1000, cacheMs: 120_000 },
  { timeframe: "M15", providerInterval: "15min", durationMs: 900_000, safeLimit: 1000, cacheMs: 60_000 },
  { timeframe: "M5", providerInterval: "5min", durationMs: 300_000, safeLimit: 1000, cacheMs: 30_000 },
];

export const SYMBOL_REGISTRY = Object.freeze(
  Object.fromEntries(symbols.map((item) => [item.symbol, Object.freeze({
    ...item,
    supported: true,
    supportedTimeframes: timeframes.map((entry) => entry.timeframe),
    tickSize: null,
    contractSize: null,
    minimumSize: null,
    maximumSize: null,
    sizeStep: null,
    contractMetadataStatus: "unavailable",
  })])),
);

export const TIMEFRAME_REGISTRY = Object.freeze(
  Object.fromEntries(timeframes.map((item) => [item.timeframe, Object.freeze({ ...item, supported: true })])),
);

export const SUPPORTED_SYMBOLS = Object.freeze(Object.keys(SYMBOL_REGISTRY));
export const SUPPORTED_TIMEFRAMES = Object.freeze(Object.keys(TIMEFRAME_REGISTRY));

export function getSymbolDefinition(symbol) {
  return SYMBOL_REGISTRY[String(symbol || "").toUpperCase()] || null;
}

export function getTimeframeDefinition(timeframe) {
  return TIMEFRAME_REGISTRY[String(timeframe || "").toUpperCase()] || null;
}
