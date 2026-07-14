import { NEWS_CATEGORIES, NEWS_DATA_STATUSES, NEWS_IMPACTS, VERIFICATION_STATUSES } from "./model.js";
const SAFE_PROTOCOLS = new Set(["https:", "http:"]);
export function isSafeNewsUrl(value) { if (!value) return true; try { return SAFE_PROTOCOLS.has(new URL(value).protocol); } catch { return false; } }
export function sanitizeNewsText(value, maximum = 600) { return value == null ? null : String(value).replace(/<[^>]*>/g, "").replace(/[<>]/g, "").trim().slice(0, maximum); }
export function validateNewsArticle(article, { futureToleranceMs = 300000 } = {}) {
  const errors = [];
  if (!article?.id) errors.push("Article ID is required");
  if (!article?.headline) errors.push("Headline is required");
  if (!article?.sourceName) errors.push("Source is required");
  const published = Date.parse(article?.publishedAt);
  if (!Number.isFinite(published)) errors.push("Published timestamp is invalid");
  if (Number.isFinite(published) && published > Date.now() + futureToleranceMs) errors.push("Published timestamp is in the future");
  if (!NEWS_CATEGORIES.includes(article?.category)) errors.push("Category is invalid");
  if (!NEWS_IMPACTS.includes(article?.impact)) errors.push("Impact is invalid");
  if (!VERIFICATION_STATUSES.includes(article?.verificationStatus)) errors.push("Verification status is invalid");
  if (!NEWS_DATA_STATUSES.includes(article?.dataStatus)) errors.push("Data status is invalid");
  if (!isSafeNewsUrl(article?.articleUrl) || !isSafeNewsUrl(article?.sourceUrl)) errors.push("Article URL is unsafe");
  return { valid: errors.length === 0, errors };
}
