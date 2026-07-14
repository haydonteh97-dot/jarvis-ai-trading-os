const PAGES = new Set(["workspace", "ask-jarvis", "ai-analysis", "upload-chart", "macro", "news", "scanner", "trade-planner", "settings", "other"]);

export class MemoryFeedbackStore {
  constructor({ maximumEntries = 1000 } = {}) { this.maximumEntries = maximumEntries; this.entries = []; }
  add(input, userRef, requestId) {
    const rating = Number(input?.rating);
    const page = String(input?.page || "other").toLowerCase();
    const comment = String(input?.comment || "").trim();
    if (!PAGES.has(page)) throw invalid("Feedback page is invalid.");
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw invalid("Feedback rating must be between 1 and 5.");
    if (comment.length > 1000) throw invalid("Feedback comment is too long.");
    const entry = Object.freeze({ id: `feedback_${crypto.randomUUID()}`, userRef, page, module: String(input?.module || page).slice(0, 80), rating, comment, requestId, createdAt: new Date().toISOString() });
    this.entries.push(entry);
    if (this.entries.length > this.maximumEntries) this.entries.splice(0, this.entries.length - this.maximumEntries);
    return { id: entry.id, createdAt: entry.createdAt };
  }
  count() { return this.entries.length; }
  reset() { this.entries.length = 0; }
}

function invalid(message) { return Object.assign(new Error(message), { code: "INVALID_FEEDBACK", status: 400 }); }

export async function handleFeedbackRequest(request, { store, userRef, requestId, audit }) {
  if (new URL(request.url).pathname !== "/api/feedback") return null;
  if (request.method !== "POST") throw Object.assign(new Error("Method not allowed."), { code: "METHOD_NOT_ALLOWED", status: 405 });
  let body;
  try { body = await request.json(); } catch { throw Object.assign(new Error("Feedback must be valid JSON."), { code: "INVALID_JSON", status: 400 }); }
  const result = store.add(body, userRef, requestId);
  audit?.record("feedback_received", { userRef, requestId, page: body.page, module: body.module, rating: body.rating });
  return new Response(JSON.stringify({ success: true, data: result, meta: { requestId }, error: null }), { status: 201, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}
