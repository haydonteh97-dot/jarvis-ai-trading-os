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

export function qualityBand(score, hardReject, { high = 75, medium = 50 } = {}) {
  if (hardReject || score <= 0) return "No Valid Setup";
  if (score >= high) return "High";
  if (score >= medium) return "Medium";
  return "Low";
}

export function scoreSymbol({ symbol, metadata, analyses, dataQuality, freshness, scanTimestamp, minimumScore = 1 }) {
  const selected = analyses.H1;
  const alignment = multiTimeframeAlignment(analyses);
  const components = {
    trendAlignment: alignment.score,
    marketStructure: structureScore(selected),
    liquidityContext: liquidityScore(selected),
    volatilitySuitability: volatilityScore(selected),
    setupConfirmation: confirmationScore(selected),
    riskRewardQuality: 0,
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
    riskRewardStatus: "Unavailable",
    rr: "Unavailable",
    opportunityScore: score,
    score,
    setupQualityBand: qualityBand(score, hardReject),
    band: qualityBand(score, hardReject),
    riskLevel: risk,
    risk,
    confirmationRequired: confirmation === "Confirmed" ? "Monitor structure follow-through" : "Wait for deterministic confirmation",
    invalidationContext: "Exact level unavailable — chart confirmation required",
    mainFactor: hardReject ? rejectionReasons[0] : `${alignment.status}; ${selected.structure}; ${selected.setupType}.`,
    mainRisk: "RR, Macro and News inputs are unavailable; technical score is capped at 90/100.",
		dataQuality,
		dataCompleteness: dataQuality,
		dataQualityPenalty,
		missingFactors: ["Risk/Reward", "Macro", "News", "Execution levels"],
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
