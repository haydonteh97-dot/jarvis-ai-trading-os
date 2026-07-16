import test from "node:test";
import assert from "node:assert/strict";
import { MarketAuxNewsProvider, normaliseMarketAuxArticle } from "../server/news/marketaux-provider.js";
import { NewsEngine } from "../server/news/service.js";

const fixture = {
  uuid: "marketaux-1",
  title: "Gold steadies as investors assess central bank guidance",
  description: "Gold markets remained sensitive to policy expectations.",
  url: "https://example.com/gold-guidance",
  language: "en",
  published_at: "2026-07-16T08:00:00.000000Z",
  source: "Example Financial News",
  entities: [{ symbol: "XAUUSD", name: "Gold", type: "commodity" }],
};

function response(payload, status = 200, headers = {}) {
  return { ok: status >= 200 && status < 300, status, headers: { get: (name) => headers[name.toLowerCase()] || null }, json: async () => payload };
}

test("MarketAux normalisation preserves source facts and avoids fabricated impact", () => {
  const article = normaliseMarketAuxArticle(fixture);
  assert.equal(article.id, "marketaux-1");
  assert.equal(article.category, "gold");
  assert.equal(article.dataStatus, "verified");
  assert.equal(article.impact, "unclear");
  assert.ok(article.affectedAssets.includes("XAUUSD"));
});

test("MarketAux provider requires a server-side token", async () => {
  const provider = new MarketAuxNewsProvider();
  assert.equal(provider.getProviderStatus().configured, false);
  await assert.rejects(provider.getArticles(), { code: "NEWS_DATA_NOT_CONFIGURED" });
});

test("MarketAux provider constructs one bounded request and never exposes the token in output", async () => {
  let requestedUrl;
  const provider = new MarketAuxNewsProvider({
    apiKey: "secret-test-token",
    fetchImpl: async (url) => { requestedUrl = String(url); return response({ data: [fixture] }); },
    now: () => Date.parse("2026-07-16T08:01:00Z"),
  });
  const articles = await provider.getArticles({ limit: 50 });
  assert.equal(new URL(requestedUrl).searchParams.get("limit"), "3");
  assert.equal(new URL(requestedUrl).searchParams.get("api_token"), "secret-test-token");
  assert.equal(JSON.stringify(articles).includes("secret-test-token"), false);
  assert.equal(provider.getProviderStatus().status, "connected");
});

test("MarketAux provider maps authentication, rate-limit, timeout and malformed responses", async () => {
  const auth = new MarketAuxNewsProvider({ apiKey: "x", fetchImpl: async () => response({ error: { code: "invalid_api_token" } }, 401) });
  await assert.rejects(auth.getArticles(), { code: "NEWS_DATA_AUTH_FAILED" });
  const limited = new MarketAuxNewsProvider({ apiKey: "x", fetchImpl: async () => response({ error: { code: "rate_limit_reached" } }, 429) });
  await assert.rejects(limited.getArticles(), { code: "NEWS_DATA_RATE_LIMITED" });
  const malformed = new MarketAuxNewsProvider({ apiKey: "x", fetchImpl: async () => response({ data: null }) });
  await assert.rejects(malformed.getArticles(), { code: "INVALID_PROVIDER_RESPONSE" });
  const timeout = new MarketAuxNewsProvider({ apiKey: "x", fetchImpl: async () => { const error = new Error("aborted"); error.name = "AbortError"; throw error; } });
  await assert.rejects(timeout.getArticles(), { code: "NEWS_DATA_TIMEOUT" });
});

test("News Engine selects MarketAux only for explicit live configuration", () => {
  const live = new NewsEngine({ env: { NEWS_DATA_MODE: "live", NEWS_DATA_PROVIDER: "marketaux", NEWS_DATA_API_KEY: "x" } });
  assert.equal(live.provider.name, "MarketAux");
  const mock = new NewsEngine({ env: { NEWS_DATA_MODE: "mock", NEWS_DATA_PROVIDER: "marketaux", NEWS_DATA_API_KEY: "x" } });
  assert.equal(mock.provider.name, "MockNewsDataProvider");
});
