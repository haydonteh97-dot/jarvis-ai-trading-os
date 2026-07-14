const SECRET_KEYS = /key|secret|token|password|authorization|invite|cookie|prompt|image|bytes|conversation/i;

export function redact(value, depth = 0) {
  if (depth > 5) return "[TRUNCATED]";
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => redact(item, depth + 1));
  if (!value || typeof value !== "object") return typeof value === "string" ? value.slice(0, 500) : value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, SECRET_KEYS.test(key) ? "[REDACTED]" : redact(item, depth + 1)]));
}

export class MemoryAuditTrail {
  constructor({ maximumEntries = 1000, now = () => new Date().toISOString() } = {}) { this.maximumEntries = maximumEntries; this.now = now; this.entries = []; }
  record(event, details = {}) {
    const entry = Object.freeze({ event: String(event).slice(0, 80), createdAt: this.now(), ...redact(details) });
    this.entries.push(entry);
    if (this.entries.length > this.maximumEntries) this.entries.splice(0, this.entries.length - this.maximumEntries);
    return entry;
  }
  list() { return this.entries.map((entry) => ({ ...entry })); }
  reset() { this.entries.length = 0; }
}

export class StructuredLogger {
  constructor({ sink = console, buildVersion = "development" } = {}) { this.sink = sink; this.buildVersion = buildVersion; }
  emit(level, event, details = {}) {
    const payload = { level, event, timestamp: new Date().toISOString(), buildVersion: this.buildVersion, ...redact(details) };
    const method = level === "error" ? "error" : level === "warn" ? "warn" : "info";
    this.sink?.[method]?.(JSON.stringify(payload));
    return payload;
  }
  request(details) { return this.emit("info", "http_request", details); }
  warn(event, details) { return this.emit("warn", event, details); }
  error(event, details) { return this.emit("error", event, details); }
}
