const MIME_TO_EXTENSIONS = { "image/png": ["png"], "image/jpeg": ["jpg", "jpeg"], "image/webp": ["webp"] };
function fail(code, message) { const error = new Error(message); error.code = code; throw error; }
export function getVisionConfig(env = {}) {
  const allowed = String(env.VISION_ALLOWED_TYPES || "image/png,image/jpeg,image/webp").split(",").map((v) => v.trim()).filter((v) => MIME_TO_EXTENSIONS[v]);
  return {
    mode: String(env.VISION_MODE || "mock").toLowerCase(), provider: env.VISION_PROVIDER || "mock",
    maxFileSize: positive(env.VISION_MAX_FILE_SIZE_BYTES || env.VISION_MAX_FILE_SIZE, 10 * 1024 * 1024),
    maxRequestSize: positive(env.VISION_MAX_REQUEST_SIZE_BYTES, 11 * 1024 * 1024), maxFiles: 1,
    minWidth: positive(env.VISION_MIN_WIDTH, 480), minHeight: positive(env.VISION_MIN_HEIGHT, 320),
    maxWidth: positive(env.VISION_MAX_WIDTH, 10_000), maxHeight: positive(env.VISION_MAX_HEIGHT, 10_000), maxPixelCount: positive(env.VISION_MAX_PIXEL_COUNT, 40_000_000),
    tempRetentionHours: positive(env.VISION_TEMP_RETENTION_HOURS, 24), analysisRetentionDays: positive(env.VISION_ANALYSIS_RETENTION_DAYS, 30), retainOriginal: String(env.VISION_RETAIN_ORIGINAL_IMAGE || "false").toLowerCase() === "true",
    uploadsPerMinute: positive(env.VISION_UPLOADS_PER_MINUTE, 10), analysesPerMinute: positive(env.VISION_ANALYSES_PER_MINUTE, 20), maxActiveUploads: positive(env.VISION_MAX_ACTIVE_UPLOADS, 2), maxActiveAnalyses: positive(env.VISION_MAX_ACTIVE_ANALYSES, 2),
    allowedTypes: allowed, timeout: positive(env.VISION_TIMEOUT_MS || env.VISION_TIMEOUT, 15_000), schemaVersion: String(env.VISION_SCHEMA_VERSION || "1.0"), analysisVersion: String(env.VISION_ANALYSIS_VERSION || "1.0"), enableOcr: false
  };
}
function positive(value, fallback) { const parsed = Number(value); return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback; }
export function validateUploadFile(file, config) {
  if (!file || typeof file.arrayBuffer !== "function") fail("VISION_UPLOAD_REQUIRED", "An image file is required.");
  if (!file.size) fail("VISION_IMAGE_CORRUPTED", "The selected file is empty.");
  if (file.size > config.maxFileSize) fail("VISION_FILE_TOO_LARGE", "The selected image exceeds the supported file size.");
  const mime = String(file.type || "").toLowerCase();
  if (!config.allowedTypes.includes(mime)) fail("VISION_FORMAT_UNSUPPORTED", "Upload a PNG, JPEG or WEBP image.");
  const extension = String(file.name || "").split(".").pop().toLowerCase();
  if (/\.(exe|com|bat|cmd|ps1|js|html?|svg|pdf|zip)\./i.test(String(file.name || ""))) fail("VISION_FORMAT_UNSUPPORTED", "Potentially unsafe double-extension filename.");
  if (!MIME_TO_EXTENSIONS[mime]?.includes(extension)) fail("VISION_MIME_MISMATCH", "The file extension does not match its image type.");
}
export function validateRequestSize(request, config) { const size = Number(request.headers.get("content-length") || 0); if (size > config.maxRequestSize) fail("VISION_REQUEST_TOO_LARGE", "The upload request exceeds the allowed size."); }
export function sanitizeFilename(value) { return String(value || "chart").replace(/[\u0000-\u001f\u007f-\u009f]/g, "").replace(/<[^>]*>/g, "").replace(/[\\/]+/g, "-").replace(/\.\.+/g, ".").replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 120) || "chart"; }
