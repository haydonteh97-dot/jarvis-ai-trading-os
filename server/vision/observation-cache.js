const analyses = new Map();
const keys = new Map();
const MAX_ANALYSES = 100;
export function analysisKey({ ownerId, imageHash, requestedObservations, fixture, verifyWithMarketData }) { return [ownerId, imageHash, [...requestedObservations].sort().join(","), fixture || "none", Boolean(verifyWithMarketData)].join(":"); }
export function getCachedAnalysis(key) { const id = keys.get(key), value = id ? analyses.get(id) || null : null; if (value?.expiresAt && Date.parse(value.expiresAt) <= Date.now()) { analyses.delete(id); keys.delete(key); return null; } return value; }
export function saveAnalysis(key, value) { analyses.set(value.analysisId, value); keys.set(key, value.analysisId); while (analyses.size > MAX_ANALYSES) { const [id] = analyses.entries().next().value; analyses.delete(id); } return value; }
export function getAnalysis(id) { const value = analyses.get(id) || null; if (value?.expiresAt && Date.parse(value.expiresAt) <= Date.now()) { analyses.delete(id); return null; } return value; }
export function deleteAnalysesForImage(imageId) { for (const [id, analysis] of analyses) if (analysis.imageId === imageId) analyses.delete(id); for (const [key, id] of keys) if (!analyses.has(id)) keys.delete(key); }
export function clearObservationCache() { analyses.clear(); keys.clear(); }
