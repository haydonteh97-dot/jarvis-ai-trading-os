import { MockVisionProvider } from "./mock-provider.js";
import { LiveVisionProvider } from "./provider.js";
import { OpenAIVisionProvider } from "./openai-vision-provider.js";
import { createChartContext } from "./model.js";
import { inspectImageBytes, sha256 } from "./image-inspector.js";
import { deleteUpload, findByHash, getUpload, saveUpload } from "./cache.js";
import { getVisionConfig, sanitizeFilename, validateUploadFile } from "./validation.js";
import { toAiAnalysisContext, toAskJarvisContext, toTradePlannerContext } from "./integrations.js";
import { createObservationService } from "./observation-service.js";
import { visionImageStorage } from "./storage.js";
import { deleteAnalysesForImage } from "./observation-cache.js";
import { enforceVisionRateLimit, withVisionConcurrency } from "./rate-limit.js";

export function createVisionEngine(env = {}, dependencies = {}) {
  const config = getVisionConfig(env);
  const provider = dependencies.visionProvider || (config.mode === "mock" ? new MockVisionProvider() : String(config.provider).toLowerCase() === "openai" ? new OpenAIVisionProvider({ env }) : new LiveVisionProvider());
  return {
    getStatus: () => ({ ...provider.getStatus(), allowedTypes: config.allowedTypes, maxFileSize: config.maxFileSize, maxRequestSize: config.maxRequestSize, dimensions: { minWidth: config.minWidth, minHeight: config.minHeight, maxWidth: config.maxWidth, maxHeight: config.maxHeight, maxPixelCount: config.maxPixelCount }, retention: { temporaryHours: config.tempRetentionHours, retainOriginal: false }, storage: "memory-temporary", schemaVersion: config.schemaVersion, analysisVersion: config.analysisVersion, ocrEnabled: false }),
    async upload(file, hints = {}, ownerId = "anonymous-session") {
      enforceVisionRateLimit(ownerId, "upload", config.uploadsPerMinute);
      return withVisionConcurrency(ownerId, "upload", config.maxActiveUploads, async () => {
        validateUploadFile(file, config);
        const bytes = new Uint8Array(await file.arrayBuffer());
        const image = inspectImageBytes(bytes, config);
        if (image.mimeType !== file.type) { const error = new Error("The file content does not match its declared image type."); error.code = "VISION_MIME_MISMATCH"; throw error; }
        const hash = await sha256(bytes);
        const duplicate = findByHash(hash, ownerId);
        if (duplicate) { try { const metadata = await visionImageStorage.getMetadata(duplicate.id, ownerId); if (metadata.storageState !== "deleted") return { upload: duplicate, duplicate: true }; } catch {} }
        const id = `vision-${crypto.randomUUID()}`, safeFile = { ...file, name: sanitizeFilename(file.name), size: file.size, type: file.type };
        const status = provider.getStatus();
        const upload = createChartContext({ id, file: safeFile, image, hints, hash, ownerId, provider: provider.name, dataStatus: status.dataStatus });
        await visionImageStorage.saveTemporaryImage({ imageId: id, ownerId, bytes, metadata: { sanitisedFilename: safeFile.name, declaredMime: file.type, detectedMime: image.mimeType, format: image.mimeType.split("/")[1], fileSize: file.size, width: image.width, height: image.height, pixelCount: image.pixelCount }, expiresAt: new Date(Date.now() + config.tempRetentionHours * 3_600_000).toISOString() });
        saveUpload(upload);
        return { upload, duplicate: false };
      });
    },
    getUpload,
    async getImage(id, ownerId) { return visionImageStorage.readImage(id, ownerId); },
    async getImageMetadata(id, ownerId) { return visionImageStorage.getMetadata(id, ownerId); },
    async deleteImage(id, ownerId) { const result = await visionImageStorage.deleteImage(id, ownerId); deleteAnalysesForImage(id); deleteUpload(id); return result; },
    async cleanupExpired(now) { const ids = await visionImageStorage.cleanupExpiredImages(now); for (const id of ids) { deleteAnalysesForImage(id); deleteUpload(id); } return ids; },
    providerMode: config.mode,
    providerName: provider.name,
    async analyseWithProvider(upload, ownerId, request = {}) { const image = await visionImageStorage.readImage(upload.id, ownerId); return provider.analyseChart({ upload, image, request }); },
    async analyse(id, ownerId) { const upload = getUpload(id); if (!upload || upload.ownerId !== ownerId) return null; return this.analyseWithProvider(upload, ownerId, {}); },
    async markAnalysisReady(id, ownerId) { return visionImageStorage.markAnalysisReady(id, ownerId); },
    getIntegration(id, target, ownerId) { const upload = getUpload(id); if (!upload || upload.ownerId !== ownerId) return null; return target === "ask-jarvis" ? toAskJarvisContext(upload) : target === "ai-analysis" ? toAiAnalysisContext(upload) : target === "trade-planner" ? toTradePlannerContext(upload) : null; }
  };
}

export function createVisionServices(env = {}, dependencies = {}) {
  const visionEngine = createVisionEngine(env, dependencies);
  return { visionEngine, observationService: createObservationService({ visionEngine, env }) };
}
