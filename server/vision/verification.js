import { createMarketDataService } from "../market-data/service.js";
export async function verifyObservationContext({ upload, observation, env = {} }) {
  const verification = { marketDataStatus: "unavailable", assetVerified: false, timeframeVerified: false, priceScaleVerified: false, conflicts: [] };
  if (!upload.chartContext.asset || !upload.chartContext.timeframe) return verification;
  try {
    const service = createMarketDataService(env);
    const metadata = service.getSymbolMetadata(upload.chartContext.asset);
    verification.assetVerified = Boolean(metadata?.supported);
    verification.timeframeVerified = Boolean(metadata?.supportedTimeframes?.includes(upload.chartContext.timeframe));
    verification.marketDataStatus = service.getStatus().status === "connected" ? "available" : "unavailable";
    const fixtureTrend = observation.observations.trend?.direction;
    if (fixtureTrend && fixtureTrend !== "unavailable") verification.conflicts.push({ field: "trend", vision: fixtureTrend, verified: null, status: "not_cross_verified", resolution: "Preserve Vision as preliminary; deterministic market-data trend remains authoritative." });
  } catch {
    verification.marketDataStatus = "unavailable";
  }
  return verification;
}
export function mergeWithoutOverride(vision, verified = {}) {
  return { verified, vision, effective: verified, rule: "Verified structured data remains authoritative. Vision is supplementary." };
}
