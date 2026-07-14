const RULES = {
  inflation: { higher: "Higher-than-forecast inflation may support tighter rate expectations and increase risk-off volatility.", lower: "Lower-than-forecast inflation may reduce tighter-rate pressure; market positioning still requires confirmation." },
  employment: { higher: "Stronger-than-forecast employment may support the currency through firmer rate expectations.", lower: "Weaker-than-forecast employment may pressure the currency and raise growth concerns." },
  growth: { higher: "Higher-than-forecast growth indicates stronger activity, subject to inflation and policy context.", lower: "Weaker-than-forecast growth may increase growth concern and defensive positioning." },
};
export function interpretActualVsForecast(event) {
  if (event.releaseStatus !== "released" && event.releaseStatus !== "revised") return { surprise: "not_applicable", difference: null, percentageSurprise: null, interpretation: "Awaiting Release." };
  if (event.actual == null || event.forecast == null) return { surprise: "unavailable", difference: null, percentageSurprise: null, interpretation: "Interpretation unavailable" };
  const difference = event.actual - event.forecast;
  const tolerance = Math.max(Math.abs(event.forecast) * 0.001, 1e-9);
  const surprise = Math.abs(difference) <= tolerance ? "in_line" : difference > 0 ? "stronger_than_expected" : "weaker_than_expected";
  if (surprise === "in_line") return { surprise, difference, percentageSurprise: event.forecast ? difference / Math.abs(event.forecast) * 100 : null, interpretation: "The result is broadly in line with forecast. Market reaction still depends on positioning." };
  const rule = RULES[event.category];
  return { surprise, difference, percentageSurprise: event.forecast ? difference / Math.abs(event.forecast) * 100 : null, interpretation: rule ? (difference > 0 ? rule.higher : rule.lower) : "Interpretation unavailable" };
}

export const interpretMacroEvent = interpretActualVsForecast;
