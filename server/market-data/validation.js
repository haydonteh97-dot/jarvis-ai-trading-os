import { MARKET_ERROR_CODES, MarketDataError } from "./errors.js";
import { getSymbolDefinition, getTimeframeDefinition } from "./registries.js";

export function validateSymbol(symbol) {
  const definition = getSymbolDefinition(symbol);
  if (!definition?.supported) {
    throw new MarketDataError(MARKET_ERROR_CODES.SYMBOL_UNSUPPORTED, { httpStatus: 400 });
  }
  return definition;
}

export function validateTimeframe(timeframe) {
  const definition = getTimeframeDefinition(timeframe);
  if (!definition?.supported) {
    throw new MarketDataError(MARKET_ERROR_CODES.TIMEFRAME_UNSUPPORTED, { httpStatus: 400 });
  }
  return definition;
}

export function validateLimit(value, timeframeDefinition) {
  const parsed = value == null || value === "" ? 300 : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > timeframeDefinition.safeLimit) {
    throw new MarketDataError(MARKET_ERROR_CODES.INVALID_REQUEST, { httpStatus: 400 });
  }
  return parsed;
}

export function numericOrNull(value) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function nonNegativeOrNull(value) {
  const parsed = numericOrNull(value);
  return parsed != null && parsed >= 0 ? parsed : null;
}

export function parseProviderTimestamp(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number" || /^\d{10,13}$/.test(String(value))) {
    const numberValue = Number(value);
    const milliseconds = String(Math.trunc(numberValue)).length <= 10 ? numberValue * 1000 : numberValue;
    const date = new Date(milliseconds);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  const text = String(value).trim();
  const normalised = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(text)
    ? `${text.replace(" ", "T")}Z`
    : text;
  const date = new Date(normalised);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
