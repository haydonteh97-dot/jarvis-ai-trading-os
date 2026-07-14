export function buildMacroSentiment(events) {
  const verified = events.filter((event) => event.dataStatus === "verified");
  if (!verified.length) return { usdSentiment: "insufficient_data", inflationContext: "insufficient_data", labourMarketContext: "insufficient_data", growthContext: "insufficient_data", rateExpectationContext: "insufficient_data", riskSentiment: "insufficient_data", overallMacroMode: "Insufficient Data" };
  const upcomingHigh = verified.some((event) => event.releaseStatus === "upcoming" && event.impact === "high");
  return { usdSentiment: "mixed", inflationContext: "mixed", labourMarketContext: "mixed", growthContext: "mixed", rateExpectationContext: "mixed", riskSentiment: "mixed", overallMacroMode: upcomingHigh ? "Awaiting Key Data" : "Mixed Macro Environment" };
}
