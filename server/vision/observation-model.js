export const OBSERVATION_TYPES = Object.freeze(["observed", "inferred", "user_annotated", "provider_reported", "market_data_verified", "conflicting", "unavailable"]);
export const REQUESTABLE_OBSERVATIONS = Object.freeze(["trend", "structure", "swings", "support_resistance", "range", "breakout", "retest", "bos", "mss", "liquidity", "liquidity_sweep", "fair_value_gap", "order_block", "premium_discount", "indicators", "annotations", "trade_levels"]);
export const DECISION_STATUSES = Object.freeze(["preliminary", "chart_required", "better_image_required", "confirmation_required", "market_data_verification_required", "conflicting", "no_clear_structure", "unavailable"]);
export const TREND_VALUES = Object.freeze(["bullish", "bearish", "neutral", "range", "mixed", "unclear", "unavailable"]);
export const STRUCTURE_VALUES = Object.freeze(["bullish_structure", "bearish_structure", "bullish_pullback", "bearish_pullback", "bullish_consolidation", "bearish_consolidation", "range", "transition", "unclear", "unavailable"]);

export function emptyObservations() {
  return { trend: null, marketStructure: null, swings: [], supportResistance: [], ranges: [], breakouts: [], retests: [], bos: [], mss: [], liquidityZones: [], liquiditySweeps: [], fairValueGaps: [], orderBlocks: [], premiumDiscount: null, visibleIndicators: [], annotations: [], visibleTradeLevels: null };
}
export function createObservationContract({ analysisId, upload, observations = emptyObservations(), evidence = [], confidence, uncertainties = [], warnings = [], summary, verification, provider = "MockVisionProvider", dataStatus = "demo", model = null, now = new Date().toISOString() }) {
  return {
    analysisId, imageId: upload.id,
    chartContext: { ...upload.chartContext, imageQuality: upload.imageQuality, visiblePriceScale: upload.chartContext.visiblePriceScale, visibleTimeScale: upload.chartContext.visibleTimeScale, visibleCandles: upload.chartContext.visibleCandles, chartTheme: upload.chartContext.theme },
    observations, verification, confidence, uncertainties, warnings, evidence,
    summary, dataStatus, provider, model, retentionStatus: "session", createdAt: now
  };
}
