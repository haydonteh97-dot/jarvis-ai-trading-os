import { getSymbolDefinition, getTimeframeDefinition } from "./registries.js";

const QUOTE_CURRENT_MS = Object.freeze({ forex: 120_000, metal: 120_000, crypto: 120_000 });

export function classifyFreshness({ timestamp, symbol, timeframe = null, now = Date.now() }) {
  if (!timestamp) return { freshness: "unavailable", dataAgeMs: null };
  const time = new Date(timestamp).getTime();
  if (!Number.isFinite(time)) return { freshness: "unavailable", dataAgeMs: null };
  const dataAgeMs = Math.max(0, now - time);
  const symbolDefinition = getSymbolDefinition(symbol);
  const timeframeDefinition = timeframe ? getTimeframeDefinition(timeframe) : null;
  const currentLimit = timeframeDefinition
    ? Math.max(timeframeDefinition.durationMs * 3, 15 * 60_000)
    : QUOTE_CURRENT_MS[symbolDefinition?.assetClass] || 120_000;
  if (dataAgeMs <= currentLimit) return { freshness: "current", dataAgeMs };
  if (dataAgeMs <= currentLimit * 5) return { freshness: "delayed", dataAgeMs };
  return { freshness: "stale", dataAgeMs };
}

export function dataStatusForFreshness(freshness, baseStatus = "verified") {
  if (baseStatus === "demo") return "demo";
  if (freshness === "current") return baseStatus;
  if (freshness === "delayed" || freshness === "stale") return "delayed";
  return "unavailable";
}
