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
	const marketApiBaseUrl = "/api/market";
	async function requestMarketData(path) {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 9000);
		try {
			const response = await fetch(`${marketApiBaseUrl}${path}`, {
				headers: { Accept: "application/json" },
				signal: controller.signal
			});
			const contentType = response.headers.get("content-type") || "";
			if (!contentType.includes("application/json")) throw new Error("Market API response is not JSON");
			const payload = await response.json();
			if (!response.ok || !payload?.success) {
				const error = new Error(payload?.error?.message || "Market data unavailable");
				error.code = payload?.error?.code || "MARKET_DATA_UNAVAILABLE";
				throw error;
			}
			return payload;
		} finally {
			clearTimeout(timeoutId);
		}
	}
	const marketDataClient = {
		status: () => requestMarketData("/status"),
		symbols: () => requestMarketData("/symbols"),
		quote: (symbol) => requestMarketData(`/quote?symbol=${encodeURIComponent(symbol)}`),
		candles: (symbol, timeframe, limit = 300) => requestMarketData(`/candles?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}&limit=${encodeURIComponent(limit)}`)
	};
	const scannerApiBaseUrl = "/api/scanner";
	async function requestScannerData(path, options = {}) {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 45000);
		try {
			const response = await fetch(`${scannerApiBaseUrl}${path}`, {
				...options,
				headers: { Accept: "application/json", "Content-Type": "application/json", ...(options.headers || {}) },
				signal: controller.signal
			});
			const payload = await response.json();
			if (!response.ok || !payload?.success) {
				const error = new Error(payload?.error?.message || "Opportunity scan unavailable");
				error.code = payload?.error?.code || "SCANNER_UNAVAILABLE";
				throw error;
			}
			return payload;
		} finally {
			clearTimeout(timeoutId);
		}
	}
	const scannerDataClient = {
		run: (criteria) => requestScannerData("/run", { method: "POST", body: JSON.stringify(criteria) }),
		latest: () => requestScannerData("/latest")
	};
	const macroApiBaseUrl = "/api/macro";
	async function requestMacroData(path) {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 9000);
		try {
			const response = await fetch(`${macroApiBaseUrl}${path}`, { headers: { Accept: "application/json" }, signal: controller.signal });
			const payload = await response.json();
			if (!response.ok || !payload?.success) {
				const error = new Error(payload?.error?.message || "Macro data unavailable");
				error.code = payload?.error?.code || "MACRO_DATA_UNAVAILABLE";
				throw error;
			}
			return payload;
		} finally {
			clearTimeout(timeoutId);
		}
	}
	const macroDataClient = {
		status: () => requestMacroData("/status"),
		events: () => requestMacroData("/events"),
		summary: () => requestMacroData("/summary")
	};
	const newsApiBaseUrl = "/api/news";
	async function requestNewsData(path) {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 9000);
		try {
			const response = await fetch(`${newsApiBaseUrl}${path}`, { headers: { Accept: "application/json" }, signal: controller.signal });
			const payload = await response.json();
			if (!response.ok || !payload?.success) { const error = new Error(payload?.error?.message || "News data unavailable"); error.code = payload?.error?.code || "NEWS_DATA_UNAVAILABLE"; throw error; }
			return payload;
		} finally { clearTimeout(timeoutId); }
	}
	const newsDataClient = {
		status: () => requestNewsData("/status"), articles: () => requestNewsData("/articles"), topStories: () => requestNewsData("/top-stories"), breaking: () => requestNewsData("/breaking"), summary: () => requestNewsData("/summary")
	};
	const jarvisApiBaseUrl = "/api/jarvis";
	async function requestJarvisCore(path, options = {}) {
		const controller = new AbortController(); const timeoutId = setTimeout(() => controller.abort(), 12000);
		try {
			const response = await fetch(`${jarvisApiBaseUrl}${path}`, { ...options, headers: { Accept: "application/json", "Content-Type": "application/json", ...(options.headers || {}) }, signal: controller.signal });
			const payload = await response.json(); if (!response.ok || !payload?.success) { const error = new Error(payload?.error?.message || "JARVIS unavailable"); error.code = payload?.error?.code || "AI_PROVIDER_UNAVAILABLE"; throw error; } return payload;
		} finally { clearTimeout(timeoutId); }
	}
	const jarvisCoreClient = { message: (request) => requestJarvisCore("/message", { method: "POST", body: JSON.stringify(request) }), status: () => requestJarvisCore("/status") };
	async function getLiveMarketQuote(input = "") {
		const instrument = resolveInstrument(input);
		try {
			const payload = await marketDataClient.quote(instrument.symbol);
			const quote = payload.data;
			if (quote?.last == null && quote?.bid == null && quote?.ask == null) throw new Error("Quote payload missing price");
			return {
				...quote,
				price: quote.last ?? quote.bid ?? quote.ask,
				updatedAt: quote.timestamp,
				symbol: instrument.symbol,
				label: instrument.label,
				type: instrument.type,
				source: quote.dataStatus === "verified" ? "live" : quote.dataStatus,
				freshness: quote.freshness,
				provider: quote.provider
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
	const sprint6MacroEvents = [
		{
			id: "demo-us-inflation-released",
			dateRange: "Today",
			time: "Timing unavailable",
			currency: "USD",
			region: "United States",
			impact: "High",
			category: "Inflation",
			name: "Sample Core Inflation Release",
			previous: "3.3% (Demo)",
			forecast: "3.2% (Demo)",
			actual: "3.1% (Demo)",
			revision: "Unavailable",
			status: "Released",
			quality: "Demo",
			explanation: "A sample inflation event used only to demonstrate the Macro Intelligence workflow.",
			whyMonitored: "Inflation can influence rate expectations, USD sensitivity and volatility across gold and risk assets.",
			surprise: "Weaker Than Expected",
			interpretation: "In this demo scenario, inflation is below the sample forecast. A real conclusion still requires verified data, positioning and market reaction.",
			assets: ["XAUUSD", "DXY", "EURUSD", "BTCUSD"]
		},
		{
			id: "demo-us-employment-upcoming",
			dateRange: "Today",
			time: "Timing unavailable",
			currency: "USD",
			region: "United States",
			impact: "High",
			category: "Employment",
			name: "Sample Employment Report",
			previous: "Unavailable",
			forecast: "Unavailable",
			actual: "Awaiting Release",
			revision: "Unavailable",
			status: "Upcoming",
			quality: "Demo",
			explanation: "A sample upcoming labour-market event. No real release time or values are shown.",
			whyMonitored: "Employment data can change growth and policy expectations, but the reaction depends on the complete release and current positioning.",
			surprise: "Data Unavailable",
			interpretation: "Await the verified release. No actual-versus-forecast interpretation is available.",
			assets: ["DXY", "XAUUSD", "USDJPY", "US100"]
		},
		{
			id: "demo-eu-growth-upcoming",
			dateRange: "Tomorrow",
			time: "Timing unavailable",
			currency: "EUR",
			region: "Euro Area",
			impact: "Medium",
			category: "Growth",
			name: "Sample Growth Survey",
			previous: "Unavailable",
			forecast: "Unavailable",
			actual: "Awaiting Release",
			revision: "Unavailable",
			status: "Upcoming",
			quality: "Demo",
			explanation: "A sample growth event for validating filters and responsive presentation.",
			whyMonitored: "Growth surveys may affect currency expectations when the result is verified and materially different from consensus.",
			surprise: "Data Unavailable",
			interpretation: "Verified values are required before interpreting the event.",
			assets: ["EURUSD", "DXY"]
		},
		{
			id: "demo-jp-central-bank",
			dateRange: "This Week",
			time: "Timing unavailable",
			currency: "JPY",
			region: "Japan",
			impact: "High",
			category: "Central Bank",
			name: "Sample Central-Bank Decision",
			previous: "Unavailable",
			forecast: "Unavailable",
			actual: "Awaiting Release",
			revision: "Unavailable",
			status: "Upcoming",
			quality: "Demo",
			explanation: "A demonstration record only. No meeting date, statement or decision is implied.",
			whyMonitored: "Verified policy communication can affect rates and currency volatility.",
			surprise: "Not Applicable",
			interpretation: "Verified central-bank information is not connected.",
			assets: ["USDJPY", "DXY", "XAUUSD"]
		}
	];
	const sprint7NewsStories = [
		{
			id: "demo-policy-guidance",
			headline: "Demo Scenario: Central-Bank Guidance Shifts Rate Expectations",
			source: "Demo Dataset",
			published: "Published time unavailable",
			category: "Central Banks",
			impact: "High",
			verification: "Demo",
			period: "Latest",
			topRank: 1,
			breaking: false,
			summary: "A demonstration scenario showing how a change in policy guidance could alter rate expectations.",
			entities: ["Central bank", "Policy guidance"],
			assets: ["DXY", "XAUUSD", "EURUSD", "US100"],
			aiSummary: ["A policy-guidance change is being modelled.", "Rate expectations are the main transmission channel.", "No real statement or market reaction is connected."],
			why: "Policy guidance can influence yields, currency flows and risk positioning.",
			implication: "USD, gold and rate-sensitive equities may become more volatile if a verified change occurs.",
			uncertainty: "No official statement, publication time or verified market response is connected.",
			channel: "Interest-rate expectations",
			relatedIds: ["demo-growth-outlook"]
		},
		{
			id: "demo-geopolitical-risk",
			headline: "Demo Scenario: Geopolitical Risk Raises Defensive-Market Sensitivity",
			source: "Demo Dataset",
			published: "Published time unavailable",
			category: "Geopolitics",
			impact: "High",
			verification: "Demo",
			period: "Latest",
			topRank: 2,
			breaking: false,
			summary: "A demonstration scenario for reviewing safe-haven and energy sensitivity during geopolitical uncertainty.",
			entities: ["Geopolitical risk", "Safe-haven flows"],
			assets: ["XAUUSD", "DXY", "WTI", "US500"],
			aiSummary: ["A geopolitical-risk scenario is being modelled.", "Safe-haven and energy channels may become relevant.", "No real event, escalation or market move is claimed."],
			why: "Geopolitical uncertainty can affect defensive positioning, energy risk and liquidity.",
			implication: "Gold and oil may become more sensitive, while broader risk appetite may weaken if verified developments escalate.",
			uncertainty: "There is no connected source or verified developing event.",
			channel: "Geopolitical risk",
			relatedIds: ["demo-energy-supply"]
		},
		{
			id: "demo-crypto-regulation",
			headline: "Demo Scenario: Regulatory Update Changes Crypto Risk Perception",
			source: "Demo Dataset",
			published: "Published time unavailable",
			category: "Crypto",
			impact: "Medium",
			verification: "Demo",
			period: "Latest",
			topRank: 3,
			breaking: false,
			summary: "A sample workflow for interpreting how a regulatory development could affect crypto sentiment.",
			entities: ["Digital assets", "Regulation"],
			assets: ["BTCUSD", "ETHUSD"],
			aiSummary: ["A regulatory-change scenario is being modelled.", "Risk perception is the primary channel.", "No regulator, rule or market reaction is asserted."],
			why: "Regulatory clarity or uncertainty can influence participation and risk appetite.",
			implication: "Crypto sensitivity may rise, but direction requires verified details and price confirmation.",
			uncertainty: "The policy scope and market response are unavailable.",
			channel: "Regulation",
			relatedIds: []
		},
		{
			id: "demo-energy-supply",
			headline: "Demo Scenario: Energy Supply Concern Increases Oil Sensitivity",
			source: "Demo Dataset",
			published: "Published time unavailable",
			category: "Energy",
			impact: "Medium",
			verification: "Demo",
			period: "Latest",
			topRank: 0,
			breaking: false,
			summary: "A demonstration record for explaining the potential transmission from supply risk to energy markets.",
			entities: ["Energy supply", "Oil market"],
			assets: ["WTI", "BRENT"],
			aiSummary: ["A supply-risk scenario is being modelled.", "Energy prices are the main channel.", "No current disruption or price move is claimed."],
			why: "Supply uncertainty can affect energy-price expectations and inflation sensitivity.",
			implication: "Oil may become more sensitive if verified supply conditions change.",
			uncertainty: "No verified disruption, duration or market response is available.",
			channel: "Energy prices",
			relatedIds: ["demo-geopolitical-risk"]
		},
		{
			id: "demo-growth-outlook",
			headline: "Demo Scenario: Growth Outlook Alters Equity and Currency Caution",
			source: "Demo Dataset",
			published: "Published time unavailable",
			category: "Economy",
			impact: "Low",
			verification: "Demo",
			period: "Latest",
			topRank: 0,
			breaking: false,
			summary: "A sample economic-outlook story used to validate filtering and related-news behaviour.",
			entities: ["Growth outlook", "Risk assets"],
			assets: ["US100", "US500", "DXY"],
			aiSummary: ["A growth-outlook scenario is being modelled.", "Risk sentiment and currency flows may be relevant.", "No economic forecast is presented as real."],
			why: "Growth expectations can influence earnings assumptions, yields and currency positioning.",
			implication: "Equity and USD sensitivity may change if verified growth expectations shift.",
			uncertainty: "No verified forecast, source or market reaction is connected.",
			channel: "Risk sentiment",
			relatedIds: ["demo-policy-guidance"]
		}
	];
	const storedJarvisChat = JSON.parse(localStorage.getItem("jarvis-conversation") || "[]").filter((item) => !item.thinking);
	const storedPotentialTradeState = JSON.parse(localStorage.getItem("jarvis-potential-trades") || "{}");
	const storedPotentialTradeFeedback = JSON.parse(localStorage.getItem("jarvis-trade-feedback") || "[]");
	const storedPotentialTradeOutcomes = JSON.parse(localStorage.getItem("jarvis-trade-outcomes") || "{}");
	const storedUiLanguage = localStorage.getItem("jarvis-ui-language") === "zh" ? "zh" : "en";
	const storedScannerSavedScans = JSON.parse(localStorage.getItem("jarvis-s8-saved-scans") || "[]");
	const storedScannerSettings = JSON.parse(localStorage.getItem("jarvis-s8-settings") || "null");
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
			visionUploadId: null,
			visionDataStatus: "unavailable",
			previewUrl: "",
			fileName: localStorage.getItem("jarvis-chart-file-name") || "",
			fileSize: 0,
			fileType: "",
			width: 0,
			height: 0,
			status: "empty",
			error: "",
			asset: "Unknown",
			timeframe: "Unknown",
			focus: "",
			isAnalyzing: false,
			analysisStep: -1,
			result: null,
			expanded: false,
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
			apiConversationId: localStorage.getItem("jarvis-api-conversation-id") || null,
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
		},
		marketData: {
			status: null,
			symbols: [],
			analysis: { loading: false, loaded: false, quote: null, candles: null, errorCode: "" },
			scanner: { loading: false, loaded: false, results: {}, errorCode: "" },
			planner: { loading: false, loaded: false, quote: null, metadata: null, errorCode: "" }
		},
		macroS6: {
			events: [],
			loaded: false,
			provider: null,
			summary: null,
			dateRange: "Today",
			impact: "All",
			currency: "All",
			category: "All",
			selectedEventId: "demo-us-inflation-released",
			isRefreshing: false,
			refreshStep: 0,
			error: localStorage.getItem("jarvis-macro-source-error") === "1",
			lastSuccessfulUpdate: "No successful verified update",
			dataStatus: "Not Connected"
		},
		newsS7: {
			stories: [],
			loaded: false,
			provider: null,
			summary: null,
			category: "All",
			impact: "All Impact",
			time: "Latest",
			selectedStoryId: "demo-policy-guidance",
			isRefreshing: false,
			refreshStep: 0,
			error: localStorage.getItem("jarvis-news-source-error") === "1",
			lastSuccessfulUpdate: "No successful verified update",
			dataStatus: "Not Connected"
		},
		scannerS8: {
			category: "All Markets",
			filters: {
				asset: "All Supported Assets",
				timeframe: "All",
				bias: "All",
				band: "All",
				setupType: "All",
				risk: "All",
				minimumRR: "Any",
				macroRisk: "All",
				newsRisk: "All",
				alignment: "All"
			},
			selectedOpportunityId: "",
			isScanning: false,
			scanStep: 0,
			error: false,
			errorMessage: "",
			scanId: "",
			scanState: "ready",
			results: [],
			lastSuccessfulScan: "No completed scan",
			dataStatus: "Unavailable",
			marketsRequested: 0,
			marketsCompleted: 0,
			marketsPartial: 0,
			marketsUnavailable: 0,
			validSetups: 0,
			rejectedSetups: 0,
			marketOverview: null,
			distribution: null,
			marketDataTimestamp: "",
			savedScans: storedScannerSavedScans,
			settings: storedScannerSettings || {
				highThreshold: 75,
				mediumThreshold: 50,
				minimumRR: "Any",
				maximumRisk: "High",
				includeMacro: true,
				includeNews: true,
				includeWatchlist: false,
				freshnessTolerance: "15 minutes"
			},
			message: ""
		}
	};
	const logoSrc = "/assets/apex-logo-official.jpg";
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
    <div class="login-grid" aria-hidden="true"></div>
    <section class="login-panel stitch-login-panel">
      <div class="login-copy stitch-login-brand">
        <div class="login-brand-stage">
          <img class="apex-logo hero-logo" src="${logoSrc}" alt="APEX" />
        </div>
        <p class="eyebrow">JARVIS AI Trading Operating System</p>
      </div>
      <form class="login-form">
        <div class="login-form-head">
          <strong>Welcome</strong>
          <span>Your premium AI trading workspace for market intelligence, planning, and disciplined execution.</span>
        </div>
        <label>Email Address</label>
        <input id="emailInput" type="email" value="${mockUser.name.toLowerCase()}@apex.local" aria-label="Email Address" />
        <label>Beta Invite Code</label>
        <input id="accessInput" type="password" value="apex" aria-label="Beta Invite Code" />
        <button type="submit">Enter Terminal <span>→</span></button>
        <div class="auth-links"><a href="${mentorSetupLink}" id="setupLink">Terms of Service</a><a href="#privacy" id="forgotLink">Privacy Policy</a><a href="#status" id="mentorLink">Beta Status</a></div>
      </form>
    </section>
    <footer class="login-motto">ATTITUDE <i></i> IMPROVE <i></i> GROWTH</footer>
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
			if (await processQuestionWithJarvisCore()) return;
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
	async function processQuestionWithJarvisCore() {
		try {
			const context = {
				selectedAsset: state.jarvis.topic || state.jarvis.conversationState.currentAsset || null,
				selectedTimeframe: state.jarvis.conversationState.timeframe || null,
				selectedOpportunityId: state.jarvis.conversationState.scannerContext?.opportunityId || null,
				selectedNewsId: state.jarvis.conversationState.newsContext?.articleId || null,
				selectedMacroEventId: state.jarvis.conversationState.macroContext?.eventId || null,
				selectedTradePlanId: state.jarvis.conversationState.currentTradeId || null,
				uploadedChartId: state.chartUpload.visionUploadId || state.chartUpload.history[0]?.missionId || null,
				analysisSummary: state.jarvis.quickAnalysis ? { bias: state.jarvis.quickAnalysis.bias, risk: state.jarvis.quickAnalysis.risk } : null,
				riskContext: state.jarvis.conversationState.missingInformation || [],
				chartContext: state.chartUpload.analysis ? { asset: state.chartUpload.asset, timeframe: state.chartUpload.timeframe, status: state.chartUpload.status } : null,
				tradePlanContext: state.jarvis.conversationState.currentTradePlan || null
			};
			const payload = await jarvisCoreClient.message({ conversationId: state.jarvis.apiConversationId, message: state.jarvis.question, language: state.jarvis.language, activePage: "ask_jarvis", context });
			const response = payload.data; state.jarvis.apiConversationId = response.conversationId; localStorage.setItem("jarvis-api-conversation-id", response.conversationId);
			state.jarvis.intent = response.intent.join(" + "); state.jarvis.status = response.dataQuality === "verified" ? "quickReady" : "partial";
			const sourceLines = response.sources.map((source) => `${source.tool}: ${source.source} · ${source.dataStatus}${source.freshness && source.freshness !== "unavailable" ? ` · ${source.freshness}` : ""}`);
			const missingLines = response.missingData.map((item) => `${item} unavailable`);
			const model = {
				language: response.language, instrument: context.selectedAsset || "Context Required", freshness: response.dataQuality,
				bias: response.answer.marketBias ? macroTitleCase(response.answer.marketBias) : "Unavailable", confidence: null, confidenceLabel: response.dataQuality,
				trend: "Unavailable", structure: response.answer.mainFactors.length ? response.answer.mainFactors : ["Verified structure unavailable"],
				tradePlan: { entry: "Unavailable", stopLoss: "Unavailable", takeProfit1: "Unavailable", takeProfit2: "Unavailable", takeProfit3: "Unavailable", riskReward: "Unavailable" },
				macro: sourceLines.filter((item) => item.startsWith("macro.")).concat(missingLines.filter((item) => item.startsWith("macro."))).slice(0, 3),
				news: sourceLines.filter((item) => item.startsWith("news.")).concat(missingLines.filter((item) => item.startsWith("news."))).slice(0, 5),
				reasoning: [...response.answer.mainFactors, ...response.answer.mainRisks].slice(0, 6), jarvisView: `${response.answer.headline} · ${response.answer.decisionStatus}`, nextStep: response.answer.nextConfirmation || response.answer.decisionStatus,
				disclaimer: response.answer.riskWarning || mentorText("The final trading decision remains with you.", "最终交易决定由你作出。")
			};
			state.jarvis.mentorNote = response.answer.summary;
			replaceThinkingMessage({ text: response.answer.summary, responseModel: model, suggestions: response.followUpOptions });
			state.jarvis.timeline = [...state.jarvis.timeline, mentorText("Core Agent response prepared", "Core Agent 已完成回答")];
			return true;
		} catch (error) {
			if (!String(error?.code || "").startsWith("AI_")) return false;
			const rateLimited = error.code === "AI_RATE_LIMITED";
			const text = state.jarvis.language === "zh" ? rateLimited ? "JARVIS AI 目前达到请求额度或速率限制。你的对话已保留，请稍后重试。" : "JARVIS AI 目前无法完成这次请求。你的对话已保留，系统不会用 Demo 数据冒充 Live 回答。" : rateLimited ? "JARVIS AI has reached a request or quota limit. Your conversation is preserved; please retry later." : "JARVIS AI cannot complete this request right now. Your conversation is preserved, and Demo data will not be shown as Live.";
			state.jarvis.status = "error";
			state.jarvis.mentorNote = text;
			replaceThinkingMessage({ text, attention: true, suggestions: state.jarvis.language === "zh" ? ["稍后重试", "检查资料状态"] : ["Retry later", "Check data status"] });
			state.jarvis.timeline = [...state.jarvis.timeline, state.jarvis.language === "zh" ? "Live AI 暂时不可用" : "Live AI unavailable"];
			return true;
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
		const analyze = page.querySelector("#analyzeChartButton");
		if (!input) return;
		const chooseButtons = page.querySelectorAll("#chooseChartButton, #replaceInvalidChartButton");
		const replace = page.querySelector("#replaceChartButton");
		const remove = page.querySelector("#removeChartButton");
		const dropzone = page.querySelector(".s5-upload-dropzone");
		const asset = page.querySelector("#chartAssetSelect");
		const timeframe = page.querySelector("#chartTimeframeSelect");
		const focus = page.querySelector("#chartFocusInput");
		chooseButtons.forEach((button) => button.addEventListener("click", () => input.click()));
		replace?.addEventListener("click", () => input.click());
		input.addEventListener("change", async () => {
			const file = input.files?.[0];
			if (!file) return;
			await acceptChartFile(file);
			input.value = "";
		});
		dropzone?.addEventListener("dragover", (event) => {
			event.preventDefault();
			dropzone.classList.add("is-dragging");
		});
		dropzone?.addEventListener("keydown", (event) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				input.click();
			}
		});
		dropzone?.addEventListener("dragleave", () => dropzone.classList.remove("is-dragging"));
		dropzone?.addEventListener("drop", async (event) => {
			event.preventDefault();
			dropzone.classList.remove("is-dragging");
			const files = event.dataTransfer?.files;
			if (files?.length) await acceptChartFile(files[0]);
		});
		remove?.addEventListener("click", clearChartUpload);
		page.querySelector("#dismissChartError")?.addEventListener("click", () => {
			state.chartUpload.error = "";
			state.chartUpload.status = "empty";
			render();
		});
		asset?.addEventListener("change", () => {
			state.chartUpload.asset = asset.value;
		});
		timeframe?.addEventListener("change", () => {
			state.chartUpload.timeframe = timeframe.value;
		});
		focus?.addEventListener("input", () => {
			state.chartUpload.focus = focus.value.slice(0, 300);
			const counter = page.querySelector("#chartFocusCount");
			if (counter) counter.textContent = `${state.chartUpload.focus.length}/300`;
		});
		analyze?.addEventListener("click", runChartVisualAnalysis);
		page.querySelector("#retryChartAnalysis")?.addEventListener("click", runChartVisualAnalysis);
		page.querySelector("#zoomChartButton")?.addEventListener("click", () => {
			state.chartUpload.expanded = true;
			render();
		});
		page.querySelector("#closeChartPreview")?.addEventListener("click", () => {
			state.chartUpload.expanded = false;
			render();
		});
		page.querySelector("#askJarvisAboutChart")?.addEventListener("click", async () => {
			const chart = state.chartUpload;
			const isZh = state.jarvis.language === "zh";
			state.jarvis.topic = chart.asset === "Unknown" ? "Uploaded chart" : chart.asset;
			state.jarvis.conversationState.currentAsset = chart.asset;
			state.jarvis.conversationState.timeframe = chart.timeframe;
			state.jarvis.conversationState.currentTradeStatus = "Preliminary Visual Analysis / Insufficient Context";
			state.jarvis.conversationState.missingInformation = ["Connected chart vision", "Verified market data", "External news verification"];
			state.jarvis.question = isZh ? `解释我上传的 ${chart.asset} ${chart.timeframe} 图表。目前视觉服务未连接，请只说明可验证内容和下一步。` : `Explain my uploaded ${chart.asset} ${chart.timeframe} chart. Chart vision is not connected, so use only verified context and explain the next step.`;
			state.activePage = "JARVIS";
			await renderFromTop();
			const contextualInput = document.querySelector(".ask-page #jarvisQuestion");
			if (contextualInput) contextualInput.value = state.jarvis.question;
		});
		page.querySelector("#openChartInAiAnalysis")?.addEventListener("click", () => {
			if (state.chartUpload.asset !== "Unknown") state.approvedUi.analysisAsset = state.chartUpload.asset;
			if (state.chartUpload.timeframe !== "Unknown" && ["D1", "H4", "H1", "M15"].includes(state.chartUpload.timeframe)) state.approvedUi.analysisTimeframe = state.chartUpload.timeframe;
			state.activePage = "AIAnalysis";
			renderFromTop();
		});
	}
	function getVisionSessionId() {
		let sessionId = localStorage.getItem("jarvis-vision-session-id");
		if (!sessionId) {
			sessionId = `vision-session-${crypto.randomUUID()}`;
			localStorage.setItem("jarvis-vision-session-id", sessionId);
		}
		return sessionId;
	}
	function revokeChartPreview() {
		if (state.chartUpload.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(state.chartUpload.previewUrl);
	}
	function resetChartAnalysisState() {
		state.chartUpload.analysis = null;
		state.chartUpload.result = null;
		state.chartUpload.analysisStep = -1;
		state.chartUpload.isAnalyzing = false;
		localStorage.removeItem("jarvis-chart-analysis");
	}
	async function clearChartUpload() {
		const uploadId = state.chartUpload.visionUploadId;
		if (uploadId) {
			try { await fetch(`/api/vision/uploads/${encodeURIComponent(uploadId)}`, { method: "DELETE", headers: { "x-jarvis-session-id": getVisionSessionId() } }); } catch { console.warn("Vision image deletion could not be confirmed."); }
		}
		revokeChartPreview();
		state.chartUpload.previewUrl = "";
		state.chartUpload.fileName = "";
		state.chartUpload.visionUploadId = null;
		state.chartUpload.visionDataStatus = "unavailable";
		state.chartUpload.fileSize = 0;
		state.chartUpload.fileType = "";
		state.chartUpload.width = 0;
		state.chartUpload.height = 0;
		state.chartUpload.status = "empty";
		state.chartUpload.error = "";
		state.chartUpload.expanded = false;
		resetChartAnalysisState();
		localStorage.removeItem("jarvis-chart-file-name");
		renderFromTop();
	}
	function chartUploadError(message, status = "error") {
		revokeChartPreview();
		state.chartUpload.status = status;
		state.chartUpload.error = message;
		state.chartUpload.previewUrl = "";
		state.chartUpload.fileName = "";
		state.chartUpload.fileSize = 0;
		state.chartUpload.fileType = "";
		state.chartUpload.width = 0;
		state.chartUpload.height = 0;
		resetChartAnalysisState();
		render();
	}
	async function acceptChartFile(file) {
		const isZh = state.jarvis.language === "zh";
		const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
		const allowedExtension = /\.(png|jpe?g|webp)$/i.test(file.name || "");
		if (!allowedTypes.includes(file.type) || !allowedExtension) {
			chartUploadError(isZh ? "请上传 PNG、JPG、JPEG 或 WEBP 图片。" : "Upload a PNG, JPG, JPEG or WEBP image.");
			return;
		}
		if (!file.size) {
			chartUploadError(isZh ? "所选文件为空或已损坏。" : "The selected file is empty or corrupt.");
			return;
		}
		if (file.size > 10 * 1024 * 1024) {
			chartUploadError(isZh ? "所选图片超过支持的文件大小。" : "The selected image exceeds the supported file size.");
			return;
		}
		state.chartUpload.status = "validating";
		state.chartUpload.error = "";
		await render();
		try {
			const previewUrl = URL.createObjectURL(file);
			const dimensions = await new Promise((resolve, reject) => {
				const image = new Image();
				image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
				image.onerror = () => { URL.revokeObjectURL(previewUrl); reject(new Error("decode-failed")); };
				image.src = previewUrl;
			});
			if (dimensions.width < 480 || dimensions.height < 320) {
				chartUploadError(isZh ? "JARVIS 无法读取足够的图表信息。请上传更清晰的图片。" : "JARVIS could not read enough chart information. Upload a clearer image.", "unreadable");
				return;
			}
			revokeChartPreview();
			state.chartUpload.previewUrl = previewUrl;
			state.chartUpload.fileName = file.name;
			state.chartUpload.fileSize = file.size;
			state.chartUpload.fileType = file.type;
			state.chartUpload.width = dimensions.width;
			state.chartUpload.height = dimensions.height;
			state.chartUpload.status = "ready";
			state.chartUpload.error = "";
			state.chartUpload.visionUploadId = null;
			state.chartUpload.visionDataStatus = "unavailable";
			try {
				const form = new FormData();
				form.append("file", file);
				form.append("asset", state.chartUpload.asset);
				form.append("timeframe", state.chartUpload.timeframe);
				const response = await fetch("/api/vision/uploads", { method: "POST", headers: { "x-jarvis-session-id": getVisionSessionId() }, body: form });
				if (!String(response.headers.get("content-type") || "").includes("application/json")) throw new Error("vision-api-unavailable");
				const payload = await response.json();
				if (!response.ok || !payload.success) {
					chartUploadError(payload.error?.message || (isZh ? "图表上传暂时不可用。" : "Chart upload is temporarily unavailable."));
					return;
				}
				if (response.ok && payload.success) {
					state.chartUpload.visionUploadId = payload.data.id;
					state.chartUpload.visionDataStatus = payload.meta?.dataStatus || "demo";
				}
			} catch (visionError) {
				console.warn("Vision foundation is unavailable; local preview remains available.");
			}
			resetChartAnalysisState();
			localStorage.setItem("jarvis-chart-file-name", state.chartUpload.fileName);
			await render();
		} catch (error) {
			console.error("Chart upload validation failed", error);
			chartUploadError(isZh ? "所选图片已损坏或无法读取。" : "The selected image is corrupt or unreadable.");
		}
	}
	function buildSafeChartResult() {
		const chart = state.chartUpload;
		const isZh = state.jarvis.language === "zh";
		const chartQuality = chart.width >= 1200 && chart.height >= 600 ? isZh ? "清晰" : "Clear" : chart.width >= 640 && chart.height >= 360 ? isZh ? "可接受" : "Acceptable" : isZh ? "低质量" : "Low Quality";
		return {
			asset: chart.asset,
			timeframe: chart.timeframe,
			chartQuality,
			assetDetection: chart.asset === "Unknown" ? isZh ? "未检测" : "Not Detected" : isZh ? "用户确认" : "User Confirmed",
			timeframeDetection: chart.timeframe === "Unknown" ? isZh ? "未检测" : "Not Detected" : isZh ? "用户确认" : "User Confirmed",
			priceScale: isZh ? "未验证" : "Not Verified",
			structureVisibility: isZh ? "不足" : "Insufficient",
			reliability: isZh ? "背景不足" : "Insufficient Context",
			bias: isZh ? "中性" : "Neutral",
			mode: isZh ? "背景不足" : "Insufficient Context",
			trend: isZh ? "不明确" : "Unclear",
			trendStrength: isZh ? "不明确" : "Unclear",
			setupStatus: isZh ? "背景不足" : "Insufficient Context",
			source: isZh ? "用户提供图表 • 初步视觉分析" : "User-Provided Chart • Preliminary Visual Analysis",
			structure: isZh ? "视觉分析服务未连接，无法验证图表结构。" : "Chart vision is not connected, so structure cannot be verified.",
			latestShift: isZh ? "不可用" : "Unavailable",
			confirmation: isZh ? "需要连接视觉分析" : "Connected chart vision required",
			invalidation: isZh ? "精确价格不可用" : "Exact price unavailable",
			nextConfirmation: isZh ? "连接图表视觉服务或稍后重试" : "Connect chart vision or retry when the service is available"
		};
	}
	async function runChartVisualAnalysis() {
		const chart = state.chartUpload;
		const isZh = state.jarvis.language === "zh";
		if (!chart.previewUrl || chart.status !== "ready" && chart.status !== "complete" && chart.status !== "analysis-error" || chart.isAnalyzing) return;
		chart.isAnalyzing = true;
		chart.error = "";
		chart.status = "analyzing";
		chart.analysisStep = 0;
		await render();
		try {
			for (let step = 0; step < 6; step += 1) {
				chart.analysisStep = step;
				await render();
				await new Promise((resolve) => setTimeout(resolve, 220));
			}
			let visionResult = null;
			if (chart.visionUploadId) {
				const response = await fetch("/api/vision/analysis", { method: "POST", headers: { "content-type": "application/json", "x-jarvis-session-id": getVisionSessionId() }, body: JSON.stringify({ imageId: chart.visionUploadId, userContext: { asset: chart.asset, timeframe: chart.timeframe }, requestedObservations: ["trend", "structure", "swings", "support_resistance", "liquidity", "annotations", "trade_levels"], verifyWithMarketData: true }) });
				const payload = await response.json();
				if (response.ok && payload.success) visionResult = payload.data;
			}
			chart.result = buildSafeChartResult();
			if (visionResult) {
				chart.result.chartQuality = visionResult.chartContext?.imageQuality || chart.result.chartQuality;
				chart.result.reliability = visionResult.summary?.decisionStatus === "unavailable" ? (isZh ? "视觉服务未连接" : "Vision Not Connected") : (visionResult.summary?.decisionStatus || chart.result.reliability);
				chart.result.source = visionResult.provider === "MockVisionProvider" ? (isZh ? "用户提供图表 • Demo 视觉基础" : "User-Provided Chart • Demo Vision Foundation") : chart.result.source;
			}
			chart.analysis = {
				pair: chart.asset,
				instrument: chart.asset,
				timeframe: chart.timeframe,
				bias: "Neutral",
				confidence: 0,
				confidenceLabel: "Insufficient Context",
				marketStructure: chart.result.structure,
				keyZones: [isZh ? "精确价格不可用" : "Exact price unavailable"],
				risk: "Insufficient Context",
				recommendation: chart.result.nextConfirmation,
				analysisSource: "User-Provided Chart / Preliminary Visual Analysis",
				preliminary: true
			};
			chart.status = "complete";
			localStorage.setItem("jarvis-chart-analysis", JSON.stringify(chart.analysis));
		} catch (error) {
			console.error("Chart analysis failed", error);
			chart.status = "analysis-error";
			chart.error = isZh ? "图表分析暂时不可用。请重试。" : "Chart analysis is temporarily unavailable. Please retry.";
		} finally {
			chart.isAnalyzing = false;
			await render();
		}
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
			label: "Macro",
			labelZh: "宏观情报",
			page: "Macro",
			icon: "macro"
		},
		{
			label: "News Feed",
			labelZh: "新闻与事件",
			page: "Calendar",
			icon: "calendar"
		},
		{
			label: "JARVIS Finder",
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
      <div><p>JARVIS OS</p><span>INSTITUTIONAL ${state.activePage === "Home" ? "EDGE" : "INTELLIGENCE"}</span></div>
      <button class="sidebar-collapse-toggle" type="button" aria-label="${state.approvedUi.sidebarExpanded ? "Collapse" : "Expand"} navigation" aria-expanded="${state.approvedUi.sidebarExpanded}">${lineIcon("menu")}</button>
      <button class="mobile-nav-close" type="button" aria-label="Close navigation">${lineIcon("close")}</button>
    </div>
    <nav class="approved-nav"></nav>
    <div class="sidebar-cta"><button type="button" data-nav-page="TradePlanner">${lineIcon("planner")}<span>New Trade Plan</span></button></div>
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
		side.querySelector("[data-nav-page]")?.addEventListener("click", (event) => {
			state.activePage = event.currentTarget.dataset.navPage;
			document.body.classList.remove("nav-open");
			renderFromTop();
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
    <div class="topbar-search">${lineIcon("search")}<span>${isZh ? "搜索市场、资产或日志..." : "Search markets, assets, or logs..."}</span><kbd>CMD+K</kbd></div>
    <div class="topbar-actions">
      <button class="mobile-nav-toggle" type="button" aria-label="Open navigation" aria-expanded="false">${lineIcon("menu")}</button>
      <button class="topbar-icon" type="button" aria-label="Notifications">${lineIcon("calendar")}</button>
      <button class="topbar-icon" type="button" aria-label="Support">${lineIcon("message")}</button>
      <div class="profile-copy"><strong>${mockUser.name}</strong><small>Connected</small></div>
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
    <section class="approved-workspace workspace-command-center bible-home stitch-workspace">
      <div class="stitch-home-main">
        <header class="bible-greeting"><p>${timeGreeting()}, <strong>Commander</strong></p><span>${isZh ? "全球指数显示风险偏好共振。主要资产波动压缩，短期反弹概率上升。" : "Global indices are showing resilience post-NY open. Bond yields are compressing, favoring a short-term rally in risk assets."}</span><div class="greeting-tags"><b>Market Pulse</b><b>Bullish</b></div></header>
        <section class="liquidity-pulse"><div class="module-head"><div><span>GLOBAL LIQUIDITY PULSE</span><small>REAL-TIME MARKET DEPTH & ORDERFLOW AGGREGATE</small></div><b>REALTIME</b></div><div class="pulse-chart"><i></i><span>BUY-SIDE LIQUIDITY</span><span>OPEN RANGE</span><span>SELL-SIDE LIQUIDITY</span></div></section>
        <section class="workspace-assets">
          ${["XAUUSD","BTCUSD"].map((symbol,index)=>`<article><header><span class="asset-symbol">${index?"₿":"◎"}</span><div><strong>${symbol}</strong><small>${index?"BITCOIN / USD":"SPOT GOLD"}</small></div><em>${index?"$72,140":"$2,174.45"}</em></header><div class="asset-spark"></div><footer><span><small>AI BIAS</small><b>${index?"CONSOLIDATING":"STRONG BUY"}</b></span><span><small>CONFIDENCE</small><b>${index?"42%":"88%"}</b></span></footer></article>`).join("")}
        </section>
      </div>
      <aside class="intelligence-pulse"><header><span>✦ INTELLIGENCE<br> PULSE</span><i></i></header>${["Aggressive accumulation detected in EUR/USD at psychological level 1.0920.","US Initial Jobless Claims: 212K vs 215K expected. Neutral market impact.","VIX Index spiking +4.2%. Defensive rotation observed in Treasury yields.","JARVIS has identified a high-probability mean reversion setup for NASDAQ100."].map((item,index)=>`<article><small>09:${12-index*3} EST <b>${index===2?"VOLATILITY":"SIGNAL"}</b></small><p>${item}</p></article>`).join("")}<button type="button" data-nav-page="Calendar">View Full Archive</button></aside>
      <footer class="workspace-motto">ATTITUDE <i></i> IMPROVE <i></i> GROWTH<small>JARVIS IS 14.8% • SCIENCE OPERATIONAL PLATFORM</small></footer>
    </section>
  `;
	}
	function jarvisPageContent(brain) {
		const isZh = state.jarvis.language === "zh";
		const emptySuggestions = isZh ? ["现在可以买 Gold 吗？", "分析 EURUSD", "今天的 CPI", "最新美联储新闻", "分析我的图表", "寻找交易机会"] : ["Can I buy Gold now?", "Analyse EURUSD", "Today's CPI", "Latest Fed News", "Analyse my chart", "Find opportunities"];
		return `
    <section class="approved-workspace ask-page">
      <div class="approved-page-head ask-page-heading">
        <div><span class="stitch-page-kicker">ASK JARVIS</span><h1>Intelligence Terminal</h1><p>${isZh ? "JARVIS 系统在线，可进行跨资产分析、风险建模与交易策略优化。" : "JARVIS system online. Ready for complex cross-asset analysis, risk modeling, and trade strategy refinement."}</p></div>
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
		const chart = state.chartUpload;
		const isZh = state.jarvis.language === "zh";
		const hasChart = Boolean(chart.previewUrl);
		const result = chart.result;
		const isAnalyzing = chart.isAnalyzing || chart.status === "analyzing";
		const analysisSteps = isZh ? ["检查图表质量...", "识别资产与周期...", "读取市场结构...", "扫描流动性与关键区域...", "评估两种情景...", "建立分析摘要..."] : ["Checking chart quality...", "Identifying asset and timeframe...", "Reading market structure...", "Scanning liquidity and key zones...", "Evaluating scenarios...", "Building analysis summary..."];
		const formatSize = (bytes) => bytes ? `${(bytes / 1024 / 1024).toFixed(bytes >= 1024 * 1024 ? 2 : 3)} MB` : "—";
		const row = (label, value, tone = "") => `<div class="s5-data-row"><span>${label}</span><strong class="${tone}">${value || (isZh ? "不可用" : "Unavailable")}</strong></div>`;
		const notAvailable = isZh ? "不可用" : "Not Available";
		const exactUnavailable = isZh ? "精确价格不可用" : "Exact Price Unavailable";
		const insufficient = isZh ? "背景不足" : "Insufficient Context";
		const chartOptions = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "BTCUSD", "Unknown"];
		const timeframeOptions = ["D1", "H4", "H1", "M30", "M15", "M5", "Unknown"];
		return `
    <section class="approved-workspace upload-chart-page">
      <header class="s5-page-head">
        <div><h1>${isZh ? "上传图表" : "Upload Chart"}</h1><p>${isZh ? "上传图表，让 JARVIS 进行视觉分析。" : "Upload your chart for visual analysis by JARVIS."}</p><small>${isZh ? "JARVIS 只分析图片中可见的图表背景，结果取决于图片质量与显示信息。" : "JARVIS analyses the visible chart context. Results depend on image quality and the information shown."}</small></div>
      </header>
      <input id="chartUploadInput" class="hidden-file-input" type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" aria-label="${isZh ? "选择交易图表图片" : "Choose trading chart image"}" />
      ${chart.error ? `<section class="s5-error-banner" role="alert"><div><strong>${chart.status === "unreadable" ? isZh ? "无法读取图表" : "Unreadable chart" : isZh ? "无法使用所选文件" : "Selected file cannot be used"}</strong><p>${escapeHtml(chart.error)}</p></div><div><button id="replaceInvalidChartButton" type="button">${isZh ? "选择其他图表" : "Choose another chart"}</button><button id="dismissChartError" type="button">${isZh ? "取消分析" : "Cancel analysis"}</button></div></section>` : ""}
      ${!hasChart ? `<section class="s5-empty-upload">
        <div class="s5-upload-dropzone" tabindex="0" role="group" aria-label="${isZh ? "拖放或选择图表图片" : "Drag and drop or choose chart image"}">
          <span>${lineIcon("upload")}</span><h2>${isZh ? "上传图表开始视觉分析" : "Upload a chart to begin visual analysis."}</h2>
          <p>${isZh ? "拖放图表，或点击选择文件" : "Drag and drop your chart or click to browse"}</p>
          <small>PNG, JPG, JPEG, WEBP • ${isZh ? "最大 10 MB" : "Maximum 10 MB"}</small>
          <button id="chooseChartButton" type="button">${isZh ? "选择文件" : "Choose File"}</button>
          <em>${isZh ? "建议上传清晰图表，并显示资产、周期、价格刻度和近期结构。" : "For better analysis, upload a clear chart showing the asset, timeframe, price scale and recent structure."}</em>
        </div>
      </section>` : `<section class="s5-top-grid">
        <article class="s5-module s5-upload-module">
          <h2>1. ${isZh ? "上传图表" : "Upload Chart"}</h2>
          <div class="s5-upload-dropzone compact" tabindex="0" role="group" aria-label="${isZh ? "替换图表" : "Replace chart"}"><span>${lineIcon("upload")}</span><p>${isZh ? "拖放或选择另一张图表" : "Drag and drop or choose another chart"}</p><button id="chooseChartButton" type="button">${isZh ? "替换图表" : "Replace Chart"}</button></div>
        </article>
        <article class="s5-module s5-preview-module">
          <h2>2. ${isZh ? "图表预览" : "Chart Preview"}</h2>
          <div class="s5-chart-preview"><img src="${chart.previewUrl}" alt="${isZh ? "已上传交易图表预览" : "Uploaded trading chart preview"}" /></div>
          <div class="s5-preview-meta"><div><strong>${escapeHtml(chart.fileName)}</strong><span>${formatSize(chart.fileSize)} • ${chart.width}×${chart.height}</span><small>${isZh ? "验证完成" : "Validation complete"}</small></div><div class="s5-preview-actions"><button id="zoomChartButton" type="button" aria-label="${isZh ? "放大图表" : "Expand chart preview"}">${lineIcon("search")}</button><button id="replaceChartButton" type="button" aria-label="${isZh ? "替换图表" : "Replace chart"}">${lineIcon("upload")}</button><button id="removeChartButton" type="button" aria-label="${isZh ? "移除图表" : "Remove chart"}">${lineIcon("close")}</button></div></div>
        </article>
        <article class="s5-module s5-context-module">
          <h2>3. ${isZh ? "图表背景" : "Chart Context"}</h2>
          <div class="s5-context-selects"><label><span>${isZh ? "资产" : "Asset"}</span><select id="chartAssetSelect" aria-label="Chart asset">${chartOptions.map((value) => `<option value="${value}" ${value === chart.asset ? "selected" : ""}>${value}</option>`).join("")}</select></label><label><span>${isZh ? "周期" : "Timeframe"}</span><select id="chartTimeframeSelect" aria-label="Chart timeframe">${timeframeOptions.map((value) => `<option value="${value}" ${value === chart.timeframe ? "selected" : ""}>${value}</option>`).join("")}</select></label></div>
          <label class="s5-focus-field"><span>${isZh ? "你希望 JARVIS 重点查看什么？" : "What would you like JARVIS to focus on?"}</span><textarea id="chartFocusInput" maxlength="300" rows="4" placeholder="${isZh ? "检查趋势、结构、流动性和潜在进场区域。" : "Check trend, structure, liquidity and potential entry zones."}">${escapeHtml(chart.focus)}</textarea><small id="chartFocusCount">${chart.focus.length}/300</small></label>
          <button class="s5-analyse-button" id="analyzeChartButton" type="button" ${chart.status !== "ready" && chart.status !== "complete" && chart.status !== "analysis-error" || isAnalyzing ? "disabled" : ""}>4. ${isAnalyzing ? isZh ? "分析中..." : "Analysing..." : isZh ? "分析图表" : "Analyse Chart"}</button>
          <p>${isZh ? "视觉引擎尚未连接时，JARVIS 只会返回诚实的不可用状态。" : "When chart vision is not connected, JARVIS returns honest unavailable states only."}</p>
        </article>
      </section>`}
      ${hasChart && (isAnalyzing || result || chart.status === "analysis-error") ? `<section class="s5-analysis-grid">
        <article class="s5-module s5-analysis-state">
          <h2>5. ${isZh ? "JARVIS 分析状态" : "JARVIS Analysis State"}</h2>
          <div class="s5-analysis-orb"><i></i></div>
          <div><h3>${isAnalyzing ? isZh ? "JARVIS 正在分析你的图表..." : "JARVIS is analysing your chart..." : chart.status === "analysis-error" ? isZh ? "分析暂不可用" : "Analysis unavailable" : isZh ? "分析检查完成" : "Analysis checks complete"}</h3><ul>${analysisSteps.map((step, index) => `<li class="${!isAnalyzing || index < chart.analysisStep ? "complete" : index === chart.analysisStep ? "active" : "pending"}"><i></i>${step}<span>${!isAnalyzing || index < chart.analysisStep ? "✓" : index === chart.analysisStep ? isZh ? "检查中" : "In progress" : isZh ? "等待" : "Pending"}</span></li>`).join("")}</ul>${chart.status === "analysis-error" ? `<button id="retryChartAnalysis" type="button">${isZh ? "重试分析" : "Retry Analysis"}</button>` : ""}</div>
        </article>
        <article class="s5-module s5-quality-module">
          <h2>6. ${isZh ? "图表质量与检测状态" : "Chart Quality & Detection Status"}</h2>
          <div class="s5-quality-grid">${[
			[isZh ? "图表质量" : "Chart Quality", result?.chartQuality || insufficient],
			[isZh ? "资产检测" : "Asset Detection", result?.assetDetection || insufficient],
			[isZh ? "周期检测" : "Timeframe Detection", result?.timeframeDetection || insufficient],
			[isZh ? "价格刻度" : "Price Scale", result?.priceScale || insufficient],
			[isZh ? "结构可见度" : "Structure Visibility", result?.structureVisibility || insufficient],
			[isZh ? "分析可靠性" : "Analysis Reliability", result?.reliability || insufficient]
		].map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("")}</div>
        </article>
        ${result ? `<article class="s5-module s5-summary-module"><h2>7. ${isZh ? "分析摘要" : "Analysis Summary"}</h2>${row(isZh ? "市场偏向" : "Market Bias", result.bias)}${row(isZh ? "市场模式" : "Market Mode", result.mode)}${row(isZh ? "趋势" : "Trend", result.trend)}${row(isZh ? "趋势强度" : "Trend Strength", result.trendStrength)}${row(isZh ? "Setup 状态" : "Setup Status", result.setupStatus)}${row(isZh ? "可靠性" : "Reliability", result.reliability)}${row(isZh ? "分析来源" : "Analysis Source", result.source)}</article>
        <article class="s5-module s5-structure-module"><h2>8. ${isZh ? "市场结构" : "Market Structure"}</h2>${row(isZh ? "当前结构" : "Current Structure", result.structure)}${row(isZh ? "最新可见转变" : "Latest Visible Shift", result.latestShift)}${row(isZh ? "结构状态" : "Structure Status", insufficient)}${row(isZh ? "需要确认" : "Confirmation Required", result.confirmation)}${row(isZh ? "失效背景" : "Invalidation Context", result.invalidation)}</article>
        <article class="s5-module s5-zones-module"><h2>9. ${isZh ? "流动性与关键区域" : "Liquidity & Key Zones"}</h2>${[isZh ? "买方流动性" : "Buy-side Liquidity", isZh ? "卖方流动性" : "Sell-side Liquidity", isZh ? "支撑区" : "Support Zone", isZh ? "阻力区" : "Resistance Zone", isZh ? "订单块" : "Order Block", isZh ? "公平价值缺口" : "Fair Value Gap", isZh ? "扫流动性状态" : "Sweep Status", isZh ? "突破 / 回测区" : "Breakout / Retest Zone"].map((label) => row(label, notAvailable)).join("")}</article>
        <article class="s5-module s5-plan-module"><h2>10. ${isZh ? "潜在交易计划" : "Potential Trade Plan"}</h2>${row(isZh ? "Setup 状态" : "Setup Status", insufficient)}${row(isZh ? "方向偏向" : "Directional Bias", result.bias)}${row(isZh ? "进场区" : "Entry Zone", exactUnavailable)}${row(isZh ? "止损" : "Stop Loss", exactUnavailable)}${row(isZh ? "止盈 1" : "Take Profit 1", exactUnavailable)}${row(isZh ? "止盈 2" : "Take Profit 2", exactUnavailable)}${row(isZh ? "止盈 3" : "Take Profit 3", exactUnavailable)}${row(isZh ? "风险回报" : "Risk Reward", exactUnavailable)}${row(isZh ? "失效水平" : "Invalidation Level", exactUnavailable)}</article>
        <article class="s5-module s5-bull-module"><h2>11. ${isZh ? "看涨情景" : "Bullish Scenario"}</h2>${row(isZh ? "条件" : "Condition", insufficient)}${row(isZh ? "确认" : "Confirmation", result.confirmation)}${row(isZh ? "目标区域" : "Target Area", exactUnavailable)}${row(isZh ? "失效" : "Invalidation", exactUnavailable)}${row(isZh ? "概率" : "Probability", insufficient)}</article>
        <article class="s5-module s5-bear-module"><h2>12. ${isZh ? "看跌情景" : "Bearish Scenario"}</h2>${row(isZh ? "条件" : "Condition", insufficient)}${row(isZh ? "确认" : "Confirmation", result.confirmation)}${row(isZh ? "目标区域" : "Target Area", exactUnavailable)}${row(isZh ? "失效" : "Invalidation", exactUnavailable)}${row(isZh ? "概率" : "Probability", insufficient)}</article>
        <article class="s5-module s5-risk-module"><h2>13. ${isZh ? "风险背景" : "Risk Context"}</h2>${row(isZh ? "图表质量风险" : "Chart Quality Risk", result.chartQuality === "Clear" || result.chartQuality === "清晰" ? isZh ? "低" : "Low" : isZh ? "中等" : "Moderate")}${row(isZh ? "结构风险" : "Structure Risk", insufficient)}${row(isZh ? "流动性风险" : "Liquidity Risk", insufficient)}${row(isZh ? "进场时机风险" : "Entry Timing Risk", insufficient)}${row(isZh ? "新闻背景" : "News Context Status", isZh ? "需要外部验证" : "External Verification Required")}${row(isZh ? "整体风险" : "Overall Risk", insufficient)}<p class="s5-warning">${isZh ? "图表分析不能取代当前市场、新闻和风险验证。" : "Chart analysis does not replace current market, news and risk verification."}</p></article>
        <article class="s5-module s5-conclusion-module"><h2>14. ${isZh ? "JARVIS 结论" : "JARVIS Conclusion"}</h2><p class="s5-conclusion">${isZh ? "背景不足 • 需要视觉验证 • 等待" : "Insufficient Context • Visual Verification Required • Wait"}</p>${row(isZh ? "主要因素" : "Main Factor", isZh ? "视觉引擎未连接" : "Chart vision not connected")}${row(isZh ? "主要风险" : "Main Risk", isZh ? "无法验证可见结构" : "Visible structure cannot be verified")}${row(isZh ? "决定状态" : "Decision Status", insufficient)}</article>
        <article class="s5-module s5-next-module"><h2>15. ${isZh ? "下一项确认" : "Next Confirmation"}</h2><p>${result.nextConfirmation}</p></article>
        <article class="s5-module s5-ask-module"><h2>16. ${isZh ? "询问 JARVIS" : "Ask JARVIS Follow-up"}</h2><p>${isZh ? "带着图表和确认背景继续对话。" : "Continue with the chart and confirmation context."}</p><button id="askJarvisAboutChart" type="button">${lineIcon("message")}${isZh ? "询问 JARVIS 此图表" : "Ask JARVIS about this chart"}</button></article>
        <article class="s5-module s5-open-analysis-module"><h2>17. ${isZh ? "在 AI 分析中打开" : "Open in AI Analysis"}</h2><p>${isZh ? "将用户提供图表背景带入结构化分析页。" : "Carry the user-provided chart context into structured analysis."}</p><button id="openChartInAiAnalysis" type="button">${lineIcon("analysis")}${isZh ? "在 AI 分析中打开" : "Open in AI Analysis"}</button></article>` : ""}
      </section>` : ""}
      ${chart.expanded && hasChart ? `<div class="s5-preview-modal" role="dialog" aria-modal="true" aria-label="${isZh ? "放大图表预览" : "Expanded chart preview"}"><button id="closeChartPreview" type="button" aria-label="${isZh ? "关闭预览" : "Close preview"}">${lineIcon("close")}</button><img src="${chart.previewUrl}" alt="${isZh ? "放大后的交易图表" : "Expanded trading chart"}" /></div>` : ""}
    </section>
	  `;
	}
	function aiAnalysisPageContent() {
		const isZh = state.jarvis.language === "zh";
		const asset = state.approvedUi.analysisAsset;
		const timeframe = state.approvedUi.analysisTimeframe;
		const isLoading = state.approvedUi.analysisStatus === "loading";
		const marketInput = state.marketData.analysis;
		const marketQuote = marketInput.quote;
		const marketCandles = marketInput.candles;
		const marketVerified = marketQuote?.dataStatus === "verified" && marketQuote?.freshness === "current";
		const analysisSymbols = state.marketData.symbols.length ? state.marketData.symbols.filter((item) => item.supported).map((item) => item.symbol) : ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "BTCUSD"];
		const activeSymbolMetadata = state.marketData.symbols.find((item) => item.symbol === asset);
		const analysisTimeframes = activeSymbolMetadata?.timeframes || ["D1", "H4", "H1", "M30", "M15", "M5"];
		const hasChart = Boolean(state.chartUpload.previewUrl);
		const analysis = state.chartUpload.analysis || state.jarvis.quickAnalysis;
		const dataStatus = marketQuote
			? `${marketQuote.provider} · ${marketQuote.dataStatus} · ${marketQuote.freshness}`
			: hasChart ? isZh ? "图表背景" : "Chart Context" : isZh ? "数据源未连接" : "Data Source Not Connected";
		const bias = hasChart && ["Bullish", "Bearish", "Neutral"].includes(analysis?.bias) ? analysis.bias : "Neutral";
		const structure = hasChart ? analysis?.marketStructure || (isZh ? "等待图表确认" : "Awaiting chart confirmation") : isZh ? "等待数据" : "Awaiting Data";
		const unavailable = isZh ? "等待已验证市场数据" : "Awaiting verified market data";
		const chartRequired = isZh ? "上传图表以获得准确的 Entry / SL / TP" : "Upload chart for accurate Entry / SL / TP";
		const refreshed = marketQuote?.timestamp ? new Date(marketQuote.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
		const lastUpdated = refreshed ? `${isZh ? "市场更新" : "Market updated"} ${refreshed}` : isZh ? "最后更新时间不可用" : "Last updated unavailable";
		const formattedQuote = marketQuote?.last != null ? Number(marketQuote.last).toLocaleString(void 0, { maximumFractionDigits: asset === "USDJPY" ? 3 : asset.includes("USD") && !["XAUUSD", "BTCUSD"].includes(asset) ? 5 : 2 }) : null;
		const row = (label, value, tone = "") => `<div class="analysis-data-row"><span>${label}</span><strong class="${tone}">${value}</strong></div>`;
		const status = (value, tone = "muted") => `<span class="analysis-status ${tone}">${value}</span>`;
		const unavailableList = (count, text) => `<ul class="analysis-compact-list">${Array.from({ length: count }, () => `<li>${text}</li>`).join("")}</ul>`;
		return `
    <section class="approved-workspace ai-analysis-page ${isLoading ? "is-loading" : ""}">
      <header class="ai-analysis-head">
		<div><span class="stitch-page-kicker">MARKETS / COMMODITIES / ${asset}</span><h1>${isZh ? "AI 分析" : `${asset === "XAUUSD" ? "Gold" : asset} Deep Dive`}</h1><p>${isZh ? "由 JARVIS 驱动的结构化市场情报。" : "Institutional market intelligence, scenario mapping and risk context."}</p></div>
        <div class="ai-analysis-head-actions">
          <div class="analysis-source-meta"><span>${lastUpdated}</span>${status(dataStatus, hasChart ? "info" : "warning")}</div>
          <button class="analysis-refresh-button" id="refreshAiAnalysis" type="button" ${isLoading ? "disabled" : ""} aria-label="${isZh ? "刷新分析" : "Refresh analysis"}">${lineIcon("refresh")}<span>${isLoading ? isZh ? "分析中" : "Analysing" : isZh ? "刷新分析" : "Refresh Analysis"}</span></button>
        </div>
      </header>
      <section class="analysis-selector-row" aria-label="${isZh ? "分析控制" : "Analysis controls"}">
		<label><span>${isZh ? "资产" : "Asset"}</span><select id="analysisAssetSelect" aria-label="Asset">${analysisSymbols.map((value) => `<option value="${value}" ${value === asset ? "selected" : ""}>${value}</option>`).join("")}</select></label>
		<label><span>${isZh ? "周期" : "Timeframe"}</span><select id="analysisTimeframeSelect" aria-label="Timeframe">${analysisTimeframes.map((value) => `<option value="${value}" ${value === timeframe ? "selected" : ""}>${value}</option>`).join("")}</select></label>
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
			${row(isZh ? "价格状态" : "Price Status", formattedQuote ? `${formattedQuote} · ${marketQuote.freshness}` : isZh ? "等待价格数据" : "Awaiting Price Data", marketVerified ? "positive" : "")}
			${row(isZh ? "分析质量" : "Analysis Quality", marketCandles ? `${isZh ? "初步 OHLC 输入" : "Preliminary OHLC Input"} · ${marketCandles.candles.length}` : hasChart ? isZh ? "图表背景" : "Chart Context" : isZh ? "需要数据" : "Data Required")}
          </div>
        </article>
        <article class="analysis-module mtf-module">
          <div class="analysis-module-title"><h2>${isZh ? "多周期一致性" : "Multi-Timeframe Alignment"}</h2></div>
          <div class="mtf-grid">${["D1", "H4", "H1", "M15"].map((tf) => `<div><span>${tf}</span><strong>${isZh ? "等待数据" : "Awaiting Data"}</strong></div>`).join("")}</div>
          ${row(isZh ? "整体一致性" : "Overall Alignment", isZh ? "等待数据" : "Awaiting Data")}
		  <p class="module-note">${marketCandles ? isZh ? "已验证 OHLC 已载入；多周期分析引擎尚未启用。" : "Verified OHLC is loaded; the multi-timeframe analysis engine is not active yet." : isZh ? "连接已验证市场数据后，JARVIS 才能比较各周期。" : "Connect verified market data before JARVIS compares timeframes."}</p>
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
	const S8_SCORING_WEIGHTS = {
		trendAlignment: 20,
		marketStructure: 20,
		liquidityContext: 15,
		volatilitySuitability: 10,
		setupConfirmation: 15,
		riskRewardQuality: 10,
		macroRisk: 5,
		newsRisk: 5
	};
	function s8Escape(value = "") {
		return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
	}
	function s8RankedOpportunities() {
		return [...state.scannerS8.results].sort((left, right) => right.score - left.score || left.asset.localeCompare(right.asset));
	}
	function s8FilteredOpportunities() {
		const scanner = state.scannerS8;
		const filters = scanner.filters;
		const minimumRR = { Any: 0, "1:1 or higher": 1, "1:1.5 or higher": 1.5, "1:2 or higher": 2, "1:3 or higher": 3 }[filters.minimumRR] || 0;
		return s8RankedOpportunities().filter((item) => {
			if (scanner.category !== "All Markets" && item.category !== scanner.category) return false;
			if (filters.asset !== "All Supported Assets" && item.asset !== filters.asset) return false;
			if (filters.timeframe !== "All" && item.timeframe !== filters.timeframe) return false;
			if (filters.bias !== "All" && item.bias !== filters.bias) return false;
			if (filters.band !== "All" && item.band !== filters.band) return false;
			if (filters.setupType !== "All" && item.setupType !== filters.setupType) return false;
			if (filters.risk !== "All" && item.risk !== filters.risk) return false;
			if (filters.macroRisk !== "All" && item.macroRisk !== filters.macroRisk) return false;
			if (filters.newsRisk !== "All" && item.newsRisk !== filters.newsRisk) return false;
			if (filters.alignment !== "All" && item.alignment !== filters.alignment) return false;
			if (minimumRR > 0) return false;
			return true;
		});
	}
	function s8SelectedOpportunity() {
		const all = s8RankedOpportunities();
		return all.find((item) => item.id === state.scannerS8.selectedOpportunityId) || s8FilteredOpportunities()[0] || all[0];
	}
	function s8Summary(filtered) {
		const counts = { High: 0, Medium: 0, Low: 0, rejected: 0 };
		filtered.forEach((item) => item.score === 0 ? counts.rejected += 1 : counts[item.band] += 1);
		const valid = filtered.filter((item) => item.score > 0);
		const biasWeights = valid.reduce((result, item) => {
			result[item.bias] = (result[item.bias] || 0) + item.score;
			return result;
		}, {});
		const sortedBias = Object.entries(biasWeights).sort((left, right) => right[1] - left[1]);
		const overallBias = !valid.length ? "Insufficient Data" : sortedBias.length > 1 && sortedBias[0][1] < sortedBias[1][1] * 1.25 ? "Mixed" : sortedBias[0][0];
		return { ...counts, valid: valid.length, scanned: filtered.length, overallBias };
	}
	function s8SelectControl(id, label, values, selected) {
		return `<label class="s8-filter"><span>${label}</span><select id="${id}" aria-label="${label}">${values.map((value) => `<option value="${value}" ${value === selected ? "selected" : ""}>${value}</option>`).join("")}</select></label>`;
	}
	function s8QualityBadge(value) {
		return `<span class="s8-badge s8-quality">${value}</span>`;
	}
	function s8StatusBadge(value) {
		return `<span class="s8-badge status-${value.toLowerCase().replace(/\s+/g, "-")}">${value}</span>`;
	}
	function s8OpportunityRow(item, rank) {
		return `<button class="s8-opportunity-row ${item.id === state.scannerS8.selectedOpportunityId ? "is-selected" : ""}" type="button" data-s8-opportunity="${item.id}" aria-pressed="${item.id === state.scannerS8.selectedOpportunityId}">
			<span class="s8-rank">${rank}</span><span class="s8-asset"><strong>${item.asset}</strong><small>${item.market}</small></span>
			<span><strong>${item.setupType}</strong><small>${item.timeframe} · ${item.alignment}</small></span>
			<span class="s8-score"><strong>${item.score}/100</strong><i style="--score:${item.score}%"></i><small>${item.band} Setup Quality</small></span>
			<span>${item.bias}<small>${item.risk} Risk</small></span>
			<span>${item.rr}<small>${item.confirmation}</small></span>
			<span>${s8QualityBadge(item.dataQuality)}<small>View Setup</small></span>
		</button>`;
	}
	function s8Price(value, asset) {
		if (!Number.isFinite(Number(value))) return "Exact level unavailable";
		const precision = asset === "XAUUSD" ? 2 : asset === "BTCUSD" ? 2 : asset?.includes("JPY") ? 3 : 5;
		return Number(value).toLocaleString("en-US", { minimumFractionDigits: precision, maximumFractionDigits: precision });
	}
	function s8EntryZone(item) {
		if (!item?.entryZone || !Number.isFinite(Number(item.entryZone.low)) || !Number.isFinite(Number(item.entryZone.high))) return "Exact level unavailable";
		return `${s8Price(item.entryZone.low, item.asset)} – ${s8Price(item.entryZone.high, item.asset)}`;
	}
	function s8ScoreLine(label, key, item) {
		const maximum = S8_SCORING_WEIGHTS[key];
		const value = item.components[key] || 0;
		return `<div class="s8-score-line"><span>${label}</span><div><i style="--score:${value / maximum * 100}%"></i></div><strong>${value}/${maximum}</strong></div>`;
	}
	function s8Checklist(item) {
		const checks = [
			["Higher timeframe aligned", item.components.trendAlignment >= 15 ? "Confirmed" : item.components.trendAlignment >= 8 ? "Waiting" : "Failed"],
			["Selected timeframe structure valid", item.components.marketStructure >= 14 ? "Confirmed" : item.components.marketStructure > 0 ? "Waiting" : "Unavailable"],
			["Liquidity context valid", item.components.liquidityContext >= 10 ? "Confirmed" : item.components.liquidityContext > 0 ? "Waiting" : "Unavailable"],
			["Entry zone defined", item.tradePlan ? "Confirmed" : "Unavailable"], ["Invalidation defined", item.tradePlan ? "Confirmed" : "Unavailable"], ["RR acceptable", item.tradePlan ? "Confirmed" : "Unavailable"],
			["Macro window clear", "Unavailable"], ["News risk clear", "Unavailable"],
			["Volatility suitable", item.components.volatilitySuitability >= 6 ? "Confirmed" : item.components.volatilitySuitability > 0 ? "Waiting" : "Unavailable"],
			["Final confirmation complete", item.hardReject ? "Failed" : item.components.setupConfirmation >= 13 ? "Confirmed" : "Waiting"]
		];
		return checks.map(([label, status]) => `<li><span>${label}</span>${s8StatusBadge(status)}</li>`).join("");
	}
	function s8SavedScansMarkup() {
		const scans = state.scannerS8.savedScans;
		if (!scans.length) return `<p class="s8-muted">No saved scan criteria yet. Saved scans never present old results as current opportunities.</p>`;
		return `<div class="s8-saved-list">${scans.map((scan) => `<div><span><strong>${s8Escape(scan.name)}</strong><small>Criteria only · ${s8Escape(scan.savedAt)}</small></span><button type="button" data-s8-load-scan="${scan.id}">Load</button><button type="button" data-s8-rename-scan="${scan.id}">Rename</button><button type="button" data-s8-delete-scan="${scan.id}">Delete</button></div>`).join("")}</div>`;
	}
	function opportunityScannerPageContent() {
		const scanner = state.scannerS8;
		const marketFoundationReady = scanner.marketsCompleted > 0;
		const filtered = s8FilteredOpportunities();
		const selected = s8SelectedOpportunity();
		const summary = s8Summary(filtered);
		const supportedAssets = [...new Set((state.marketData.symbols || []).filter((item) => item.supported).map((item) => item.symbol).concat(scanner.results.map((item) => item.asset)))];
		const overviewPoints = scanner.marketOverview?.points || ["Run a scan to evaluate verified D1, H4 and H1 candles.", "Macro risk: unavailable, never treated as clear.", "News risk: unavailable, never treated as safe."];
		const categories = ["All Markets", "Forex", "Gold", "Crypto", "Stocks", "Indices", "Commodities"];
		const scanSteps = ["Checking market data...", "Analysing multi-timeframe trend...", "Reading market structure...", "Evaluating liquidity...", "Checking volatility...", "Checking macro risk...", "Checking news risk...", "Ranking valid opportunities..."];
		return `
	<section class="s8-scanner-page">
	  <header class="s8-page-head">
	    <div><span class="s8-kicker">MULTI-MARKET DECISION SUPPORT</span><h1>Opportunity Scanner</h1><p>JARVIS scans supported markets to identify opportunities worth deeper analysis.</p></div>
	    <div class="s8-head-actions"><div><span>Last Scan <strong>${scanner.lastSuccessfulScan}</strong></span><span>${s8StatusBadge(scanner.isScanning ? "Scanning" : scanner.error ? "Scan Failed" : "Partial Scan")}</span></div><button id="runS8Scan" type="button" ${scanner.isScanning ? "disabled" : ""}>${scanner.isScanning ? "Scanning..." : "Run New Scan"}</button></div>
	  </header>
	  <section class="s8-source-notice"><div><strong>${marketFoundationReady ? "Deterministic Scanner · Verified Candle Input" : "Scanner Data Unavailable"}</strong><p>${marketFoundationReady ? "Rankings use verified multi-timeframe candles. Opportunity Score measures setup quality, not win rate." : "Run a scan to check supported markets. No opportunity is generated without valid candle data and structure."}</p></div>${s8QualityBadge(marketFoundationReady ? scanner.dataStatus : "Unavailable")}</section>
	  ${scanner.error ? `<section class="s8-error" role="alert"><div><strong>The opportunity scan could not be completed.</strong><p>${s8Escape(scanner.errorMessage || "Your filters and previous completed results have been preserved.")}</p><small>Market data status is reported by the shared provider. Macro and News remain unavailable.</small></div><button id="retryS8Scan" type="button">Retry</button></section>` : ""}
	  ${scanner.isScanning ? `<section class="s8-loading" role="status" aria-live="polite"><div class="s8-orbit"><i></i></div><div><strong>JARVIS is scanning supported markets...</strong>${scanSteps.map((step, index) => `<span class="${index <= scanner.scanStep ? "active" : ""}">${step}</span>`).join("")}</div></section>` : ""}
	  <section class="s8-scan-status">
	    <div><span>Scan State</span><strong>${scanner.isScanning ? "Scanning" : scanner.error ? "Scan Failed" : scanner.scanState === "partial" ? "Partial Scan Completed" : scanner.scanState === "completed" ? "Completed" : "Ready"}</strong><small>Deterministic Multi-Timeframe Scan</small></div>
	    <div><span>Markets Requested</span><strong>${scanner.marketsRequested || 5}</strong><small>Central supported-symbol registry</small></div>
	    <div><span>Markets Completed</span><strong>${scanner.marketsCompleted}</strong><small>${marketFoundationReady ? "Verified candle inputs" : "No verified inputs"}</small></div>
	    <div><span>Markets Unavailable</span><strong>${scanner.marketsUnavailable ?? 0}</strong><small>${scanner.marketsPartial || 0} partial · ${marketFoundationReady ? "Provider results preserved" : "Market source unavailable"}</small></div>
	    <div><span>Data Freshness</span><strong>${marketFoundationReady ? "Provider Timestamp" : "Unavailable"}</strong><small>${scanner.marketDataTimestamp || "No live timestamp"}</small></div>
	    <div><span>Data Quality</span><strong>${scanner.dataStatus}</strong><small>Macro + News contribute 0 until connected</small></div>
	  </section>
	  <nav class="s8-category-filters" aria-label="Market categories">${categories.map((category) => `<button type="button" class="${scanner.category === category ? "active" : ""}" data-s8-category="${category}">${category}</button>`).join("")}</nav>
	  <details class="s8-advanced">
	    <summary>Advanced Filters <span>Asset, timeframe, setup, risk and alignment</span></summary>
	    <div class="s8-filter-grid">
	      ${s8SelectControl("s8Asset", "Asset", ["All Supported Assets", ...supportedAssets], scanner.filters.asset)}
	      ${s8SelectControl("s8Timeframe", "Timeframe", ["All", "D1", "H4", "H1", "M15"], scanner.filters.timeframe)}
	      ${s8SelectControl("s8Bias", "Bias", ["All", "Bullish", "Bearish", "Neutral", "Mixed"], scanner.filters.bias)}
	      ${s8SelectControl("s8Band", "Probability Band", ["All", "High", "Medium", "Low", "No Valid Setup"], scanner.filters.band)}
	      ${s8SelectControl("s8SetupType", "Setup Type", ["All", "Breakout", "Pullback", "Bullish Pullback", "Bearish Continuation", "Reversal Watch", "Range Break", "Liquidity Sweep", "Consolidation Break", "No Valid Setup"], scanner.filters.setupType)}
	      ${s8SelectControl("s8Risk", "Risk Level", ["All", "Low", "Moderate", "High", "Extreme"], scanner.filters.risk)}
	      ${s8SelectControl("s8MinimumRR", "Minimum Risk/Reward", ["Any", "1:1 or higher", "1:1.5 or higher", "1:2 or higher", "1:3 or higher"], scanner.filters.minimumRR)}
	      ${s8SelectControl("s8MacroRisk", "Macro Risk", ["All", "Clear", "Moderate", "High", "Unavailable"], scanner.filters.macroRisk)}
	      ${s8SelectControl("s8NewsRisk", "News Risk", ["All", "Clear", "Moderate", "High", "Unavailable"], scanner.filters.newsRisk)}
	      ${s8SelectControl("s8Alignment", "Alignment", ["All", "Fully Aligned", "Partially Aligned", "Conflicting", "Awaiting Data"], scanner.filters.alignment)}
	      <div class="s8-filter-actions"><button id="applyS8Filters" type="button">Apply Filters</button><button id="resetS8Filters" type="button">Reset Filters</button></div>
	    </div>
	  </details>
	  <section class="s8-summary" aria-label="Opportunity summary">
	    <article><span>High Setup Quality</span><strong>${summary.High}</strong><small>Score ${scanner.settings.highThreshold}–100</small></article>
	    <article><span>Medium Setup Quality</span><strong>${summary.Medium}</strong><small>Score ${scanner.settings.mediumThreshold}–${scanner.settings.highThreshold - 1}</small></article>
	    <article><span>Low Setup Quality</span><strong>${summary.Low}</strong><small>Score 1–${scanner.settings.mediumThreshold - 1}</small></article>
	    <article><span>Watchlist Matches</span><strong>Unavailable</strong><small>Watchlist integration unavailable</small></article>
	    <article><span>Overall Market Bias</span><strong>${scanner.marketOverview?.overallBias || summary.overallBias}</strong><small>Weighted valid scan results</small></article>
	    <article><span>Valid / Rejected</span><strong>${scanner.validSetups} / ${scanner.rejectedSetups}</strong><small>${scanner.marketsRequested} requested markets</small></article>
	  </section>
	  ${filtered.length ? `
	  <section class="s8-primary-grid">
	    <article class="s8-panel s8-top-opportunities"><div class="s8-section-head"><div><span>DETERMINISTIC RANKING</span><h2>Top Opportunities</h2></div><small>Opportunity Score is setup quality, not win rate.</small></div><div class="s8-table-head"><span>#</span><span>Asset</span><span>Setup</span><span>Score</span><span>Bias / Risk</span><span>RR / Confirmation</span><span>Quality</span></div><div class="s8-opportunity-list">${filtered.map((item, index) => s8OpportunityRow(item, index + 1)).join("")}</div></article>
	    <div class="s8-overview-stack">
	      <article class="s8-panel"><div class="s8-section-head"><div><span>JARVIS VIEW</span><h2>AI Market Overview</h2></div></div><ul class="s8-points">${overviewPoints.map((point) => `<li>${s8Escape(point)}</li>`).join("")}</ul></article>
	      <article class="s8-panel s8-distribution"><div class="s8-section-head"><div><span>CURRENT RESULTS</span><h2>Opportunity Distribution</h2></div></div><div class="s8-donut" style="--high:${summary.scanned ? summary.High / summary.scanned * 100 : 0}%;--medium:${summary.scanned ? (summary.High + summary.Medium) / summary.scanned * 100 : 0}%"><strong>${summary.valid}</strong><small>Valid</small></div><ul><li><i class="high"></i>High <strong>${summary.High}</strong></li><li><i class="medium"></i>Medium <strong>${summary.Medium}</strong></li><li><i class="low"></i>Low <strong>${summary.Low}</strong></li><li><i class="rejected"></i>Rejected <strong>${summary.rejected}</strong></li></ul></article>
	      <article class="s8-panel"><div class="s8-section-head"><div><span>EXECUTION WINDOW</span><h2>Best Time to Act</h2></div></div><strong class="s8-caution">Insufficient Data</strong><p class="s8-muted">Wait for verified market data, event timing and structure confirmation. No timing forecast is available.</p></article>
	      <article class="s8-panel"><div class="s8-section-head"><div><span>SUPPORTED METRIC</span><h2>Most Active Markets</h2></div></div><div class="s8-active-markets">${filtered.slice(0, 4).map((item) => `<span><strong>${item.asset}</strong><small>${item.activeMetric}</small></span>`).join("")}</div></article>
	    </div>
	  </section>
	  <section class="s8-analysis-grid">
	    <article class="s8-panel s8-heatmap"><div class="s8-section-head"><div><span>CURRENT SCAN RESULTS</span><h2>Opportunity Heatmap</h2></div><small>Text labels accompany colour.</small></div><div class="s8-heatmap-grid">${["Forex", "Gold", "Crypto", "Stocks", "Indices", "Commodities"].map((category) => `<div><h3>${category}</h3>${filtered.filter((item) => item.category === category).map((item) => `<button type="button" data-s8-opportunity="${item.id}" class="band-${item.band.toLowerCase().replace(/\s+/g, "-")}"><span>${item.asset}</span><strong>${item.score}</strong><small>${item.band} · ${item.bias} · ${item.dataQuality}</small></button>`).join("") || `<p>No supported result</p>`}</div>`).join("")}</div></article>
	    <div class="s8-preview-stack">
	      <article class="s8-panel s8-setup-preview"><div class="s8-section-head"><div><span>SELECTED OPPORTUNITY</span><h2>AI Setup Preview</h2></div>${s8QualityBadge(selected.dataQuality)}</div><div class="s8-preview-title"><div><strong>${selected.asset}</strong><span>${selected.market} · ${selected.timeframe}</span></div>${s8StatusBadge(selected.band + " Setup Quality")}</div><div class="s8-preview-grid">
	        <span>Setup Type<strong>${selected.setupType}</strong></span><span>Market Bias<strong>${selected.bias}</strong></span><span>Market Mode<strong>${selected.marketMode}</strong></span><span>Trend<strong>${selected.trend}</strong></span><span>Alignment<strong>${selected.alignment}</strong></span><span>Score<strong>${selected.score}/100</strong></span>
	        <span>Entry Zone<strong>${s8EntryZone(selected)}</strong></span><span>Stop Loss<strong>${s8Price(selected.stopLoss, selected.asset)}</strong></span><span>Take Profit 1–3<strong>${selected.tradePlan ? `${s8Price(selected.takeProfit1, selected.asset)} / ${s8Price(selected.takeProfit2, selected.asset)} / ${s8Price(selected.takeProfit3, selected.asset)}` : "Exact levels unavailable"}</strong></span><span>Risk / Reward<strong>${selected.rr}</strong></span><span>Invalidation<strong>${selected.invalidationContext}</strong></span><span>Confirmation<strong>${selected.confirmation}</strong></span>
	      </div><div class="s8-preview-note"><p><strong>Main Factor:</strong> ${selected.mainFactor}</p><p><strong>Main Risk:</strong> ${selected.mainRisk}</p><p><strong>Analysis Source:</strong> ${selected.analysisSource || "Deterministic Scanner"} · ${scanner.marketDataTimestamp || "Timestamp unavailable"}</p></div></article>
	      <article class="s8-panel s8-score-breakdown"><div class="s8-section-head"><div><span>DOCUMENTED WEIGHTS</span><h2>Opportunity Score Breakdown</h2></div><strong>${selected.score}/100</strong></div>${s8ScoreLine("Trend Alignment", "trendAlignment", selected)}${s8ScoreLine("Market Structure", "marketStructure", selected)}${s8ScoreLine("Liquidity Context", "liquidityContext", selected)}${s8ScoreLine("Volatility Suitability", "volatilitySuitability", selected)}${s8ScoreLine("Setup Confirmation", "setupConfirmation", selected)}${s8ScoreLine("Risk / Reward Quality", "riskRewardQuality", selected)}${s8ScoreLine("Macro Risk", "macroRisk", selected)}${s8ScoreLine("News Risk", "newsRisk", selected)}<div class="s8-penalty"><strong>Data completeness: ${selected.dataCompleteness || selected.dataQuality}</strong><span>Missing: ${(selected.missingFactors || ["Macro", "News"]).join(", ")}.</span><span>Penalties: ${selected.tradePlan ? "RR verified from deterministic plan" : "RR 0/10"}, Macro 0/5, News 0/5${selected.dataQualityPenalty ? `, Data quality -${selected.dataQualityPenalty}` : ""}.</span><span>Hard rejection: ${selected.hardReject ? "Yes · " + selected.rejectionReason : "No"}</span></div></article>
	      <article class="s8-panel s8-confirmation"><div class="s8-section-head"><div><span>SCANNER LOGIC</span><h2>Confirmation Checklist</h2></div></div><ul>${s8Checklist(selected)}</ul></article>
	      <article class="s8-panel s8-risk-context"><div class="s8-section-head"><div><span>CAPITAL PROTECTION</span><h2>Risk Context</h2></div>${s8StatusBadge(selected.hardReject ? "Extreme" : "High")}</div><div class="s8-risk-grid"><span>Market Data Risk<strong>${selected.dataQuality === "Verified" ? "Low" : "High"}</strong></span><span>Structure Risk<strong>${selected.components.marketStructure >= 14 ? "Moderate" : "High"}</strong></span><span>Liquidity Risk<strong>${selected.components.liquidityContext >= 10 ? "Moderate" : "High"}</strong></span><span>Volatility Risk<strong>${selected.risk}</strong></span><span>Macro Risk<strong>Insufficient Data</strong></span><span>News Risk<strong>Insufficient Data</strong></span><span>Execution Risk<strong>High</strong></span><span>Overall Risk<strong>${selected.hardReject ? "Extreme" : "High"}</strong></span></div><p>Opportunity Score supports review; it is not a trading decision. Verify execution conditions, macro and news before acting.</p></article>
	    </div>
	  </section>` : `<section class="s8-empty"><strong>${scanner.scanState === "ready" ? "Run a scan to analyse supported markets." : "No opportunities match the selected criteria."}</strong><p>No fabricated opportunities were added. Try a wider filter or run a new scan.</p><div><button id="emptyResetS8Filters" type="button">Reset Filters</button><button id="lowerS8MinimumScore" type="button">Lower Minimum Score</button><button id="emptyRunS8Scan" type="button">Run New Scan</button></div></section>`}
	  <section class="s8-control-grid">
	    <details class="s8-panel s8-custom-scan"><summary><span><strong>Custom Scan</strong><small>Create criteria using the same deterministic scanner model.</small></span><b>Configure</b></summary><div><label>Minimum Score<input id="s8CustomMinimumScore" type="number" min="0" max="100" value="${scanner.settings.mediumThreshold}"></label><label>Maximum Risk<select id="s8CustomMaximumRisk"><option>Moderate</option><option selected>High</option><option>Extreme</option></select></label><label><input id="s8CustomWatchlist" type="checkbox"> Watchlist only (unavailable)</label><button id="runS8CustomScan" type="button">Run Custom Scan</button><p class="s8-form-message">${scanner.message}</p></div></details>
	    <details class="s8-panel s8-scan-settings"><summary><span><strong>Scan Settings</strong><small>Scanner-specific thresholds and data rules.</small></span><b>Settings</b></summary><div><label>High threshold<input id="s8HighThreshold" type="number" min="51" max="100" value="${scanner.settings.highThreshold}"></label><label>Medium threshold<input id="s8MediumThreshold" type="number" min="1" max="99" value="${scanner.settings.mediumThreshold}"></label><label>Freshness tolerance<select id="s8FreshnessTolerance"><option ${scanner.settings.freshnessTolerance === "15 minutes" ? "selected" : ""}>15 minutes</option><option ${scanner.settings.freshnessTolerance === "30 minutes" ? "selected" : ""}>30 minutes</option><option ${scanner.settings.freshnessTolerance === "60 minutes" ? "selected" : ""}>60 minutes</option></select></label><label><input id="s8IncludeMacro" type="checkbox" ${scanner.settings.includeMacro ? "checked" : ""}> Include macro filter</label><label><input id="s8IncludeNews" type="checkbox" ${scanner.settings.includeNews ? "checked" : ""}> Include news filter</label><button id="saveS8Settings" type="button">Save Settings</button></div></details>
	    <details class="s8-panel s8-saved-scans"><summary><span><strong>Saved Scans</strong><small>Criteria only, never stale results.</small></span><b>${scanner.savedScans.length} Saved</b></summary><div class="s8-save-row"><input id="s8SaveName" maxlength="40" placeholder="Scan name" aria-label="Saved scan name"><button id="saveS8Scan" type="button">Save Current Scan</button></div>${s8SavedScansMarkup()}</details>
	  </section>
	  ${filtered.length ? `<section class="s8-handoff-grid"><article><div><span>ASK JARVIS ABOUT THIS OPPORTUNITY</span><h3>Discuss ${selected.asset} with honest context</h3><p>Carry the deterministic score, missing inputs, checklist and risk into the current conversation.</p></div><button id="askJarvisAboutS8" type="button">Ask JARVIS</button></article><article><div><span>OPEN IN AI ANALYSIS</span><h3>Continue deeper analysis</h3><p>Add Scanner context without overwriting verified AI Analysis information.</p></div><button id="openS8InAnalysis" type="button">Open in AI Analysis</button></article></section>` : ""}
	</section>`;
	}
	function macroActiveTimezone() {
		try {
			return Intl.DateTimeFormat().resolvedOptions().timeZone || "Timezone not confirmed";
		} catch {
			return "Timezone not confirmed";
		}
	}
	function macroCurrentDate() {
		try {
			return new Intl.DateTimeFormat(state.jarvis.language === "zh" ? "zh-CN" : "en-GB", {
				weekday: "short",
				day: "2-digit",
				month: "short",
				year: "numeric"
			}).format(/* @__PURE__ */ new Date());
		} catch {
			return "Date unavailable";
		}
	}
	function macroFilteredEvents() {
		const filters = state.macroS6;
		return filters.events.filter((event) => {
			const dateMatch = filters.dateRange === "Custom Range" ? false : filters.dateRange === "Next Week" ? false : event.dateRange === filters.dateRange || filters.dateRange === "This Week" && ["Today", "Tomorrow", "This Week"].includes(event.dateRange);
			return dateMatch && (filters.impact === "All" || event.impact === filters.impact) && (filters.currency === "All" || event.currency === filters.currency) && (filters.category === "All" || event.category === filters.category);
		});
	}
	function macroDisplayValue(value, unit, fallback = "Unavailable") {
		return value == null ? fallback : `${value}${unit || ""}${state.macroS6.dataStatus === "Demo" ? " (Demo)" : ""}`;
	}
	function macroTitleCase(value) {
		return String(value || "Unavailable").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
	}
	function mapMacroApiEvent(event) {
		const isUpcoming = event.releaseStatus === "upcoming";
		const interpretation = event.interpretation || {};
		return {
			id: event.id,
			dateRange: event.dateRange || "Today",
			time: event.scheduledAt ? new Intl.DateTimeFormat("en-GB", { timeZone: macroActiveTimezone(), hour: "2-digit", minute: "2-digit" }).format(new Date(event.scheduledAt)) : "Timing unavailable",
			currency: event.currency,
			region: event.country || "Region unavailable",
			impact: macroTitleCase(event.impact),
			category: macroTitleCase(event.category),
			name: event.title,
			previous: macroDisplayValue(event.previous, event.unit),
			forecast: macroDisplayValue(event.forecast, event.unit),
			actual: macroDisplayValue(event.actual, event.unit, isUpcoming ? "Awaiting Release" : "Unavailable"),
			revision: macroDisplayValue(event.revisedPrevious, event.unit),
			status: macroTitleCase(event.releaseStatus),
			quality: macroTitleCase(event.dataStatus),
			explanation: event.dataStatus === "demo" ? "A sample macro event used only to demonstrate the Macro Intelligence workflow." : "Verified event detail supplied by the connected macro provider.",
			whyMonitored: `${event.currency} ${macroTitleCase(event.category)} data may affect policy expectations and related markets; reaction still requires confirmation.`,
			surprise: macroTitleCase(interpretation.surprise),
			interpretation: interpretation.interpretation || "Interpretation unavailable",
			assets: (event.affectedAssets || []).map((entry) => entry.asset),
			raw: event
		};
	}
	function macroSelectedEvent() {
		const filtered = macroFilteredEvents();
		return filtered.find((event) => event.id === state.macroS6.selectedEventId) || filtered[0] || null;
	}
	function macroSelectControl(id, label, values, selected) {
		return `<label class="s6-filter"><span>${label}</span><select id="${id}" aria-label="${label}">${values.map((value) => `<option value="${value}" ${value === selected ? "selected" : ""}>${value}</option>`).join("")}</select></label>`;
	}
	function macroQualityTag(value = "Unavailable") {
		return `<span class="s6-quality quality-${value.toLowerCase().replace(/\s+/g, "-")}">${value}</span>`;
	}
	function macroImpactTag(value) {
		return `<span class="s6-impact impact-${value.toLowerCase()}"><i></i>${value} Impact</span>`;
	}
	function macroEventCard(event, selected) {
		return `<button type="button" class="s6-event-card ${selected ? "is-selected" : ""}" data-macro-event="${event.id}" aria-pressed="${selected}">
			<span class="s6-event-time">${event.time}<small>${event.currency} · ${event.region}</small></span>
			<span class="s6-event-name"><strong>${event.name}</strong><small>${event.category}</small></span>
			${macroImpactTag(event.impact)}
			<span class="s6-event-value"><small>Previous</small>${event.previous}</span>
			<span class="s6-event-value"><small>Forecast</small>${event.forecast}</span>
			<span class="s6-event-value"><small>Actual</small>${event.actual}</span>
			<span class="s6-release release-${event.status.toLowerCase()}">${event.status}</span>
			${macroQualityTag(event.quality)}
		</button>`;
	}
	function macroLoadingState() {
		const steps = [
			"Loading economic calendar...",
			"Checking event status...",
			"Updating released values...",
			"Interpreting market impact...",
			"Building macro summary..."
		];
		return `<section class="s6-loading" role="status" aria-live="polite"><div class="s6-orbit"><i></i></div><div><strong>JARVIS is updating macro intelligence...</strong>${steps.map((step, index) => `<span class="${index <= state.macroS6.refreshStep ? "active" : ""}">${index < state.macroS6.refreshStep ? "✓" : "•"} ${step}</span>`).join("")}</div></section>`;
	}
	function macroErrorState() {
		return `<section class="s6-error" role="alert"><div><strong>Macro data is temporarily unavailable.</strong><p>Connection interrupted. Your filters have been preserved.</p><small>Data status: Not Connected · Last successful update: ${state.macroS6.lastSuccessfulUpdate}</small></div><button type="button" id="retryMacroData">Retry</button></section>`;
	}
	function macroIntelligencePageContent() {
		const macro = state.macroS6;
		const timezone = macroActiveTimezone();
		const events = macroFilteredEvents();
		const selected = macroSelectedEvent();
		const highImpactCount = events.filter((event) => event.impact === "High").length;
		const affectedAssets = selected?.assets || [];
		return `
    <section class="approved-workspace s6-macro-page">
	  <header class="s6-page-head">
		<div><span class="s6-kicker">REAL-TIME INSTITUTIONAL INTELLIGENCE</span><h1>Macro Pulse</h1><p>Real-time institutional intelligence and volatility forecasting for global economic catalysts.</p></div>
		<div class="s6-head-actions"><div><small>${macroCurrentDate()}</small><span>${macroQualityTag("Unavailable")} Data Source Not Connected</span><small>Last updated: No verified update</small></div><button type="button" id="refreshMacroData" ${macro.isRefreshing ? "disabled" : ""}>${macro.isRefreshing ? "Updating..." : "Refresh Macro Data"}</button></div>
	  </header>

	  <section class="s6-data-status" aria-label="Macro data status">
		<div><span>Economic Calendar</span><strong>Not Connected</strong><small>Verified provider required</small></div>
		<div><span>Macro Data</span><strong>Not Connected</strong><small>No live releases</small></div>
		<div><span>Last Successful Update</span><strong>Unavailable</strong><small>No verified update</small></div>
		<div><span>Data Delay</span><strong>Unavailable</strong><small>Cannot be calculated</small></div>
		<div><span>Supported Currencies</span><strong>USD · EUR · GBP · JPY</strong><small>AUD · CAD · CHF · CNY</small></div>
	  </section>
	  <div class="s6-source-notice"><strong>Verified macro source not connected.</strong><span>The sample records below are clearly labelled Demo Data and are not real upcoming events.</span></div>

	  <section class="s6-filter-bar" aria-label="Macro filters">
		${macroSelectControl("macroDateRange", "Date Range", ["Today", "Tomorrow", "This Week", "Next Week", "Custom Range"], macro.dateRange)}
		${macroSelectControl("macroImpact", "Impact", ["All", "High", "Medium", "Low"], macro.impact)}
		${macroSelectControl("macroCurrency", "Currency", ["All", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY"], macro.currency)}
		${macroSelectControl("macroCategory", "Category", ["All", "Inflation", "Employment", "Growth", "Central Bank", "Consumer", "Manufacturing", "Housing", "Energy", "Other"], macro.category)}
		<div class="s6-filter-actions"><button type="button" id="resetMacroFilters">Reset Filters</button><button type="button" id="refreshMacroFilters" ${macro.isRefreshing ? "disabled" : ""}>Refresh Data</button></div>
	  </section>
	  ${macro.dateRange === "Custom Range" ? `<p class="s6-custom-note">Custom Range requires verified event dates. No demo date is assumed.</p>` : ""}
	  ${macro.isRefreshing ? macroLoadingState() : macro.error ? macroErrorState() : ""}

	  <section class="s6-risk-summary">
		<div><span>High-Impact Events</span><strong>${events.length ? highImpactCount : "Unavailable"}</strong><small>${events.length ? "Demo records only" : "No matching records"}</small></div>
		<div><span>Highest-Risk Currency</span><strong>${events.find((event) => event.impact === "High")?.currency || "Unavailable"}</strong><small>Demo context</small></div>
		<div><span>Next Major Event</span><strong>${events.find((event) => event.status === "Upcoming")?.name || "Unavailable"}</strong><small>Event timing unavailable</small></div>
		<div><span>Risk Window</span><strong>Data Unavailable</strong><small>Timezone: ${timezone}</small></div>
		<div><span>Suggested Caution</span><strong>Monitor Only</strong><small>Verify before acting</small></div>
	  </section>

	  <section class="s6-calendar-module">
		<div class="s6-section-head"><div><span>ECONOMIC CALENDAR</span><h2>Event Calendar</h2></div><div>${macroQualityTag("Demo")}<span>${events.length} matching record${events.length === 1 ? "" : "s"}</span></div></div>
		${events.length ? `<div class="s6-calendar-head"><span>Time / Currency</span><span>Event</span><span>Impact</span><span>Previous</span><span>Forecast</span><span>Actual</span><span>Status</span><span>Quality</span></div><div class="s6-event-list">${events.map((event) => macroEventCard(event, selected?.id === event.id)).join("")}</div>` : `<div class="s6-empty"><strong>No macro events match the selected filters.</strong><p>${["Not Connected", "Demo"].includes(macro.dataStatus) ? "Verified macro source not connected." : "Change the current filter combination."}</p><div><button type="button" id="emptyResetMacroFilters">Reset Filters</button><button type="button" id="changeMacroDateRange">Change Date Range</button></div></div>`}
	  </section>

	  ${selected ? `<section class="s6-detail-grid">
		<article class="s6-module s6-event-detail"><div class="s6-module-head"><div><span>SELECTED EVENT DETAIL</span><h2>${selected.name}</h2></div>${macroImpactTag(selected.impact)}</div><div class="s6-detail-meta"><span>${selected.currency}</span><span>${selected.region}</span><span>${selected.time}</span><span>Timezone: ${timezone}</span>${macroQualityTag(selected.quality)}</div><div class="s6-values"><div><small>Previous</small><strong>${selected.previous}</strong></div><div><small>Forecast</small><strong>${selected.forecast}</strong></div><div><small>Actual</small><strong>${selected.actual}</strong></div><div><small>Revision</small><strong>${selected.revision}</strong></div></div><p>${selected.explanation}</p><div class="s6-explain"><strong>Why traders monitor this event</strong><p>${selected.whyMonitored}</p></div></article>

		<article class="s6-module s6-interpretation"><div class="s6-module-head"><div><span>ACTUAL VS FORECAST</span><h2>Preliminary Interpretation</h2></div><span class="s6-surprise">${selected.surprise}</span></div><div class="s6-values"><div><small>Actual</small><strong>${selected.actual}</strong></div><div><small>Forecast</small><strong>${selected.forecast}</strong></div><div><small>Previous</small><strong>${selected.previous}</strong></div><div><small>Difference</small><strong>${selected.status === "Released" ? "-0.1 pp (Demo)" : "Data Unavailable"}</strong></div></div><p>${selected.interpretation}</p><small>Higher or lower data is not universally positive. Market reaction depends on event meaning, positioning and broader context.</small></article>
	  </section>

	  <section class="s6-intelligence-grid">
		<article class="s6-module s6-asset-impact"><div class="s6-module-head"><div><span>ASSET IMPACT</span><h2>Potential Sensitivity</h2></div>${macroQualityTag("Preliminary")}</div>${affectedAssets.map((asset, index) => `<div class="s6-impact-row"><strong>${asset}</strong><span>${index < 2 ? "High" : "Moderate"} sensitivity</span><span>${selected.status === "Upcoming" ? "Awaiting Release" : index % 2 ? "Mixed" : "Preliminary Pressure"}</span><span>${index < 2 ? "Low" : "Unavailable"} confidence</span></div>`).join("")}<small>No direction is a Buy or Sell instruction. Verified market reaction is unavailable.</small></article>

		<article class="s6-module"><div class="s6-module-head"><div><span>CURRENT MACRO SENTIMENT</span><h2>Context Map</h2></div>${macroQualityTag("Insufficient Data")}</div>${[["USD Sentiment", "Insufficient Data"], ["Inflation Context", selected.category === "Inflation" ? "Preliminary" : "Insufficient Data"], ["Labour-Market Context", selected.category === "Employment" ? "Preliminary" : "Insufficient Data"], ["Growth Context", selected.category === "Growth" ? "Preliminary" : "Insufficient Data"], ["Rate Expectations", "Insufficient Data"], ["Risk Sentiment", "Mixed"], ["Overall Macro Mode", selected.status === "Upcoming" ? "Awaiting Key Data" : "Mixed Macro Environment"]].map(([label, value]) => `<div class="s6-line"><span>${label}</span><strong>${value}</strong></div>`).join("")}</article>

		<article class="s6-module"><div class="s6-module-head"><div><span>CENTRAL-BANK CONTEXT</span><h2>Policy Context</h2></div>${macroQualityTag("Unavailable")}</div><div class="s6-bank"><strong>Federal Reserve</strong><span>Policy stance: Unavailable</span><span>Recent guidance: Unavailable</span><span>Next decision date: Unavailable</span><span>Market expectation: Unavailable</span></div><p>Verified central-bank source not connected.</p></article>

		<article class="s6-module"><div class="s6-module-head"><div><span>EVENT RISK GUIDANCE</span><h2>Trading Safety</h2></div><span class="s6-risk-level">Insufficient Data</span></div>${[["Pre-event risk", "Monitor"], ["Release volatility risk", selected.impact], ["Spread & liquidity risk", "Unverified"], ["Post-event confirmation", "Required"], ["Suggested wait period", "Unavailable"], ["Overall event risk", "Insufficient Data"]].map(([label, value]) => `<div class="s6-line"><span>${label}</span><strong>${value}</strong></div>`).join("")}<p>Wait for verified information, spread normalisation and structure confirmation before reassessing.</p></article>
	  </section>

	  <section class="s6-conclusion"><div><span>JARVIS MACRO CONCLUSION</span><h2>${selected.impact}-Impact ${selected.currency} ${selected.category} Context <b>·</b> ${affectedAssets[0] || "Market"} Sensitivity <b>·</b> ${selected.status === "Upcoming" ? "Wait" : "Confirmation Required"}</h2></div><div class="s6-conclusion-grid"><span><small>Main Macro Factor</small>${selected.name}</span><span><small>Most Affected Asset</small>${affectedAssets[0] || "Unavailable"}</span><span><small>Main Uncertainty</small>Verified source unavailable</span><span><small>Decision Status</small>${selected.status === "Upcoming" ? "Wait" : "Confirmation Required"}</span></div></section>

	  <section class="s6-handoff-grid"><article><div><span>ASK JARVIS ABOUT THIS EVENT</span><h3>Discuss the selected macro context</h3><p>Carry the event, interpretation, asset sensitivity and risk context into the current conversation.</p></div><button type="button" id="askJarvisAboutMacro">Ask JARVIS</button></article><article><div><span>OPEN IN AI ANALYSIS</span><h3>Add macro context to analysis</h3><p>Transfer a concise preliminary macro context without overwriting market intelligence.</p></div><button type="button" id="openMacroInAnalysis">Open in AI Analysis</button></article></section>` : ""}
	</section>
  `;
	}
	function newsFilteredStories() {
		const filters = state.newsS7;
		return filters.stories.filter((story) => (filters.category === "All" || story.category === filters.category) && (filters.impact === "All Impact" || story.impact === filters.impact) && (filters.time === "Latest" ? story.period === "Latest" : false));
	}
	function mapNewsApiArticle(article, topIds = [], breakingIds = []) {
		const interpretation = article.interpretation || {};
		return {
			id: article.id, headline: article.headline, source: article.sourceName || "Source unavailable",
			published: article.publishedAt ? new Intl.DateTimeFormat("en-GB", { timeZone: macroActiveTimezone(), dateStyle: "medium" }).format(new Date(article.publishedAt)) : "Published time unavailable",
			category: macroTitleCase(article.category), impact: macroTitleCase(article.impact), verification: macroTitleCase(article.verificationStatus), period: "Latest",
			topRank: topIds.indexOf(article.id) + 1, breaking: breakingIds.includes(article.id), summary: article.summary || "Summary unavailable",
			entities: article.entities || [], assets: (article.affectedAssetContext || []).map((entry) => entry.asset), aiSummary: article.aiSummary || ["Summary unavailable"],
			why: interpretation.whyItMatters || "Interpretation unavailable", implication: interpretation.potentialMechanism || "Interpretation unavailable",
			uncertainty: interpretation.mainUncertainty || "Confirmation required", channel: interpretation.potentialMechanism || "Market sentiment",
			relatedIds: (article.relatedNews || []).map((item) => item.id), raw: article
		};
	}
	function newsSelectedStory() {
		const filtered = newsFilteredStories();
		return filtered.find((story) => story.id === state.newsS7.selectedStoryId) || filtered[0] || null;
	}
	function newsBadge(value, kind = "status") {
		return `<span class="s7-badge ${kind}-${value.toLowerCase().replace(/\s+/g, "-")}">${value}</span>`;
	}
	function newsStoryCard(story, variant = "latest") {
		return `<button type="button" class="s7-story-card s7-${variant}-story ${state.newsS7.selectedStoryId === story.id ? "is-selected" : ""}" data-news-story="${story.id}" aria-pressed="${state.newsS7.selectedStoryId === story.id}">
			<div class="s7-story-meta"><span>${story.source}</span><span>${story.published}</span></div>
			<h3>${story.headline}</h3>
			<div class="s7-story-tags">${newsBadge(story.category, "category")}${newsBadge(`${story.impact} Impact`, "impact")}${newsBadge(story.verification, "verification")}</div>
			<p>${story.summary}</p>
			<div class="s7-asset-chips">${story.assets.map((asset) => `<span>${asset}</span>`).join("")}</div>
		</button>`;
	}
	function newsLoadingState() {
		const steps = ["Loading verified sources...", "Checking breaking developments...", "Grouping related stories...", "Assessing market impact...", "Building news intelligence..."];
		return `<section class="s7-loading" role="status" aria-live="polite"><div class="s7-pulse"><i></i></div><div><strong>JARVIS is updating market news...</strong>${steps.map((step, index) => `<span class="${index <= state.newsS7.refreshStep ? "active" : ""}">${index < state.newsS7.refreshStep ? "✓" : "•"} ${step}</span>`).join("")}</div></section>`;
	}
	function newsErrorState() {
		return `<section class="s7-error" role="alert"><div><strong>Market news is temporarily unavailable.</strong><p>Connection interrupted. Your filters have been preserved.</p><small>Data source: Not Connected · Last successful update: ${state.newsS7.lastSuccessfulUpdate}</small></div><button type="button" id="retryNewsUpdate">Retry News Update</button></section>`;
	}
	function economicCalendarPageContent() {
		const news = state.newsS7;
		const timezone = macroActiveTimezone();
		const stories = newsFilteredStories();
		const selected = newsSelectedStory();
		const topStories = stories.filter((story) => story.topRank > 0).sort((a, b) => a.topRank - b.topRank);
		const latestStories = stories.filter((story) => story.topRank === 0);
		const breakingStories = stories.filter((story) => story.breaking && story.verification === "Verified");
		const relatedStories = selected ? selected.relatedIds.map((id) => news.stories.find((story) => story.id === id)).filter(Boolean) : [];
		return `
    <section class="approved-workspace s7-news-page">
	  <header class="s7-page-head">
		<div><span class="s7-kicker">LIVE DATA STREAM</span><h1>Real-Time Terminal</h1><p>Live data stream connected. Analyzing incoming global events.</p></div>
		<div class="s7-head-actions"><div><span>${newsBadge("Unavailable", "verification")} News Source Not Connected</span><small>Last updated: No verified update</small></div><button type="button" id="refreshNewsData" ${news.isRefreshing ? "disabled" : ""}>${news.isRefreshing ? "Updating..." : "Refresh News"}</button></div>
	  </header>

	  <section class="s7-data-status" aria-label="News data status">
		<div><span>News Source Status</span><strong>Not Connected</strong><small>Live news source not connected</small></div>
		<div><span>Last Successful Update</span><strong>Unavailable</strong><small>No verified update</small></div>
		<div><span>Delay Status</span><strong>Unavailable</strong><small>Cannot be calculated</small></div>
		<div><span>Supported Categories</span><strong>Demo Workflow Only</strong><small>No provider coverage confirmed</small></div>
		<div><span>Verification Status</span><strong>Unavailable</strong><small>Timezone: ${timezone}</small></div>
	  </section>
	  <div class="s7-source-notice"><strong>Live news source not connected.</strong><span>Every sample story is marked Demo and has no real publication time, source claim or market reaction.</span></div>

	  <section class="s7-filter-bar" aria-label="News filters">
		<div class="s7-category-scroll" role="group" aria-label="Market category">${["All", "Forex", "Gold", "Crypto", "Stocks", "Economy", "Central Banks", "Geopolitics", "Energy", "AI"].map((category) => `<button type="button" class="${news.category === category ? "active" : ""}" data-news-category="${category}" aria-pressed="${news.category === category}">${category}</button>`).join("")}</div>
		<label><span>Impact</span><select id="newsImpactFilter" aria-label="News impact"><option ${news.impact === "All Impact" ? "selected" : ""}>All Impact</option><option ${news.impact === "High" ? "selected" : ""}>High</option><option ${news.impact === "Medium" ? "selected" : ""}>Medium</option><option ${news.impact === "Low" ? "selected" : ""}>Low</option></select></label>
		<label><span>Time</span><select id="newsTimeFilter" aria-label="News time"><option ${news.time === "Latest" ? "selected" : ""}>Latest</option><option ${news.time === "Today" ? "selected" : ""}>Today</option><option ${news.time === "This Week" ? "selected" : ""}>This Week</option></select></label>
		<button type="button" id="resetNewsFilters">Reset Filters</button>
	  </section>
	  ${news.isRefreshing ? newsLoadingState() : news.error ? newsErrorState() : ""}

	  ${stories.length ? `<section class="s7-primary-grid"><div class="s7-left-column">
		<article class="s7-panel s7-top-stories"><div class="s7-section-head"><div><span>TOP STORIES</span><h2>Curated Demo Scenarios</h2></div>${newsBadge("Demo", "verification")}</div>${topStories.length ? `<div class="s7-top-grid">${topStories.map((story) => newsStoryCard(story, "top")).join("")}</div>` : `<div class="s7-inline-empty">No Top Stories match the selected filters.</div>`}<small>Ordering follows a fixed demo rank. It is not an AI or live-news ranking.</small></article>

		<article class="s7-panel s7-breaking"><div class="s7-section-head"><div><span>BREAKING NEWS</span><h2>Verified Developments</h2></div></div>${breakingStories.length ? breakingStories.map((story) => newsStoryCard(story, "breaking")).join("") : `<div class="s7-no-breaking"><strong>No verified breaking news at this time.</strong><p>A story will appear here only when a connected source identifies a genuinely time-sensitive development.</p></div>`}</article>

		<article class="s7-panel s7-latest"><div class="s7-section-head"><div><span>LATEST NEWS</span><h2>More Demo Scenarios</h2></div><span>${latestStories.length} records</span></div>${latestStories.length ? `<div class="s7-latest-list">${latestStories.map((story) => newsStoryCard(story, "latest")).join("")}</div>` : `<div class="s7-inline-empty">No additional news stories match the selected filters.</div>`}</article></div><div class="s7-right-column">

		<article class="s7-panel s7-selected-detail"><div class="s7-section-head"><div><span>SELECTED NEWS DETAIL</span><h2>${selected.headline}</h2></div>${newsBadge(selected.verification, "verification")}</div><div class="s7-detail-meta"><span>Source: ${selected.source}</span><span>${selected.published}</span><span>Timezone: ${timezone}</span>${newsBadge(selected.category, "category")}${newsBadge(`${selected.impact} Impact`, "impact")}</div><h3>Source Facts</h3><p>${selected.summary}</p><div class="s7-entity-row"><span>Relevant entities</span>${selected.entities.map((entity) => `<b>${entity}</b>`).join("")}</div><div class="s7-asset-chips">${selected.assets.map((asset) => `<span>${asset}</span>`).join("")}</div><small>Source link unavailable. No article text or quotation is reproduced.</small></article>

		<article class="s7-panel s7-ai-summary"><div class="s7-section-head"><div><span>AI SUMMARY</span><h2>JARVIS Summary</h2></div>${newsBadge("Demo", "verification")}</div><ul>${selected.aiSummary.map((item) => `<li>${item}</li>`).join("")}</ul><small>This summary describes a demo scenario, not a verified article.</small></article>

		<article class="s7-panel s7-interpretation"><div class="s7-section-head"><div><span>JARVIS INTERPRETATION</span><h2>Why It May Matter</h2></div>${newsBadge("Preliminary", "verification")}</div><div><strong>Why it matters</strong><p>${selected.why}</p></div><div><strong>Potential implication</strong><p>${selected.implication}</p></div><div><strong>Main uncertainty</strong><p>${selected.uncertainty}</p></div><div><strong>Confirmation required</strong><p>Connect a verified source, confirm the story details, then compare with verified price and structure.</p></div></article></div><div class="s7-impact-grid">

		<article class="s7-panel s7-market-impact"><div class="s7-section-head"><div><span>MARKET IMPACT</span><h2>Impact Framework</h2></div>${newsBadge("Insufficient Data", "verification")}</div>${[["Overall Impact", "Insufficient Data"], ["Impact Horizon", "Unclear"], ["Market Sensitivity", "Unavailable"], ["Transmission Channel", selected.channel], ["Confidence", "Low / Demo"]].map(([label, value]) => `<div class="s7-line"><span>${label}</span><strong>${value}</strong></div>`).join("")}<small>No numeric impact score is used because no defined verified scoring model exists.</small></article>

		<article class="s7-panel s7-affected-assets"><div class="s7-section-head"><div><span>AFFECTED ASSETS</span><h2>Context Candidates</h2></div>${newsBadge("Demo", "verification")}</div>${selected.assets.map((asset) => `<div class="s7-asset-row"><strong>${asset}</strong><span>Unavailable sensitivity</span><span>Awaiting Confirmation</span><span>Low confidence</span><span>${selected.channel}</span><span>Source not connected</span></div>`).join("")}<small>These symbols are demo context candidates, not verified affected assets or trading instructions.</small></article></div>
	  </section>

	  <section class="s7-secondary-grid">
		<article class="s7-panel s7-sentiment"><div class="s7-section-head"><div><span>MARKET SENTIMENT</span><h2>Sentiment Context</h2></div>${newsBadge("Insufficient Data", "verification")}</div>${[["Risk Sentiment", "Insufficient Data"], ["USD Sentiment", "Insufficient Data"], ["Gold Sentiment", "Insufficient Data"], ["Equity Sentiment", "Insufficient Data"], ["Crypto Sentiment", "Insufficient Data"], ["Energy Sentiment", "Insufficient Data"], ["Overall Market Mood", "Uncertain"]].map(([label, value]) => `<div class="s7-line"><span>${label}</span><strong>${value}</strong></div>`).join("")}</article>

		<article class="s7-panel s7-risk"><div class="s7-section-head"><div><span>RISK CONTEXT</span><h2>News Reliability & Reaction</h2></div>${newsBadge("Insufficient Data", "verification")}</div>${[["News Reliability Risk", "High"], ["Market Reaction Risk", "Insufficient Data"], ["Liquidity Risk", "Unavailable"], ["Headline Reversal Risk", "High"], ["Follow-Up Event Risk", "Unavailable"], ["Overall Risk", "Insufficient Data"]].map(([label, value]) => `<div class="s7-line"><span>${label}</span><strong>${value}</strong></div>`).join("")}<p>Initial headline reactions may reverse as additional details become available. Verify first and keep risk controlled.</p></article>

		<article class="s7-panel s7-timeline"><div class="s7-section-head"><div><span>NEWS TIMELINE</span><h2>Developing Story</h2></div></div><div class="s7-no-timeline"><strong>No verified event timeline available.</strong><p>JARVIS will not create artificial updates without connected, related coverage.</p></div></article>

		<article class="s7-panel s7-related"><div class="s7-section-head"><div><span>RELATED NEWS</span><h2>Demo Relationships</h2></div>${newsBadge("Demo", "verification")}</div>${relatedStories.length ? relatedStories.map((story) => `<button type="button" data-news-story="${story.id}"><strong>${story.headline}</strong><span>${story.source} · ${story.published}</span><small>Demo Relationship</small></button>`).join("") : `<div class="s7-inline-empty">No related news available.</div>`}</article>
	  </section>

	  <section class="s7-conclusion"><div><span>JARVIS NEWS CONCLUSION</span><h2>${selected.category} Demo Context <b>·</b> ${selected.assets[0] || "Market"} Verification Required <b>·</b> Preliminary</h2></div><div class="s7-conclusion-grid"><span><small>Main Factor</small>${selected.channel}</span><span><small>Most Affected Asset</small>Unverified (${selected.assets[0] || "Unavailable"} demo)</span><span><small>Main Risk</small>Source not connected</span><span><small>Decision Status</small>Preliminary</span></div></section>

	  <section class="s7-handoff-grid"><article><div><span>ASK JARVIS ABOUT THIS NEWS</span><h3>Discuss the selected news context</h3><p>Carry only concise demo metadata, interpretation, assets and risk context.</p></div><button type="button" id="askJarvisAboutNews">Ask JARVIS</button></article><article><div><span>OPEN IN AI ANALYSIS</span><h3>Add news context to analysis</h3><p>Use the story as an additional preliminary input without replacing technical analysis.</p></div><button type="button" id="openNewsInAnalysis">Open in AI Analysis</button></article></section>` : `<section class="s7-empty"><strong>No news matches the selected filters.</strong><p>Live news source not connected.</p><div><button type="button" id="emptyResetNewsFilters">Reset Filters</button><button type="button" id="changeNewsCategory">Change Category</button><button type="button" id="emptyRefreshNews">Refresh News</button></div></section>`}
	</section>
  `;
	}
	function tradePlannerPageContent(brain) {
		const plannerMarket = state.marketData.planner;
		const quoteStatus = plannerMarket.quote ? `${plannerMarket.quote.provider} · ${plannerMarket.quote.dataStatus} · ${plannerMarket.quote.freshness}` : "Market Data Source Not Connected";
		const metadataStatus = plannerMarket.metadata?.contractMetadataStatus === "verified" ? "Verified" : "Contract specifications unavailable";
		return `
	<section class="approved-workspace">
	  <div class="approved-page-head"><div><h1>Trade Planner</h1><p>Plan before execution · ${quoteStatus}</p></div></div>
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
		  <div class="metric-line"><span>Lot / Position Size</span><b>Position size unavailable — verified symbol specification required.</b></div>
		  <div class="metric-line"><span>Symbol Metadata</span><b>${metadataStatus}</b></div>
		  <div class="metric-line"><span>Risk Amount</span><b>Awaiting valid plan inputs</b></div>
		  <div class="metric-line"><span>Potential Profit</span><b>Awaiting valid plan inputs</b></div>
		  <div class="metric-line"><span>RR</span><b>Awaiting valid plan inputs</b></div>
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
		if (page.querySelector(".ai-analysis-page") && !state.marketData.analysis.loaded && !state.marketData.analysis.loading) {
			window.setTimeout(() => {
				if (state.activePage === "AIAnalysis" && !state.marketData.analysis.loaded && !state.marketData.analysis.loading) runAiAnalysisRefresh();
			}, 0);
		}
		if (page.querySelector(".planner-layout") && !state.marketData.planner.loaded && !state.marketData.planner.loading) {
			window.setTimeout(() => {
				if (state.activePage === "TradePlanner" && !state.marketData.planner.loaded && !state.marketData.planner.loading) loadTradePlannerMarketData();
			}, 0);
		}
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
		bindMacroIntelligenceActions(page);
		bindNewsEventsActions(page);
		bindOpportunityScannerActions(page);
	}
	function bindMacroIntelligenceActions(page) {
		if (!state.macroS6.loaded && !state.macroS6.isRefreshing && !state.macroS6.error) {
			queueMicrotask(() => {
				if (state.activePage === "Macro" && !state.macroS6.loaded && !state.macroS6.isRefreshing) runMacroRefresh({ animate: false });
			});
		}
		const controls = [
			["#macroDateRange", "dateRange"],
			["#macroImpact", "impact"],
			["#macroCurrency", "currency"],
			["#macroCategory", "category"]
		];
		controls.forEach(([selector, key]) => {
			page.querySelector(selector)?.addEventListener("change", (event) => {
				state.macroS6[key] = event.currentTarget.value;
				const first = macroFilteredEvents()[0];
				state.macroS6.selectedEventId = first?.id || "";
				render();
			});
		});
		const resetFilters = () => {
			state.macroS6.dateRange = "Today";
			state.macroS6.impact = "All";
			state.macroS6.currency = "All";
			state.macroS6.category = "All";
			state.macroS6.selectedEventId = "demo-us-inflation-released";
			render();
		};
		page.querySelector("#resetMacroFilters")?.addEventListener("click", resetFilters);
		page.querySelector("#emptyResetMacroFilters")?.addEventListener("click", resetFilters);
		page.querySelector("#changeMacroDateRange")?.addEventListener("click", () => {
			state.macroS6.dateRange = "This Week";
			state.macroS6.impact = "All";
			state.macroS6.currency = "All";
			state.macroS6.category = "All";
			state.macroS6.selectedEventId = state.macroS6.events[0]?.id || "";
			render();
		});
		page.querySelectorAll("[data-macro-event]").forEach((button) => {
			button.addEventListener("click", () => {
				state.macroS6.selectedEventId = button.dataset.macroEvent;
				render();
			});
		});
		page.querySelector("#refreshMacroData")?.addEventListener("click", runMacroRefresh);
		page.querySelector("#refreshMacroFilters")?.addEventListener("click", runMacroRefresh);
		page.querySelector("#retryMacroData")?.addEventListener("click", () => {
			localStorage.removeItem("jarvis-macro-source-error");
			state.macroS6.error = false;
			runMacroRefresh();
		});
		page.querySelector("#askJarvisAboutMacro")?.addEventListener("click", async () => {
			const event = macroSelectedEvent();
			if (!event) return;
			const context = {
				eventId: event.id,
				eventName: event.name,
				currency: event.currency,
				impact: event.impact,
				previous: event.previous,
				forecast: event.forecast,
				actual: event.actual,
				interpretation: event.interpretation,
				assetImpact: event.assets,
				risk: "Insufficient Data",
				quality: event.quality
			};
			state.jarvis.conversationState.macroContext = context;
			state.jarvis.conversationState.currentAsset = event.assets[0] || "";
			state.jarvis.conversationState.missingInformation = ["Verified macro source", "Verified event timing", "Verified market reaction"];
			state.jarvis.topic = event.currency;
			state.jarvis.question = `Explain the ${event.name} demo context for ${event.currency}. Keep the analysis preliminary and state what must be verified.`;
			state.activePage = "JARVIS";
			await renderFromTop();
			const input = document.querySelector(".ask-page #jarvisQuestion");
			if (input) input.value = state.jarvis.question;
		});
		page.querySelector("#openMacroInAnalysis")?.addEventListener("click", () => {
			const event = macroSelectedEvent();
			if (!event) return;
			state.approvedUi.analysisAsset = event.assets.find((asset) => ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "BTCUSD", "DXY", "US100"].includes(asset)) || "XAUUSD";
			state.approvedUi.macroContext = {
				eventName: event.name,
				status: event.status,
				interpretation: event.interpretation,
				risk: "Insufficient Data",
				source: event.quality === "Verified" ? "Verified Macro Data" : "Preliminary Macro Context"
			};
			state.activePage = "AIAnalysis";
			renderFromTop();
		});
	}
	async function runMacroRefresh({ animate = true } = {}) {
		if (state.macroS6.isRefreshing) return;
		state.macroS6.isRefreshing = true;
		state.macroS6.refreshStep = 0;
		state.macroS6.error = false;
		if (animate) await render();
		try {
			const [statusPayload, eventsPayload, summaryPayload] = await Promise.all([macroDataClient.status(), macroDataClient.events(), macroDataClient.summary()]);
			if (animate) for (let index = 0; index < 5; index += 1) {
				await new Promise((resolve) => setTimeout(resolve, 90));
				state.macroS6.refreshStep = index;
				await render();
			}
			state.macroS6.events = (eventsPayload.data?.events || []).map(mapMacroApiEvent);
			state.macroS6.provider = statusPayload.data?.provider || null;
			state.macroS6.summary = summaryPayload.data || null;
			state.macroS6.dataStatus = statusPayload.data?.dataStatus === "demo" ? "Demo" : macroTitleCase(statusPayload.data?.dataStatus);
			state.macroS6.selectedEventId = state.macroS6.events.some((event) => event.id === state.macroS6.selectedEventId) ? state.macroS6.selectedEventId : state.macroS6.events[0]?.id || "";
			state.macroS6.loaded = true;
			state.marketData.planner.macroRisk = summaryPayload.data?.integrations?.tradePlanner?.XAUUSD || { status: "Unavailable", nextEvent: null, sourceStatus: "Unavailable" };
			state.macroS6.error = false;
		} catch (error) {
			if (animate) await new Promise((resolve) => setTimeout(resolve, 600));
			state.macroS6.events = sprint6MacroEvents.map((event) => ({ ...event }));
			state.macroS6.provider = "MockMacroProvider";
			state.macroS6.dataStatus = "Demo";
			state.macroS6.loaded = true;
			state.macroS6.error = false;
		} finally {
			state.macroS6.isRefreshing = false;
			await render();
		}
	}
	function bindNewsEventsActions(page) {
		if (!state.newsS7.loaded && !state.newsS7.isRefreshing && !state.newsS7.error) queueMicrotask(() => {
			if (state.activePage === "Calendar" && !state.newsS7.loaded && !state.newsS7.isRefreshing) runNewsRefresh({ animate: false });
		});
		page.querySelectorAll("[data-news-category]").forEach((button) => {
			button.addEventListener("click", () => {
				state.newsS7.category = button.dataset.newsCategory;
				state.newsS7.selectedStoryId = newsFilteredStories()[0]?.id || "";
				render();
			});
		});
		page.querySelector("#newsImpactFilter")?.addEventListener("change", (event) => {
			state.newsS7.impact = event.currentTarget.value;
			state.newsS7.selectedStoryId = newsFilteredStories()[0]?.id || "";
			render();
		});
		page.querySelector("#newsTimeFilter")?.addEventListener("change", (event) => {
			state.newsS7.time = event.currentTarget.value;
			state.newsS7.selectedStoryId = newsFilteredStories()[0]?.id || "";
			render();
		});
		const resetFilters = () => {
			state.newsS7.category = "All";
			state.newsS7.impact = "All Impact";
			state.newsS7.time = "Latest";
			state.newsS7.selectedStoryId = "demo-policy-guidance";
			render();
		};
		page.querySelector("#resetNewsFilters")?.addEventListener("click", resetFilters);
		page.querySelector("#emptyResetNewsFilters")?.addEventListener("click", resetFilters);
		page.querySelector("#changeNewsCategory")?.addEventListener("click", () => {
			state.newsS7.category = "All";
			state.newsS7.time = "Latest";
			state.newsS7.selectedStoryId = state.newsS7.stories[0]?.id || "";
			render();
		});
		page.querySelectorAll("[data-news-story]").forEach((button) => {
			button.addEventListener("click", () => {
				state.newsS7.selectedStoryId = button.dataset.newsStory;
				render();
			});
		});
		page.querySelector("#refreshNewsData")?.addEventListener("click", runNewsRefresh);
		page.querySelector("#emptyRefreshNews")?.addEventListener("click", runNewsRefresh);
		page.querySelector("#retryNewsUpdate")?.addEventListener("click", () => {
			localStorage.removeItem("jarvis-news-source-error");
			state.newsS7.error = false;
			runNewsRefresh();
		});
		page.querySelector("#askJarvisAboutNews")?.addEventListener("click", async () => {
			const story = newsSelectedStory();
			if (!story) return;
			state.jarvis.conversationState.newsContext = {
				headline: story.headline,
				source: story.source,
				published: story.published,
				category: story.category,
				verification: story.verification,
				summary: story.summary,
				interpretation: { why: story.why, implication: story.implication, uncertainty: story.uncertainty },
				affectedAssets: story.assets,
				marketSentiment: "Insufficient Data",
				risk: "Insufficient Data",
				decisionStatus: "Preliminary"
			};
			state.jarvis.conversationState.currentAsset = story.assets[0] || "";
			state.jarvis.conversationState.missingInformation = ["Connected news source", "Verified publication time", "Verified market reaction"];
			state.jarvis.topic = story.assets[0] || story.category;
			state.jarvis.question = `Explain this demo news context: ${story.headline}. Keep it preliminary and tell me what must be verified.`;
			state.activePage = "JARVIS";
			await renderFromTop();
			const input = document.querySelector(".ask-page #jarvisQuestion");
			if (input) input.value = state.jarvis.question;
		});
		page.querySelector("#openNewsInAnalysis")?.addEventListener("click", () => {
			const story = newsSelectedStory();
			if (!story) return;
			state.approvedUi.analysisAsset = story.assets.find((asset) => ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "BTCUSD"].includes(asset)) || "XAUUSD";
			state.approvedUi.newsContext = {
				headline: story.headline,
				category: story.category,
				impact: story.impact,
				directionalPressure: "Awaiting Confirmation",
				interpretation: story.implication,
				sentiment: "Insufficient Data",
				risk: "Insufficient Data",
				source: story.verification === "Verified" ? "Verified News" : story.verification === "Preliminary" ? "Preliminary News" : "Unverified News"
			};
			state.activePage = "AIAnalysis";
			renderFromTop();
		});
	}
	async function runNewsRefresh({ animate = true } = {}) {
		if (state.newsS7.isRefreshing) return;
		state.newsS7.isRefreshing = true;
		state.newsS7.refreshStep = 0;
		state.newsS7.error = false;
		if (animate) await render();
		try {
			const [statusPayload, articlesPayload, topPayload, breakingPayload, summaryPayload] = await Promise.all([newsDataClient.status(), newsDataClient.articles(), newsDataClient.topStories(), newsDataClient.breaking(), newsDataClient.summary()]);
			if (animate) for (let index = 0; index < 5; index += 1) { await new Promise((resolve) => setTimeout(resolve, 90)); state.newsS7.refreshStep = index; await render(); }
			const topIds = (topPayload.data?.articles || []).map((article) => article.id); const breakingIds = (breakingPayload.data?.articles || []).map((article) => article.id);
			state.newsS7.stories = (articlesPayload.data?.articles || []).map((article) => mapNewsApiArticle(article, topIds, breakingIds));
			state.newsS7.provider = statusPayload.data?.provider || null; state.newsS7.summary = summaryPayload.data || null;
			state.newsS7.dataStatus = statusPayload.data?.dataStatus === "demo" ? "Demo" : macroTitleCase(statusPayload.data?.dataStatus);
			state.newsS7.selectedStoryId = state.newsS7.stories.some((story) => story.id === state.newsS7.selectedStoryId) ? state.newsS7.selectedStoryId : state.newsS7.stories[0]?.id || "";
			state.newsS7.loaded = true; state.newsS7.error = false;
			state.marketData.planner.newsRisk = summaryPayload.data?.integrations?.tradePlanner?.XAUUSD || { status: "Source Unavailable", highestImpactStory: null, sourceStatus: "Unavailable" };
		} catch (error) {
			state.newsS7.stories = sprint7NewsStories.map((story) => ({ ...story })); state.newsS7.provider = "MockNewsDataProvider"; state.newsS7.dataStatus = "Demo"; state.newsS7.loaded = true; state.newsS7.error = false;
		} finally { state.newsS7.isRefreshing = false; await render(); }
	}
	function resetS8Filters() {
		state.scannerS8.category = "All Markets";
		state.scannerS8.filters = {
			asset: "All Supported Assets", timeframe: "All", bias: "All", band: "All",
			setupType: "All", risk: "All", minimumRR: "Any", macroRisk: "All",
			newsRisk: "All", alignment: "All"
		};
		state.scannerS8.selectedOpportunityId = state.scannerS8.results[0]?.id || "";
		state.scannerS8.message = "";
	}
	function persistS8SavedScans() {
		localStorage.setItem("jarvis-s8-saved-scans", JSON.stringify(state.scannerS8.savedScans));
	}
	function bindOpportunityScannerActions(page) {
		if (!page.querySelector(".s8-scanner-page")) return;
		if (!state.scannerS8.results.length && state.scannerS8.scanState === "ready" && !state.scannerS8.isScanning && !state.scannerS8.error) {
			queueMicrotask(() => runS8Scan());
		}
		page.querySelectorAll("[data-s8-category]").forEach((button) => {
			button.addEventListener("click", () => {
				state.scannerS8.category = button.dataset.s8Category || "All Markets";
				state.scannerS8.selectedOpportunityId = s8FilteredOpportunities()[0]?.id || state.scannerS8.selectedOpportunityId;
				render();
			});
		});
		const filterControls = {
			s8Asset: "asset", s8Timeframe: "timeframe", s8Bias: "bias", s8Band: "band",
			s8SetupType: "setupType", s8Risk: "risk", s8MinimumRR: "minimumRR",
			s8MacroRisk: "macroRisk", s8NewsRisk: "newsRisk", s8Alignment: "alignment"
		};
		Object.entries(filterControls).forEach(([id, key]) => {
			page.querySelector("#" + id)?.addEventListener("change", (event) => {
				state.scannerS8.filters[key] = event.currentTarget.value;
			});
		});
		page.querySelector("#applyS8Filters")?.addEventListener("click", () => {
			state.scannerS8.selectedOpportunityId = s8FilteredOpportunities()[0]?.id || state.scannerS8.selectedOpportunityId;
			render();
		});
		const resetAndRender = () => {
			resetS8Filters();
			render();
		};
		page.querySelector("#resetS8Filters")?.addEventListener("click", resetAndRender);
		page.querySelector("#emptyResetS8Filters")?.addEventListener("click", resetAndRender);
		page.querySelector("#lowerS8MinimumScore")?.addEventListener("click", resetAndRender);
		page.querySelectorAll("[data-s8-opportunity]").forEach((button) => {
			button.addEventListener("click", () => {
				state.scannerS8.selectedOpportunityId = button.dataset.s8Opportunity;
				render();
			});
		});
		page.querySelector("#runS8Scan")?.addEventListener("click", runS8Scan);
		page.querySelector("#emptyRunS8Scan")?.addEventListener("click", runS8Scan);
		page.querySelector("#retryS8Scan")?.addEventListener("click", () => {
			localStorage.removeItem("jarvis-s8-scan-error");
			state.scannerS8.error = false;
			runS8Scan();
		});
		page.querySelector("#runS8CustomScan")?.addEventListener("click", () => {
			const minimumScore = Number(page.querySelector("#s8CustomMinimumScore")?.value);
			const watchlistOnly = Boolean(page.querySelector("#s8CustomWatchlist")?.checked);
			if (!Number.isFinite(minimumScore) || minimumScore < 0 || minimumScore > 100) {
				state.scannerS8.message = "Minimum score must be between 0 and 100.";
				render();
				return;
			}
			if (watchlistOnly) {
				state.scannerS8.message = "Watchlist integration unavailable. Custom scan was not started.";
				render();
				return;
			}
			state.scannerS8.settings.mediumThreshold = minimumScore;
			state.scannerS8.message = "Custom criteria validated. Running the same deterministic demo scanner.";
			runS8Scan();
		});
		page.querySelector("#saveS8Settings")?.addEventListener("click", () => {
			const high = Number(page.querySelector("#s8HighThreshold")?.value);
			const medium = Number(page.querySelector("#s8MediumThreshold")?.value);
			if (!Number.isFinite(high) || !Number.isFinite(medium) || high <= medium || high > 100 || medium < 1) {
				state.scannerS8.message = "High threshold must be above Medium and within 1–100.";
				render();
				return;
			}
			state.scannerS8.settings = {
				...state.scannerS8.settings,
				highThreshold: high,
				mediumThreshold: medium,
				freshnessTolerance: page.querySelector("#s8FreshnessTolerance")?.value || "15 minutes",
				includeMacro: Boolean(page.querySelector("#s8IncludeMacro")?.checked),
				includeNews: Boolean(page.querySelector("#s8IncludeNews")?.checked)
			};
			localStorage.setItem("jarvis-s8-settings", JSON.stringify(state.scannerS8.settings));
			state.scannerS8.message = "Scanner settings saved.";
			render();
		});
		page.querySelector("#saveS8Scan")?.addEventListener("click", () => {
			const name = page.querySelector("#s8SaveName")?.value.trim();
			if (!name) {
				state.scannerS8.message = "Enter a name before saving scan criteria.";
				render();
				return;
			}
			state.scannerS8.savedScans = [{
				id: "scan-" + Date.now(),
				name: name.slice(0, 40),
				category: state.scannerS8.category,
				filters: { ...state.scannerS8.filters },
				savedAt: new Date().toLocaleDateString(),
				type: "Criteria Only"
			}, ...state.scannerS8.savedScans].slice(0, 10);
			persistS8SavedScans();
			state.scannerS8.message = "Scan criteria saved. Results were not stored as current.";
			render();
		});
		page.querySelectorAll("[data-s8-load-scan]").forEach((button) => button.addEventListener("click", () => {
			const scan = state.scannerS8.savedScans.find((item) => item.id === button.dataset.s8LoadScan);
			if (!scan) {
				state.scannerS8.message = "The saved scan could not be loaded.";
				render();
				return;
			}
			state.scannerS8.category = scan.category;
			state.scannerS8.filters = { ...scan.filters };
			state.scannerS8.selectedOpportunityId = s8FilteredOpportunities()[0]?.id || "";
			state.scannerS8.message = "Saved criteria loaded. Run a new scan before treating results as current.";
			render();
		}));
		page.querySelectorAll("[data-s8-rename-scan]").forEach((button) => button.addEventListener("click", () => {
			const scan = state.scannerS8.savedScans.find((item) => item.id === button.dataset.s8RenameScan);
			if (!scan) return;
			const name = window.prompt("Rename saved scan", scan.name)?.trim();
			if (!name) return;
			scan.name = name.slice(0, 40);
			persistS8SavedScans();
			render();
		}));
		page.querySelectorAll("[data-s8-delete-scan]").forEach((button) => button.addEventListener("click", () => {
			const scan = state.scannerS8.savedScans.find((item) => item.id === button.dataset.s8DeleteScan);
			if (!scan || !window.confirm("Delete saved scan criteria?")) return;
			state.scannerS8.savedScans = state.scannerS8.savedScans.filter((item) => item.id !== scan.id);
			persistS8SavedScans();
			render();
		}));
		page.querySelector("#askJarvisAboutS8")?.addEventListener("click", async () => {
			const opportunity = s8SelectedOpportunity();
			state.jarvis.conversationState.scannerContext = {
				asset: opportunity.asset, market: opportunity.market, timeframe: opportunity.timeframe,
				setupType: opportunity.setupType, bias: opportunity.bias, opportunityScore: opportunity.score,
				scoreBreakdown: { ...opportunity.components }, confirmation: opportunity.confirmation,
				risk: opportunity.risk, summary: opportunity.mainFactor, dataQuality: opportunity.dataQuality
			};
			state.jarvis.conversationState.currentAsset = opportunity.asset;
			state.jarvis.conversationState.timeframe = opportunity.timeframe;
			state.jarvis.conversationState.missingInformation = ["Verified market data", "Exact levels and RR", "Verified macro risk", "Verified news risk"];
			state.jarvis.topic = opportunity.asset;
			state.jarvis.question = "Explain the " + opportunity.asset + " " + opportunity.timeframe + " deterministic scanner setup. Keep it preliminary and explain every missing input.";
			state.activePage = "JARVIS";
			await renderFromTop();
			const input = document.querySelector(".ask-page #jarvisQuestion");
			if (input) input.value = state.jarvis.question;
		});
		page.querySelector("#openS8InAnalysis")?.addEventListener("click", () => {
			const opportunity = s8SelectedOpportunity();
			state.approvedUi.analysisAsset = opportunity.asset;
			state.approvedUi.analysisTimeframe = opportunity.timeframe;
			state.approvedUi.opportunityContext = {
				source: "Opportunity Scanner", setupType: opportunity.setupType,
				score: opportunity.score, technicalContext: opportunity.mainFactor,
				macroRisk: "Unavailable", newsRisk: "Unavailable",
				confirmation: opportunity.confirmation, dataQuality: opportunity.dataQuality
			};
			state.activePage = "AIAnalysis";
			renderFromTop();
		});
	}
	async function runS8Scan() {
		if (state.scannerS8.isScanning) return;
		state.scannerS8.isScanning = true;
		state.scannerS8.scanStep = 0;
		state.scannerS8.error = false;
		state.scannerS8.errorMessage = "";
		state.marketData.scanner.loading = true;
		await render();
		const stepTimer = setInterval(() => {
			state.scannerS8.scanStep = Math.min(state.scannerS8.scanStep + 1, 7);
			render();
		}, 450);
		try {
			await loadMarketCatalog();
			const supported = state.marketData.symbols.filter((item) => item.supported).map((item) => item.symbol);
			const symbols = state.scannerS8.filters.asset === "All Supported Assets" ? supported : supported.filter((symbol) => symbol === state.scannerS8.filters.asset);
			const payload = await scannerDataClient.run({
				assets: symbols,
				category: state.scannerS8.category,
				minimumScore: 1,
				includeM15: symbols.length === 1 && state.scannerS8.filters.timeframe === "M15"
			});
			const result = payload.data;
			Object.assign(state.scannerS8, {
				scanId: result.scanId,
				scanState: result.status,
				results: result.results || [],
				marketsRequested: result.counters?.requested ?? 0,
				marketsCompleted: result.counters?.completed ?? 0,
				marketsPartial: result.counters?.partial ?? 0,
				marketsUnavailable: result.counters?.unavailable ?? 0,
				validSetups: result.counters?.validSetups ?? 0,
				rejectedSetups: result.counters?.rejectedSetups ?? 0,
				marketOverview: result.marketOverview || null,
				distribution: result.distribution || null,
				marketDataTimestamp: result.completedAt ? new Date(result.completedAt).toLocaleString() : "",
				lastSuccessfulScan: result.completedAt ? new Date(result.completedAt).toLocaleString() : "No completed scan",
				dataStatus: result.dataQuality || "Unavailable",
				selectedOpportunityId: result.results?.[0]?.id || ""
			});
			state.marketData.scanner.loaded = true;
			state.marketData.scanner.errorCode = "";
		} catch (error) {
			state.marketData.scanner.errorCode = error?.code || "MARKET_DATA_UNAVAILABLE";
			state.scannerS8.error = true;
			state.scannerS8.errorMessage = error?.message || "The opportunity scan could not be completed.";
			state.scannerS8.scanState = "failed";
		} finally {
			clearInterval(stepTimer);
			state.marketData.scanner.loading = false;
			state.scannerS8.isScanning = false;
			await render();
		}
	}
	async function loadMarketCatalog() {
		const [statusResult, symbolsResult] = await Promise.allSettled([marketDataClient.status(), marketDataClient.symbols()]);
		if (statusResult.status === "fulfilled") state.marketData.status = statusResult.value.data;
		if (symbolsResult.status === "fulfilled") state.marketData.symbols = symbolsResult.value.data.symbols || [];
	}
	async function runAiAnalysisRefresh() {
		if (state.approvedUi.analysisStatus === "loading") return;
		state.approvedUi.analysisStatus = "loading";
		state.marketData.analysis.loading = true;
		state.approvedUi.analysisError = false;
		await render();
		try {
			await loadMarketCatalog();
			const asset = state.approvedUi.analysisAsset;
			const timeframe = state.approvedUi.analysisTimeframe;
			const [quoteResult, candlesResult] = await Promise.allSettled([
				marketDataClient.quote(asset),
				marketDataClient.candles(asset, timeframe, 300)
			]);
			state.marketData.analysis.quote = quoteResult.status === "fulfilled" ? quoteResult.value.data : null;
			state.marketData.analysis.candles = candlesResult.status === "fulfilled" ? candlesResult.value.data : null;
			state.marketData.analysis.errorCode = quoteResult.status === "rejected" ? quoteResult.reason?.code || "MARKET_DATA_UNAVAILABLE" : candlesResult.status === "rejected" ? candlesResult.reason?.code || "MARKET_DATA_UNAVAILABLE" : "";
			state.approvedUi.analysisLastUpdated = state.marketData.analysis.quote?.timestamp || state.marketData.analysis.candles?.lastUpdated || "";
		} catch (error) {
			state.marketData.analysis.errorCode = error?.code || "MARKET_DATA_UNAVAILABLE";
			state.marketData.analysis.quote = null;
			state.marketData.analysis.candles = null;
		} finally {
			state.marketData.analysis.loading = false;
			state.marketData.analysis.loaded = true;
			state.approvedUi.analysisStatus = "idle";
			await render();
		}
	}
	async function loadTradePlannerMarketData() {
		if (state.marketData.planner.loading) return;
		state.marketData.planner.loading = true;
		try {
			await loadMarketCatalog();
			const metadata = state.marketData.symbols.find((item) => item.symbol === "XAUUSD") || null;
			const quotePayload = await marketDataClient.quote("XAUUSD");
			state.marketData.planner.metadata = metadata;
			state.marketData.planner.quote = quotePayload.data;
			state.marketData.planner.errorCode = "";
		} catch (error) {
			state.marketData.planner.quote = null;
			state.marketData.planner.metadata = state.marketData.symbols.find((item) => item.symbol === "XAUUSD") || null;
			state.marketData.planner.errorCode = error?.code || "MARKET_DATA_UNAVAILABLE";
		} finally {
			state.marketData.planner.loading = false;
			state.marketData.planner.loaded = true;
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
		const mentorIntro = item.text;
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
		<div><span>${labels.confidence}</span><strong>${Number.isFinite(Number(model.confidence)) ? `${safe(model.confidence)}%` : safe(model.confidence)}</strong><small>${safe(model.confidenceLabel)}</small></div>
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
		const verifiedQuote = state.marketData.planner.quote?.dataStatus === "verified" && state.marketData.planner.quote?.freshness === "current" ? state.marketData.planner.quote.last : null;
		return {
			"Account Balance": "10000",
			"Risk Percentage": "1",
			"Entry Price": verifiedQuote == null ? "" : String(verifiedQuote),
			"Stop Loss": "",
			"Take Profit 1": "",
			"Take Profit 2": "",
			"Take Profit 3": ""
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
