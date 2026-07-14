const ALLOWED_METHODS = new Set(["GET", "POST", "DELETE", "OPTIONS", "HEAD"]);

export function requestIdFor(request) {
  const supplied = request.headers.get("x-request-id");
  return supplied && /^[a-zA-Z0-9._:-]{8,128}$/.test(supplied) ? supplied : crypto.randomUUID();
}

export function validateHttpRequest(request, config) {
  if (!ALLOWED_METHODS.has(request.method)) return { code: "METHOD_NOT_ALLOWED", status: 405, message: "Method not allowed." };
  const length = Number(request.headers.get("content-length") || 0);
  const maximum = new URL(request.url).pathname.startsWith("/api/vision/") ? Math.max(config.limits.bodyBytes, 11 * 1024 * 1024) : config.limits.bodyBytes;
  if (Number.isFinite(length) && length > maximum) return { code: "REQUEST_TOO_LARGE", status: 413, message: "The request exceeds the allowed size." };
  return null;
}

export function corsPreflight(request, config, requestId) {
  if (request.method !== "OPTIONS") return null;
  const origin = request.headers.get("origin");
  if (!config.appBaseUrl || origin !== config.appBaseUrl) return safeFailure({ code: "ORIGIN_NOT_ALLOWED", status: 403, message: "This origin is not allowed." }, requestId);
  return withSecurityHeaders(new Response(null, { status: 204 }), { requestId, config, origin });
}

export function safeFailure(error, requestId) {
  return new Response(JSON.stringify({ success: false, data: null, meta: { requestId }, error: { code: error.code || "REQUEST_FAILED", message: error.message || "The request could not be completed." } }), { status: error.status || 500, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}

export function withSecurityHeaders(response, { requestId, config, origin } = {}) {
  const headers = new Headers(response.headers);
  headers.set("x-request-id", requestId);
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-frame-options", "DENY");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("permissions-policy", "camera=(), geolocation=(), payment=(), usb=()");
  headers.set("cross-origin-resource-policy", "same-origin");
  headers.set("content-security-policy", "default-src 'self'; img-src 'self' blob: data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  if (origin && config?.appBaseUrl && origin === config.appBaseUrl) { headers.set("access-control-allow-origin", origin); headers.set("vary", "Origin"); headers.set("access-control-allow-methods", "GET,POST,DELETE,OPTIONS"); headers.set("access-control-allow-headers", "authorization,content-type,x-jarvis-session-id,x-request-id"); }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
