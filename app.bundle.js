(function() {
	//#region ../Users/USER/Documents/交易指标自动化/jarvis-mvp/core/shared/intelligenceResponse.js
	const INTELLIGENCE_STATUS = {
		READY: "ready",
		MOCK: "mock",
		OFFLINE: "offline",
		ERROR: "error"
	};
	function createIntelligenceResponse({ id, moduleName, status = INTELLIGENCE_STATUS.MOCK, confidence = 0, summary = "", recommendation = "", updatedAt = (/* @__PURE__ */ new Date()).toISOString(), metadata = {} }) {
		return {
			id,
			moduleName,
			status,
			confidence,
			summary,
			recommendation,
			updatedAt,
			metadata
		};
	}
	function isValidIntelligenceResponse(response) {
		return Boolean(response && response.id && response.moduleName && response.status && typeof response.confidence === "number" && response.summary && response.recommendation && response.updatedAt && response.metadata && typeof response.metadata === "object");
	}
	//#endregion
	//#region ../Users/USER/Documents/交易指标自动化/jarvis-mvp/core/jarvisCore/jarvisCore.js
	var JarvisCore = class {
		constructor({ registry }) {
			this.registry = registry;
		}
		async generateUnifiedIntelligence() {
			const validOutputs = (await Promise.all(this.registry.getAll().map((module) => module.run()))).filter(isValidIntelligenceResponse);
			const prioritized = this.prioritize(validOutputs);
			return {
				id: `jarvis-core-${Date.now()}`,
				status: "mock",
				generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
				summary: this.createSummary(prioritized),
				recommendation: this.createRecommendation(prioritized),
				outputs: prioritized,
				conflicts: this.resolveConflicts(prioritized)
			};
		}
		prioritize(outputs) {
			return [...outputs].sort((a, b) => b.confidence - a.confidence);
		}
		createSummary(outputs) {
			return outputs.slice(0, 3).map((output) => output.summary).join(" ");
		}
		createRecommendation(outputs) {
			return outputs.find((output) => output.moduleName === "Decision Intelligence")?.recommendation || outputs[0]?.recommendation || "Prepare first. Execute only when the plan is clear.";
		}
		resolveConflicts(outputs) {
			const market = outputs.find((output) => output.moduleName === "Market Intelligence");
			const risk = outputs.find((output) => output.moduleName === "Risk Intelligence");
			const conflicts = [];
			if (market?.metadata?.tone === "Bullish" && risk?.metadata?.riskMode === "Protect capital") conflicts.push({
				type: "risk-adjusted-market-bias",
				message: "Market mock bias is bullish, but Risk Intelligence prioritizes capital protection.",
				resolution: "Prepare the setup, but delay execution until confirmation is present."
			});
			return conflicts;
		}
	};
	//#endregion
	//#region ../Users/USER/Documents/交易指标自动化/jarvis-mvp/core/modules/createMockModule.js
	function createMockModule({ id, moduleName, confidence, summary, recommendation, metadata = {} }) {
		return {
			id,
			moduleName,
			run() {
				return createIntelligenceResponse({
					id: `${id}-${Date.now()}`,
					moduleName,
					confidence,
					summary,
					recommendation,
					metadata
				});
			}
		};
	}
	//#endregion
	//#region ../Users/USER/Documents/交易指标自动化/jarvis-mvp/core/modules/behavior/index.js
	const behaviorIntelligence = createMockModule({
		id: "behavior-intelligence",
		moduleName: "Behavior Intelligence",
		confidence: 84,
		summary: "No signs of overtrading are detected in the mock behavior profile.",
		recommendation: "Stay patient and wait for one high-probability setup.",
		metadata: {
			discipline: 84,
			consistency: 79,
			overtrading: false
		}
	});
	//#endregion
	//#region ../Users/USER/Documents/交易指标自动化/jarvis-mvp/core/services/mockMarketDataService.js
	const forexCurrencies = [
		"USD",
		"EUR",
		"GBP",
		"JPY",
		"AUD",
		"NZD",
		"CAD",
		"CHF",
		"CNH",
		"SGD",
		"HKD",
		"MXN",
		"ZAR"
	];
	const instrumentAliases = [
		{
			symbol: "XAUUSD",
			label: "Gold",
			type: "metal",
			aliases: [
				"GOLD",
				"XAU",
				"XAUUSD",
				"XAU/USD"
			]
		},
		{
			symbol: "XAGUSD",
			label: "Silver",
			type: "metal",
			aliases: [
				"SILVER",
				"XAG",
				"XAGUSD",
				"XAG/USD"
			]
		},
		{
			symbol: "BTCUSD",
			label: "Bitcoin",
			type: "crypto",
			aliases: [
				"BTC",
				"BITCOIN",
				"BTCUSD",
				"BTC/USD"
			]
		},
		{
			symbol: "ETHUSD",
			label: "Ethereum",
			type: "crypto",
			aliases: [
				"ETH",
				"ETHEREUM",
				"ETHUSD",
				"ETH/USD"
			]
		},
		{
			symbol: "SOLUSD",
			label: "Solana",
			type: "crypto",
			aliases: [
				"SOL",
				"SOLANA",
				"SOLUSD",
				"SOL/USD"
			]
		},
		{
			symbol: "DXY",
			label: "Dollar Index",
			type: "forex",
			aliases: [
				"DXY",
				"DOLLARINDEX",
				"USDINDEX"
			]
		},
		{
			symbol: "NAS100",
			label: "Nasdaq 100",
			type: "index",
			aliases: [
				"NAS100",
				"NASDAQ",
				"NASDAQ100",
				"USTEC",
				"US100"
			]
		},
		{
			symbol: "US30",
			label: "Dow Jones",
			type: "index",
			aliases: [
				"US30",
				"DJI",
				"DOW",
				"DOWJONES"
			]
		},
		{
			symbol: "SPX500",
			label: "S&P 500",
			type: "index",
			aliases: [
				"SPX500",
				"SP500",
				"S&P500",
				"US500"
			]
		},
		{
			symbol: "GER40",
			label: "DAX",
			type: "index",
			aliases: [
				"GER40",
				"DAX",
				"DE40",
				"DAX40"
			]
		},
		{
			symbol: "UK100",
			label: "FTSE 100",
			type: "index",
			aliases: [
				"UK100",
				"FTSE",
				"FTSE100"
			]
		},
		{
			symbol: "JP225",
			label: "Nikkei 225",
			type: "index",
			aliases: [
				"JP225",
				"NIKKEI",
				"NIKKEI225"
			]
		},
		{
			symbol: "HK50",
			label: "Hang Seng",
			type: "index",
			aliases: [
				"HK50",
				"HSI",
				"HANGSENG"
			]
		},
		{
			symbol: "TSLA",
			label: "Tesla",
			type: "stock",
			aliases: ["TESLA", "TSLA"]
		},
		{
			symbol: "AAPL",
			label: "Apple",
			type: "stock",
			aliases: ["APPLE", "AAPL"]
		},
		{
			symbol: "NVDA",
			label: "Nvidia",
			type: "stock",
			aliases: ["NVIDIA", "NVDA"]
		},
		{
			symbol: "MSFT",
			label: "Microsoft",
			type: "stock",
			aliases: ["MICROSOFT", "MSFT"]
		}
	];
	function resolveInstrument(input = "") {
		const raw = String(input || "").toUpperCase();
		const compact = raw.replace(/[^A-Z0-9]/g, "");
		const aliasMatch = instrumentAliases.find((instrument) => instrument.aliases.some((alias) => compact.includes(alias.replace(/[^A-Z0-9]/g, ""))));
		if (aliasMatch) return aliasMatch;
		for (const base of forexCurrencies) for (const quote of forexCurrencies) {
			if (base === quote) continue;
			const symbol = `${base}${quote}`;
			if (compact.includes(symbol) || raw.includes(`${base}/${quote}`)) return {
				symbol,
				label: `${base}/${quote}`,
				type: "forex",
				aliases: [symbol, `${base}/${quote}`]
			};
		}
		return instrumentAliases[0];
	}
	function profileForInstrument(instrument) {
		if (instrument.type === "forex") return {
			marketBias: "Balanced Bullish",
			confidence: 76,
			marketStructure: "Range expansion with higher-low pressure",
			liquidityStatus: "Liquidity is building around the previous session high and low.",
			volatility: "Medium",
			session: "London / New York overlap watch",
			keyZones: ["Previous session high", "Previous session low"],
			risk: "Medium",
			plan: "Wait for session direction and avoid entering inside the middle of the range."
		};
		if (instrument.type === "index") return {
			marketBias: "Cautiously Bullish",
			confidence: 78,
			marketStructure: "Trend continuation with pullback risk",
			liquidityStatus: "Buy-side liquidity is resting above the recent high.",
			volatility: "Medium High",
			session: "US cash session focus",
			keyZones: ["Opening range", "Previous day high"],
			risk: "Medium High",
			plan: "Wait for opening range confirmation before considering continuation."
		};
		if (instrument.type === "crypto") return {
			marketBias: "Momentum Neutral",
			confidence: 72,
			marketStructure: "Volatile range with breakout risk",
			liquidityStatus: "Liquidity is clustered above and below the current range.",
			volatility: "High",
			session: "Crypto 24H session",
			keyZones: ["Range high", "Range low"],
			risk: "High",
			plan: "Wait for a clean breakout or rejection. Do not chase the middle of the range."
		};
		if (instrument.type === "stock") return {
			marketBias: "Event Sensitive",
			confidence: 68,
			marketStructure: "Equity momentum depends on session flow and broader index risk",
			liquidityStatus: "Liquidity is concentrated near premarket high, previous close, and earnings/news reaction zones.",
			volatility: "Medium High",
			session: "US equity session",
			keyZones: ["Premarket high", "Previous close"],
			risk: "Medium High",
			plan: "Wait for US session confirmation and avoid trading before major company or macro news."
		};
		if (instrument.symbol === "XAGUSD") return {
			marketBias: "Neutral Bullish",
			confidence: 74,
			marketStructure: "Corrective pullback inside a broader bullish leg",
			liquidityStatus: "Short-term liquidity is clustered around the prior swing points.",
			volatility: "Medium",
			session: "London metals session",
			keyZones: ["Prior swing high", "Demand reaction zone"],
			risk: "Medium",
			plan: "Let Silver confirm direction first; avoid chasing after expansion candles."
		};
		return {
			marketBias: "Bullish",
			confidence: 84,
			marketStructure: "Bullish continuation",
			liquidityStatus: "Buy-side liquidity rests above the previous high.",
			volatility: "Medium",
			session: "London session",
			keyZones: ["Pullback confirmation zone", "Previous swing low"],
			risk: "Medium",
			plan: "Wait for pullback confirmation before considering long positions."
		};
	}
	function getMockMarketSnapshot(input = "") {
		const instrument = resolveInstrument(input);
		const profile = profileForInstrument(instrument);
		return {
			symbol: instrument.symbol,
			label: instrument.label,
			type: instrument.type,
			...profile,
			lastUpdated: "09:35"
		};
	}
	//#endregion
	//#region ../Users/USER/Documents/交易指标自动化/jarvis-mvp/core/services/liveMarketDataService.js
	const quoteProxyUrl = typeof window === "undefined" ? "http://127.0.0.1:4175/api/quote" : "/api/quote";
	async function getLiveMarketQuote(input = "") {
		const instrument = resolveInstrument(input);
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 1800);
			const url = `${quoteProxyUrl}?symbol=${encodeURIComponent(instrument.symbol)}`;
			const response = await fetch(url, { signal: controller.signal });
			clearTimeout(timeoutId);
			if (!response.ok) throw new Error(`Quote unavailable: ${response.status}`);
			const quote = await response.json();
			if (!quote?.price) throw new Error("Quote payload missing price");
			return {
				...quote,
				symbol: instrument.symbol,
				label: instrument.label,
				type: instrument.type,
				source: "live"
			};
		} catch {
			return {
				symbol: instrument.symbol,
				label: instrument.label,
				type: instrument.type,
				source: "unavailable",
				price: null,
				updatedAt: null
			};
		}
	}
	function formatLivePrice(quote) {
		if (!quote?.price) return "";
		const decimals = quote.type === "forex" && quote.symbol.includes("JPY") ? 3 : quote.type === "forex" ? 5 : 2;
		return Number(quote.price).toLocaleString(void 0, {
			maximumFractionDigits: decimals,
			minimumFractionDigits: quote.type === "forex" ? Math.min(decimals, 3) : 2
		});
	}
	//#endregion
	//#region ../Users/USER/Documents/交易指标自动化/jarvis-mvp/core/services/mockChartAnalysisService.js
	const defaultAnalysis = {
		pair: "XAUUSD",
		instrumentType: "metal",
		timeframe: "M15",
		bias: "Bullish",
		confidence: 81,
		confidenceLabel: "Medium",
		marketStructure: "Higher highs after liquidity sweep.",
		liquidity: "Sell-side liquidity has been swept; price is reacting from a demand area.",
		keyZones: ["Pullback confirmation zone", "Invalidation zone"],
		risk: "Medium",
		recommendation: "Wait for confirmation before entry. No blind signal is provided.",
		learningNote: "Trend continuation setup. Focus on confirmation, invalidation, and risk first.",
		professionalView: "The opportunity is present, but the decision should be confirmation-led rather than prediction-led.",
		keyObservations: [
			"Structure is constructive.",
			"Liquidity has already been tested.",
			"Current price needs better risk/reward."
		],
		importantPriceLevels: ["Pullback confirmation zone", "Invalidation zone"],
		riskAwareness: "Medium risk. Do not chase expansion without a clean invalidation point.",
		alternativeScenario: "If price fails to hold the confirmation zone, the bullish idea should be paused.",
		mentorNotes: "Good trades do not need to be forced. Let price come to your plan.",
		tradingSafety: {
			score: "Medium",
			marketRisk: "Medium",
			accountRisk: "Controlled",
			riskReward: "Wait for cleaner R:R",
			emotionalRisk: "Avoid chasing",
			newsRisk: "Check upcoming high-impact news",
			overallRisk: "Medium"
		},
		disclaimer: "JARVIS provides educational market analysis and risk guidance. The final trading decision remains the responsibility of the trader."
	};
	function getMockChartStandby() {
		return {
			uploadStatus: "Waiting for chart upload",
			setupQuality: 78,
			latestAnalysis: defaultAnalysis,
			history: []
		};
	}
	function getConfidenceLabel(value) {
		if (value >= 82) return "High";
		if (value >= 65) return "Medium";
		return "Low";
	}
	function getNewsRisk(snapshot) {
		if (/london|new york/i.test(snapshot.session)) return "Medium";
		if (snapshot.type === "crypto") return "Medium";
		return "Check calendar";
	}
	function formatPlanningPrice(value, type) {
		if (typeof value !== "number" || Number.isNaN(value)) return "";
		const decimals = type === "forex" ? 5 : type === "crypto" ? 0 : 2;
		return value.toLocaleString(void 0, {
			maximumFractionDigits: decimals,
			minimumFractionDigits: type === "forex" ? Math.min(decimals, 3) : 2
		});
	}
	function buildTradePlan({ snapshot, liveQuote, question, bias }) {
		const price = liveQuote?.price;
		const isBullish = bias !== "Bearish";
		const type = snapshot.type;
		const hasPrice = typeof price === "number";
		const entryDistance = type === "forex" ? .0018 : type === "crypto" ? .012 : .0022;
		const stopDistance = type === "forex" ? .0032 : type === "crypto" ? .024 : .0042;
		const tp1Distance = type === "forex" ? .0045 : type === "crypto" ? .032 : .0062;
		const tp2Distance = type === "forex" ? .0075 : type === "crypto" ? .052 : .0105;
		if (!hasPrice) return {
			clarity: "Limited",
			professionalView: "I can identify the planning logic, but the exact price scale is not clear enough for precise RR.",
			potentialEntryZone: "Confirmation / pullback zone shown on chart",
			entryReason: "This is the area where structure should confirm before any decision.",
			stopLossReference: "Beyond the invalidation swing",
			stopReason: "If price breaks the invalidation swing, the trade idea weakens.",
			takeProfitZones: ["Nearest liquidity target", "Next resistance / support area"],
			takeProfitReason: "Targets should align with liquidity and nearby structure.",
			estimatedRR: "Cannot calculate exact RR because the price scale is not clear.",
			riskRewardAssessment: "Planning possible, exact RR unavailable.",
			conditionsNeeded: [
				"Wait for price to return into the planning zone.",
				"Look for rejection or minor structure confirmation.",
				"Avoid entry near the middle of the range.",
				"Check high-impact news first.",
				"Only continue if risk-reward is healthy."
			]
		};
		const entryMid = isBullish ? price * (1 - entryDistance) : price * (1 + entryDistance);
		const entryLow = entryMid * (1 - entryDistance * .45);
		const entryHigh = entryMid * (1 + entryDistance * .45);
		const stop = isBullish ? price * (1 - stopDistance) : price * (1 + stopDistance);
		const tp1 = isBullish ? price * (1 + tp1Distance) : price * (1 - tp1Distance);
		const tp2 = isBullish ? price * (1 + tp2Distance) : price * (1 - tp2Distance);
		const riskPoints = Math.abs(entryMid - stop);
		const reward1 = Math.abs(tp1 - entryMid);
		const reward2 = Math.abs(tp2 - entryMid);
		const rr1 = reward1 / riskPoints;
		const rr2 = reward2 / riskPoints;
		const rrText = `Entry ${formatPlanningPrice(entryMid, type)}, SL reference ${formatPlanningPrice(stop, type)}, TP1 ${formatPlanningPrice(tp1, type)} gives approx 1:${rr1.toFixed(1)}. TP2 improves toward 1:${rr2.toFixed(1)}.`;
		return {
			clarity: /(entry|tp|take profit|sl|stop loss|放哪里|哪里|止损|止盈|进场)/i.test(question) ? "Actionable planning only" : "Context planning",
			professionalView: isBullish ? "Structure is constructive, but chasing current price gives weaker risk-reward. A pullback framework is cleaner." : "Structure leans defensive, but selling still needs confirmation. A rejection framework is cleaner than chasing.",
			potentialEntryZone: `${formatPlanningPrice(entryLow, type)} - ${formatPlanningPrice(entryHigh, type)}`,
			entryReason: isBullish ? "This area is a possible pullback / confirmation zone and offers cleaner risk-reward than chasing current price." : "This area is a possible rejection / confirmation zone and should prove sellers are still in control.",
			stopLossReference: isBullish ? `Below ${formatPlanningPrice(stop, type)}` : `Above ${formatPlanningPrice(stop, type)}`,
			stopReason: isBullish ? "If price breaks below this reference area, the bullish structure may no longer be valid." : "If price breaks above this reference area, the bearish structure may no longer be valid.",
			takeProfitZones: [`TP1: ${formatPlanningPrice(tp1, type)}`, `TP2: ${formatPlanningPrice(tp2, type)}`],
			takeProfitReason: "These areas are possible liquidity / profit-taking zones, not guaranteed targets.",
			estimatedRR: rrText,
			riskRewardAssessment: rr2 >= 2 ? "Potentially acceptable if confirmation appears." : "Not ideal yet; waiting may improve the profile.",
			conditionsNeeded: [
				"Pullback into the planning zone.",
				"Clear rejection candle or minor structure confirmation.",
				"No high-impact news nearby.",
				"Risk-reward preferably near 1:2 or better.",
				"No chasing if price has already expanded."
			]
		};
	}
	async function analyzeMockChartUpload({ fileName = "uploaded-chart.png", previewUrl = "", question = "", previousMission = null, journal = [] } = {}) {
		const snapshot = getMockMarketSnapshot(`${question} ${fileName}`);
		const liveQuote = await getLiveMarketQuote(`${question} ${fileName}`);
		const bias = snapshot.marketBias.includes("Bearish") ? "Bearish" : snapshot.marketBias.includes("Neutral") ? "Neutral Bullish" : "Bullish";
		const confidence = Math.max(68, snapshot.confidence - 3);
		const emotionalRisk = question.toLowerCase().includes("now") ? "Chasing risk detected" : "Stable";
		const newsRisk = getNewsRisk(snapshot);
		const tradePlan = buildTradePlan({
			snapshot,
			liveQuote,
			question,
			bias
		});
		const previousContext = previousMission?.pair ? `Previous mission context: ${previousMission.pair} ${previousMission.bias}.` : "No previous mission conflict detected.";
		const journalContext = journal.length ? `Journal context: ${journal.length} saved mission(s) available for review.` : "No journal review pressure detected.";
		return {
			...defaultAnalysis,
			id: `chart-analysis-${Date.now()}`,
			pair: snapshot.symbol,
			instrument: snapshot.label,
			instrumentType: snapshot.type,
			bias,
			confidence,
			confidenceLabel: getConfidenceLabel(confidence),
			marketStructure: `${snapshot.marketStructure}.`,
			liquidity: snapshot.liquidityStatus,
			keyZones: snapshot.keyZones,
			risk: snapshot.risk,
			recommendation: `${snapshot.plan} No blind signal is provided.`,
			learningNote: `${snapshot.label} requires confirmation, invalidation, and position discipline before any decision.`,
			chartClarity: "Chart uploaded, mock visual reading active",
			confidenceNote: "I can use the uploaded chart context, but this Alpha version still relies on mock structure reading and live reference price.",
			professionalView: tradePlan.professionalView || `The current ${snapshot.label} structure gives a tradable context, but it is not a reason to chase price.`,
			keyObservations: [
				snapshot.marketStructure,
				snapshot.liquidityStatus,
				`Session context: ${snapshot.session}`,
				previousContext,
				journalContext
			],
			importantPriceLevels: snapshot.keyZones,
			riskAwareness: `${snapshot.risk} risk. ${tradePlan.riskRewardAssessment} Wait until the stop area and invalidation are clear before making any decision.`,
			alternativeScenario: bias === "Bearish" ? `If ${snapshot.label} breaks above the rejection area with strength, the bearish idea becomes weak. If price rejects and breaks lower, bearish continuation becomes more likely.` : `If ${snapshot.label} breaks above the recent high with strength, bullish continuation becomes more likely. If price rejects the zone and breaks below support, waiting is safer.`,
			mentorNotes: "The final decision belongs to the trader. JARVIS protects decision quality; it does not give blind buy or sell instructions.",
			tradePlan,
			tradingSafety: {
				score: emotionalRisk.includes("Chasing") || snapshot.risk === "High" ? "Low" : snapshot.risk === "Low" ? "Strong" : "Medium",
				marketRisk: snapshot.risk,
				accountRisk: snapshot.risk === "High" ? "Reduce exposure" : "Controlled",
				riskReward: tradePlan.riskRewardAssessment,
				emotionalRisk,
				newsRisk,
				overallRisk: emotionalRisk.includes("Chasing") || snapshot.risk === "High" ? "High" : snapshot.risk
			},
			disclaimer: defaultAnalysis.disclaimer,
			livePrice: liveQuote.price,
			livePriceText: formatLivePrice(liveQuote),
			liveCurrency: liveQuote.currency,
			liveUpdatedAt: liveQuote.updatedAt,
			liveSource: liveQuote.source,
			demoMode: "Demo Analysis",
			fileName,
			previewUrl,
			analyzedAt: (/* @__PURE__ */ new Date()).toISOString()
		};
	}
	//#endregion
	//#region ../Users/USER/Documents/交易指标自动化/jarvis-mvp/core/modules/chart/index.js
	const chartIntelligence = {
		id: "chart-intelligence",
		moduleName: "Chart Intelligence",
		run() {
			const standby = getMockChartStandby();
			const analysis = standby.latestAnalysis;
			return createIntelligenceResponse({
				id: `chart-intelligence-${Date.now()}`,
				moduleName: "Chart Intelligence",
				confidence: standby.setupQuality,
				summary: `Chart Intelligence is ready for upload. Mock analysis profile: ${analysis.pair} ${analysis.timeframe}, ${analysis.bias.toLowerCase()} bias, ${analysis.marketStructure}`,
				recommendation: `${analysis.recommendation} Learning note: ${analysis.learningNote}`,
				metadata: standby
			});
		}
	};
	//#endregion
	//#region ../Users/USER/Documents/交易指标自动化/jarvis-mvp/core/modules/decision/index.js
	const decisionIntelligence = createMockModule({
		id: "decision-intelligence",
		moduleName: "Decision Intelligence",
		confidence: 86,
		summary: "The combined mock decision is preparation first, execution only after confirmation.",
		recommendation: "Do not chase. Wait for confirmation, define risk, then execute calmly.",
		metadata: { finalBias: "Prepare and wait" }
	});
	//#endregion
	//#region ../Users/USER/Documents/交易指标自动化/jarvis-mvp/core/modules/growth/index.js
	const growthIntelligence = createMockModule({
		id: "growth-intelligence",
		moduleName: "Growth Intelligence",
		confidence: 81,
		summary: "Growth path is progressing toward the next mentor review unlock.",
		recommendation: "Maintain discipline above 80% to unlock the next stage.",
		metadata: {
			nextUnlock: "Mentor Review",
			discipline: 84,
			consistency: 79
		}
	});
	//#endregion
	//#region ../Users/USER/Documents/交易指标自动化/jarvis-mvp/core/modules/journal/index.js
	const journalIntelligence = createMockModule({
		id: "journal-intelligence",
		moduleName: "Journal Intelligence",
		confidence: 73,
		summary: "Journal is ready for a pre-trade note, but no real journal entry exists yet.",
		recommendation: "Write the reason, invalidation, and emotion state before entering.",
		metadata: { todayEntry: "Not written" }
	});
	//#endregion
	//#region ../Users/USER/Documents/交易指标自动化/jarvis-mvp/core/modules/learning/index.js
	const learningIntelligence = createMockModule({
		id: "learning-intelligence",
		moduleName: "Learning Intelligence",
		confidence: 79,
		summary: "Learning path recommends continuing the market structure lesson.",
		recommendation: "Complete one short lesson before the next trading session.",
		metadata: {
			module: "Market Structure",
			progress: 53
		}
	});
	//#endregion
	//#region ../Users/USER/Documents/交易指标自动化/jarvis-mvp/core/modules/macro/index.js
	const macroIntelligence = createMockModule({
		id: "macro-intelligence",
		moduleName: "Macro Intelligence",
		confidence: 74,
		summary: "Macro risk is medium in mock mode because high-impact news is scheduled later.",
		recommendation: "Reduce trade frequency until the news window is clear.",
		metadata: {
			riskLevel: "Medium Risk",
			event: "Mock CPI tonight"
		}
	});
	//#endregion
	//#region ../Users/USER/Documents/交易指标自动化/jarvis-mvp/core/modules/market/index.js
	const marketIntelligence = {
		id: "market-intelligence",
		moduleName: "Market Intelligence",
		run() {
			const snapshot = getMockMarketSnapshot();
			return createIntelligenceResponse({
				id: `market-intelligence-${Date.now()}`,
				moduleName: "Market Intelligence",
				confidence: snapshot.confidence,
				summary: `${snapshot.symbol} is showing a ${snapshot.marketBias.toLowerCase()} mock bias with ${snapshot.marketStructure.toLowerCase()} structure during the ${snapshot.session}.`,
				recommendation: `${snapshot.plan} Reason: liquidity is still above the previous high and volatility is ${snapshot.volatility.toLowerCase()}, so confirmation matters more than prediction.`,
				metadata: {
					tone: snapshot.marketBias,
					symbol: snapshot.symbol,
					marketBias: snapshot.marketBias,
					marketStructure: snapshot.marketStructure,
					liquidityStatus: snapshot.liquidityStatus,
					volatility: snapshot.volatility,
					session: snapshot.session,
					keyZones: snapshot.keyZones,
					keyLevel: snapshot.keyZones[0],
					risk: snapshot.risk,
					lastUpdated: snapshot.lastUpdated,
					plan: snapshot.plan
				}
			});
		}
	};
	//#endregion
	//#region ../Users/USER/Documents/交易指标自动化/jarvis-mvp/core/modules/replay/index.js
	const replayIntelligence = createMockModule({
		id: "replay-intelligence",
		moduleName: "Replay Intelligence",
		confidence: 69,
		summary: "Replay module has a mock reminder to review one previous similar setup.",
		recommendation: "Replay one past trade before taking a similar setup today.",
		metadata: { replayStatus: "Mock replay ready" }
	});
	//#endregion
	//#region ../Users/USER/Documents/交易指标自动化/jarvis-mvp/core/modules/risk/index.js
	const riskIntelligence = createMockModule({
		id: "risk-intelligence",
		moduleName: "Risk Intelligence",
		confidence: 88,
		summary: "Risk state is stable, but exposure should remain controlled in this mock session.",
		recommendation: "Use reduced risk and stop after the daily goal is protected.",
		metadata: {
			maxRisk: "0.5%",
			riskMode: "Protect capital"
		}
	});
	//#endregion
	//#region ../Users/USER/Documents/交易指标自动化/jarvis-mvp/core/services/mockTradingAccountService.js
	function getMockTradingAccount() {
		return {
			balance: 1e4,
			equity: 10045,
			currency: "USD",
			todayProfit: 45,
			dailyGoalProgress: 75,
			openPositions: 1,
			floatingPL: 12,
			dailyDrawdown: 1.2,
			riskStatus: "Healthy",
			tradingStatus: "Within Plan"
		};
	}
	//#endregion
	//#region ../Users/USER/Documents/交易指标自动化/jarvis-mvp/core/modules/trading/index.js
	const tradingIntelligence = {
		id: "trading-intelligence",
		moduleName: "Trading Intelligence",
		run() {
			const account = getMockTradingAccount();
			return createIntelligenceResponse({
				id: `trading-intelligence-${Date.now()}`,
				moduleName: "Trading Intelligence",
				confidence: account.dailyGoalProgress,
				summary: `Mock account is ${account.tradingStatus.toLowerCase()}: balance ${account.balance.toLocaleString()} ${account.currency}, today's profit +${account.todayProfit} ${account.currency}, daily goal ${account.dailyGoalProgress}%.`,
				recommendation: "Never execute from JARVIS. This is read-only account intelligence: protect profit, monitor drawdown, and stay within the plan.",
				metadata: {
					balance: account.balance,
					equity: account.equity,
					currency: account.currency,
					todayProfit: account.todayProfit,
					dailyGoalProgress: account.dailyGoalProgress,
					openPositions: account.openPositions,
					floatingPL: account.floatingPL,
					dailyDrawdown: account.dailyDrawdown,
					riskStatus: account.riskStatus,
					tradingStatus: account.tradingStatus,
					dailyProfit: account.todayProfit
				}
			});
		}
	};
	//#endregion
	//#region ../Users/USER/Documents/交易指标自动化/jarvis-mvp/core/modules/registry.js
	var IntelligenceModuleRegistry = class {
		constructor() {
			this.modules = /* @__PURE__ */ new Map();
		}
		register(module) {
			if (!module?.id || !module?.moduleName || typeof module.run !== "function") throw new Error("Invalid intelligence module registration.");
			this.modules.set(module.id, module);
		}
		registerMany(modules) {
			modules.forEach((module) => this.register(module));
		}
		getAll() {
			return Array.from(this.modules.values());
		}
		getById(id) {
			return this.modules.get(id);
		}
	};
	const intelligenceModuleRegistry = new IntelligenceModuleRegistry();
	intelligenceModuleRegistry.registerMany([
		marketIntelligence,
		macroIntelligence,
		tradingIntelligence,
		chartIntelligence,
		riskIntelligence,
		learningIntelligence,
		journalIntelligence,
		behaviorIntelligence,
		growthIntelligence,
		decisionIntelligence,
		replayIntelligence
	]);
	//#endregion
	//#region ../Users/USER/Documents/交易指标自动化/jarvis-mvp/core/jarvisCore/index.js
	const jarvisCore = new JarvisCore({ registry: intelligenceModuleRegistry });
	//#endregion
	//#region ../Users/USER/Documents/交易指标自动化/jarvis-mvp/core/services/jarvisCoreService.js
	function findModule(report, moduleName) {
		return report.outputs.find((output) => output.moduleName === moduleName);
	}
	async function getWorkspaceIntelligenceFromCore() {
		const report = await jarvisCore.generateUnifiedIntelligence();
		const market = findModule(report, "Market Intelligence");
		const trading = findModule(report, "Trading Intelligence");
		const chart = findModule(report, "Chart Intelligence");
		const activeOutputs = report.outputs;
		const marketPlan = market?.metadata?.plan || "Wait for pullback confirmation.";
		const chartAnalysis = chart?.metadata?.latestAnalysis;
		return {
			report: {
				...report,
				outputs: activeOutputs,
				recommendation: `${marketPlan} ${trading?.metadata?.tradingStatus || "Within Plan"}. ${chartAnalysis?.recommendation || ""}`.trim()
			},
			intelligence: [
				{
					label: "Market Bias",
					value: market?.metadata?.tone || "Mock standby",
					detail: market?.summary || "Market Intelligence is preparing mock data."
				},
				{
					label: "Market Structure",
					value: market?.metadata?.marketStructure || "Mock structure",
					detail: market?.metadata?.liquidityStatus || "Liquidity status is preparing mock data."
				},
				{
					label: "Trading Status",
					value: trading?.metadata?.riskStatus || "Healthy",
					detail: trading?.recommendation || "Trading Intelligence is read-only in Sprint 3."
				}
			],
			opportunity: {
				title: `${chartAnalysis?.pair || "XAUUSD"} patience zone`,
				summary: chart?.summary || "Chart Intelligence placeholder ready.",
				quality: chartAnalysis?.confidence || chart?.confidence || 78,
				analysis: chartAnalysis
			},
			mission: {
				title: "Today's Focus",
				summary: marketPlan
			},
			profitGoal: {
				value: trading?.metadata?.dailyProfit || 25,
				currency: trading?.metadata?.currency || "USD",
				progress: trading?.metadata?.dailyGoalProgress || 75,
				balance: trading?.metadata?.balance,
				equity: trading?.metadata?.equity,
				openPositions: trading?.metadata?.openPositions,
				floatingPL: trading?.metadata?.floatingPL,
				dailyDrawdown: trading?.metadata?.dailyDrawdown,
				riskStatus: trading?.metadata?.riskStatus,
				tradingStatus: trading?.metadata?.tradingStatus
			},
			tradingHealth: {
				score: trading?.metadata?.dailyGoalProgress || 75,
				riskStatus: trading?.metadata?.riskStatus || "Healthy",
				tradingStatus: trading?.metadata?.tradingStatus || "Within Plan",
				dailyDrawdown: trading?.metadata?.dailyDrawdown || 1.2,
				openPositions: trading?.metadata?.openPositions || 1,
				floatingPL: trading?.metadata?.floatingPL || 0
			},
			dailyBriefing: {
				marketBias: market?.metadata?.marketBias || market?.metadata?.tone || "Bullish",
				confidence: market?.confidence || 84,
				marketStructure: market?.metadata?.marketStructure || "Bullish continuation",
				liquidityStatus: market?.metadata?.liquidityStatus || "Buy-side liquidity above previous high",
				volatility: market?.metadata?.volatility || "Medium",
				session: market?.metadata?.session || "London session",
				keyZones: market?.metadata?.keyZones || ["Pullback confirmation zone"],
				recommendation: market?.recommendation || report.recommendation,
				risk: market?.metadata?.risk || "Medium",
				lastUpdated: market?.metadata?.lastUpdated || "09:35"
			},
			aiCoach: {
				title: "Professional decision quality",
				message: `${marketPlan} Reason: ${market?.metadata?.liquidityStatus || "market context still needs confirmation"}`,
				note: "JARVIS educates and protects. It does not provide blind buy or sell commands."
			},
			moduleHealth: activeOutputs.map((output) => ({
				name: output.moduleName,
				status: output.status,
				health: output.confidence,
				updatedAt: output.updatedAt
			})),
			engineHealth: activeOutputs.map((output) => ({
				name: output.moduleName,
				status: output.status,
				health: output.confidence,
				updatedAt: output.updatedAt
			}))
		};
	}
	async function analyzeUploadedChartWithCore(upload) {
		return analyzeMockChartUpload(upload);
	}
	async function getAdminCommandCenterDataFromCore() {
		const workspace = await getWorkspaceIntelligenceFromCore();
		return {
			...workspace,
			system: {
				mt5Connection: "Mock offline",
				moduleHealthAverage: Math.round(workspace.moduleHealth.reduce((sum, module) => sum + module.health, 0) / workspace.moduleHealth.length),
				engineHealthAverage: Math.round(workspace.engineHealth.reduce((sum, module) => sum + module.health, 0) / workspace.engineHealth.length)
			}
		};
	}
	//#endregion
	//#region ../Users/USER/Documents/交易指标自动化/jarvis-mvp/core/api/jarvisCoreApi.js
	const jarvisCoreApi = {
		getWorkspaceIntelligence: getWorkspaceIntelligenceFromCore,
		getAdminCommandCenterData: getAdminCommandCenterDataFromCore,
		analyzeUploadedChart: analyzeUploadedChartWithCore
	};
	//#endregion
	//#region ../Users/USER/Documents/交易指标自动化/jarvis-mvp/core/api/brainApi.js
	const brainApi = {
		getWorkspaceIntelligence: jarvisCoreApi.getWorkspaceIntelligence,
		getAdminCommandCenterData: jarvisCoreApi.getAdminCommandCenterData,
		analyzeUploadedChart: jarvisCoreApi.analyzeUploadedChart
	};
	//#endregion
	//#region ../Users/USER/Documents/交易指标自动化/jarvis-mvp/core/hooks/useBrainData.js
	async function loadBrainData() {
		return brainApi.getWorkspaceIntelligence();
	}
	async function loadAdminBrainData() {
		return brainApi.getAdminCommandCenterData();
	}
	async function analyzeChartUpload(upload) {
		return brainApi.analyzeUploadedChart(upload);
	}
	//#endregion
	//#region ../Users/USER/Documents/交易指标自动化/jarvis-mvp/core/brain/jarvisAlphaBrain.js
	const disclaimer$1 = "JARVIS provides educational market analysis and risk guidance. The final trading decision remains the responsibility of the trader.";
	function detectJarvisLanguage(input = "") {
		return /[\u3400-\u9fff]/.test(input) ? "zh" : "en";
	}
	function detectJarvisIntent(input = "") {
		String(input).toLowerCase();
		if (/(entry.*tp.*sl|tp.*sl|entry.*sl|full trade plan|trade plan|进场.*止损|止损.*止盈|entry.*放|tp.*放|sl.*放|放哪里)/i.test(input)) return "Full Trade Plan";
		if (/(entry|enter|entry zone|where should i enter|进场|入场|entry 放|哪里进)/i.test(input)) return "Entry Planning";
		if (/(stop loss|sl\b|invalidation|止损|sl 放|防守)/i.test(input)) return "Stop Loss Planning";
		if (/(take profit|tp\b|target|止盈|tp 放|目标)/i.test(input)) return "Take Profit Planning";
		if (/(rr|risk reward|risk-reward|盈亏比|风险回报)/i.test(input)) return "Risk Check";
		if (/(cpi|nfp|fomc|ppi|interest rate|fed|通胀|非农|利率|美联储)/i.test(input)) return "Macro Question";
		if (/(signal|setup today|potential trade|机会|信号)/i.test(input)) return "Potential Signal Request";
		if (/(upload|chart|screenshot|analy[sz]e|图表|截图|分析图)/i.test(input)) return "Chart Analysis";
		if (/(can i buy|buy now|long|可以买|可以买吗|做多|买入|多单)/i.test(input)) return "Buy Assessment";
		if (/(can i sell|sell now|short|可以卖|做空|卖出|空单)/i.test(input)) return "Sell Assessment";
		if (/(review|journal|lost|loss|mistake|yesterday|复盘|亏|输|错|昨天)/i.test(input)) return "Trade Review";
		if (/(risk|drawdown|position|lot|风险|仓位|回撤)/i.test(input)) return "Risk Check";
		if (/(revenge|报复)/i.test(input)) return "Revenge Trading";
		if (/(emotion|fear|greed|overtrade|心理|情绪|冲动|怕|贪)/i.test(input)) return "Emotional Trading";
		if (/(teach|learn|why|explain|lesson|学习|教|为什么|解释)/i.test(input)) return "Learning Question";
		if (/(market|gold|xau|silver|btc|eur|gbp|jpy|nas|session|trend|bias|市场|走势|方向|今天)/i.test(input)) return "Market View";
		return "General Conversation";
	}
	function detectJarvisAsset(input = "") {
		const raw = String(input || "");
		raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
		const hasAssetHint = /(gold|xau|silver|xag|btc|bitcoin|eth|ethereum|sol|solana|dxy|dollar index|nas|nasdaq|us30|dow|spx|dax|ger40|uk100|jp225|hk50|tesla|tsla|apple|aapl|nvidia|nvda|microsoft|msft|[A-Z]{3}\/?[A-Z]{3})/i.test(raw);
		const instrument = resolveInstrument(raw);
		const classMap = {
			crypto: "Crypto",
			forex: "Forex",
			index: "Index",
			metal: "Commodity",
			stock: "Stock"
		};
		return {
			...instrument,
			assetClass: classMap[instrument.type] || "Unknown",
			isClear: hasAssetHint,
			clarification: hasAssetHint ? "" : "Are you referring to Gold / XAUUSD?"
		};
	}
	function selectJarvisCapabilities({ intent, asset }) {
		const capabilities = /* @__PURE__ */ new Set(["Mentor Capability"]);
		if ([
			"Market View",
			"Buy Assessment",
			"Sell Assessment",
			"Chart Analysis",
			"Entry Planning",
			"Stop Loss Planning",
			"Take Profit Planning",
			"Full Trade Plan",
			"Risk Check",
			"Potential Signal Request"
		].includes(intent)) {
			capabilities.add("Trading Capability");
			capabilities.add("Risk Capability");
			capabilities.add("Market Capability");
		}
		if ([
			"Entry Planning",
			"Stop Loss Planning",
			"Take Profit Planning",
			"Full Trade Plan",
			"Buy Assessment",
			"Sell Assessment"
		].includes(intent)) capabilities.add("Planning Capability");
		if (["Macro Question"].includes(intent)) {
			capabilities.add("Macro Capability");
			capabilities.add("Risk Capability");
			capabilities.add("Market Capability");
		}
		if (["Trade Review", "Journal Review"].includes(intent)) capabilities.add("Journal Capability");
		if (["Learning Question"].includes(intent)) capabilities.add("Learning Capability");
		if (["Potential Signal Request"].includes(intent)) capabilities.add("Signal Capability");
		if (["Emotional Trading", "Revenge Trading"].includes(intent)) capabilities.add("Mentor Capability");
		if (asset?.assetClass === "Crypto") capabilities.add("Crypto placeholder data");
		return Array.from(capabilities);
	}
	function createMacroOutput({ input, asset, language }) {
		const isZh = language === "zh";
		const eventName = /nfp|非农/i.test(input) ? "NFP" : /fomc|fed|利率|美联储/i.test(input) ? "FOMC" : /ppi/i.test(input) ? "PPI" : "CPI";
		return {
			eventName,
			releaseTime: "Data source not connected",
			previous: "Data source not connected",
			forecast: "Data source not connected",
			actual: "Pending",
			deviation: "Pending",
			usdImpact: "Pending until actual data is connected",
			goldImpact: asset?.symbol === "XAUUSD" ? "Gold may react strongly if USD reprices after the release." : "Relevant if USD reprices after the release.",
			cryptoStockImpact: "Risk assets may react through yields, USD, and liquidity expectations.",
			riskLevel: "High around release window",
			professionalView: isZh ? `${eventName} 没有真实数据源连接，不能乱编数字。重点看 actual 和 forecast 的偏差，以及 USD / yield 的反应。` : `${eventName} data is not connected, so JARVIS will not invent numbers. Watch the deviation versus forecast and the reaction in USD / yields.`,
			watchNext: isZh ? "等待数据公布、第一波波动结束、再看市场是否接受方向。" : "Wait for the release, let the first volatility pass, then watch whether the market accepts the direction."
		};
	}
	function routeJarvisInput({ input = "", memory = {}, chart = {}, journal = [] } = {}) {
		const language = detectJarvisLanguage(input);
		const intent = detectJarvisIntent(input);
		const primaryAsset = detectJarvisAsset(input);
		const asset = primaryAsset.isClear ? primaryAsset : detectJarvisAsset(memory.lastInstrument || "");
		const capabilities = selectJarvisCapabilities({
			intent,
			asset
		});
		const market = getMockMarketSnapshot(asset.isClear ? asset.symbol : input);
		const isTradeRelated = capabilities.some((capability) => [
			"Trading Capability",
			"Planning Capability",
			"Risk Capability",
			"Signal Capability"
		].includes(capability));
		const macro = intent === "Macro Question" ? createMacroOutput({
			input,
			asset,
			language
		}) : null;
		return {
			id: `jarvis-route-${Date.now()}`,
			language,
			intent,
			asset,
			capabilities,
			context: {
				market,
				chartAvailable: Boolean(chart?.previewUrl),
				previousMission: journal?.[0] || null,
				journalCount: journal?.length || 0,
				memory
			},
			macro,
			safety: {
				isTradeRelated,
				disclaimer: isTradeRelated ? disclaimer$1 : "",
				blocked: false
			},
			responseFramework: {
				verdictOptions: [
					"Long Opportunity",
					"Short Opportunity",
					"Stand Aside",
					"Monitor Only"
				],
				sections: [
					"JARVIS Verdict",
					"Asset",
					"Asset Class",
					"Professional View",
					"Key Observations",
					"Potential Planning Zones",
					"Trading Safety",
					"Alternative Scenario",
					"Mentor Notes",
					"Disclaimer"
				]
			}
		};
	}
	//#endregion
	//#region ../Users/USER/Documents/交易指标自动化/jarvis-mvp/core/services/potentialTradesEngine.js
	const disclaimer = "JARVIS provides educational market analysis and risk guidance. The final trading decision remains the responsibility of the trader.";
	const opportunityStatuses = [
		"Detected",
		"Monitoring",
		"Waiting Confirmation",
		"Ready",
		"Triggered",
		"Invalidated",
		"Completed",
		"Reviewed"
	];
	const demoPotentialTrades = [
		{
			id: "trade-xauusd-alpha",
			asset: "XAUUSD",
			assetClass: "Gold",
			direction: "Long Opportunity",
			marketOutlook: "Bullish continuation",
			confidence: "High",
			tradingSafety: "Medium Risk",
			potentialEntryZone: "3348 - 3352",
			slReference: "Below 3342",
			tpTargets: [
				"TP1: 3362",
				"TP2: 3370",
				"TP3: 3382"
			],
			estimatedRR: "Around 1 : 2.5",
			setupReason: "Cleaner structure, defined pullback zone, and better reward profile than chasing current price.",
			invalidationCondition: "Invalid if price breaks below 3342 with acceptance.",
			conditionsNeeded: [
				"Pullback into planning zone",
				"Confirmation candle",
				"No high-impact news nearby",
				"Risk reward remains near 1:2 or better"
			],
			status: "Waiting Confirmation",
			reasonForStatusChange: "Price is near the planning area, but confirmation is still required.",
			currentMarketCondition: "Bullish structure with medium risk.",
			nextActionSuggestion: "Wait for confirmation before considering any action.",
			keyLevels: [
				"3348 - 3352 planning zone",
				"3342 invalidation",
				"3362 / 3370 target zones"
			],
			alternativeScenario: "If price rejects the zone and breaks structure, stand aside and reassess.",
			mentorNotes: "This is a planning framework, not permission to enter. Let confirmation do the work.",
			session: "London",
			dataSourceStatus: "Demo Data"
		},
		{
			id: "trade-btcusd-alpha",
			asset: "BTCUSD",
			assetClass: "Crypto",
			direction: "Monitor Only",
			marketOutlook: "Volatile range",
			confidence: "Medium",
			tradingSafety: "High Risk",
			potentialEntryZone: "Range edge only",
			slReference: "Beyond invalidation swing",
			tpTargets: ["TP1: Range midpoint", "TP2: Opposite range edge"],
			estimatedRR: "Pending chart confirmation",
			setupReason: "Bitcoin has opportunity, but volatility and unclear confirmation make the middle of the range unattractive.",
			invalidationCondition: "Invalid if price remains inside the range without rejection or breakout confirmation.",
			conditionsNeeded: [
				"Avoid middle of range",
				"Wait for clean rejection or breakout",
				"Confirm risk before entry"
			],
			status: "Monitoring",
			reasonForStatusChange: "Setup exists but is not ready.",
			currentMarketCondition: "High volatility range.",
			nextActionSuggestion: "Monitor only until the range edge is tested.",
			keyLevels: [
				"Range high",
				"Range low",
				"Breakout acceptance zone"
			],
			alternativeScenario: "If price breaks out with strength, a continuation plan may become valid.",
			mentorNotes: "Do not force an entry just because BTC is moving. Volatility is not quality.",
			session: "24H",
			dataSourceStatus: "Demo Data"
		},
		{
			id: "trade-nas100-alpha",
			asset: "NAS100",
			assetClass: "Indices",
			direction: "Long Opportunity",
			marketOutlook: "Pullback watch",
			confidence: "Medium",
			tradingSafety: "Medium Risk",
			potentialEntryZone: "Opening range retest",
			slReference: "Below opening range low",
			tpTargets: ["TP1: Session high", "TP2: Prior day high"],
			estimatedRR: "Around 1 : 2",
			setupReason: "Index structure is constructive, but the trade needs US session confirmation.",
			invalidationCondition: "Invalid if opening range breaks down and accepts below the low.",
			conditionsNeeded: [
				"US session confirmation",
				"Clean opening range",
				"No aggressive rejection from prior high"
			],
			status: "Waiting Confirmation",
			reasonForStatusChange: "US session context is needed.",
			currentMarketCondition: "Cautiously bullish with opening range risk.",
			nextActionSuggestion: "Wait for opening range confirmation.",
			keyLevels: [
				"Opening range",
				"Previous day high",
				"Previous day low"
			],
			alternativeScenario: "If the opening range fails, stand aside until risk improves.",
			mentorNotes: "Indices punish impatience around the open. Let the first battle finish.",
			session: "New York",
			dataSourceStatus: "Demo Data"
		},
		{
			id: "trade-eurusd-alpha",
			asset: "EURUSD",
			assetClass: "Forex",
			direction: "Stand Aside",
			marketOutlook: "Balanced range",
			confidence: "Low",
			tradingSafety: "Medium Risk",
			potentialEntryZone: "No clean zone yet",
			slReference: "Pending structure clarity",
			tpTargets: ["Pending"],
			estimatedRR: "Not attractive yet",
			setupReason: "Price is too balanced and offers no clear advantage yet.",
			invalidationCondition: "Invalid until a clean session direction appears.",
			conditionsNeeded: [
				"London or New York range expansion",
				"Clear liquidity sweep",
				"Better RR profile"
			],
			status: "Monitoring",
			reasonForStatusChange: "No strong setup quality yet.",
			currentMarketCondition: "Range and low clarity.",
			nextActionSuggestion: "Stand aside until the market shows direction.",
			keyLevels: ["Previous session high", "Previous session low"],
			alternativeScenario: "If price sweeps one side and reclaims, a new plan can be built.",
			mentorNotes: "No trade is also a professional trade decision.",
			session: "London",
			dataSourceStatus: "Demo Data"
		}
	];
	function nowLabel() {
		return (/* @__PURE__ */ new Date()).toLocaleString([], {
			month: "short",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit"
		});
	}
	function generatePotentialTrades(overrides = {}) {
		const saved = overrides.statusById || {};
		return demoPotentialTrades.map((trade) => {
			const savedTrade = saved[trade.id] || {};
			return {
				...trade,
				...savedTrade,
				createdAt: savedTrade.createdAt || "Alpha Preview",
				updatedAt: savedTrade.updatedAt || nowLabel(),
				dataSourceStatus: savedTrade.dataSourceStatus || trade.dataSourceStatus || "Demo Data",
				disclaimer
			};
		});
	}
	function filterPotentialTrades(trades, filters = {}) {
		return trades.filter((trade) => {
			if (filters.assetClass && filters.assetClass !== "All" && trade.assetClass !== filters.assetClass) return false;
			if (filters.direction && filters.direction !== "All" && trade.direction !== filters.direction) return false;
			if (filters.status && filters.status !== "All" && trade.status !== filters.status) return false;
			if (filters.confidence && filters.confidence !== "All" && trade.confidence !== filters.confidence) return false;
			if (filters.safety && filters.safety !== "All" && trade.tradingSafety !== filters.safety) return false;
			return true;
		});
	}
	function updatePotentialTradeStatus(trade, nextStatus) {
		const status = opportunityStatuses.includes(nextStatus) ? nextStatus : trade.status;
		const reasons = {
			Detected: "JARVIS found a possible setup.",
			Monitoring: "Setup exists but is not ready.",
			"Waiting Confirmation": "Price is near an important zone, but confirmation is still needed.",
			Ready: "Conditions are aligned, but the final decision belongs to the trader.",
			Triggered: "Entry zone was reached.",
			Invalidated: "Market broke the setup condition.",
			Completed: "Major target zone or review point was reached.",
			Reviewed: "Outcome has been reviewed and stored."
		};
		return {
			...trade,
			status,
			updatedAt: nowLabel(),
			reasonForStatusChange: reasons[status],
			currentMarketCondition: status === "Invalidated" ? trade.invalidationCondition : trade.currentMarketCondition,
			nextActionSuggestion: status === "Reviewed" ? "Store lesson and improve future filtering." : trade.nextActionSuggestion
		};
	}
	function createTradePairingSummary(trades, filters = {}) {
		const ranked = [...filterPotentialTrades(trades, {
			assetClass: filters.assetClass || "All",
			status: filters.status || "All"
		})].sort((a, b) => scoreTrade(b) - scoreTrade(a));
		const best = ranked[0] || trades[0];
		const avoid = ranked.find((trade) => trade.asset !== best.asset && /High|Low/.test(`${trade.tradingSafety} ${trade.confidence}`)) || trades.find((trade) => trade.asset !== best.asset);
		return {
			bestOpportunity: best,
			whyBetter: `${best.asset} has the cleaner planning structure, clearer invalidation, and better decision quality compared with noisier alternatives.`,
			avoid,
			reasonToAvoid: avoid ? `${avoid.asset} has weaker clarity or higher risk, so it should stay on monitor mode first.` : "No avoid candidate available.",
			dataSourceStatus: "Demo Data"
		};
	}
	function createOutcomeReview(trade) {
		return {
			originalView: trade.direction,
			outcome: trade.status === "Completed" ? "Target review available." : "Pending",
			wasSetupValid: trade.status === "Invalidated" ? "No" : "Pending review",
			didReachEntry: [
				"Triggered",
				"Completed",
				"Reviewed"
			].includes(trade.status) ? "Yes" : "Pending",
			didHitTP: ["Completed", "Reviewed"].includes(trade.status) ? "Partial / pending review" : "Pending",
			didHitSL: trade.status === "Invalidated" ? "Invalidated before clean continuation" : "Pending",
			lesson: trade.status === "Invalidated" ? "Respect invalidation quickly. Do not negotiate with a broken setup." : "Review after market outcome is clear."
		};
	}
	function createFeedbackRecord({ trade, missionId, feedback, intent }) {
		return {
			missionId: missionId || `mission-${Date.now()}`,
			tradeId: trade.id,
			asset: trade.asset,
			intent: intent || "Potential Signal Request",
			responseType: "Potential Trade",
			feedback,
			timestamp: (/* @__PURE__ */ new Date()).toISOString()
		};
	}
	function scoreTrade(trade) {
		const confidence = {
			High: 3,
			Medium: 2,
			Low: 1
		}[trade.confidence] || 1;
		const safety = trade.tradingSafety.includes("Low") ? 3 : trade.tradingSafety.includes("Medium") ? 2 : 1;
		const status = {
			Ready: 4,
			"Waiting Confirmation": 3,
			Monitoring: 2,
			Detected: 1
		}[trade.status] || 0;
		const direction = ["Long Opportunity", "Short Opportunity"].includes(trade.direction) ? 1 : 0;
		return confidence + safety + status + direction;
	}
	//#endregion
	//#region ../Users/USER/Documents/交易指标自动化/jarvis-mvp/app.js
	const mockUser = {
		name: "Kai",
		tier: "APEX Growth",
		dailyGoal: 420,
		progress: 68,
		streak: 12
	};
	const adminUsers = [
		{
			name: "Kai",
			growth: "Consistent",
			deposit: "Funded",
			unlock: "Level 3",
			health: 86
		},
		{
			name: "Mei",
			growth: "Needs review",
			deposit: "Pending",
			unlock: "Level 1",
			health: 62
		},
		{
			name: "Arif",
			growth: "Accelerating",
			deposit: "Funded",
			unlock: "Level 4",
			health: 91
		},
		{
			name: "Lina",
			growth: "Paused",
			deposit: "Not started",
			unlock: "Starter",
			health: 48
		}
	];
	const activity = [
		"Kai completed risk discipline mission",
		"Mei uploaded chart for AI Coach review",
		"Arif unlocked Growth Engine milestone",
		"System prepared mock MT5 connection checks"
	];
	const mentorSetupLink = "#setup";
	localStorage.removeItem("jarvis-chart-preview");
	const jarvisPromptExamples = [
		"Can I buy Gold now?",
		"Is EURUSD clear today?",
		"Analyze NAS100.",
		"Teach me Silver today.",
		"Analyze my chart.",
		"Should I wait for London?",
		"Review yesterday's trade.",
		"Where should my stop loss be?",
		"Teach me today's market."
	];
	const analysisSteps = [
		"Understanding your question...",
		"Detecting asset...",
		"Checking trade context...",
		"Selecting JARVIS capabilities...",
		"Preparing response...",
		"Done."
	];
	const alphaMacroEvents = [
		{
			event: "CPI",
			time: "Data source not connected",
			previous: "Data source not connected",
			forecast: "Data source not connected",
			actual: "Pending",
			risk: "High"
		},
		{
			event: "NFP",
			time: "Data source not connected",
			previous: "Data source not connected",
			forecast: "Data source not connected",
			actual: "Pending",
			risk: "High"
		},
		{
			event: "FOMC",
			time: "Data source not connected",
			previous: "Data source not connected",
			forecast: "Data source not connected",
			actual: "Pending",
			risk: "High"
		}
	];
	const storedJarvisChat = JSON.parse(localStorage.getItem("jarvis-conversation") || "[]").filter((item) => !item.thinking);
	const storedPotentialTradeState = JSON.parse(localStorage.getItem("jarvis-potential-trades") || "{}");
	const storedPotentialTradeFeedback = JSON.parse(localStorage.getItem("jarvis-trade-feedback") || "[]");
	const storedPotentialTradeOutcomes = JSON.parse(localStorage.getItem("jarvis-trade-outcomes") || "{}");
	const storedUiLanguage = localStorage.getItem("jarvis-ui-language") === "zh" ? "zh" : "en";
	const storedJarvisMemory = JSON.parse(localStorage.getItem("jarvis-memory") || JSON.stringify({
		lastIntent: "",
		previousQuestion: "",
		lastQuestion: "",
		repeatedMistakes: [],
		missionsCompleted: 0,
		lastInstrument: "",
		lastUpdated: ""
	}));
	let state = {
		isLoggedIn: false,
		isAdminUser: false,
		activePage: "Home",
		role: "user",
		loginHour: (/* @__PURE__ */ new Date()).getHours(),
		brainData: null,
		adminBrainData: null,
		adminChat: [{
			role: "jarvis",
			text: "Master command is online. Ask about users, deposits, unlocks, alerts, MT5 status, or engine health."
		}],
		adminThinking: false,
		chartUpload: {
			previewUrl: "",
			fileName: localStorage.getItem("jarvis-chart-file-name") || "",
			analysis: JSON.parse(localStorage.getItem("jarvis-chart-analysis") || "null"),
			history: JSON.parse(localStorage.getItem("jarvis-chart-history") || "[]")
		},
		watchlistFilter: "All",
		potentialTrades: {
			statusById: storedPotentialTradeState,
			feedback: storedPotentialTradeFeedback,
			outcomes: storedPotentialTradeOutcomes,
			selectedTradeId: localStorage.getItem("jarvis-selected-trade-id") || "trade-xauusd-alpha",
			filters: {
				assetClass: "All",
				direction: "All",
				status: "All",
				confidence: "All",
				safety: "All"
			},
			pairingFilter: "All"
		},
		jarvis: {
			promptIndex: 0,
			question: "",
			language: storedUiLanguage,
			status: "idle",
			progressIndex: 0,
			mentorNote: "",
			chat: storedJarvisChat,
			savedToJournal: false,
			showEntryZone: false,
			showWhy: false,
			missionStartedAt: "",
			timeline: [],
			quickAnalysis: null,
			topic: "",
			intent: storedJarvisMemory.lastIntent || "",
			route: null,
			conversationState: {
				currentAsset: storedJarvisMemory.lastInstrument || "",
				assetClass: "",
				timeframe: "",
				currentTradeId: localStorage.getItem("jarvis-selected-trade-id") || "trade-xauusd-alpha",
				currentTradeStatus: "",
				currentTradePlan: null,
				previousUserQuestion: storedJarvisMemory.previousQuestion || "",
				previousJarvisAnswer: "",
				missingInformation: [],
				language: storedUiLanguage
			},
			memory: storedJarvisMemory,
			isProcessing: false
		},
		approvedUi: {
			sidebarExpanded: false,
			marketFilter: "All",
			opportunityFilter: "All",
			analysisMode: "Chart Analysis",
			analysisAsset: "XAUUSD",
			analysisTimeframe: "H1",
			analysisStatus: "idle",
			analysisError: false,
			analysisLastUpdated: "",
			macroTab: "Top News",
			calendarFilter: "Today",
			settingsTab: "Profile"
		}
	};
	const logoSrc = "data:image/webp;base64,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";
	const app = document.getElementById("app");
	function el(tag, className, html = "") {
		const node = document.createElement(tag);
		if (className) node.className = className;
		if (html) node.innerHTML = html;
		return node;
	}
	async function render() {
		app.innerHTML = "";
		if (state.isLoggedIn) await ensureBrainData();
		app.appendChild(state.isLoggedIn ? shell() : loginPage());
	}
	async function renderFromTop() {
		await render();
		window.scrollTo({
			top: 0,
			left: 0,
			behavior: "auto"
		});
	}
	async function ensureBrainData() {
		state.brainData = state.brainData || await loadBrainData();
		if (state.role === "admin") state.adminBrainData = state.adminBrainData || await loadAdminBrainData();
	}
	function loginPage() {
		const page = el("main", "login-page");
		page.innerHTML = `
    <section class="login-panel">
      <div class="login-copy">
        <div class="login-brand-stage">
          <img class="apex-logo hero-logo" src="${logoSrc}" alt="APEX" />
          <span>ATTITUDE • IMPROVE • GROWTH</span>
        </div>
        <p class="eyebrow">JARVIS AI Trading Operating System</p>
        <h1>Welcome back.</h1>
        <p>Your premium AI trading workspace for market intelligence, planning, and disciplined execution.</p>
      </div>
      <form class="login-form">
        <div class="login-form-head">
          <strong>Sign in to JARVIS</strong>
          <span>Use demo password <b>apex</b>. Admin demo uses <b>apex-owner</b>.</span>
        </div>
        <label>Email</label>
        <input id="emailInput" type="email" value="${mockUser.name.toLowerCase()}@apex.local" aria-label="Email" />
        <label>Password</label>
        <input id="accessInput" type="password" value="apex" aria-label="Password" />
        <label class="remember-row">
          <input id="rememberInput" type="checkbox" checked />
          <span>Remember Me</span>
        </label>
        <button type="submit">Login</button>
        <div class="auth-links">
          <a href="${mentorSetupLink}" id="setupLink">Create Account</a>
          <a href="#reset" id="forgotLink">Forgot Password</a>
        </div>
        <div class="social-login">
          <button type="button">Google</button>
          <button type="button">Apple</button>
          <button type="button" disabled>Discord Coming Soon</button>
        </div>
        <div class="setup-link">
          <span>New to APEX?</span>
          <a href="${mentorSetupLink}" id="mentorLink">Start setup with your mentor link</a>
        </div>
      </form>
    </section>
  `;
		page.querySelector("form").addEventListener("submit", (event) => {
			event.preventDefault();
			const email = page.querySelector("#emailInput").value.trim();
			mockUser.name = email ? email.split("@")[0].split(/[._-]/)[0].replace(/^\w/, (letter) => letter.toUpperCase()) : "Kai";
			const accessCode = page.querySelector("#accessInput").value.trim().toLowerCase();
			state.isAdminUser = accessCode === "apex-owner";
			state.role = state.isAdminUser ? "admin" : "user";
			state.isLoggedIn = true;
			state.loginHour = (/* @__PURE__ */ new Date()).getHours();
			state.activePage = state.role === "admin" ? "Command" : "Home";
			renderFromTop();
		});
		page.querySelectorAll("#setupLink, #mentorLink, #forgotLink").forEach((link) => link.addEventListener("click", (event) => {
			event.preventDefault();
			alert("Mock link: this will connect to account setup, reset password, or mentor registration later.");
		}));
		return page;
	}
	function shell() {
		if (!state.isAdminUser && state.role === "admin") {
			state.role = "user";
			state.activePage = "Home";
		}
		const layout = el("div", `app-shell${state.approvedUi.sidebarExpanded ? " sidebar-expanded" : ""}`);
		layout.appendChild(sidebar());
		const mobileBackdrop = el("button", "mobile-nav-backdrop");
		mobileBackdrop.type = "button";
		mobileBackdrop.setAttribute("aria-label", "Close navigation");
		mobileBackdrop.addEventListener("click", () => {
			layout.classList.remove("mobile-nav-open");
			document.body.classList.remove("nav-open");
		});
		layout.appendChild(mobileBackdrop);
		const main = el("main", "workspace");
		main.appendChild(topbar());
		main.appendChild(state.role === "admin" ? adminPage() : userPage());
		layout.appendChild(main);
		return layout;
	}
	function userPage() {
		const brain = state.brainData;
		const page = el("section", "page-stack");
		page.innerHTML = pageContentForActivePage(brain);
		bindApprovedUiActions(page);
		bindJarvisMentorActions(page);
		bindChartUploadActions(page);
		bindWatchlistActions(page);
		bindPotentialTradeActions(page);
		return page;
	}
	function potentialTradeDetailPanel() {
		const trade = getSelectedPotentialTrade();
		const outcome = createOutcomeReview(trade);
		return `
    <article class="card card-wide trade-detail-card">
      <div class="detail-header">
        <div>
          <div class="alpha-label">Potential Signal Preview • ${trade.dataSourceStatus}</div>
          <h3>${trade.asset} • ${trade.direction}</h3>
          <p>${trade.marketOutlook}</p>
        </div>
        <div class="status-pill">${trade.status}</div>
      </div>
      <div class="detail-grid">
        <div class="brief-section"><strong>JARVIS Verdict</strong><p>${trade.direction}</p></div>
        <div class="brief-section"><strong>Asset Class</strong><p>${trade.assetClass}</p></div>
        <div class="brief-section"><strong>Market Outlook</strong><p>${trade.marketOutlook}</p></div>
        <div class="brief-section"><strong>Professional View</strong><p>${trade.setupReason}</p></div>
        <div class="brief-section"><strong>Setup Reason</strong><p>${trade.setupReason}</p></div>
        <div class="brief-section"><strong>Key Levels</strong><p>${trade.keyLevels.join(" / ")}</p></div>
        <div class="brief-section"><strong>Entry Zone</strong><p>${trade.potentialEntryZone}</p></div>
        <div class="brief-section"><strong>SL / Invalidation</strong><p>${trade.slReference}. ${trade.invalidationCondition}</p></div>
        <div class="brief-section"><strong>TP Targets</strong><p>${trade.tpTargets.join(" / ")}</p></div>
        <div class="brief-section"><strong>Estimated RR</strong><p>${trade.estimatedRR}</p></div>
        <div class="brief-section"><strong>Trading Safety</strong><p>${trade.tradingSafety}</p></div>
        <div class="brief-section"><strong>Alternative Scenario</strong><p>${trade.alternativeScenario}</p></div>
        <div class="brief-section"><strong>Mentor Notes</strong><p>${trade.mentorNotes}</p></div>
        <div class="brief-section"><strong>Data Source Status</strong><p>${trade.dataSourceStatus}</p></div>
      </div>
      <div class="brief-section">
        <strong>Conditions Needed</strong>
        <ul>${trade.conditionsNeeded.map((item) => `<li>${item}</li>`).join("")}</ul>
      </div>
      <div class="detail-actions">
        ${nextStatusButtons(trade)}
      </div>
      <div class="module-grid action-layout">
        ${card("Outcome Review", `<strong>${outcome.outcome}</strong><p>Original view: ${outcome.originalView}. Setup valid: ${outcome.wasSetupValid}. Entry reached: ${outcome.didReachEntry}. TP: ${outcome.didHitTP}. SL: ${outcome.didHitSL}.</p><p>${outcome.lesson}</p>`)}
        ${card("Feedback Loop", feedbackButtons(trade), "mission-card")}
      </div>
      <p class="disclaimer-text">${trade.disclaimer}</p>
    </article>
  `;
	}
	function nextStatusButtons(trade) {
		const next = opportunityStatuses[opportunityStatuses.indexOf(trade.status) + 1] || "Reviewed";
		return `
    <button class="ghost-button" type="button" data-trade-status="${trade.id}" data-next-status="${next}">Move to ${next}</button>
    <button class="ghost-button" type="button" data-trade-status="${trade.id}" data-next-status="Invalidated">Mark Invalidated</button>
    <button class="ghost-button" type="button" data-link-mission="${trade.id}">Link Mission</button>
    <div class="lifecycle-strip">
      ${opportunityStatuses.map((status) => `<button class="${status === trade.status ? "active" : ""}" type="button" data-trade-status="${trade.id}" data-next-status="${status}">${status}</button>`).join("")}
    </div>
  `;
	}
	function feedbackButtons(trade) {
		return `
    <p>Rate this analysis so JARVIS can improve future responses.</p>
    <div class="feedback-grid">
      ${[
			"Helpful",
			"Not Helpful",
			"Accurate",
			"Wrong",
			"Too Generic",
			"Too Risky",
			"Good Mentor Note"
		].map((item) => `<button class="ghost-button" type="button" data-trade-feedback="${trade.id}" data-feedback="${item}">${item}</button>`).join("")}
    </div>
    <p class="chart-history-note">${state.potentialTrades.feedback.filter((item) => item.tradeId === trade.id).length} feedback record${state.potentialTrades.feedback.filter((item) => item.tradeId === trade.id).length === 1 ? "" : "s"}</p>
  `;
	}
	function getPotentialTrades() {
		return generatePotentialTrades({ statusById: state.potentialTrades.statusById });
	}
	function getVisiblePotentialTrades() {
		return filterPotentialTrades(getPotentialTrades(), state.potentialTrades.filters);
	}
	function getSelectedPotentialTrade() {
		return getPotentialTrades().find((trade) => trade.id === state.potentialTrades.selectedTradeId) || getPotentialTrades()[0];
	}
	function syncSelectedTradeFromQuestion(question = "") {
		if (!hasExplicitInstrument(question)) return;
		const instrument = resolveInstrument(question);
		const trade = getPotentialTrades().find((item) => item.asset === instrument.symbol);
		if (!trade) return;
		state.potentialTrades.selectedTradeId = trade.id;
		localStorage.setItem("jarvis-selected-trade-id", trade.id);
		state.jarvis.topic = trade.asset;
	}
	function uploadedChartPanel() {
		const isZh = (state.jarvis.language || "en") === "zh";
		if (!state.chartUpload.previewUrl) {
			const hasContext = state.jarvis.quickAnalysis;
			return card(isZh ? "图表背景" : "Chart Context", hasContext ? `<p>${isZh ? "还没有上传图表。当前先使用实时价格与市场背景做初步规划；上传图表后会更准确。" : "No chart uploaded yet. JARVIS is using live price and market context for a preliminary plan; upload a chart for higher accuracy."}</p>` : `<p>${isZh ? "需要 setup 判断时，上传当前图表。" : "Upload the current chart when the decision needs setup context."}</p>`, "uploaded-chart-card");
		}
		return `
    <article class="card uploaded-chart-card">
      <h3>${isZh ? "上传图表" : "Uploaded Chart"}</h3>
      <img class="chart-preview mentor-preview" src="${state.chartUpload.previewUrl}" alt="Uploaded chart preview" />
      <p>${state.chartUpload.fileName}</p>
    </article>
  `;
	}
	function tradingBriefPanel(brain) {
		const analysis = state.chartUpload.analysis || state.jarvis.quickAnalysis || brain.opportunity.analysis;
		const isZh = (state.jarvis.language || "en") === "zh";
		const zhBias = {
			Bullish: "偏多",
			Bearish: "偏空",
			Neutral: "中性",
			"Neutral Bullish": "中性偏多"
		};
		const zhRisk = {
			Low: "低",
			Medium: "中等",
			"Medium High": "中高",
			High: "高"
		};
		const route = state.jarvis.route;
		const verdict = analysis.tradingSafety?.score === "Low" ? "Monitor Only" : analysis.bias === "Bearish" ? "Short Opportunity" : "Long Opportunity";
		if (!analysis) return card(isZh ? "交易简报" : "Trading Brief", `<p>${isZh ? "有图表分析后，这里会生成简短交易简报。" : "After chart analysis, a short trading brief will appear here."}</p>`, "trading-brief empty-brief");
		return `
    <article class="trading-brief">
      <h3>${analysis.preliminary ? isZh ? "初步交易简报" : "Preliminary Brief" : isZh ? "交易简报" : "Trading Brief"}</h3>
      <div class="brief-section">
        <strong>${isZh ? "专业观点" : "Professional View"}</strong>
        <p>${isZh ? "有机会，但必须等确认。JARVIS 不会替你做买卖决定。" : analysis.professionalView || "The opportunity exists, but the decision must be confirmation-led. JARVIS does not make the trade for you."}</p>
      </div>
      ${analysis.chartClarity || analysis.confidenceNote ? `<div class="brief-section">
              <strong>${isZh ? "图表清晰度" : "Chart Clarity"}</strong>
              <p>${isZh ? analysis.preliminary ? "还没有上传图表；这是根据实时参考价和市场背景做的初步规划。上传图表后，Entry / SL / TP 会更准确。" : "图表已纳入分析。仍需确认价格刻度、周期和关键高低点。" : analysis.confidenceNote || analysis.chartClarity}</p>
            </div>` : ""}
      <div class="brief-section">
        <strong>${isZh ? "市场倾向" : "Market Bias"}</strong>
        <p>${isZh ? `${zhBias[analysis.bias] || analysis.bias}，信心 ${localizedConfidenceLabel(analysis.confidence)}。` : `${analysis.bias} with ${analysis.confidenceLabel || confidenceLabel(analysis.confidence)} confidence.`}</p>
      </div>
      <div class="brief-section">
        <strong>${isZh ? "JARVIS 判断" : "JARVIS Verdict"}</strong>
        <p>${verdict} • ${route?.asset?.assetClass || analysis.instrumentType || "Market"} • ${(route?.capabilities || []).slice(0, 4).join(" / ")}</p>
      </div>
      <div class="brief-grid">
        <span>${isZh ? "品种" : "Instrument"}</span><strong>${analysis.instrument || analysis.pair}</strong>
        ${analysis.livePrice ? `<span>${isZh ? "实时参考价" : "Live Reference"}</span><strong>${analysis.livePriceText} ${analysis.liveCurrency || ""}</strong>` : ""}
        <span>${isZh ? "方向" : "Bias"}</span><strong>${isZh ? zhBias[analysis.bias] || analysis.bias : analysis.bias}</strong>
        <span>${isZh ? "信心" : "Confidence"}</span><strong>${isZh ? localizedConfidenceLabel(analysis.confidence) : analysis.confidenceLabel || confidenceLabel(analysis.confidence)}</strong>
        <span>${isZh ? "结构" : "Structure"}</span><strong>${isZh ? "延续结构，等待确认" : analysis.marketStructure}</strong>
        <span>${isZh ? "流动性" : "Liquidity"}</span><strong>${isZh ? "关键流动性已被触及，勿追价" : analysis.liquidity}</strong>
        <span>${isZh ? "风险" : "Risk"}</span><strong>${isZh ? zhRisk[analysis.risk] || analysis.risk : analysis.risk}</strong>
        <span>${isZh ? "下一步" : "Next Best Action"}</span><strong>${isZh ? "等待回调确认，不做盲目进场。" : analysis.recommendation.replace(" No blind signal is provided.", "")}</strong>
        <span>${isZh ? "学习点" : "Learning Point"}</span><strong>${isZh ? "好的交易来自确认，不是冲动。" : analysis.learningNote}</strong>
      </div>
      <div class="brief-section">
        <strong>${isZh ? "关键观察" : "Key Observations"}</strong>
        <ul>${(analysis.keyObservations || [analysis.marketStructure, analysis.liquidity]).map((item) => `<li>${isZh ? item : item}</li>`).join("")}</ul>
      </div>
      <div class="brief-section">
        <strong>${isZh ? "重要价位" : "Important Price Levels"}</strong>
        <p>${(analysis.importantPriceLevels || analysis.keyZones || []).join(" • ")}</p>
      </div>
      <div class="brief-section safety-section">
        <strong>${isZh ? "交易安全" : "Trading Safety"}</strong>
        <div class="risk-grid">
          <span>${isZh ? "安全评分" : "Score"}</span><b>${analysis.tradingSafety?.score || "Medium"}</b>
          <span>${isZh ? "市场风险" : "Market Risk"}</span><b>${analysis.tradingSafety?.marketRisk || analysis.risk}</b>
          <span>${isZh ? "账户风险" : "Account Risk"}</span><b>${analysis.tradingSafety?.accountRisk || "Controlled"}</b>
          <span>${isZh ? "风险回报" : "Risk Reward"}</span><b>${analysis.tradingSafety?.riskReward || "Wait for confirmation"}</b>
          <span>${isZh ? "情绪风险" : "Emotional Risk"}</span><b>${analysis.tradingSafety?.emotionalRisk || "Stable"}</b>
          <span>${isZh ? "新闻风险" : "News Risk"}</span><b>${analysis.tradingSafety?.newsRisk || "Check calendar"}</b>
          <span>${isZh ? "整体风险" : "Overall Risk"}</span><b>${analysis.tradingSafety?.overallRisk || analysis.risk}</b>
        </div>
      </div>
      ${analysis.tradePlan ? `<div class="brief-section trade-plan-section">
              <strong>${isZh ? "交易规划框架" : "Trade Plan Framework"}</strong>
              <div class="risk-grid">
                <span>${isZh ? "潜在进场区" : "Potential Entry Zone"}</span><b>${analysis.tradePlan.potentialEntryZone}</b>
                <span>${isZh ? "进场质量" : "Entry Quality"}</span><b>${localizePlanText(analysis.tradePlan.entryQuality || "Monitor only", isZh)}</b>
                <span>${isZh ? "原因" : "Reason"}</span><b>${localizePlanText(analysis.tradePlan.entryReason, isZh)}</b>
                <span>${isZh ? "失效 / SL 参考" : "Invalidation / SL Reference"}</span><b>${analysis.tradePlan.stopLossReference}</b>
                <span>${isZh ? "SL 逻辑" : "SL Logic"}</span><b>${localizePlanText(analysis.tradePlan.stopReason, isZh)}</b>
                <span>${isZh ? "潜在 TP 区" : "Potential TP Zones"}</span><b>${analysis.tradePlan.takeProfitZones.join(" • ")}</b>
                <span>${isZh ? "TP 逻辑" : "TP Logic"}</span><b>${localizePlanText(analysis.tradePlan.takeProfitReason, isZh)}</b>
                <span>${isZh ? "预估 RR" : "Estimated RR"}</span><b>${localizePlanText(analysis.tradePlan.estimatedRR, isZh)}</b>
                <span>${isZh ? "RR 评估" : "RR Assessment"}</span><b>${localizePlanText(analysis.tradePlan.riskRewardAssessment, isZh)}</b>
                <span>${isZh ? "不交易条件" : "No Trade Condition"}</span><b>${localizePlanText(analysis.tradePlan.noTradeCondition || "No trade if confirmation is weak.", isZh)}</b>
              </div>
              <strong>${isZh ? "需要条件" : "Conditions Needed"}</strong>
              <ul>${analysis.tradePlan.conditionsNeeded.map((item) => `<li>${localizePlanText(item, isZh)}</li>`).join("")}</ul>
            </div>` : ""}
      <div class="brief-section">
        <strong>${isZh ? "风险意识" : "Risk Awareness"}</strong>
        <p>${isZh ? "机会存在，但风险回报还需要确认。若风险不健康，等待会更专业。" : analysis.riskAwareness || "The opportunity exists, but risk-reward must be healthy before action."}</p>
      </div>
      <div class="brief-section">
        <strong>${isZh ? "替代情景" : "Alternative Scenario"}</strong>
        <p>${isZh ? "如果价格不尊重确认区域，就暂停，不硬做。" : analysis.alternativeScenario || "If price fails to respect the confirmation area, pause the idea and reassess."}</p>
      </div>
      <div class="brief-section">
        <strong>${isZh ? "导师备注" : "Mentor Notes"}</strong>
        <p>${isZh ? "最终决定属于交易员。JARVIS 负责保护你的决策质量。" : analysis.mentorNotes || "The final decision belongs to the trader. JARVIS protects decision quality."}</p>
      </div>
      <p class="brief-disclaimer">${isZh ? "JARVIS 提供教育性质的市场分析与风险指引。最终交易决定由交易员自行负责。" : analysis.disclaimer || "JARVIS provides educational market analysis and risk guidance. The final trading decision remains the responsibility of the trader."}</p>
      ${state.jarvis.showWhy ? explainWhyBlock(analysis) : ""}
      ${state.jarvis.showEntryZone ? entryZoneBlock(analysis) : ""}
      ${state.jarvis.savedToJournal ? journalSavedBlock() : ""}
      <div class="brief-actions">
        <button class="ghost-button" id="explainWhyButton" type="button">${isZh ? "解释原因" : "Explain Why"}</button>
        <button class="ghost-button" id="showEntryZoneButton" type="button">${isZh ? "显示区域" : "Show Entry Zone"}</button>
        <button class="ghost-button" id="saveJournalButton" type="button">${isZh ? "保存 Mission" : "Save Mission"}</button>
        <button class="ghost-button" id="newAnalysisButton" type="button">${isZh ? "新分析" : "New Analysis"}</button>
      </div>
    </article>
  `;
	}
	function explainWhyBlock(analysis) {
		const question = state.jarvis.question || "Can I buy Gold now?";
		if (state.jarvis.language === "zh") return `
      <div class="mentor-explain">
        <strong>导师解释</strong>
        <p>你问的是：“${question}”</p>
        <p>当前方向偏 ${analysis.bias}，但专业交易不是追价格。先等确认，风险回报会更干净。</p>
      </div>
    `;
		return `
    <div class="mentor-explain">
      <strong>Mentor Explanation</strong>
      <p>You asked: "${question}"</p>
      <p>Current trend is ${analysis.bias.toLowerCase()}, but price must still offer clean risk/reward. Waiting for confirmation gives a higher probability setup than chasing expansion.</p>
    </div>
  `;
	}
	function entryZoneBlock(analysis) {
		return `
    <div class="mentor-explain">
      <strong>${mentorText("Entry Zone Logic", "区域逻辑")}</strong>
      <p>${mentorText(`Watch ${analysis.keyZones.join(" or ")}. JARVIS is not giving a blind entry; it is showing where confirmation should be checked.`, `留意 ${analysis.keyZones.join(" 或 ")}。JARVIS 不是给盲目进场点，而是告诉你哪里需要确认。`)}</p>
    </div>
  `;
	}
	function journalSavedBlock() {
		return `
    <div class="mentor-explain">
      <strong>${mentorText("Mission Saved", "Mission 已保存")}</strong>
      <p>${mentorText("I created the journal record for you. Review it later when emotions are lower and the lesson is clearer.", "我已经帮你建立 Journal。晚一点情绪更稳定时，再回来复盘会更清楚。")}</p>
      <div class="brief-actions compact">
        <button class="ghost-button" type="button">${mentorText("Yes", "是")}</button>
        <button class="ghost-button" type="button">${mentorText("No", "否")}</button>
      </div>
    </div>
  `;
	}
	function buildMissionRecord(analysis) {
		const route = state.jarvis.route || routeJarvisInput({
			input: state.jarvis.question,
			memory: state.jarvis.memory,
			chart: state.chartUpload,
			journal: state.chartUpload.history
		});
		return {
			...analysis,
			missionId: `mission-${Date.now()}`,
			userQuestion: state.jarvis.question,
			intent: state.jarvis.intent,
			asset: route.asset?.symbol || analysis.pair || analysis.instrument,
			assetClass: route.asset?.assetClass || analysis.instrumentType || "Unknown",
			selectedCapabilities: route.capabilities || [],
			jarvisVerdict: analysis.tradingSafety?.score === "Low" ? "Monitor Only" : analysis.bias === "Bearish" ? "Short Opportunity" : "Long Opportunity",
			uploadedChart: state.chartUpload.previewUrl,
			uploadedChartFileName: state.chartUpload.fileName,
			tradingBrief: {
				professionalView: analysis.professionalView,
				marketBias: analysis.bias,
				confidence: analysis.confidenceLabel || confidenceLabel(analysis.confidence),
				keyObservations: analysis.keyObservations || [],
				importantPriceLevels: analysis.importantPriceLevels || analysis.keyZones || [],
				riskAwareness: analysis.riskAwareness,
				alternativeScenario: analysis.alternativeScenario,
				mentorNotes: analysis.mentorNotes
			},
			riskAssessment: analysis.tradingSafety || buildRiskProfile(state.jarvis.question, getMockMarketSnapshot(questionWithTopic(state.jarvis.question))),
			tradePlan: analysis.tradePlan || null,
			mentorNotes: analysis.mentorNotes,
			alternativeScenario: analysis.alternativeScenario,
			journalDraft: {
				title: `${analysis.pair || analysis.instrument || "Market"} mission review`,
				question: state.jarvis.question,
				lesson: analysis.learningNote || "Review confirmation, invalidation, risk-reward, and emotional state.",
				reviewPrompt: "Did I wait for confirmation, respect invalidation, and avoid chasing?"
			},
			savedAt: (/* @__PURE__ */ new Date()).toISOString(),
			language: state.jarvis.language,
			disclaimer: analysis.disclaimer || "JARVIS provides educational market analysis and risk guidance. The final trading decision remains the responsibility of the trader."
		};
	}
	function detectLanguage(text) {
		return detectJarvisLanguage(text);
	}
	function detectIntent(question) {
		return detectJarvisIntent(question);
	}
	function confidenceLabel(value = 0) {
		if (value >= 82) return "High";
		if (value >= 65) return "Medium";
		return "Low";
	}
	function localizedConfidenceLabel(value = 0) {
		const label = confidenceLabel(value);
		if (state.jarvis.language !== "zh") return label;
		return {
			High: "高",
			Medium: "中等",
			Low: "低"
		}[label] || label;
	}
	function isTradePlanIntent(intent = "") {
		return [
			"Entry zone request",
			"Stop loss request",
			"Take profit request",
			"Risk reward request",
			"Full trade plan request",
			"Entry Planning",
			"Stop Loss Planning",
			"Take Profit Planning",
			"Risk Check",
			"Full Trade Plan"
		].includes(intent);
	}
	function isBuyIntent(intent = "") {
		return intent === "Can I buy?" || intent === "Buy Assessment";
	}
	function isSellIntent(intent = "") {
		return intent === "Can I sell?" || intent === "Sell Assessment";
	}
	function localizePlanText(text = "", isZh = false) {
		if (!isZh) return text;
		return String(text).replaceAll("This area is a possible pullback / confirmation zone and offers cleaner risk-reward than chasing current price.", "这个区域属于潜在回踩 / 确认区，风险回报比直接追价更干净。").replaceAll("This is a preliminary pullback / confirmation zone based on live reference price and mock market context. A real uploaded chart will improve accuracy.", "这是基于实时参考价和市场背景的初步回踩 / 确认区。上传真实图表后会更准确。").replaceAll("This area is a possible rejection / confirmation zone and should prove sellers are still in control.", "这个区域属于潜在拒绝 / 确认区，需要证明卖方仍然掌控结构。").replaceAll("If price breaks below this reference area, the bullish structure may no longer be valid.", "如果价格跌破这个参考区域，当前偏多结构可能失效。").replaceAll("If price breaks above this reference area, the bearish structure may no longer be valid.", "如果价格突破这个参考区域，当前偏空结构可能失效。").replaceAll("If price breaks this reference area, the current setup idea weakens.", "如果价格突破这个参考区域，当前 setup 想法会变弱。").replaceAll("These areas are possible liquidity / profit-taking zones, not guaranteed targets.", "这些区域是潜在流动性 / 获利了结区，不是保证目标。").replaceAll("Potentially acceptable if confirmation appears.", "如果出现确认，风险回报可能可以接受。").replaceAll("Not ideal yet; waiting may improve the profile.", "现在还不理想，等待可能让风险回报更漂亮。").replaceAll("Cannot calculate exact RR because the price scale is not clear.", "价格刻度不够清楚，不能计算精确 RR。").replaceAll("Planning possible, exact RR unavailable.", "可以做规划，但暂时不能给精确 RR。").replaceAll("Potentially acceptable only if confirmation appears.", "只有出现确认后，风险回报才可能可以接受。").replaceAll("Poor now, monitor only", "现在质量不够，只适合观察").replaceAll("Fair if confirmed", "如果出现确认，质量尚可").replaceAll("Needs improvement", "还需要更好的位置").replaceAll("Unknown", "未知").replaceAll("No trade if price does not pull back, if confirmation is weak, or if news risk is high.", "如果价格不回踩、确认很弱，或新闻风险高，就不做。").replaceAll("If the chart does not show price scale, timeframe, and recent swing points, do not force a precise plan.", "如果图表没有价格刻度、周期和近期高低点，不要硬做精确计划。").replaceAll("No trade if confirmation is weak.", "如果确认很弱，就不做。").replaceAll("Pullback into the planning zone.", "等待价格回到规划区。").replaceAll("Treat this as preliminary until a chart is uploaded.", "上传图表之前，先把这个当成初步规划。").replaceAll("Clear rejection candle or minor structure confirmation.", "出现清楚的拒绝 K 线或小结构确认。").replaceAll("No high-impact news nearby.", "附近没有高影响新闻。").replaceAll("Risk-reward preferably near 1:2 or better.", "风险回报最好接近 1:2 或以上。").replaceAll("No chasing if price has already expanded.", "如果价格已经走远，不追单。").replaceAll("Wait for price to return into the planning zone.", "等待价格回到规划区。").replaceAll("Look for rejection or minor structure confirmation.", "观察拒绝反应或小结构确认。").replaceAll("Avoid entry near the middle of the range.", "避免在区间中间进场。").replaceAll("Check high-impact news first.", "先检查高影响新闻。").replaceAll("Only continue if risk-reward is healthy.", "只有风险回报健康才继续。").replaceAll("Entry", "进场参考").replaceAll("SL reference", "SL 参考").replaceAll("TP1", "TP1").replaceAll("TP2", "TP2").replaceAll("gives approx", "大约").replaceAll("improves toward", "提升接近");
	}
	function formatPlanPrice(value, type) {
		if (typeof value !== "number" || Number.isNaN(value)) return "";
		const normalizedType = String(type || "").toLowerCase();
		const decimals = normalizedType === "forex" ? 5 : normalizedType === "crypto" ? 0 : 2;
		const minimumDecimals = normalizedType === "forex" ? 3 : normalizedType === "crypto" ? 0 : 2;
		return value.toLocaleString(void 0, {
			maximumFractionDigits: decimals,
			minimumFractionDigits: Math.min(decimals, minimumDecimals)
		});
	}
	function buildPreliminaryTradePlan(snapshot, quote, question) {
		const price = quote?.price;
		const type = snapshot.type;
		const hasPrice = typeof price === "number";
		const isBullish = !snapshot.marketBias.includes("Bearish");
		if (!hasPrice) return {
			clarity: "Limited without chart",
			entryQuality: "Unknown",
			noTradeCondition: "If the chart does not show price scale, timeframe, and recent swing points, do not force a precise plan.",
			potentialEntryZone: "Wait for a clear pullback / confirmation area",
			entryReason: "Without a chart, JARVIS can only frame the decision process, not precise zones.",
			stopLossReference: "Beyond the most recent invalidation swing",
			stopReason: "Invalidation should sit beyond the structure that supports the idea.",
			takeProfitZones: ["Nearest liquidity area", "Next structure target"],
			takeProfitReason: "Targets should align with visible liquidity and structure.",
			estimatedRR: "Exact RR unavailable without a clear chart scale.",
			riskRewardAssessment: "Preliminary only; upload chart for accurate RR.",
			conditionsNeeded: [
				"Upload chart if you want precise Entry / SL / TP.",
				"Wait for confirmation before entry.",
				"Avoid chasing after expansion.",
				"Check news risk first."
			]
		};
		const entryDistance = type === "forex" ? .0018 : type === "crypto" ? .012 : .0022;
		const stopDistance = type === "forex" ? .0032 : type === "crypto" ? .024 : .0042;
		const tp1Distance = type === "forex" ? .0045 : type === "crypto" ? .032 : .0062;
		const tp2Distance = type === "forex" ? .0075 : type === "crypto" ? .052 : .0105;
		const entryMid = isBullish ? price * (1 - entryDistance) : price * (1 + entryDistance);
		const entryLow = entryMid * (1 - entryDistance * .45);
		const entryHigh = entryMid * (1 + entryDistance * .45);
		const stop = isBullish ? price * (1 - stopDistance) : price * (1 + stopDistance);
		const tp1 = isBullish ? price * (1 + tp1Distance) : price * (1 - tp1Distance);
		const tp2 = isBullish ? price * (1 + tp2Distance) : price * (1 - tp2Distance);
		const riskPoints = Math.abs(entryMid - stop);
		const rr1 = Math.abs(tp1 - entryMid) / riskPoints;
		const rr2 = Math.abs(tp2 - entryMid) / riskPoints;
		return {
			clarity: "Preliminary live-context plan",
			entryQuality: /now|right now|immediately|现在|马上|立刻/i.test(question) || snapshot.risk === "High" ? "Poor now, monitor only" : rr2 >= 2 ? "Fair if confirmed" : "Needs improvement",
			noTradeCondition: "No trade if price does not pull back, if confirmation is weak, or if news risk is high.",
			potentialEntryZone: `${formatPlanPrice(entryLow, type)} - ${formatPlanPrice(entryHigh, type)}`,
			entryReason: "This is a preliminary pullback / confirmation zone based on live reference price and mock market context. A real uploaded chart will improve accuracy.",
			stopLossReference: isBullish ? `Below ${formatPlanPrice(stop, type)}` : `Above ${formatPlanPrice(stop, type)}`,
			stopReason: "If price breaks this reference area, the current setup idea weakens.",
			takeProfitZones: [`TP1: ${formatPlanPrice(tp1, type)}`, `TP2: ${formatPlanPrice(tp2, type)}`],
			takeProfitReason: "These are possible liquidity / profit-taking areas, not guaranteed targets.",
			estimatedRR: `Entry ${formatPlanPrice(entryMid, type)}, SL reference ${formatPlanPrice(stop, type)}, TP1 ${formatPlanPrice(tp1, type)} gives approx 1:${rr1.toFixed(1)}. TP2 improves toward 1:${rr2.toFixed(1)}.`,
			riskRewardAssessment: rr2 >= 2 ? "Potentially acceptable only if confirmation appears." : "Not ideal yet; waiting may improve the profile.",
			conditionsNeeded: [
				"Treat this as preliminary until a chart is uploaded.",
				"Wait for price to return into the planning zone.",
				"Look for rejection or minor structure confirmation.",
				"Do not enter if price is already expanding.",
				"Check high-impact news first."
			]
		};
	}
	function mentorText(en, zh) {
		return state.jarvis.language === "zh" ? zh : en;
	}
	function persistJarvisMemory() {
		localStorage.setItem("jarvis-conversation", JSON.stringify(state.jarvis.chat.slice(-16)));
		localStorage.setItem("jarvis-memory", JSON.stringify({
			...state.jarvis.memory,
			lastIntent: state.jarvis.intent,
			previousQuestion: state.jarvis.memory.previousQuestion,
			lastQuestion: state.jarvis.question,
			lastInstrument: state.jarvis.topic,
			conversationState: state.jarvis.conversationState,
			lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
		}));
	}
	function updateJarvisMemoryFromQuestion(question, intent) {
		const text = question.toLowerCase();
		const mistakes = new Set(state.jarvis.memory.repeatedMistakes || []);
		if (/(now|right now|immediately|现在|马上|立刻)/i.test(question)) mistakes.add(state.jarvis.language === "zh" ? "容易想追价" : "Chasing entries");
		if (/(loss|lost|亏|输)/i.test(question)) mistakes.add(state.jarvis.language === "zh" ? "需要复盘亏损原因" : "Needs loss review");
		if (/(overtrade|revenge|报复|乱做)/i.test(question)) mistakes.add(state.jarvis.language === "zh" ? "情绪交易风险" : "Emotional trading risk");
		state.jarvis.memory = {
			...state.jarvis.memory,
			lastIntent: intent,
			previousQuestion: state.jarvis.memory.lastQuestion && state.jarvis.memory.lastQuestion !== question ? state.jarvis.memory.lastQuestion : state.jarvis.memory.previousQuestion,
			lastQuestion: question,
			repeatedMistakes: Array.from(mistakes).slice(-4),
			lastInstrument: hasExplicitInstrument(question) ? resolveInstrument(question).symbol : state.jarvis.topic,
			lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
		};
		if (text.includes("save mission")) state.jarvis.memory.missionsCompleted = (state.jarvis.memory.missionsCompleted || 0) + 1;
		persistJarvisMemory();
	}
	function escapeHtml(value = "") {
		return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;").replaceAll("'", "&#039;");
	}
	function hasExplicitInstrument(text) {
		const fallback = resolveInstrument("");
		return resolveInstrument(text).symbol !== fallback.symbol || /\b(USD|EUR|GBP|JPY|AUD|NZD|CAD|CHF|CNH|SGD|HKD|MXN|ZAR)\/?(USD|EUR|GBP|JPY|AUD|NZD|CAD|CHF|CNH|SGD|HKD|MXN|ZAR)\b/i.test(text) || /\b(gold|xau|silver|xag|btc|bitcoin|eth|ethereum|sol|solana|dxy|nas100|nasdaq|us30|dow|spx500|sp500|dax|ger40|uk100|jp225|hk50|tsla|tesla|aapl|apple|nvda|nvidia|msft|microsoft)\b/i.test(text);
	}
	function isFollowUpQuestion(question) {
		const text = question.trim().toLowerCase();
		return text.length <= 40 && /^(how|why|how\?|why\?|explain|what mean|what means|什么意思|怎样|怎么|为什么|如何|then how|so how|然后呢|那怎样|这个|还能|可以|哪个|哪一个|pair|tp|sl|entry|哪里|放哪里|止损|止盈|进场)/i.test(text);
	}
	function shouldUseCurrentTopic(question = "") {
		if (!state.jarvis.topic || hasExplicitInstrument(question)) return false;
		const intent = detectIntent(question);
		if (isFollowUpQuestion(question)) return true;
		if (isTradePlanIntent(intent) || isBuyIntent(intent) || isSellIntent(intent)) return true;
		if (intent === "Risk Check" && /(risk|rr|stop|sl|风险|止损|盈亏比)/i.test(question)) return true;
		return false;
	}
	function questionWithTopic(question) {
		return shouldUseCurrentTopic(question) ? `${state.jarvis.topic} ${question}` : question;
	}
	function isTopicSwitch(question = "") {
		if (!hasExplicitInstrument(question)) return false;
		const nextSymbol = resolveInstrument(question).symbol;
		return Boolean(state.jarvis.topic && nextSymbol && nextSymbol !== state.jarvis.topic);
	}
	function clearStaleTradeContextForNewTopic(question = "") {
		const switchingInstrument = isTopicSwitch(question);
		const standaloneNewTopic = !shouldUseCurrentTopic(question) && !hasExplicitInstrument(question) && !/(tp|sl|entry|stop|target|止损|止盈|进场|哪里|为什么|how|why)/i.test(question);
		if (!switchingInstrument && !standaloneNewTopic) return;
		state.jarvis.quickAnalysis = null;
		state.jarvis.showEntryZone = false;
		state.jarvis.showWhy = false;
		if (switchingInstrument) {
			state.chartUpload.analysis = null;
			localStorage.removeItem("jarvis-chart-analysis");
		}
	}
	function isPairingQuestion(question = "") {
		return /(which|better|best|compare|pair|opportunity|哪个|哪一个|比较好|更好|机会|对比)/i.test(question);
	}
	function safetyDisclaimerText(isZh = state.jarvis.language === "zh") {
		return isZh ? "JARVIS 提供教育性质的市场分析与风险指引，最终交易决定仍由交易者自行负责。" : "JARVIS provides educational market analysis and risk guidance. The final trading decision remains the responsibility of the trader.";
	}
	function withSafetyDisclaimer(text, isZh = state.jarvis.language === "zh") {
		const disclaimer = safetyDisclaimerText(isZh);
		return text.includes(disclaimer) || text.includes("JARVIS provides educational market analysis") ? text : `${text}\n\n${disclaimer}`;
	}
	function getActiveTradeContext() {
		const selectedTrade = getSelectedPotentialTrade();
		const selectedTradeMatchesTopic = !state.jarvis.topic || selectedTrade?.asset === state.jarvis.topic;
		const analysis = state.chartUpload.analysis || state.jarvis.quickAnalysis || null;
		return {
			selectedTrade,
			analysis,
			plan: analysis?.tradePlan || (selectedTradeMatchesTopic ? selectedTrade : null) || state.jarvis.conversationState.currentTradePlan || null,
			asset: analysis?.pair || analysis?.instrument || state.jarvis.topic || (selectedTradeMatchesTopic ? selectedTrade?.asset : "") || state.jarvis.conversationState.currentAsset || ""
		};
	}
	function updateConversationState(route, question) {
		const active = getActiveTradeContext();
		const resolved = hasExplicitInstrument(question) ? resolveInstrument(question) : null;
		const asset = resolved?.symbol || active.asset || state.jarvis.topic || "";
		state.jarvis.conversationState = {
			...state.jarvis.conversationState,
			currentAsset: asset,
			assetClass: resolved?.assetClass || route.asset?.assetClass || active.selectedTrade?.assetClass || state.jarvis.conversationState.assetClass || "",
			timeframe: route.timeframe || state.jarvis.conversationState.timeframe || "",
			intent: route.intent || state.jarvis.intent,
			uploadedChart: Boolean(state.chartUpload.previewUrl),
			currentTradeId: active.selectedTrade?.id || state.jarvis.conversationState.currentTradeId,
			currentTradeStatus: active.selectedTrade?.status || state.jarvis.conversationState.currentTradeStatus,
			currentTradePlan: active.plan,
			previousUserQuestion: question,
			language: state.jarvis.language,
			missingInformation: []
		};
	}
	function isAmbiguousTradeQuestion(question = "", intent = "") {
		const text = question.trim();
		const hasContext = hasExplicitInstrument(text) || state.jarvis.topic || state.jarvis.conversationState.currentAsset;
		return (isBuyIntent(intent) || isSellIntent(intent) || isTradePlanIntent(intent) || /(buy|sell|entry|tp|sl|stop loss|take profit|can.*enter|any entry|进场|可以买|可以卖|止损|止盈|哪里进|怎么进)/i.test(text)) && !hasContext;
	}
	function buildClarificationResponse(question = "", intent = "") {
		const isZh = state.jarvis.language === "zh";
		const needsPlan = isTradePlanIntent(intent) || /(entry|tp|sl|止损|止盈|进场)/i.test(question);
		return {
			text: isZh ? needsPlan ? "可以，我可以帮你规划 Entry / TP / SL。你是指哪个品种？例如 Gold、BTCUSD、EURUSD。" : "可以，我先确认一下：你是指哪个品种？例如 Gold / XAUUSD、BTCUSD、EURUSD。" : needsPlan ? "Yes. I can help plan Entry / TP / SL. Which instrument are we working on? For example Gold, BTCUSD, or EURUSD." : "Yes. Let me confirm first: which instrument do you mean? For example Gold / XAUUSD, BTCUSD, or EURUSD.",
			suggestions: isZh ? [
				"Gold 可以买吗？",
				"BTCUSD entry TP SL",
				"EURUSD 今天怎样？"
			] : [
				"Can I buy Gold now?",
				"BTCUSD entry TP SL",
				"How is EURUSD today?"
			]
		};
	}
	function buildNextActions(intent = state.jarvis.intent) {
		const isZh = state.jarvis.language === "zh";
		const { selectedTrade, asset } = getActiveTradeContext();
		const tradeMatchesTopic = !state.jarvis.topic || selectedTrade?.asset === state.jarvis.topic;
		const instrument = asset || (tradeMatchesTopic ? selectedTrade?.asset : "") || state.jarvis.topic || "Gold";
		if (isPairingQuestion(state.jarvis.question)) return isZh ? [
			"为什么这个比较好？",
			`${instrument} TP SL`,
			"换一个 pair 对比"
		] : [
			"Explain why",
			`${instrument} TP SL`,
			"Compare another pair"
		];
		if (isTradePlanIntent(intent) || isBuyIntent(intent) || isSellIntent(intent)) return isZh ? [
			"为什么这样判断？",
			"显示图表分析",
			"这笔交易风险多高？",
			"替代情景是什么？"
		] : [
			"Why this view?",
			"Show chart analysis",
			"How risky is this trade?",
			"Alternative scenario"
		];
		if (intent === "Macro Question") return isZh ? [
			"CPI 会影响 Gold 吗？",
			"新闻前要等吗？",
			"风险怎样控制？"
		] : [
			"How does CPI affect Gold?",
			"Should I wait before news?",
			"How should I manage risk?"
		];
		if (/review|journal|复盘|亏/i.test(state.jarvis.question || "")) return isZh ? [
			"帮我复盘亏损",
			"哪里做错？",
			"下次怎样避免？"
		] : [
			"Review my loss",
			"What went wrong?",
			"How to avoid it next time?"
		];
		return isZh ? [
			"继续分析",
			"给我 Trade Plan",
			"检查风险"
		] : [
			"Continue analysis",
			"Build trade plan",
			"Check risk"
		];
	}
	function qualityCheckResponse(text = "") {
		const fallback = mentorText("I can help. Give me the instrument and what decision you are considering, then I will build a clean trading brief.", "我可以帮你。告诉我品种和你正在考虑的决定，我会整理成清楚的交易简报。");
		return String(text || fallback).replace(/analysis completed\.?/gi, "I've reviewed the context.").replace(/this is risky\.?/gi, "The opportunity exists, but the risk-reward is not attractive yet.").trim();
	}
	function finalJarvisMessage(text, { tradeRelated = true, suggestions = buildNextActions() } = {}) {
		const cleanText = qualityCheckResponse(text);
		const finalText = tradeRelated ? withSafetyDisclaimer(cleanText, state.jarvis.language === "zh") : cleanText;
		state.jarvis.conversationState.previousJarvisAnswer = finalText;
		return {
			text: finalText,
			responseModel: tradeRelated ? buildAskJarvisResponseModel() : null,
			suggestions
		};
	}
	function buildAskJarvisResponseModel() {
		const question = questionWithTopic(state.jarvis.question);
		const snapshot = getMockMarketSnapshot(question);
		const analysis = state.chartUpload.analysis || state.jarvis.quickAnalysis;
		const plan = analysis?.tradePlan;
		const risk = analysis?.tradingSafety || buildRiskProfile(question, snapshot);
		const bias = /bearish/i.test(snapshot.marketBias) ? "Bearish" : /bullish/i.test(snapshot.marketBias) ? "Bullish" : "Neutral";
		const trend = bias === "Bullish" ? "Bullish Trend" : bias === "Bearish" ? "Bearish Trend" : "Range Market";
		const targets = plan?.takeProfitZones || [];
		const isZh = state.jarvis.language === "zh";
		const hasChart = Boolean(state.chartUpload.previewUrl);
		const hasVerifiedMarket = Boolean(analysis?.livePrice && analysis?.liveSource === "live");
		const hasVerifiedLevels = hasChart && hasVerifiedMarket;
		const preliminaryStructure = isZh ? ["仅为初步分析", "上传图表以确认市场结构", "流动性区域尚未验证"] : ["Preliminary analysis only", "Upload chart to confirm market structure", "Liquidity zones are not verified"];
		const chartStructure = [analysis?.marketStructure, analysis?.liquidity, analysis?.liquidityStatus].filter(Boolean).slice(0, 2);
		const entryStatus = isZh ? "等待已验证市场数据" : "Awaiting verified market data";
		const preliminaryStatus = isZh ? "仅为初步分析" : "Preliminary analysis only";
		const uploadStatus = isZh ? "上传图表以获得准确的 Entry / SL / TP" : "Upload chart for accurate Entry / SL / TP";
		const jarvisView = !hasChart || !hasVerifiedMarket ? isZh ? "初步观点 • 需要图表与已验证数据" : "Preliminary View • Chart Required" : bias === "Bullish" ? isZh ? "偏多观点 • 需要确认" : "Bullish Bias • Confirmation Required" : bias === "Bearish" ? isZh ? "偏空观点 • 需要确认" : "Bearish Bias • Confirmation Required" : isZh ? "中性 • 仅观察" : "Neutral • Monitor Only";
		const nextStep = !hasChart ? isZh ? "上传图表作为 setup 背景" : "Upload chart for setup context" : !hasVerifiedMarket ? isZh ? "等待已验证数据后重新评估" : "Reassess when verified market data is available" : isZh ? "等待结构确认" : "Wait for structure confirmation";
		return {
			language: state.jarvis.language,
			instrument: snapshot.symbol,
			bias,
			confidence: snapshot.confidence,
			confidenceLabel: hasVerifiedLevels ? `${confidenceLabel(snapshot.confidence)} Confidence` : isZh ? "初步信心" : "Preliminary Confidence",
			trend,
			structure: hasChart ? [...chartStructure, isZh ? "图表背景已附加，结论仍需确认" : "Chart context attached; confirmation is still required"].filter(Boolean) : preliminaryStructure,
			tradePlan: {
				entry: hasVerifiedLevels ? plan?.potentialEntryZone : entryStatus,
				stopLoss: hasVerifiedLevels ? plan?.stopLossReference : preliminaryStatus,
				takeProfit1: hasVerifiedLevels ? targets[0] : uploadStatus,
				takeProfit2: hasVerifiedLevels ? targets[1] : entryStatus,
				takeProfit3: hasVerifiedLevels ? targets[2] || (isZh ? "TP2 后保留 runner" : "Runner only after TP2 confirmation") : entryStatus,
				riskReward: hasVerifiedLevels ? plan?.estimatedRR || risk.riskReward : preliminaryStatus
			},
			macro: [isZh ? "已验证宏观数据源尚未连接。" : "Verified macro source not connected."],
			news: [isZh ? "实时新闻数据源尚未连接。" : "Live news source not connected."],
			reasoning: [
				isZh ? `趋势：${trend}。` : `Trend: ${trend}.`,
				isZh ? `市场结构：${hasChart ? chartStructure[0] || "图表已附加，等待确认" : "缺少图表背景"}。` : `Market structure: ${hasChart ? chartStructure[0] || "chart attached; confirmation required" : "chart context is missing"}.`,
				isZh ? `流动性：${hasChart ? chartStructure[1] || "需要确认" : "尚未验证"}。` : `Liquidity: ${hasChart ? chartStructure[1] || "confirmation required" : "not verified"}.`,
				isZh ? "宏观与新闻：数据源未连接，不作事件推断。" : "Macro and news: sources are not connected, so no event claim is made.",
				isZh ? `风险：${risk.overallRisk || snapshot.risk}；最终决定由交易员负责。` : `Risk: ${risk.overallRisk || snapshot.risk}; the final decision remains with the trader.`
			],
			jarvisView,
			nextStep,
			freshness: hasVerifiedMarket ? analysis.liveUpdatedAt || (isZh ? "刚更新" : "Recently updated") : isZh ? "初步 / 未验证来源" : "Preliminary / unverified sources",
			disclaimer: analysis?.disclaimer || "JARVIS provides educational market analysis and risk guidance. The final trading decision remains the responsibility of the trader."
		};
	}
	function buildStructuredTradeResponse({ question, intent, snapshot, quote, brief }) {
		const isZh = state.jarvis.language === "zh";
		const plan = brief?.tradePlan || buildPreliminaryTradePlan(snapshot, quote, question);
		const risk = buildRiskProfile(question, snapshot);
		const live = quote?.price ? `${formatLivePrice(quote)} ${quote.currency || ""}`.trim() : "Demo reference";
		const confidence = isZh ? localizedConfidenceLabel(snapshot.confidence) : confidenceLabel(snapshot.confidence);
		const action = isBuyIntent(intent) ? plan.riskRewardAssessment.includes("Not ideal") ? "wait for confirmation instead of buying now" : "wait for pullback confirmation before considering a long" : isSellIntent(intent) ? "wait for bearish confirmation before considering a short" : "build the plan first, then decide";
		if (isZh) return `重点先说：现在不要急着按进场，先等确认。\n\n为什么：${snapshot.label} 当前参考价 ${live}，结构是 ${snapshot.marketStructure}，Bias 是 ${snapshot.marketBias}，信心 ${confidence}。机会不是没有，但直接追价会让 RR 变差。\n\n计划：观察区 ${plan.potentialEntryZone}；SL / 失效参考 ${plan.stopLossReference}；TP 参考 ${plan.takeProfitZones.join("，")}。\n\n风险：市场风险 ${risk.marketRisk}；账户风险 ${risk.accountRisk}；新闻风险 ${risk.newsRisk}；情绪风险 ${risk.emotionalRisk}。如果价格没有回到计划区，或者没有确认，等待就是更专业的选择。\n\n下一步：${localizePlanText(action, true)}。`;
		return `Main point first: do not rush the entry. Wait for confirmation.\n\nWhy: ${snapshot.label} is around ${live}. Structure is ${snapshot.marketStructure}. Bias is ${snapshot.marketBias} with ${confidence} confidence. The opportunity can exist, but chasing from a poor location weakens risk-reward.\n\nPlan: watch ${plan.potentialEntryZone}; SL / invalidation reference ${plan.stopLossReference}; TP references ${plan.takeProfitZones.join(", ")}.\n\nRisk: market risk ${risk.marketRisk}; account risk ${risk.accountRisk}; news risk ${risk.newsRisk}; emotional risk ${risk.emotionalRisk}. If price does not return to the plan area or confirmation is missing, waiting is the stronger decision.\n\nNext step: ${action}.`;
	}
	function buildMacroResponse(route) {
		const isZh = state.jarvis.language === "zh";
		const macro = route?.macro || {
			eventName: "Macro event",
			actual: "Pending",
			professionalView: "Wait for confirmed data and market reaction.",
			riskLevel: "High",
			watchNext: "Do not trade the first reaction blindly."
		};
		return isZh ? `重点先说：新闻前后不要追第一波反应。\n\n${macro.eventName} 目前没有真实数据源连接，所以我不会乱编 previous / forecast / actual。Actual：${macro.actual}。\n\n专业看法：${macro.professionalView}\n\n风险：${macro.riskLevel}。新闻会放大 spread、滑点和假突破。\n\n下一步：${macro.watchNext}` : `Main point first: do not chase the first news reaction.\n\n${macro.eventName} is in data-source-not-connected mode, so I will not invent previous, forecast, or actual numbers. Actual: ${macro.actual}.\n\nProfessional view: ${macro.professionalView}\n\nRisk: ${macro.riskLevel}. News can widen spreads, increase slippage, and create false breaks.\n\nNext step: ${macro.watchNext}`;
	}
	function buildPairingAnswer(question) {
		const isZh = state.jarvis.language === "zh";
		const assetClass = /(gold|黄金|xau)/i.test(question) ? "Gold" : /(crypto|btc|eth|sol|加密|币)/i.test(question) ? "Crypto" : /(stock|股票|tsla|aapl|nvda|msft)/i.test(question) ? "Stocks" : /(index|indices|nas|us30|spx|指数)/i.test(question) ? "Indices" : /(forex|eur|gbp|jpy|外汇)/i.test(question) ? "Forex" : state.potentialTrades.pairingFilter || "All";
		const pairing = createTradePairingSummary(getPotentialTrades(), { assetClass });
		const best = pairing.bestOpportunity;
		const avoid = pairing.avoid;
		if (isZh) return withSafetyDisclaimer(`目前比较好的观察对象是 ${best.asset}。方向：${best.direction}；信心：${best.confidence}；安全等级：${best.tradingSafety}；潜在进场区：${best.potentialEntryZone}；SL 参考：${best.slReference}；TP：${best.tpTargets.join("，")}；RR：${best.estimatedRR}。原因：${pairing.whyBetter} 暂时避开：${avoid?.asset || "Pending"}，原因：${pairing.reasonToAvoid}。数据状态：${pairing.dataSourceStatus}。`, true);
		return withSafetyDisclaimer(`The better opportunity to watch is ${best.asset}. Direction: ${best.direction}. Confidence: ${best.confidence}. Safety: ${best.tradingSafety}. Potential entry zone: ${best.potentialEntryZone}. SL reference: ${best.slReference}. TP: ${best.tpTargets.join(", ")}. RR: ${best.estimatedRR}. Why: ${pairing.whyBetter} Avoid for now: ${avoid?.asset || "Pending"}. Reason: ${pairing.reasonToAvoid}. Data source: ${pairing.dataSourceStatus}.`, false);
	}
	function buildFollowUpAnswer(question) {
		const analysis = state.chartUpload.analysis || state.jarvis.quickAnalysis;
		const currentTrade = getSelectedPotentialTrade();
		const instrument = analysis?.instrument || analysis?.pair || state.jarvis.topic || currentTrade?.asset || "this market";
		const text = question.toLowerCase();
		const lastIntent = state.jarvis.intent || state.jarvis.memory.lastIntent;
		const plan = analysis?.tradePlan;
		const intent = detectIntent(question);
		if (isPairingQuestion(question)) return buildPairingAnswer(question);
		if (!plan && currentTrade && (state.jarvis.intent === "Potential Signal Request" || state.jarvis.topic === currentTrade.asset || /这个|还能|invalidated|tp|sl|entry|进|止损|止盈/i.test(question))) {
			if (state.jarvis.language === "zh") {
				if (/tp|止盈|target|目标/i.test(question)) return withSafetyDisclaimer(`${currentTrade.asset} 的潜在 TP 是：${currentTrade.tpTargets.join("，")}。这是规划区，不是保证目标。`, true);
				if (/sl|止损|invalid|失效/i.test(question)) return withSafetyDisclaimer(`${currentTrade.asset} 的 SL / invalidation 参考是：${currentTrade.slReference}。失效条件：${currentTrade.invalidationCondition}`, true);
				if (/entry|进场|哪里|放哪里/i.test(question)) return withSafetyDisclaimer(`${currentTrade.asset} 的潜在进场区是：${currentTrade.potentialEntryZone}。只有出现确认才继续考虑。`, true);
				if (/还能|可以.*进|can.*enter|still.*enter/i.test(question)) return withSafetyDisclaimer(`${currentTrade.asset} 现在状态是 ${currentTrade.status}。我的判断：${currentTrade.nextActionSuggestion} 如果还没有满足这些条件：${currentTrade.conditionsNeeded.join("；")}，就不要硬进。`, true);
				if (/invalidated|为什么|why/i.test(question)) return withSafetyDisclaimer(`因为这个 setup 的规则是：${currentTrade.invalidationCondition}。如果市场破坏这个条件，JARVIS 会把它转成 Invalidated，而不是硬撑原本想法。`, true);
				return withSafetyDisclaimer(`${currentTrade.asset} 当前状态是 ${currentTrade.status}。下一步：${currentTrade.nextActionSuggestion}。安全等级：${currentTrade.tradingSafety}。`, true);
			}
			if (/tp|target/i.test(question)) return withSafetyDisclaimer(`${currentTrade.asset} potential TP targets: ${currentTrade.tpTargets.join(", ")}. These are planning zones, not guaranteed targets.`, false);
			if (/sl|stop|invalid/i.test(question)) return withSafetyDisclaimer(`${currentTrade.asset} SL / invalidation reference: ${currentTrade.slReference}. Invalidation condition: ${currentTrade.invalidationCondition}`, false);
			if (/entry|enter|where/i.test(question)) return withSafetyDisclaimer(`${currentTrade.asset} potential entry zone: ${currentTrade.potentialEntryZone}. Continue only if confirmation appears.`, false);
			if (/still.*enter|can.*enter/i.test(question)) return withSafetyDisclaimer(`${currentTrade.asset} current status is ${currentTrade.status}. My read: ${currentTrade.nextActionSuggestion} If these conditions are not met: ${currentTrade.conditionsNeeded.join("; ")}, do not force the entry.`, false);
			if (/invalidated|why/i.test(question)) return withSafetyDisclaimer(`Because the setup rule is: ${currentTrade.invalidationCondition}. If the market breaks that condition, JARVIS should mark it invalidated instead of defending the original idea.`, false);
			return withSafetyDisclaimer(`${currentTrade.asset} current status is ${currentTrade.status}. Next action: ${currentTrade.nextActionSuggestion}. Safety: ${currentTrade.tradingSafety}.`, false);
		}
		if (plan && isTradePlanIntent(intent)) {
			if (state.jarvis.language === "zh") {
				if (intent === "Entry zone request" || intent === "Entry Planning") return `可以，延续同一个 Mission。潜在进场区是 ${plan.potentialEntryZone}。这不是叫你现在买/卖，而是一个等待确认的区域。原因：${localizePlanText(plan.entryReason, true)}`;
				if (intent === "Stop loss request" || intent === "Stop Loss Planning") return `SL 不应该当成固定数字，而是 invalidation 参考。当前 SL / 失效参考：${plan.stopLossReference}。逻辑：${localizePlanText(plan.stopReason, true)}`;
				if (intent === "Take profit request" || intent === "Take Profit Planning") return `TP 可以用分段规划：${plan.takeProfitZones.join("，")}。逻辑：${localizePlanText(plan.takeProfitReason, true)} 这些是潜在获利区，不是保证目标。`;
				if (intent === "Risk reward request" || intent === "Risk Check") return `RR 参考：${localizePlanText(plan.estimatedRR, true)} 评估：${localizePlanText(plan.riskRewardAssessment, true)} 如果 RR 不健康，宁愿等更好的位置。`;
				return `可以，这是同一个 Mission 的规划框架：进场区 ${plan.potentialEntryZone}；SL 参考 ${plan.stopLossReference}；TP 区 ${plan.takeProfitZones.join("，")}。条件：${plan.conditionsNeeded.map((item) => localizePlanText(item, true)).join("；")}。最终决定还是由你负责。`;
			}
			if (intent === "Entry zone request" || intent === "Entry Planning") return `Yes. Staying with the same mission, the potential entry zone is ${plan.potentialEntryZone}. This is not an instruction to enter now; it is an area to watch for confirmation. Reason: ${plan.entryReason}`;
			if (intent === "Stop loss request" || intent === "Stop Loss Planning") return `For SL, think in terms of invalidation rather than a fixed command. Current SL / invalidation reference: ${plan.stopLossReference}. Logic: ${plan.stopReason}`;
			if (intent === "Take profit request" || intent === "Take Profit Planning") return `Potential TP zones can be planned in stages: ${plan.takeProfitZones.join(", ")}. Logic: ${plan.takeProfitReason} These are possible profit-taking areas, not guaranteed targets.`;
			if (intent === "Risk reward request" || intent === "Risk Check") return `RR reference: ${plan.estimatedRR} Assessment: ${plan.riskRewardAssessment} If the RR is not healthy, waiting is the stronger decision.`;
			return `Sure. Same mission framework: entry zone ${plan.potentialEntryZone}; SL reference ${plan.stopLossReference}; TP zones ${plan.takeProfitZones.join(", ")}. Conditions: ${plan.conditionsNeeded.join("; ")}. Final decision remains with the trader.`;
		}
		if (state.jarvis.language === "zh") {
			if (lastIntent === "Psychology" || lastIntent === "Emotional trading" || lastIntent === "Revenge trading") return `我的意思是：如果你现在的决定来自“想追回”或“怕错过”，那就不是市场在给机会，是情绪在催你。先停一下，等 setup 清楚再说。`;
			if (lastIntent === "Risk Question") return `风险要这样看：不是问能不能进，而是问“错了会亏多少，值不值得”。如果 ${instrument} 的止损太远，宁愿错过，不要硬做。`;
			if (text.includes("why") || question.includes("为什么")) return `因为 ${instrument} 现在还需要确认。方向可以偏多，但没有回调确认就进场，风险回报会变差。专业做法是先等结构给机会，不是看到方向就追。`;
			return `做法是：先标记 ${instrument} 当前区间高低点，然后等价格回到确认区域。看到反应后，再看止损是否合理。如果止损太大，宁愿不做。`;
		}
		if (lastIntent === "Psychology" || lastIntent === "Emotional trading" || lastIntent === "Revenge trading") return `What I mean is this: if the decision is driven by urgency, fear of missing out, or wanting to recover a loss, it is not the market giving you an edge. It is emotion asking for action. Pause first.`;
		if (lastIntent === "Risk Question") return `Think of risk this way: the question is not only whether you can enter, but what you lose if you are wrong. If the stop for ${instrument} is too wide, passing is the professional decision.`;
		if (text.includes("why")) return `Because ${instrument} still needs confirmation. Bias can be bullish, but entering without a pullback gives weaker risk/reward. The professional move is to wait for structure, not chase direction.`;
		return `Here is the practical way for ${instrument}: mark the current range high and low, wait for price to return to a confirmation area, then check whether the stop loss is clean. If the stop is too wide, waiting is the better trade.`;
	}
	function addChatMessage(message) {
		state.jarvis.chat = [...state.jarvis.chat, {
			id: `chat-${Date.now()}-${Math.random()}`,
			...message
		}].slice(-16);
		persistJarvisMemory();
	}
	function chatMessageMarkup(item) {
		const speaker = item.role === "user" ? mockUser.name : "JARVIS";
		const suggestions = Array.isArray(item.suggestions) ? item.suggestions.slice(0, 3).map((suggestion) => `<button type="button" data-quick-prompt="${escapeHtml(suggestion)}">${escapeHtml(suggestion)}</button>`).join("") : "";
		return `
    <div class="chat-message ${item.role === "user" ? "user-message" : "jarvis-message"} ${item.attention ? "attention" : ""}">
      <strong>${escapeHtml(speaker)}</strong>
      <p>${escapeHtml(item.text)}</p>
      ${item.thinking ? `<span class="typing-dots"><i></i><i></i><i></i></span>` : ""}
      ${suggestions ? `<div class="quick-prompts">${suggestions}</div>` : ""}
    </div>
  `;
	}
	function refreshMissionControlOnly() {
		const chatThread = document.querySelector(".conversation-panel .chat-thread");
		if (chatThread) {
			const approvedConversation = Boolean(chatThread.closest(".approved-conversation"));
			chatThread.innerHTML = state.jarvis.chat.map((item) => approvedConversation ? renderApprovedChatMessage(item) : chatMessageMarkup(item)).join("");
			chatThread.scrollTop = chatThread.scrollHeight;
		}
		const emptySuggestions = document.querySelector(".empty-chat-suggestions");
		if (emptySuggestions) emptySuggestions.hidden = state.jarvis.chat.length > 0;
		const brief = document.querySelector(".ask-side-panel .trading-brief, .mission-right .trading-brief");
		if (brief && state.brainData) {
			const wrapper = document.createElement("div");
			wrapper.innerHTML = tradingBriefPanel(state.brainData);
			brief.replaceWith(wrapper.firstElementChild);
			bindBriefActions();
		}
	}
	function addThinkingMessage() {
		const steps = getThinkingSteps();
		addChatMessage({
			role: "jarvis",
			text: mentorText("JARVIS is thinking...", "JARVIS 正在思考..."),
			thinking: true,
			thinkingIndex: 0,
			thinkingSteps: steps
		});
	}
	function getThinkingSteps() {
		return state.jarvis.language === "zh" ? [
			"读取市场结构...",
			"检查宏观事件...",
			"读取市场新闻...",
			"扫描流动性区域...",
			"建立分析..."
		] : [
			"Reading market structure...",
			"Checking macro events...",
			"Reading market news...",
			"Scanning liquidity zones...",
			"Building analysis..."
		];
	}
	async function runThinkingSequence() {
		const steps = getThinkingSteps();
		for (let index = 0; index < steps.length; index += 1) {
			const thinkingIndex = state.jarvis.chat.findIndex((item) => item.thinking);
			if (thinkingIndex < 0) return;
			state.jarvis.chat = state.jarvis.chat.map((item, itemIndex) => itemIndex === thinkingIndex ? {
				...item,
				text: mentorText("JARVIS is thinking...", "JARVIS 正在思考..."),
				thinkingIndex: index,
				thinkingSteps: steps
			} : item);
			refreshMissionControlOnly();
			await new Promise((resolve) => setTimeout(resolve, 240));
		}
	}
	function replaceThinkingMessage(message) {
		const index = state.jarvis.chat.findIndex((item) => item.thinking);
		const nextMessage = {
			id: `chat-${Date.now()}-${Math.random()}`,
			role: "jarvis",
			...message
		};
		state.jarvis.conversationState.previousJarvisAnswer = nextMessage.text || "";
		if (index >= 0) {
			state.jarvis.chat = state.jarvis.chat.map((item, itemIndex) => itemIndex === index ? nextMessage : item).slice(-16);
			persistJarvisMemory();
			return;
		}
		state.jarvis.chat = [...state.jarvis.chat, nextMessage].slice(-16);
		persistJarvisMemory();
	}
	async function buildPreliminaryBrief(question) {
		const contextQuestion = questionWithTopic(question);
		const snapshot = getMockMarketSnapshot(contextQuestion);
		const quote = await getLiveMarketQuote(contextQuestion);
		const tradePlan = buildPreliminaryTradePlan(snapshot, quote, question);
		return {
			id: `quick-brief-${Date.now()}`,
			pair: snapshot.symbol,
			instrument: snapshot.label,
			instrumentType: snapshot.type,
			bias: snapshot.marketBias.includes("Neutral") ? "Neutral" : snapshot.marketBias.includes("Bullish") ? "Bullish" : snapshot.marketBias,
			confidence: snapshot.confidence,
			marketStructure: snapshot.marketStructure,
			liquidity: snapshot.liquidityStatus,
			keyZones: snapshot.keyZones,
			risk: snapshot.risk,
			recommendation: snapshot.plan,
			learningNote: `${snapshot.label} needs confirmation before action. Protect capital first.`,
			livePrice: quote.price,
			livePriceText: formatLivePrice(quote),
			liveCurrency: quote.currency,
			liveUpdatedAt: quote.updatedAt,
			liveSource: quote.source,
			preliminary: true,
			chartClarity: "No uploaded chart yet",
			confidenceNote: "This is a preliminary plan built from live reference price and market context. Uploading a chart improves setup accuracy.",
			professionalView: `${snapshot.label} has a readable context, but confirmation is still more important than prediction.`,
			keyObservations: [
				snapshot.marketStructure,
				snapshot.liquidityStatus,
				`Session: ${snapshot.session}`
			],
			importantPriceLevels: snapshot.keyZones,
			riskAwareness: `${snapshot.risk} market risk. Avoid entries without a clean stop and clear invalidation.`,
			alternativeScenario: `If ${snapshot.label} fails to respect the confirmation zone, stand down and reassess.`,
			mentorNotes: "Patience is part of execution. The market does not owe an entry.",
			tradePlan,
			tradingSafety: {
				score: question.toLowerCase().includes("now") || snapshot.risk === "High" ? "Low" : "Medium",
				marketRisk: snapshot.risk,
				accountRisk: "Controlled",
				riskReward: tradePlan.riskRewardAssessment,
				emotionalRisk: question.toLowerCase().includes("now") ? "Chasing risk detected" : "Stable",
				newsRisk: /london|new york/i.test(snapshot.session) || snapshot.type === "crypto" ? "Medium" : "Check calendar",
				overallRisk: snapshot.risk
			},
			disclaimer: "JARVIS provides educational market analysis and risk guidance. The final trading decision remains the responsibility of the trader."
		};
	}
	function buildRiskProfile(question, snapshot, brain = state.brainData) {
		const health = brain?.tradingHealth;
		const text = question.toLowerCase();
		const emotionalRisk = /(now|revenge|must|quick|fast|马上|现在|报复|一定要|快)/i.test(question) ? "High" : "Controlled";
		const accountRisk = health?.dailyDrawdown > 2 ? "Elevated" : health?.riskStatus || "Healthy";
		const riskReward = text.includes("now") ? "Not attractive until pullback confirms" : "Only acceptable after confirmation";
		const newsRisk = /london|new york/i.test(snapshot.session) || snapshot.type === "crypto" ? "Medium" : "Check calendar";
		const overallRisk = emotionalRisk === "High" || snapshot.risk === "High" ? "High" : snapshot.risk || "Medium";
		return {
			marketRisk: snapshot.risk || "Medium",
			accountRisk,
			riskReward,
			emotionalRisk,
			newsRisk,
			overallRisk
		};
	}
	function buildUnifiedMentorResponse({ question, intent, snapshot, quote, brief }) {
		const route = state.jarvis.route;
		const isZh = state.jarvis.language === "zh";
		const liveLine = quote?.price ? isZh ? `实时参考价 ${formatLivePrice(quote)} ${quote.currency || ""}。` : `Live reference ${formatLivePrice(quote)} ${quote.currency || ""}.` : "";
		const risk = buildRiskProfile(question, snapshot);
		const previous = state.jarvis.memory.previousQuestion || "";
		const mistake = state.jarvis.memory.repeatedMistakes?.[0];
		const analysis = brief || state.jarvis.quickAnalysis || state.chartUpload.analysis;
		const plan = analysis?.tradePlan;
		if (isZh) {
			if (plan && isTradePlanIntent(intent)) return `可以，我先给你一个实际一点的规划。现在我不会建议直接追，比较好的做法是等价格回到 ${plan.potentialEntryZone} 附近，看有没有确认。SL 参考：${plan.stopLossReference}。TP 可以先看 ${plan.takeProfitZones.join("，")}。${localizePlanText(plan.estimatedRR, true)} 重点不是马上进，而是等位置、等确认、确认新闻风险不高。`;
			if (plan && (isBuyIntent(intent) || isSellIntent(intent))) return `有机会，但不是“现在马上进”的感觉。更像是等 ${plan.potentialEntryZone} 这个区域，看有没有确认。SL 参考：${plan.stopLossReference}。TP 观察：${plan.takeProfitZones.join("，")}。如果价格不回踩、不确认，就先不要硬做。`;
			if (intent === "Macro Question" && route?.macro) {
				const macro = route.macro;
				return `${macro.eventName} 目前是真实数据源未连接状态，所以我不会乱编 previous / forecast / actual。Actual: ${macro.actual}。专业看法：${macro.professionalView} 风险等级：${macro.riskLevel}。下一步：${macro.watchNext}`;
			}
			if (intent === "General Conversation") return previous ? `我记得你刚才问过：“${previous}”。我们可以继续同一个方向。现在最重要不是找更多信号，而是把一个交易想法处理清楚。` : "我在。你可以直接问市场、风险、亏损复盘，或上传图表。我会先保护你的决策质量，不会乱给买卖指令。";
			if (intent === "Psychology" || intent === "Emotional Trading" || intent === "Revenge Trading") return `我先站在保护交易员的角度看。${mistake ? `我也留意到你最近有“${mistake}”的倾向。` : ""} 如果现在是因为急、怕错过、或想追回亏损，最专业的决定可能是先暂停。好的交易不需要情绪推动。`;
			if (intent === "Risk Question" || intent === "Risk Check" || risk.overallRisk === "High") return `${liveLine}${snapshot.label} 有机会，但当前风险回报还不健康。市场风险：${risk.marketRisk}；账户风险：${risk.accountRisk}；新闻风险：${risk.newsRisk}；情绪风险：${risk.emotionalRisk}。在继续之前，我会挑战这个想法：如果没有更干净的确认和止损位置，等待会比硬进场更专业。`;
			if (intent === "Trade Review") return `可以，我们把这次交易当成复盘，不当成责备。先看三个问题：进场是否有确认？止损是否在结构外？当时是不是情绪推动？${analysis ? `之前的 ${analysis.pair || analysis.instrument} 分析也可以一起对照。` : ""}`;
			if (intent === "Learning" || intent === "Learning Question") return `${snapshot.label} 今天可以这样理解：结构是 ${snapshot.marketStructure}，流动性是 ${snapshot.liquidityStatus}。重点不是猜涨跌，而是等价格回到计划区域后，看确认、止损、风险回报是否合理。`;
			return `${liveLine}${snapshot.label} 目前整体仍偏 ${snapshot.marketBias}，信心 ${localizedConfidenceLabel(snapshot.confidence)}。不过我不会建议追价。结构：${snapshot.marketStructure}。关键是 ${snapshot.keyZones[0]}。下一步：${snapshot.plan} 最终决定由你做，JARVIS 负责帮你把风险看清楚。`;
		}
		if (plan && isTradePlanIntent(intent)) return `Sure. Let me make this practical. I would not chase the current price. A better framework is to watch ${plan.potentialEntryZone} for confirmation. SL reference: ${plan.stopLossReference}. TP areas: ${plan.takeProfitZones.join(", ")}. ${plan.estimatedRR} The key is not to enter quickly; it is to wait for location, confirmation, and clean news risk.`;
		if (plan && (isBuyIntent(intent) || isSellIntent(intent))) return `There is an opportunity, but it does not look like a chase-now setup. I would watch ${plan.potentialEntryZone} and only continue if confirmation appears. SL reference: ${plan.stopLossReference}. TP areas: ${plan.takeProfitZones.join(", ")}. If price does not pull back or confirm, waiting is the stronger decision.`;
		if (intent === "Macro Question" && route?.macro) {
			const macro = route.macro;
			return `${macro.eventName} is in data-source-not-connected mode, so I will not invent previous, forecast, or actual numbers. Actual: ${macro.actual}. Professional view: ${macro.professionalView} Risk level: ${macro.riskLevel}. What to watch next: ${macro.watchNext}`;
		}
		if (intent === "General Conversation") return previous ? `I remember you asked: "${previous}". We can continue from there. The goal is not to collect more signals; it is to make one clean decision with discipline.` : "I'm here. Ask me about the market, risk, a loss review, or upload a chart. I will protect your decision quality before talking about profit.";
		if (intent === "Psychology" || intent === "Emotional Trading" || intent === "Revenge Trading") return `I want to protect the trader first. ${mistake ? `I also noticed a recent pattern: ${mistake}. ` : ""}If this question is coming from urgency, fear of missing out, or trying to win money back, the professional move may be to pause. A good trade does not need emotional pressure.`;
		if (intent === "Risk Question" || intent === "Risk Check" || risk.overallRisk === "High") return `${liveLine}${snapshot.label} has opportunity, but the current risk-reward is not healthy yet. Market risk: ${risk.marketRisk}. Account risk: ${risk.accountRisk}. News risk: ${risk.newsRisk}. Emotional risk: ${risk.emotionalRisk}. Before we continue, I would challenge this idea: without cleaner confirmation and a defined stop, waiting is the stronger decision.`;
		if (intent === "Trade Review") return `Good. Let's review the trade without blaming the trader. I would check three things first: did the entry have confirmation, was the stop outside structure, and was the decision emotionally driven? ${analysis ? `We can compare it with the previous ${analysis.pair || analysis.instrument} brief too.` : ""}`;
		if (intent === "Learning" || intent === "Learning Question") return `${snapshot.label} today can be understood this way: structure is ${snapshot.marketStructure}, and liquidity context is ${snapshot.liquidityStatus}. The lesson is not to predict harder; it is to wait until confirmation, invalidation, and risk/reward all line up.`;
		return `${liveLine}${snapshot.label} still favours ${snapshot.marketBias} with ${confidenceLabel(snapshot.confidence)} confidence. I would not chase the move. Structure: ${snapshot.marketStructure}. Key area: ${snapshot.keyZones[0]}. Next best action: ${snapshot.plan} The final decision stays with the trader; my job is to make the risk visible.`;
	}
	function beginMission(question) {
		const finalQuestion = question?.trim() || (state.jarvis.topic ? mentorText("Continue from the current market.", "继续刚才的市场。") : jarvisPromptExamples[state.jarvis.promptIndex % jarvisPromptExamples.length]);
		const nextIntent = detectIntent(finalQuestion);
		const route = routeJarvisInput({
			input: finalQuestion,
			memory: state.jarvis.memory,
			chart: state.chartUpload,
			journal: state.chartUpload.history
		});
		const isFollowUp = isFollowUpQuestion(finalQuestion) && (state.jarvis.quickAnalysis || state.chartUpload.analysis || state.jarvis.topic);
		clearStaleTradeContextForNewTopic(finalQuestion);
		state.jarvis.question = finalQuestion;
		state.jarvis.language = route.language || detectLanguage(finalQuestion);
		state.jarvis.intent = route.intent || nextIntent;
		state.jarvis.route = route;
		state.jarvis.status = "thinking";
		state.jarvis.progressIndex = 0;
		if (hasExplicitInstrument(finalQuestion)) {
			state.jarvis.topic = resolveInstrument(finalQuestion).symbol;
			syncSelectedTradeFromQuestion(finalQuestion);
		}
		updateJarvisMemoryFromQuestion(finalQuestion, state.jarvis.intent);
		if (!isFollowUp) state.jarvis.quickAnalysis = null;
		if (!isFollowUp && !state.chartUpload.previewUrl) state.chartUpload.analysis = null;
		state.jarvis.chat = state.jarvis.chat.filter((item) => !item.thinking);
		addChatMessage({
			role: "user",
			text: finalQuestion
		});
		addThinkingMessage();
		state.jarvis.missionStartedAt = (/* @__PURE__ */ new Date()).toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit"
		});
		state.jarvis.timeline = [
			mentorText("Mission opened", "Mission 已开启"),
			mentorText("Question received", "问题已收到"),
			mentorText(`${state.jarvis.intent} context selected`, `已判断问题类型`),
			mentorText(`${route.capabilities.length} capabilities selected`, `已选择 ${route.capabilities.length} 个能力`)
		];
		state.activePage = "JARVIS";
	}
	async function processMissionQuestion({ alreadyLocked = false } = {}) {
		if (state.jarvis.isProcessing && !alreadyLocked) return;
		if (!alreadyLocked) state.jarvis.isProcessing = true;
		try {
			await runThinkingSequence();
			const contextQuestion = questionWithTopic(state.jarvis.question);
			const route = routeJarvisInput({
				input: state.jarvis.question || contextQuestion,
				memory: state.jarvis.memory,
				chart: state.chartUpload,
				journal: state.chartUpload.history
			});
			const intent = route.intent || detectIntent(state.jarvis.question || contextQuestion);
			state.jarvis.intent = intent;
			state.jarvis.language = route.language || state.jarvis.language;
			state.jarvis.route = route;
			syncSelectedTradeFromQuestion(state.jarvis.question || contextQuestion);
			updateConversationState(route, state.jarvis.question || contextQuestion);
			if (isAmbiguousTradeQuestion(state.jarvis.question || contextQuestion, intent)) {
				state.jarvis.status = "needsContext";
				replaceThinkingMessage({
					...buildClarificationResponse(state.jarvis.question || contextQuestion, intent),
					attention: true
				});
				state.jarvis.timeline = [...state.jarvis.timeline, mentorText("Clarification requested", "已请求简短澄清")];
				return;
			}
			if (isPairingQuestion(state.jarvis.question || contextQuestion)) {
				state.jarvis.status = "quickReady";
				state.jarvis.intent = "Potential Signal Request";
				state.jarvis.mentorNote = buildPairingAnswer(state.jarvis.question || contextQuestion);
				replaceThinkingMessage(finalJarvisMessage(state.jarvis.mentorNote, { suggestions: buildNextActions("Potential Signal Request") }));
				state.jarvis.timeline = [...state.jarvis.timeline, mentorText("Trade Pairing Mode used", "已使用 Trade Pairing Mode")];
				return;
			}
			if (isFollowUpQuestion(state.jarvis.question) && (state.jarvis.quickAnalysis || state.chartUpload.analysis || state.jarvis.topic)) {
				state.jarvis.status = "quickReady";
				state.jarvis.mentorNote = buildFollowUpAnswer(state.jarvis.question);
				replaceThinkingMessage(finalJarvisMessage(state.jarvis.mentorNote, { suggestions: buildNextActions(intent) }));
				state.jarvis.timeline = [...state.jarvis.timeline, mentorText("Follow-up explained", "已解释追问")];
				return;
			}
			state.jarvis.quickAnalysis = await buildPreliminaryBrief(contextQuestion);
			const snapshot = getMockMarketSnapshot(contextQuestion);
			const quote = state.jarvis.quickAnalysis?.livePrice ? {
				price: state.jarvis.quickAnalysis.livePrice,
				currency: state.jarvis.quickAnalysis.liveCurrency,
				updatedAt: state.jarvis.quickAnalysis.liveUpdatedAt,
				type: state.jarvis.quickAnalysis.instrumentType,
				symbol: state.jarvis.quickAnalysis.pair
			} : await getLiveMarketQuote(contextQuestion);
			if (!state.chartUpload.previewUrl && intent === "Chart Analysis" && !isTradePlanIntent(intent)) {
				const brief = state.jarvis.quickAnalysis;
				const liveLine = brief.livePrice ? mentorText(`Live reference: ${brief.livePriceText} ${brief.liveCurrency || ""}. `, `实时参考价：${brief.livePriceText} ${brief.liveCurrency || ""}。`) : "";
				state.jarvis.status = "needsChart";
				state.jarvis.mentorNote = mentorText(`${liveLine}I can help. Without the chart, my best view is only preliminary. Upload the current chart and I will check structure, liquidity, risk, and the trade plan from the actual setup.`, `${liveLine}我可以帮你判断。没有图表时，我只能给初步看法。上传当前图表后，我会从实际 setup 检查结构、流动性、风险和交易计划。`);
				replaceThinkingMessage(finalJarvisMessage(state.jarvis.mentorNote, { suggestions: mentorText([
					"Upload chart",
					"Give preliminary view",
					"Check risk first"
				], [
					"上传图表",
					"先给初步看法",
					"先检查风险"
				]) }));
				state.jarvis.timeline = [...state.jarvis.timeline, mentorText("Chart requested", "需要图表确认")];
				return;
			}
			state.jarvis.status = "quickReady";
			const contextBrief = state.chartUpload.analysis || state.jarvis.quickAnalysis;
			state.jarvis.mentorNote = intent === "Macro Question" ? buildMacroResponse(route) : isTradePlanIntent(intent) || isBuyIntent(intent) || isSellIntent(intent) ? buildStructuredTradeResponse({
				question: contextQuestion,
				intent,
				snapshot,
				quote,
				brief: contextBrief
			}) : buildUnifiedMentorResponse({
				question: contextQuestion,
				intent,
				snapshot,
				quote,
				brief: contextBrief
			});
			const finalMessage = finalJarvisMessage(state.jarvis.mentorNote, {
				tradeRelated: route.safety?.isTradeRelated || intent !== "General Conversation",
				suggestions: buildNextActions(intent)
			});
			replaceThinkingMessage({
				...finalMessage,
				text: state.chartUpload.previewUrl ? `${finalMessage.text} ${mentorText("I will keep the uploaded chart available on the right for context.", "我会把已上传图表保留在右边作为判断背景。")}` : finalMessage.text
			});
			state.jarvis.timeline = [...state.jarvis.timeline, mentorText("Mentor view prepared", "导师观点已准备")];
		} catch (error) {
			console.error(error);
			state.jarvis.status = "error";
			state.jarvis.mentorNote = mentorText("I hit a processing issue, but I will not leave the mission hanging. Please send the question again, or upload the chart and I will rebuild the brief.", "刚才处理时出错了，但我不会让这个 Mission 卡住。请再发一次问题，或上传图表，我会重新建立简报。");
			replaceThinkingMessage({
				text: state.jarvis.mentorNote,
				attention: true
			});
			state.jarvis.timeline = [...state.jarvis.timeline, mentorText("Processing recovered", "处理已恢复")];
		} finally {
			state.jarvis.isProcessing = false;
			refreshMissionControlOnly();
		}
	}
	function addMasterChat(message) {
		state.adminChat = [...state.adminChat, {
			id: `admin-chat-${Date.now()}-${Math.random()}`,
			...message
		}].slice(-16);
	}
	function replaceMasterThinking(message) {
		const index = state.adminChat.findIndex((item) => item.thinking);
		const nextMessage = {
			id: `admin-chat-${Date.now()}-${Math.random()}`,
			role: "jarvis",
			...message
		};
		if (index >= 0) {
			state.adminChat = state.adminChat.map((item, itemIndex) => itemIndex === index ? nextMessage : item).slice(-16);
			return;
		}
		state.adminChat = [...state.adminChat, nextMessage].slice(-16);
	}
	function buildMasterReply(question, brain) {
		const text = question.toLowerCase();
		const weakUsers = adminUsers.filter((user) => user.health < 70);
		const pendingDeposits = adminUsers.filter((user) => user.deposit !== "Funded");
		const unlockQueue = adminUsers.filter((user) => [
			"Level 3",
			"Level 4",
			"Level 1"
		].includes(user.unlock));
		if (text.includes("deposit") || text.includes("fund")) return `Deposit status: 2 funded users, ${pendingDeposits.length} need follow-up. Mei is pending review. Lina has not started. Keep the message simple: confirm broker link, deposit status, and next action.`;
		if (text.includes("unlock") || text.includes("permission")) return `Unlock queue: ${unlockQueue.length} users need review. Kai and Arif are progressing well. Mei should stay at Level 1 until deposit and consistency are confirmed.`;
		if (text.includes("engine") || text.includes("health") || text.includes("mt5") || text.includes("system")) return `System status: MT5 is ${brain.system.mt5Connection}. Engine average is ${brain.system.engineHealthAverage}%. This is still read-only Alpha structure, so no trade execution is active.`;
		if (text.includes("alert") || text.includes("attention") || text.includes("risk") || text.includes("user")) return `Priority today: ${weakUsers.map((user) => user.name).join(" and ")} need attention. Mei needs deposit follow-up. Lina has paused learning and should receive a calm mentor check-in.`;
		if (text.includes("activity") || text.includes("recent")) return `Recent activity: ${activity.join(". ")}. Main mentor action is to protect consistency before pushing unlocks.`;
		return `Master summary: 4 users in the current cohort, 2 funded, 3 unlock reviews, 2 mentor alerts. Best action today is Mei deposit follow-up and Lina learning reactivation.`;
	}
	async function handleMasterQuestion(question, brain) {
		const finalQuestion = question || "Who needs attention today?";
		addMasterChat({
			role: "user",
			text: finalQuestion
		});
		addMasterChat({
			role: "jarvis",
			text: "Reviewing command center...",
			thinking: true
		});
		render();
		await new Promise((resolve) => setTimeout(resolve, 420));
		replaceMasterThinking({
			text: buildMasterReply(finalQuestion, brain),
			attention: /alert|attention|risk/i.test(finalQuestion)
		});
		render();
	}
	function bindMasterChatActions(page) {
		const form = page.querySelector(".master-chat-form");
		const input = page.querySelector("#masterQuestion");
		const prompts = page.querySelectorAll(".master-prompt");
		const brain = state.adminBrainData;
		if (input && form) {
			input.addEventListener("keydown", (event) => {
				if (event.key === "Enter" && !event.shiftKey) {
					event.preventDefault();
					form.requestSubmit();
				}
			});
			form.addEventListener("submit", async (event) => {
				event.preventDefault();
				const question = input.value.trim();
				input.value = "";
				await handleMasterQuestion(question, brain);
			});
		}
		prompts.forEach((button) => {
			button.addEventListener("click", async () => {
				await handleMasterQuestion(button.dataset.prompt || button.textContent.trim(), brain);
			});
		});
	}
	function bindBriefActions(root = document) {
		const explain = root.querySelector("#explainWhyButton");
		const entry = root.querySelector("#showEntryZoneButton");
		const save = root.querySelector("#saveJournalButton");
		const fresh = root.querySelector("#newAnalysisButton");
		if (explain) explain.addEventListener("click", () => toggleJarvisDetail("showWhy"));
		if (entry) entry.addEventListener("click", () => toggleJarvisDetail("showEntryZone"));
		if (save) save.addEventListener("click", () => {
			const currentAnalysis = state.chartUpload.analysis || state.jarvis.quickAnalysis;
			if (!currentAnalysis) return;
			const missionRecord = buildMissionRecord(currentAnalysis);
			state.chartUpload.history = [missionRecord, ...state.chartUpload.history].slice(0, 8);
			state.jarvis.savedToJournal = true;
			state.jarvis.timeline = [...state.jarvis.timeline, mentorText("Mission saved to Journal", "Mission saved to Journal")];
			localStorage.setItem("jarvis-chart-history", JSON.stringify(state.chartUpload.history));
			updateJarvisMemoryFromQuestion(state.jarvis.question || currentAnalysis.pair || "Saved mission", state.jarvis.intent || "Journal Review");
			render();
		});
		if (fresh) fresh.addEventListener("click", () => {
			state.jarvis = {
				...state.jarvis,
				question: "",
				status: "idle",
				progressIndex: 0,
				mentorNote: "",
				chat: [],
				savedToJournal: false,
				showEntryZone: false,
				showWhy: false,
				missionStartedAt: "",
				timeline: [],
				quickAnalysis: null,
				topic: "",
				isProcessing: false
			};
			state.chartUpload.previewUrl = "";
			state.chartUpload.fileName = "";
			state.chartUpload.analysis = null;
			localStorage.removeItem("jarvis-chart-preview");
			localStorage.removeItem("jarvis-chart-file-name");
			localStorage.removeItem("jarvis-chart-analysis");
			render();
		});
	}
	function bindChartUploadActions(page) {
		const input = page.querySelector("#chartUploadInput");
		const choose = page.querySelector("#chooseChartButton");
		const analyze = page.querySelector("#analyzeChartButton");
		const save = page.querySelector("#saveChartAnalysisButton");
		if (!input || !choose || !analyze || !save) return;
		choose.addEventListener("click", () => input.click());
		input.addEventListener("change", () => {
			const file = input.files?.[0];
			if (!file) return;
			const reader = new FileReader();
			reader.onload = () => {
				state.chartUpload.previewUrl = reader.result;
				state.chartUpload.fileName = file.name;
				state.chartUpload.analysis = null;
				localStorage.setItem("jarvis-chart-file-name", state.chartUpload.fileName);
				localStorage.removeItem("jarvis-chart-analysis");
				render();
			};
			reader.readAsDataURL(file);
		});
		analyze.addEventListener("click", async () => {
			if (!state.chartUpload.previewUrl) return;
			try {
				analyze.disabled = true;
				analyze.textContent = "Building...";
				state.chartUpload.analysis = await analyzeChartUpload({
					fileName: state.chartUpload.fileName,
					previewUrl: state.chartUpload.previewUrl,
					question: questionWithTopic(state.jarvis.question),
					previousMission: state.chartUpload.history[0] || null,
					journal: state.chartUpload.history
				});
				localStorage.setItem("jarvis-chart-analysis", JSON.stringify(state.chartUpload.analysis));
			} catch (error) {
				console.error(error);
				state.jarvis.mentorNote = "Chart analysis failed. Please try again with a clearer screenshot.";
			} finally {
				render();
			}
		});
		save.addEventListener("click", () => {
			if (!state.chartUpload.analysis) return;
			state.chartUpload.history = [buildMissionRecord(state.chartUpload.analysis), ...state.chartUpload.history].slice(0, 8);
			localStorage.setItem("jarvis-chart-history", JSON.stringify(state.chartUpload.history));
			render();
		});
	}
	function bindWatchlistActions(page) {
		page.querySelectorAll("[data-watchlist-filter]").forEach((button) => {
			button.addEventListener("click", () => {
				state.watchlistFilter = button.dataset.watchlistFilter || "All";
				render();
			});
		});
	}
	function bindPotentialTradeActions(page) {
		page.querySelectorAll("[data-open-trade]").forEach((button) => {
			button.addEventListener("click", () => {
				selectPotentialTrade(button.dataset.openTrade);
				render();
			});
		});
		page.querySelectorAll("[data-trade-filter]").forEach((button) => {
			button.addEventListener("click", () => {
				const key = button.dataset.tradeFilter;
				if (!key) return;
				state.potentialTrades.filters[key] = button.dataset.filterValue || "All";
				render();
			});
		});
		page.querySelectorAll("[data-pairing-filter]").forEach((button) => {
			button.addEventListener("click", () => {
				state.potentialTrades.pairingFilter = button.dataset.pairingFilter || "All";
				render();
			});
		});
		page.querySelectorAll("[data-trade-status]").forEach((button) => {
			button.addEventListener("click", () => {
				const trade = getPotentialTrades().find((item) => item.id === button.dataset.tradeStatus);
				if (!trade) return;
				const updated = updatePotentialTradeStatus(trade, button.dataset.nextStatus);
				state.potentialTrades.statusById[trade.id] = {
					status: updated.status,
					updatedAt: updated.updatedAt,
					reasonForStatusChange: updated.reasonForStatusChange,
					currentMarketCondition: updated.currentMarketCondition,
					nextActionSuggestion: updated.nextActionSuggestion
				};
				persistPotentialTradeState();
				selectPotentialTrade(trade.id);
				render();
			});
		});
		page.querySelectorAll("[data-trade-feedback]").forEach((button) => {
			button.addEventListener("click", () => {
				const trade = getPotentialTrades().find((item) => item.id === button.dataset.tradeFeedback);
				if (!trade) return;
				const record = createFeedbackRecord({
					trade,
					missionId: state.chartUpload.history[0]?.missionId,
					feedback: button.dataset.feedback || "Helpful",
					intent: state.jarvis.intent || "Potential Signal Request"
				});
				state.potentialTrades.feedback = [record, ...state.potentialTrades.feedback].slice(0, 50);
				localStorage.setItem("jarvis-trade-feedback", JSON.stringify(state.potentialTrades.feedback));
				render();
			});
		});
		page.querySelectorAll("[data-link-mission]").forEach((button) => {
			button.addEventListener("click", () => {
				const trade = getPotentialTrades().find((item) => item.id === button.dataset.linkMission);
				if (!trade) return;
				linkPotentialTradeToMission(trade);
				render();
			});
		});
	}
	function selectPotentialTrade(tradeId) {
		state.potentialTrades.selectedTradeId = tradeId || state.potentialTrades.selectedTradeId;
		localStorage.setItem("jarvis-selected-trade-id", state.potentialTrades.selectedTradeId);
		const trade = getSelectedPotentialTrade();
		state.jarvis.topic = trade.asset;
		state.jarvis.intent = "Potential Signal Request";
		state.jarvis.route = routeJarvisInput({
			input: `${trade.asset} ${trade.direction}`,
			memory: state.jarvis.memory,
			chart: state.chartUpload,
			journal: state.chartUpload.history
		});
	}
	function linkPotentialTradeToMission(trade) {
		const mission = {
			missionId: `mission-${Date.now()}`,
			tradeId: trade.id,
			userQuestion: `Review ${trade.asset} potential trade`,
			asset: trade.asset,
			assetClass: trade.assetClass,
			intent: "Potential Signal Request",
			selectedCapabilities: [
				"Signal Capability",
				"Planning Capability",
				"Risk Capability",
				"Mentor Capability"
			],
			verdict: trade.direction,
			jarvisVerdict: trade.direction,
			entryZone: trade.potentialEntryZone,
			slReference: trade.slReference,
			tpTargets: trade.tpTargets,
			rr: trade.estimatedRR,
			tradingSafety: trade.tradingSafety,
			mentorNotes: trade.mentorNotes,
			alternativeScenario: trade.alternativeScenario,
			status: trade.status,
			outcome: createOutcomeReview(trade),
			feedback: state.potentialTrades.feedback.filter((item) => item.tradeId === trade.id),
			timestamp: (/* @__PURE__ */ new Date()).toISOString(),
			disclaimer: trade.disclaimer
		};
		state.chartUpload.history = [mission, ...state.chartUpload.history].slice(0, 8);
		localStorage.setItem("jarvis-chart-history", JSON.stringify(state.chartUpload.history));
		updateJarvisMemoryFromQuestion(`${trade.asset} ${trade.direction}`, "Potential Signal Request");
	}
	function persistPotentialTradeState() {
		localStorage.setItem("jarvis-potential-trades", JSON.stringify(state.potentialTrades.statusById));
	}
	function bindJarvisMentorActions(page) {
		const form = page.querySelector(".jarvis-question-form");
		const uploadButtons = page.querySelectorAll("#jarvisUploadButton, #chartContextUploadButton");
		const input = page.querySelector("#chartUploadInput");
		bindBriefActions(page);
		page.addEventListener("click", async (event) => {
			const button = event.target.closest("[data-quick-prompt]");
			if (!button || !page.contains(button) || state.jarvis.isProcessing) return;
			const prompt = button.dataset.quickPrompt;
			const startedOutsideJarvis = state.activePage !== "JARVIS";
			beginMission(prompt);
			state.jarvis.isProcessing = true;
			if (startedOutsideJarvis) await renderFromTop();
			else refreshMissionControlOnly();
			await processMissionQuestion({ alreadyLocked: true });
			refreshMissionControlOnly();
		});
		if (form) {
			const textarea = page.querySelector("#jarvisQuestion");
			if (textarea) textarea.addEventListener("keydown", (event) => {
				if (event.key === "Enter" && !event.shiftKey) {
					event.preventDefault();
					form.requestSubmit();
				}
			});
			form.addEventListener("submit", async (event) => {
				event.preventDefault();
				if (state.jarvis.isProcessing) return;
				const mode = form.dataset.mode || "mission";
				const question = page.querySelector("#jarvisQuestion")?.value.trim();
				beginMission(question);
				state.jarvis.isProcessing = true;
				if (mode === "mission") {
					textarea.value = "";
					refreshMissionControlOnly();
				} else await renderFromTop();
				if (mode === "home") {
					await processMissionQuestion({ alreadyLocked: true });
					await renderFromTop();
					return;
				}
				await processMissionQuestion({ alreadyLocked: true });
				refreshMissionControlOnly();
			});
		}
		if (uploadButtons.length && input) {
			uploadButtons.forEach((button) => button.addEventListener("click", () => input.click()));
			input.addEventListener("change", () => {
				const file = input.files?.[0];
				if (!file) return;
				const reader = new FileReader();
				reader.onload = () => {
					state.chartUpload.previewUrl = reader.result;
					state.chartUpload.fileName = file.name;
					state.chartUpload.analysis = null;
					if (!state.jarvis.question) state.jarvis.question = mentorText("Analyse my chart", "分析我的图表");
					state.jarvis.intent = "Chart Analysis";
					state.jarvis.status = "analyzing";
					state.jarvis.progressIndex = 0;
					state.jarvis.mentorNote = mentorText("Chart received. I am reading the setup before giving a brief.", "图表已收到。我会先阅读结构，再给你简报。");
					addChatMessage({
						role: "user",
						text: mentorText(`Chart attached: ${file.name}`, `已附加图表：${file.name}`)
					});
					addThinkingMessage();
					state.jarvis.timeline = [...state.jarvis.timeline, mentorText("Chart uploaded", "Chart uploaded")];
					localStorage.setItem("jarvis-chart-file-name", state.chartUpload.fileName);
					localStorage.removeItem("jarvis-chart-analysis");
					input.value = "";
					render();
					startJarvisAnalysis();
				};
				reader.readAsDataURL(file);
			});
		}
	}
	function toggleJarvisDetail(key) {
		state.jarvis[key] = !state.jarvis[key];
		render();
	}
	async function startJarvisAnalysis() {
		if (state.jarvis.isProcessing) return;
		state.jarvis.isProcessing = true;
		state.jarvis.status = "analyzing";
		state.jarvis.savedToJournal = false;
		state.jarvis.showEntryZone = false;
		state.jarvis.showWhy = false;
		try {
			await runThinkingSequence();
			state.chartUpload.analysis = await analyzeChartUpload({
				fileName: state.chartUpload.fileName,
				previewUrl: state.chartUpload.previewUrl,
				question: questionWithTopic(state.jarvis.question),
				previousMission: state.chartUpload.history[0] || null,
				journal: state.chartUpload.history
			});
			state.jarvis.status = "briefReady";
			state.jarvis.mentorNote = buildUnifiedMentorResponse({
				question: questionWithTopic(state.jarvis.question),
				intent: state.jarvis.intent || "Chart Analysis",
				snapshot: getMockMarketSnapshot(questionWithTopic(state.jarvis.question)),
				quote: {
					price: state.chartUpload.analysis.livePrice,
					currency: state.chartUpload.analysis.liveCurrency,
					updatedAt: state.chartUpload.analysis.liveUpdatedAt
				},
				brief: state.chartUpload.analysis
			});
			updateConversationState(state.jarvis.route || {}, questionWithTopic(state.jarvis.question));
			replaceThinkingMessage(finalJarvisMessage(state.jarvis.mentorNote, { suggestions: buildNextActions(state.jarvis.intent || "Chart Analysis") }));
			state.jarvis.timeline = [...state.jarvis.timeline, mentorText("Trading Brief built", "交易简报已建立")];
			localStorage.setItem("jarvis-chart-analysis", JSON.stringify(state.chartUpload.analysis));
		} catch (error) {
			console.error(error);
			state.jarvis.status = "error";
			replaceThinkingMessage({
				text: mentorText("I could not complete the chart analysis. Upload a clearer screenshot with pair, timeframe, and price scale, then I will rebuild it.", "我无法完成这次图表分析。请上传更清楚的截图，包含品种、周期和价格刻度，我会重新建立简报。"),
				attention: true
			});
		} finally {
			state.jarvis.isProcessing = false;
			render();
		}
	}
	function card(title, body, className = "") {
		return `<article class="card ${className}"><h3>${title}</h3>${body}</article>`;
	}
	function kpi(label, value, detail) {
		return `<div class="kpi-card"><span>${label}</span><strong>${value}</strong><p>${detail}</p></div>`;
	}
	function userRow(user) {
		return `
    <div class="admin-user-row">
      <div><strong>${user.name}</strong><span>${user.growth}</span></div>
      <span>${user.deposit}</span>
      <span>${user.unlock}</span>
      <b>${user.health}%</b>
    </div>
  `;
	}
	function timeGreeting() {
		const isZh = state.jarvis.language === "zh";
		if (state.loginHour < 12) return isZh ? "早上好" : "Good morning";
		if (state.loginHour < 18) return isZh ? "下午好" : "Good afternoon";
		return isZh ? "晚上好" : "Good evening";
	}
	const approvedNavItems = [
		{
			label: "Workspace",
			labelZh: "工作空间",
			page: "Home",
			icon: "home"
		},
		{
			label: "Ask JARVIS",
			labelZh: "询问 JARVIS",
			page: "JARVIS",
			icon: "message"
		},
		{
			label: "AI Analysis",
			labelZh: "AI 分析",
			page: "AIAnalysis",
			icon: "analysis"
		},
		{
			label: "Upload Chart",
			labelZh: "上传图表",
			page: "UploadChart",
			icon: "upload"
		},
		{
			label: "Macro Intelligence",
			labelZh: "宏观情报",
			page: "Macro",
			icon: "macro"
		},
		{
			label: "News & Events",
			labelZh: "新闻与事件",
			page: "Calendar",
			icon: "calendar"
		},
		{
			label: "Opportunity Scanner",
			labelZh: "机会扫描",
			page: "OpportunityScanner",
			icon: "scanner"
		},
		{
			label: "Trade Planner",
			labelZh: "交易规划",
			page: "TradePlanner",
			icon: "planner"
		},
		{
			label: "Settings",
			labelZh: "设置",
			page: "Settings",
			icon: "settings"
		}
	];
	const approvedAdminNavItems = [
		{
			label: "Dashboard",
			page: "Command",
			icon: "home"
		},
		{
			label: "Users",
			page: "AdminUsers",
			icon: "users"
		},
		{
			label: "Subscriptions",
			page: "AdminSubscriptions",
			icon: "subs"
		},
		{
			label: "Revenue",
			page: "AdminRevenue",
			icon: "revenue"
		},
		{
			label: "System Overview",
			page: "AdminSystem",
			icon: "system"
		},
		{
			label: "AI Engines",
			page: "AdminEngines",
			icon: "engine"
		},
		{
			label: "Prompt Center",
			page: "AdminPrompts",
			icon: "prompt"
		},
		{
			label: "Market Data",
			page: "AdminMarketData",
			icon: "data"
		},
		{
			label: "News Engine",
			page: "AdminNews",
			icon: "news"
		},
		{
			label: "Insight Logs",
			page: "AdminInsights",
			icon: "logs"
		},
		{
			label: "Signal Monitor",
			page: "AdminSignals",
			icon: "signal"
		},
		{
			label: "Trade Logs",
			page: "AdminTrades",
			icon: "trade"
		},
		{
			label: "Risk Monitor",
			page: "AdminRisk",
			icon: "risk"
		},
		{
			label: "Integrations",
			page: "AdminIntegrations",
			icon: "integrations"
		},
		{
			label: "Settings",
			page: "AdminSettings",
			icon: "settings"
		},
		{
			label: "Audit Logs",
			page: "AdminAudit",
			icon: "audit"
		}
	];
	const marketRadarRows = [
		{
			asset: "XAUUSD",
			name: "Gold",
			price: "2,362.45",
			change: "+0.64%",
			trend: "Bullish",
			bias: "Bullish",
			type: "Commodities"
		},
		{
			asset: "BTCUSD",
			name: "Bitcoin",
			price: "67,250.00",
			change: "+1.48%",
			trend: "Ranging",
			bias: "Neutral",
			type: "Crypto"
		},
		{
			asset: "DXY",
			name: "Dollar Index",
			price: "105.42",
			change: "+0.28%",
			trend: "Firm",
			bias: "Neutral",
			type: "Indices"
		},
		{
			asset: "EURUSD",
			name: "Euro Dollar",
			price: "1.0871",
			change: "-0.12%",
			trend: "Soft",
			bias: "Neutral",
			type: "Forex"
		},
		{
			asset: "GBPUSD",
			name: "Pound Dollar",
			price: "1.2683",
			change: "+0.06%",
			trend: "Range",
			bias: "Neutral",
			type: "Forex"
		},
		{
			asset: "NAS100",
			name: "Nasdaq 100",
			price: "19,438.30",
			change: "+0.48%",
			trend: "Bullish",
			bias: "Bullish",
			type: "Indices"
		},
		{
			asset: "USOIL",
			name: "Crude Oil",
			price: "78.24",
			change: "-0.34%",
			trend: "Pullback",
			bias: "Neutral",
			type: "Commodities"
		}
	];
	const calendarEvents = [
		{
			time: "14:30",
			event: "USD CPI y/y",
			impact: "High",
			actual: "-",
			forecast: "3.1%",
			previous: "3.3%"
		},
		{
			time: "16:00",
			event: "USD Core CPI m/m",
			impact: "High",
			actual: "-",
			forecast: "0.2%",
			previous: "0.2%"
		},
		{
			time: "20:30",
			event: "USD Unemployment Claims",
			impact: "Medium",
			actual: "-",
			forecast: "235K",
			previous: "236K"
		},
		{
			time: "22:00",
			event: "USD Fed Member Speaks",
			impact: "Medium",
			actual: "-",
			forecast: "-",
			previous: "-"
		},
		{
			time: "23:30",
			event: "USD 30-y Bond Auction",
			impact: "Low",
			actual: "-",
			forecast: "-",
			previous: "4.40%"
		}
	];
	function sidebar() {
		const side = el("aside", "sidebar approved-sidebar");
		const visibleNavItems = state.role === "admin" ? approvedAdminNavItems : approvedNavItems;
		const isZh = state.jarvis.language === "zh";
		side.innerHTML = `
    <div class="brand-lockup approved-brand">
      <div class="brand-mark">J</div>
      <div><p>JARVIS</p><span>AI TRADING OS</span></div>
      <button class="sidebar-collapse-toggle" type="button" aria-label="${state.approvedUi.sidebarExpanded ? "Collapse" : "Expand"} navigation" aria-expanded="${state.approvedUi.sidebarExpanded}">${lineIcon("menu")}</button>
      <button class="mobile-nav-close" type="button" aria-label="Close navigation">${lineIcon("close")}</button>
    </div>
    <nav class="approved-nav"></nav>
    <div class="sidebar-footer">
      <div class="sidebar-profile">
        <span>${mockUser.name.slice(0, 1).toUpperCase()}</span>
        <div><strong>${mockUser.name}</strong><small>${isZh ? "高级会员" : "Premium Member"}</small></div>
      </div>
      <div class="engine-mini"><i></i><div><strong>JARVIS Engine</strong><small>${isZh ? "在线" : "Online"}</small></div></div>
      ${state.isAdminUser ? `<button class="admin-switch">${state.role === "admin" ? "User Workspace" : "Master Center"}</button>` : ""}
    </div>
  `;
		const nav = side.querySelector("nav");
		visibleNavItems.forEach((item) => {
			const itemLabel = isZh && item.labelZh ? item.labelZh : item.label;
			const button = el("button", item.page === state.activePage ? "active" : "", `${lineIcon(item.icon)}<span>${itemLabel}</span>`);
			button.setAttribute("aria-label", itemLabel);
			button.setAttribute("title", itemLabel);
			button.addEventListener("click", () => {
				state.activePage = item.page;
				document.body.classList.remove("nav-open");
				renderFromTop();
			});
			nav.appendChild(button);
		});
		side.querySelector(".sidebar-collapse-toggle")?.addEventListener("click", () => {
			state.approvedUi.sidebarExpanded = !state.approvedUi.sidebarExpanded;
			document.querySelector(".app-shell")?.classList.toggle("sidebar-expanded", state.approvedUi.sidebarExpanded);
			const toggle = document.querySelector(".sidebar-collapse-toggle");
			toggle?.setAttribute("aria-expanded", String(state.approvedUi.sidebarExpanded));
			toggle?.setAttribute("aria-label", `${state.approvedUi.sidebarExpanded ? "Collapse" : "Expand"} navigation`);
		});
		const adminSwitch = side.querySelector(".admin-switch");
		if (adminSwitch) adminSwitch.addEventListener("click", () => {
			if (!state.isAdminUser) return;
			state.role = state.role === "admin" ? "user" : "admin";
			state.activePage = state.role === "admin" ? "Command" : "Home";
			renderFromTop();
		});
		side.querySelector(".mobile-nav-close")?.addEventListener("click", () => {
			document.querySelector(".app-shell")?.classList.remove("mobile-nav-open");
			document.body.classList.remove("nav-open");
		});
		return side;
	}
	function topbar() {
		const bar = el("header", "topbar approved-topbar");
		const title = pageTitle();
		const isZh = state.jarvis.language === "zh";
		bar.innerHTML = `
    <div class="topbar-title">
      <p>${state.role === "admin" ? isZh ? "管理工作空间" : "Master Workspace" : isZh ? "AI 交易操作平台" : "AI Trading Operation Platform"}</p>
      <h2>${title}</h2>
    </div>
    <div class="topbar-actions">
      <button class="mobile-nav-toggle" type="button" aria-label="Open navigation" aria-expanded="false">${lineIcon("menu")}</button>
      <span class="premium-badge">Premium</span>
      <div class="profile-pill" title="${mockUser.name}" aria-label="${mockUser.name}"><span>${mockUser.name.slice(0, 1).toUpperCase()}</span></div>
    </div>
  `;
		bar.querySelector(".mobile-nav-toggle")?.addEventListener("click", (event) => {
			const shellElement = document.querySelector(".app-shell");
			const isOpen = !shellElement?.classList.contains("mobile-nav-open");
			shellElement?.classList.toggle("mobile-nav-open", isOpen);
			document.body.classList.toggle("nav-open", isOpen);
			event.currentTarget.setAttribute("aria-expanded", String(isOpen));
		});
		return bar;
	}
	function pageTitle() {
		const item = [...approvedNavItems, ...approvedAdminNavItems].find((entry) => entry.page === state.activePage);
		if (item) return state.jarvis.language === "zh" && item.labelZh ? item.labelZh : item.label;
		return state.role === "admin" ? "Dashboard" : state.jarvis.language === "zh" ? "工作空间" : "Workspace";
	}
	function pageContentForActivePage(brain) {
		if (state.activePage === "JARVIS") return jarvisPageContent(brain);
		if (state.activePage === "MarketRadar") return marketRadarPageContent();
		if (state.activePage === "AIAnalysis") return aiAnalysisPageContent(brain);
		if (state.activePage === "UploadChart") return uploadChartPageContent(brain);
		if (state.activePage === "OpportunityScanner") return opportunityScannerPageContent();
		if (state.activePage === "Macro") return macroIntelligencePageContent();
		if (state.activePage === "Calendar") return economicCalendarPageContent();
		if (state.activePage === "TradePlanner") return tradePlannerPageContent(brain);
		if (state.activePage === "RiskCenter") return riskCenterPageContent(brain);
		if (state.activePage === "Settings") return settingsPageContent();
		return homePageContent(brain);
	}
	function homePageContent(brain) {
		const isZh = state.jarvis.language === "zh";
		const suggestions = isZh ? [
			"现在可以买 Gold 吗？",
			"CPI 预期是多少？",
			"分析这张图表",
			"最新美联储新闻",
			"上传我的图表",
			"寻找交易机会"
		] : [
			"Can I buy Gold now?",
			"What is the CPI forecast?",
			"Analyze this chart",
			"Latest news on Fed",
			"Upload my chart",
			"Find trading opportunities"
		];
		return `
    <section class="approved-workspace workspace-command-center bible-home">
      <header class="bible-greeting">
        <p>${timeGreeting()},</p>
        <h1>${mockUser.name}</h1>
        <span>${isZh ? "您的 AI 交易操作平台" : "Your AI Trading Operation Platform"}</span>
      </header>
      <section class="bible-command-hero">
        ${approvedCommandBar(isZh ? "向 JARVIS 询问任何市场问题..." : "Ask JARVIS anything...", "home")}
        <div class="bible-suggestions">
          <span class="suggestions-label">${isZh ? "试着问" : "Try asking"}</span>
          ${suggestions.map((item) => `<button type="button" data-quick-prompt="${item}">${item}</button>`).join("")}
        </div>
      </section>
      <section class="bible-live-strip" aria-label="${isZh ? "市场报价" : "Live quotes"}">
        <div class="live-label"><i></i>${isZh ? "市场" : "LIVE"}</div>
        ${[
			"XAUUSD",
			"EURUSD",
			"DXY",
			"BTCUSD",
			"USOIL"
		].map((symbol) => `<div class="live-quote"><strong>${symbol}</strong><span>${isZh ? "等待已验证数据" : "Awaiting verified feed"}</span></div>`).join("")}
      </section>
      <blockquote class="daily-quote">
        <p>${isZh ? "“纪律是连接目标与成就的桥梁。”" : "“Discipline is the bridge between goals and accomplishment.”"}</p>
        <cite>— JARVIS</cite>
      </blockquote>
    </section>
  `;
	}
	function jarvisPageContent(brain) {
		const isZh = state.jarvis.language === "zh";
		const emptySuggestions = isZh ? ["现在可以买 Gold 吗？", "分析 EURUSD", "今天的 CPI", "最新美联储新闻", "分析我的图表", "寻找交易机会"] : ["Can I buy Gold now?", "Analyse EURUSD", "Today's CPI", "Latest Fed News", "Analyse my chart", "Find opportunities"];
		return `
    <section class="approved-workspace ask-page">
      <div class="approved-page-head ask-page-heading">
        <img class="ask-apex-logo" src="./assets/apex-logo-official.jpg" alt="APEX" />
        <div><h1>Ask JARVIS</h1><p>${isZh ? "您的 AI 交易助手" : "Your AI Trading Assistant"}</p></div>
      </div>
      <div class="suggested-actions ask-top-suggestions">${emptySuggestions.map((item) => `<button type="button" data-quick-prompt="${item}">${item}</button>`).join("")}</div>
      <section class="ask-layout ask-layout-single">
        <article class="conversation-panel approved-conversation">
          <div class="chat-thread">
            ${state.jarvis.chat.length ? state.jarvis.chat.map(renderApprovedChatMessage).join("") : renderStarterJarvisBlock(brain)}
          </div>
          <form class="jarvis-question-form approved-chat-input" data-mode="mission">
            <textarea id="jarvisQuestion" rows="2" placeholder="${isZh ? "向 JARVIS 提问..." : "Ask JARVIS anything..."}"></textarea>
            <div class="jarvis-actions">
              <button class="ghost-button" id="jarvisUploadButton" type="button">${lineIcon("upload")} Upload Chart</button>
              <button class="ghost-button" type="button" disabled>${lineIcon("mic")} Voice</button>
              <button type="submit">${lineIcon("send")}</button>
            </div>
            <input id="chartUploadInput" class="hidden-file-input" type="file" accept="image/*" />
          </form>
          ${chartContextControl()}
        </article>
      </section>
    </section>
  `;
	}
	function chartContextControl() {
		const isZh = state.jarvis.language === "zh";
		const hasChart = Boolean(state.chartUpload.previewUrl);
		return `
    <details class="chart-context-control">
      <summary>
        <span class="chart-context-icon">${lineIcon("upload")}</span>
        <span><strong>${isZh ? "上传图表" : "Upload Chart"}</strong><small>${isZh ? "需要 setup 背景时，上传当前图表。" : "Upload the current chart when the decision needs setup context."}</small></span>
        <span class="chart-context-chevron">${lineIcon("send")}</span>
      </summary>
      <div class="chart-context-body">
        ${hasChart ? `<img class="chart-preview mentor-preview" src="${state.chartUpload.previewUrl}" alt="Uploaded chart preview" /><p>${escapeHtml(state.chartUpload.fileName)}</p>` : `<p>${isZh ? "尚未附加图表。当前回答只使用可用的初步背景。" : "No chart is attached. The current response uses preliminary context only."}</p>`}
        <button class="ghost-button" id="chartContextUploadButton" type="button">${lineIcon("upload")} ${hasChart ? isZh ? "更换图表" : "Replace Chart" : isZh ? "选择图表" : "Choose Chart"}</button>
      </div>
    </details>
  `;
	}
	function marketRadarPageContent() {
		const filter = state.approvedUi.marketFilter;
		const rows = filter === "All" ? marketRadarRows : marketRadarRows.filter((row) => row.type === filter);
		return `
    <section class="approved-workspace">
      <div class="approved-page-head"><div><h1>Market Radar</h1><p>Real-time market overview</p></div></div>
      <div class="approved-tabs">${[
			"All",
			"Forex",
			"Crypto",
			"Indices",
			"Commodities",
			"Stocks"
		].map((item) => `<button class="${item === filter ? "active" : ""}" type="button" data-market-filter="${item}">${item}</button>`).join("")}</div>
      ${marketTable(rows)}
    </section>
  `;
	}
	function uploadChartPageContent(brain) {
		const analysis = state.chartUpload.analysis || state.jarvis.quickAnalysis;
		const mode = state.approvedUi.analysisMode;
		return `
    <section class="approved-workspace">
      <div class="approved-page-head">
        <div><h1>AI Analysis</h1><p>Unified analysis workspace</p></div>
        <button class="soft-action" id="chooseChartButton" type="button">${lineIcon("upload")} Upload Chart</button>
      </div>
      <div class="approved-tabs">${[
			"Chart Analysis",
			"Market Analysis",
			"Compare Assets"
		].map((item) => `<button class="${item === mode ? "active" : ""}" type="button" data-analysis-mode="${item}">${item}</button>`).join("")}</div>
      <section class="analysis-workspace">
        <div class="analysis-main">
          <div class="analysis-controls">
            <select aria-label="Asset"><option>Gold / XAUUSD</option><option>BTCUSD</option><option>EURUSD</option><option>NAS100</option></select>
            <select aria-label="Timeframe"><option>H1</option><option>M15</option><option>H4</option><option>D1</option></select>
            <button class="ghost-button" id="analyzeChartButton" type="button" ${state.chartUpload.previewUrl ? "" : "disabled"}>Analyse</button>
            <button class="ghost-button" type="button" data-quick-prompt="Generate trade plan">Generate Trade Plan</button>
          </div>
          <div class="chart-stage">
            ${state.chartUpload.previewUrl ? `<img class="chart-preview large" src="${state.chartUpload.previewUrl}" alt="Uploaded chart preview" />` : mockChartCanvas()}
            <div class="chart-toolbar">
              ${[
			"Trend",
			"Zone",
			"Liquidity",
			"Entry",
			"SL",
			"TP"
		].map((item) => `<button>${item}</button>`).join("")}
            </div>
          </div>
          <input id="chartUploadInput" class="hidden-file-input" type="file" accept="image/*" />
        </div>
        <aside class="analysis-side-panel">
          ${analysisSidePanel(analysis, brain)}
          <form class="jarvis-question-form chart-question" data-mode="mission">
            <textarea id="jarvisQuestion" rows="2" placeholder="Ask JARVIS about this chart or asset..."></textarea>
            <div class="jarvis-actions"><button type="submit">${lineIcon("send")}</button></div>
          </form>
          <button class="soft-action full" id="saveChartAnalysisButton" type="button" ${state.chartUpload.analysis ? "" : "disabled"}>Send to Trade Planner</button>
        </aside>
      </section>
    </section>
	  `;
	}
	function aiAnalysisPageContent() {
		const isZh = state.jarvis.language === "zh";
		const asset = state.approvedUi.analysisAsset;
		const timeframe = state.approvedUi.analysisTimeframe;
		const isLoading = state.approvedUi.analysisStatus === "loading";
		const hasChart = Boolean(state.chartUpload.previewUrl);
		const analysis = state.chartUpload.analysis || state.jarvis.quickAnalysis;
		const dataStatus = hasChart ? isZh ? "图表背景" : "Chart Context" : isZh ? "数据源未连接" : "Data Source Not Connected";
		const bias = hasChart && ["Bullish", "Bearish", "Neutral"].includes(analysis?.bias) ? analysis.bias : "Neutral";
		const structure = hasChart ? analysis?.marketStructure || (isZh ? "等待图表确认" : "Awaiting chart confirmation") : isZh ? "等待数据" : "Awaiting Data";
		const unavailable = isZh ? "等待已验证市场数据" : "Awaiting verified market data";
		const chartRequired = isZh ? "上传图表以获得准确的 Entry / SL / TP" : "Upload chart for accurate Entry / SL / TP";
		const refreshed = state.approvedUi.analysisLastUpdated ? new Date(state.approvedUi.analysisLastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
		const lastUpdated = refreshed ? `${isZh ? "页面刷新" : "Page refreshed"} ${refreshed}` : isZh ? "最后更新时间不可用" : "Last updated unavailable";
		const row = (label, value, tone = "") => `<div class="analysis-data-row"><span>${label}</span><strong class="${tone}">${value}</strong></div>`;
		const status = (value, tone = "muted") => `<span class="analysis-status ${tone}">${value}</span>`;
		const unavailableList = (count, text) => `<ul class="analysis-compact-list">${Array.from({ length: count }, () => `<li>${text}</li>`).join("")}</ul>`;
		return `
    <section class="approved-workspace ai-analysis-page ${isLoading ? "is-loading" : ""}">
      <header class="ai-analysis-head">
        <div><h1>${isZh ? "AI 分析" : "AI Analysis"}</h1><p>${isZh ? "由 JARVIS 驱动的结构化市场情报。" : "Structured market intelligence powered by JARVIS."}</p></div>
        <div class="ai-analysis-head-actions">
          <div class="analysis-source-meta"><span>${lastUpdated}</span>${status(dataStatus, hasChart ? "info" : "warning")}</div>
          <button class="analysis-refresh-button" id="refreshAiAnalysis" type="button" ${isLoading ? "disabled" : ""} aria-label="${isZh ? "刷新分析" : "Refresh analysis"}">${lineIcon("refresh")}<span>${isLoading ? isZh ? "分析中" : "Analysing" : isZh ? "刷新分析" : "Refresh Analysis"}</span></button>
        </div>
      </header>
      <section class="analysis-selector-row" aria-label="${isZh ? "分析控制" : "Analysis controls"}">
        <label><span>${isZh ? "资产" : "Asset"}</span><select id="analysisAssetSelect" aria-label="Asset">${["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "BTCUSD"].map((value) => `<option value="${value}" ${value === asset ? "selected" : ""}>${value}</option>`).join("")}</select></label>
        <label><span>${isZh ? "周期" : "Timeframe"}</span><select id="analysisTimeframeSelect" aria-label="Timeframe">${["D1", "H4", "H1", "M15"].map((value) => `<option value="${value}" ${value === timeframe ? "selected" : ""}>${value}</option>`).join("")}</select></label>
      </section>
      ${state.approvedUi.analysisError ? `<section class="analysis-error-state" role="alert"><div><strong>${isZh ? "分析暂不可用" : "Analysis unavailable"}</strong><p>${isZh ? "JARVIS 无法完成分析。请重试或检查数据连接。" : "JARVIS could not complete the analysis. Please retry or verify the data connection."}</p><small>${dataStatus}</small></div><button id="retryAiAnalysis" type="button">${isZh ? "重试" : "Retry"}</button></section>` : ""}
      <div class="analysis-loading-state" role="status" aria-live="polite" aria-hidden="${!isLoading}"><i></i><span>${isZh ? "JARVIS 正在分析..." : "JARVIS is analysing..."}</span></div>
      <section class="ai-analysis-grid" aria-busy="${isLoading}">
        <article class="analysis-module market-overview-module">
          <div class="analysis-module-title"><h2>${isZh ? "市场概览" : "Market Overview"}</h2>${status(hasChart ? isZh ? "初步" : "Preliminary" : isZh ? "需要数据" : "Data Required", hasChart ? "info" : "warning")}</div>
          <div class="market-overview-grid">
            ${row(isZh ? "市场偏向" : "Market Bias", bias, bias === "Bullish" ? "positive" : bias === "Bearish" ? "negative" : "")}
            ${row(isZh ? "市场模式" : "Market Mode", hasChart ? isZh ? "等待确认" : "Awaiting Confirmation" : isZh ? "等待数据" : "Awaiting Data")}
            ${row(isZh ? "趋势强度" : "Trend Strength", isZh ? "数据不足" : "Insufficient Data")}
            <div class="analysis-confidence"><span>${isZh ? "信心" : "Confidence"}</span><div class="confidence-ring preliminary"><strong>—</strong></div><small>${isZh ? "初步信心" : "Preliminary Confidence"}</small></div>
            ${row(isZh ? "价格状态" : "Price Status", isZh ? "等待价格数据" : "Awaiting Price Data")}
            ${row(isZh ? "分析质量" : "Analysis Quality", hasChart ? isZh ? "图表背景" : "Chart Context" : isZh ? "需要数据" : "Data Required")}
          </div>
        </article>
        <article class="analysis-module mtf-module">
          <div class="analysis-module-title"><h2>${isZh ? "多周期一致性" : "Multi-Timeframe Alignment"}</h2></div>
          <div class="mtf-grid">${["D1", "H4", "H1", "M15"].map((tf) => `<div><span>${tf}</span><strong>${isZh ? "等待数据" : "Awaiting Data"}</strong></div>`).join("")}</div>
          ${row(isZh ? "整体一致性" : "Overall Alignment", isZh ? "等待数据" : "Awaiting Data")}
          <p class="module-note">${isZh ? "连接已验证市场数据后，JARVIS 才能比较各周期。" : "Connect verified market data before JARVIS compares timeframes."}</p>
        </article>
        <article class="analysis-module structure-module">
          <div class="analysis-module-title"><h2>${isZh ? `市场结构 (${timeframe})` : `Market Structure (${timeframe})`}</h2></div>
          <div class="structure-empty-visual" aria-label="${isZh ? "结构数据不可用" : "Structure data unavailable"}"><span>${lineIcon("analysis")}</span><p>${isZh ? "上传图表以建立解释性结构图" : "Upload a chart to build an explanatory structure view"}</p></div>
          ${row(isZh ? "当前结构" : "Current Structure", structure)}
          ${row(isZh ? "最新转变" : "Latest Shift", isZh ? "等待确认" : "Awaiting Confirmation")}
          ${row(isZh ? "结构状态" : "Structure Status", isZh ? "等待确认" : "Awaiting Confirmation")}
          ${row(isZh ? "确认水平" : "Confirmation Level", isZh ? "确认水平不可用" : "Confirmation level unavailable")}
        </article>
        <article class="analysis-module liquidity-module">
          <div class="analysis-module-title"><h2>${isZh ? "流动性与关键区域" : "Liquidity & Key Zones"}</h2></div>
          ${row(isZh ? "买方流动性" : "Buy-side Liquidity", unavailable)}
          ${row(isZh ? "卖方流动性" : "Sell-side Liquidity", unavailable)}
          ${row(isZh ? "支撑区" : "Support Zone", unavailable)}
          ${row(isZh ? "阻力区" : "Resistance Zone", unavailable)}
          ${row(isZh ? "订单块" : "Order Block", unavailable)}
          ${row(isZh ? "公平价值缺口" : "Fair Value Gap", unavailable)}
          ${row(isZh ? "扫流动性状态" : "Sweep Status", isZh ? "未验证" : "Not verified")}
          <p class="module-note">${isZh ? "上传图表或连接已验证数据以识别准确区域。" : "Upload a chart or connect verified market data to identify accurate zones."}</p>
        </article>
        <article class="analysis-module condition-module">
          <div class="analysis-module-title"><h2>${isZh ? "波动率与市场状态" : "Volatility & Market Condition"}</h2></div>
          ${row(isZh ? "波动率" : "Volatility", isZh ? "不可用" : "Unavailable")}
          ${row(isZh ? "市场状态" : "Market Condition", isZh ? "等待数据" : "Awaiting Data")}
          ${row(isZh ? "交易时段" : "Session", isZh ? "时段数据不可用" : "Session Data Unavailable")}
          ${row(isZh ? "扩张 / 压缩" : "Expansion / Compression", isZh ? "不可用" : "Unavailable")}
        </article>
        <article class="analysis-module trade-plan-module">
          <div class="analysis-module-title"><h2>${isZh ? "潜在交易计划" : "Potential Trade Plan"}</h2>${status(isZh ? "需要数据" : "Data Required", "warning")}</div>
          ${row(isZh ? "Setup 状态" : "Setup Status", hasChart ? isZh ? "图表必需" : "Chart Required" : isZh ? "需要数据" : "Data Required")}
          ${row(isZh ? "进场区" : "Entry Zone", unavailable)}
          ${row(isZh ? "止损" : "Stop Loss", chartRequired)}
          ${row(isZh ? "止盈 1" : "Take Profit 1", unavailable)}
          ${row(isZh ? "止盈 2" : "Take Profit 2", unavailable)}
          ${row(isZh ? "止盈 3" : "Take Profit 3", unavailable)}
          ${row(isZh ? "风险回报" : "Risk Reward", unavailable)}
          ${row(isZh ? "失效水平" : "Invalidation Level", unavailable)}
        </article>
        <article class="analysis-module bullish-module">
          <div class="analysis-module-title"><h2>${isZh ? "看涨情景" : "Bullish Scenario"}</h2></div>
          ${row(isZh ? "条件" : "Condition", isZh ? "需要已验证结构" : "Verified structure required")}
          ${row(isZh ? "确认" : "Confirmation", isZh ? "等待确认" : "Awaiting confirmation")}
          ${row(isZh ? "目标区域" : "Target Area", unavailable)}
          ${row(isZh ? "失效" : "Invalidation", unavailable)}
          ${row(isZh ? "概率" : "Probability", isZh ? "数据不足" : "Insufficient Data", "positive")}
        </article>
        <article class="analysis-module bearish-module">
          <div class="analysis-module-title"><h2>${isZh ? "看跌情景" : "Bearish Scenario"}</h2></div>
          ${row(isZh ? "条件" : "Condition", isZh ? "需要已验证结构" : "Verified structure required")}
          ${row(isZh ? "确认" : "Confirmation", isZh ? "等待确认" : "Awaiting confirmation")}
          ${row(isZh ? "目标区域" : "Target Area", unavailable)}
          ${row(isZh ? "失效" : "Invalidation", unavailable)}
          ${row(isZh ? "概率" : "Probability", isZh ? "数据不足" : "Insufficient Data", "negative")}
        </article>
        <article class="analysis-module macro-news-module">
          <div class="analysis-module-title"><h2>${isZh ? "宏观与新闻背景" : "Macro & News Context"}</h2></div>
          <h3>${isZh ? "宏观" : "Macro"}</h3>${unavailableList(1, isZh ? "已验证宏观来源未连接" : "Verified macro source not connected")}
          <h3>${isZh ? "新闻" : "News"}</h3>${unavailableList(1, isZh ? "实时新闻来源未连接" : "Live news source not connected")}
          ${row(isZh ? "事件风险" : "Event Risk", isZh ? "数据不足" : "Insufficient Data")}
        </article>
        <article class="analysis-module risk-module">
          <div class="analysis-module-title"><h2>${isZh ? "风险背景" : "Risk Context"}</h2></div>
          ${row(isZh ? "波动风险" : "Volatility Risk", isZh ? "数据不足" : "Insufficient Data")}
          ${row(isZh ? "新闻风险" : "News Risk", isZh ? "数据不足" : "Insufficient Data")}
          ${row(isZh ? "结构风险" : "Structure Risk", isZh ? "数据不足" : "Insufficient Data")}
          ${row(isZh ? "流动性风险" : "Liquidity Risk", isZh ? "数据不足" : "Insufficient Data")}
          ${row(isZh ? "整体风险" : "Overall Risk", isZh ? "数据不足" : "Insufficient Data")}
          <p class="analysis-warning">${isZh ? "在数据验证前保护资本，并避免根据不完整背景做决定。" : "Protect capital and avoid decisions based on incomplete context until data is verified."}</p>
        </article>
        <article class="analysis-module conclusion-module">
          <div class="analysis-module-title"><h2>${isZh ? "JARVIS 结论" : "JARVIS Conclusion"}</h2></div>
          <p class="analysis-conclusion">${isZh ? "等待数据 • 需要结构背景 • 初步" : "Awaiting Data • Structure Context Required • Preliminary"}</p>
          ${row(isZh ? "主要因素" : "Main Factor", isZh ? "市场数据未验证" : "Market data is not verified")}
          ${row(isZh ? "主要风险" : "Main Risk", isZh ? "背景不完整" : "Incomplete context")}
          ${row(isZh ? "决定状态" : "Decision Status", isZh ? "需要数据" : "Data Required")}
        </article>
        <article class="analysis-module confirmation-module">
          <div class="analysis-module-title"><h2>${isZh ? "下一项确认" : "Next Confirmation"}</h2></div>
          <p>${hasChart ? isZh ? "需要验证图表结构" : "Verified chart structure required" : isZh ? "需要已验证数据" : "Verified data required"}</p>
        </article>
        <article class="analysis-module ask-context-module">
          <div class="analysis-module-title"><h2>${isZh ? "询问 JARVIS" : "Ask JARVIS"}</h2></div>
          <p>${isZh ? "带着当前资产、周期和风险背景继续讨论。" : "Continue with the active asset, timeframe, and risk context."}</p>
          <button id="askJarvisAboutAnalysis" type="button">${isZh ? "询问 JARVIS 此分析" : "Ask JARVIS about this analysis"}${lineIcon("send")}</button>
        </article>
      </section>
    </section>
  `;
	}
	function opportunityScannerPageContent() {
		const filter = state.approvedUi.opportunityFilter;
		const rows = getVisiblePotentialTrades().filter((trade) => filter === "All" || trade.assetClass === filter || filter === "Commodities" && trade.assetClass === "Gold").slice(0, 8);
		return `
    <section class="approved-workspace">
      <div class="approved-page-head"><div><h1>Opportunity Scanner</h1><p>AI selected high-probability setups</p></div></div>
      <div class="approved-tabs">${[
			"All",
			"Forex",
			"Crypto",
			"Stocks",
			"Commodities"
		].map((item) => `<button class="${item === filter ? "active" : ""}" type="button" data-opportunity-filter="${item}">${item}</button>`).join("")}</div>
      <article class="table-card">
        <div class="opportunity-table">
          <div class="table-head"><span>Asset</span><span>Opportunity</span><span>Timeframe</span><span>Confidence</span><span>Current State</span></div>
          ${rows.map((trade) => `
              <button class="opportunity-row" type="button" data-open-trade="${trade.id}">
                <strong>${trade.asset}</strong>
                <span>${normalizeOpportunityName(trade.direction)}</span>
                <span>H1</span>
                <span>${trade.confidence}</span>
                ${statusBadge(normalizeOpportunityStatus(trade.status))}
              </button>
            `).join("")}
        </div>
      </article>
      ${potentialTradeDetailPanel()}
    </section>
  `;
	}
	function macroIntelligencePageContent() {
		const activeTab = state.approvedUi.macroTab;
		return `
    <section class="approved-workspace">
      <div class="approved-page-head"><div><h1>Macro Intelligence</h1><p>AI powered macro analysis</p></div></div>
      <div class="approved-tabs">${[
			"Top News",
			"AI Summary",
			"Global Events",
			"Central Banks"
		].map((item) => `<button class="${item === activeTab ? "active" : ""}" type="button" data-macro-tab="${item}">${item}</button>`).join("")}</div>
      <section class="macro-layout">
        <article class="table-card">
          <h3>Important News Feed</h3>
          ${alphaMacroEvents.map((event) => newsRow(event)).join("")}
        </article>
        <aside class="macro-summary-panel">
          <h3>AI Macro Summary</h3>
          <p>Markets are waiting for fresh USD catalyst. Gold remains sensitive to DXY and inflation expectations, while crypto requires confirmation before risk-on positioning.</p>
          ${[
			"Gold: Bullish",
			"DXY: Neutral",
			"Crypto: Neutral",
			"Stocks: Watch volatility"
		].map((item) => `<div class="metric-line"><span>${item.split(":")[0]}</span><b>${item.split(":")[1]}</b></div>`).join("")}
        </aside>
      </section>
    </section>
  `;
	}
	function economicCalendarPageContent() {
		const filter = state.approvedUi.calendarFilter;
		const events = filter.endsWith("Impact") ? calendarEvents.filter((event) => `${event.impact} Impact` === filter) : calendarEvents;
		return `
    <section class="approved-workspace">
      <div class="approved-page-head"><div><h1>Economic Calendar</h1><p>MYT aligned market-moving events</p></div></div>
      <div class="approved-tabs">${[
			"Today",
			"Tomorrow",
			"This Week",
			"All",
			"High Impact",
			"Medium Impact",
			"Low Impact"
		].map((item) => `<button class="${item === filter ? "active" : ""}" type="button" data-calendar-filter="${item}">${item}</button>`).join("")}</div>
      <article class="table-card">
        <div class="calendar-table">
          <div class="table-head"><span>Time</span><span>Event</span><span>Impact</span><span>Actual</span><span>Forecast</span><span>Previous</span></div>
          ${events.map((event) => `<div class="calendar-row"><span>${event.time}</span><strong>${event.event}</strong>${statusBadge(event.impact)}<span>${event.actual}</span><span>${event.forecast}</span><span>${event.previous}</span></div>`).join("")}
        </div>
        <p class="disclaimer-text">Event data is placeholder until a verified provider is connected.</p>
      </article>
    </section>
  `;
	}
	function tradePlannerPageContent(brain) {
		return `
    <section class="approved-workspace">
      <div class="approved-page-head"><div><h1>Trade Planner</h1><p>Plan before execution</p></div></div>
      <section class="planner-layout">
        <article class="planner-form card">
          <h3>Plan Inputs</h3>
          ${[
			"Account Balance",
			"Risk Percentage",
			"Entry Price",
			"Stop Loss",
			"Take Profit 1",
			"Take Profit 2",
			"Take Profit 3"
		].map((label) => `<label>${label}<input value="${plannerDefault(label)}" /></label>`).join("")}
          <button class="primary-button" type="button">Calculate</button>
        </article>
        <aside class="planner-result card">
          <h3>Results</h3>
          <div class="metric-line"><span>Lot / Position Size</span><b>Contract specs required</b></div>
          <div class="metric-line"><span>Risk Amount</span><b>100.00 USD</b></div>
          <div class="metric-line"><span>Potential Profit</span><b>214.50 USD</b></div>
          <div class="metric-line"><span>RR</span><b>1 : 2.14</b></div>
          <div class="metric-line"><span>Plan Quality</span><b>Waiting confirmation</b></div>
          <p>JARVIS View: The plan is usable only if entry is near the planned zone and invalidation remains clear.</p>
        </aside>
      </section>
    </section>
  `;
	}
	function riskCenterPageContent(brain) {
		const health = brain.tradingHealth;
		return `
    <section class="approved-workspace">
      <div class="approved-page-head"><div><h1>Risk Center</h1><p>Control risk. Protect capital.</p></div></div>
      <section class="risk-metrics">
        ${riskMetric("Daily Risk", "0.45%", "Controlled")}
        ${riskMetric("Maximum Drawdown", "2.31%", "Safe")}
        ${riskMetric("Winning Rate", "64%", "Good")}
        ${riskMetric("Risk Score", health.score, "Good")}
      </section>
      <section class="risk-layout">
        <article class="card risk-chart"><h3>Risk Overview</h3>${miniLineChart("large")}</article>
        <aside class="card risk-reminder"><h3>AI Risk Reminder</h3><p>You're doing well. Discipline first. Do not add risk after one strong move.</p><div class="metric-line"><span>Exposure State</span><b>Controlled</b></div><div class="metric-line"><span>Daily Loss Warning</span><b>Inactive</b></div></aside>
      </section>
    </section>
  `;
	}
	function settingsPageContent() {
		const activeTab = state.approvedUi.settingsTab;
		const isZh = state.jarvis.language === "zh";
		return `
    <section class="approved-workspace">
      <div class="approved-page-head"><div><h1>Settings</h1><p>Manage your preferences</p></div></div>
      <div class="approved-tabs">${[
			"Profile",
			"Account",
			"Preferences",
			"Notifications",
			"API"
		].map((item) => `<button class="${item === activeTab ? "active" : ""}" type="button" data-settings-tab="${item}">${item}</button>`).join("")}</div>
      <section class="settings-grid">
        ${settingsCard("Profile", [
			["Name", mockUser.name],
			["Email", `${mockUser.name.toLowerCase()}@apex.local`],
			["Account", "Premium Member"]
		])}
        ${settingsCard("General", [
			["Language", `<div class="settings-language-control" role="group" aria-label="Language"><button type="button" data-settings-language="en" class="${isZh ? "" : "active"}">English</button><button type="button" data-settings-language="zh" class="${isZh ? "active" : ""}">中文</button></div>`],
			["Timezone", "Asia/Kuala_Lumpur"],
			["Default Asset", "XAUUSD"],
			["Default Timeframe", "H1"]
		])}
        ${settingsCard("System", [
			["Theme", "Approved Light"],
			["AI Model Status", "Demo connected"],
			["Auto-update", "On"],
			["Notifications", "Enabled"]
		])}
        ${settingsCard("API", [
			["Status", "Not connected"],
			["Secrets", "Hidden"],
			["MT5 Bridge", "Future sprint"]
		])}
      </section>
    </section>
  `;
	}
	function bindApprovedUiActions(page) {
		[
			[
				"[data-market-filter]",
				"marketFilter",
				"marketFilter"
			],
			[
				"[data-opportunity-filter]",
				"opportunityFilter",
				"opportunityFilter"
			],
			[
				"[data-analysis-mode]",
				"analysisMode",
				"analysisMode"
			],
			[
				"[data-macro-tab]",
				"macroTab",
				"macroTab"
			],
			[
				"[data-calendar-filter]",
				"calendarFilter",
				"calendarFilter"
			],
			[
				"[data-settings-tab]",
				"settingsTab",
				"settingsTab"
			]
		].forEach(([selector, stateKey, dataKey]) => {
			page.querySelectorAll(selector).forEach((button) => {
				button.addEventListener("click", () => {
					state.approvedUi[stateKey] = button.dataset[dataKey];
					render();
				});
			});
		});
		page.querySelectorAll("[data-settings-language]").forEach((button) => {
			button.addEventListener("click", () => {
				const language = button.dataset.settingsLanguage === "zh" ? "zh" : "en";
				state.jarvis.language = language;
				state.jarvis.conversationState.language = language;
				localStorage.setItem("jarvis-ui-language", language);
				renderFromTop();
			});
		});
		const analysisAssetSelect = page.querySelector("#analysisAssetSelect");
		const analysisTimeframeSelect = page.querySelector("#analysisTimeframeSelect");
		analysisAssetSelect?.addEventListener("change", () => {
			state.approvedUi.analysisAsset = analysisAssetSelect.value;
			runAiAnalysisRefresh();
		});
		analysisTimeframeSelect?.addEventListener("change", () => {
			state.approvedUi.analysisTimeframe = analysisTimeframeSelect.value;
			runAiAnalysisRefresh();
		});
		page.querySelector("#refreshAiAnalysis")?.addEventListener("click", runAiAnalysisRefresh);
		page.querySelector("#retryAiAnalysis")?.addEventListener("click", runAiAnalysisRefresh);
		page.querySelector("#askJarvisAboutAnalysis")?.addEventListener("click", async () => {
			const asset = state.approvedUi.analysisAsset;
			const timeframe = state.approvedUi.analysisTimeframe;
			const isZh = state.jarvis.language === "zh";
			state.jarvis.topic = asset;
			state.jarvis.conversationState.currentAsset = asset;
			state.jarvis.conversationState.timeframe = timeframe;
			state.jarvis.conversationState.currentTradeStatus = "Preliminary / Data Required";
			state.jarvis.conversationState.missingInformation = ["Verified market data", "Verified macro source", "Live news source"];
			state.jarvis.question = isZh ? `解释 ${asset} ${timeframe} 的初步分析，以及目前需要什么确认。` : `Explain the ${asset} ${timeframe} preliminary analysis and the confirmation currently required.`;
			state.activePage = "JARVIS";
			await renderFromTop();
			const contextualInput = document.querySelector(".ask-page #jarvisQuestion");
			if (contextualInput) contextualInput.value = state.jarvis.question;
		});
	}
	async function runAiAnalysisRefresh() {
		if (state.approvedUi.analysisStatus === "loading") return;
		state.approvedUi.analysisStatus = "loading";
		state.approvedUi.analysisError = false;
		await render();
		try {
			await new Promise((resolve) => setTimeout(resolve, 700));
			state.approvedUi.analysisLastUpdated = new Date().toISOString();
		} catch (error) {
			console.error("AI Analysis refresh failed", error);
			state.approvedUi.analysisError = true;
		} finally {
			state.approvedUi.analysisStatus = "idle";
			await render();
		}
	}
	function adminPage() {
		const brain = state.adminBrainData || {};
		const overview = brain.overview || {
			totalUsers: adminUsers.length,
			activeUsers: adminUsers.filter((user) => Number(user.health) >= 70).length
		};
		const system = brain.system || {
			engineHealthAverage: 0,
			mt5Connection: "Mock offline"
		};
		const page = el("section", "page-stack admin-approved");
		page.innerHTML = `
    <section class="approved-workspace">
      <div class="approved-page-head"><div><h1>Admin Dashboard</h1><p>Master command center</p></div></div>
      <section class="admin-kpi-row">
        ${kpi("Total Users", overview.totalUsers, "All registered accounts")}
        ${kpi("Active Users", overview.activeUsers, "Last 24 hours")}
        ${kpi("Revenue", "$2.4k", "Demo subscription data")}
        ${kpi("Subscription", "82%", "Active plan coverage")}
      </section>
      <section class="admin-layout">
        <article class="admin-table-card">
          <h3>Users Overview</h3>
          <div class="admin-table">${adminUsers.map((user) => userRow(user)).join("")}</div>
        </article>
        <aside class="admin-side-stack">
          ${card("AI Engine Status", `<strong>${system.engineHealthAverage}%</strong><p>All core intelligence modules are available in mock mode.</p>`)}
          ${card("Market Data Status", `<strong>${system.mt5Connection}</strong><p>Live read-only bridge remains future sprint.</p>`)}
          ${card("News Engine", `<strong>Placeholder</strong><p>Macro provider not connected. No fabricated event data.</p>`)}
          ${card("System Health", `<strong>Stable</strong><p>Workspace, admin, and JARVIS interaction layers online.</p>`)}
        </aside>
      </section>
      <section class="command-grid activity-grid">
        ${card("Recent Activity", activity.map((item) => `<div class="activity-item">${item}</div>`).join(""), "card-wide")}
      </section>
    </section>
  `;
		bindMasterChatActions(page);
		return page;
	}
	function approvedCommandBar(placeholder, mode) {
		return `
    <article class="jarvis-mentor approved-command-bar">
      <form class="jarvis-question-form" data-mode="${mode}">
        <span class="${mode === "home" ? "jarvis-voice-orb" : ""}">${mode === "home" ? `<span class="desktop-wave-icon">${lineIcon("wave")}</span><span class="mobile-spark-icon">${lineIcon("spark")}</span>` : lineIcon("spark")}</span>
        <textarea id="jarvisQuestion" rows="1" placeholder="${placeholder}">${state.jarvis.question}</textarea>
        <div class="jarvis-actions">
          <button class="ghost-button" type="button" disabled>${lineIcon("mic")}</button>
          <button type="submit">${lineIcon("send")}</button>
        </div>
      </form>
    </article>
  `;
	}
	function renderApprovedChatMessage(item) {
		if (item.role === "user") return `<div class="approved-user-question"><p>${escapeHtml(item.text)}</p><span>${mockUser.name.slice(0, 1).toUpperCase()}</span></div>`;
		if (item.thinking) return renderThinkingComponent(item);
		const mentorIntro = item.responseModel ? mentorText("I've reviewed the context. Here's the structured market view.", "我已经检查了当前背景。以下是结构化市场观点。") : item.text;
		return `
    <div class="approved-ai-response ${item.attention ? "attention" : ""}">
      <div class="response-head">${lineIcon("spark")}<strong>JARVIS</strong></div>
      <p class="mentor-answer">${escapeHtml(mentorIntro)}</p>
      ${item.responseModel ? renderAskJarvisResponse(item.responseModel) : ""}
      ${Array.isArray(item.suggestions) && item.suggestions.length ? `<div class="quick-prompts">${item.suggestions.slice(0, 4).map((suggestion) => `<button type="button" data-quick-prompt="${escapeHtml(suggestion)}">${escapeHtml(suggestion)}</button>`).join("")}</div>` : ""}
    </div>
  `;
	}
	function renderThinkingComponent(item) {
		const steps = item.thinkingSteps || getThinkingSteps();
		const activeIndex = Number(item.thinkingIndex || 0);
		return `
    <div class="approved-ai-response jarvis-thinking-response" aria-live="polite">
      <div class="response-head">${lineIcon("spark")}<strong>JARVIS</strong><span>${escapeHtml(item.text)}</span></div>
      <div class="thinking-sequence">
        ${steps.map((step, index) => `<div class="thinking-step ${index < activeIndex ? "complete" : index === activeIndex ? "active" : "pending"}"><i></i><span>${escapeHtml(step)}</span></div>`).join("")}
      </div>
    </div>
  `;
	}
	function renderAskJarvisResponse(model) {
		const safe = (value) => escapeHtml(String(value ?? "Unavailable"));
		const list = (items) => (items || []).map((item) => `<li>${safe(item)}</li>`).join("");
		const isZh = model.language === "zh";
		const labels = isZh ? {
			brief: "交易简报", updated: "更新", bias: "市场方向", confidence: "信心", trend: "趋势", structure: "市场结构", plan: "交易计划", entry: "进场区域", stop: "止损", tp1: "止盈 1", tp2: "止盈 2", tp3: "止盈 3", rr: "风险回报", macro: "宏观摘要", news: "新闻摘要", reasoning: "AI 分析摘要", view: "JARVIS 观点", next: "下一步"
		} : {
			brief: "Trading Brief", updated: "Updated", bias: "Market Bias", confidence: "Confidence", trend: "Trend", structure: "Market Structure", plan: "Trade Plan", entry: "Entry Zone", stop: "Stop Loss", tp1: "Take Profit 1", tp2: "Take Profit 2", tp3: "Take Profit 3", rr: "Risk Reward", macro: "Macro Summary", news: "News Summary", reasoning: "AI Reasoning", view: "JARVIS View", next: "Next Step"
		};
		const displayBias = isZh ? { Bullish: "偏多", Bearish: "偏空", Neutral: "中性" }[model.bias] || model.bias : model.bias;
		const displayTrend = isZh ? { "Strong Bullish Trend": "强势上升趋势", "Bullish Trend": "上升趋势", "Range Market": "区间市场", "Bearish Trend": "下降趋势", "Strong Bearish Trend": "强势下降趋势" }[model.trend] || model.trend : model.trend;
		return `
    <section class="jarvis-market-brief">
      <header class="brief-header"><div><span>${labels.brief}</span><strong>${safe(model.instrument)}</strong></div><small>${labels.updated} ${safe(model.freshness)}</small></header>
      <div class="brief-overview-grid">
        <div><span>${labels.bias}</span><strong class="bias-${safe(model.bias).toLowerCase()}">${safe(displayBias)}</strong></div>
        <div><span>${labels.confidence}</span><strong>${safe(model.confidence)}%</strong><small>${safe(model.confidenceLabel)}</small></div>
        <div><span>${labels.trend}</span><strong>${safe(displayTrend)}</strong></div>
      </div>
      <section class="brief-block"><h4>${labels.structure}</h4><ul class="structure-list">${list(model.structure)}</ul></section>
      <section class="brief-block trade-plan-block"><h4>${labels.plan}</h4><div class="trade-plan-grid">
        <div><span>${labels.entry}</span><strong>${safe(model.tradePlan?.entry)}</strong></div>
        <div><span>${labels.stop}</span><strong>${safe(model.tradePlan?.stopLoss)}</strong></div>
        <div><span>${labels.tp1}</span><strong>${safe(model.tradePlan?.takeProfit1)}</strong></div>
        <div><span>${labels.tp2}</span><strong>${safe(model.tradePlan?.takeProfit2)}</strong></div>
        <div><span>${labels.tp3}</span><strong>${safe(model.tradePlan?.takeProfit3)}</strong></div>
        <div><span>${labels.rr}</span><strong>${safe(model.tradePlan?.riskReward)}</strong></div>
      </div></section>
      <div class="brief-two-column">
        <section class="brief-block"><h4>${labels.macro}</h4><ul>${list(model.macro)}</ul></section>
        <section class="brief-block"><h4>${labels.news}</h4><ul>${list(model.news)}</ul></section>
      </div>
      <section class="brief-block reasoning-block"><h4>${labels.reasoning}</h4><ul>${list(model.reasoning)}</ul></section>
      <div class="brief-decision-grid">
        <section><span>${labels.view}</span><strong>${safe(model.jarvisView)}</strong></section>
        <section><span>${labels.next}</span><strong>${safe(model.nextStep)}</strong></section>
      </div>
      <p class="brief-disclaimer">${safe(model.disclaimer)}</p>
    </section>
  `;
	}
	function renderStarterJarvisBlock(brain) {
		return `
    <div class="approved-ai-response ask-empty-state">
      <div class="response-head">${lineIcon("spark")}<strong>JARVIS</strong></div>
      <p>Ask naturally about Gold, BTC, market structure, macro events, news, risk, or a previous trade.</p>
    </div>
  `;
	}
	function structuredAiSummary(brain = state.brainData) {
		const briefing = brain?.dailyBriefing || getMockMarketSnapshot("XAUUSD");
		return `
    <div class="structured-summary">
      <h4>AI Summary</h4>
      <div><span>Structure</span><b>${briefing.marketStructure || "Bullish continuation"}</b></div>
      <div><span>Trend Strength</span><b>Moderate</b></div>
      <div><span>Key Level</span><b>${briefing.keyZones?.[0] || "Demand zone"}</b></div>
      <div><span>Invalidation</span><b>Below 2,352</b></div>
      <div><span>Potential Target</span><b>2,410</b></div>
      <div><span>Confidence</span><b>Medium</b></div>
      <div><span>Freshness</span><b>${briefing.lastUpdated || "Demo"}</b></div>
    </div>
  `;
	}
	function marketTable(rows) {
		return `
    <article class="table-card">
      <div class="market-table">
        <div class="table-head"><span>Asset</span><span>Last Price</span><span>Change</span><span>Trend</span><span>Bias</span></div>
        ${rows.map((row) => `<div class="market-row"><div><strong>${row.asset}</strong><small>${row.name}</small></div><span>${row.price}</span><span class="${row.change.startsWith("+") ? "positive" : "negative"}">${row.change}</span>${miniSparkline(row.change.startsWith("+"))}<b>${row.bias}</b></div>`).join("")}
      </div>
    </article>
  `;
	}
	function analysisSidePanel(analysis, brain) {
		const snapshot = brain.dailyBriefing;
		return `
    <article class="analysis-panel-card">
      <h3>AI Structure</h3>
      <div class="metric-line"><span>Trend</span><b>${analysis?.bias || snapshot.marketBias}</b></div>
      <div class="metric-line"><span>Key Zone</span><b>${analysis?.keyZones?.[0] || snapshot.keyZones[0]}</b></div>
      <div class="metric-line"><span>Invalidation</span><b>${analysis?.tradePlan?.stopLossReference || "Below demand zone"}</b></div>
      <div class="metric-line"><span>Targets</span><b>${analysis?.tradePlan?.takeProfitZones?.join(" / ") || "2,388 / 2,410"}</b></div>
      <div class="metric-line"><span>Risk</span><b>${analysis?.risk || snapshot.risk}</b></div>
      <p>${analysis?.recommendation || snapshot.recommendation}</p>
    </article>
  `;
	}
	function mockChartCanvas() {
		return `
    <div class="mock-chart">
      <div class="supply-zone">Supply Zone</div>
      <div class="demand-zone">Demand Zone</div>
      <svg viewBox="0 0 640 300" preserveAspectRatio="none">
        <polyline points="0,210 80,185 130,205 190,145 250,160 310,98 370,118 430,75 500,95 575,48 640,60" />
      </svg>
      <span class="entry-ref">Entry</span>
      <span class="sl-ref">SL</span>
      <span class="tp-ref">TP</span>
    </div>
  `;
	}
	function statusBadge(value) {
		return `<span class="status-badge ${String(value).toLowerCase().includes("high") || String(value).toLowerCase().includes("invalid") ? "danger" : String(value).toLowerCase().includes("wait") || String(value).toLowerCase().includes("medium") ? "warning" : "success"}">${value}</span>`;
	}
	function riskMetric(label, value, status) {
		return `<article class="risk-metric"><span>${label}</span><strong>${value}</strong><small>${status}</small></article>`;
	}
	function settingsCard(title, rows) {
		return `<article class="card settings-card"><h3>${title}</h3>${rows.map(([label, value]) => `<div class="metric-line"><span>${label}</span><b>${value}</b></div>`).join("")}</article>`;
	}
	function newsRow(event) {
		return `<div class="news-row"><span>${event.time}</span><div><strong>${event.event}</strong><small>Affected asset: USD / Gold / Indices</small></div>${statusBadge(event.risk)}</div>`;
	}
	function plannerDefault(label) {
		return {
			"Account Balance": "10000",
			"Risk Percentage": "1",
			"Entry Price": "2362.45",
			"Stop Loss": "2352.00",
			"Take Profit 1": "2375.00",
			"Take Profit 2": "2388.00",
			"Take Profit 3": "2410.00"
		}[label] || "";
	}
	function normalizeOpportunityName(direction) {
		if (String(direction).includes("Short")) return "Bearish Retracement";
		if (String(direction).includes("Long")) return "Bullish Pullback";
		if (String(direction).includes("Monitor")) return "Range Breakout";
		return "Momentum Breakout";
	}
	function normalizeOpportunityStatus(status) {
		if (status === "Ready") return "Ready for Review";
		if (status === "Detected") return "Monitoring";
		if (status === "Triggered") return "Ready for Review";
		if (status === "Completed") return "Ready for Review";
		return status;
	}
	function miniSparkline(up = true) {
		return `<svg class="mini-sparkline" viewBox="0 0 86 28"><polyline points="${up ? "0,24 18,20 34,22 52,14 68,16 86,8" : "0,10 18,12 34,9 52,17 68,15 86,23"}" /></svg>`;
	}
	function miniLineChart(size = "") {
		return `<svg class="risk-line-chart ${size}" viewBox="0 0 420 180"><polyline points="0,130 45,118 90,132 135,96 180,108 225,78 270,88 315,58 360,72 420,48" /></svg>`;
	}
	function lineIcon(type) {
		const icons = {
			home: "M4 11L12 4l8 7v8H4z",
			message: "M5 6h14v10H8l-3 3z",
			radar: "M12 20a8 8 0 1 0-8-8 M12 12l6-6 M12 12h8",
			analysis: "M4 17l5-5 4 3 7-8 M4 20h16",
			scanner: "M5 5h5 M14 5h5 M5 19h5 M14 19h5 M5 10v4 M19 10v4",
			macro: "M4 16c4-8 12-8 16 0 M6 12c3-5 9-5 12 0",
			calendar: "M5 5h14v14H5z M8 3v4 M16 3v4 M5 10h14",
			planner: "M6 4h12v16H6z M9 8h6 M9 12h6 M9 16h4",
			risk: "M12 4l8 4v5c0 5-3 8-8 9-5-1-8-4-8-9V8z",
			settings: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M4 12h3 M17 12h3 M12 4v3 M12 17v3",
			search: "M10 17a7 7 0 1 1 5-2l5 5",
			bell: "M6 17h12l-2-3V9a4 4 0 0 0-8 0v5z M10 20h4",
			spark: "M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z",
			send: "M4 12l16-7-7 16-2-7z",
			upload: "M12 16V5 M8 9l4-4 4 4 M5 19h14",
			mic: "M12 4a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V7a3 3 0 0 1 3-3z M5 12a7 7 0 0 0 14 0 M12 19v3",
			wave: "M5 10v4 M8 7v10 M11 4v16 M14 8v8 M17 6v12 M20 10v4",
			menu: "M4 7h16 M4 12h16 M4 17h16",
			close: "M6 6l12 12 M18 6L6 18"
			,refresh: "M20 7v5h-5 M4 17v-5h5 M6 9a7 7 0 0 1 12-2l2 5 M18 15a7 7 0 0 1-12 2l-2-5"
		};
		return `<svg class="line-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[type] || icons.spark}" /></svg>`;
	}
	setInterval(() => {
		if (!state.isLoggedIn) return;
		state.jarvis.promptIndex = (state.jarvis.promptIndex + 1) % jarvisPromptExamples.length;
		const input = document.getElementById("jarvisQuestion");
		if (input && !input.value) input.placeholder = jarvisPromptExamples[state.jarvis.promptIndex];
	}, 2600);
	render();
	//#endregion
})();
