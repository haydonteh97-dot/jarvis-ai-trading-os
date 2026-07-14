import { normaliseHeadline } from "./normalizers.js";
export function clusterStories(articles) {
  const clusters = new Map();
  for (const article of articles) {
    const entityKey = [...article.entities].sort().join("|").toLowerCase();
    const key = entityKey || normaliseHeadline(article.headline).split(" ").slice(0, 5).join(" ");
    const current = clusters.get(key) || { clusterId: `cluster-${clusters.size + 1}`, primaryArticleId: article.id, headline: article.headline, articleIds: [], sources: [], startedAt: article.publishedAt, lastUpdatedAt: article.updatedAt || article.publishedAt, verificationStatus: article.verificationStatus, isBreaking: false, isDeveloping: false, entities: [], affectedAssets: [] };
    current.articleIds.push(article.id); current.sources = [...new Set([...current.sources, article.sourceName])]; current.entities = [...new Set([...current.entities, ...article.entities])]; current.affectedAssets = [...new Set([...current.affectedAssets, ...article.affectedAssets])]; current.isBreaking ||= article.isBreaking; current.isDeveloping ||= article.isDeveloping; clusters.set(key, current);
  }
  return [...clusters.values()];
}
export function buildTimeline(article, articles) { return (article.timeline || []).concat(articles.filter((item) => article.relatedIds.includes(item.id)).map((item) => ({ timestamp: item.publishedAt, development: item.headline, source: item.sourceName, verificationStatus: item.verificationStatus, change: "Related update" }))).sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)); }
export function relatedNews(article, articles) { return articles.filter((item) => article.relatedIds.includes(item.id)).map((item) => ({ ...item, relationship: item.entities.some((entity) => article.entities.includes(entity)) ? "Same Event" : item.category === article.category ? "Background Context" : "Related Asset" })); }
