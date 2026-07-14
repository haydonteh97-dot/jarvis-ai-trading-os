import { OBSERVATION_TYPES } from "./observation-model.js";
const EVIDENCE_TYPES = ["bounding_box", "point", "line", "region", "text", "metadata"];
export function createEvidence(input = {}) {
  const confidence = Number(input.confidence || 0);
  if (!EVIDENCE_TYPES.includes(input.type)) throw Object.assign(new Error("Invalid evidence type."), { code: "VISION_INVALID_RESPONSE" });
  if (!OBSERVATION_TYPES.includes(input.observationType) || confidence < 0 || confidence > 100) throw Object.assign(new Error("Invalid evidence classification."), { code: "VISION_INVALID_RESPONSE" });
  const coordinates = input.normalisedCoordinates || {};
  for (const value of Object.values(coordinates)) if (value != null && (!Number.isFinite(value) || value < 0 || value > 1)) throw Object.assign(new Error("Invalid evidence coordinates."), { code: "VISION_INVALID_RESPONSE" });
  return { evidenceId: input.evidenceId || `evidence-${crypto.randomUUID()}`, type: input.type, label: safeText(input.label, 80), description: safeText(input.description, 240), coordinates: input.coordinates || { x: null, y: null, width: null, height: null }, normalisedCoordinates: { x: coordinates.x ?? null, y: coordinates.y ?? null, width: coordinates.width ?? null, height: coordinates.height ?? null }, observationType: input.observationType, confidence, source: safeText(input.source || "mock_vision_provider", 80) };
}
export function safeText(value, max = 500) { return String(value || "").replace(/<[^>]*>/g, "").replace(/[\u0000-\u001f]/g, " ").slice(0, max); }
