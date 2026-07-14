import { createNewsArticle, NEWS_CATEGORIES, NEWS_DATA_STATUSES, NEWS_IMPACTS, VERIFICATION_STATUSES } from "./model.js";
import { sanitizeNewsText, validateNewsArticle } from "./validation.js";
export function mapCategory(value) { const key = String(value || "other").toLowerCase().replace(/[ &-]+/g, "_"); return NEWS_CATEGORIES.includes(key) ? key : "other"; }
export function mapVerificationStatus(value) { const key = String(value || "unavailable").toLowerCase().replace(/\s+/g, "_"); return VERIFICATION_STATUSES.includes(key) ? key : "unavailable"; }
export function mapImpact(value) { const key = String(value || "insufficient_data").toLowerCase().replace(/\s+/g, "_"); return NEWS_IMPACTS.includes(key) ? key : "insufficient_data"; }
export function mapDataStatus(value) { const key = String(value || "unavailable").toLowerCase(); return NEWS_DATA_STATUSES.includes(key) ? key : "unavailable"; }
export function normaliseNewsArticle(input, defaults = {}) {
  const merged = { ...defaults, ...input };
  const article = createNewsArticle({ ...merged, headline: sanitizeNewsText(merged.headline, 240), sourceName: sanitizeNewsText(merged.sourceName, 100), summary: sanitizeNewsText(merged.summary, 600), category: mapCategory(merged.category), impact: mapImpact(merged.impact), verificationStatus: mapVerificationStatus(merged.verificationStatus), dataStatus: mapDataStatus(merged.dataStatus) });
  const validation = validateNewsArticle(article);
  if (!validation.valid) { const error = new Error("JARVIS could not verify the news response."); error.code = "INVALID_PROVIDER_RESPONSE"; error.details = validation.errors; throw error; }
  return article;
}
export function normaliseHeadline(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim(); }
export function deduplicateArticles(articles) {
  const seen = new Map();
  for (const article of articles) {
    const key = article.articleUrl || article.id || `${normaliseHeadline(article.headline)}|${article.sourceName}|${String(article.publishedAt).slice(0, 13)}`;
    const current = seen.get(key);
    if (!current || Date.parse(article.updatedAt || article.publishedAt) >= Date.parse(current.updatedAt || current.publishedAt)) seen.set(key, article);
  }
  return [...seen.values()];
}
