export class MacroCache {
  constructor({ now = () => Date.now() } = {}) { this.now = now; this.values = new Map(); this.inFlight = new Map(); }
  get(key) { const item = this.values.get(key); if (!item || item.expiresAt <= this.now()) { this.values.delete(key); return null; } return item.value; }
  set(key, value, ttlMs) { this.values.set(key, { value, expiresAt: this.now() + ttlMs }); return value; }
  async dedupe(key, loader) {
    if (this.inFlight.has(key)) return this.inFlight.get(key);
    const pending = Promise.resolve().then(loader); this.inFlight.set(key, pending);
    try { return await pending; } finally { this.inFlight.delete(key); }
  }
  async getOrLoad(key, ttlMs, loader) {
    const cached = this.get(key); if (cached) return { value: cached, cached: true, deduplicated: false };
    if (this.inFlight.has(key)) return { value: await this.inFlight.get(key), cached: false, deduplicated: true };
    const pending = Promise.resolve().then(loader); this.inFlight.set(key, pending);
    try { const value = await pending; this.values.set(key, { value, expiresAt: this.now() + ttlMs }); return { value, cached: false, deduplicated: false }; }
    finally { this.inFlight.delete(key); }
  }
}
