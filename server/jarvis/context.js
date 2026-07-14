export class ConversationStore {
  constructor({ maximumMessages = 40 } = {}) { this.maximumMessages = maximumMessages; this.conversations = new Map(); }
  create(input = {}) { const id = input.conversationId || `conv_${crypto.randomUUID()}`; const conversation = { id, userId: input.userId || null, language: input.language || "en", context: input.context || {}, messages: [], lastToolResults: [], missingData: [], providerState: { previousResponseId: null, model: null, usage: null }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; this.conversations.set(id, conversation); return conversation; }
  get(id) { return this.conversations.get(id) || null; }
  upsert(id, input = {}) { const current = this.get(id) || this.create({ ...input, conversationId: id }); current.language = input.language || current.language; current.context = { ...current.context, ...(input.context || {}) }; current.updatedAt = new Date().toISOString(); return current; }
  addMessage(id, message) { const conversation = this.get(id); if (!conversation) return null; conversation.messages = [...conversation.messages, message].slice(-this.maximumMessages); conversation.updatedAt = new Date().toISOString(); return conversation; }
  setProviderState(id, providerState = {}) { const conversation = this.get(id); if (!conversation) return null; conversation.providerState = { ...conversation.providerState, ...providerState }; conversation.updatedAt = new Date().toISOString(); return conversation; }
}
