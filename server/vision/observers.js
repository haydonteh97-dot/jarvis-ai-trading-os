function unavailable(type, reason) { return { type, status: "unavailable", observationType: "unavailable", confidence: 0, reason }; }
function confidence(value) { return Math.max(0, Math.min(100, Number(value || 0))); }
export function observeTrend(input = {}) {
  const allowed = ["bullish", "bearish", "neutral", "range", "mixed", "unclear"];
  if (!allowed.includes(input.direction) || !input.evidence) return unavailable("trend", "Visible directional evidence is required.");
  return { direction: input.direction, strengthAppearance: input.strengthAppearance || "unclear", observationType: input.observationType || "provider_reported", confidence: confidence(input.confidence), evidence: input.evidence, mainUncertainty: input.mainUncertainty || "Market-data verification required." };
}
export function observeSwing(input = {}) {
  const allowed = ["swing_high", "swing_low", "higher_high", "higher_low", "lower_high", "lower_low", "equal_highs", "equal_lows"];
  if (!allowed.includes(input.type) || !input.evidence) return unavailable("swing", "Visible swing evidence is required.");
  return { type: input.type, relativeOrder: input.relativeOrder ?? null, price: input.price ?? null, timestamp: input.timestamp ?? null, observationType: input.observationType || "provider_reported", confidence: confidence(input.confidence), evidence: input.evidence };
}
export function observeBos(input = {}) {
  if (!input.priorSwingVisible || !input.closeBeyondSwing || !input.evidence) return unavailable("bos", "A prior visible swing, close beyond it and evidence are required.");
  return { status: confidence(input.confidence) >= 75 ? "likely_bos" : "possible_bos", direction: input.direction, priorSwingVisible: true, closeBeyondSwing: true, observationType: input.observationType || "inferred", confidence: confidence(input.confidence), evidence: input.evidence, mainUncertainty: input.mainUncertainty || "Image close must be verified against market data." };
}
export function observeMss(input = {}) {
  if (!input.previousStructureVisible || !input.oppositeStructuralBreakVisible || !input.swingReference || !input.evidence) return unavailable("mss", "Previous structure, opposite break and swing evidence are required.");
  return { status: confidence(input.confidence) >= 75 ? "likely_mss" : "possible_mss", direction: input.direction, observationType: input.observationType || "inferred", confidence: confidence(input.confidence), evidence: input.evidence, mainUncertainty: input.mainUncertainty || "Market-data verification required." };
}
export function observeRange(input = {}) {
  if (!input.upperRegion || !input.lowerRegion || Number(input.visibleTests || 0) < 2 || !input.evidence) return unavailable("range", "Two range boundaries and repeated tests are required.");
  return { type: input.type || "horizontal_range", upperBoundary: input.upperRegion, lowerBoundary: input.lowerRegion, midpoint: null, visibleTests: Number(input.visibleTests), breakoutStatus: input.breakoutStatus || "unavailable", observationType: input.observationType || "provider_reported", confidence: confidence(input.confidence), evidence: input.evidence };
}
export function observeBreakout(input = {}) {
  if (!input.boundaryVisible || !input.breakAppearance || !input.evidence) return unavailable("breakout", "A visible boundary and break evidence are required.");
  return { status: input.closeVisible ? "likely_breakout" : "breakout_unconfirmed", direction: input.direction, retestAppearance: input.retestAppearance || "unavailable", observationType: input.observationType || "inferred", confidence: confidence(input.confidence), evidence: input.evidence };
}
export function observeRetest(input = {}) {
  if (!input.referencedZoneVisible || !input.returnToZoneVisible || !input.evidence) return unavailable("retest", "A referenced zone and visible return are required.");
  return { zoneType: input.zoneType || "unavailable", direction: input.direction || "unavailable", holdAppearance: input.holdAppearance || "unavailable", observationType: input.observationType || "inferred", confidence: confidence(input.confidence), evidence: input.evidence };
}
export function observeZone(input = {}) {
  if (!["support", "resistance", "flipped_support", "flipped_resistance", "dynamic_support", "dynamic_resistance"].includes(input.zoneType) || !input.region || !input.evidence) return unavailable("zone", "A supported zone type, visible region and evidence are required.");
  return { zoneType: input.zoneType, region: input.region, priceRange: input.priceScaleReadable ? input.priceRange ?? null : null, visibleInteractions: Number(input.visibleInteractions || 0), latestReaction: input.latestReaction || "unavailable", observationType: input.observationType || "provider_reported", confidence: confidence(input.confidence), evidence: input.evidence };
}
export function observeLiquidity(input = {}) {
  if (!input.relatedStructure || !input.region || !input.evidence) return unavailable("liquidity", "Related visible structure and region are required.");
  return { liquidityType: input.liquidityType || "potential_liquidity", relatedStructure: input.relatedStructure, region: input.region, observationType: input.observationType || "inferred", confidence: confidence(input.confidence), evidence: input.evidence, mainUncertainty: input.mainUncertainty || "Liquidity cannot be verified from image geometry alone." };
}
export function observeLiquiditySweep(input = {}) {
  if (!input.liquidityReferenceVisible || !input.penetrationVisible || !input.returnVisible || !input.evidence) return unavailable("liquidity_sweep", "Liquidity reference, penetration and return evidence are required.");
  return { type: "possible_liquidity_sweep", side: input.side, observationType: input.observationType || "inferred", confidence: confidence(input.confidence), evidence: input.evidence };
}
export function observeFvg(input = {}) {
  if (!input.threeCandlePatternVisible || !input.imbalanceVisible || !input.evidence) return unavailable("fair_value_gap", "A visible three-candle imbalance pattern is required.");
  return { type: "possible_fvg", direction: input.direction, priceRange: input.priceScaleReadable ? input.priceRange ?? null : null, observationType: input.observationType || "inferred", confidence: confidence(input.confidence), evidence: input.evidence };
}
export function observeOrderBlock(input = {}) {
  if (!input.originCandleVisible || !input.displacementVisible || !input.reactionVisible || !input.evidence) return unavailable("order_block", "Origin candle, displacement and reaction evidence are required.");
  return { type: "possible_order_block", direction: input.direction, priceRange: input.priceScaleReadable ? input.priceRange ?? null : null, observationType: input.observationType || "inferred", confidence: confidence(input.confidence), evidence: input.evidence };
}
export function observePremiumDiscount(input = {}) {
  const high = Number(input.rangeHigh), low = Number(input.rangeLow);
  if (!Number.isFinite(high) || !Number.isFinite(low) || high <= low || !input.rangeEvidence) return unavailable("premium_discount", "A valid dealing range is required.");
  return { rangeHigh: high, rangeLow: low, equilibrium: (high + low) / 2, currentArea: input.currentPrice == null ? "unavailable" : Number(input.currentPrice) > (high + low) / 2 ? "premium" : "discount", observationType: input.observationType || "inferred", confidence: confidence(input.confidence), evidence: input.rangeEvidence };
}
export function observeVisibleTradeLevels(input = {}) {
  const result = { entry: null, stopLoss: null, takeProfits: [], observationType: input.userAnnotated ? "user_annotated" : "provider_reported", confidence: confidence(input.confidence), verified: false, requiresUserConfirmation: true };
  if (!input.priceScaleReadable || !input.evidence) return result;
  const numeric = (value) => Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : null;
  result.entry = numeric(input.entry); result.stopLoss = numeric(input.stopLoss); result.takeProfits = (input.takeProfits || []).map(numeric).filter((value) => value != null).slice(0, 3);
  return result;
}
