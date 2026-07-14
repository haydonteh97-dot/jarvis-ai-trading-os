function scopeFor(pathname) {
  if (pathname.startsWith("/api/jarvis/")) return "jarvis";
  if (pathname === "/api/vision/uploads" || pathname === "/api/vision/upload") return "visionUpload";
  if (pathname.startsWith("/api/vision/analysis") || pathname.endsWith("/analyse")) return "visionAnalysis";
  if (pathname.startsWith("/api/scanner/")) return "scanner";
  if (pathname.startsWith("/api/market/")) return "market";
  if (pathname.startsWith("/api/macro/")) return "macro";
  if (pathname.startsWith("/api/news/")) return "news";
  if (pathname === "/api/feedback") return "feedback";
  return "general";
}

export class PlatformRateLimiter {
  constructor({ limits, now = () => Date.now(), audit } = {}) { this.limits = limits; this.now = now; this.audit = audit; this.buckets = new Map(); }
  consume(userRef, pathname) {
    const scope = scopeFor(pathname);
    const specific = this.limits[`${scope}PerMinute`] || this.limits.generalPerMinute;
    const checks = scope === "general" ? [["general", this.limits.generalPerMinute]] : [["general", this.limits.generalPerMinute], [scope, specific]];
    for (const [name, maximum] of checks) {
      const result = this.consumeBucket(`${name}:${userRef}`, maximum);
      if (!result.allowed) { this.audit?.record("rate_limit_rejected", { userRef, route: pathname, category: name }); return { ...result, scope: name }; }
    }
    return { allowed: true, scope, limit: specific, remaining: Math.max(0, specific - 1) };
  }
  consumeBucket(key, maximum) {
    const now = this.now(); const windowMs = 60_000; let bucket = this.buckets.get(key);
    if (!bucket || now - bucket.startedAt >= windowMs) { bucket = { startedAt: now, count: 0 }; this.buckets.set(key, bucket); }
    if (bucket.count >= maximum) return { allowed: false, limit: maximum, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now - bucket.startedAt)) / 1000)) };
    bucket.count += 1;
    return { allowed: true, limit: maximum, remaining: Math.max(0, maximum - bucket.count) };
  }
  reset() { this.buckets.clear(); }
}

export function rateLimited(result, requestId) {
  return new Response(JSON.stringify({ success: false, data: null, meta: { requestId }, error: { code: "RATE_LIMITED", message: "Too many requests. Please retry later." } }), { status: 429, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "retry-after": String(result.retryAfterSeconds) } });
}
