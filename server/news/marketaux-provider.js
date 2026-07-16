import { NewsDataProvider } from "./provider.js";
import { normaliseNewsArticle } from "./normalizers.js";

const DEFAULT_BASE_URL = "https://api.marketaux.com/v1";
const SUPPORTED_CATEGORIES = Object.freeze([
  "forex", "gold", "crypto", "stocks", "economy", "central_banks",
  "geopolitics", "energy", "technology", "ai", "regulation",
  "commodities", "indices", "other",
]);

function coded(code, message, options = {}) {
  const error = new Error(message);
  error.code = code;
  error.retryable = Boolean(options.retryable);
  return error;
}

function classifyError(status, payload) {
  const providerCode = String(payload?.error?.code || "").toLowerCase();
  if (status === 401 || status === 403 || providerCode.includes("auth") || providerCode.includes("token")) {
    return coded("NEWS_DATA_AUTH_FAILED", "MarketAux authentication failed.");
  }
  if (status === 429 || providerCode.includes("limit") || providerCode.includes("quota")) {
    return coded("NEWS_DATA_RATE_LIMITED", "MarketAux request limit reached.", { retryable: true });
  }
  return coded("NEWS_DATA_UNAVAILABLE", "MarketAux is temporarily unavailable.", { retryable: status >= 500 });
}

function categoryFor(article) {
  const text = [
    article.title, article.description, article.snippet,
    ...(Array.isArray(article.keywords) ? article.keywords : []),
    ...(Array.isArray(article.entities) ? article.entities.map((item) => `${item?.name || ""} ${item?.type || ""} ${item?.industry || ""}`) : []),
  ].join(" ").toLowerCase();
  if (/\b(gold|xau|precious metal)\b/.test(text)) return "gold";
  if (/\b(bitcoin|ethereum|crypto|digital asset|blockchain)\b/.test(text)) return "crypto";
  if (/\b(federal reserve|fed |ecb|bank of england|boj|central bank|interest rate)\b/.test(text)) return "central_banks";
  if (/\b(oil|crude|brent|wti|natural gas|energy)\b/.test(text)) return "energy";
  if (/\b(geopolitic|war|sanction|conflict|military)\b/.test(text)) return "geopolitics";
  if (/\b(forex|currency|dollar|euro|sterling|yen|fx)\b/.test(text)) return "forex";
  if (/\b(regulation|regulator|sec |lawsuit|antitrust)\b/.test(text)) return "regulation";
  if (/\b(artificial intelligence| ai |semiconductor|technology|software)\b/.test(` ${text} `)) return "technology";
  if (/\b(stock|shares|equity|earnings|nasdaq|s&p)\b/.test(text)) return "stocks";
  if (/\b(inflation|employment|gdp|economy|economic|recession|growth)\b/.test(text)) return "economy";
  return "other";
}

function affectedAssetsFor(article, category) {
  const symbols = new Set();
  for (const entity of Array.isArray(article.entities) ? article.entities : []) {
    const symbol = String(entity?.symbol || "").toUpperCase();
    if (["BTC", "BTCUSD"].includes(symbol)) symbols.add("BTCUSD");
    if (["ETH", "ETHUSD"].includes(symbol)) symbols.add("ETHUSD");
    if (["DXY", "DX-Y.NYB"].includes(symbol)) symbols.add("DXY");
    if (["XAU", "XAUUSD", "GC=F"].includes(symbol)) symbols.add("XAUUSD");
    if (["WTI", "CL=F"].includes(symbol)) symbols.add("WTI");
    if (["BRENT", "BZ=F"].includes(symbol)) symbols.add("BRENT");
  }
  const defaults = {
    gold: ["XAUUSD", "DXY"], crypto: ["BTCUSD", "ETHUSD"],
    forex: ["DXY", "EURUSD", "GBPUSD", "USDJPY"],
    energy: ["WTI", "BRENT"], central_banks: ["DXY", "XAUUSD", "EURUSD", "US100"],
    stocks: ["US100", "US500"], technology: ["US100", "US500"],
  };
  for (const symbol of defaults[category] || []) symbols.add(symbol);
  return [...symbols];
}

function sourceName(article) {
  if (typeof article.source === "string") return article.source;
  return article.source?.name || article.source?.domain || null;
}

export function normaliseMarketAuxArticle(article) {
  const category = categoryFor(article);
  return normaliseNewsArticle({
    id: article.uuid || article.id,
    headline: article.title,
    sourceName: sourceName(article),
    sourceId: article.source?.id || article.source_id || null,
    sourceUrl: article.source?.domain ? `https://${article.source.domain}` : null,
    articleUrl: article.url || null,
    publishedAt: article.published_at || null,
    updatedAt: article.published_at || null,
    timezone: "UTC",
    category,
    language: article.language || "en",
    summary: article.description || article.snippet || null,
    verificationStatus: "verified",
    dataStatus: "verified",
    impact: "unclear",
    impactHorizon: "unclear",
    isBreaking: false,
    isDeveloping: false,
    entities: (article.entities || []).map((item) => item?.name || item?.symbol).filter(Boolean),
    affectedAssets: affectedAssetsFor(article, category),
    marketSentiment: "insufficient_data",
    riskLevel: "insufficient_data",
    analysisSource: "marketaux",
    lastVerifiedAt: new Date().toISOString(),
  });
}

export class MarketAuxNewsProvider extends NewsDataProvider {
  constructor({ apiKey, baseUrl = DEFAULT_BASE_URL, fetchImpl = globalThis.fetch, timeoutMs = 8_000, now = () => Date.now() } = {}) {
    super();
    this.apiKey = String(apiKey || "").trim();
    this.baseUrl = String(baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");
    this.fetchImpl = fetchImpl;
    this.timeoutMs = timeoutMs;
    this.now = now;
    this.lastSuccessfulUpdate = null;
    this.lastFailureCode = this.apiKey ? null : "NEWS_DATA_NOT_CONFIGURED";
  }

  get name() { return "MarketAux"; }
  getSupportedCategories() { return [...SUPPORTED_CATEGORIES]; }
  getSupportedSources() { return ["MarketAux"]; }

  getProviderStatus() {
    if (!this.apiKey) return { status: "disconnected", provider: this.name, configured: false, lastSuccessfulUpdate: null, dataStatus: "unavailable", supportedCategories: this.getSupportedCategories(), supportedSources: this.getSupportedSources(), message: "Live news source not connected." };
    if (this.lastSuccessfulUpdate) return { status: "connected", provider: this.name, configured: true, lastSuccessfulUpdate: this.lastSuccessfulUpdate, dataStatus: "verified", supportedCategories: this.getSupportedCategories(), supportedSources: this.getSupportedSources(), message: "MarketAux connection verified." };
    return { status: this.lastFailureCode ? "error" : "partial", provider: this.name, configured: true, lastSuccessfulUpdate: null, dataStatus: this.lastFailureCode ? "unavailable" : "preliminary", supportedCategories: this.getSupportedCategories(), supportedSources: this.getSupportedSources(), message: this.lastFailureCode ? "MarketAux is configured but the latest request was not verified." : "MarketAux is configured and awaiting verification." };
  }

  async request(parameters = {}) {
    if (!this.apiKey) throw coded("NEWS_DATA_NOT_CONFIGURED", "MarketAux API token is required.");
    const url = new URL(`${this.baseUrl}/news/all`);
    Object.entries({ language: "en", limit: 3, ...parameters, api_token: this.apiKey }).forEach(([key, value]) => {
      if (value != null && value !== "") url.searchParams.set(key, String(value));
    });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(url, { method: "GET", headers: { Accept: "application/json" }, signal: controller.signal });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.error) throw classifyError(response.status, payload);
      if (!Array.isArray(payload?.data)) throw coded("INVALID_PROVIDER_RESPONSE", "MarketAux returned an invalid response.");
      const articles = payload.data.map(normaliseMarketAuxArticle);
      this.lastSuccessfulUpdate = new Date(this.now()).toISOString();
      this.lastFailureCode = null;
      return articles;
    } catch (error) {
      const mapped = error?.name === "AbortError" ? coded("NEWS_DATA_TIMEOUT", "MarketAux request timed out.", { retryable: true }) : error;
      this.lastFailureCode = mapped?.code || "NEWS_DATA_UNAVAILABLE";
      throw mapped?.code ? mapped : coded("NEWS_DATA_UNAVAILABLE", "MarketAux is temporarily unavailable.", { retryable: true });
    } finally {
      clearTimeout(timer);
    }
  }

  async getArticles(filters = {}) {
    const limit = Math.min(Math.max(Number(filters.limit || 3), 1), 3);
    return this.request({ limit, page: filters.page || 1 });
  }

  async getArticleById(id) {
    return (await this.getArticles({ limit: 3 })).find((article) => article.id === id) || null;
  }
}
