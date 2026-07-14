import { getMarketDataService } from "../market-data/router.js";
import { MARKET_ERROR_CODES } from "../market-data/errors.js";
import { analyseTimeframe } from "./analysis.js";
import { scoreSymbol } from "./scoring.js";

const REQUIRED_TIMEFRAMES = Object.freeze(["D1", "H4", "H1"]);
const OPTIONAL_TIMEFRAMES = Object.freeze(["M15"]);
const SCAN_CACHE_MS = 30_000;

function scanKey(filters) {
  return JSON.stringify({
    assets: [...(filters.assets || [])].sort(),
    category: filters.category || "All Markets",
    minimumScore: Number(filters.minimumScore) || 1,
    includeM15: Boolean(filters.includeM15),
  });
}

function dataQualityFor(payloads, providerName) {
  if (providerName === "MockMarketDataProvider") return "Demo";
  const required = REQUIRED_TIMEFRAMES.map((timeframe) => payloads[timeframe]).filter(Boolean);
  if (!required.length) return "Unavailable";
  if (required.length < REQUIRED_TIMEFRAMES.length) return "Partial";
  if (required.some((payload) => payload.freshness === "stale")) return "Stale";
  if (required.some((payload) => payload.freshness === "delayed" || payload.dataStatus === "delayed")) return "Delayed";
  return "Verified";
}

function aggregateFreshness(payloads) {
  const values = Object.values(payloads).map((payload) => payload.freshness);
  if (values.includes("stale")) return "stale";
  if (values.includes("delayed")) return "delayed";
  if (values.length && values.every((value) => value === "current")) return "current";
  return "unavailable";
}

function marketOverview(results, counters, dataQuality) {
  const valid = results.filter((result) => !result.hardReject);
  const biases = valid.reduce((totals, result) => ({ ...totals, [result.bias]: (totals[result.bias] || 0) + result.score }), {});
  const dominantBias = Object.entries(biases).sort((left, right) => right[1] - left[1])[0]?.[0] || "Insufficient Data";
  const setupCounts = valid.reduce((totals, result) => ({ ...totals, [result.setupType]: (totals[result.setupType] || 0) + 1 }), {});
  const strongestSetupType = Object.entries(setupCounts).sort((left, right) => right[1] - left[1])[0]?.[0] || "No Valid Setup";
	return {
		overallBias: dominantBias,
		points: [
		`Dominant bias: ${dominantBias}.`,
    `Valid setups: ${counters.validSetups}; rejected setups: ${counters.rejectedSetups}.`,
    `Strongest setup type: ${strongestSetupType}.`,
    `Data quality: ${dataQuality}.`,
		"Macro and News risk sources are unavailable; both score 0/5.",
		],
	};
}

export class ScannerService {
  constructor({ marketDataService, now = () => Date.now() } = {}) {
    this.marketDataService = marketDataService;
    this.now = now;
    this.scans = new Map();
    this.latestScanId = null;
    this.activeScan = null;
    this.cache = new Map();
  }

  getStatus(scanId) {
    const scan = this.scans.get(scanId || this.latestScanId);
    return scan ? { ...scan, results: undefined } : null;
  }

  getResults(scanId) {
    return this.scans.get(scanId || this.latestScanId) || null;
  }

  getLatest() {
    return this.getResults(this.latestScanId);
  }

  async runScan(filters = {}) {
    if (this.activeScan) return this.activeScan;
    const key = scanKey(filters);
    const cached = this.cache.get(key);
    if (cached && this.now() - cached.completedAtMs <= SCAN_CACHE_MS) return { ...cached.scan, cached: true };
    this.activeScan = this.executeScan(filters, key).finally(() => { this.activeScan = null; });
    return this.activeScan;
  }

  async executeScan(filters, key) {
    const startedAtMs = this.now();
    const startedAt = new Date(startedAtMs).toISOString();
    const scanId = `scan-${startedAtMs}`;
    const metadata = this.marketDataService.getSymbols().filter((symbol) => symbol.supported);
    const allowedAssets = new Set(metadata.map((symbol) => symbol.symbol));
	const requestedFilterAssets = Array.isArray(filters.assets) ? filters.assets : Array.isArray(filters.symbols) ? filters.symbols : [];
	const requestedAssets = requestedFilterAssets.length
		? [...new Set(requestedFilterAssets.map((asset) => String(asset).toUpperCase()))].filter((asset) => allowedAssets.has(asset))
      : metadata.filter((symbol) => !filters.category || filters.category === "All Markets" || ({ forex: "Forex", metal: "Gold", crypto: "Crypto" }[symbol.assetClass] === filters.category)).map((symbol) => symbol.symbol);
    const requiredTimeframes = [...REQUIRED_TIMEFRAMES];
    const optionalTimeframes = filters.includeM15 && requestedAssets.length === 1 ? [...OPTIONAL_TIMEFRAMES] : [];
    const scan = {
      scanId,
      mode: filters.mode || (requestedAssets.length === metadata.length ? "Full Market Scan" : "Filtered Scan"),
      status: "scanning",
      requestedSymbols: requestedAssets,
      requestedTimeframes: [...requiredTimeframes, ...optionalTimeframes],
      completedSymbols: [], partialSymbols: [], unavailableSymbols: [], rejectedSymbols: [],
      startedAt, completedAt: null, dataSource: this.marketDataService.provider.name,
      dataFreshness: "unavailable", dataQuality: "Unavailable", errorSummary: [], results: [], cached: false,
    };
    this.scans.set(scanId, scan);
    this.latestScanId = scanId;
    let rateLimited = false;
    for (const symbol of requestedAssets) {
      const payloads = {};
      for (const timeframe of [...requiredTimeframes, ...optionalTimeframes]) {
        if (rateLimited) break;
        try {
          const response = await this.marketDataService.getCandles(symbol, timeframe, 300);
          payloads[timeframe] = response.value;
        } catch (error) {
          scan.errorSummary.push({ symbol, timeframe, code: error.code || "SCANNER_DATA_UNAVAILABLE" });
          if (error.code === MARKET_ERROR_CODES.RATE_LIMITED) rateLimited = true;
        }
      }
      const requiredCount = requiredTimeframes.filter((timeframe) => payloads[timeframe]).length;
      if (requiredCount === 0) {
        scan.unavailableSymbols.push(symbol);
        continue;
      }
      if (requiredCount < requiredTimeframes.length) {
        scan.partialSymbols.push(symbol);
        continue;
      }
      scan.completedSymbols.push(symbol);
      const analyses = Object.fromEntries(Object.entries(payloads).map(([timeframe, payload]) => [timeframe, analyseTimeframe(payload.candles, timeframe)]));
      const quality = dataQualityFor(payloads, this.marketDataService.provider.name);
      const freshness = aggregateFreshness(payloads);
      const result = scoreSymbol({
        symbol,
        metadata: metadata.find((item) => item.symbol === symbol),
        analyses,
        dataQuality: quality,
        freshness,
        scanTimestamp: startedAt,
        minimumScore: Number(filters.minimumScore) || 1,
      });
      if (result.hardReject) scan.rejectedSymbols.push(symbol);
      scan.results.push(result);
    }
    const completedAtMs = this.now();
    scan.completedAt = new Date(completedAtMs).toISOString();
    scan.results.sort((left, right) => right.score - left.score || left.symbol.localeCompare(right.symbol));
    const counters = {
      requested: requestedAssets.length,
      completed: scan.completedSymbols.length,
      partial: scan.partialSymbols.length,
      unavailable: scan.unavailableSymbols.length,
      validSetups: scan.results.filter((result) => !result.hardReject).length,
      rejectedSetups: scan.rejectedSymbols.length,
    };
    if (counters.requested !== counters.completed + counters.partial + counters.unavailable) throw new Error("Scanner counter invariant failed");
    const qualities = scan.results.map((result) => result.dataQuality);
    scan.dataQuality = qualities.includes("Stale") ? "Stale" : counters.partial || counters.unavailable ? "Partial" : qualities.every((quality) => quality === "Verified") ? "Verified" : qualities[0] || "Unavailable";
    scan.dataFreshness = scan.results.some((result) => result.freshness === "stale") ? "stale" : scan.results.some((result) => result.freshness === "delayed") ? "delayed" : scan.results.length ? "current" : "unavailable";
    scan.status = counters.unavailable === counters.requested ? "failed" : counters.partial || counters.unavailable ? "partial" : "completed";
    scan.counters = counters;
    scan.marketOverview = marketOverview(scan.results, counters, scan.dataQuality);
    scan.distribution = {
      high: scan.results.filter((result) => result.band === "High").length,
      medium: scan.results.filter((result) => result.band === "Medium").length,
      low: scan.results.filter((result) => result.band === "Low").length,
      rejected: counters.rejectedSetups,
      totalValid: counters.validSetups,
    };
    this.scans.set(scanId, scan);
    this.cache.set(key, { scan, completedAtMs });
    return scan;
  }
}

const scannerServices = new Map();

export function scannerServiceFor(env = {}, options = {}) {
  const marketDataService = getMarketDataService(env, options.marketOptions || {});
  const key = `${marketDataService.provider.name}:${env.MARKET_DATA_MODE || "live"}:${env.TWELVE_DATA_BASE_URL || "default"}`;
  if (!scannerServices.has(key)) scannerServices.set(key, new ScannerService({ marketDataService, now: options.now }));
  return scannerServices.get(key);
}

export function clearScannerServiceCache() {
  scannerServices.clear();
}
