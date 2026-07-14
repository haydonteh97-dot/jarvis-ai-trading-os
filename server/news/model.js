export const NEWS_CATEGORIES = Object.freeze(["forex", "gold", "crypto", "stocks", "economy", "central_banks", "geopolitics", "energy", "technology", "ai", "regulation", "commodities", "indices", "other"]);
export const NEWS_IMPACTS = Object.freeze(["high", "medium", "low", "unclear", "insufficient_data"]);
export const VERIFICATION_STATUSES = Object.freeze(["verified", "preliminary", "unverified", "conflicting_reports", "demo", "unavailable"]);
export const NEWS_DATA_STATUSES = Object.freeze(["verified", "delayed", "preliminary", "unverified", "demo", "unavailable"]);
export function createNewsArticle(input = {}) {
  return {
    id: String(input.id || ""), headline: String(input.headline || ""), sourceName: input.sourceName || null,
    sourceId: input.sourceId || null, sourceUrl: input.sourceUrl || null, articleUrl: input.articleUrl || null,
    publishedAt: input.publishedAt || null, updatedAt: input.updatedAt || null, timezone: input.timezone || "UTC",
    category: input.category || "other", subcategories: Array.isArray(input.subcategories) ? input.subcategories : [],
    language: input.language || "en", summary: input.summary || null, verificationStatus: input.verificationStatus || "unavailable",
    dataStatus: input.dataStatus || "unavailable", impact: input.impact || "insufficient_data", impactHorizon: input.impactHorizon || "unclear",
    isBreaking: Boolean(input.isBreaking), isDeveloping: Boolean(input.isDeveloping), entities: Array.isArray(input.entities) ? input.entities : [],
    affectedAssets: Array.isArray(input.affectedAssets) ? input.affectedAssets : [], marketSentiment: input.marketSentiment || "insufficient_data",
    riskLevel: input.riskLevel || "insufficient_data", analysisSource: input.analysisSource || null,
    lastVerifiedAt: input.lastVerifiedAt || null, timeline: Array.isArray(input.timeline) ? input.timeline : [], relatedIds: Array.isArray(input.relatedIds) ? input.relatedIds : [],
  };
}
