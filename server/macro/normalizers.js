import { createMacroEvent, MACRO_IMPACTS, RELEASE_STATUSES, SUPPORTED_CATEGORIES } from "./model.js";
import { validateMacroEvent } from "./validation.js";

export function mapImpact(value) { const mapped = String(value || "unknown").toLowerCase(); return MACRO_IMPACTS.includes(mapped) ? mapped : "unknown"; }
export function mapReleaseStatus(value) { const mapped = String(value || "unavailable").toLowerCase(); return RELEASE_STATUSES.includes(mapped) ? mapped : "unavailable"; }
export function mapCategory(value) { const mapped = String(value || "other").toLowerCase().replace(/[ -]+/g, "_"); return SUPPORTED_CATEGORIES.includes(mapped) ? mapped : "other"; }
export function normaliseMacroEvent(input, defaults = {}) {
  const event = createMacroEvent({ ...defaults, ...input, currency: String(input.currency || "").toUpperCase(), category: mapCategory(input.category), impact: mapImpact(input.impact), releaseStatus: mapReleaseStatus(input.releaseStatus) });
  const validation = validateMacroEvent(event);
  if (!validation.valid) { const error = new Error("JARVIS could not verify the macro-data response."); error.code = "INVALID_PROVIDER_RESPONSE"; error.details = validation.errors; throw error; }
  return event;
}
export function deduplicateEvents(events) {
  const records = new Map();
  for (const event of events) {
    const key = event.id || [event.title, event.country, event.currency, event.scheduledAt, event.category].join("|");
    const current = records.get(key);
    if (!current || Date.parse(event.lastUpdated || 0) >= Date.parse(current.lastUpdated || 0)) records.set(key, current && event.releaseStatus === "revised" ? { ...event, previous: current.previous, revisedPrevious: event.revisedPrevious ?? current.revisedPrevious } : event);
  }
  return [...records.values()];
}

export const deduplicateMacroEvents = deduplicateEvents;
