export class NewsCache {
  constructor({ now = () => Date.now() } = {}) { this.now = now; this.values = new Map(); this.inFlight = new Map(); }
  get(key) { const entry = this.values.get(key); if (!entry || entry.expiresAt <= this.now()) { this.values.delete(key); return null; } return entry.value; }
  set(key, value, ttlMs) { this.values.set(key, { value, expiresAt: this.now() + ttlMs }); return value; }
  async dedupe(key, loader) { if (this.inFlight.has(key)) return this.inFlight.get(key); const pending = Promise.resolve().then(loader); this.inFlight.set(key, pending); try { return await pending; } finally { this.inFlight.delete(key); } }
}
