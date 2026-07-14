const CATEGORY_CHANNEL = Object.freeze({ central_banks: "Interest-rate expectations", economy: "Risk sentiment", geopolitics: "Geopolitical risk", energy: "Energy prices", regulation: "Regulation", crypto: "Risk sentiment", technology: "Technology sentiment", ai: "Technology sentiment", commodities: "Commodity supply" });
const CATEGORY_ASSETS = Object.freeze({ central_banks: ["DXY", "XAUUSD", "EURUSD", "US100"], economy: ["DXY", "US100", "US500", "XAUUSD"], geopolitics: ["XAUUSD", "WTI", "BRENT", "US500"], energy: ["WTI", "BRENT"], regulation: ["BTCUSD", "ETHUSD"], crypto: ["BTCUSD", "ETHUSD"], gold: ["XAUUSD", "DXY"], forex: ["DXY", "EURUSD", "GBPUSD", "USDJPY"], stocks: ["US100", "US500"], technology: ["US100", "US500"], ai: ["US100", "US500"] });
export function mapAffectedAssets(article) {
  const assets = article.affectedAssets.length ? article.affectedAssets : (CATEGORY_ASSETS[article.category] || []);
  return assets.map((asset) => ({ asset, sensitivity: article.impact === "high" ? "high" : article.impact === "medium" ? "moderate" : "low", directionalPressure: "awaiting_confirmation", confidence: article.dataStatus === "verified" ? "moderate" : "low", mainReason: CATEGORY_CHANNEL[article.category] || "News context", mainRisk: "Price confirmation and source verification remain required" }));
}
export function templateSummary(article) {
  if (!article.summary) return ["Summary unavailable"];
  return [article.summary, `${article.category.replace(/_/g, " ")} is the primary category.`, article.dataStatus === "demo" ? "This is a demonstration scenario, not current market news." : "Market reaction requires confirmation."];
}
export function templateInterpretation(article) {
  const channel = CATEGORY_CHANNEL[article.category] || "Market sentiment";
  const assets = mapAffectedAssets(article).map((item) => item.asset);
  return { whyItMatters: `${article.category.replace(/_/g, " ")} developments may affect market positioning.`, potentialMechanism: channel, mainAffectedAssets: assets, mainUncertainty: article.dataStatus === "demo" ? "No verified live report or market response is connected." : "Follow-up confirmation and price response remain uncertain.", confirmationRequired: true };
}
export function buildMarketSentiment(article) {
  if (!article || article.dataStatus !== "verified") return { riskSentiment: "insufficient_data", usdSentiment: "insufficient_data", goldSentiment: "insufficient_data", equitySentiment: "insufficient_data", cryptoSentiment: "insufficient_data", energySentiment: "insufficient_data", overallMarketMood: article?.dataStatus === "demo" ? "uncertain" : "mixed" };
  return { riskSentiment: article.marketSentiment || "mixed", usdSentiment: "mixed", goldSentiment: "mixed", equitySentiment: "mixed", cryptoSentiment: "mixed", energySentiment: "mixed", overallMarketMood: "mixed" };
}
export function newsRisk(article) {
  if (!article || article.dataStatus === "demo" || article.dataStatus === "unavailable") return { reliabilityRisk: "insufficient_data", marketReactionRisk: "insufficient_data", liquidityRisk: "insufficient_data", headlineReversalRisk: "insufficient_data", followUpEventRisk: "insufficient_data", overallNewsRisk: "insufficient_data", plannerStatus: article?.dataStatus === "demo" ? "Demo" : "Source Unavailable", scannerScore: 0 };
  const level = article.impact === "high" ? "high" : article.impact === "medium" ? "moderate" : "low";
  return { reliabilityRisk: article.verificationStatus === "verified" ? "low" : "high", marketReactionRisk: level, liquidityRisk: level, headlineReversalRisk: article.isDeveloping ? "high" : "moderate", followUpEventRisk: article.isDeveloping ? "high" : "low", overallNewsRisk: level, plannerStatus: level === "high" ? "High Risk" : "Monitor", scannerScore: level === "high" ? 1 : level === "moderate" ? 3 : 5 };
}
