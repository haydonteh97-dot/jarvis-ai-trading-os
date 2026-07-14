const CURRENCY_ASSETS = Object.freeze({
  USD: ["XAUUSD", "DXY", "EURUSD", "GBPUSD", "USDJPY", "US100", "US500", "BTCUSD"],
  EUR: ["EURUSD", "DXY", "XAUUSD"], GBP: ["GBPUSD"], JPY: ["USDJPY"],
  AUD: [], CAD: [], CHF: [], CNY: ["XAUUSD", "BTCUSD"],
});
export function mapAffectedAssets(event) {
  return (CURRENCY_ASSETS[event.currency] || []).map((asset) => ({ asset, sensitivity: event.impact === "high" ? "high" : event.impact === "medium" ? "moderate" : "low", directionalPressure: event.releaseStatus === "upcoming" ? "awaiting_release" : "insufficient_data", confidence: "low", mainReason: `${event.currency} ${event.category} sensitivity`, mainUncertainty: "Market reaction requires verified price context" }));
}
export function eventRisk(event, { now = Date.now(), highPreMinutes = 60, highPostMinutes = 30, mediumPreMinutes = 30, mediumPostMinutes = 15 } = {}) {
  if (event.dataStatus === "demo" || !event.scheduledAt) return { level: "insufficient_data", window: "data_unavailable", macroRisk: "Unavailable", scannerScore: 0 };
  const delta = Date.parse(event.scheduledAt) - now;
  const pre = (event.impact === "high" ? highPreMinutes : mediumPreMinutes) * 60000;
  const post = (event.impact === "high" ? highPostMinutes : mediumPostMinutes) * 60000;
  if (delta <= pre && delta >= -post) return { level: event.impact === "high" ? "high" : "moderate", window: delta > 15 * 60000 ? "event_approaching" : delta >= -post ? "high_impact_window" : "post_event_volatility", macroRisk: event.impact === "high" ? "High Risk" : "Wait", scannerScore: event.impact === "high" ? 0 : 1 };
  return { level: "low", window: "clear", macroRisk: "Clear", scannerScore: 5 };
}
