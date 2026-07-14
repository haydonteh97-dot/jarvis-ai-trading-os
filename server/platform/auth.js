import { createHash, timingSafeEqual } from "node:crypto";

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function parseBasic(value) {
  if (!String(value || "").startsWith("Basic ")) return null;
  try {
    const decoded = Buffer.from(String(value).slice(6), "base64").toString("utf8");
    const separator = decoded.indexOf(":");
    if (separator < 1) return null;
    return { email: decoded.slice(0, separator).trim().toLowerCase(), code: decoded.slice(separator + 1) };
  } catch { return null; }
}

export function safeUserReference(email) {
  return `beta_${createHash("sha256").update(String(email || "anonymous").toLowerCase()).digest("hex").slice(0, 16)}`;
}

export class BetaAccessGate {
  constructor({ config, audit } = {}) {
    this.config = config || { enabled: false, allowedEmails: [], inviteCodes: [], maxUsers: 25 };
    this.audit = audit;
    this.seenUsers = new Set();
  }

  authenticate(request) {
    if (!this.config.enabled) return { allowed: true, userRef: "beta_disabled", authentication: "disabled" };
    const credentials = parseBasic(request.headers.get("authorization"));
    const emailAllowed = Boolean(credentials && this.config.allowedEmails.includes(credentials.email));
    const codeAllowed = Boolean(credentials && this.config.inviteCodes.some((code) => safeEqual(code, credentials.code)));
    const userRef = credentials?.email ? safeUserReference(credentials.email) : "anonymous";
    if (!emailAllowed || !codeAllowed) {
      this.audit?.record("beta_access_denied", { userRef, route: new URL(request.url).pathname });
      return { allowed: false, userRef: "anonymous", reason: "invalid_access" };
    }
    if (!this.seenUsers.has(userRef) && this.seenUsers.size >= this.config.maxUsers) {
      this.audit?.record("beta_access_denied", { userRef, route: new URL(request.url).pathname, category: "capacity" });
      return { allowed: false, userRef: "anonymous", reason: "capacity" };
    }
    this.seenUsers.add(userRef);
    this.audit?.record("beta_access_allowed", { userRef, route: new URL(request.url).pathname });
    return { allowed: true, userRef, authentication: "basic_beta" };
  }

  getStatus() {
    return { state: this.config.enabled ? "ready" : "demo", enabled: this.config.enabled, activeUsers: this.seenUsers.size, maximumUsers: this.config.maxUsers, storage: "memory-local" };
  }
}

export function betaAccessDenied(requestId) {
  return new Response(JSON.stringify({ success: false, data: null, meta: { requestId }, error: { code: "BETA_ACCESS_DENIED", message: "Closed Beta access is required." } }), {
    status: 401,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "www-authenticate": 'Basic realm="JARVIS Closed Beta", charset="UTF-8"' },
  });
}
