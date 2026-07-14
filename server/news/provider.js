export class NewsDataProvider {
  get name() { throw new Error("NewsDataProvider.name must be implemented"); }
  async getArticles() { throw new Error("getArticles must be implemented"); }
  async getArticleById() { throw new Error("getArticleById must be implemented"); }
  async getTopStories(filters) { return this.getArticles(filters); }
  async getBreakingNews(filters) { return (await this.getArticles(filters)).filter((article) => article.isBreaking); }
  async getLatestNews(filters) { return this.getArticles(filters); }
  getProviderStatus() { throw new Error("getProviderStatus must be implemented"); }
  getSupportedCategories() { return []; }
  getSupportedSources() { return []; }
  normaliseArticle(article) { return article; }
  mapCategory(value) { return value; }
  mapVerificationStatus(value) { return value; }
  mapImpact(value) { return value; }
}
export class LiveNewsDataProvider extends NewsDataProvider {
  constructor({ providerName = null } = {}) { super(); this.providerName = providerName; }
  get name() { return this.providerName || "LiveNewsDataProvider"; }
  getProviderStatus() { return { status: "disconnected", provider: this.providerName, configured: false, dataStatus: "unavailable", lastSuccessfulUpdate: null, message: "Live news source not connected." }; }
  async getArticles() { const error = new Error("Live news source not connected."); error.code = "NEWS_DATA_NOT_CONFIGURED"; throw error; }
  async getArticleById() { return this.getArticles(); }
}
