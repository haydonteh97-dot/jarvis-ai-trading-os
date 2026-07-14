import { calculateVisionConfidence, confidenceBreakdown } from "./confidence.js";
import { createEvidence, safeText } from "./evidence.js";
import { getMockFixture } from "./mock-fixtures.js";
import { createObservationContract, emptyObservations } from "./observation-model.js";
import { analysisKey, getAnalysis, getCachedAnalysis, saveAnalysis } from "./observation-cache.js";
import { validateAnalysisRequest, validateLiveProviderResult, validateProviderObservations } from "./observation-validation.js";
import { resolveChartContext } from "./context-resolution.js";
import { verifyObservationContext } from "./verification.js";
import { getVisionConfig } from "./validation.js";
import { enforceVisionRateLimit, withVisionConcurrency } from "./rate-limit.js";

function filterObservations(observations, requested) {
  const mapping = { trend: "trend", structure: "marketStructure", swings: "swings", support_resistance: "supportResistance", range: "ranges", breakout: "breakouts", retest: "retests", bos: "bos", mss: "mss", liquidity: "liquidityZones", liquidity_sweep: "liquiditySweeps", fair_value_gap: "fairValueGaps", order_block: "orderBlocks", premium_discount: "premiumDiscount", indicators: "visibleIndicators", annotations: "annotations", trade_levels: "visibleTradeLevels" };
  const filtered = emptyObservations();
  for (const name of requested) filtered[mapping[name]] = observations[mapping[name]];
  return filtered;
}
function summaryFor(source, observations, overall, upload) {
  const trendValue = observations.trend?.direction || "unavailable";
  const structureValue = observations.marketStructure?.state || "unavailable";
  const conflicting = source?.decisionStatus === "conflicting";
  return { currentView: structureValue === "bullish_pullback" ? "Bullish Pullback" : structureValue === "bearish_pullback" ? "Bearish Pullback" : structureValue === "range" ? "Range" : "No Clear Structure", trendObservation: trendValue, structureObservation: structureValue, strongestEvidence: [], mainRisk: source?.uncertainties?.[0] || "Visual observations require market-data verification.", confirmationRequired: upload.chartContext.asset && upload.chartContext.timeframe ? "Market-data verification" : "Confirm asset and timeframe", decisionStatus: conflicting ? "conflicting" : source?.decisionStatus || "unavailable", visionConfidence: overall };
}
export function createObservationService({ visionEngine, env = {} }) {
  const config = getVisionConfig(env);
  return {
    getAnalysis,
    async analyse(input, ownerId = "anonymous-session") {
      enforceVisionRateLimit(ownerId, "analysis", config.analysesPerMinute);
      return withVisionConcurrency(ownerId, "analysis", config.maxActiveAnalyses, async () => {
      const request = validateAnalysisRequest(input);
      const upload = visionEngine.getUpload(request.imageId);
      if (!upload) throw Object.assign(new Error("Image not found."), { code: "VISION_IMAGE_NOT_FOUND" });
      if ((upload.ownerId || "anonymous-session") !== ownerId) throw Object.assign(new Error("Access denied."), { code: "VISION_ACCESS_DENIED" });
      await visionEngine.getImageMetadata(upload.id, ownerId);
      const key = analysisKey({ ownerId, imageHash: upload.contentHash, ...request });
      const cached = getCachedAnalysis(key); if (cached) return { analysis: cached, cached: true };
      if (request.fixture && visionEngine.providerMode !== "mock") throw Object.assign(new Error("Demo fixtures are unavailable in Live mode."), { code: "VISION_INVALID_REQUEST" });
      const fixture = request.fixture ? getMockFixture(request.fixture) : null;
      if (request.fixture && !fixture) throw Object.assign(new Error("Unknown Demo fixture."), { code: "VISION_INVALID_REQUEST" });
      const providerResult = visionEngine.providerMode === "mock" ? fixture : validateLiveProviderResult(await visionEngine.analyseWithProvider(upload, ownerId, request));
      const source = providerResult || { observations: emptyObservations(), confidence: {}, uncertainties: ["No live Vision provider is connected."], warnings: ["Demo foundation only. No chart observation was produced from image pixels."], decisionStatus: "unavailable", imageQuality: upload.imageQuality, dataStatus: "demo", provider: visionEngine.providerName };
      const rawObservations = validateProviderObservations(source.observations || emptyObservations());
      const observations = filterObservations(rawObservations, request.requestedObservations);
      const metrics = fixture ? { context: fixture.contextConfidence, trend: fixture.trendConfidence, structure: fixture.structureConfidence, liquidity: fixture.liquidityConfidence, levels: fixture.levelConfidence } : source.confidence || {};
      const overall = calculateVisionConfidence({ imageQuality: source.imageQuality || upload.imageQuality, ...metrics, verification: 0, conflicts: source.decisionStatus === "conflicting" ? 1 : 0 });
      const preliminary = { observations };
      const resolved = resolveChartContext({ user: upload.chartContext, provider: source.chartContext || {} });
      const analysisUpload = { ...upload, chartContext: { ...upload.chartContext, asset: resolved.asset, timeframe: resolved.timeframe, platform: resolved.platform } };
      const verification = request.verifyWithMarketData ? await verifyObservationContext({ upload: analysisUpload, observation: preliminary, env }) : { marketDataStatus: "unavailable", assetVerified: false, timeframeVerified: false, priceScaleVerified: false, conflicts: [] };
      const analysisId = `vision-analysis-${crypto.randomUUID()}`;
      const fixtureEvidence = fixture?.evidence?.length ? fixture.evidence : fixture ? [{ evidenceId: `evidence-${crypto.randomUUID()}`, type: "metadata", label: "demo_fixture", description: "Deterministic Demo fixture supplied this provider-reported observation.", coordinates: { x: null, y: null, width: null, height: null }, normalisedCoordinates: { x: null, y: null, width: null, height: null }, observationType: "provider_reported", confidence: overall, source: "mock_vision_provider" }] : (source.evidence || []).map((item) => createEvidence({ ...item, description: safeText(item.description, 240), source: "openai_vision" }));
      const confidenceSource = fixture || { contextConfidence: metrics.context, trendConfidence: metrics.trend, structureConfidence: metrics.structure, liquidityConfidence: metrics.liquidity, levelConfidence: metrics.levels };
      const analysis = createObservationContract({ analysisId, upload: analysisUpload, observations, evidence: fixtureEvidence, confidence: confidenceBreakdown(overall, confidenceSource), uncertainties: (source.uncertainties || []).map((item) => safeText(item, 240)), warnings: (source.warnings || []).map((item) => safeText(item, 240)), summary: summaryFor(source, observations, overall, analysisUpload), verification, provider: source.provider || visionEngine.providerName, dataStatus: source.dataStatus || (fixture ? "demo" : "preliminary"), model: source.model || null });
      analysis.schemaVersion = config.schemaVersion; analysis.analysisVersion = config.analysisVersion; analysis.updatedAt = analysis.createdAt;
      analysis.expiresAt = new Date(Date.now() + config.analysisRetentionDays * 86_400_000).toISOString();
      Object.defineProperty(analysis, "ownerId", { value: ownerId, enumerable: false });
      await visionEngine.markAnalysisReady(upload.id, ownerId);
      return { analysis: saveAnalysis(key, analysis), cached: false };
      });
    },
    async verify(id, ownerId) {
      const analysis = getAnalysis(id); if (!analysis) throw Object.assign(new Error("Analysis not found."), { code: "VISION_ANALYSIS_NOT_FOUND" });
      if (analysis.ownerId !== ownerId) throw Object.assign(new Error("Access denied."), { code: "VISION_ACCESS_DENIED" });
      const upload = visionEngine.getUpload(analysis.imageId);
      const verification = await verifyObservationContext({ upload, observation: analysis, env });
      return { ...analysis, verification, confidence: { ...analysis.confidence, overall: Math.max(0, analysis.confidence.overall - verification.conflicts.length * 10) } };
    }
  };
}
