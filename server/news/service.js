import { NewsCache } from "./cache.js";
import { MockNewsDataProvider } from "./mock-provider.js";
import { LiveNewsDataProvider } from "./provider.js";
import { MarketAuxNewsProvider } from "./marketaux-provider.js";
import { deduplicateArticles } from "./normalizers.js";
import { clusterStories, buildTimeline, relatedNews } from "./clustering.js";
import { classifyBreaking, rankTopStories } from "./ranking.js";
import { mapAffectedAssets, templateSummary, templateInterpretation, buildMarketSentiment, newsRisk } from "./intelligence.js";
import { aiAnalysisNewsContext, askJarvisNewsHandoff, scannerNewsRiskContext, tradePlannerNewsRisk } from "./integrations.js";
const ASSETS = ["XAUUSD", "DXY", "EURUSD", "GBPUSD", "USDJPY", "US100", "US500", "BTCUSD", "ETHUSD", "WTI", "BRENT"];
function createProvider(env, mode) {
  if (mode === "mock") return new MockNewsDataProvider();
  const providerName = String(env.NEWS_DATA_PROVIDER || "").toLowerCase();
  if (mode === "live" && providerName === "marketaux") {
    return new MarketAuxNewsProvider({
      apiKey: env.NEWS_DATA_API_KEY,
      baseUrl: env.NEWS_DATA_BASE_URL,
    });
  }
  return new LiveNewsDataProvider({ providerName: env.NEWS_DATA_PROVIDER || null });
}
export class NewsEngine {
  constructor({ env = {}, provider, cache = new NewsCache() } = {}) { this.env = env; this.mode = String(env.NEWS_DATA_MODE || "mock").toLowerCase(); this.provider = provider || createProvider(env, this.mode); this.cache = cache; }
  getStatus() { return this.provider.getProviderStatus(); }
  enrich(article, allArticles = []) { return { ...article, aiSummary: templateSummary(article), interpretation: templateInterpretation(article), affectedAssetContext: mapAffectedAssets(article), sentimentContext: buildMarketSentiment(article), riskContext: newsRisk(article), timelineContext: buildTimeline(article, allArticles), relatedNews: relatedNews(article, allArticles), handoff: askJarvisNewsHandoff(article) }; }
  async getArticles(filters = {}) {
    const limit = Math.min(Math.max(Number(filters.limit || 50), 1), 100); const key = `articles:${JSON.stringify({ ...filters, limit })}`; const cached = this.cache.get(key); if (cached) return { articles: cached, cached: true };
    const all = deduplicateArticles(await this.cache.dedupe(key, () => this.provider.getArticles(filters)));
    const filtered = all.filter((article) => (!filters.category || filters.category === "All" || article.category === filters.category) && (!filters.impact || filters.impact === "All Impact" || article.impact === filters.impact) && (!filters.source || article.sourceId === filters.source || article.sourceName === filters.source) && (!filters.asset || mapAffectedAssets(article).some((entry) => entry.asset === filters.asset))).slice(0, limit);
    const enriched = filtered.map((article) => this.enrich(article, all)); this.cache.set(key, enriched, 60_000); return { articles: enriched, cached: false };
  }
  async getArticleById(id) { const all = (await this.getArticles({ limit: 100 })).articles; return all.find((article) => article.id === id) || null; }
  async getTopStories(filters = {}) { const { articles, cached } = await this.getArticles(filters); return { articles: rankTopStories(articles, { selectedCategory: filters.category }).slice(0, 3), cached }; }
  async getBreaking(filters = {}) { const { articles, cached } = await this.getArticles(filters); return { articles: articles.filter((article) => classifyBreaking(article)), cached }; }
  async getSummary(filters = {}) { const { articles, cached } = await this.getArticles(filters); const categories = new Map(); const assets = new Map(); articles.forEach((article) => { categories.set(article.category, (categories.get(article.category) || 0) + 1); mapAffectedAssets(article).forEach(({ asset }) => assets.set(asset, (assets.get(asset) || 0) + 1)); }); const integrations = { scanner: Object.fromEntries(ASSETS.map((asset) => [asset, scannerNewsRiskContext(articles, asset)])), aiAnalysis: Object.fromEntries(ASSETS.map((asset) => [asset, aiAnalysisNewsContext(articles, asset)])), tradePlanner: Object.fromEntries(ASSETS.map((asset) => [asset, tradePlannerNewsRisk(articles, asset)])) }; return { topStoriesCount: Math.min(articles.length, 3), breakingNewsCount: articles.filter((article) => classifyBreaking(article)).length, highImpactCount: articles.filter((article) => article.impact === "high").length, dominantCategory: [...categories.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null, riskSentiment: "insufficient_data", mostAffectedAssets: [...assets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([asset]) => asset), overallNewsRisk: "insufficient_data", dataStatus: this.getStatus().dataStatus, lastUpdated: null, clusters: clusterStories(articles), integrations, cached }; }
}
export function createNewsEngine(env = {}) { return new NewsEngine({ env }); }
