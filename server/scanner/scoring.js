import { multiTimeframeAlignment } from "./analysis.js";

export const SCORING_WEIGHTS = Object.freeze({
  trendAlignment: 20,
  marketStructure: 20,
  liquidityContext: 15,
  volatilitySuitability: 10,
  setupConfirmation: 15,
  riskRewardQuality: 10,
  macroRisk: 5,
  newsRisk: 5,
});

function structureScore(analysis) {
  if (!analysis?.sufficient || analysis.structure === "Insufficient Swing Structure") return 0;
  if (analysis.breakout && analysis.structure !== "Mixed Structure") return 19;
  if (analysis.structure === "Higher High / Higher Low" || analysis.structure === "Lower High / Lower Low") return analysis.pullback ? 17 : 15;
  if (analysis.range) return 10;
  return 6;
}

function liquidityScore(analysis) {
  if (!analysis?.sufficient) return 0;
  if (/sweep/.test(analysis.liquidity)) return 13;
  if (/Equal/.test(analysis.liquidity)) return 10;
  return analysis.swingHighs.length && analysis.swingLows.length ? 7 : 3;
}

function volatilityScore(analysis) {
  if (!analysis?.sufficient || analysis.volatility === "Unavailable" || analysis.volatility === "Extreme") return 0;
  if (analysis.volatility === "Normal") return 9;
  if (analysis.volatility === "High") return analysis.breakout ? 7 : 5;
  return analysis.range ? 5 : 3;
}

function confirmationScore(analysis) {
  if (!analysis?.sufficient || analysis.setupType === "No Valid Setup") return 0;
  if (analysis.breakout) return 13;
  if (/sweep/.test(analysis.liquidity) && analysis.pullback) return 12;
  if (analysis.pullback) return 10;
  if (analysis.direction !== "Neutral" && analysis.structure !== "Mixed Structure") return 8;
  return 3;
}

function roundPrice(value, precision = 5) {
  if (!Number.isFinite(value)) return null;
  const factor = 10 ** Math.min(Math.max(Number(precision) || 5, 0), 8);
  return Math.round(value * factor) / factor;
}

export function buildDeterministicTradePlan(analysis, metadata = {}, dataQuality = "Unavailable") {
  if (!analysis?.sufficient || !["Bullish", "Bearish"].includes(analysis.direction)) return null;
  if (!["Verified", "Delayed"].includes(dataQuality) || !Number.isFinite(analysis.atr) || analysis.atr <= 0) return null;

  const bullish = analysis.direction === "Bullish";
  const invalidationSwing = bullish ? analysis.swingLows?.at(-1)?.price : analysis.swingHighs?.at(-1)?.price;
  if (!Number.isFinite(invalidationSwing) || !Number.isFinite(analysis.close)) return null;

  const precision = metadata.pricePrecision ?? metadata.precision ?? 5;
  const anchor = Number.isFinite(analysis.ema20) ? analysis.ema20 : analysis.close;
  const entryCenter = bullish ? Math.min(analysis.close, anchor) : Math.max(analysis.close, anchor);
  const entryHalfWidth = analysis.atr * 0.15;
  const entryLow = entryCenter - entryHalfWidth;
  const entryHigh = entryCenter + entryHalfWidth;
  const stopLoss = bullish
    ? Math.min(invalidationSwing - analysis.atr * 0.2, entryLow - analysis.atr * 0.5)
    : Math.max(invalidationSwing + analysis.atr * 0.2, entryHigh + analysis.atr * 0.5);
  const entryReference = bullish ? entryHigh : entryLow;
  const risk = bullish ? entryReference - stopLoss : stopLoss - entryReference;
  if (!Number.isFinite(risk) || risk <= 0) return null;

  const target = (multiple) => bullish ? entryReference + risk * multiple : entryReference - risk * multiple;
  return {
    status: "preliminary",
    method: "H1 ATR + confirmed swing invalidation",
    entryZone: {
      low: roundPrice(Math.min(entryLow, entryHigh), precision),
      high: roundPrice(Math.max(entryLow, entryHigh), precision),
    },
    entryReference: roundPrice(entryReference, precision),
    stopLoss: roundPrice(stopLoss, precision),
    takeProfit1: roundPrice(target(1), precision),
    takeProfit2: roundPrice(target(2), precision),
    takeProfit3: roundPrice(target(3), precision),
    riskReward: "1:3",
    invalidation: bullish ? "H1 close below the stop-loss reference" : "H1 close above the stop-loss reference",
    requiresConfirmation: true,
  };
}

export function qualityBand(score, hardReject, { high = 75, medium = 50 } = {}) {
  if (hardReject || score <= 0) return "No Valid Setup";
  if (score >= high) return "High";
  if (score >= medium) return "Medium";
  return "Low";
}

export function scoreSymbol({ symbol, metadata, analyses, dataQuality, freshness, scanTimestamp, minimumScore = 1 }) {
  const selected = analyses.H1;
  const alignment = multiTimeframeAlignment(analyses);
  const tradePlan = buildDeterministicTradePlan(selected, metadata, dataQuality);
  const components = {
    trendAlignment: alignment.score,
    marketStructure: structureScore(selected),
    liquidityContext: liquidityScore(selected),
    volatilitySuitability: volatilityScore(selected),
    setupConfirmation: confirmationScore(selected),
    riskRewardQuality: tradePlan ? 10 : 0,
    macroRisk: 0,
    newsRisk: 0,
  };
	const rawScore = Object.values(components).reduce((sum, value) => sum + value, 0);
	const dataQualityPenalty = dataQuality === "Delayed" ? 10 : dataQuality === "Partial" ? 20 : 0;
	const adjustedScore = Math.max(0, rawScore - dataQualityPenalty);
  const rejectionReasons = [];
  if (![analyses.D1, analyses.H4, analyses.H1].every((analysis) => analysis?.sufficient)) rejectionReasons.push("Required D1/H4/H1 data unavailable");
  if (["Unavailable", "Demo"].includes(dataQuality)) rejectionReasons.push("Reliable production data unavailable");
  if (freshness === "stale") rejectionReasons.push("Required candle data is critically stale");
  if (selected?.volatility === "Extreme") rejectionReasons.push("Extreme volatility");
  if (!selected || selected.setupType === "No Valid Setup") rejectionReasons.push("No valid deterministic setup");
  if (alignment.score === 5 && selected?.direction === "Neutral") rejectionReasons.push("Trend conflict invalidates setup");
  if (components.setupConfirmation === 0) rejectionReasons.push("Setup confirmation failed");
	if (adjustedScore < minimumScore) rejectionReasons.push("Opportunity score below configured minimum");
	const hardReject = rejectionReasons.length > 0;
	const score = hardReject ? 0 : adjustedScore;
  const confirmation = components.setupConfirmation >= 13 ? "Confirmed" : components.setupConfirmation >= 8 ? "Waiting Confirmation" : components.setupConfirmation > 0 ? "Early Setup" : "Failed";
  const risk = selected?.volatility === "Extreme" ? "Extreme" : dataQuality === "Partial" || alignment.status === "Conflicting" ? "High" : selected?.volatility === "High" ? "High" : "Moderate";
  return {
    id: `${symbol}-${scanTimestamp}`,
    symbol,
    asset: symbol,
    market: metadata.displayName,
    category: metadata.assetClass === "forex" ? "Forex" : metadata.assetClass === "metal" ? "Gold" : metadata.assetClass === "crypto" ? "Crypto" : metadata.assetClass,
    selectedTimeframe: "H1",
    timeframe: "H1",
    setupType: hardReject ? "No Valid Setup" : selected.setupType,
    bias: selected?.direction || "Neutral",
    marketMode: selected?.range ? "Range" : selected?.pullback ? "Pullback" : selected?.breakout ? "Breakout" : "Trend Continuation",
    trendStrength: selected?.adx == null ? "Unavailable" : selected.adx >= 30 ? "Strong" : selected.adx >= 20 ? "Moderate" : "Weak",
    trend: selected?.direction || "Neutral",
    multiTimeframeAlignment: alignment.status,
    alignment: alignment.status,
    structureStatus: selected?.structure || "Unavailable",
    liquidityContext: selected?.liquidity || "Unavailable",
    volatilityCondition: selected?.volatility || "Unavailable",
    setupConfirmation: confirmation,
    confirmation,
    riskRewardStatus: tradePlan ? "Available · Preliminary" : "Unavailable",
    rr: tradePlan?.riskReward || "Unavailable",
    opportunityScore: score,
    score,
    setupQualityBand: qualityBand(score, hardReject),
    band: qualityBand(score, hardReject),
    riskLevel: risk,
    risk,
    confirmationRequired: confirmation === "Confirmed" ? "Monitor structure follow-through" : "Wait for deterministic confirmation",
    entryZone: tradePlan?.entryZone || null,
    stopLoss: tradePlan?.stopLoss ?? null,
    takeProfit1: tradePlan?.takeProfit1 ?? null,
    takeProfit2: tradePlan?.takeProfit2 ?? null,
    takeProfit3: tradePlan?.takeProfit3 ?? null,
    tradePlan,
    invalidationContext: tradePlan?.invalidation || "Exact level unavailable — chart confirmation required",
    mainFactor: hardReject ? rejectionReasons[0] : `${alignment.status}; ${selected.structure}; ${selected.setupType}.`,
    mainRisk: tradePlan
      ? "Levels are deterministic planning references from H1 candles, not executable signals. Macro and News confirmation remain required."
      : "RR, Macro and News inputs are unavailable; technical score is capped at 90/100.",
		dataQuality,
		dataCompleteness: dataQuality,
		dataQualityPenalty,
		missingFactors: [...(tradePlan ? [] : ["Risk/Reward", "Execution levels"]), "Macro", "News"],
    freshness,
    scanTimestamp,
		source: "Twelve Data candles · Deterministic Scanner v1",
		analysisSource: "Twelve Data candles · Deterministic Scanner v1",
    components,
    hardReject,
    rejectionReason: rejectionReasons.join("; ") || null,
    macroRisk: "Unavailable",
    newsRisk: "Unavailable",
    activeMetric: selected?.volatility === "High" ? "High Volatility" : "Scanner Result",
  };
}
