const nullableString = { type: ["string", "null"] };
const confidence = { type: "number", minimum: 0, maximum: 100 };
const region = {
  type: ["object", "null"],
  properties: { x: { type: ["number", "null"], minimum: 0, maximum: 1 }, y: { type: ["number", "null"], minimum: 0, maximum: 1 }, width: { type: ["number", "null"], minimum: 0, maximum: 1 }, height: { type: ["number", "null"], minimum: 0, maximum: 1 } },
  required: ["x", "y", "width", "height"], additionalProperties: false,
};
const priceRange = {
  type: ["object", "null"],
  properties: { lower: { type: ["number", "null"] }, upper: { type: ["number", "null"] }, status: { type: "string", enum: ["vision_observation", "unavailable"] } },
  required: ["lower", "upper", "status"], additionalProperties: false,
};
const observationItem = {
  type: "object",
  properties: {
    type: nullableString, direction: nullableString, label: nullableString, state: nullableString,
    confidence, observationType: { type: "string", enum: ["observed", "inferred", "provider_reported", "unavailable"] },
    mainUncertainty: nullableString, region, priceRange,
  },
  required: ["type", "direction", "label", "state", "confidence", "observationType", "mainUncertainty", "region", "priceRange"], additionalProperties: false,
};
const itemArray = { type: "array", maxItems: 30, items: observationItem };

export const OPENAI_VISION_SCHEMA = Object.freeze({
  type: "object",
  properties: {
    chartContext: {
      type: "object",
      properties: { asset: nullableString, timeframe: nullableString, platform: nullableString },
      required: ["asset", "timeframe", "platform"], additionalProperties: false,
    },
    imageQuality: { type: "string", enum: ["Excellent", "Good", "Fair", "Poor", "Unreadable"] },
    confidence: {
      type: "object",
      properties: { context: confidence, trend: confidence, structure: confidence, liquidity: confidence, levels: confidence },
      required: ["context", "trend", "structure", "liquidity", "levels"], additionalProperties: false,
    },
    observations: {
      type: "object",
      properties: {
        trend: { type: ["object", "null"], properties: { direction: { type: "string", enum: ["bullish", "bearish", "neutral", "range", "mixed", "unclear", "unavailable"] }, strengthAppearance: nullableString, confidence, observationType: { type: "string", enum: ["observed", "inferred", "provider_reported", "unavailable"] }, mainUncertainty: nullableString }, required: ["direction", "strengthAppearance", "confidence", "observationType", "mainUncertainty"], additionalProperties: false },
        marketStructure: { type: ["object", "null"], properties: { state: { type: "string", enum: ["bullish_structure", "bearish_structure", "bullish_pullback", "bearish_pullback", "bullish_consolidation", "bearish_consolidation", "range", "transition", "unclear", "unavailable"] }, confidence, observationType: { type: "string", enum: ["observed", "inferred", "provider_reported", "unavailable"] }, mainUncertainty: nullableString }, required: ["state", "confidence", "observationType", "mainUncertainty"], additionalProperties: false },
        swings: itemArray, supportResistance: itemArray, ranges: itemArray, breakouts: itemArray, retests: itemArray, bos: itemArray, mss: itemArray, liquidityZones: itemArray, liquiditySweeps: itemArray, fairValueGaps: itemArray, orderBlocks: itemArray, visibleIndicators: itemArray, annotations: itemArray,
        premiumDiscount: { type: ["object", "null"], properties: { currentArea: { type: "string", enum: ["premium", "discount", "equilibrium", "unavailable"] }, confidence, observationType: { type: "string", enum: ["observed", "inferred", "provider_reported", "unavailable"] }, mainUncertainty: nullableString }, required: ["currentArea", "confidence", "observationType", "mainUncertainty"], additionalProperties: false },
        visibleTradeLevels: { type: "null" },
      },
      required: ["trend", "marketStructure", "swings", "supportResistance", "ranges", "breakouts", "retests", "bos", "mss", "liquidityZones", "liquiditySweeps", "fairValueGaps", "orderBlocks", "premiumDiscount", "visibleIndicators", "annotations", "visibleTradeLevels"], additionalProperties: false,
    },
    evidence: { type: "array", maxItems: 40, items: { type: "object", properties: { type: { type: "string", enum: ["bounding_box", "point", "line", "region", "text", "metadata"] }, label: { type: "string", maxLength: 80 }, description: { type: "string", maxLength: 240 }, normalisedCoordinates: region, observationType: { type: "string", enum: ["observed", "inferred", "provider_reported", "unavailable"] }, confidence }, required: ["type", "label", "description", "normalisedCoordinates", "observationType", "confidence"], additionalProperties: false } },
    uncertainties: { type: "array", maxItems: 12, items: { type: "string", maxLength: 240 } },
    warnings: { type: "array", maxItems: 12, items: { type: "string", maxLength: 240 } },
    decisionStatus: { type: "string", enum: ["preliminary", "chart_required", "better_image_required", "confirmation_required", "market_data_verification_required", "conflicting", "no_clear_structure", "unavailable"] },
  },
  required: ["chartContext", "imageQuality", "confidence", "observations", "evidence", "uncertainties", "warnings", "decisionStatus"], additionalProperties: false,
});
