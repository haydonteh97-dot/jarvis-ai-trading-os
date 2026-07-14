const IMPACT_SCORE = { high: 40, medium: 25, low: 10 };
const VERIFICATION_SCORE = { verified: 25, preliminary: 12, demo: 0 };
export function classifyBreaking(article, { now = Date.now(), recencyMs = 30 * 60 * 1000 } = {}) { return Boolean(article.isBreaking && article.impact === "high" && now - Date.parse(article.publishedAt) >= 0 && now - Date.parse(article.publishedAt) <= recencyMs); }
export function topStoryScore(article, { selectedCategory = null } = {}) { return (IMPACT_SCORE[article.impact] || 0) + (VERIFICATION_SCORE[article.verificationStatus] || 0) + (article.isDeveloping ? 10 : 0) + (selectedCategory && article.category === selectedCategory ? 15 : 0) + Math.min(article.affectedAssets.length * 2, 10); }
export function rankTopStories(articles, options = {}) { return [...articles].sort((a, b) => topStoryScore(b, options) - topStoryScore(a, options) || Date.parse(b.publishedAt) - Date.parse(a.publishedAt)); }
