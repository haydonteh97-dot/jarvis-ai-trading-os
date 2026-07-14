import { scannerServiceFor } from "./service.js";

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}

function success(data, cached = false) {
  return json({
    success: true,
    data,
    meta: { provider: data?.dataSource || "Twelve Data", startedAt: data?.startedAt || null, completedAt: data?.completedAt || null, dataQuality: data?.dataQuality || "Unavailable", cached: Boolean(cached || data?.cached) },
    error: null,
  });
}

function failure(code, message, status = 500) {
  return json({ success: false, data: null, meta: { provider: "Twelve Data", startedAt: null, completedAt: null, dataQuality: "Unavailable", cached: false }, error: { code, message } }, status);
}

async function parseBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function handleScannerApiRequest(request, env = {}, options = {}) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/scanner/")) return null;
  let service;
  try {
    service = scannerServiceFor(env, options);
    if (url.pathname === "/api/scanner/run") {
      if (request.method !== "POST") return failure("INVALID_REQUEST", "The scanner request is invalid.", 405);
      const scan = await service.runScan(await parseBody(request));
      return success(scan, scan.cached);
    }
    if (request.method !== "GET") return failure("INVALID_REQUEST", "The scanner request is invalid.", 405);
    if (url.pathname === "/api/scanner/status") {
      const status = service.getStatus(url.searchParams.get("scanId"));
      return status ? success(status) : failure("SCAN_NOT_FOUND", "The requested scan was not found.", 404);
    }
    if (url.pathname === "/api/scanner/results") {
      const results = service.getResults(url.searchParams.get("scanId"));
      return results ? success(results) : failure("SCAN_NOT_FOUND", "The requested scan was not found.", 404);
    }
    if (url.pathname === "/api/scanner/latest") {
      const latest = service.getLatest();
      return latest ? success(latest) : failure("SCAN_NOT_FOUND", "No completed scan is available.", 404);
    }
    return failure("INVALID_REQUEST", "The scanner request is invalid.", 404);
  } catch (error) {
    const code = error?.code === "MARKET_DATA_RATE_LIMITED" ? "SCANNER_RATE_LIMITED" : error?.code || "SCANNER_DATA_UNAVAILABLE";
    const message = code === "SCANNER_RATE_LIMITED" ? "Rate limit reached. Partial results were preserved." : "Scanner data is temporarily unavailable.";
    return failure(code, message, code === "SCANNER_RATE_LIMITED" ? 429 : 503);
  }
}
