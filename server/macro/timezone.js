export function isValidTimezone(timezone) {
  if (!timezone) return false;
  try { new Intl.DateTimeFormat("en", { timeZone: timezone }).format(); return true; } catch { return false; }
}
export function formatEventTime(timestamp, timezone) {
  if (!timestamp || !Number.isFinite(Date.parse(timestamp)) || !isValidTimezone(timezone)) return { label: "Timing unavailable", timezone: isValidTimezone(timezone) ? timezone : "Timezone not confirmed" };
  return { label: new Intl.DateTimeFormat("en-GB", { timeZone: timezone, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(timestamp)), timezone };
}
