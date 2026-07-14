export const MACRO_IMPACTS = Object.freeze(["high", "medium", "low", "unknown"]);
export const RELEASE_STATUSES = Object.freeze(["upcoming", "released", "delayed", "revised", "cancelled", "unavailable"]);
export const DATA_STATUSES = Object.freeze(["verified", "delayed", "preliminary", "demo", "unavailable"]);
export const SUPPORTED_CURRENCIES = Object.freeze(["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY"]);
export const SUPPORTED_CATEGORIES = Object.freeze(["inflation", "employment", "growth", "central_bank", "consumer", "manufacturing", "housing", "energy", "trade", "government", "other"]);

export function createMacroEvent(input) {
  return {
    id: String(input.id || ""), title: String(input.title || ""), country: input.country || null,
    currency: input.currency || null, category: input.category || "other", impact: input.impact || "unknown",
    scheduledAt: input.scheduledAt || null, timezone: input.timezone || "UTC", previous: input.previous ?? null,
    forecast: input.forecast ?? null, actual: input.actual ?? null, revisedPrevious: input.revisedPrevious ?? null,
    unit: input.unit || null, releaseStatus: input.releaseStatus || "unavailable", source: input.source || null,
    verificationStatus: input.verificationStatus || "unavailable", dataStatus: input.dataStatus || "unavailable",
    lastUpdated: input.lastUpdated || null, dateRange: input.dateRange || null,
  };
}
