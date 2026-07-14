import test from "node:test";
import assert from "node:assert/strict";
import { createMacroEvent } from "../server/macro/model.js";
import { validateMacroEvent } from "../server/macro/validation.js";
import { normaliseMacroEvent, deduplicateMacroEvents } from "../server/macro/normalizers.js";
import { formatEventTime } from "../server/macro/timezone.js";
import { MacroCache } from "../server/macro/cache.js";
import { MockMacroProvider } from "../server/macro/mock-provider.js";
import { LiveMacroDataProvider } from "../server/macro/provider.js";
import { interpretActualVsForecast } from "../server/macro/interpretation.js";
import { eventRisk } from "../server/macro/risk.js";
import { buildMacroSentiment } from "../server/macro/sentiment.js";
import { scannerMacroRiskContext, aiAnalysisMacroContext, tradePlannerEventRisk } from "../server/macro/integrations.js";
import { MacroEngine } from "../server/macro/service.js";
import { handleMacroApiRequest } from "../server/macro/router.js";

const demoEvent = () => normaliseMacroEvent({ id: "demo", title: "Sample Inflation", country: "United States", currency: "USD", category: "inflation", impact: "high", scheduledAt: null, previous: 3.3, forecast: 3.2, actual: 3.1, releaseStatus: "released" }, { timezone: "UTC", source: "MockMacroProvider", verificationStatus: "demo", dataStatus: "demo" });

test("event model preserves unavailable values as null", () => {
  const event = createMacroEvent({ id: "one", title: "Test" });
  assert.equal(event.actual, null);
  assert.equal(event.forecast, null);
});

test("event validation accepts labelled demo without fabricated time", () => {
  assert.deepEqual(validateMacroEvent(demoEvent()).errors, []);
});

test("normalisation rejects malformed numeric values", () => {
  assert.throws(() => normaliseMacroEvent({ ...demoEvent(), actual: "not-a-number" }), { code: "INVALID_PROVIDER_RESPONSE" });
});

test("timezone utility formats valid time and fails safely", () => {
  assert.equal(formatEventTime("2026-07-14T00:00:00Z", "Asia/Kuala_Lumpur").timezone, "Asia/Kuala_Lumpur");
  assert.equal(formatEventTime(null, "Asia/Kuala_Lumpur").label, "Timing unavailable");
});

test("duplicate events keep newest revision", () => {
  const base = { ...demoEvent(), scheduledAt: "2026-07-14T00:00:00Z", dataStatus: "verified", lastUpdated: "2026-07-14T00:01:00Z" };
  const revised = { ...base, releaseStatus: "revised", revisedPrevious: 3.4, lastUpdated: "2026-07-14T00:02:00Z" };
  const result = deduplicateMacroEvents([base, revised]);
  assert.equal(result.length, 1);
  assert.equal(result[0].releaseStatus, "revised");
});

test("cache stores values and deduplicates in-flight requests", async () => {
  const cache = new MacroCache();
  let calls = 0;
  const loader = async () => { calls += 1; await new Promise((resolve) => setTimeout(resolve, 5)); return [demoEvent()]; };
  const [a, b] = await Promise.all([cache.getOrLoad("events", 1000, loader), cache.getOrLoad("events", 1000, loader)]);
  assert.equal(calls, 1);
  assert.deepEqual(a.value, b.value);
  assert.equal((await cache.getOrLoad("events", 1000, loader)).cached, true);
});

test("mock provider is explicitly Demo", async () => {
  const provider = new MockMacroProvider();
  assert.equal(provider.getProviderStatus().dataStatus, "demo");
  assert.ok((await provider.getEvents()).every((event) => event.dataStatus === "demo"));
});

test("live provider placeholder never falls back to demo", async () => {
  const provider = new LiveMacroDataProvider();
  assert.equal(provider.getProviderStatus().status, "disconnected");
  await assert.rejects(provider.getEvents(), { code: "MACRO_DATA_NOT_CONFIGURED" });
});

test("actual-versus-forecast uses event-specific inflation rule", () => {
  const result = interpretActualVsForecast(demoEvent());
  assert.equal(result.surprise, "weaker_than_expected");
  assert.match(result.interpretation, /inflation/i);
});

test("demo risk is unavailable and never treated as clear", () => {
  assert.deepEqual(eventRisk(demoEvent()), { level: "insufficient_data", window: "data_unavailable", macroRisk: "Unavailable", scannerScore: 0 });
});

test("demo sentiment remains insufficient", () => {
  assert.equal(buildMacroSentiment([demoEvent()]).overallMacroMode, "Insufficient Data");
});

test("integration points remain conservative in Demo mode", () => {
  const events = [demoEvent()];
  const scanner = scannerMacroRiskContext(events, "XAUUSD");
  assert.equal(scanner.macroRisk, "Unavailable");
  assert.equal(scanner.score, 0);
  assert.equal(tradePlannerEventRisk(events, "XAUUSD").status, "Unavailable");
  assert.equal(aiAnalysisMacroContext({ provider: "MockMacroProvider", dataStatus: "demo", sentiment: {}, riskSummary: [] }, events, "XAUUSD").dataQuality, "demo");
});

test("engine status, events and summary expose Demo foundation", async () => {
  const engine = new MacroEngine({ env: { MACRO_DATA_MODE: "mock" } });
  assert.equal(engine.getStatus().dataStatus, "demo");
  assert.ok((await engine.getEvents()).events.length > 0);
  const summary = await engine.getSummary();
  assert.equal(summary.integrations.scanner.XAUUSD.macroRisk, "Unavailable");
});

test("macro API routes return stable envelopes", async () => {
  const env = { MACRO_DATA_MODE: "mock" };
  for (const path of ["/api/macro/status", "/api/macro/events", "/api/macro/summary", "/api/macro/event/demo-us-inflation-released"]) {
    const response = await handleMacroApiRequest(new Request(`https://jarvis.test${path}`), env);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.success, true);
    assert.equal(body.meta.dataStatus, "demo");
  }
});

test("live API without provider is honestly disconnected", async () => {
  const status = await handleMacroApiRequest(new Request("https://jarvis.test/api/macro/status"), { MACRO_DATA_MODE: "live" });
  assert.equal((await status.json()).data.status, "disconnected");
  const events = await handleMacroApiRequest(new Request("https://jarvis.test/api/macro/events"), { MACRO_DATA_MODE: "live" });
  assert.equal(events.status, 503);
  assert.equal((await events.json()).error.code, "MACRO_DATA_NOT_CONFIGURED");
});
