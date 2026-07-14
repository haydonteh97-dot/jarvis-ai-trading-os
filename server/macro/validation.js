import { DATA_STATUSES, MACRO_IMPACTS, RELEASE_STATUSES, SUPPORTED_CATEGORIES, SUPPORTED_CURRENCIES } from "./model.js";

function optionalNumber(value) { return value == null || value === "" ? null : Number.isFinite(Number(value)) ? Number(value) : NaN; }

export function validateMacroEvent(event, { allowDemoWithoutTimestamp = true } = {}) {
  const errors = [];
  if (!event?.id) errors.push("Event ID is required");
  if (!event?.title) errors.push("Event title is required");
  if (!SUPPORTED_CURRENCIES.includes(event?.currency)) errors.push("Unsupported currency");
  if (!SUPPORTED_CATEGORIES.includes(event?.category)) errors.push("Unsupported category");
  if (!MACRO_IMPACTS.includes(event?.impact)) errors.push("Invalid impact");
  if (!RELEASE_STATUSES.includes(event?.releaseStatus)) errors.push("Invalid release status");
  if (!DATA_STATUSES.includes(event?.dataStatus)) errors.push("Invalid data status");
  if (event?.scheduledAt && !Number.isFinite(Date.parse(event.scheduledAt))) errors.push("Invalid scheduled timestamp");
  if (!event?.scheduledAt && !(allowDemoWithoutTimestamp && event?.dataStatus === "demo")) errors.push("Scheduled timestamp is required");
  for (const field of ["previous", "forecast", "actual", "revisedPrevious"]) if (Number.isNaN(optionalNumber(event?.[field]))) errors.push(`${field} must be numeric or null`);
  return { valid: errors.length === 0, errors };
}

export function validateDateRange(start, end, { maximumDays = 62 } = {}) {
  const startMs = Date.parse(start); const endMs = Date.parse(end);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs || endMs - startMs > maximumDays * 86400000) {
    const error = new Error("The macro date range is invalid."); error.code = "INVALID_DATE_RANGE"; throw error;
  }
  return { start: new Date(startMs).toISOString(), end: new Date(endMs).toISOString() };
}
