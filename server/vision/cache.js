const uploads = new Map();
const hashes = new Map();
const MAX_ITEMS = 100;
export function findByHash(hash, ownerId = "anonymous-session") { const id = hashes.get(`${ownerId}:${hash}`); return id ? uploads.get(id) || null : null; }
export function saveUpload(value) {
  uploads.set(value.id, value); hashes.set(`${value.ownerId || "anonymous-session"}:${value.contentHash}`, value.id);
  while (uploads.size > MAX_ITEMS) { const [id, item] = uploads.entries().next().value; uploads.delete(id); if (hashes.get(`${item.ownerId || "anonymous-session"}:${item.contentHash}`) === id) hashes.delete(`${item.ownerId || "anonymous-session"}:${item.contentHash}`); }
  return value;
}
export function getUpload(id) { return uploads.get(id) || null; }
export function deleteUpload(id) { const item = uploads.get(id); if (!item) return false; uploads.delete(id); hashes.delete(`${item.ownerId || "anonymous-session"}:${item.contentHash}`); return true; }
export function clearVisionCache() { uploads.clear(); hashes.clear(); }
