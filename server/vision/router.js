import { createVisionServices } from "./service.js";
import { getVisionConfig, validateRequestSize } from "./validation.js";
const SAFE_ERRORS = {
  VISION_PROVIDER_NOT_CONFIGURED: [503, "Live vision provider not connected."], VISION_AUTH_FAILED: [503, "OpenAI Vision authentication failed."], VISION_MODEL_UNAVAILABLE: [503, "The configured OpenAI Vision model is unavailable."], VISION_MODEL_IMAGE_UNSUPPORTED: [503, "The configured OpenAI model does not support image input."], VISION_QUOTA_EXCEEDED: [429, "OpenAI Vision quota is unavailable."], VISION_PROVIDER_RATE_LIMITED: [429, "OpenAI Vision is temporarily rate limited."], VISION_PROVIDER_TIMEOUT: [504, "OpenAI Vision request timed out."], VISION_PROVIDER_INVALID_REQUEST: [502, "OpenAI rejected the Vision request."], VISION_PROVIDER_UNAVAILABLE: [503, "OpenAI Vision is temporarily unavailable."], VISION_UPLOAD_REQUIRED: [400, "Upload a chart image to begin."], VISION_TOO_MANY_FILES: [400, "Only one chart image may be uploaded."], VISION_FILE_TOO_LARGE: [413, "This image exceeds the allowed file size."], VISION_REQUEST_TOO_LARGE: [413, "The upload request exceeds the allowed size."], VISION_FORMAT_UNSUPPORTED: [415, "This image format is not supported. Upload PNG, JPEG or WEBP."], VISION_MIME_MISMATCH: [415, "The file type could not be verified."], VISION_IMAGE_CORRUPTED: [422, "The uploaded file is not a valid image."], VISION_IMAGE_TOO_SMALL: [422, "The chart image is too small for reliable analysis."], VISION_IMAGE_DIMENSIONS_EXCEEDED: [422, "The image dimensions exceed the safe processing limit."], VISION_PIXEL_LIMIT_EXCEEDED: [422, "The image pixel count exceeds the safe processing limit."], VISION_ANIMATED_IMAGE_UNSUPPORTED: [415, "Animated images are not supported."], VISION_IMAGE_NOT_FOUND: [404, "The uploaded image is unavailable."], VISION_IMAGE_EXPIRED: [410, "This uploaded image has expired. Please upload it again."], VISION_IMAGE_DELETED: [410, "This uploaded image has been deleted."], VISION_IMAGE_ACCESS_DENIED: [403, "This chart is not available."], VISION_ANALYSIS_NOT_FOUND: [404, "The chart analysis is unavailable."], VISION_ACCESS_DENIED: [403, "Access to this chart analysis is denied."], VISION_RATE_LIMITED: [429, "Vision request rate limited. Please retry shortly."], VISION_CONCURRENCY_LIMITED: [429, "A Vision request is already in progress."], VISION_INVALID_REQUEST: [400, "The Vision analysis request is invalid."], VISION_INVALID_RESPONSE: [502, "JARVIS could not validate the Vision response."], INVALID_REQUEST: [400, "The vision request is invalid."]
};
function json(body, status = 200) { return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" } }); }
function success(data, engine, extra = {}) { const status = engine.getStatus(); return { success: true, data, meta: { provider: status.provider, timestamp: new Date().toISOString(), dataStatus: status.dataStatus, ...extra }, error: null }; }
function failure(error, engine) { const code = error?.code || "VISION_UNAVAILABLE"; const [statusCode, message] = SAFE_ERRORS[code] || [503, "Vision intelligence is temporarily unavailable."]; const status = engine.getStatus(); return json({ success: false, data: null, meta: { provider: status.provider || null, timestamp: new Date().toISOString(), dataStatus: "unavailable" }, error: { code, message } }, statusCode); }

export async function handleVisionApiRequest(request, env = {}) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/vision/")) return null;
  const { visionEngine: engine, observationService } = createVisionServices(env);
  const config = getVisionConfig(env);
  const sessionHeader = request.headers.get("x-jarvis-session-id");
  const ownerId = sessionHeader && /^[a-zA-Z0-9._:-]{8,128}$/.test(sessionHeader) ? sessionHeader : null;
  try {
    if (request.method === "GET" && url.pathname === "/api/vision/status") return json(success(engine.getStatus(), engine));
    if (!ownerId) throw Object.assign(new Error("Access denied."), { code: "VISION_IMAGE_ACCESS_DENIED" });
    if (request.method === "POST" && ["/api/vision/uploads", "/api/vision/upload"].includes(url.pathname)) {
      validateRequestSize(request, config);
      if (!String(request.headers.get("content-type") || "").toLowerCase().startsWith("multipart/form-data")) throw Object.assign(new Error("Invalid upload content type."), { code: "VISION_INVALID_REQUEST" });
      const form = await request.formData(); const files = form.getAll("file");
      if (files.length > config.maxFiles) throw Object.assign(new Error("Too many files."), { code: "VISION_TOO_MANY_FILES" });
      const file = files[0];
      const result = await engine.upload(file, { asset: form.get("asset"), timeframe: form.get("timeframe"), platform: form.get("platform") }, ownerId);
      return json(success(result.upload, engine, { duplicate: result.duplicate }), result.duplicate ? 200 : 201);
    }
    if (request.method === "POST" && url.pathname === "/api/vision/analysis") {
      const result = await observationService.analyse(await request.json(), ownerId);
      return json(success(result.analysis, engine, { cached: result.cached }), result.cached ? 200 : 201);
    }
    const analysisMatch = url.pathname.match(/^\/api\/vision\/analysis\/([^/]+)(?:\/(observations|verify))?$/);
    if (analysisMatch) {
      const id = decodeURIComponent(analysisMatch[1]);
      const analysis = observationService.getAnalysis(id);
      if (!analysis) throw Object.assign(new Error("Analysis not found."), { code: "VISION_ANALYSIS_NOT_FOUND" });
      if (analysis.ownerId !== ownerId) throw Object.assign(new Error("Access denied."), { code: "VISION_ACCESS_DENIED" });
      if (request.method === "GET" && !analysisMatch[2]) return json(success(analysis, engine));
      if (request.method === "GET" && analysisMatch[2] === "observations") return json(success({ analysisId: id, observations: analysis.observations, evidence: analysis.evidence, confidence: analysis.confidence, uncertainties: analysis.uncertainties }, engine));
      if (request.method === "POST" && analysisMatch[2] === "verify") return json(success(await observationService.verify(id, ownerId), engine));
    }
    const imageMatch = url.pathname.match(/^\/api\/vision\/images\/([^/]+)\/content$/);
    if (request.method === "GET" && imageMatch) {
      const image = await engine.getImage(decodeURIComponent(imageMatch[1]), ownerId);
      return new Response(image.bytes, { status: 200, headers: { "content-type": image.metadata.detectedMime, "cache-control": "private, no-store", "content-disposition": "inline", "x-content-type-options": "nosniff" } });
    }
    const match = url.pathname.match(/^\/api\/vision\/uploads\/([^/]+)(?:\/(analyse|context))?$/);
    if (match) {
      const id = decodeURIComponent(match[1]);
      if (request.method === "GET" && !match[2]) { const upload = engine.getUpload(id); if (!upload || upload.ownerId !== ownerId) throw Object.assign(new Error("Image unavailable."), { code: "VISION_IMAGE_ACCESS_DENIED" }); const metadata = await engine.getImageMetadata(id, ownerId); return json(success({ ...upload, storage: metadata }, engine)); }
      if (request.method === "DELETE" && !match[2]) return json(success(await engine.deleteImage(id, ownerId), engine));
      if (request.method === "POST" && match[2] === "analyse") { const result = await engine.analyse(id, ownerId); return result ? json(success(result, engine)) : json({ success: false, error: { code: "VISION_IMAGE_NOT_FOUND", message: "The uploaded image is unavailable." } }, 404); }
      if (request.method === "GET" && match[2] === "context") { const target = url.searchParams.get("target"); const context = engine.getIntegration(id, target, ownerId); return context ? json(success(context, engine)) : json({ success: false, error: { code: "VISION_HANDOFF_INVALID", message: "The handoff destination is invalid or unavailable." } }, 400); }
    }
    return json({ success: false, error: { code: "INVALID_REQUEST", message: "Vision route not found." } }, 404);
  } catch (error) { return failure(error, engine); }
}
