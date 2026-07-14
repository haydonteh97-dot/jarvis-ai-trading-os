import { MARKET_ERROR_CODES, MarketDataError, asMarketDataError } from "./errors.js";
import { createMarketDataService, marketServiceCacheKey } from "./service.js";

const services = new Map();

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function metaFrom(data, provider, cached = false) {
  return {
    provider: data?.provider || provider || null,
    timestamp: data?.timestamp || data?.lastUpdated || null,
    dataStatus: data?.dataStatus || "unavailable",
    freshness: data?.freshness || "unavailable",
    cached,
  };
}

function success(data, provider, cached = false) {
  return json({ success: true, data, meta: metaFrom(data, provider, cached), error: null });
}

function failure(error, provider = "Twelve Data") {
  const marketError = asMarketDataError(error);
  return json({
    success: false,
    data: null,
    meta: {
      provider,
      timestamp: null,
      dataStatus: "unavailable",
      freshness: "unavailable",
      cached: false,
    },
    error: marketError.toPublicError(),
  }, marketError.httpStatus);
}

export function getMarketDataService(env, options = {}) {
  const key = marketServiceCacheKey(env);
  if (!services.has(key)) services.set(key, createMarketDataService(env, options));
  return services.get(key);
}

export async function handleMarketApiRequest(request, env = {}, options = {}) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/market/")) return null;
  if (request.method !== "GET") {
    return failure(new MarketDataError(MARKET_ERROR_CODES.INVALID_REQUEST, { httpStatus: 405 }));
  }
  let service;
  try {
    service = getMarketDataService(env, options);
    if (url.pathname === "/api/market/status") {
      const status = service.getStatus();
      const dataStatus = status.status === "connected" && status.provider === "MockMarketDataProvider" ? "demo" : status.status === "connected" ? "verified" : "unavailable";
      const freshness = dataStatus === "verified" ? "current" : "unavailable";
      return success({ ...status, dataStatus, freshness }, status.provider);
    }
    if (url.pathname === "/api/market/symbols") {
      return success({ symbols: service.getSymbols(), dataStatus: service.provider.name === "MockMarketDataProvider" ? "demo" : "preliminary", freshness: "unavailable" }, service.provider.name);
    }
    if (url.pathname === "/api/market/quote") {
      const result = await service.getQuote(url.searchParams.get("symbol"));
      return success(result.value, service.provider.name, result.cached);
    }
    if (url.pathname === "/api/market/candles") {
      const result = await service.getCandles(
        url.searchParams.get("symbol"),
        url.searchParams.get("timeframe"),
        url.searchParams.get("limit"),
      );
      return success(result.value, service.provider.name, result.cached);
    }
    return failure(new MarketDataError(MARKET_ERROR_CODES.INVALID_REQUEST, { httpStatus: 404 }), service.provider.name);
  } catch (error) {
    return failure(error, service?.provider?.name || "Twelve Data");
  }
}

export function clearMarketServiceCache() {
  services.clear();
}
