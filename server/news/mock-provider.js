import { NewsDataProvider } from "./provider.js";
import { normaliseNewsArticle } from "./normalizers.js";
const BASE = { sourceName: "Demo Market Dataset", sourceId: "demo-source", sourceUrl: null, articleUrl: null, timezone: "UTC", language: "en", verificationStatus: "demo", dataStatus: "demo", analysisSource: "mock_news_provider", lastVerifiedAt: null, isBreaking: false };
const FIXTURES = [
  { id: "demo-policy-guidance", headline: "Demo Scenario: Policy Guidance Changes Rate Expectations", publishedAt: "2024-01-15T08:00:00Z", category: "central_banks", impact: "high", impactHorizon: "short_term", summary: "A demonstration scenario showing how policy guidance could alter rate expectations.", entities: ["Policy guidance"], affectedAssets: ["DXY", "XAUUSD", "EURUSD", "US100"], marketSentiment: "mixed", riskLevel: "moderate", relatedIds: ["demo-growth-outlook"] },
  { id: "demo-geopolitical-risk", headline: "Demo Scenario: Geopolitical Risk Raises Defensive Sensitivity", publishedAt: "2024-01-14T10:00:00Z", category: "geopolitics", impact: "high", impactHorizon: "immediate", summary: "A demonstration scenario for safe-haven and energy sensitivity during uncertainty.", entities: ["Geopolitical risk"], affectedAssets: ["XAUUSD", "WTI", "US500"], marketSentiment: "risk_off", riskLevel: "high", relatedIds: ["demo-energy-supply"] },
  { id: "demo-crypto-regulation", headline: "Demo Scenario: Regulatory Update Changes Crypto Risk Perception", publishedAt: "2024-01-13T12:00:00Z", category: "crypto", impact: "medium", impactHorizon: "short_term", summary: "A sample workflow for interpreting how regulation could affect crypto sentiment.", entities: ["Digital assets", "Regulation"], affectedAssets: ["BTCUSD", "ETHUSD"], marketSentiment: "mixed", riskLevel: "moderate" },
  { id: "demo-energy-supply", headline: "Demo Scenario: Supply Concern Increases Oil Sensitivity", publishedAt: "2024-01-12T14:00:00Z", category: "energy", impact: "medium", impactHorizon: "short_term", summary: "A demonstration record for potential transmission from supply risk to energy markets.", entities: ["Energy supply"], affectedAssets: ["WTI", "BRENT"], marketSentiment: "mixed", riskLevel: "moderate", relatedIds: ["demo-geopolitical-risk"] },
  { id: "demo-growth-outlook", headline: "Demo Scenario: Growth Outlook Changes Equity and Currency Caution", publishedAt: "2024-01-11T16:00:00Z", category: "economy", impact: "low", impactHorizon: "medium_term", summary: "A sample economic-outlook story used to validate filtering and related-news behaviour.", entities: ["Growth outlook"], affectedAssets: ["US100", "US500", "DXY"], marketSentiment: "mixed", riskLevel: "low", relatedIds: ["demo-policy-guidance"] },
].map((article) => normaliseNewsArticle(article, BASE));
export class MockNewsDataProvider extends NewsDataProvider {
  get name() { return "MockNewsDataProvider"; }
  getProviderStatus() { return { status: "demo", provider: this.name, configured: true, lastSuccessfulUpdate: null, dataStatus: "demo", supportedCategories: this.getSupportedCategories(), supportedSources: this.getSupportedSources(), message: "Demo news source active." }; }
  getSupportedCategories() { return [...new Set(FIXTURES.map((article) => article.category))]; }
  getSupportedSources() { return ["Demo Market Dataset"]; }
  async getArticles() { return FIXTURES.map((article) => ({ ...article })); }
  async getArticleById(id) { return (await this.getArticles()).find((article) => article.id === id) || null; }
}
