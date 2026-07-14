import { normaliseAsset, normalisePlatform, normaliseTimeframe } from "./model.js";
export function resolveChartContext({ user = {}, verifiedText = {}, provider = {}, page = {}, inferred = {} } = {}) {
  const first = (normalise, ...values) => values.map(normalise).find(Boolean) || null;
  const asset = first(normaliseAsset, user.asset, verifiedText.asset, provider.asset, page.asset, inferred.asset);
  const timeframe = first(normaliseTimeframe, user.timeframe, verifiedText.timeframe, provider.timeframe, page.timeframe, inferred.timeframe);
  const platform = first(normalisePlatform, user.platform, verifiedText.platform, provider.platform, page.platform, inferred.platform);
  const conflicts = [];
  const detectedAsset = normaliseAsset(verifiedText.asset || provider.asset);
  const detectedTimeframe = normaliseTimeframe(verifiedText.timeframe || provider.timeframe);
  if (normaliseAsset(user.asset) && detectedAsset && normaliseAsset(user.asset) !== detectedAsset) conflicts.push({ field: "asset", user: normaliseAsset(user.asset), detected: detectedAsset });
  if (normaliseTimeframe(user.timeframe) && detectedTimeframe && normaliseTimeframe(user.timeframe) !== detectedTimeframe) conflicts.push({ field: "timeframe", user: normaliseTimeframe(user.timeframe), detected: detectedTimeframe });
  return { asset, timeframe, platform, sourcePriority: "user > verified_text > provider > page > inference", conflicts };
}
