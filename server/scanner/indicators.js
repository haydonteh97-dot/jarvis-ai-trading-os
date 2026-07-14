function numeric(values) {
  return values.map(Number).filter(Number.isFinite);
}

export function ema(values, period) {
  const source = values.map(Number);
  const output = Array(source.length).fill(null);
  if (!Number.isInteger(period) || period < 1 || source.length < period) return output;
  const seed = numeric(source.slice(0, period));
  if (seed.length !== period) return output;
  output[period - 1] = seed.reduce((sum, value) => sum + value, 0) / period;
  const multiplier = 2 / (period + 1);
  for (let index = period; index < source.length; index += 1) {
    if (!Number.isFinite(source[index])) continue;
    output[index] = (source[index] - output[index - 1]) * multiplier + output[index - 1];
  }
  return output;
}

function wilder(values, period) {
  const output = Array(values.length).fill(null);
  if (values.length < period) return output;
  const seed = numeric(values.slice(0, period));
  if (seed.length !== period) return output;
  output[period - 1] = seed.reduce((sum, value) => sum + value, 0) / period;
  for (let index = period; index < values.length; index += 1) {
    output[index] = (output[index - 1] * (period - 1) + values[index]) / period;
  }
  return output;
}

export function atr(candles, period = 14) {
  const ranges = candles.map((candle, index) => {
    if (index === 0) return candle.high - candle.low;
    const previousClose = candles[index - 1].close;
    return Math.max(candle.high - candle.low, Math.abs(candle.high - previousClose), Math.abs(candle.low - previousClose));
  });
  return wilder(ranges, period);
}

export function adx(candles, period = 14) {
  const trueRanges = [];
  const plusDm = [];
  const minusDm = [];
  candles.forEach((candle, index) => {
    if (index === 0) {
      trueRanges.push(candle.high - candle.low);
      plusDm.push(0);
      minusDm.push(0);
      return;
    }
    const previous = candles[index - 1];
    const upMove = candle.high - previous.high;
    const downMove = previous.low - candle.low;
    trueRanges.push(Math.max(candle.high - candle.low, Math.abs(candle.high - previous.close), Math.abs(candle.low - previous.close)));
    plusDm.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDm.push(downMove > upMove && downMove > 0 ? downMove : 0);
  });
  const smoothedTr = wilder(trueRanges, period);
  const smoothedPlus = wilder(plusDm, period);
  const smoothedMinus = wilder(minusDm, period);
  const dx = candles.map((_, index) => {
    if (!smoothedTr[index]) return null;
    const plus = 100 * smoothedPlus[index] / smoothedTr[index];
    const minus = 100 * smoothedMinus[index] / smoothedTr[index];
    return plus + minus === 0 ? 0 : 100 * Math.abs(plus - minus) / (plus + minus);
  });
  const validStart = dx.findIndex(Number.isFinite);
  if (validStart < 0) return Array(candles.length).fill(null);
  const tail = wilder(dx.slice(validStart).map((value) => value ?? 0), period);
  return Array(validStart).fill(null).concat(tail);
}

export function detectSwings(candles, { pivot = 2, minimumDistance = 0 } = {}) {
  const highs = [];
  const lows = [];
  for (let index = pivot; index < candles.length - pivot; index += 1) {
    const candle = candles[index];
    const neighbours = candles.slice(index - pivot, index + pivot + 1);
    const isHigh = neighbours.every((item, offset) => offset === pivot || candle.high > item.high);
    const isLow = neighbours.every((item, offset) => offset === pivot || candle.low < item.low);
    if (isHigh && (!highs.length || Math.abs(candle.high - highs.at(-1).price) >= minimumDistance)) highs.push({ index, price: candle.high, timestamp: candle.timestamp });
    if (isLow && (!lows.length || Math.abs(candle.low - lows.at(-1).price) >= minimumDistance)) lows.push({ index, price: candle.low, timestamp: candle.timestamp });
  }
  return { highs, lows };
}

export function median(values) {
  const sorted = numeric(values).sort((left, right) => left - right);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}
