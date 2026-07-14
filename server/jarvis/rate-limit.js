export class RequestRateLimiter {
  constructor({ requestsPerMinute = 12, maximumConversationRequests = 100, now = () => Date.now() } = {}) {
    this.requestsPerMinute = requestsPerMinute;
    this.maximumConversationRequests = maximumConversationRequests;
    this.now = now;
    this.users = new Map();
    this.conversations = new Map();
  }

  check(userKey = "anonymous", conversationId = "new") {
    const cutoff = this.now() - 60_000;
    const timestamps = (this.users.get(userKey) || []).filter((value) => value > cutoff);
    if (timestamps.length >= this.requestsPerMinute) throw coded("AI_RATE_LIMITED", "JARVIS request limit reached.");
    timestamps.push(this.now());
    this.users.set(userKey, timestamps);
    const count = (this.conversations.get(conversationId) || 0) + 1;
    if (count > this.maximumConversationRequests) throw coded("AI_CONTEXT_EXPIRED", "Conversation request limit reached.");
    this.conversations.set(conversationId, count);
  }
}

function coded(code, message) { return Object.assign(new Error(message), { code }); }
