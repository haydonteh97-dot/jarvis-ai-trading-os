function u32(bytes, offset) { return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0; }
function crc32(bytes, start, end) { let crc = 0xffffffff; for (let index = start; index < end; index += 1) { crc ^= bytes[index]; for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); } return (crc ^ 0xffffffff) >>> 0; }
function png(bytes) {
  const sig = [137,80,78,71,13,10,26,10];
  if (!sig.every((v, i) => bytes[i] === v) || bytes.length < 45) return null;
  let offset = 8, width = 0, height = 0, hasIdat = false, ended = false;
  while (offset + 12 <= bytes.length) {
    const length = u32(bytes, offset), type = String.fromCharCode(...bytes.slice(offset + 4, offset + 8)), end = offset + 12 + length;
    if (end > bytes.length) return null;
    if (crc32(bytes, offset + 4, offset + 8 + length) !== u32(bytes, offset + 8 + length)) return null;
    if (type === "IHDR" && offset === 8 && length === 13) { width = u32(bytes, offset + 8); height = u32(bytes, offset + 12); }
    if (type === "IDAT") hasIdat = true;
    if (type === "IEND") { if (length !== 0 || end !== bytes.length) return null; ended = true; break; }
    offset = end;
  }
  return width && height && hasIdat && ended ? { mimeType: "image/png", width, height, animated: false } : null;
}
function jpeg(bytes) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes.at(-2) !== 0xff || bytes.at(-1) !== 0xd9) return null;
  let offset = 2, dimensions = null, hasScan = false;
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    const marker = bytes[offset + 1];
    const length = (bytes[offset + 2] << 8) + bytes[offset + 3];
    if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) dimensions = { height: (bytes[offset + 5] << 8) + bytes[offset + 6], width: (bytes[offset + 7] << 8) + bytes[offset + 8] };
    if (marker === 0xda) { hasScan = true; break; }
    if (!length || length < 2) break;
    offset += length + 2;
  }
  return dimensions && hasScan ? { mimeType: "image/jpeg", ...dimensions, animated: false } : null;
}
function webp(bytes) {
  if (bytes.length < 30 || String.fromCharCode(...bytes.slice(0,4)) !== "RIFF" || String.fromCharCode(...bytes.slice(8,12)) !== "WEBP") return null;
  const declaredSize = bytes[4] | (bytes[5] << 8) | (bytes[6] << 16) | (bytes[7] << 24);
  if (declaredSize + 8 !== bytes.length) return null;
  const kind = String.fromCharCode(...bytes.slice(12,16));
  if (kind === "VP8X") return { mimeType: "image/webp", width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16), height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16), animated: Boolean(bytes[20] & 0x02) };
  if (kind === "VP8L" && bytes[20] === 0x2f) { const bits = bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24); return { mimeType: "image/webp", width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1, animated: false }; }
  if (kind === "VP8 " && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) return { mimeType: "image/webp", width: (bytes[26] | (bytes[27] << 8)) & 0x3fff, height: (bytes[28] | (bytes[29] << 8)) & 0x3fff, animated: false };
  return null;
}
export function inspectImageBytes(bytes, config = {}) {
  const info = png(bytes) || jpeg(bytes) || webp(bytes);
  if (!info || !info.width || !info.height) { const error = new Error("The image is corrupt or unsupported."); error.code = "VISION_IMAGE_CORRUPTED"; throw error; }
  if (info.animated) { const error = new Error("Animated images are unsupported."); error.code = "VISION_ANIMATED_IMAGE_UNSUPPORTED"; throw error; }
  const pixels = info.width * info.height;
  if (info.width < (config.minWidth || 320) || info.height < (config.minHeight || 180)) { const error = new Error("Image is too small."); error.code = "VISION_IMAGE_TOO_SMALL"; throw error; }
  if (info.width > (config.maxWidth || 10_000) || info.height > (config.maxHeight || 10_000)) { const error = new Error("Image dimensions exceed the safe limit."); error.code = "VISION_IMAGE_DIMENSIONS_EXCEEDED"; throw error; }
  if (pixels > (config.maxPixelCount || 100_000_000)) { const error = new Error("Image pixel count exceeds the safe limit."); error.code = "VISION_PIXEL_LIMIT_EXCEEDED"; throw error; }
  const quality = info.width >= 1920 && info.height >= 1080 ? "Excellent" : info.width >= 1280 && info.height >= 720 ? "Good" : info.width >= 800 && info.height >= 450 ? "Fair" : "Poor";
  return { ...info, pixelCount: pixels, quality };
}

export async function sha256(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
