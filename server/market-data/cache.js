export class MarketDataCache {
  constructor({ now = () => Date.now() } = {}) {
    this.now = now;
    this.values = new Map();
    this.inFlight = new Map();
  }

  get(key) {
    const entry = this.values.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= this.now()) {
      this.values.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value, ttlMs) {
    this.values.set(key, { value, expiresAt: this.now() + ttlMs });
  }

  async getOrLoad(key, ttlMs, loader) {
    const cached = this.get(key);
    if (cached) return { value: cached, cached: true, deduplicated: false };
    if (this.inFlight.has(key)) {
      return { value: await this.inFlight.get(key), cached: false, deduplicated: true };
    }
    const request = Promise.resolve().then(loader);
    this.inFlight.set(key, request);
    try {
      const value = await request;
      this.set(key, value, ttlMs);
      return { value, cached: false, deduplicated: false };
    } finally {
      this.inFlight.delete(key);
    }
  }

  clear() {
    this.values.clear();
    this.inFlight.clear();
  }
}
