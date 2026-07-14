import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { MarketDataCache } from "../server/market-data/cache.js";
import { MARKET_ERROR_CODES, MarketDataError } from "../server/market-data/errors.js";
import { classifyFreshness } from "../server/market-data/freshness.js";
import { MockMarketDataProvider } from "../server/market-data/mock-provider.js";
import { normaliseTwelveDataCandles, normaliseTwelveDataQuote } from "../server/market-data/normalizers.js";
import { SYMBOL_REGISTRY, TIMEFRAME_REGISTRY } from "../server/market-data/registries.js";
import { clearMarketServiceCache, handleMarketApiRequest } from "../server/market-data/router.js";
import { createMarketDataService, readMarketDataConfig } from "../server/market-data/service.js";
import { TwelveDataMarketDataProvider } from "../server/market-data/twelve-data-provider.js";
import { validateLimit, validateSymbol, validateTimeframe } from "../server/market-data/validation.js";

const quoteRaw = {
  symbol: "XAU/USD",
  timestamp: 1_782_867_600,
  open: "2320.10",
  high: "2332.50",
  low: "2318.25",
  close: "2328.40",
  previous_close: "2319.00",
  change: "9.40",
  percent_change: "0.405",
};

const candleRaw = {
  meta: { symbol: "XAU/USD", interval: "1h" },
  values: [
    { datetime: "2026-07-01 00:00:00", open: "2320", high: "2330", low: "2318", close: "2327", volume: "100" },
    { datetime: "2026-07-01 01:00:00", open: "2327", high: "2334", low: "2325", close: "2331", volume: "105" },
  ],
};

function response(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

test("environment defaults to secure Twelve Data live mode", () => {
  const config = readMarketDataConfig({});
  assert.equal(config.provider, "twelvedata");
  assert.equal(config.mode, "live");
  assert.equal(config.twelveDataApiKey, "");
});

test("missing API key returns a disconnected provider", () => {
  const service = createMarketDataService({ MARKET_DATA_MODE: "live", TWELVE_DATA_API_KEY: "" });
  assert.equal(service.getStatus().status, "disconnected");
  assert.equal(service.getStatus().provider, "Twelve Data");
});

test("symbol mapping is central and exact", () => {
  assert.deepEqual(Object.keys(SYMBOL_REGISTRY), ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "BTCUSD"]);
  assert.equal(SYMBOL_REGISTRY.XAUUSD.providerSymbol, "XAU/USD");
  assert.equal(SYMBOL_REGISTRY.BTCUSD.providerSymbol, "BTC/USD");
  assert.equal(SYMBOL_REGISTRY.XAUUSD.contractSize, null);
});

test("timeframe mapping is native and exact", () => {
  assert.deepEqual(Object.keys(TIMEFRAME_REGISTRY), ["D1", "H4", "H1", "M30", "M15", "M5"]);
  assert.equal(TIMEFRAME_REGISTRY.H4.providerInterval, "4h");
  assert.equal(TIMEFRAME_REGISTRY.M30.providerInterval, "30min");
});

test("unsupported symbol and timeframe are rejected", () => {
  assert.throws(() => validateSymbol("NAS100"), (error) => error.code === MARKET_ERROR_CODES.SYMBOL_UNSUPPORTED);
  assert.throws(() => validateTimeframe("M1"), (error) => error.code === MARKET_ERROR_CODES.TIMEFRAME_UNSUPPORTED);
});

test("candle limit has safe bounds", () => {
  assert.equal(validateLimit("300", TIMEFRAME_REGISTRY.H1), 300);
  assert.throws(() => validateLimit("0", TIMEFRAME_REGISTRY.H1), (error) => error.code === MARKET_ERROR_CODES.INVALID_REQUEST);
  assert.throws(() => validateLimit("1001", TIMEFRAME_REGISTRY.H1), (error) => error.code === MARKET_ERROR_CODES.INVALID_REQUEST);
});

test("quote normalisation preserves numbers and provider timestamp", () => {
  const quote = normaliseTwelveDataQuote(quoteRaw, SYMBOL_REGISTRY.XAUUSD, 1_782_867_630_000);
  assert.equal(quote.last, 2328.4);
  assert.equal(quote.bid, null);
  assert.equal(quote.timestamp, "2026-07-01T01:00:00.000Z");
  assert.equal(quote.provider, "Twelve Data");
  assert.equal(quote.freshness, "current");
});

test("quote rejects ask below bid", () => {
  assert.throws(
    () => normaliseTwelveDataQuote({ ...quoteRaw, bid: "10", ask: "9" }, SYMBOL_REGISTRY.XAUUSD, 1_782_867_630_000),
    (error) => error.code === MARKET_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
  );
});

test("candle normalisation orders, deduplicates and rejects invalid OHLC", () => {
  const raw = {
    ...candleRaw,
    values: [
      candleRaw.values[1],
      { ...candleRaw.values[0], close: "2326" },
      candleRaw.values[0],
      { datetime: "2026-07-01 02:00:00", open: "10", high: "9", low: "8", close: "10" },
    ],
  };
  const result = normaliseTwelveDataCandles(raw, SYMBOL_REGISTRY.XAUUSD, TIMEFRAME_REGISTRY.H1, Date.parse("2026-07-01T01:30:00Z"));
  assert.equal(result.candles.length, 2);
  assert.equal(result.candles[0].timestamp, "2026-07-01T00:00:00.000Z");
  assert.equal(result.candles[0].close, 2327);
  assert.equal(result.candles[0].volume, null);
  assert.equal(result.candles[0].volumeType, "unavailable");
});

test("all-invalid candles reject the provider response", () => {
  const raw = { meta: candleRaw.meta, values: [{ datetime: "bad", open: "1", high: "0", low: "2", close: "1" }] };
  assert.throws(
    () => normaliseTwelveDataCandles(raw, SYMBOL_REGISTRY.XAUUSD, TIMEFRAME_REGISTRY.H1),
    (error) => error.code === MARKET_ERROR_CODES.INVALID_PROVIDER_RESPONSE,
  );
});

test("freshness classifies current, delayed, stale and unavailable", () => {
  const now = Date.parse("2026-07-01T01:00:00Z");
  assert.equal(classifyFreshness({ timestamp: "2026-07-01T00:59:30Z", symbol: "EURUSD", now }).freshness, "current");
  assert.equal(classifyFreshness({ timestamp: "2026-07-01T00:55:00Z", symbol: "EURUSD", now }).freshness, "delayed");
  assert.equal(classifyFreshness({ timestamp: "2026-06-30T23:00:00Z", symbol: "EURUSD", now }).freshness, "stale");
  assert.equal(classifyFreshness({ timestamp: null, symbol: "EURUSD", now }).freshness, "unavailable");
});

test("cache returns hits without changing the stored object", async () => {
  const cache = new MarketDataCache();
  let calls = 0;
  const first = await cache.getOrLoad("quote", 1000, async () => ({ timestamp: "provider-time", calls: ++calls }));
  const second = await cache.getOrLoad("quote", 1000, async () => ({ timestamp: "new-time", calls: ++calls }));
  assert.equal(first.cached, false);
  assert.equal(second.cached, true);
  assert.equal(second.value.timestamp, "provider-time");
  assert.equal(calls, 1);
});

test("simultaneous requests share one in-flight provider call", async () => {
  const cache = new MarketDataCache();
  let calls = 0;
  let release;
  const blocker = new Promise((resolve) => { release = resolve; });
  const loader = async () => { calls += 1; await blocker; return { ok: true }; };
  const first = cache.getOrLoad("candles", 1000, loader);
  const second = cache.getOrLoad("candles", 1000, loader);
  await new Promise((resolve) => setTimeout(resolve, 0));
  release();
  const results = await Promise.all([first, second]);
  assert.equal(calls, 1);
  assert.equal(results[1].deduplicated, true);
});

test("Twelve Data adapter keeps API key server-side and maps requests", async () => {
  let requestedUrl;
  const provider = new TwelveDataMarketDataProvider({
    apiKey: "secret-test-key",
    now: () => 1_782_867_630_000,
    fetchImpl: async (url) => { requestedUrl = new URL(url); return response(quoteRaw); },
  });
  const quote = await provider.getQuote("XAUUSD");
  assert.equal(requestedUrl.pathname, "/quote");
  assert.equal(requestedUrl.searchParams.get("symbol"), "XAU/USD");
  assert.equal(requestedUrl.searchParams.get("apikey"), "secret-test-key");
  assert.equal(quote.last, 2328.4);
  assert.equal(JSON.stringify(quote).includes("secret-test-key"), false);
});

test("authentication errors use stable safe code", async () => {
  const provider = new TwelveDataMarketDataProvider({
    apiKey: "bad",
    fetchImpl: async () => response({ status: "error", code: 401, message: "apikey is invalid" }, 401),
  });
  await assert.rejects(() => provider.getQuote("XAUUSD"), (error) => error.code === MARKET_ERROR_CODES.AUTH_FAILED);
});

test("rate limit retries once and returns stable safe code", async () => {
  let calls = 0;
  const provider = new TwelveDataMarketDataProvider({
    apiKey: "limited",
    fetchImpl: async () => { calls += 1; return response({ status: "error", code: 429, message: "credits exhausted" }, 429, { "retry-after": "0" }); },
  });
  await assert.rejects(() => provider.getQuote("XAUUSD"), (error) => error.code === MARKET_ERROR_CODES.RATE_LIMITED);
  assert.equal(calls, 2);
});

test("provider timeout is normalised", async () => {
  const provider = new TwelveDataMarketDataProvider({
    apiKey: "timeout",
    timeoutMs: 5,
    fetchImpl: async (_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })))),
  });
  await assert.rejects(() => provider.getQuote("XAUUSD"), (error) => error.code === MARKET_ERROR_CODES.TIMEOUT);
});

test("mock provider always labels data as demo and never current", async () => {
  const provider = new MockMarketDataProvider();
  const quote = await provider.getQuote("BTCUSD");
  const candles = await provider.getCandles("BTCUSD", "M15", 5);
  assert.equal(quote.dataStatus, "demo");
  assert.equal(quote.freshness, "unavailable");
  assert.equal(candles.dataStatus, "demo");
  assert.equal(candles.candles.length, 5);
});

test("status and symbol routes work without credentials", async () => {
  clearMarketServiceCache();
  const statusResponse = await handleMarketApiRequest(new Request("https://jarvis.test/api/market/status"), { MARKET_DATA_MODE: "live", TWELVE_DATA_API_KEY: "" });
  const status = await statusResponse.json();
  assert.equal(status.success, true);
  assert.equal(status.data.status, "disconnected");
  const symbolsResponse = await handleMarketApiRequest(new Request("https://jarvis.test/api/market/symbols"), { MARKET_DATA_MODE: "live", TWELVE_DATA_API_KEY: "" });
  const symbols = await symbolsResponse.json();
  assert.equal(symbols.data.symbols.length, 5);
  assert.equal(JSON.stringify(symbols).includes("TWELVE_DATA_API_KEY"), false);
});

test("quote route returns honest not-configured envelope", async () => {
  clearMarketServiceCache();
  const routeResponse = await handleMarketApiRequest(new Request("https://jarvis.test/api/market/quote?symbol=XAUUSD"), { MARKET_DATA_MODE: "live", TWELVE_DATA_API_KEY: "" });
  const payload = await routeResponse.json();
  assert.equal(routeResponse.status, 503);
  assert.equal(payload.success, false);
  assert.equal(payload.error.code, MARKET_ERROR_CODES.NOT_CONFIGURED);
  assert.equal(payload.meta.dataStatus, "unavailable");
});

test("mock quote and candle routes preserve demo labels", async () => {
  clearMarketServiceCache();
  const env = { MARKET_DATA_MODE: "mock" };
  const quote = await (await handleMarketApiRequest(new Request("https://jarvis.test/api/market/quote?symbol=EURUSD"), env)).json();
  const candles = await (await handleMarketApiRequest(new Request("https://jarvis.test/api/market/candles?symbol=EURUSD&timeframe=H4&limit=3"), env)).json();
  assert.equal(quote.meta.dataStatus, "demo");
  assert.equal(candles.meta.dataStatus, "demo");
  assert.equal(candles.data.candles.length, 3);
});

test("frontend bindings use only internal market API and preserve safety states", () => {
  const app = fs.readFileSync(new URL("../app.bundle.js", import.meta.url), "utf8");
  assert.match(app, /const marketApiBaseUrl = "\/api\/market"/);
  assert.match(app, /marketDataClient\.candles\(asset, timeframe, 300\)/);
	assert.match(app, /const scannerApiBaseUrl = "\/api\/scanner"/);
	assert.match(app, /scannerDataClient\.run/);
	assert.equal(app.includes("loadScannerMarketInputs"), false);
  assert.match(app, /Position size unavailable — verified symbol specification required/);
  assert.equal(app.includes("api.twelvedata.com"), false);
  assert.equal(app.includes("TWELVE_DATA_API_KEY"), false);
});

test("approved visual files contain no provider credentials", () => {
  for (const file of ["../index.html", "../styles.css", "../public/styles.css"]) {
    const content = fs.readFileSync(new URL(file, import.meta.url), "utf8");
    assert.equal(content.includes("TWELVE_DATA_API_KEY"), false);
  }
});
