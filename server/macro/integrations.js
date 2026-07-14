import { eventRisk, mapAffectedAssets } from "./risk.js";
export function scannerMacroRiskContext(events, asset) {
  const relevant = events.filter((event) => mapAffectedAssets(event).some((entry) => entry.asset === asset));
  if (!relevant.length || relevant.every((event) => event.dataStatus === "demo")) return { macroRisk: "Unavailable", score: 0, dataQuality: relevant.length ? "Demo" : "Unavailable", events: [] };
  const risks = relevant.map((event) => ({ eventId: event.id, ...eventRisk(event) }));
  return { macroRisk: risks.some((risk) => risk.macroRisk === "High Risk") ? "High Risk" : risks.some((risk) => risk.macroRisk === "Wait") ? "Wait" : "Monitor", score: Math.min(...risks.map((risk) => risk.scannerScore)), dataQuality: "Verified", events: risks };
}
export function aiAnalysisMacroContext(summary, events, asset) { return { source: summary.provider, dataQuality: summary.dataStatus, sentiment: summary.sentiment, relevantEvents: events.filter((event) => mapAffectedAssets(event).some((entry) => entry.asset === asset)), eventRisk: summary.riskSummary }; }
export function tradePlannerEventRisk(events, asset) { const context = scannerMacroRiskContext(events, asset); return { status: context.macroRisk, nextEvent: context.events[0] || null, sourceStatus: context.dataQuality }; }
export function askJarvisMacroHandoff(event) { return { eventId: event.id, title: event.title, currency: event.currency, country: event.country, impact: event.impact, previous: event.previous, forecast: event.forecast, actual: event.actual, releaseStatus: event.releaseStatus, dataQuality: event.dataStatus, affectedAssets: mapAffectedAssets(event) }; }
