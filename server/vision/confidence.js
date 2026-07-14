export const DEFAULT_CONFIDENCE_WEIGHTS = Object.freeze({ imageQuality: 20, chartContext: 20, trend: 15, structure: 20, liquidityZones: 10, visibleLevels: 5, crossVerification: 10 });
const QUALITY = { Excellent: 1, Good: 0.85, Fair: 0.6, Poor: 0.3, Unreadable: 0 };
export function calculateVisionConfidence(input = {}, weights = DEFAULT_CONFIDENCE_WEIGHTS) {
  const bounded = (value) => Math.max(0, Math.min(100, Number(value || 0))) / 100;
  const components = {
    imageQuality: QUALITY[input.imageQuality] ?? 0,
    chartContext: bounded(input.context), trend: bounded(input.trend), structure: bounded(input.structure), liquidityZones: bounded(input.liquidity), visibleLevels: bounded(input.levels), crossVerification: bounded(input.verification)
  };
  let total = Object.entries(weights).reduce((sum, [key, weight]) => sum + (components[key] || 0) * weight, 0);
  total -= Math.max(0, Number(input.conflicts || 0)) * 10;
  if (input.imageQuality === "Unreadable") total = 0;
  return Math.round(Math.max(0, Math.min(100, total)));
}
export function confidenceBreakdown(overall, fixture = {}) {
  return { overall, context: fixture.contextConfidence || 0, trend: fixture.trendConfidence || 0, structure: fixture.structureConfidence || 0, liquidity: fixture.liquidityConfidence || 0, levels: fixture.levelConfidence || 0 };
}
