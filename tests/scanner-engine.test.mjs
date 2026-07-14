import test from "node:test";
import assert from "node:assert/strict";
import { ema, atr, adx, detectSwings } from "../server/scanner/indicators.js";
import { analyseTimeframe, multiTimeframeAlignment } from "../server/scanner/analysis.js";
import { qualityBand, scoreSymbol, SCORING_WEIGHTS } from "../server/scanner/scoring.js";
import { ScannerService } from "../server/scanner/service.js";
import { handleScannerApiRequest } from "../server/scanner/router.js";

function candles({ count = 300, start = 100, slope = 0.08, wave = 2, timeframeMs = 3_600_000 } = {}) {
  const end = Date.parse("2026-07-14T04:00:00.000Z");
  return Array.from({ length: count }, (_, index) => {
    const center = start + slope * index + Math.sin(index / 5) * wave;
    const open = center - slope * 0.4;
    const close = center + slope * 0.4;
    return { timestamp: new Date(end - (count - index - 1) * timeframeMs).toISOString(), open, high: Math.max(open, close) + 0.7, low: Math.min(open, close) - 0.7, close, volume: null, volumeType: "unavailable" };
  });
}

function metadata(symbol) {
  return { symbol, displayName: symbol, assetClass: symbol === "XAUUSD" ? "metal" : symbol === "BTCUSD" ? "crypto" : "forex", supported: true };
}

class FakeMarketService {
  constructor(plan = {}) {
    this.plan = plan;
    this.calls = [];
    this.provider = { name: "Twelve Data" };
  }
  getSymbols() { return ["XAUUSD", "EURUSD", "GBPUSD"].map(metadata); }
  async getCandles(symbol, timeframe) {
    this.calls.push(`${symbol}:${timeframe}`);
    const action = this.plan[`${symbol}:${timeframe}`] ?? "ok";
    if (action instanceof Error) throw action;
    if (action === "missing") throw Object.assign(new Error("missing"), { code: "MARKET_DATA_UNAVAILABLE" });
    return { value: { symbol, timeframe, provider: "Twelve Data", dataStatus: action === "stale" ? "delayed" : "verified", freshness: action === "stale" ? "stale" : "current", lastUpdated: "2026-07-14T04:00:00.000Z", candles: candles({ slope: symbol === "GBPUSD" ? -0.08 : 0.08 }) }, cached: false };
  }
}

test("EMA 20, 50 and 200 are deterministic", () => {
  const values = Array.from({ length: 300 }, (_, index) => index + 1);
  assert.equal(ema(values, 20).length, 300);
  assert.ok(ema(values, 20).at(-1) > ema(values, 50).at(-1));
  assert.ok(ema(values, 50).at(-1) > ema(values, 200).at(-1));
});

test("ATR 14 returns positive deterministic volatility", () => {
  const output = atr(candles(), 14);
  assert.ok(output.at(-1) > 0);
  assert.deepEqual(output, atr(candles(), 14));
});

test("ADX 14 returns bounded directional strength", () => {
  const value = adx(candles(), 14).at(-1);
  assert.ok(Number.isFinite(value));
  assert.ok(value >= 0 && value <= 100);
});

test("swing detection uses confirmed two-candle pivots", () => {
  const swings = detectSwings(candles(), { pivot: 2, minimumDistance: 0.2 });
  assert.ok(swings.highs.length >= 2);
  assert.ok(swings.lows.length >= 2);
  assert.ok(swings.highs.every((swing) => swing.index >= 2));
});

test("trend, structure, breakout, pullback and range analysis is deterministic", () => {
  const analysis = analyseTimeframe(candles(), "H1");
  assert.equal(analysis.sufficient, true);
  assert.equal(analysis.direction, "Bullish");
  assert.match(analysis.structure, /Higher High|Mixed Structure/);
  assert.ok(["Bullish Pullback", "Bullish Continuation", "Bullish Breakout"].includes(analysis.setupType));
  assert.deepEqual(analysis, analyseTimeframe(candles(), "H1"));
});

test("insufficient candles cannot create structure", () => {
  assert.equal(analyseTimeframe(candles({ count: 40 }), "H1").sufficient, false);
});

test("multi-timeframe alignment scores fully aligned, partial and conflict", () => {
  assert.deepEqual(multiTimeframeAlignment({ D1: { direction: "Bullish" }, H4: { direction: "Bullish" }, H1: { direction: "Bullish" } }), { status: "Fully Aligned", score: 20 });
  assert.equal(multiTimeframeAlignment({ D1: { direction: "Bullish" }, H4: { direction: "Bullish" }, H1: { direction: "Neutral" } }).score, 15);
  assert.equal(multiTimeframeAlignment({ D1: { direction: "Bullish" }, H4: { direction: "Bearish" }, H1: { direction: "Neutral" } }).status, "Conflicting");
});

test("scoring weights total 100 and missing Macro, News and RR score zero", () => {
  assert.equal(Object.values(SCORING_WEIGHTS).reduce((sum, value) => sum + value, 0), 100);
  const analysis = analyseTimeframe(candles(), "H1");
  const result = scoreSymbol({ symbol: "XAUUSD", metadata: metadata("XAUUSD"), analyses: { D1: analysis, H4: analysis, H1: analysis }, dataQuality: "Verified", freshness: "current", scanTimestamp: "2026-07-14T04:00:00.000Z" });
  assert.equal(result.components.macroRisk, 0);
  assert.equal(result.components.newsRisk, 0);
  assert.equal(result.components.riskRewardQuality, 0);
  assert.ok(result.score <= 90);
});

test("quality bands use 75 and 50 thresholds", () => {
  assert.equal(qualityBand(75, false), "High");
  assert.equal(qualityBand(50, false), "Medium");
  assert.equal(qualityBand(49, false), "Low");
  assert.equal(qualityBand(90, true), "No Valid Setup");
});

test("hard rejection blocks stale, demo and insufficient analyses", () => {
  const valid = analyseTimeframe(candles(), "H1");
  const stale = scoreSymbol({ symbol: "XAUUSD", metadata: metadata("XAUUSD"), analyses: { D1: valid, H4: valid, H1: valid }, dataQuality: "Stale", freshness: "stale", scanTimestamp: "x" });
  const demo = scoreSymbol({ symbol: "XAUUSD", metadata: metadata("XAUUSD"), analyses: { D1: valid, H4: valid, H1: valid }, dataQuality: "Demo", freshness: "unavailable", scanTimestamp: "x" });
  const insufficient = scoreSymbol({ symbol: "XAUUSD", metadata: metadata("XAUUSD"), analyses: { D1: valid }, dataQuality: "Partial", freshness: "current", scanTimestamp: "x" });
  assert.equal(stale.score, 0);
  assert.equal(demo.score, 0);
  assert.equal(insufficient.score, 0);
});

test("successful scan uses verified candles and ranks deterministic results", async () => {
  const service = new ScannerService({ marketDataService: new FakeMarketService(), now: () => Date.parse("2026-07-14T05:00:00.000Z") });
  const scan = await service.runScan({ assets: ["XAUUSD", "GBPUSD"] });
  assert.equal(scan.status, "completed");
  assert.equal(scan.counters.requested, 2);
  assert.equal(scan.counters.completed, 2);
  assert.equal(scan.counters.partial, 0);
  assert.equal(scan.counters.unavailable, 0);
  assert.equal(scan.results.length, 2);
  assert.ok(scan.results[0].score >= scan.results[1].score);
  assert.ok(scan.results.every((result) => result.source.includes("Deterministic Scanner")));
});

test("counter invariant keeps completed, partial and unavailable mutually exclusive", async () => {
  const market = new FakeMarketService({ "EURUSD:H4": "missing", "GBPUSD:D1": "missing", "GBPUSD:H4": "missing", "GBPUSD:H1": "missing" });
  const scan = await new ScannerService({ marketDataService: market }).runScan({ assets: ["XAUUSD", "EURUSD", "GBPUSD"] });
  assert.equal(scan.counters.requested, scan.counters.completed + scan.counters.partial + scan.counters.unavailable);
  assert.deepEqual(scan.completedSymbols, ["XAUUSD"]);
  assert.deepEqual(scan.partialSymbols, ["EURUSD"]);
  assert.deepEqual(scan.unavailableSymbols, ["GBPUSD"]);
});

test("rate limited scan preserves completed result and stops new requests", async () => {
  const rateError = Object.assign(new Error("rate"), { code: "MARKET_DATA_RATE_LIMITED" });
  const market = new FakeMarketService({ "EURUSD:H4": rateError });
  const scan = await new ScannerService({ marketDataService: market }).runScan({ assets: ["XAUUSD", "EURUSD", "GBPUSD"] });
  assert.equal(scan.status, "partial");
  assert.deepEqual(scan.completedSymbols, ["XAUUSD"]);
  assert.ok(scan.errorSummary.some((error) => error.code === "MARKET_DATA_RATE_LIMITED"));
  assert.equal(market.calls.includes("GBPUSD:D1"), false);
});

test("stale completed data is analysed but hard rejected", async () => {
  const plan = { "XAUUSD:D1": "stale", "XAUUSD:H4": "stale", "XAUUSD:H1": "stale" };
  const scan = await new ScannerService({ marketDataService: new FakeMarketService(plan) }).runScan({ assets: ["XAUUSD"] });
  assert.equal(scan.counters.completed, 1);
  assert.equal(scan.counters.rejectedSetups, 1);
  assert.equal(scan.results[0].score, 0);
  assert.equal(scan.results[0].dataQuality, "Stale");
});

test("identical scan reuses scanner result cache", async () => {
  let now = 1000;
  const market = new FakeMarketService();
  const service = new ScannerService({ marketDataService: market, now: () => now });
  await service.runScan({ assets: ["XAUUSD"] });
  const calls = market.calls.length;
  now += 10_000;
  const cached = await service.runScan({ assets: ["XAUUSD"] });
  assert.equal(cached.cached, true);
  assert.equal(market.calls.length, calls);
});

test("single-symbol scan may request optional M15 without substituting timeframe", async () => {
  const market = new FakeMarketService();
  await new ScannerService({ marketDataService: market }).runScan({ assets: ["XAUUSD"], includeM15: true });
  assert.deepEqual(market.calls, ["XAUUSD:D1", "XAUUSD:H4", "XAUUSD:H1", "XAUUSD:M15"]);
});

test("unsupported symbols are excluded before provider calls", async () => {
  const market = new FakeMarketService();
  const scan = await new ScannerService({ marketDataService: market }).runScan({ assets: ["NAS100"] });
  assert.equal(scan.counters.requested, 0);
  assert.equal(market.calls.length, 0);
});

test("no-valid-setup scan reports rejected count without fake opportunity", async () => {
  const market = new FakeMarketService();
  market.getCandles = async (symbol, timeframe) => ({ value: { symbol, timeframe, dataStatus: "verified", freshness: "current", candles: candles({ count: 40 }) }, cached: false });
  const scan = await new ScannerService({ marketDataService: market }).runScan({ assets: ["XAUUSD"] });
  assert.equal(scan.counters.validSetups, 0);
  assert.equal(scan.counters.rejectedSetups, 1);
  assert.equal(scan.results[0].setupType, "No Valid Setup");
});

test("scanner API run, status, results and latest contracts work", async () => {
  const env = { MARKET_DATA_MODE: "mock", MARKET_DATA_PROVIDER: "twelvedata", TWELVE_DATA_BASE_URL: "https://api.twelvedata.com/scanner-test" };
  const run = await handleScannerApiRequest(new Request("https://jarvis.test/api/scanner/run", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ assets: ["XAUUSD"] }) }), env);
  const runBody = await run.json();
  assert.equal(run.status, 200);
  assert.equal(runBody.success, true);
  assert.equal(runBody.data.counters.requested, 1);
  assert.equal(runBody.data.results[0].dataQuality, "Demo");
  assert.equal(runBody.data.results[0].score, 0);
  const scanId = runBody.data.scanId;
  for (const path of [`status?scanId=${scanId}`, `results?scanId=${scanId}`, "latest"]) {
    const response = await handleScannerApiRequest(new Request(`https://jarvis.test/api/scanner/${path}`), env);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).success, true);
  }
});
