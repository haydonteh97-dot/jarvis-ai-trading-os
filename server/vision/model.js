export const SUPPORTED_ASSETS = Object.freeze({
  XAUUSD: ["XAUUSD", "GOLD", "XAU/USD"], EURUSD: ["EURUSD", "EUR/USD"], GBPUSD: ["GBPUSD", "GBP/USD"],
  USDJPY: ["USDJPY", "USD/JPY"], BTCUSD: ["BTCUSD", "BTC/USD", "BITCOIN"], ETHUSD: ["ETHUSD", "ETH/USD", "ETHEREUM"]
});
export const SUPPORTED_TIMEFRAMES = Object.freeze(["MN", "W1", "D1", "H4", "H1", "M30", "M15", "M5"]);
export const SUPPORTED_PLATFORMS = Object.freeze(["TradingView", "MT5", "MT4"]);

export function normaliseAsset(value) {
  const token = String(value || "").trim().toUpperCase();
  return Object.entries(SUPPORTED_ASSETS).find(([, aliases]) => aliases.includes(token))?.[0] || null;
}
export function normaliseTimeframe(value) {
  const token = String(value || "").trim().toUpperCase();
  return SUPPORTED_TIMEFRAMES.includes(token) ? token : null;
}
export function normalisePlatform(value) {
  const token = String(value || "").trim().toLowerCase();
  return SUPPORTED_PLATFORMS.find((item) => item.toLowerCase() === token) || null;
}

export function createChartContext({ id, file, image, hints = {}, hash, ownerId = "anonymous-session", duplicateOf = null, provider = "MockVisionProvider", dataStatus = "demo", now = new Date().toISOString() }) {
  const asset = normaliseAsset(hints.asset);
  const timeframe = normaliseTimeframe(hints.timeframe);
  const platform = normalisePlatform(hints.platform);
  const unknownFields = [!asset && "asset", !timeframe && "timeframe", !platform && "platform", "theme", "indicatorsVisible", "drawingTools", "visibleCandles", "visibleSessions", "visiblePriceScale", "visibleTimeScale"].filter(Boolean);
  const context = {
    id, imageStatus: "accepted", file: { name: file.name || null, declaredMime: file.type || null, detectedMime: image.mimeType, format: image.mimeType.split("/")[1], size: file.size, width: image.width, height: image.height, pixelCount: image.pixelCount },
    chartContext: { asset, timeframe, platform, theme: null, indicatorsVisible: null, drawingTools: null, visibleCandles: null, visibleSessions: null, visiblePriceScale: null, visibleTimeScale: null },
    imageQuality: image.quality, confidence: 0, unknownFields,
    warnings: [dataStatus === "demo" ? "Demo foundation only. Image content has not been analysed by a live vision provider." : "Image accepted. Visual observations remain preliminary until analysis and market-data verification.", ...(duplicateOf ? [`Duplicate of upload ${duplicateOf}.`] : [])],
    provider, dataStatus, duplicateOf, retentionStatus: "session", createdAt: now, lastUpdated: now
  };
  Object.defineProperty(context, "ownerId", { value: ownerId, enumerable: false });
  Object.defineProperty(context, "contentHash", { value: hash, enumerable: false });
  return context;
}
