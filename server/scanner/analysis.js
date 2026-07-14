import { adx, atr, detectSwings, ema, median } from "./indicators.js";

function lastValid(values) {
  for (let index = values.length - 1; index >= 0; index -= 1) if (Number.isFinite(values[index])) return values[index];
  return null;
}

function directionFrom(candles, ema20, ema50, swings) {
  const close = candles.at(-1).close;
  const last20 = lastValid(ema20);
  const last50 = lastValid(ema50);
  const highs = swings.highs.slice(-2);
  const lows = swings.lows.slice(-2);
  const higherStructure = highs.length === 2 && lows.length === 2 && highs[1].price > highs[0].price && lows[1].price > lows[0].price;
  const lowerStructure = highs.length === 2 && lows.length === 2 && highs[1].price < highs[0].price && lows[1].price < lows[0].price;
  if (last20 != null && last50 != null && close > last50 && last20 > last50 && higherStructure) return "Bullish";
  if (last20 != null && last50 != null && close < last50 && last20 < last50 && lowerStructure) return "Bearish";
  return "Neutral";
}

export function analyseTimeframe(candles, timeframe) {
  if (!Array.isArray(candles) || candles.length < 60) return { timeframe, sufficient: false, reason: "Insufficient candle data" };
  const closes = candles.map((candle) => candle.close);
  const ema20Values = ema(closes, 20);
  const ema50Values = ema(closes, 50);
  const ema200Values = ema(closes, 200);
  const atrValues = atr(candles, 14);
  const adxValues = adx(candles, 14);
  const currentAtr = lastValid(atrValues);
  const swings = detectSwings(candles, { pivot: 2, minimumDistance: (currentAtr || 0) * 0.2 });
  const direction = directionFrom(candles, ema20Values, ema50Values, swings);
  const currentAdx = lastValid(adxValues);
  const close = candles.at(-1).close;
  const prior = candles.slice(-21, -1);
  const priorHigh = Math.max(...prior.map((candle) => candle.high));
  const priorLow = Math.min(...prior.map((candle) => candle.low));
  const breakout = close > priorHigh ? "Bullish Breakout" : close < priorLow ? "Bearish Breakout" : null;
  const recentRange = Math.max(...prior.map((candle) => candle.high)) - Math.min(...prior.map((candle) => candle.low));
  const isRange = currentAdx != null && currentAdx < 20 && currentAtr != null && recentRange <= currentAtr * 10;
  const ema20Last = lastValid(ema20Values);
  const ema50Last = lastValid(ema50Values);
  const nearFastEma = currentAtr != null && ema20Last != null && Math.abs(close - ema20Last) <= currentAtr * 0.75;
  const pullback = direction === "Bullish" && nearFastEma ? "Bullish Pullback" : direction === "Bearish" && nearFastEma ? "Bearish Pullback" : null;
  const latestHighs = swings.highs.slice(-2);
  const latestLows = swings.lows.slice(-2);
  const structure = latestHighs.length === 2 && latestLows.length === 2
    ? latestHighs[1].price > latestHighs[0].price && latestLows[1].price > latestLows[0].price
      ? "Higher High / Higher Low"
      : latestHighs[1].price < latestHighs[0].price && latestLows[1].price < latestLows[0].price
        ? "Lower High / Lower Low"
        : "Mixed Structure"
    : "Insufficient Swing Structure";
  const atrMedian = median(atrValues.slice(-50));
  const volatilityRatio = currentAtr && atrMedian ? currentAtr / atrMedian : null;
  const volatility = volatilityRatio == null ? "Unavailable" : volatilityRatio >= 2 ? "Extreme" : volatilityRatio >= 1.35 ? "High" : volatilityRatio <= 0.65 ? "Low" : "Normal";
  const equalHighs = latestHighs.length === 2 && currentAtr && Math.abs(latestHighs[1].price - latestHighs[0].price) <= currentAtr * 0.2;
  const equalLows = latestLows.length === 2 && currentAtr && Math.abs(latestLows[1].price - latestLows[0].price) <= currentAtr * 0.2;
  const priorCandle = candles.at(-2);
  const highSweep = latestHighs.length && priorCandle.high > latestHighs.at(-1).price && close < latestHighs.at(-1).price;
  const lowSweep = latestLows.length && priorCandle.low < latestLows.at(-1).price && close > latestLows.at(-1).price;
  const liquidity = highSweep ? "Recent high sweep approximation" : lowSweep ? "Recent low sweep approximation" : equalHighs ? "Equal highs approximation" : equalLows ? "Equal lows approximation" : "Recent swing liquidity only";
  const setupType = breakout || pullback || (isRange ? "Range Break" : direction === "Bullish" ? "Bullish Continuation" : direction === "Bearish" ? "Bearish Continuation" : "No Valid Setup");
  return {
    timeframe, sufficient: true, direction, structure, setupType, breakout: Boolean(breakout), pullback: Boolean(pullback),
    range: isRange, liquidity, volatility, volatilityRatio, adx: currentAdx, atr: currentAtr,
    ema20: ema20Last, ema50: ema50Last, ema200: lastValid(ema200Values), close,
    swingHighs: latestHighs, swingLows: latestLows,
  };
}

export function multiTimeframeAlignment(analyses) {
  const d1 = analyses.D1?.direction;
  const h4 = analyses.H4?.direction;
  const h1 = analyses.H1?.direction;
  const m15 = analyses.M15?.direction;
  if (![d1, h4, h1].every(Boolean)) return { status: "Awaiting Data", score: 0 };
  if (d1 === h4 && h4 === h1 && d1 !== "Neutral" && (!m15 || m15 === d1 || m15 === "Neutral")) return { status: "Fully Aligned", score: 20 };
  if (d1 === h4 && d1 !== "Neutral" && (h1 === "Neutral" || h1 === d1)) return { status: "Partially Aligned", score: 15 };
  const directional = [d1, h4, h1].filter((value) => value !== "Neutral");
  if (directional.length >= 2 && new Set(directional).size === 1) return { status: "Partially Aligned", score: 10 };
  if (directional.length && new Set(directional).size > 1) return { status: "Conflicting", score: 5 };
  return { status: "Awaiting Data", score: 0 };
}
