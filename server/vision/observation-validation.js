import { REQUESTABLE_OBSERVATIONS, TREND_VALUES, STRUCTURE_VALUES } from "./observation-model.js";
import { safeText } from "./evidence.js";
export function validateAnalysisRequest(input = {}) {
  if (!input.imageId || typeof input.imageId !== "string") throw Object.assign(new Error("Image ID is required."), { code: "VISION_INVALID_REQUEST" });
  const requested = input.requestedObservations?.length ? input.requestedObservations : REQUESTABLE_OBSERVATIONS;
  if (!Array.isArray(requested) || requested.some((name) => !REQUESTABLE_OBSERVATIONS.includes(name))) throw Object.assign(new Error("Unsupported observation request."), { code: "VISION_INVALID_REQUEST" });
  const fixture = input.fixture == null ? null : safeText(input.fixture, 50);
  return { imageId: input.imageId, userContext: input.userContext || {}, requestedObservations: [...new Set(requested)], verifyWithMarketData: Boolean(input.verifyWithMarketData), fixture };
}
export function validateProviderObservations(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Object.assign(new Error("Invalid provider observations."), { code: "VISION_INVALID_RESPONSE" });
  if (value.trend?.direction && !TREND_VALUES.includes(value.trend.direction)) throw Object.assign(new Error("Invalid trend observation."), { code: "VISION_INVALID_RESPONSE" });
  if (value.marketStructure?.state && !STRUCTURE_VALUES.includes(value.marketStructure.state)) throw Object.assign(new Error("Invalid structure observation."), { code: "VISION_INVALID_RESPONSE" });
  const arrays = ["swings", "supportResistance", "ranges", "breakouts", "retests", "bos", "mss", "liquidityZones", "liquiditySweeps", "fairValueGaps", "orderBlocks", "visibleIndicators", "annotations"];
  for (const key of arrays) if (value[key] && (!Array.isArray(value[key]) || value[key].length > 50)) throw Object.assign(new Error(`Invalid ${key} observations.`), { code: "VISION_INVALID_RESPONSE" });
  const safe = structuredClone(value);
  // A visual provider may observe annotated zones, but cannot establish executable trade levels.
  safe.visibleTradeLevels = null;
  return safe;
}

export function validateLiveProviderResult(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Object.assign(new Error("Invalid provider result."), { code: "VISION_INVALID_RESPONSE" });
  if (!value.chartContext || !value.confidence || !Array.isArray(value.evidence) || !Array.isArray(value.uncertainties) || !Array.isArray(value.warnings)) throw Object.assign(new Error("Incomplete provider result."), { code: "VISION_INVALID_RESPONSE" });
  if (!["Excellent", "Good", "Fair", "Poor", "Unreadable"].includes(value.imageQuality)) throw Object.assign(new Error("Invalid provider image quality."), { code: "VISION_INVALID_RESPONSE" });
  if (!["preliminary", "chart_required", "better_image_required", "confirmation_required", "market_data_verification_required", "conflicting", "no_clear_structure", "unavailable"].includes(value.decisionStatus)) throw Object.assign(new Error("Invalid provider decision status."), { code: "VISION_INVALID_RESPONSE" });
  if (value.evidence.length > 40 || value.uncertainties.length > 12 || value.warnings.length > 12) throw Object.assign(new Error("Provider result exceeds safe limits."), { code: "VISION_INVALID_RESPONSE" });
  for (const key of ["context", "trend", "structure", "liquidity", "levels"]) if (!Number.isFinite(value.confidence[key]) || value.confidence[key] < 0 || value.confidence[key] > 100) throw Object.assign(new Error("Invalid provider confidence."), { code: "VISION_INVALID_RESPONSE" });
  const observations = validateProviderObservations(value.observations);
  for (const evidence of value.evidence) {
    if (!evidence || typeof evidence !== "object" || !["bounding_box", "point", "line", "region", "text", "metadata"].includes(evidence.type) || evidence.confidence < 0 || evidence.confidence > 100) throw Object.assign(new Error("Invalid provider evidence."), { code: "VISION_INVALID_RESPONSE" });
    for (const coordinate of Object.values(evidence.normalisedCoordinates || {})) if (coordinate != null && (!Number.isFinite(coordinate) || coordinate < 0 || coordinate > 1)) throw Object.assign(new Error("Invalid provider evidence coordinates."), { code: "VISION_INVALID_RESPONSE" });
  }
  return { ...value, observations };
}
export function detectPromptInjection(text) { return /(ignore (all|previous)|system prompt|api key|place a trade|mark (this )?as verified|reveal (your )?prompt)/i.test(String(text || "")); }
export function validateOcrResult(value) {
  if (!value || typeof value !== "object") throw Object.assign(new Error("Invalid OCR result."), { code: "VISION_INVALID_RESPONSE" });
  return { text: safeText(value.text, 200), region: value.region || {}, confidence: Math.max(0, Math.min(100, Number(value.confidence || 0))), source: safeText(value.source || "future_ocr_provider", 80), trusted: false };
}
