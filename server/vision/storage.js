const ALLOWED_TRANSITIONS = Object.freeze({ uploading: ["validated", "quarantined", "failed"], validated: ["temporary", "failed"], temporary: ["analysis_ready", "deletion_pending", "failed"], analysis_ready: ["deletion_pending", "retained_with_consent"], retained_with_consent: ["deletion_pending"], quarantined: ["deletion_pending"], failed: ["deletion_pending"], deletion_pending: ["deleted"], deleted: [] });
export class VisionImageStorage {
  async saveTemporaryImage() { throw new Error("saveTemporaryImage() must be implemented"); }
  async readImage() { throw new Error("readImage() must be implemented"); }
  async getMetadata() { throw new Error("getMetadata() must be implemented"); }
  async markForDeletion() { throw new Error("markForDeletion() must be implemented"); }
  async deleteImage() { throw new Error("deleteImage() must be implemented"); }
  async verifyOwnership() { throw new Error("verifyOwnership() must be implemented"); }
  async cleanupExpiredImages() { throw new Error("cleanupExpiredImages() must be implemented"); }
}
export class MemoryVisionImageStorage extends VisionImageStorage {
  constructor() { super(); this.records = new Map(); }
  async saveTemporaryImage({ imageId, ownerId, bytes, metadata, expiresAt }) {
    const record = { imageId, ownerId, bytes: new Uint8Array(bytes), metadata: { ...metadata }, storageState: "uploading", retentionStatus: "temporary", createdAt: new Date().toISOString(), expiresAt, deletedAt: null };
    this.records.set(imageId, record); this.transition(record, "validated"); this.transition(record, "temporary"); return this.publicMetadata(record);
  }
  transition(record, next) { if (!ALLOWED_TRANSITIONS[record.storageState]?.includes(next)) throw Object.assign(new Error("Invalid storage state transition."), { code: "VISION_STORAGE_FAILED" }); record.storageState = next; }
  async markAnalysisReady(imageId, ownerId) { const record = this.require(imageId, ownerId); this.assertUsable(record); if (record.storageState === "temporary") this.transition(record, "analysis_ready"); return this.publicMetadata(record); }
  async readImage(imageId, ownerId) { const record = this.require(imageId, ownerId); this.assertUsable(record); return { bytes: new Uint8Array(record.bytes), metadata: this.publicMetadata(record) }; }
  async getMetadata(imageId, ownerId) { const record = this.require(imageId, ownerId); this.assertUsable(record); return this.publicMetadata(record); }
  async verifyOwnership(imageId, ownerId) { const record = this.records.get(imageId); return Boolean(record && record.ownerId === ownerId); }
  async markForDeletion(imageId, ownerId) { const record = this.require(imageId, ownerId); if (record.storageState !== "deletion_pending") this.transition(record, "deletion_pending"); return this.publicMetadata(record); }
  async deleteImage(imageId, ownerId) { const record = this.require(imageId, ownerId); if (record.storageState !== "deletion_pending") await this.markForDeletion(imageId, ownerId); record.bytes = null; this.transition(record, "deleted"); record.retentionStatus = "deleted"; record.deletedAt = new Date().toISOString(); return this.publicMetadata(record); }
  async cleanupExpiredImages(now = Date.now()) { const cleaned = []; for (const record of this.records.values()) if (!["deleted", "deletion_pending"].includes(record.storageState) && Date.parse(record.expiresAt) <= now) { await this.deleteImage(record.imageId, record.ownerId); cleaned.push(record.imageId); } return cleaned; }
  require(imageId, ownerId) { const record = this.records.get(imageId); if (!record) throw Object.assign(new Error("Image not found."), { code: "VISION_IMAGE_NOT_FOUND" }); if (record.ownerId !== ownerId) throw Object.assign(new Error("Access denied."), { code: "VISION_IMAGE_ACCESS_DENIED" }); return record; }
  assertUsable(record) { if (record.storageState === "deleted") throw Object.assign(new Error("Image deleted."), { code: "VISION_IMAGE_DELETED" }); if (Date.parse(record.expiresAt) <= Date.now()) throw Object.assign(new Error("Image expired."), { code: "VISION_IMAGE_EXPIRED" }); }
  publicMetadata(record) { return { imageId: record.imageId, ...record.metadata, storageState: record.storageState, retentionStatus: record.retentionStatus, createdAt: record.createdAt, expiresAt: record.expiresAt, deletedAt: record.deletedAt, storageAdapter: "memory-temporary" }; }
  reset() { this.records.clear(); }
}
export const visionImageStorage = new MemoryVisionImageStorage();
