(() => {
  // jarvis-mvp/core/shared/intelligenceResponse.js
  var INTELLIGENCE_STATUS = {
    READY: "ready",
    MOCK: "mock",
    OFFLINE: "offline",
    ERROR: "error"
  };
  function createIntelligenceResponse({
    id,
    moduleName,
    status = INTELLIGENCE_STATUS.MOCK,
    confidence = 0,
    summary = "",
    recommendation = "",
    updatedAt = (/* @__PURE__ */ new Date()).toISOString(),
    metadata = {}
  }) {
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
    return Boolean(
      response && response.id && response.moduleName && response.status && typeof response.confidence === "number" && response.summary && response.recommendation && response.updatedAt && response.metadata && typeof response.metadata === "object"
    );
  }

  // jarvis-mvp/core/jarvisCore/jarvisCore.js
  var JarvisCore = class {
    constructor({ registry }) {
      this.registry = registry;
    }
    async generateUnifiedIntelligence() {
      const rawOutputs = await Promise.all(this.registry.getAll().map((module) => module.run()));
      const validOutputs = rawOutputs.filter(isValidIntelligenceResponse);
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
      var _a;
      const decision = outputs.find((output) => output.moduleName === "Decision Intelligence");
      return (decision == null ? void 0 : decision.recommendation) || ((_a = outputs[0]) == null ? void 0 : _a.recommendation) || "Prepare first. Execute only when the plan is clear.";
    }
    resolveConflicts(outputs) {
      var _a, _b;
      const market = outputs.find((output) => output.moduleName === "Market Intelligence");
      const risk = outputs.find((output) => output.moduleName === "Risk Intelligence");
      const conflicts = [];
      if (((_a = market == null ? void 0 : market.metadata) == null ? void 0 : _a.tone) === "Bullish" && ((_b = risk == null ? void 0 : risk.metadata) == null ? void 0 : _b.riskMode) === "Protect capital") {
        conflicts.push({
          type: "risk-adjusted-market-bias",
          message: "Market mock bias is bullish, but Risk Intelligence prioritizes capital protection.",
          resolution: "Prepare the setup, but delay execution until confirmation is present."
        });
      }
      return conflicts;
    }
  };

  // jarvis-mvp/core/modules/createMockModule.js
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

  // jarvis-mvp/core/modules/behavior/index.js
  var behaviorIntelligence = createMockModule({
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

  // jarvis-mvp/core/services/mockMarketDataService.js
  var forexCurrencies = ["USD", "EUR", "GBP", "JPY", "AUD", "NZD", "CAD", "CHF", "CNH", "SGD", "HKD", "MXN", "ZAR"];
  var instrumentAliases = [
    { symbol: "XAUUSD", label: "Gold", type: "metal", aliases: ["GOLD", "XAU", "XAUUSD", "XAU/USD"] },
    { symbol: "XAGUSD", label: "Silver", type: "metal", aliases: ["SILVER", "XAG", "XAGUSD", "XAG/USD"] },
    { symbol: "BTCUSD", label: "Bitcoin", type: "crypto", aliases: ["BTC", "BITCOIN", "BTCUSD", "BTC/USD"] },
    { symbol: "ETHUSD", label: "Ethereum", type: "crypto", aliases: ["ETH", "ETHEREUM", "ETHUSD", "ETH/USD"] },
    { symbol: "SOLUSD", label: "Solana", type: "crypto", aliases: ["SOL", "SOLANA", "SOLUSD", "SOL/USD"] },
    { symbol: "DXY", label: "Dollar Index", type: "forex", aliases: ["DXY", "DOLLARINDEX", "USDINDEX"] },
    { symbol: "NAS100", label: "Nasdaq 100", type: "index", aliases: ["NAS100", "NASDAQ", "NASDAQ100", "USTEC", "US100"] },
    { symbol: "US30", label: "Dow Jones", type: "index", aliases: ["US30", "DJI", "DOW", "DOWJONES"] },
    { symbol: "SPX500", label: "S&P 500", type: "index", aliases: ["SPX500", "SP500", "S&P500", "US500"] },
    { symbol: "GER40", label: "DAX", type: "index", aliases: ["GER40", "DAX", "DE40", "DAX40"] },
    { symbol: "UK100", label: "FTSE 100", type: "index", aliases: ["UK100", "FTSE", "FTSE100"] },
    { symbol: "JP225", label: "Nikkei 225", type: "index", aliases: ["JP225", "NIKKEI", "NIKKEI225"] },
    { symbol: "HK50", label: "Hang Seng", type: "index", aliases: ["HK50", "HSI", "HANGSENG"] },
    { symbol: "TSLA", label: "Tesla", type: "stock", aliases: ["TESLA", "TSLA"] },
    { symbol: "AAPL", label: "Apple", type: "stock", aliases: ["APPLE", "AAPL"] },
    { symbol: "NVDA", label: "Nvidia", type: "stock", aliases: ["NVIDIA", "NVDA"] },
    { symbol: "MSFT", label: "Microsoft", type: "stock", aliases: ["MICROSOFT", "MSFT"] }
  ];
  function resolveInstrument(input = "") {
    const raw = String(input || "").toUpperCase();
    const compact = raw.replace(/[^A-Z0-9]/g, "");
    const aliasMatch = instrumentAliases.find(
      (instrument) => instrument.aliases.some((alias) => compact.includes(alias.replace(/[^A-Z0-9]/g, "")))
    );
    if (aliasMatch) return aliasMatch;
    for (const base of forexCurrencies) {
      for (const quote of forexCurrencies) {
        if (base === quote) continue;
        const symbol = `${base}${quote}`;
        if (compact.includes(symbol) || raw.includes(`${base}/${quote}`)) {
          return {
            symbol,
            label: `${base}/${quote}`,
            type: "forex",
            aliases: [symbol, `${base}/${quote}`]
          };
        }
      }
    }
    return instrumentAliases[0];
  }
  function profileForInstrument(instrument) {
    if (instrument.type === "forex") {
      return {
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
    }
    if (instrument.type === "index") {
      return {
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
    }
    if (instrument.type === "crypto") {
      return {
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
    }
    if (instrument.type === "stock") {
      return {
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
    }
    if (instrument.symbol === "XAGUSD") {
      return {
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
    }
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

  // jarvis-mvp/core/services/liveMarketDataService.js
  var quoteProxyUrl = typeof window === "undefined" ? "http://127.0.0.1:4175/api/quote" : "/api/quote";
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
      if (!(quote == null ? void 0 : quote.price)) throw new Error("Quote payload missing price");
      return {
        ...quote,
        symbol: instrument.symbol,
        label: instrument.label,
        type: instrument.type,
        source: "live"
      };
    } catch (e) {
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
    if (!(quote == null ? void 0 : quote.price)) return "";
    const decimals = quote.type === "forex" && quote.symbol.includes("JPY") ? 3 : quote.type === "forex" ? 5 : 2;
    return Number(quote.price).toLocaleString(void 0, {
      maximumFractionDigits: decimals,
      minimumFractionDigits: quote.type === "forex" ? Math.min(decimals, 3) : 2
    });
  }

  // jarvis-mvp/core/services/mockChartAnalysisService.js
  var defaultAnalysis = {
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
    keyObservations: ["Structure is constructive.", "Liquidity has already been tested.", "Current price needs better risk/reward."],
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
    const price = liveQuote == null ? void 0 : liveQuote.price;
    const isBullish = bias !== "Bearish";
    const type = snapshot.type;
    const hasPrice = typeof price === "number";
    const entryDistance = type === "forex" ? 18e-4 : type === "crypto" ? 0.012 : 22e-4;
    const stopDistance = type === "forex" ? 32e-4 : type === "crypto" ? 0.024 : 42e-4;
    const tp1Distance = type === "forex" ? 45e-4 : type === "crypto" ? 0.032 : 62e-4;
    const tp2Distance = type === "forex" ? 75e-4 : type === "crypto" ? 0.052 : 0.0105;
    if (!hasPrice) {
      return {
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
    }
    const entryMid = isBullish ? price * (1 - entryDistance) : price * (1 + entryDistance);
    const entryLow = entryMid * (1 - entryDistance * 0.45);
    const entryHigh = entryMid * (1 + entryDistance * 0.45);
    const stop = isBullish ? price * (1 - stopDistance) : price * (1 + stopDistance);
    const tp1 = isBullish ? price * (1 + tp1Distance) : price * (1 - tp1Distance);
    const tp2 = isBullish ? price * (1 + tp2Distance) : price * (1 - tp2Distance);
    const riskPoints = Math.abs(entryMid - stop);
    const reward1 = Math.abs(tp1 - entryMid);
    const reward2 = Math.abs(tp2 - entryMid);
    const rr1 = reward1 / riskPoints;
    const rr2 = reward2 / riskPoints;
    const rrText = `Entry ${formatPlanningPrice(entryMid, type)}, SL reference ${formatPlanningPrice(stop, type)}, TP1 ${formatPlanningPrice(tp1, type)} gives approx 1:${rr1.toFixed(1)}. TP2 improves toward 1:${rr2.toFixed(1)}.`;
    const isTradePlanQuestion = /(entry|tp|take profit|sl|stop loss|放哪里|哪里|止损|止盈|进场)/i.test(question);
    return {
      clarity: isTradePlanQuestion ? "Actionable planning only" : "Context planning",
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
    const tradePlan = buildTradePlan({ snapshot, liveQuote, question, bias });
    const previousContext = (previousMission == null ? void 0 : previousMission.pair) ? `Previous mission context: ${previousMission.pair} ${previousMission.bias}.` : "No previous mission conflict detected.";
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

  // jarvis-mvp/core/modules/chart/index.js
  var chartIntelligence = {
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

  // jarvis-mvp/core/modules/decision/index.js
  var decisionIntelligence = createMockModule({
    id: "decision-intelligence",
    moduleName: "Decision Intelligence",
    confidence: 86,
    summary: "The combined mock decision is preparation first, execution only after confirmation.",
    recommendation: "Do not chase. Wait for confirmation, define risk, then execute calmly.",
    metadata: {
      finalBias: "Prepare and wait"
    }
  });

  // jarvis-mvp/core/modules/growth/index.js
  var growthIntelligence = createMockModule({
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

  // jarvis-mvp/core/modules/journal/index.js
  var journalIntelligence = createMockModule({
    id: "journal-intelligence",
    moduleName: "Journal Intelligence",
    confidence: 73,
    summary: "Journal is ready for a pre-trade note, but no real journal entry exists yet.",
    recommendation: "Write the reason, invalidation, and emotion state before entering.",
    metadata: {
      todayEntry: "Not written"
    }
  });

  // jarvis-mvp/core/modules/learning/index.js
  var learningIntelligence = createMockModule({
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

  // jarvis-mvp/core/modules/macro/index.js
  var macroIntelligence = createMockModule({
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

  // jarvis-mvp/core/modules/market/index.js
  var marketIntelligence = {
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

  // jarvis-mvp/core/modules/replay/index.js
  var replayIntelligence = createMockModule({
    id: "replay-intelligence",
    moduleName: "Replay Intelligence",
    confidence: 69,
    summary: "Replay module has a mock reminder to review one previous similar setup.",
    recommendation: "Replay one past trade before taking a similar setup today.",
    metadata: {
      replayStatus: "Mock replay ready"
    }
  });

  // jarvis-mvp/core/modules/risk/index.js
  var riskIntelligence = createMockModule({
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

  // jarvis-mvp/core/services/mockTradingAccountService.js
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

  // jarvis-mvp/core/modules/trading/index.js
  var tradingIntelligence = {
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

  // jarvis-mvp/core/modules/registry.js
  var IntelligenceModuleRegistry = class {
    constructor() {
      this.modules = /* @__PURE__ */ new Map();
    }
    register(module) {
      if (!(module == null ? void 0 : module.id) || !(module == null ? void 0 : module.moduleName) || typeof module.run !== "function") {
        throw new Error("Invalid intelligence module registration.");
      }
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
  var intelligenceModuleRegistry = new IntelligenceModuleRegistry();
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

  // jarvis-mvp/core/jarvisCore/index.js
  var jarvisCore = new JarvisCore({
    registry: intelligenceModuleRegistry
  });

  // jarvis-mvp/core/services/jarvisCoreService.js
  function findModule(report, moduleName) {
    return report.outputs.find((output) => output.moduleName === moduleName);
  }
  async function getWorkspaceIntelligenceFromCore() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G;
    const report = await jarvisCore.generateUnifiedIntelligence();
    const market = findModule(report, "Market Intelligence");
    const trading = findModule(report, "Trading Intelligence");
    const chart = findModule(report, "Chart Intelligence");
    const activeOutputs = report.outputs;
    const marketPlan = ((_a = market == null ? void 0 : market.metadata) == null ? void 0 : _a.plan) || "Wait for pullback confirmation.";
    const chartAnalysis = (_b = chart == null ? void 0 : chart.metadata) == null ? void 0 : _b.latestAnalysis;
    return {
      report: {
        ...report,
        outputs: activeOutputs,
        recommendation: `${marketPlan} ${((_c = trading == null ? void 0 : trading.metadata) == null ? void 0 : _c.tradingStatus) || "Within Plan"}. ${(chartAnalysis == null ? void 0 : chartAnalysis.recommendation) || ""}`.trim()
      },
      intelligence: [
        {
          label: "Market Bias",
          value: ((_d = market == null ? void 0 : market.metadata) == null ? void 0 : _d.tone) || "Mock standby",
          detail: (market == null ? void 0 : market.summary) || "Market Intelligence is preparing mock data."
        },
        {
          label: "Market Structure",
          value: ((_e = market == null ? void 0 : market.metadata) == null ? void 0 : _e.marketStructure) || "Mock structure",
          detail: ((_f = market == null ? void 0 : market.metadata) == null ? void 0 : _f.liquidityStatus) || "Liquidity status is preparing mock data."
        },
        {
          label: "Trading Status",
          value: ((_g = trading == null ? void 0 : trading.metadata) == null ? void 0 : _g.riskStatus) || "Healthy",
          detail: (trading == null ? void 0 : trading.recommendation) || "Trading Intelligence is read-only in Sprint 3."
        }
      ],
      opportunity: {
        title: `${(chartAnalysis == null ? void 0 : chartAnalysis.pair) || "XAUUSD"} patience zone`,
        summary: (chart == null ? void 0 : chart.summary) || "Chart Intelligence placeholder ready.",
        quality: (chartAnalysis == null ? void 0 : chartAnalysis.confidence) || (chart == null ? void 0 : chart.confidence) || 78,
        analysis: chartAnalysis
      },
      mission: {
        title: "Today's Focus",
        summary: marketPlan
      },
      profitGoal: {
        value: ((_h = trading == null ? void 0 : trading.metadata) == null ? void 0 : _h.dailyProfit) || 25,
        currency: ((_i = trading == null ? void 0 : trading.metadata) == null ? void 0 : _i.currency) || "USD",
        progress: ((_j = trading == null ? void 0 : trading.metadata) == null ? void 0 : _j.dailyGoalProgress) || 75,
        balance: (_k = trading == null ? void 0 : trading.metadata) == null ? void 0 : _k.balance,
        equity: (_l = trading == null ? void 0 : trading.metadata) == null ? void 0 : _l.equity,
        openPositions: (_m = trading == null ? void 0 : trading.metadata) == null ? void 0 : _m.openPositions,
        floatingPL: (_n = trading == null ? void 0 : trading.metadata) == null ? void 0 : _n.floatingPL,
        dailyDrawdown: (_o = trading == null ? void 0 : trading.metadata) == null ? void 0 : _o.dailyDrawdown,
        riskStatus: (_p = trading == null ? void 0 : trading.metadata) == null ? void 0 : _p.riskStatus,
        tradingStatus: (_q = trading == null ? void 0 : trading.metadata) == null ? void 0 : _q.tradingStatus
      },
      tradingHealth: {
        score: ((_r = trading == null ? void 0 : trading.metadata) == null ? void 0 : _r.dailyGoalProgress) || 75,
        riskStatus: ((_s = trading == null ? void 0 : trading.metadata) == null ? void 0 : _s.riskStatus) || "Healthy",
        tradingStatus: ((_t = trading == null ? void 0 : trading.metadata) == null ? void 0 : _t.tradingStatus) || "Within Plan",
        dailyDrawdown: ((_u = trading == null ? void 0 : trading.metadata) == null ? void 0 : _u.dailyDrawdown) || 1.2,
        openPositions: ((_v = trading == null ? void 0 : trading.metadata) == null ? void 0 : _v.openPositions) || 1,
        floatingPL: ((_w = trading == null ? void 0 : trading.metadata) == null ? void 0 : _w.floatingPL) || 0
      },
      dailyBriefing: {
        marketBias: ((_x = market == null ? void 0 : market.metadata) == null ? void 0 : _x.marketBias) || ((_y = market == null ? void 0 : market.metadata) == null ? void 0 : _y.tone) || "Bullish",
        confidence: (market == null ? void 0 : market.confidence) || 84,
        marketStructure: ((_z = market == null ? void 0 : market.metadata) == null ? void 0 : _z.marketStructure) || "Bullish continuation",
        liquidityStatus: ((_A = market == null ? void 0 : market.metadata) == null ? void 0 : _A.liquidityStatus) || "Buy-side liquidity above previous high",
        volatility: ((_B = market == null ? void 0 : market.metadata) == null ? void 0 : _B.volatility) || "Medium",
        session: ((_C = market == null ? void 0 : market.metadata) == null ? void 0 : _C.session) || "London session",
        keyZones: ((_D = market == null ? void 0 : market.metadata) == null ? void 0 : _D.keyZones) || ["Pullback confirmation zone"],
        recommendation: (market == null ? void 0 : market.recommendation) || report.recommendation,
        risk: ((_E = market == null ? void 0 : market.metadata) == null ? void 0 : _E.risk) || "Medium",
        lastUpdated: ((_F = market == null ? void 0 : market.metadata) == null ? void 0 : _F.lastUpdated) || "09:35"
      },
      aiCoach: {
        title: "Professional decision quality",
        message: `${marketPlan} Reason: ${((_G = market == null ? void 0 : market.metadata) == null ? void 0 : _G.liquidityStatus) || "market context still needs confirmation"}`,
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
        moduleHealthAverage: Math.round(
          workspace.moduleHealth.reduce((sum, module) => sum + module.health, 0) / workspace.moduleHealth.length
        ),
        engineHealthAverage: Math.round(
          workspace.engineHealth.reduce((sum, module) => sum + module.health, 0) / workspace.engineHealth.length
        )
      }
    };
  }

  // jarvis-mvp/core/api/jarvisCoreApi.js
  var jarvisCoreApi = {
    getWorkspaceIntelligence: getWorkspaceIntelligenceFromCore,
    getAdminCommandCenterData: getAdminCommandCenterDataFromCore,
    analyzeUploadedChart: analyzeUploadedChartWithCore
  };

  // jarvis-mvp/core/api/brainApi.js
  var brainApi = {
    getWorkspaceIntelligence: jarvisCoreApi.getWorkspaceIntelligence,
    getAdminCommandCenterData: jarvisCoreApi.getAdminCommandCenterData,
    analyzeUploadedChart: jarvisCoreApi.analyzeUploadedChart
  };

  // jarvis-mvp/core/hooks/useBrainData.js
  async function loadBrainData() {
    return brainApi.getWorkspaceIntelligence();
  }
  async function loadAdminBrainData() {
    return brainApi.getAdminCommandCenterData();
  }
  async function analyzeChartUpload(upload) {
    return brainApi.analyzeUploadedChart(upload);
  }

  // jarvis-mvp/core/brain/jarvisAlphaBrain.js
  var disclaimer = "JARVIS provides educational market analysis and risk guidance. The final trading decision remains the responsibility of the trader.";
  function detectJarvisLanguage(input = "") {
    return /[\u3400-\u9fff]/.test(input) ? "zh" : "en";
  }
  function detectJarvisIntent(input = "") {
    const text = String(input).toLowerCase();
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
    const compact = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
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
    const tradingIntents = ["Market View", "Buy Assessment", "Sell Assessment", "Chart Analysis", "Entry Planning", "Stop Loss Planning", "Take Profit Planning", "Full Trade Plan", "Risk Check", "Potential Signal Request"];
    if (tradingIntents.includes(intent)) {
      capabilities.add("Trading Capability");
      capabilities.add("Risk Capability");
      capabilities.add("Market Capability");
    }
    if (["Entry Planning", "Stop Loss Planning", "Take Profit Planning", "Full Trade Plan", "Buy Assessment", "Sell Assessment"].includes(intent)) {
      capabilities.add("Planning Capability");
    }
    if (["Macro Question"].includes(intent)) {
      capabilities.add("Macro Capability");
      capabilities.add("Risk Capability");
      capabilities.add("Market Capability");
    }
    if (["Trade Review", "Journal Review"].includes(intent)) capabilities.add("Journal Capability");
    if (["Learning Question"].includes(intent)) capabilities.add("Learning Capability");
    if (["Potential Signal Request"].includes(intent)) capabilities.add("Signal Capability");
    if (["Emotional Trading", "Revenge Trading"].includes(intent)) capabilities.add("Mentor Capability");
    if ((asset == null ? void 0 : asset.assetClass) === "Crypto") capabilities.add("Crypto placeholder data");
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
      goldImpact: (asset == null ? void 0 : asset.symbol) === "XAUUSD" ? "Gold may react strongly if USD reprices after the release." : "Relevant if USD reprices after the release.",
      cryptoStockImpact: "Risk assets may react through yields, USD, and liquidity expectations.",
      riskLevel: "High around release window",
      professionalView: isZh ? `${eventName} \u6CA1\u6709\u771F\u5B9E\u6570\u636E\u6E90\u8FDE\u63A5\uFF0C\u4E0D\u80FD\u4E71\u7F16\u6570\u5B57\u3002\u91CD\u70B9\u770B actual \u548C forecast \u7684\u504F\u5DEE\uFF0C\u4EE5\u53CA USD / yield \u7684\u53CD\u5E94\u3002` : `${eventName} data is not connected, so JARVIS will not invent numbers. Watch the deviation versus forecast and the reaction in USD / yields.`,
      watchNext: isZh ? "\u7B49\u5F85\u6570\u636E\u516C\u5E03\u3001\u7B2C\u4E00\u6CE2\u6CE2\u52A8\u7ED3\u675F\u3001\u518D\u770B\u5E02\u573A\u662F\u5426\u63A5\u53D7\u65B9\u5411\u3002" : "Wait for the release, let the first volatility pass, then watch whether the market accepts the direction."
    };
  }
  function routeJarvisInput({ input = "", memory = {}, chart = {}, journal = [] } = {}) {
    const language = detectJarvisLanguage(input);
    const intent = detectJarvisIntent(input);
    const primaryAsset = detectJarvisAsset(input);
    const asset = primaryAsset.isClear ? primaryAsset : detectJarvisAsset(memory.lastInstrument || "");
    const capabilities = selectJarvisCapabilities({ intent, asset });
    const market = getMockMarketSnapshot(asset.isClear ? asset.symbol : input);
    const isTradeRelated = capabilities.some((capability) => ["Trading Capability", "Planning Capability", "Risk Capability", "Signal Capability"].includes(capability));
    const macro = intent === "Macro Question" ? createMacroOutput({ input, asset, language }) : null;
    return {
      id: `jarvis-route-${Date.now()}`,
      language,
      intent,
      asset,
      capabilities,
      context: {
        market,
        chartAvailable: Boolean(chart == null ? void 0 : chart.previewUrl),
        previousMission: (journal == null ? void 0 : journal[0]) || null,
        journalCount: (journal == null ? void 0 : journal.length) || 0,
        memory
      },
      macro,
      safety: {
        isTradeRelated,
        disclaimer: isTradeRelated ? disclaimer : "",
        blocked: false
      },
      responseFramework: {
        verdictOptions: ["Long Opportunity", "Short Opportunity", "Stand Aside", "Monitor Only"],
        sections: ["JARVIS Verdict", "Asset", "Asset Class", "Professional View", "Key Observations", "Potential Planning Zones", "Trading Safety", "Alternative Scenario", "Mentor Notes", "Disclaimer"]
      }
    };
  }

  // jarvis-mvp/core/services/potentialTradesEngine.js
  var disclaimer2 = "JARVIS provides educational market analysis and risk guidance. The final trading decision remains the responsibility of the trader.";
  var opportunityStatuses = [
    "Detected",
    "Monitoring",
    "Waiting Confirmation",
    "Ready",
    "Triggered",
    "Invalidated",
    "Completed",
    "Reviewed"
  ];
  var demoPotentialTrades = [
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
      tpTargets: ["TP1: 3362", "TP2: 3370", "TP3: 3382"],
      estimatedRR: "Around 1 : 2.5",
      setupReason: "Cleaner structure, defined pullback zone, and better reward profile than chasing current price.",
      invalidationCondition: "Invalid if price breaks below 3342 with acceptance.",
      conditionsNeeded: ["Pullback into planning zone", "Confirmation candle", "No high-impact news nearby", "Risk reward remains near 1:2 or better"],
      status: "Waiting Confirmation",
      reasonForStatusChange: "Price is near the planning area, but confirmation is still required.",
      currentMarketCondition: "Bullish structure with medium risk.",
      nextActionSuggestion: "Wait for confirmation before considering any action.",
      keyLevels: ["3348 - 3352 planning zone", "3342 invalidation", "3362 / 3370 target zones"],
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
      conditionsNeeded: ["Avoid middle of range", "Wait for clean rejection or breakout", "Confirm risk before entry"],
      status: "Monitoring",
      reasonForStatusChange: "Setup exists but is not ready.",
      currentMarketCondition: "High volatility range.",
      nextActionSuggestion: "Monitor only until the range edge is tested.",
      keyLevels: ["Range high", "Range low", "Breakout acceptance zone"],
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
      conditionsNeeded: ["US session confirmation", "Clean opening range", "No aggressive rejection from prior high"],
      status: "Waiting Confirmation",
      reasonForStatusChange: "US session context is needed.",
      currentMarketCondition: "Cautiously bullish with opening range risk.",
      nextActionSuggestion: "Wait for opening range confirmation.",
      keyLevels: ["Opening range", "Previous day high", "Previous day low"],
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
      conditionsNeeded: ["London or New York range expansion", "Clear liquidity sweep", "Better RR profile"],
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
        disclaimer: disclaimer2
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
    const candidates = filterPotentialTrades(trades, {
      assetClass: filters.assetClass || "All",
      status: filters.status || "All"
    });
    const ranked = [...candidates].sort((a, b) => scoreTrade(b) - scoreTrade(a));
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
  function createAccuracyTracker(trades, outcomes = {}) {
    const records = trades.map((trade) => {
      const outcome = outcomes[trade.id] || {};
      const lifecycleOutcome = trade.status === "Invalidated" ? {
        outcomeStatus: "Invalidated",
        marketResult: trade.invalidationCondition,
        invalidated: "Yes",
        finalReview: "Setup invalidated by its own rule.",
        lessonLearned: "Respect invalidation quickly and do not defend a broken setup."
      } : ["Completed", "Reviewed"].includes(trade.status) ? {
        outcomeStatus: "Pending review",
        marketResult: "Target or review point reached.",
        tpHit: "Review required",
        finalReview: "Outcome review required before scoring accuracy.",
        lessonLearned: "Confirm whether partial profit, full target, or management rule was followed."
      } : {};
      return {
        tradeId: trade.id,
        originalVerdict: trade.direction,
        originalDirection: trade.direction,
        originalEntryZone: trade.potentialEntryZone,
        originalSLReference: trade.slReference,
        originalTPTargets: trade.tpTargets,
        originalRR: trade.estimatedRR,
        originalConfidence: trade.confidence,
        originalTradingSafety: trade.tradingSafety,
        createdTime: trade.createdAt,
        outcomeStatus: outcome.outcomeStatus || lifecycleOutcome.outcomeStatus || "Pending",
        marketResult: outcome.marketResult || lifecycleOutcome.marketResult || "Pending",
        pointsMoved: outcome.pointsMoved || "Pending",
        tpHit: outcome.tpHit || lifecycleOutcome.tpHit || "Pending",
        slHit: outcome.slHit || "Pending",
        invalidated: outcome.invalidated || lifecycleOutcome.invalidated || "Pending",
        timeTaken: outcome.timeTaken || "Pending",
        finalReview: outcome.finalReview || lifecycleOutcome.finalReview || "Accuracy tracking in progress.",
        lessonLearned: outcome.lessonLearned || lifecycleOutcome.lessonLearned || "Review after outcome is available."
      };
    });
    return {
      status: "Accuracy tracking in progress.",
      enoughData: false,
      records
    };
  }
  function createOutcomeReview(trade) {
    return {
      originalView: trade.direction,
      outcome: trade.status === "Completed" ? "Target review available." : "Pending",
      wasSetupValid: trade.status === "Invalidated" ? "No" : "Pending review",
      didReachEntry: ["Triggered", "Completed", "Reviewed"].includes(trade.status) ? "Yes" : "Pending",
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
    const confidence = { High: 3, Medium: 2, Low: 1 }[trade.confidence] || 1;
    const safety = trade.tradingSafety.includes("Low") ? 3 : trade.tradingSafety.includes("Medium") ? 2 : 1;
    const status = { Ready: 4, "Waiting Confirmation": 3, Monitoring: 2, Detected: 1 }[trade.status] || 0;
    const direction = ["Long Opportunity", "Short Opportunity"].includes(trade.direction) ? 1 : 0;
    return confidence + safety + status + direction;
  }

  // jarvis-mvp/app.js
  var mockUser = {
    name: "Kai",
    tier: "APEX Growth",
    dailyGoal: 420,
    progress: 68,
    streak: 12
  };
  var navItems = [
    { label: "Workspace", page: "Home" },
    { label: "Ask JARVIS", page: "JARVIS" },
    { label: "Markets", page: "Intelligence" },
    { label: "Analysis", page: "Intelligence" },
    { label: "Potential Trades", page: "Intelligence" },
    { label: "News & Macro", page: "Intelligence" },
    { label: "Calendar", page: "Intelligence" },
    { label: "Trade Planner", page: "Trading" },
    { label: "Risk Center", page: "Trading" },
    { label: "Portfolio", page: "Growth" },
    { label: "Settings", page: "Settings" }
  ];
  var adminNavItems = [
    { label: "Users", page: "Command" },
    { label: "Revenue", page: "Command" },
    { label: "AI Engines", page: "Command" }
  ];
  var adminUsers = [
    { name: "Kai", growth: "Consistent", deposit: "Funded", unlock: "Level 3", health: 86 },
    { name: "Mei", growth: "Needs review", deposit: "Pending", unlock: "Level 1", health: 62 },
    { name: "Arif", growth: "Accelerating", deposit: "Funded", unlock: "Level 4", health: 91 },
    { name: "Lina", growth: "Paused", deposit: "Not started", unlock: "Starter", health: 48 }
  ];
  var activity = [
    "Kai completed risk discipline mission",
    "Mei uploaded chart for AI Coach review",
    "Arif unlocked Growth Engine milestone",
    "System prepared mock MT5 connection checks"
  ];
  var mentorSetupLink = "#setup";
  localStorage.removeItem("jarvis-chart-preview");
  var jarvisPromptExamples = [
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
  var analysisSteps = [
    "Understanding your question...",
    "Detecting asset...",
    "Checking trade context...",
    "Selecting JARVIS capabilities...",
    "Preparing response...",
    "Done."
  ];
  var analysisStepsZh = [
    "\u7406\u89E3\u4F60\u7684\u95EE\u9898...",
    "\u8BC6\u522B\u4EA4\u6613\u54C1\u79CD...",
    "\u68C0\u67E5\u4EA4\u6613\u80CC\u666F...",
    "\u9009\u62E9 JARVIS \u80FD\u529B...",
    "\u51C6\u5907\u56DE\u5E94...",
    "\u5B8C\u6210\u3002"
  ];
  var watchlistFilters = ["All", "Gold", "Forex", "Crypto", "Stocks", "Indices"];
  var alphaWatchlist = [
    { symbol: "XAUUSD", label: "Gold", assetClass: "Gold", outlook: "Bullish", safety: "Medium", status: "Waiting Confirmation" },
    { symbol: "EURUSD", label: "Euro / Dollar", assetClass: "Forex", outlook: "Balanced Bullish", safety: "Medium", status: "Monitoring" },
    { symbol: "GBPUSD", label: "Pound / Dollar", assetClass: "Forex", outlook: "Range", safety: "Medium", status: "Monitoring" },
    { symbol: "USDJPY", label: "Dollar / Yen", assetClass: "Forex", outlook: "Volatile", safety: "Medium High", status: "Monitoring" },
    { symbol: "DXY", label: "Dollar Index", assetClass: "Forex", outlook: "Event Sensitive", safety: "Medium", status: "Monitoring" },
    { symbol: "BTCUSD", label: "Bitcoin", assetClass: "Crypto", outlook: "Momentum Neutral", safety: "High", status: "Monitoring" },
    { symbol: "ETHUSD", label: "Ethereum", assetClass: "Crypto", outlook: "Range", safety: "High", status: "Waiting Confirmation" },
    { symbol: "SOLUSD", label: "Solana", assetClass: "Crypto", outlook: "Volatile", safety: "High", status: "Monitoring" },
    { symbol: "AAPL", label: "Apple", assetClass: "Stocks", outlook: "Session Dependent", safety: "Medium High", status: "Monitoring" },
    { symbol: "TSLA", label: "Tesla", assetClass: "Stocks", outlook: "Event Sensitive", safety: "High", status: "Waiting Confirmation" },
    { symbol: "NVDA", label: "Nvidia", assetClass: "Stocks", outlook: "Momentum", safety: "Medium High", status: "Monitoring" },
    { symbol: "MSFT", label: "Microsoft", assetClass: "Stocks", outlook: "Stable", safety: "Medium", status: "Monitoring" },
    { symbol: "NAS100", label: "Nasdaq 100", assetClass: "Indices", outlook: "Cautiously Bullish", safety: "Medium High", status: "Waiting Confirmation" },
    { symbol: "US30", label: "Dow Jones", assetClass: "Indices", outlook: "Balanced", safety: "Medium", status: "Monitoring" },
    { symbol: "SPX500", label: "S&P 500", assetClass: "Indices", outlook: "Cautiously Bullish", safety: "Medium", status: "Monitoring" }
  ];
  var alphaMacroEvents = [
    { event: "CPI", time: "Data source not connected", previous: "Data source not connected", forecast: "Data source not connected", actual: "Pending", risk: "High" },
    { event: "NFP", time: "Data source not connected", previous: "Data source not connected", forecast: "Data source not connected", actual: "Pending", risk: "High" },
    { event: "FOMC", time: "Data source not connected", previous: "Data source not connected", forecast: "Data source not connected", actual: "Pending", risk: "High" }
  ];
  var storedJarvisChat = JSON.parse(localStorage.getItem("jarvis-conversation") || "[]").filter((item) => !item.thinking);
  var storedPotentialTradeState = JSON.parse(localStorage.getItem("jarvis-potential-trades") || "{}");
  var storedPotentialTradeFeedback = JSON.parse(localStorage.getItem("jarvis-trade-feedback") || "[]");
  var storedPotentialTradeOutcomes = JSON.parse(localStorage.getItem("jarvis-trade-outcomes") || "{}");
  var storedJarvisMemory = JSON.parse(
    localStorage.getItem("jarvis-memory") || JSON.stringify({
      lastIntent: "",
      previousQuestion: "",
      lastQuestion: "",
      repeatedMistakes: [],
      missionsCompleted: 0,
      lastInstrument: "",
      lastUpdated: ""
    })
  );
  var state = {
    isLoggedIn: false,
    isAdminUser: false,
    activePage: "Home",
    role: "user",
    loginHour: (/* @__PURE__ */ new Date()).getHours(),
    brainData: null,
    adminBrainData: null,
    adminChat: [
      {
        role: "jarvis",
        text: "Master command is online. Ask about users, deposits, unlocks, alerts, MT5 status, or engine health."
      }
    ],
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
      language: "en",
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
        language: "en"
      },
      memory: storedJarvisMemory,
      isProcessing: false
    }
  };
  var logoSrc = "data:image/webp;base64,UklGRuwtAABXRUJQVlA4WAoAAAAQAAAAawIAqQAAQUxQSN0MAAAB50AWYLJrADFkkL9fCBGR+KeDt9u287a1ba3hjeCLJDtO1uvu//+PAiQHQEob+3VG9H8C+Mv/f/n/L///T+FvWLYj0zlv4WNtyeDOhD1nEU64YBO9Vc7NwpHEOgNLzYWKTxdYa/MRF2rTBHHInM7niOc8xGWmdbCwTb7IjzXVDr+O9R4BYu2wd+7A85Vr8WV3NOxU5QFcHi3PiuYlp0lCAkkC0rJJUiWf2yi/1fqff5d5IXkXOLtu4L91m+wrB1R9fb8Wr+rP7zVkpBdN5w2Q4iKBxPzaPJImKTBcfxf/VtPCdAbdYxHmvfK3bhQeDlDzFmrrWAbLr+I/2sjK30aZAHxONe7l6btYr7KSBgvwBc0eBonyPkrKNG8bwHwbAkjQKtBwauMYuWZiNgBCctQbYGonAZ79Fpg3KM3oNFssAGEZOdgFG8BPzicHixENnZHEwQcmdHkuFt6K3dgoAJyACNsG69ABK+etjvZWOhNpjy84R7fH5BeYAROOuib1I+AZxTaiw/6SA28iwQwEDOj5GBDN0oEu9xjKV6E75IFoIkoPcIIy1pxrBQdE3eZxCSBCHkWYxB7oT1oBLFTgAU54DvrQZp0zHMkVTF5XAKYEaQw9HzbqYOsPmDKAhQQ4WM6kI53uAZsVsT/AR8codr/hGvkS5QRW8DeIx+Br6mmBE7NF6ksl+2kMMRmpHRfwMxD4O1ioWAHO0LMSVAQsAAYC112s+TiGZia4hvrbD2AhXsB6wvU14dORmWQj9n0niME84xrMTbhOaSFCAtZ05JI7MwmgSdMtkR5IEuTRBMFGxfRWIgVcyhMKkahaqIfVk0C1Ee0xERDCbWEh6pcqK1ONBqnFN/yqMaBdZLZjui8sxMQTuIXEYqZaNnB7GzzRqJojC7yblxVslwsgSWyEgLdR4ZJB2HPeU2FEZ8jZRrS+GhbCc6l5oqzMuEAIGCUIBvuZAJKUWGAeTR4CYORvq7RxBRdZYKlQOEpvIyJNEwmVsEJ0YylCgtkqvR1/pV+QDniesALYtA5ThXocTY4IsmV9OzwvdDAgiciuhfgCf85XvOMHHRrME1Ujke4MC7HeAZWDNixYOweoZEz7iszi24F8Aw5JbcTTrDqySG3a3tUEXG0t5j1MhLUrVDINqhVQiYXeUXm1+Qw9VQv4GlRfO9i4W8MsXo7E4x/sLzZqoYqbBlXZQHf2sJuud9iRjJKZr+AZ2JIUgDfzy26+gydrDUiYyMoFSYJ5VE07kMx86Cp0tBk5B315o7M2svGo4p5M48k5StWwEXiHn+5otvLdhEqkz35QbVAfgYWEVWB63lE2InQTWUCarqNKNiHDPKKAiGozM1gIJuItYRU7Wgv14MBmInMyEwvYYB1UrgIwBSORMX53HropTQThBKjmGdgHQNhM78X1E3uKZu6MSkJiYGsnBiJG5LdS9sHUSwAWook4XQTSNLoAvh0LsiW+G3Wy9OIpJ4zcMZUM6rWYUBmY2bVZINxQkCHMwNJL2cW+iVDtUahkVL+A4CocNhEEbgib0r8RcbiWB9X2gITOYTNP78IVdKSuaKYSlkEVVqACPArXYCK8iaUr35vDREw7bmdQZ2DeWdh3gIUc6w3JENh6Cr15q32V+FH1gDWiioNYg2CT3kcGdFN8Y6KdfxSM6xCACqXf8zbCvYdA6sl1txqppsHFE9DOn8Rhk5n7kSH8MJ2Y24TuWGgF8BxUme8DkcPeBgekOd7c/ATQkclFX3POO1cJfuenP8BEhST9IjGwX7Xl1AIWonS+A99ugtnhZThRP5Rd2vHec9g5z4q6c0ZCVcb2jCQ5wB9bW+DTDQAryJBdHWre3wQt4tDKMxUMg41qa7suZ48MiRFWh465Jhn1F5NRnaE9T0gS+OSOzbgJqwm2WwAZwneAgE74JvSXIYMdw7uW8ykeNoIM8w1MNrBC3DjVWN15iAmsGN6qxcTZGMAkMkO8AZAhZICIjgcmwHvAgffelSkAIXv1h5+gQRphWD5WvI1Ywj3IkATzA9BJiHjqznE8zOovE77Bg1X1e3R5A4+PZBumwPVkSOlgy+cWyKHinPN7LoCO9nO0xWtcqRINIEQwEXTwMkjhkCxxBR7QKZgcZ5PO9+O7AL4GVsY2TIBRbJfwNed2qj4GGVN3DtBFO3I7vtFzTEkS1g673Kp/juvuHLszJgKexaCu/bapmojpXoDtiG5vfw0+mIiRrXLil8FcmcFE3AaW7yPxzWj7KYghBIswwWS2Xc6zUJ1TqsQW4L/YD5RxnrmcZwUTvUbVjCqs/JzL5AdAwuZ3KyLnJQwX6iEGmqy4vEcMjqqHa6XAE0w0oryfoULr2ea4BZc2yTQ84foCvLOaIKaxNBEi6sHxZaEOwq1MLZ7HLvnHRDjPYN5g7iPxsImfAnCdqcDqOZoW8BVaByYsxH8OlglMRAhhLAUPkjQ3Y+XD8VwG2L6sxOTGEqFG+xdgoc/hARcqrQa0OkmfDustaTTFGu0D86cjuMwKk8z8mCMDWCjx95V/2F3YBHAtUrPf8LTJMCN7IizjCNRL1QS+YP0EfDNghqcBLLQQKTOa6DTYCHjxIQHZSCVWyzKeYh8RrKpvz7XLoL9xfgYqgI0YypJEoMuQzR6fQWi3IcmgVDnjsNogjx/f3+TAQqwV3p1vtxQPOwRgIlZGsCtUwXfhcM5o9+0FaESUtJmostqJcVwAv7sAHFiIB7C9h7ap0QsmSViq5MkMYOSW0eOJhXZ6tnHwBN4djQhIYi78oVjhoIkgDZ5IPnCDwAKsnw2V0wHUxzR4Ehl3IzPwgA9HZyKQFwNMxOh1LgO6jXL+cOK5DcICKomtwujhizsRkOHJO5shtXEmZcFhh4mGz29AJYCna6sZ/vXWgLUNOpUqqkRczTEZafAs4FxBmOneQpTf8N62DjjrUAnsAZ4B9QOo4iD3tTTg3a1tZDGzs0AqXCEw0dgpCy74AxYqPPDW7J8w7z32BAsqATL7mTCiAroKDcqPBA+VFDmYANUizBUHeDNV/KhxFS74sFLl8YlsCedQyXKEuEOZQwE4SpuFDHnUcJkNwGiGBT6PJRHYOexBJccdMAOYiKErSVzRRSuRE+ETqarkdAFzhLxz0EYQmIaOuwATgI2fgcCHE3ccqFaNp7CCZdCockk/W4klAJ+JDuw6h46dj5iIYesKXpfglVixyY/oCHxE3tcAggB3ZjGbBw2VK9uwAtONTX25A2EHfgg7vCosNDQRy14cK5LE3YhIeW++n+PaeeArc8BJEm1txKC9HjZ8F68PY0N77LwyahcZRRkkifsRr4IPwx3w7CZUwtRiBRMNmECuTNfCpv5hoL0FcAU7nqbbKAJVgOU6shG54DMBPARfqKT1C0w0arh4tPIfiI5MEMLe1gwrjZs/VyJgUyb4JHRoBh8BSZpo/QAYQ5K0cPXYgAMLzzc2P2DyBygdEFFJn1aR1ziZauAv9gALFR58Db7el6PUwQN0hYlgwoVRsiJJG0wX2xqUlQSv9zXBapNQyZXEkxAHyRQqXD8CFoJcUMxc+XoZEjpVLegxF9goMExXwj0kWKzqRWR5Y6Vs1A2QABvmYZKQJK4f4GEjWAskwfqpMHUyR7NpmLDeRL3dle9Ax9lXJXSSHGAiP0oWdBfzZiXqxZP1dro+5dwBIrGPAMmI0RlhW+HlK8w3ULVzgaw/GdIlZlhsmH+I7X5qTieZYCskCWDuo26iwmXgMSaAQKnKfZqIav5+cuFsBIR2QM4OTnnAgdvr+mUiRmcEpR1/dwtX/oLtQTJJMNGjA3QamJk2dIWAjSppXEDaJlQS3fWmYjMSy8+VvuEPyMR5GjrA1UCGG2RyqADknhKYvRZG5QJLJqkWws3ha8HjvXOuL+DLSLQOAUIhQ77BBVAtk3rCSoH0gMeYADbQ7sRtGom6j8H74J1zuL4c6sfhHA4H3lHKliewHYi4OxA4yMMCp4N3J6nY957eZW5x0Kc8yZ4EPFAd8LcgMTR1Q+qkU9eF1ADUMgLkQ7kDt+dHjAcdJwHxCls3Ui2Ebo6qtYXaw5MJ7dPnnCsTqOmQ+JFp4MoRUPMK4PuYgay7BsIrHpEWHr7ZvtoXYRsIaniFFf72z291XIkdALpvHHhkGHk22EAdMxLV9ALwR53T6TbpzhZIJiI3AHXtxsh6id/3BHzfFmw8vdE0oHj9baO+gwSSHlxwhb/987t4fB14PPwOR5yflococx/369mdH0ywKlSA+PhS+v4FjwZPoiQ3uenr5xh1QQEQ9M1ojL7ySNQd1fUC9YmeM6Spm2+7nC5QnSB+ZXisieOOu4yMxGexUp0S4HMoWJfigkttfzu37mR/AEKg/VI7Gup4PB6P88E3maI758BRnQKGoVncwPXwl///8v9f/v8ftABWUDgg6CAAAJCDAJ0BKmwCqgA+YS6TR6QiIaElUsowgAwJZW7hcc4A/gGTkvAf1nQG/7xq/+z4Zpj8n/vFzNG3P0TX6O/e+c1yD2Q+vvuu782N5SHl37R+cvan/zfVZ/X/UF52/ma81/0vb1j6QHTc4C7/gPx08Ff7Z+Svof+MfL/2f8p/7xnofuX+l/vXpF3x/JrUF/I/6L/wd5t1f/Mf9X1AvYn6l/zvDl1F+/fsBfyv+k/8D1P/0fg0fV/8x+1vwA/yn+tf9f/Cfln9K38t/1/8l/mf209qf5x/kf+v/oPgF/lH9Z/5/+D9uP1vfur/7vcv/WX/zE1nUy8SDhl4kHDLxIOGXiQcMvEg4ZeJBwy2mWHKmdYp+kUv5lNtqebOxWaTdbxiR9kA5XAax+sscFY036HEiQBZCaNp64rJ+7QRJJdBNNUwcTrNMGq1M7YNkYjlurqlKUWpQ4tRFK511Z/beVK/zzrB/vD3MUFKHwOiy8SDhjOdv1xbyBsRxK9gT3ZKDHZtFsQieSdgUzcpHilHomoLd4cQkgHLDrs/I8/kpp0Vz+U7Po69umXFLN36J8n6EXQHxa5W9arj86pGrcnOVymR+UPgdFl4kHDLvJJDkXvRWA4kJ7liXJ/LCetewjA43LUbBbMaa350CTK8GfTkbrldhQIhtcLT8UjjzYGJh3l+eNV+7UqTdv53Pev49ol5wo08UPgdFl4kHBZ9jfCQH2lIZ8rQ0/4vjV0sEJ+rduuh0ovd9BQDHHE5JAztxT7ymV9NG9UtzA73LbuFHhFdoZWDwQQxKHFzpiZ5iPD5WmCoUocSKuUPgdFl4kHA0jKsef4NnTr4KE5pg+METh74VS2slMmKvXdvonf/vG54h/76uKjcrJo658AIAoCY/Qa7u+M9+csR10nGOF3FRnHwhvPga05dAqM/Ucf+3F+MEeHcSDhl4kHDLxDXK1sg0psQ4Fv2QST9Y9uAbwqzf5YHTw7WylkyUz2wxfOK2JEtJ043i+UR7hmD6bDMpIz+CcK0Oxa4n7mlN0yFoXA4gSvKHwOiy8SDhlo3IhR5CM3vs23WioinKqaurtoc62+OCdOHTv+X8UcwHc5B/nOKZHsjfquHRmVwt1o+fPRh5SoN5t3o981HmjjTxQ+B0WXiGv6xFzhP0I/YvXXf/snJ1ALTXFZ/8KOef6S9gEgSrFGdZ/Qv8A7ngCBr0IqVMZdDTI4snbSZQE49anu3su4t8Qabd7lMrq+qiF/waCQKrtcLRYMp77kcjrjqqWKLLxIOGXiP5YSxaVpJVOv09+eTKBSL/MFosK+M68YdU4TvI253Ef5M6TZJEZbuWAdZfLZd9o8IXxJ+68qa8qIH/G1I3ryEvcjyG+7llDnTtOUZc5TS85SuUPgdFl4kHDLxIOGXiQcMvEg4ZeJBwwgAAP7GcAAAADmgaSrBKxfBl0UTq3hYlEvsLwUbvUrFSCzhC4QcwS2FzZzLFoJbOnOlcnIFmQQa7RX9/IIAtdvZdZzCrYxu/XJ02GvXS/NmjwyExhZEHRTIyoC1RCfFdV1JNBsaiH1RzSs3BAqqwOqHzMhr//gcnsI4E96B3SrS9BWtVa/+QEM6FLDKze1uedIE3RD7vcoGGedBDopx7KXsb+tczpJd3ApQjsYAekAyY4nRyCP9oaUBvSyThzafW7wn5s2tg//vWVAa4S/HhD/HvRkOANf7/iZgzQUbjgbv0e/c8/wr7dpJEsVmyi5AdoB5skkGQQbMMaZtQ8HyGJqQARqCu04LNu+7eI8CL279XpWJdqUpowLJ2zOw80jvvcPan3JPVg9cffATl/r4rZGPwiftJnRRmGTP8GaapErb/VYi2UzoDylE1Ww05jxBdWY3teuVUCGkLmJOAnWxDqt+mFniWh5Rya13K6h9j1gpN8mE6mUMx5AxlIkjkVB8cCWX6NYwcbFQLEI8PaopIfZg8vY1HYf11Ikj+8YMnYqkLcsuuLRs4QJTwA2DORCzyPCQO5jxoBAHkUjPiopxBk6hO8uwO523nbd0wiUMNJh/KoDqcF1uiTIu8dGSVwGsU3dG8q4gS0anhZi4Zua1jqVqSxfWcJxg2Mum858am7Y8fJHIUxb9DcZ2XDZMMnT8tAyMUVkSOfrfh/r/i5q7NEwXkhaVaaSDiEvaMQP2TJWDL9duC3Eobinqezp2fWxJzws7Nhb8JrLYSc/pBcbdmHUFcjCcceQarVPpdAdCniqT5spwq+bov9QK47HF87IDUi2T5yrzdCuvUWdXtJJQY/fSTW6wUoYx1GryMGd0eLDDUQzViCYb29iZkzQ4ea8jIWen0CKQ8wbde1KZbAxhaKwiHwIsostDYMtB+Csoqp6bA8B65EsMvckLAMr/eiGbStlJlOATx7OqZeLxWJepezYpQ+DmKrQ7MNioOmGrEZmDEg77j8OOVFJYwmChLih0aXSslPqGucXo2Dj3ZIahrACeb7RLfo2vgmxmQE4tPb/ajfpayaraZyXcyjL+xr3h43uHnRVxTa6r9e69fZrybKzLvF6yePcj4rdUH4TCECkiUEeC1FczFDOMmBNrTOvcPWGxHyKVSmg4UAACqqZaTXaTLIAvSkxmpwgLsrhQQpu9oM7pUXUNXH52W1xdAs/Z9EOZDtO19tnljg5/xF8ElhTVmmBXV2MOfBr6yzTOsiVZd7AWpGyPXv8nyYPwbVHl2qu5t2RKq0Uu97/fFYMmM04VwWkDM1/kf7D4hXLi+xTO6V9qO0wDG5ngzzIMIUfPQ+TnMdTI440UMfKbsixW5YxfzFwuXyOKWM0ofvBnJRtmd4vt5WEM4ZCImgv1JdLD1ibaJQHjdyepGWrBeaa0adqldZOStKDhf8i8K9kAWUhArATnvrudHG8bRM0iOzAxsOxQweS/HVmAYxm7c6IoQlwtArrK+F+0AvnPBaTqBNRZ0rRYx5XTRo1YjBkmt5HKSqK8wsL4IMbr6GKzHNXV5YnXcT5nTTk/1bxB35Bt0RxdsxbHL5/ALymPNobN6ssAsqoHOGVQzRao+s4o7olLNtkqjP2HF8dArm8CaNolEbh9da5ydGe9DjibFviZqHfJlkwlg+XaxyNFZ+bgMI/q4YS0mn+6pORWd61fG+nWncyh2r7U1KBnubptNpYadcsvkFrWb37Ob59qay/OQIVmuMry9fqr29d+z1UuXXFTl23FjM8Zh2qr85KEetxOMPauK/6abtAr03o8D1eCglqtpzkmQgdjuLkpPYUQ/CNxSL1S45SBhW8C4dlxNKF4HL9sxc8tIlsRHYXjLZYGrdbSsRUAi+/OGqUQlOUomikZXn0OnLn+lBROk4963TMmgUddJkiUpW/1DBYoKKmB+X/EIqZ/kt4LV0wzr4nsVOsgNL8yuttfOGi0yns9DT5hpkOC/fRUcnqE+bfoJwxH4tr8AeAOSBnDwJDdNJHf9VUST5F8cuyWTHbykySfd74yeCtaOuDKj15T8bIhFx+eP2rLViw7KoXvIQmn1I/7GTwEa7kc/s3D1TYUnWlCyuXgdzAHCzYgTi+W6N9NA020J1cI1Zj9bwaUQsOw4OrK3rQY/OgkEWf65oCPWIBpTz1zEd+SEI8gWTYHVcAxFzzV/Q7IFMnLOM+Cbo5iNymyNF1aVIziLVcyAGayWx2X5GxE54mgLL78vI7FQ9ohEnV+cSwFt2Zy2OXGS2leIFidgibQ8L2GETJFkxzBsAEKs8anuv0V9UBCsWozjW3bZ9uB6vdtsMH7xoL3eFwgSTAMTrNVps6NmmYiSs01eoooOqgh97yeO6Li23F2fmsqrlAWGk0MsbDieRIlNJ6EiUWw/o1A4283oRfW2qldIF91RdNE32PBZC//gZbmGgv4rsT22whTiSIdZADZ2M23mw+VL4xMhANRrAluiG7QXNIwXBhLuSERiNNPCgUbeWWENQ+ug4p4e3I++Qu4ajF/SAbXEUrFX6uJQf6UdeIPDCqAzuei0Ky0nBxjUKfAXsmr4crPibVNYbdkXzDZiI/3Yx5Ee2v92WCLkbZNRtpn0RZb0YaCo1uM+/GwsC8//Ht3SEbaT1i69BjyL7C7PqRzkihFrRMEjZZEXHco9XEk/HnHXrImBHwP9Hk81zeGduqHba7Yb2I6SFpVp1dpDSlFqQDKnKtPZeebFFLH7Gakj9opAHl4RSgYvYCN/8ZaQwvTkQpskYEMYxUTB8MvA1T7jjZfAkf5VGorOf4x1loBY5rZxD4wbiUPE+i9pzDJkzRxpR0g+eNU0rX3l4BRmVYQzhL9zsXsc+iZ5a4hDeQ+dGtU3RLepexvg98TloWvFK9SdqotB4KCYSMiOrcOle4C9MGs0IOgXCXJLDSj6caHeYiYn2WK3RHHsHxBnR1HqdYUqTYb3ugkCal2UmuS1gJ67LRvLkBXrgBItycYLMxSPFAIV4pHsOBwfhIiY/s7NSoolT1Dgb71/fRnND1Zhr+sCjKz3PSM8S+h3Igk81y595wcSXWtnbCvJwFRHCVZjBzREzLCam8je97xhZciKuGlyU8mwJI71JWeVkVCD64alsrHmmA2El+TjhVXy4Vp7V+B9/bA3/h7aFiqngUwwyyG3TGeZycAKkO4GyxCHZiFPOIJSDulhW3QRP9lEFu5ZbJl/QcUHEZoN3ePj7c6FxjBHzMOaNIAgj38XNQXQzZUcFdqqcqgtZmChsbW6cJrx0uDSukQspgVKr2/BTGN7QExRRcS7lDLRiYbWH3UyfQUqS93lMikZ/OTUDCV8C6bAX39a4ebVAVfhtflMOLytWEn7cqo+6dnIiCvFji0aHtJ5zHljGQNfm8uLmhH6JQ3OIVrzWqgTqfqO+QNb1+uQqZM0CdPJsDf50k13ciafEq/gWuVL8uLiiBbUqvHnDO1wimcN2hGA5kfrTCLSd6pndJv+b8NWna+yjuIt2CkY0Wvw3aLFcyHfBPBsdOC8gijYmH6mnouvnsrflDxwAmtc5GQQXy0WbTidLFHdXiSxKAv+sTUN/6oUs8NNh4oWidC+YX7U1Aut4zJmaBIzEqN5TE67Lx+VsN0tgg81LXA19cfwWLs7TN+0tABYJ2pgj2qEiwzc2qgr1L9aOEcucsffC9578FtPaUkPIbD0yaUyURzHXdBlpEWx/DN285enrmgCmiZ7g0QKFxv4MEwNkvolM+pHfXrdR9Lyvo4ZEke0Ye5KGndSz0zuNtz2OQxFrIRZQhw3KYCFfjsOsrkTAmfuYPqNh/g0N9QON/IGW4htmTtLyj81QCNL8h0x9z/ezbB/VdhGD5KkeDtCpwaq2tJJKqlZrvRMPPRCg4wMaRo9RW3dfmsuVZ1vGqAC4QydnreMz9jnK1HxaVzkoBQzcd314qd8Xt18WVooTBwjDPglXmZYh+gQ9H34WPVcbRcE/FaoGnS0bdiRaFHHtpXeNuGioNoJgwdpM3tdFUetmNFKOZkksQ+FsZfkvvUilC91Fzwr59QmHWY+8E8xhOjL249KqPDFDlPVyY36DYBWDlzxmKP6NN4Tzi7thzVjWlZ+SYkf9eqsF6T54bVi9qVO+FKyvarjbsVQvrw7NydgYbHqpKCoqShKb1VqPGiEgI0PLKAJU5EyG56CzPlaP6V1YoznAIig06Gz10ruaj7PYOh+SsqhTMCbcfZRzLGOzJ8lQzO1bg6ZRmy7YWRegM689oGpOEzeBB28bnABcjAC/OPFdoBLWlqn0tDxrHzBi8GeNvWeltgqXJoYe3eMunzXOQEZ495oyN292okr08bJkKXi4GDLzTf/nP+kKB+YPw5Lg+ND2NV5fW9q8kkhYFXKZ+WyLG1I6X9S9JUC2HPjtRLQ9u5dAtp6FgDq0N+F4Eu/2uIIh9sAABdApeEY642TIvAXNaJFZ2RvQxfrt0GgbpWhoBamNgIw4vRDIUu8PQk2NBtqt0yMUAizjch3sqKR4p2NVOoK/vo2h2XjwKNVqfIIihdDmGEQoS1TU0CUkfiFjKvKsI2yAsOFwPGA7Pz1ltPrZ6c+Sd87SBJjJyabvG7+Biz+68+yad4JmcQrzRCs5qhKsWygyJqDODbpDd1fFBfz+cYU7sntd5Ocg2IoYQq9663cjErVl8iKQvOqFqjUgEKfz0bHfycrfs1tPlp/qbe/bCfIdYYtYvwatyeIIq1lcpUnLaO7HSwm0MjUbPLatN2a7OmcgrWdTzzg9z4W5kpVD/T/s+peuox4reXlAdG1EBBH7f/HocqtLzzMTpFA5FJjWCxnmNPU7Vu6J9QC2zy5dFm/oJYi9a9FglKOOyzcNyYYccFw9UXU51iXM62Vzf8NGj36Zq4MF1gkZlWrS4V9hpi5wre6jOcSmt895F9Wgo6rzwudXL1tO3kC/LLg8S/kdUWFrbC9sZCY2CwEWwvqsj+tR8KXBf//c8QaNCZqsX6YFdeSL8IGAmD5Kj/v9bAkIOB8pFmquD4gjWFS8MJsVpY/2vi4Agv1hy7womXpfi6kty+DFTUOA2GsF+tQ9RMip5L7lwj/QKoQt8frNBD+ntxhqES/YxOsddGxHHvwGH/iA1bGEYe99HYNBc/3JR0LQs32C4Yr0XHqCjwNl3WZrFKCLd59PET3gijVzI9ZMr+HiYdnNmgJG0oUWiFmY9rWknpEKEIfLAE7z8u5zssrzzwhTPS5czyl2oLb0MUIGu9pi/NKJ5lUqkoFP7B74lJERVjMGaDKxLtYkkmO8JbzvpNqwI1ZmKf8HATItLzQRgP+E5I5qgonI79/v0FJ3o1Dy02vCqH0yHwUtb8igTwc0GYQouMgsedVBr3b7VKIws/Q4WnotFQKrKr3Dg7MilbO/4tlZOhgD3kCpatt7qMxDIVWCZ4u93jzY5qSP9uliJcY1TBRG8dQJ+gSZIwUedsR+1F06YbXBzWt+D/x/OGv+uMUsF2Tq025tSHW5o0kQxjE2YFGORBRYy1JoFAB1wVtDsAGyasyOwKbcknK2RZOlfU4qdHM0pVFmOIy35VqImRmahlOoIjB7ypyXLQYHmjxZtH+qHfXHlh6Nv/rgS/RTNBkBI2+Aa50LzvBhQop32vb6zgvajc/7MRtExBAuEStncNT1NhZ5KdGXjMPXp2pWY8Agpm2LcEf3b4FmyT60eEgjIPC0SezAp4tr2KIgJzSKV5jYKlCzKaDo9NqOHf6vl/3X/3DBIZtSCjdvxL4L9WoxS9XroUtkWnyhLWpDqUuKTy4bNUgjBWd60Mfe8fJJwy6+ekyeGbeCm0EVECxl8Jt5N4XpuLm0bQAbMsztpEiGb/zXIHfqYjgkIsdmIl/3hTFUHbyeCvH+HDSa2oS5u6SC1xI6itzs0ChFw5is7M5G9HMFI2dPpp/jmCjwsHAicwMow+gVGJti+8UoNSeTcOG8BWBV1fONiBEtH4nxVyiwhFnWA27gGaYpfvI66ZVCJg0Fum2MVp90xTwW21WdwnErng6WkT+8OS6kW5POnwIMISkXxPzgRMm9Qc81C/JBFo6lTSUrZacp2BBOv/pDfUWM6ojtsxymp/znHk3cGiVBFOxguM0tWtPpwOisL72E9so5/QTVESL8zhyE2dAt8y+g/LS+VJYOKSFvBje9tKUiA/R1Ci80CC5KxJ0b3U/bHciK/rNfoeixyyuyHCV06maeiirGvsAJcbWlE3FhmIBvSrb0BkNwUtR+0KYqe5/lVXALgH7FfLP0YQyAjAPmLfrLX8ksFfb55besQ2nKLGFn9/FqRwQrZzXpdp0OLGMO96cdOw7ujUSoy0QCI8mVVW0ZuOquQfJu5NuhTrKgLcDbtKma/6UBUo++Qpx1nwWv8XyMbb1Ttr1mVmUX5ozDwbkmF4KgX0rhYA7Sjjpivaukw3Gu9Wij1Ihw7rjKQWHSPlMbfXbl5SNP5JtQph1BY2PORmoICeQFHDXDhhmYgVicAsX1NgTaeLZLlNi3lDz+RmoSxIGCGQQnp0Eh6DI1Um3RMf9bu4bWbXATqjrHCe+7dtmOMXnGBnuhHCcaBn3l+fiZ7YLF6aPi6QoCkyzy0DalMc9A8v/eosI2W/1Dp+PqryUF9TkYDuuHLu8XZfCAAoabh87zK3HdDv2g2aB8cA1g9cFM8TkNLcrd3hZOpRfUU/4CxPOVfWs8S9q9gSeXUjmXayZExuvR2vUH6DlG0GkBRlU46qVVCwaEXAytLPt0q0VJ/7z7xDgDKiRJoidfg8wAImWWCRv3r/rvOZ2IdcK81nSgEmVVxgNN+Y0JRUHdrx2bxheJwmoW/8hpFdy4yiRawVQU/M6VoqMUkK8JQ78Xkj8NZxm2KQBD10fIZ6TV2wKnXSRiv58ca4GA+kXhD0uvJYqIc5Utdet1Ja0YkjaOGi9MXKAo62zQtqgzroMs4IrDTHOqJXZal2bjc/OrA/dE0lPpyTEzLxYD1QEJJaivoxB8nLOxWx70JQJcUZchi2ff4qgPV3PMjZErotyeje2tkChkLJfatwrqvfzJ7aOCohxFhyAt8wN5VHtVC8nrr5eriykgJBN8Z0ylzt0y9pZfwzcdxUloJ8UHUz/IwMtDEAV9amaqvZ+OJiVFgKcXQrx625WeE0DwIyO+mOM6KgQbOR+ZCuTNWH0Lx/hCnB97v6UNnCoAZdPpnG7D171bGtuJCRwj+FHBQPdSA6uY4EKZOimkShmNLcb2kGdX09JY7WR+fqn6AzesRm9K1uvsbQJs9nleIC1DiIflKjPWOIzTziZFmDrGL/Tpy7APbGLqLp8X78eUXKKkCdedTC6AQbaIHzGGsrfgHfXq/YHA/OnA5o5DrHS9/B3E/VyOTcnBaIRccwMBszVWWR6OkfF7pIZbTMgr+jLSbRvTOLvjwawWKeJlUrB5man3RGjtvQ5fxuwloOhc0OK8wql+HI85Jpz9C5XhCmjHlWapAbAVZ12nNzpETbiHH5i1vw18JKpZSg/JTNjnBdK8X0lOmyp6WifckGpgTowrNfniImbX03Et/MWzgmRhqYfp8qbYclGak8TxQJvODnfO9wVzTJJr/pAFz01pVMSpygoLOOInycAFgM65SzpLGCnyK4X5wSvluXLg2maERn/2wMyqIFZOwwyVhbRH8dUKhPTItFC1N/JOwAZFBH9WlDl4k2HALCQzuZ4OQhssIkHrt+n8j2V3tVHpEEaPHfzJ4tBGoN3ZzpkLrMh27iOaPfU7CuxctBv3LEc8F5EkMCjMVCELfEChabSLycOo3zTmEHW4blmzajVs6kbf4UCdBIIxNgPC9ejArkT1eP5WSGyULAGcYqsAoahwHJ4k35CvvcVGmCsysbPCRU4esWfvi/Odp/pZ85BtNql13jwW782Nisnix6nAz5EAZdTyPvixs925tuM+9yJVUH1jxB/JyU+hGbeiUZsvPRmFhfgnyVfuWWD0mqig9r2nrUmpvyJyW5bG7jxBwzXNm+Q7AL4GAdD0HxCLz14Ez8HrumAQTiMgxU/KQxeXMIfslImx8d0nvXuPyxJUSbMsYrlVeH85HqIgHAddRXjmeNDLBg29vulIx2xq6imkbEE9fkc73G/Lr3BqfzPyEngEApA6oDrVBrkQME2bH8jzFMyFG3Lr6ysrcKlN44P7pqRSaAWr75XaHvP1mYf8LMAHDZYi+d+7doX6EO5o9QITe38HeVrPoAAAAAAAAAAAAA==";
  var app = document.getElementById("app");
  function el(tag, className, html = "") {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html) node.innerHTML = html;
    return node;
  }
  async function render() {
    app.innerHTML = "";
    if (state.isLoggedIn) {
      await ensureBrainData();
    }
    app.appendChild(state.isLoggedIn ? shell() : loginPage());
  }
  async function ensureBrainData() {
    state.brainData = state.brainData || await loadBrainData();
    if (state.role === "admin") {
      state.adminBrainData = state.adminBrainData || await loadAdminBrainData();
    }
  }
  function loginPage() {
    const page = el("main", "login-page");
    page.innerHTML = `
    <section class="login-panel">
      <div class="login-copy">
        <div class="login-brand-stage">
          <img class="apex-logo hero-logo" src="${logoSrc}" alt="APEX" />
          <span>ATTITUDE \u2022 IMPROVE \u2022 GROWTH</span>
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
      render();
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
    const layout = el("div", "app-shell");
    layout.appendChild(sidebar());
    const main = el("main", "workspace");
    main.appendChild(topbar());
    main.appendChild(state.role === "admin" ? adminPage() : userPage());
    layout.appendChild(main);
    return layout;
  }
  function sidebar() {
    const side = el("aside", "sidebar");
    const visibleNavItems = state.role === "admin" ? [...navItems, ...adminNavItems] : navItems;
    side.innerHTML = `
    <div class="brand-lockup compact">
      <img class="apex-logo" src="${logoSrc}" alt="APEX" />
      <div><p>APEX</p><span>JARVIS V2</span></div>
    </div>
    <nav></nav>
    ${state.isAdminUser ? `<button class="admin-switch">${state.role === "admin" ? "User Workspace" : "Master Center"}</button>` : ""}
  `;
    const nav = side.querySelector("nav");
    visibleNavItems.forEach((item) => {
      const button = el("button", item.page === state.activePage ? "active" : "", item.label);
      button.addEventListener("click", () => {
        state.activePage = item.page;
        render();
      });
      nav.appendChild(button);
    });
    const adminSwitch = side.querySelector(".admin-switch");
    if (adminSwitch) {
      adminSwitch.addEventListener("click", () => {
        if (!state.isAdminUser) return;
        state.role = state.role === "admin" ? "user" : "admin";
        state.activePage = state.role === "admin" ? "Command" : "Home";
        render();
      });
    }
    return side;
  }
  function topbar() {
    const bar = el("header", "topbar");
    bar.innerHTML = `
    <div>
      <p>${state.role === "admin" ? "Administrator Workspace" : mockUser.tier}</p>
      <h2>${state.role === "admin" ? "Admin Workspace" : "JARVIS Command Center"}</h2>
    </div>
    <div class="profile-pill">
      <span>${mockUser.name.slice(0, 1).toUpperCase()}</span>
      ${mockUser.name}
    </div>
  `;
    return bar;
  }
  function userPage() {
    const brain = state.brainData;
    const page = el("section", "page-stack");
    page.innerHTML = pageContentForActivePage(brain);
    bindJarvisMentorActions(page);
    bindChartUploadActions(page);
    bindWatchlistActions(page);
    bindPotentialTradeActions(page);
    return page;
  }
  function pageContentForActivePage(brain) {
    if (state.activePage === "Intelligence") return intelligencePageContent(brain);
    if (state.activePage === "Trading") return tradingPageContent(brain);
    if (state.activePage === "Journal") return journalPageContent();
    if (state.activePage === "Learning") return learningPageContent();
    if (state.activePage === "JARVIS") return jarvisPageContent(brain);
    if (["Growth", "Settings"].includes(state.activePage)) return backlogPageContent();
    return homePageContent(brain);
  }
  function homePageContent(brain) {
    var _a, _b;
    return `
    <section class="hero-workspace v2-command-hero">
      <div>
        <p class="eyebrow">${timeGreeting()}, ${mockUser.name}</p>
        <h1>Your AI Trading Intelligence Command Center</h1>
        <p>Ask, plan, compare, and prepare your trading decisions from one calm workspace.</p>
      </div>
      ${homeTalkPanel()}
      <div class="quick-action-grid">
        ${["Analyse Gold", "Market Outlook", "News Impact", "Trade Plan", "Compare Assets", "Macro Overview"].map((item) => `<button type="button" data-quick-prompt="${item}">${item}</button>`).join("")}
      </div>
    </section>
    <section class="workspace-section">
      <div class="section-heading"><p class="eyebrow">Today's Intelligence</p><h2>Everything you need before taking risk.</h2></div>
      <div class="module-grid today-layout v2-intel-grid">
        ${card("Market Pulse", `<strong>${brain.dailyBriefing.marketBias} \u2022 ${brain.dailyBriefing.confidence}%</strong><p>${brain.dailyBriefing.marketStructure}</p><div class="metric-line"><span>Session</span><b>${brain.dailyBriefing.session}</b></div>`)}
        ${card("Market Mode", `<strong>${brain.dailyBriefing.risk} Risk</strong><p>${brain.dailyBriefing.volatility} volatility. Liquidity context: ${brain.dailyBriefing.liquidityStatus}</p>`)}
        ${card("New Insight", `<strong>${((_a = brain.intelligence[0]) == null ? void 0 : _a.value) || "Bullish Context"}</strong><p>${((_b = brain.intelligence[0]) == null ? void 0 : _b.detail) || "JARVIS is watching market structure and confirmation quality."}</p>`)}
        ${card("Potential Opportunity", `<strong>${brain.opportunity.title}</strong><p>${brain.opportunity.summary}</p><div class="metric-line"><span>Quality</span><b>${brain.opportunity.quality}%</b></div>`)}
        ${card("Upcoming Events", `<strong>CPI / NFP / FOMC</strong><p>Macro calendar is prepared as placeholder data. Real news source connects later.</p><div class="metric-line"><span>News Risk</span><b>Medium</b></div>`)}
        ${card("AI Timeline", `<div class="activity-item">Market pulse refreshed</div><div class="activity-item">Potential Gold setup monitored</div><div class="activity-item">Risk profile checked</div>`)}
      </div>
    </section>
    <section class="workspace-section">
      <div class="section-heading"><p class="eyebrow">Continue</p><h2>Keep the workspace alive.</h2></div>
      <div class="module-grid action-layout">
        ${card("AI Coach", `<strong>${brain.aiCoach.title}</strong><p>${brain.aiCoach.message}</p><p>${brain.aiCoach.note}</p>`)}
        ${card("Recent Analysis", recentAnalysisCard())}
        ${card("Trading Health", `<div class="health-score">${brain.tradingHealth.score}</div><p>${brain.tradingHealth.riskStatus}. ${brain.tradingHealth.tradingStatus}. Daily drawdown ${brain.tradingHealth.dailyDrawdown}%.</p>`)}
      </div>
    </section>
  `;
  }
  function intelligencePageContent(brain) {
    const briefing = brain.dailyBriefing;
    const zones = briefing.keyZones.map((zone) => `<div class="metric-line"><span>Key Zone</span><b>${zone}</b></div>`).join("");
    return `
    <section class="hero-workspace">
      <div>
        <p class="eyebrow">Market Intelligence</p>
        <h1>Understand today's market.</h1>
      </div>
      ${coreMenuPanel("Market", ["Market Overview", "Potential Trades", "Watchlist", "Economic Calendar"])}
    </section>
    <section class="workspace-section">
      <div class="section-heading"><p class="eyebrow">Daily Briefing</p><h2>Context first. No blind signals.</h2></div>
      <div class="module-grid today-layout">
        ${card("Market Bias", `<strong>${briefing.marketBias} \u2022 ${briefing.confidence}%</strong><p>${briefing.marketStructure}</p><div class="metric-line"><span>Session</span><b>${briefing.session}</b></div><div class="metric-line"><span>Last Updated</span><b>${briefing.lastUpdated}</b></div>`)}
        ${card("Liquidity & Zones", `<p>${briefing.liquidityStatus}</p>${zones}`)}
        ${card("Plan & Risk", `<strong>${briefing.risk}</strong><p>${briefing.recommendation}</p><div class="metric-line"><span>Volatility</span><b>${briefing.volatility}</b></div>`, "mission-card")}
      </div>
    </section>
    <section class="workspace-section">
      <div class="section-heading"><p class="eyebrow">Alpha Preview / Demo Data</p><h2>Potential Trades.</h2></div>
      ${potentialTradeFiltersPanel()}
      <div class="module-grid potential-grid">
        ${potentialTradesCards()}
      </div>
    </section>
    <section class="workspace-section">
      <div class="section-heading"><p class="eyebrow">Trade Briefing</p><h2>Selected potential trade detail.</h2></div>
      ${potentialTradeDetailPanel()}
    </section>
    <section class="workspace-section">
      <div class="section-heading"><p class="eyebrow">Trade Pairing Mode</p><h2>Let JARVIS compare where quality is better.</h2></div>
      ${tradePairingPanel()}
    </section>
    <section class="workspace-section">
      <div class="section-heading"><p class="eyebrow">Watchlist</p><h2>Gold, forex, crypto, stocks and indices.</h2></div>
      ${watchlistPanel()}
    </section>
    <section class="workspace-section">
      <div class="section-heading"><p class="eyebrow">Accuracy Foundation</p><h2>Outcome tracking without fake accuracy claims.</h2></div>
      ${accuracyTrackerPanel()}
    </section>
    <section class="workspace-section">
      <div class="section-heading"><p class="eyebrow">Macro Brief</p><h2>Economic calendar structure.</h2></div>
      <div class="module-grid macro-grid">
        ${macroCalendarCards()}
      </div>
    </section>
  `;
  }
  function tradingPageContent(brain) {
    const goal = brain.profitGoal;
    const health = brain.tradingHealth;
    return `
    <section class="hero-workspace">
      <div>
        <p class="eyebrow">Trading Intelligence</p>
        <h1>Read-only account condition.</h1>
      </div>
      ${coreMenuPanel("Trading", ["Chart Analysis", "Trade Planner", "Risk Calculator"])}
    </section>
    <section class="workspace-section">
      <div class="section-heading"><p class="eyebrow">Mock MT5 Read-only</p><h2>Monitor condition. Never execute trades.</h2></div>
      <div class="module-grid growth-layout">
        ${card("Balance & Equity", `<strong>${formatMoney(goal.balance, goal.currency)}</strong><p>Equity ${formatMoney(goal.equity, goal.currency)}</p><div class="metric-line"><span>Risk Status</span><b>${goal.riskStatus}</b></div>`)}
        ${card("Today's Profit", `<div class="goal"><strong>+${goal.value} ${goal.currency}</strong><span>${goal.progress}% of daily goal</span></div><div class="progress"><i style="width:${goal.progress}%"></i></div>`)}
        ${card("Open Positions", `<strong>${goal.openPositions}</strong><p>Floating P/L +${goal.floatingPL} ${goal.currency}</p><div class="metric-line"><span>Daily Drawdown</span><b>${goal.dailyDrawdown}%</b></div>`)}
        ${card("Trading Health", `<div class="health-score">${health.score}</div><p>${health.riskStatus}. ${health.tradingStatus}. Read-only design.</p>`, "mission-card")}
      </div>
    </section>
    <section class="workspace-section">
      <div class="section-heading"><p class="eyebrow">Planning</p><h2>Entry, SL, TP and RR framework.</h2></div>
      <div class="module-grid trading-tools-grid">
        ${tradePlannerCard()}
        ${riskCalculatorCard(goal, health)}
        ${card("Chart Analysis", chartUploadCard(), "card-wide")}
      </div>
    </section>
  `;
  }
  function journalPageContent() {
    const missions = state.chartUpload.history;
    const rows = missions.length ? missions.map(
      (mission) => {
        var _a;
        return `
            <div class="archive-row">
              <div>
                <strong>${escapeHtml(mission.asset || mission.pair || "Market Mission")}</strong>
                <p>${escapeHtml(mission.userQuestion || ((_a = mission.journalDraft) == null ? void 0 : _a.question) || "Saved trading mission")}</p>
              </div>
              <span>${escapeHtml(mission.intent || "Mission")}</span>
              <b>${escapeHtml(mission.jarvisVerdict || mission.bias || "Review")}</b>
            </div>
          `;
      }
    ).join("") : `<div class="empty-state"><strong>No saved missions yet.</strong><p>Save a Mission from JARVIS and the journal will be created automatically.</p></div>`;
    return `
    <section class="hero-workspace">
      <div>
        <p class="eyebrow">Journal</p>
        <h1>Review the decision, not only the result.</h1>
      </div>
      ${coreMenuPanel("Journal", ["Trade Journal", "Mission Archive"])}
    </section>
    <section class="workspace-section">
      <div class="section-heading"><p class="eyebrow">Mission Memory</p><h2>Saved questions, plans and mentor notes.</h2></div>
      ${card("Mission Archive", rows, "card-wide archive-card")}
    </section>
    <section class="workspace-section">
      <div class="module-grid action-layout">
        ${card("Trade Journal", `<strong>Auto-created after Save Mission</strong><p>Each record keeps the question, intent, asset, class, capabilities, brief, trade plan, safety, notes, alternative scenario and disclaimer.</p>`)}
        ${card("Review Prompt", `<strong>Did I wait for confirmation?</strong><p>Respect invalidation. Avoid chasing. Protect emotional capital first.</p>`, "mission-card")}
        ${card("Memory Status", `<strong>${missions.length} saved</strong><p>Follow-up questions use the latest mission context when available.</p>`)}
      </div>
    </section>
  `;
  }
  function learningPageContent() {
    return `
    <section class="hero-workspace">
      <div>
        <p class="eyebrow">Learning</p>
        <h1>Build better market judgment.</h1>
      </div>
      ${coreMenuPanel("Learning", ["ICT / SMC Notes", "Mentor Lessons"])}
    </section>
    <section class="workspace-section">
      <div class="section-heading"><p class="eyebrow">Mentor Lessons</p><h2>Simple notes connected to real trading decisions.</h2></div>
      <div class="module-grid action-layout">
        ${card("ICT / SMC Notes", `<strong>Liquidity first.</strong><p>Mark recent highs and lows. Do not chase into the middle of a range.</p>`)}
        ${card("Risk Lesson", `<strong>Good setup, bad location is still bad risk.</strong><p>Wait for location, confirmation and clean invalidation.</p>`, "mission-card")}
        ${card("Psychology", `<strong>Waiting is active work.</strong><p>If the plan is unclear, standing aside protects your next decision.</p>`)}
      </div>
    </section>
  `;
  }
  function coreMenuPanel(title, items) {
    return `
    <article class="core-menu-panel">
      <span>${title}</span>
      <div>
        ${items.map((item) => `<b>${item}</b>`).join("")}
      </div>
    </article>
  `;
  }
  function potentialTradesCards() {
    const trades = getVisiblePotentialTrades();
    if (!trades.length) {
      return card(
        "No Matches",
        `<p>No potential trades match the current filters. Reduce one filter and let JARVIS compare again.</p>`,
        "potential-card"
      );
    }
    return trades.map(
      (trade) => card(
        trade.asset,
        `
            <div class="alpha-label">${trade.dataSourceStatus}</div>
            <strong>${trade.direction}</strong>
            <p>${trade.marketOutlook}</p>
            <div class="metric-line"><span>Asset Class</span><b>${trade.assetClass}</b></div>
            <div class="metric-line"><span>Confidence</span><b>${trade.confidence}</b></div>
            <div class="metric-line"><span>Trading Safety</span><b>${trade.tradingSafety}</b></div>
            <div class="metric-line"><span>Entry Zone</span><b>${trade.potentialEntryZone}</b></div>
            <div class="metric-line"><span>SL Reference</span><b>${trade.slReference}</b></div>
            <div class="metric-line"><span>TP Targets</span><b>${trade.tpTargets.join(" / ")}</b></div>
            <div class="metric-line"><span>Estimated RR</span><b>${trade.estimatedRR}</b></div>
            <div class="metric-line"><span>Last Updated</span><b>${trade.updatedAt}</b></div>
            <div class="status-pill">${trade.status}</div>
            <button class="ghost-button" type="button" data-open-trade="${trade.id}">Open Brief</button>
            <p class="disclaimer-text">${trade.disclaimer}</p>
          `,
        trade.status === "Waiting Confirmation" ? "mission-card potential-card" : "potential-card"
      )
    ).join("");
  }
  function potentialTradeFiltersPanel() {
    const filters = state.potentialTrades.filters;
    return `
    <article class="card card-wide trade-filter-card">
      <div class="trade-filter-grid">
        ${filterGroup("Asset Class", "assetClass", ["All", "Gold", "Forex", "Crypto", "Stocks", "Indices"], filters.assetClass)}
        ${filterGroup("Direction", "direction", ["All", "Long Opportunity", "Short Opportunity", "Stand Aside", "Monitor Only"], filters.direction)}
        ${filterGroup("Status", "status", ["All", "Detected", "Monitoring", "Waiting Confirmation", "Ready", "Triggered", "Invalidated", "Completed"], filters.status)}
        ${filterGroup("Confidence", "confidence", ["All", "High", "Medium", "Low"], filters.confidence)}
        ${filterGroup("Safety", "safety", ["All", "Low Risk", "Medium Risk", "High Risk"], filters.safety)}
      </div>
    </article>
  `;
  }
  function filterGroup(label, key, options, active) {
    return `
    <div class="filter-group">
      <span>${label}</span>
      <div>
        ${options.map((option) => `<button class="${option === active ? "active" : ""}" type="button" data-trade-filter="${key}" data-filter-value="${option}">${option}</button>`).join("")}
      </div>
    </div>
  `;
  }
  function potentialTradeDetailPanel() {
    const trade = getSelectedPotentialTrade();
    const outcome = createOutcomeReview(trade);
    return `
    <article class="card card-wide trade-detail-card">
      <div class="detail-header">
        <div>
          <div class="alpha-label">Potential Signal Preview \u2022 ${trade.dataSourceStatus}</div>
          <h3>${trade.asset} \u2022 ${trade.direction}</h3>
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
    const currentIndex = opportunityStatuses.indexOf(trade.status);
    const next = opportunityStatuses[currentIndex + 1] || "Reviewed";
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
      ${["Helpful", "Not Helpful", "Accurate", "Wrong", "Too Generic", "Too Risky", "Good Mentor Note"].map((item) => `<button class="ghost-button" type="button" data-trade-feedback="${trade.id}" data-feedback="${item}">${item}</button>`).join("")}
    </div>
    <p class="chart-history-note">${state.potentialTrades.feedback.filter((item) => item.tradeId === trade.id).length} feedback record${state.potentialTrades.feedback.filter((item) => item.tradeId === trade.id).length === 1 ? "" : "s"}</p>
  `;
  }
  function tradePairingPanel() {
    const trades = getPotentialTrades();
    const pairing = createTradePairingSummary(trades, { assetClass: state.potentialTrades.pairingFilter });
    const best = pairing.bestOpportunity;
    const avoid = pairing.avoid;
    return `
    <article class="card card-wide pairing-card">
      <div class="watchlist-filters">
        ${["All", "Gold", "Forex", "Crypto", "Stocks", "Indices"].map((item) => `<button class="${item === state.potentialTrades.pairingFilter ? "active" : ""}" type="button" data-pairing-filter="${item}">${item}</button>`).join("")}
      </div>
      <div class="module-grid action-layout">
        ${card("Best Opportunity", `<strong>${best.asset}</strong><p>${best.assetClass} \u2022 ${best.direction} \u2022 ${best.confidence} confidence \u2022 ${best.tradingSafety}</p><div class="metric-line"><span>Entry</span><b>${best.potentialEntryZone}</b></div><div class="metric-line"><span>SL</span><b>${best.slReference}</b></div><div class="metric-line"><span>TP</span><b>${best.tpTargets.join(" / ")}</b></div><div class="metric-line"><span>RR</span><b>${best.estimatedRR}</b></div><p>${pairing.whyBetter}</p>`, "mission-card")}
        ${card("Potential Signal Preview", `<strong>${best.direction}</strong><p>Entry: ${best.potentialEntryZone}</p><p>SL: ${best.slReference}</p><p>TP: ${best.tpTargets.join(" / ")}</p><p>Safety: ${best.tradingSafety}</p><p class="disclaimer-text">${best.disclaimer}</p>`)}
        ${card("Assets To Avoid", `<strong>${(avoid == null ? void 0 : avoid.asset) || "Pending"}</strong><p>${pairing.reasonToAvoid}</p><div class="metric-line"><span>Data</span><b>${pairing.dataSourceStatus}</b></div>`)}
      </div>
    </article>
  `;
  }
  function accuracyTrackerPanel() {
    const tracker = createAccuracyTracker(getPotentialTrades(), state.potentialTrades.outcomes);
    const rows = tracker.records.slice(0, 4).map(
      (record) => `
        <div class="archive-row">
          <div><strong>${record.tradeId.replace("trade-", "").replace("-alpha", "").toUpperCase()}</strong><p>${record.originalDirection} \u2022 ${record.originalRR}</p></div>
          <span>${record.outcomeStatus}</span>
          <b>${record.finalReview}</b>
        </div>
      `
    ).join("");
    return card(
      "Accuracy Tracker",
      `<strong>${tracker.status}</strong><p>JARVIS will not show an accuracy percentage until enough reviewed trade data exists.</p>${rows}`,
      "card-wide archive-card"
    );
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
  function watchlistPanel() {
    const filter = state.watchlistFilter || "All";
    const visible = alphaWatchlist.filter((item) => filter === "All" || item.assetClass === filter);
    return `
    <article class="card card-wide watchlist-card">
      <div class="watchlist-filters">
        ${watchlistFilters.map((item) => `<button class="${item === filter ? "active" : ""}" type="button" data-watchlist-filter="${item}">${item}</button>`).join("")}
      </div>
      <div class="watchlist-table">
        ${visible.map(
      (item) => `
              <div class="watchlist-row">
                <strong>${item.symbol}</strong>
                <span>${item.label}</span>
                <b>${item.assetClass}</b>
                <p>${item.outlook}</p>
                <em>${item.safety}</em>
                <i>${item.status}</i>
              </div>
            `
    ).join("")}
      </div>
      <p class="disclaimer-text">Demo Data. Watchlist structure is ready for future data sources, but Alpha does not pretend this is live.</p>
    </article>
  `;
  }
  function macroCalendarCards() {
    return alphaMacroEvents.map(
      (event) => card(
        event.event,
        `
            <div class="alpha-label">Data source not connected</div>
            <div class="metric-line"><span>Release Time</span><b>${event.time}</b></div>
            <div class="metric-line"><span>Previous</span><b>${event.previous}</b></div>
            <div class="metric-line"><span>Forecast</span><b>${event.forecast}</b></div>
            <div class="metric-line"><span>Actual</span><b>${event.actual}</b></div>
            <div class="metric-line"><span>USD Impact</span><b>Pending</b></div>
            <div class="metric-line"><span>Gold / Crypto / Stock Impact</span><b>Pending</b></div>
            <strong>${event.risk} risk around release window</strong>
            <p>Professional view: wait for actual data and market reaction. JARVIS will not invent macro numbers.</p>
          `
      )
    ).join("");
  }
  function tradePlannerCard() {
    var _a, _b;
    const question = state.jarvis.question || state.jarvis.memory.lastQuestion || "Can I buy Gold now?";
    const route = state.jarvis.route || routeJarvisInput({ input: question, memory: state.jarvis.memory, chart: state.chartUpload, journal: state.chartUpload.history });
    const snapshot = getMockMarketSnapshot(((_a = route.asset) == null ? void 0 : _a.symbol) || question);
    const fallbackPlan = buildPreliminaryTradePlan(snapshot, null, question);
    const analysis = state.chartUpload.analysis || state.jarvis.quickAnalysis || {
      bias: snapshot.marketBias.includes("Bearish") ? "Bearish" : snapshot.marketBias.includes("Neutral") ? "Neutral" : "Bullish",
      tradingSafety: { score: snapshot.risk === "High" ? "Low" : "Medium" },
      tradePlan: fallbackPlan
    };
    const plan = analysis.tradePlan || buildPreliminaryTradePlan(snapshot, null, question);
    const verdict = buildJarvisVerdict(analysis, route);
    return card(
      "Trade Planner",
      `
      <div class="alpha-label">Alpha Preview / Planning Guidance</div>
      <strong>${verdict}</strong>
      <p>${snapshot.label} \u2022 ${((_b = route.asset) == null ? void 0 : _b.assetClass) || "Unknown"} \u2022 ${snapshot.marketBias}</p>
      <div class="metric-line"><span>Entry Zone</span><b>${plan.potentialEntryZone}</b></div>
      <div class="metric-line"><span>SL / Invalidation</span><b>${plan.stopLossReference}</b></div>
      <div class="metric-line"><span>TP Targets</span><b>${plan.takeProfitZones.join(" / ")}</b></div>
      <div class="metric-line"><span>Estimated RR</span><b>${plan.estimatedRR}</b></div>
      <div class="brief-section compact-section">
        <strong>Conditions Needed</strong>
        <ul>${plan.conditionsNeeded.map((item) => `<li>${item}</li>`).join("")}</ul>
      </div>
      <p class="disclaimer-text">JARVIS provides educational market analysis and risk guidance. The final trading decision remains the responsibility of the trader.</p>
    `,
      "mission-card trade-planner-card"
    );
  }
  function riskCalculatorCard(goal, health) {
    return card(
      "Risk Calculator",
      `
      <div class="alpha-label">Placeholder / Read-only</div>
      <strong>${goal.riskStatus}</strong>
      <p>Risk calculator structure is prepared. MT5 sync and position sizing are future backlog.</p>
      <div class="metric-line"><span>Account Risk</span><b>${health.riskStatus}</b></div>
      <div class="metric-line"><span>Daily Drawdown</span><b>${goal.dailyDrawdown}%</b></div>
      <div class="metric-line"><span>Open Positions</span><b>${goal.openPositions}</b></div>
      <div class="metric-line"><span>Position Size</span><b>Pending real account bridge</b></div>
    `
    );
  }
  function buildJarvisVerdict(analysis, route) {
    var _a;
    if (((_a = analysis == null ? void 0 : analysis.tradingSafety) == null ? void 0 : _a.score) === "Low") return "Monitor Only";
    if ((route == null ? void 0 : route.intent) === "Sell Assessment" || (analysis == null ? void 0 : analysis.bias) === "Bearish") return "Short Opportunity";
    if ((route == null ? void 0 : route.intent) === "Risk Check") return "Stand Aside";
    return "Long Opportunity";
  }
  function jarvisPageContent(brain) {
    return `
    <section class="hero-workspace">
      <div>
        <p class="eyebrow">Mission Control</p>
        <h1>${state.jarvis.question || "Talk with JARVIS"}</h1>
      </div>
    </section>
    ${missionControl(brain)}
  `;
  }
  function backlogPageContent() {
    return `
    <section class="hero-workspace">
      <div>
        <p class="eyebrow">Future Sprint</p>
        <h1>${state.activePage} is in backlog.</h1>
      </div>
    </section>
    <section class="workspace-section">
      <div class="section-heading"><p class="eyebrow">Sprint 3 Scope</p><h2>Only Market, Trading, and Chart Intelligence are active now.</h2></div>
      ${card("Backlog", `<p>This area is intentionally not active in Sprint 3. It will be built in a later sprint without changing the current architecture.</p>`)}
    </section>
  `;
  }
  function homeTalkPanel() {
    const prompt = jarvisPromptExamples[state.jarvis.promptIndex % jarvisPromptExamples.length];
    return `
    <article class="jarvis-mentor home-talk">
      <form class="jarvis-question-form" data-mode="home">
        <label for="jarvisQuestion">Talk with JARVIS</label>
        <textarea id="jarvisQuestion" rows="2" placeholder="${prompt}">${state.jarvis.question}</textarea>
        <div class="jarvis-actions home-actions">
          <button type="submit">Start Mission</button>
        </div>
      </form>
    </article>
  `;
  }
  function missionControl(brain) {
    return `
    <section class="mission-control">
      <div class="mission-left">
        ${jarvisMentorPanel(brain)}
        ${mentorNotesPanel(brain)}
        ${missionTimelinePanel()}
      </div>
      <aside class="mission-right">
        ${uploadedChartPanel()}
        ${tradingBriefPanel(brain)}
        ${missionJournalPanel()}
      </aside>
    </section>
  `;
  }
  function jarvisMentorPanel(brain) {
    const language = state.jarvis.language || "en";
    const isZh = language === "zh";
    const needsChart = state.jarvis.status === "needsChart";
    const isAnalyzing = state.jarvis.status === "analyzing";
    const isProcessing = state.jarvis.isProcessing;
    const message = state.jarvis.mentorNote || (isZh ? "\u6211\u5728\u8FD9\u91CC\u3002\u5148\u544A\u8BC9\u6211\u4F60\u60F3\u89E3\u51B3\u4EC0\u4E48\u4EA4\u6613\u95EE\u9898\u3002" : "I'm here. Tell me what trading decision you want to improve.");
    const chat = state.jarvis.chat.length ? state.jarvis.chat : [{ role: "jarvis", text: message, attention: needsChart }];
    return `
    <article class="jarvis-mentor conversation-panel">
      <div class="chat-thread">
        ${chat.map((item) => chatMessageMarkup(item)).join("")}
      </div>
      <form class="jarvis-question-form chat-composer" data-mode="mission">
        <textarea id="jarvisQuestion" rows="2" placeholder="${isZh ? "\u7EE7\u7EED\u95EE JARVIS..." : "Ask the next question..."}"></textarea>
        <div class="jarvis-actions">
          <button class="ghost-button" id="jarvisUploadButton" type="button">${isZh ? "\u4E0A\u4F20\u56FE\u8868" : "Upload Chart"}</button>
          <button class="ghost-button" type="button" disabled>${isZh ? "\u8BED\u97F3 \u5373\u5C06\u63A8\u51FA" : "Voice Coming Soon"}</button>
          <button type="submit" ${isProcessing ? "disabled" : ""}>${isProcessing ? isZh ? "\u5904\u7406\u4E2D" : "Working" : isZh ? "\u53D1\u9001" : "Send"}</button>
        </div>
      </form>
      <input id="chartUploadInput" class="hidden-file-input" type="file" accept="image/*" />
      ${isAnalyzing ? analysisProgress() : ""}
    </article>
  `;
  }
  function analysisProgress() {
    const steps = state.jarvis.language === "zh" ? analysisStepsZh : analysisSteps;
    return `
    <div class="analysis-progress">
      ${steps.map(
      (step, index) => `<span class="${index <= state.jarvis.progressIndex ? "active" : ""}">${step}</span>`
    ).join("")}
    </div>
  `;
  }
  function mentorNotesPanel(brain) {
    const language = state.jarvis.language || "en";
    const isZh = language === "zh";
    const note = isZh ? "\u6211\u4F1A\u5148\u4FDD\u62A4\u4F60\u7684\u5224\u65AD\u8D28\u91CF\u3002\u6CA1\u6709\u786E\u8BA4\uFF0C\u5C31\u4E0D\u9700\u8981\u6025\u7740\u8FDB\u573A\u3002" : "I will protect your decision quality first. Without confirmation, there is no need to rush an entry.";
    return card(
      isZh ? "\u5BFC\u5E08\u7B14\u8BB0" : "Mentor Notes",
      `<strong>${note}</strong><p>${brain.aiCoach.note}</p>`,
      "mentor-notes-card"
    );
  }
  function missionTimelinePanel() {
    const language = state.jarvis.language || "en";
    const isZh = language === "zh";
    const fallback = isZh ? ["Mission \u5DF2\u5F00\u542F", "\u7B49\u5F85\u4F60\u7684\u4E0B\u4E00\u4E2A\u51B3\u5B9A"] : ["Mission started", "Waiting for your next decision"];
    const timeline = state.jarvis.timeline.length ? state.jarvis.timeline : fallback;
    return card(
      isZh ? "\u4EFB\u52A1\u65F6\u95F4\u7EBF" : "Mission Timeline",
      `<div class="mission-timeline">${timeline.map((item) => `<span>${item}</span>`).join("")}</div>`,
      "timeline-card"
    );
  }
  function uploadedChartPanel() {
    const language = state.jarvis.language || "en";
    const isZh = language === "zh";
    if (!state.chartUpload.previewUrl) {
      const hasContext = state.jarvis.quickAnalysis;
      return card(
        isZh ? "\u56FE\u8868\u80CC\u666F" : "Chart Context",
        hasContext ? `<p>${isZh ? "\u8FD8\u6CA1\u6709\u4E0A\u4F20\u56FE\u8868\u3002\u5F53\u524D\u5148\u4F7F\u7528\u5B9E\u65F6\u4EF7\u683C\u4E0E\u5E02\u573A\u80CC\u666F\u505A\u521D\u6B65\u89C4\u5212\uFF1B\u4E0A\u4F20\u56FE\u8868\u540E\u4F1A\u66F4\u51C6\u786E\u3002" : "No chart uploaded yet. JARVIS is using live price and market context for a preliminary plan; upload a chart for higher accuracy."}</p>` : `<p>${isZh ? "\u9700\u8981 setup \u5224\u65AD\u65F6\uFF0C\u4E0A\u4F20\u5F53\u524D\u56FE\u8868\u3002" : "Upload the current chart when the decision needs setup context."}</p>`,
        "uploaded-chart-card"
      );
    }
    return `
    <article class="card uploaded-chart-card">
      <h3>${isZh ? "\u4E0A\u4F20\u56FE\u8868" : "Uploaded Chart"}</h3>
      <img class="chart-preview mentor-preview" src="${state.chartUpload.previewUrl}" alt="Uploaded chart preview" />
      <p>${state.chartUpload.fileName}</p>
    </article>
  `;
  }
  function tradingBriefPanel(brain) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    const analysis = state.chartUpload.analysis || state.jarvis.quickAnalysis || brain.opportunity.analysis;
    const language = state.jarvis.language || "en";
    const isZh = language === "zh";
    const zhBias = { Bullish: "\u504F\u591A", Bearish: "\u504F\u7A7A", Neutral: "\u4E2D\u6027", "Neutral Bullish": "\u4E2D\u6027\u504F\u591A" };
    const zhRisk = { Low: "\u4F4E", Medium: "\u4E2D\u7B49", "Medium High": "\u4E2D\u9AD8", High: "\u9AD8" };
    const route = state.jarvis.route;
    const verdict = ((_a = analysis.tradingSafety) == null ? void 0 : _a.score) === "Low" ? "Monitor Only" : analysis.bias === "Bearish" ? "Short Opportunity" : "Long Opportunity";
    if (!analysis) {
      return card(
        isZh ? "\u4EA4\u6613\u7B80\u62A5" : "Trading Brief",
        `<p>${isZh ? "\u6709\u56FE\u8868\u5206\u6790\u540E\uFF0C\u8FD9\u91CC\u4F1A\u751F\u6210\u7B80\u77ED\u4EA4\u6613\u7B80\u62A5\u3002" : "After chart analysis, a short trading brief will appear here."}</p>`,
        "trading-brief empty-brief"
      );
    }
    return `
    <article class="trading-brief">
      <h3>${analysis.preliminary ? isZh ? "\u521D\u6B65\u4EA4\u6613\u7B80\u62A5" : "Preliminary Brief" : isZh ? "\u4EA4\u6613\u7B80\u62A5" : "Trading Brief"}</h3>
      <div class="brief-section">
        <strong>${isZh ? "\u4E13\u4E1A\u89C2\u70B9" : "Professional View"}</strong>
        <p>${isZh ? "\u6709\u673A\u4F1A\uFF0C\u4F46\u5FC5\u987B\u7B49\u786E\u8BA4\u3002JARVIS \u4E0D\u4F1A\u66FF\u4F60\u505A\u4E70\u5356\u51B3\u5B9A\u3002" : analysis.professionalView || "The opportunity exists, but the decision must be confirmation-led. JARVIS does not make the trade for you."}</p>
      </div>
      ${analysis.chartClarity || analysis.confidenceNote ? `<div class="brief-section">
              <strong>${isZh ? "\u56FE\u8868\u6E05\u6670\u5EA6" : "Chart Clarity"}</strong>
              <p>${isZh ? analysis.preliminary ? "\u8FD8\u6CA1\u6709\u4E0A\u4F20\u56FE\u8868\uFF1B\u8FD9\u662F\u6839\u636E\u5B9E\u65F6\u53C2\u8003\u4EF7\u548C\u5E02\u573A\u80CC\u666F\u505A\u7684\u521D\u6B65\u89C4\u5212\u3002\u4E0A\u4F20\u56FE\u8868\u540E\uFF0CEntry / SL / TP \u4F1A\u66F4\u51C6\u786E\u3002" : "\u56FE\u8868\u5DF2\u7EB3\u5165\u5206\u6790\u3002\u4ECD\u9700\u786E\u8BA4\u4EF7\u683C\u523B\u5EA6\u3001\u5468\u671F\u548C\u5173\u952E\u9AD8\u4F4E\u70B9\u3002" : analysis.confidenceNote || analysis.chartClarity}</p>
            </div>` : ""}
      <div class="brief-section">
        <strong>${isZh ? "\u5E02\u573A\u503E\u5411" : "Market Bias"}</strong>
        <p>${isZh ? `${zhBias[analysis.bias] || analysis.bias}\uFF0C\u4FE1\u5FC3 ${localizedConfidenceLabel(analysis.confidence)}\u3002` : `${analysis.bias} with ${analysis.confidenceLabel || confidenceLabel(analysis.confidence)} confidence.`}</p>
      </div>
      <div class="brief-section">
        <strong>${isZh ? "JARVIS \u5224\u65AD" : "JARVIS Verdict"}</strong>
        <p>${verdict} \u2022 ${((_b = route == null ? void 0 : route.asset) == null ? void 0 : _b.assetClass) || analysis.instrumentType || "Market"} \u2022 ${((route == null ? void 0 : route.capabilities) || []).slice(0, 4).join(" / ")}</p>
      </div>
      <div class="brief-grid">
        <span>${isZh ? "\u54C1\u79CD" : "Instrument"}</span><strong>${analysis.instrument || analysis.pair}</strong>
        ${analysis.livePrice ? `<span>${isZh ? "\u5B9E\u65F6\u53C2\u8003\u4EF7" : "Live Reference"}</span><strong>${analysis.livePriceText} ${analysis.liveCurrency || ""}</strong>` : ""}
        <span>${isZh ? "\u65B9\u5411" : "Bias"}</span><strong>${isZh ? zhBias[analysis.bias] || analysis.bias : analysis.bias}</strong>
        <span>${isZh ? "\u4FE1\u5FC3" : "Confidence"}</span><strong>${isZh ? localizedConfidenceLabel(analysis.confidence) : analysis.confidenceLabel || confidenceLabel(analysis.confidence)}</strong>
        <span>${isZh ? "\u7ED3\u6784" : "Structure"}</span><strong>${isZh ? "\u5EF6\u7EED\u7ED3\u6784\uFF0C\u7B49\u5F85\u786E\u8BA4" : analysis.marketStructure}</strong>
        <span>${isZh ? "\u6D41\u52A8\u6027" : "Liquidity"}</span><strong>${isZh ? "\u5173\u952E\u6D41\u52A8\u6027\u5DF2\u88AB\u89E6\u53CA\uFF0C\u52FF\u8FFD\u4EF7" : analysis.liquidity}</strong>
        <span>${isZh ? "\u98CE\u9669" : "Risk"}</span><strong>${isZh ? zhRisk[analysis.risk] || analysis.risk : analysis.risk}</strong>
        <span>${isZh ? "\u4E0B\u4E00\u6B65" : "Next Best Action"}</span><strong>${isZh ? "\u7B49\u5F85\u56DE\u8C03\u786E\u8BA4\uFF0C\u4E0D\u505A\u76F2\u76EE\u8FDB\u573A\u3002" : analysis.recommendation.replace(" No blind signal is provided.", "")}</strong>
        <span>${isZh ? "\u5B66\u4E60\u70B9" : "Learning Point"}</span><strong>${isZh ? "\u597D\u7684\u4EA4\u6613\u6765\u81EA\u786E\u8BA4\uFF0C\u4E0D\u662F\u51B2\u52A8\u3002" : analysis.learningNote}</strong>
      </div>
      <div class="brief-section">
        <strong>${isZh ? "\u5173\u952E\u89C2\u5BDF" : "Key Observations"}</strong>
        <ul>${(analysis.keyObservations || [analysis.marketStructure, analysis.liquidity]).map((item) => `<li>${isZh ? item : item}</li>`).join("")}</ul>
      </div>
      <div class="brief-section">
        <strong>${isZh ? "\u91CD\u8981\u4EF7\u4F4D" : "Important Price Levels"}</strong>
        <p>${(analysis.importantPriceLevels || analysis.keyZones || []).join(" \u2022 ")}</p>
      </div>
      <div class="brief-section safety-section">
        <strong>${isZh ? "\u4EA4\u6613\u5B89\u5168" : "Trading Safety"}</strong>
        <div class="risk-grid">
          <span>${isZh ? "\u5B89\u5168\u8BC4\u5206" : "Score"}</span><b>${((_c = analysis.tradingSafety) == null ? void 0 : _c.score) || "Medium"}</b>
          <span>${isZh ? "\u5E02\u573A\u98CE\u9669" : "Market Risk"}</span><b>${((_d = analysis.tradingSafety) == null ? void 0 : _d.marketRisk) || analysis.risk}</b>
          <span>${isZh ? "\u8D26\u6237\u98CE\u9669" : "Account Risk"}</span><b>${((_e = analysis.tradingSafety) == null ? void 0 : _e.accountRisk) || "Controlled"}</b>
          <span>${isZh ? "\u98CE\u9669\u56DE\u62A5" : "Risk Reward"}</span><b>${((_f = analysis.tradingSafety) == null ? void 0 : _f.riskReward) || "Wait for confirmation"}</b>
          <span>${isZh ? "\u60C5\u7EEA\u98CE\u9669" : "Emotional Risk"}</span><b>${((_g = analysis.tradingSafety) == null ? void 0 : _g.emotionalRisk) || "Stable"}</b>
          <span>${isZh ? "\u65B0\u95FB\u98CE\u9669" : "News Risk"}</span><b>${((_h = analysis.tradingSafety) == null ? void 0 : _h.newsRisk) || "Check calendar"}</b>
          <span>${isZh ? "\u6574\u4F53\u98CE\u9669" : "Overall Risk"}</span><b>${((_i = analysis.tradingSafety) == null ? void 0 : _i.overallRisk) || analysis.risk}</b>
        </div>
      </div>
      ${analysis.tradePlan ? `<div class="brief-section trade-plan-section">
              <strong>${isZh ? "\u4EA4\u6613\u89C4\u5212\u6846\u67B6" : "Trade Plan Framework"}</strong>
              <div class="risk-grid">
                <span>${isZh ? "\u6F5C\u5728\u8FDB\u573A\u533A" : "Potential Entry Zone"}</span><b>${analysis.tradePlan.potentialEntryZone}</b>
                <span>${isZh ? "\u8FDB\u573A\u8D28\u91CF" : "Entry Quality"}</span><b>${localizePlanText(analysis.tradePlan.entryQuality || "Monitor only", isZh)}</b>
                <span>${isZh ? "\u539F\u56E0" : "Reason"}</span><b>${localizePlanText(analysis.tradePlan.entryReason, isZh)}</b>
                <span>${isZh ? "\u5931\u6548 / SL \u53C2\u8003" : "Invalidation / SL Reference"}</span><b>${analysis.tradePlan.stopLossReference}</b>
                <span>${isZh ? "SL \u903B\u8F91" : "SL Logic"}</span><b>${localizePlanText(analysis.tradePlan.stopReason, isZh)}</b>
                <span>${isZh ? "\u6F5C\u5728 TP \u533A" : "Potential TP Zones"}</span><b>${analysis.tradePlan.takeProfitZones.join(" \u2022 ")}</b>
                <span>${isZh ? "TP \u903B\u8F91" : "TP Logic"}</span><b>${localizePlanText(analysis.tradePlan.takeProfitReason, isZh)}</b>
                <span>${isZh ? "\u9884\u4F30 RR" : "Estimated RR"}</span><b>${localizePlanText(analysis.tradePlan.estimatedRR, isZh)}</b>
                <span>${isZh ? "RR \u8BC4\u4F30" : "RR Assessment"}</span><b>${localizePlanText(analysis.tradePlan.riskRewardAssessment, isZh)}</b>
                <span>${isZh ? "\u4E0D\u4EA4\u6613\u6761\u4EF6" : "No Trade Condition"}</span><b>${localizePlanText(analysis.tradePlan.noTradeCondition || "No trade if confirmation is weak.", isZh)}</b>
              </div>
              <strong>${isZh ? "\u9700\u8981\u6761\u4EF6" : "Conditions Needed"}</strong>
              <ul>${analysis.tradePlan.conditionsNeeded.map((item) => `<li>${localizePlanText(item, isZh)}</li>`).join("")}</ul>
            </div>` : ""}
      <div class="brief-section">
        <strong>${isZh ? "\u98CE\u9669\u610F\u8BC6" : "Risk Awareness"}</strong>
        <p>${isZh ? "\u673A\u4F1A\u5B58\u5728\uFF0C\u4F46\u98CE\u9669\u56DE\u62A5\u8FD8\u9700\u8981\u786E\u8BA4\u3002\u82E5\u98CE\u9669\u4E0D\u5065\u5EB7\uFF0C\u7B49\u5F85\u4F1A\u66F4\u4E13\u4E1A\u3002" : analysis.riskAwareness || "The opportunity exists, but risk-reward must be healthy before action."}</p>
      </div>
      <div class="brief-section">
        <strong>${isZh ? "\u66FF\u4EE3\u60C5\u666F" : "Alternative Scenario"}</strong>
        <p>${isZh ? "\u5982\u679C\u4EF7\u683C\u4E0D\u5C0A\u91CD\u786E\u8BA4\u533A\u57DF\uFF0C\u5C31\u6682\u505C\uFF0C\u4E0D\u786C\u505A\u3002" : analysis.alternativeScenario || "If price fails to respect the confirmation area, pause the idea and reassess."}</p>
      </div>
      <div class="brief-section">
        <strong>${isZh ? "\u5BFC\u5E08\u5907\u6CE8" : "Mentor Notes"}</strong>
        <p>${isZh ? "\u6700\u7EC8\u51B3\u5B9A\u5C5E\u4E8E\u4EA4\u6613\u5458\u3002JARVIS \u8D1F\u8D23\u4FDD\u62A4\u4F60\u7684\u51B3\u7B56\u8D28\u91CF\u3002" : analysis.mentorNotes || "The final decision belongs to the trader. JARVIS protects decision quality."}</p>
      </div>
      <p class="brief-disclaimer">${isZh ? "JARVIS \u63D0\u4F9B\u6559\u80B2\u6027\u8D28\u7684\u5E02\u573A\u5206\u6790\u4E0E\u98CE\u9669\u6307\u5F15\u3002\u6700\u7EC8\u4EA4\u6613\u51B3\u5B9A\u7531\u4EA4\u6613\u5458\u81EA\u884C\u8D1F\u8D23\u3002" : analysis.disclaimer || "JARVIS provides educational market analysis and risk guidance. The final trading decision remains the responsibility of the trader."}</p>
      ${state.jarvis.showWhy ? explainWhyBlock(analysis) : ""}
      ${state.jarvis.showEntryZone ? entryZoneBlock(analysis) : ""}
      ${state.jarvis.savedToJournal ? journalSavedBlock() : ""}
      <div class="brief-actions">
        <button class="ghost-button" id="explainWhyButton" type="button">${isZh ? "\u89E3\u91CA\u539F\u56E0" : "Explain Why"}</button>
        <button class="ghost-button" id="showEntryZoneButton" type="button">${isZh ? "\u663E\u793A\u533A\u57DF" : "Show Entry Zone"}</button>
        <button class="ghost-button" id="saveJournalButton" type="button">${isZh ? "\u4FDD\u5B58 Mission" : "Save Mission"}</button>
        <button class="ghost-button" id="newAnalysisButton" type="button">${isZh ? "\u65B0\u5206\u6790" : "New Analysis"}</button>
      </div>
    </article>
  `;
  }
  function missionJournalPanel() {
    const latest = state.chartUpload.history[0];
    const language = state.jarvis.language || "en";
    const isZh = language === "zh";
    if (!latest) {
      return card(
        isZh ? "\u4EA4\u6613\u65E5\u5FD7" : "Journal",
        `<p>${isZh ? "\u4FDD\u5B58 Mission \u540E\uFF0CJournal \u4F1A\u81EA\u52A8\u5EFA\u7ACB\u3002" : "Save Mission to automatically create the journal record."}</p>`,
        "journal-card"
      );
    }
    return card(
      isZh ? "\u4EA4\u6613\u65E5\u5FD7" : "Journal",
      `<strong>${latest.pair} \u2022 ${latest.bias}</strong><p>${latest.learningNote}</p>`,
      "journal-card"
    );
  }
  function explainWhyBlock(analysis) {
    const question = state.jarvis.question || "Can I buy Gold now?";
    if (state.jarvis.language === "zh") {
      return `
      <div class="mentor-explain">
        <strong>\u5BFC\u5E08\u89E3\u91CA</strong>
        <p>\u4F60\u95EE\u7684\u662F\uFF1A\u201C${question}\u201D</p>
        <p>\u5F53\u524D\u65B9\u5411\u504F ${analysis.bias}\uFF0C\u4F46\u4E13\u4E1A\u4EA4\u6613\u4E0D\u662F\u8FFD\u4EF7\u683C\u3002\u5148\u7B49\u786E\u8BA4\uFF0C\u98CE\u9669\u56DE\u62A5\u4F1A\u66F4\u5E72\u51C0\u3002</p>
      </div>
    `;
    }
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
      <strong>${mentorText("Entry Zone Logic", "\u533A\u57DF\u903B\u8F91")}</strong>
      <p>${mentorText(
      `Watch ${analysis.keyZones.join(" or ")}. JARVIS is not giving a blind entry; it is showing where confirmation should be checked.`,
      `\u7559\u610F ${analysis.keyZones.join(" \u6216 ")}\u3002JARVIS \u4E0D\u662F\u7ED9\u76F2\u76EE\u8FDB\u573A\u70B9\uFF0C\u800C\u662F\u544A\u8BC9\u4F60\u54EA\u91CC\u9700\u8981\u786E\u8BA4\u3002`
    )}</p>
    </div>
  `;
  }
  function journalSavedBlock() {
    return `
    <div class="mentor-explain">
      <strong>${mentorText("Mission Saved", "Mission \u5DF2\u4FDD\u5B58")}</strong>
      <p>${mentorText("I created the journal record for you. Review it later when emotions are lower and the lesson is clearer.", "\u6211\u5DF2\u7ECF\u5E2E\u4F60\u5EFA\u7ACB Journal\u3002\u665A\u4E00\u70B9\u60C5\u7EEA\u66F4\u7A33\u5B9A\u65F6\uFF0C\u518D\u56DE\u6765\u590D\u76D8\u4F1A\u66F4\u6E05\u695A\u3002")}</p>
      <div class="brief-actions compact">
        <button class="ghost-button" type="button">${mentorText("Yes", "\u662F")}</button>
        <button class="ghost-button" type="button">${mentorText("No", "\u5426")}</button>
      </div>
    </div>
  `;
  }
  function buildMissionRecord(analysis) {
    var _a, _b, _c;
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
      asset: ((_a = route.asset) == null ? void 0 : _a.symbol) || analysis.pair || analysis.instrument,
      assetClass: ((_b = route.asset) == null ? void 0 : _b.assetClass) || analysis.instrumentType || "Unknown",
      selectedCapabilities: route.capabilities || [],
      jarvisVerdict: ((_c = analysis.tradingSafety) == null ? void 0 : _c.score) === "Low" ? "Monitor Only" : analysis.bias === "Bearish" ? "Short Opportunity" : "Long Opportunity",
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
    return { High: "\u9AD8", Medium: "\u4E2D\u7B49", Low: "\u4F4E" }[label] || label;
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
    return String(text).replaceAll("This area is a possible pullback / confirmation zone and offers cleaner risk-reward than chasing current price.", "\u8FD9\u4E2A\u533A\u57DF\u5C5E\u4E8E\u6F5C\u5728\u56DE\u8E29 / \u786E\u8BA4\u533A\uFF0C\u98CE\u9669\u56DE\u62A5\u6BD4\u76F4\u63A5\u8FFD\u4EF7\u66F4\u5E72\u51C0\u3002").replaceAll("This is a preliminary pullback / confirmation zone based on live reference price and mock market context. A real uploaded chart will improve accuracy.", "\u8FD9\u662F\u57FA\u4E8E\u5B9E\u65F6\u53C2\u8003\u4EF7\u548C\u5E02\u573A\u80CC\u666F\u7684\u521D\u6B65\u56DE\u8E29 / \u786E\u8BA4\u533A\u3002\u4E0A\u4F20\u771F\u5B9E\u56FE\u8868\u540E\u4F1A\u66F4\u51C6\u786E\u3002").replaceAll("This area is a possible rejection / confirmation zone and should prove sellers are still in control.", "\u8FD9\u4E2A\u533A\u57DF\u5C5E\u4E8E\u6F5C\u5728\u62D2\u7EDD / \u786E\u8BA4\u533A\uFF0C\u9700\u8981\u8BC1\u660E\u5356\u65B9\u4ECD\u7136\u638C\u63A7\u7ED3\u6784\u3002").replaceAll("If price breaks below this reference area, the bullish structure may no longer be valid.", "\u5982\u679C\u4EF7\u683C\u8DCC\u7834\u8FD9\u4E2A\u53C2\u8003\u533A\u57DF\uFF0C\u5F53\u524D\u504F\u591A\u7ED3\u6784\u53EF\u80FD\u5931\u6548\u3002").replaceAll("If price breaks above this reference area, the bearish structure may no longer be valid.", "\u5982\u679C\u4EF7\u683C\u7A81\u7834\u8FD9\u4E2A\u53C2\u8003\u533A\u57DF\uFF0C\u5F53\u524D\u504F\u7A7A\u7ED3\u6784\u53EF\u80FD\u5931\u6548\u3002").replaceAll("If price breaks this reference area, the current setup idea weakens.", "\u5982\u679C\u4EF7\u683C\u7A81\u7834\u8FD9\u4E2A\u53C2\u8003\u533A\u57DF\uFF0C\u5F53\u524D setup \u60F3\u6CD5\u4F1A\u53D8\u5F31\u3002").replaceAll("These areas are possible liquidity / profit-taking zones, not guaranteed targets.", "\u8FD9\u4E9B\u533A\u57DF\u662F\u6F5C\u5728\u6D41\u52A8\u6027 / \u83B7\u5229\u4E86\u7ED3\u533A\uFF0C\u4E0D\u662F\u4FDD\u8BC1\u76EE\u6807\u3002").replaceAll("Potentially acceptable if confirmation appears.", "\u5982\u679C\u51FA\u73B0\u786E\u8BA4\uFF0C\u98CE\u9669\u56DE\u62A5\u53EF\u80FD\u53EF\u4EE5\u63A5\u53D7\u3002").replaceAll("Not ideal yet; waiting may improve the profile.", "\u73B0\u5728\u8FD8\u4E0D\u7406\u60F3\uFF0C\u7B49\u5F85\u53EF\u80FD\u8BA9\u98CE\u9669\u56DE\u62A5\u66F4\u6F02\u4EAE\u3002").replaceAll("Cannot calculate exact RR because the price scale is not clear.", "\u4EF7\u683C\u523B\u5EA6\u4E0D\u591F\u6E05\u695A\uFF0C\u4E0D\u80FD\u8BA1\u7B97\u7CBE\u786E RR\u3002").replaceAll("Planning possible, exact RR unavailable.", "\u53EF\u4EE5\u505A\u89C4\u5212\uFF0C\u4F46\u6682\u65F6\u4E0D\u80FD\u7ED9\u7CBE\u786E RR\u3002").replaceAll("Potentially acceptable only if confirmation appears.", "\u53EA\u6709\u51FA\u73B0\u786E\u8BA4\u540E\uFF0C\u98CE\u9669\u56DE\u62A5\u624D\u53EF\u80FD\u53EF\u4EE5\u63A5\u53D7\u3002").replaceAll("Poor now, monitor only", "\u73B0\u5728\u8D28\u91CF\u4E0D\u591F\uFF0C\u53EA\u9002\u5408\u89C2\u5BDF").replaceAll("Fair if confirmed", "\u5982\u679C\u51FA\u73B0\u786E\u8BA4\uFF0C\u8D28\u91CF\u5C1A\u53EF").replaceAll("Needs improvement", "\u8FD8\u9700\u8981\u66F4\u597D\u7684\u4F4D\u7F6E").replaceAll("Unknown", "\u672A\u77E5").replaceAll("No trade if price does not pull back, if confirmation is weak, or if news risk is high.", "\u5982\u679C\u4EF7\u683C\u4E0D\u56DE\u8E29\u3001\u786E\u8BA4\u5F88\u5F31\uFF0C\u6216\u65B0\u95FB\u98CE\u9669\u9AD8\uFF0C\u5C31\u4E0D\u505A\u3002").replaceAll("If the chart does not show price scale, timeframe, and recent swing points, do not force a precise plan.", "\u5982\u679C\u56FE\u8868\u6CA1\u6709\u4EF7\u683C\u523B\u5EA6\u3001\u5468\u671F\u548C\u8FD1\u671F\u9AD8\u4F4E\u70B9\uFF0C\u4E0D\u8981\u786C\u505A\u7CBE\u786E\u8BA1\u5212\u3002").replaceAll("No trade if confirmation is weak.", "\u5982\u679C\u786E\u8BA4\u5F88\u5F31\uFF0C\u5C31\u4E0D\u505A\u3002").replaceAll("Pullback into the planning zone.", "\u7B49\u5F85\u4EF7\u683C\u56DE\u5230\u89C4\u5212\u533A\u3002").replaceAll("Treat this as preliminary until a chart is uploaded.", "\u4E0A\u4F20\u56FE\u8868\u4E4B\u524D\uFF0C\u5148\u628A\u8FD9\u4E2A\u5F53\u6210\u521D\u6B65\u89C4\u5212\u3002").replaceAll("Clear rejection candle or minor structure confirmation.", "\u51FA\u73B0\u6E05\u695A\u7684\u62D2\u7EDD K \u7EBF\u6216\u5C0F\u7ED3\u6784\u786E\u8BA4\u3002").replaceAll("No high-impact news nearby.", "\u9644\u8FD1\u6CA1\u6709\u9AD8\u5F71\u54CD\u65B0\u95FB\u3002").replaceAll("Risk-reward preferably near 1:2 or better.", "\u98CE\u9669\u56DE\u62A5\u6700\u597D\u63A5\u8FD1 1:2 \u6216\u4EE5\u4E0A\u3002").replaceAll("No chasing if price has already expanded.", "\u5982\u679C\u4EF7\u683C\u5DF2\u7ECF\u8D70\u8FDC\uFF0C\u4E0D\u8FFD\u5355\u3002").replaceAll("Wait for price to return into the planning zone.", "\u7B49\u5F85\u4EF7\u683C\u56DE\u5230\u89C4\u5212\u533A\u3002").replaceAll("Look for rejection or minor structure confirmation.", "\u89C2\u5BDF\u62D2\u7EDD\u53CD\u5E94\u6216\u5C0F\u7ED3\u6784\u786E\u8BA4\u3002").replaceAll("Avoid entry near the middle of the range.", "\u907F\u514D\u5728\u533A\u95F4\u4E2D\u95F4\u8FDB\u573A\u3002").replaceAll("Check high-impact news first.", "\u5148\u68C0\u67E5\u9AD8\u5F71\u54CD\u65B0\u95FB\u3002").replaceAll("Only continue if risk-reward is healthy.", "\u53EA\u6709\u98CE\u9669\u56DE\u62A5\u5065\u5EB7\u624D\u7EE7\u7EED\u3002").replaceAll("Entry", "\u8FDB\u573A\u53C2\u8003").replaceAll("SL reference", "SL \u53C2\u8003").replaceAll("TP1", "TP1").replaceAll("TP2", "TP2").replaceAll("gives approx", "\u5927\u7EA6").replaceAll("improves toward", "\u63D0\u5347\u63A5\u8FD1");
  }
  function formatPlanPrice(value, type) {
    if (typeof value !== "number" || Number.isNaN(value)) return "";
    const decimals = type === "forex" ? 5 : type === "crypto" ? 0 : 2;
    return value.toLocaleString(void 0, {
      maximumFractionDigits: decimals,
      minimumFractionDigits: type === "forex" ? Math.min(decimals, 3) : 2
    });
  }
  function buildPreliminaryTradePlan(snapshot, quote, question) {
    const price = quote == null ? void 0 : quote.price;
    const type = snapshot.type;
    const hasPrice = typeof price === "number";
    const isBullish = !snapshot.marketBias.includes("Bearish");
    if (!hasPrice) {
      return {
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
    }
    const entryDistance = type === "forex" ? 18e-4 : type === "crypto" ? 0.012 : 22e-4;
    const stopDistance = type === "forex" ? 32e-4 : type === "crypto" ? 0.024 : 42e-4;
    const tp1Distance = type === "forex" ? 45e-4 : type === "crypto" ? 0.032 : 62e-4;
    const tp2Distance = type === "forex" ? 75e-4 : type === "crypto" ? 0.052 : 0.0105;
    const entryMid = isBullish ? price * (1 - entryDistance) : price * (1 + entryDistance);
    const entryLow = entryMid * (1 - entryDistance * 0.45);
    const entryHigh = entryMid * (1 + entryDistance * 0.45);
    const stop = isBullish ? price * (1 - stopDistance) : price * (1 + stopDistance);
    const tp1 = isBullish ? price * (1 + tp1Distance) : price * (1 - tp1Distance);
    const tp2 = isBullish ? price * (1 + tp2Distance) : price * (1 - tp2Distance);
    const riskPoints = Math.abs(entryMid - stop);
    const rr1 = Math.abs(tp1 - entryMid) / riskPoints;
    const rr2 = Math.abs(tp2 - entryMid) / riskPoints;
    const isChasingQuestion = /now|right now|immediately|现在|马上|立刻/i.test(question);
    const entryQuality = isChasingQuestion || snapshot.risk === "High" ? "Poor now, monitor only" : rr2 >= 2 ? "Fair if confirmed" : "Needs improvement";
    const noTradeCondition = "No trade if price does not pull back, if confirmation is weak, or if news risk is high.";
    return {
      clarity: "Preliminary live-context plan",
      entryQuality,
      noTradeCondition,
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
    localStorage.setItem(
      "jarvis-memory",
      JSON.stringify({
        ...state.jarvis.memory,
        lastIntent: state.jarvis.intent,
        previousQuestion: state.jarvis.memory.previousQuestion,
        lastQuestion: state.jarvis.question,
        lastInstrument: state.jarvis.topic,
        conversationState: state.jarvis.conversationState,
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
      })
    );
  }
  function updateJarvisMemoryFromQuestion(question, intent) {
    const text = question.toLowerCase();
    const mistakes = new Set(state.jarvis.memory.repeatedMistakes || []);
    if (/(now|right now|immediately|现在|马上|立刻)/i.test(question)) mistakes.add(state.jarvis.language === "zh" ? "\u5BB9\u6613\u60F3\u8FFD\u4EF7" : "Chasing entries");
    if (/(loss|lost|亏|输)/i.test(question)) mistakes.add(state.jarvis.language === "zh" ? "\u9700\u8981\u590D\u76D8\u4E8F\u635F\u539F\u56E0" : "Needs loss review");
    if (/(overtrade|revenge|报复|乱做)/i.test(question)) mistakes.add(state.jarvis.language === "zh" ? "\u60C5\u7EEA\u4EA4\u6613\u98CE\u9669" : "Emotional trading risk");
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
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }
  function hasExplicitInstrument(text) {
    const fallback = resolveInstrument("");
    const resolved = resolveInstrument(text);
    const currencyPairPattern = /\b(USD|EUR|GBP|JPY|AUD|NZD|CAD|CHF|CNH|SGD|HKD|MXN|ZAR)\/?(USD|EUR|GBP|JPY|AUD|NZD|CAD|CHF|CNH|SGD|HKD|MXN|ZAR)\b/i;
    return resolved.symbol !== fallback.symbol || currencyPairPattern.test(text) || /\b(gold|xau|silver|xag|btc|bitcoin|eth|ethereum|sol|solana|dxy|nas100|nasdaq|us30|dow|spx500|sp500|dax|ger40|uk100|jp225|hk50|tsla|tesla|aapl|apple|nvda|nvidia|msft|microsoft)\b/i.test(text);
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
    return isZh ? "JARVIS \u63D0\u4F9B\u6559\u80B2\u6027\u8D28\u7684\u5E02\u573A\u5206\u6790\u4E0E\u98CE\u9669\u6307\u5F15\uFF0C\u6700\u7EC8\u4EA4\u6613\u51B3\u5B9A\u4ECD\u7531\u4EA4\u6613\u8005\u81EA\u884C\u8D1F\u8D23\u3002" : "JARVIS provides educational market analysis and risk guidance. The final trading decision remains the responsibility of the trader.";
  }
  function withSafetyDisclaimer(text, isZh = state.jarvis.language === "zh") {
    const disclaimer3 = safetyDisclaimerText(isZh);
    return text.includes(disclaimer3) || text.includes("JARVIS provides educational market analysis") ? text : `${text}

${disclaimer3}`;
  }
  function getActiveTradeContext() {
    const selectedTrade = getSelectedPotentialTrade();
    const selectedTradeMatchesTopic = !state.jarvis.topic || (selectedTrade == null ? void 0 : selectedTrade.asset) === state.jarvis.topic;
    const analysis = state.chartUpload.analysis || state.jarvis.quickAnalysis || null;
    const plan = (analysis == null ? void 0 : analysis.tradePlan) || (selectedTradeMatchesTopic ? selectedTrade : null) || state.jarvis.conversationState.currentTradePlan || null;
    const asset = (analysis == null ? void 0 : analysis.pair) || (analysis == null ? void 0 : analysis.instrument) || state.jarvis.topic || (selectedTradeMatchesTopic ? selectedTrade == null ? void 0 : selectedTrade.asset : "") || state.jarvis.conversationState.currentAsset || "";
    return { selectedTrade, analysis, plan, asset };
  }
  function updateConversationState(route, question) {
    var _a, _b, _c, _d;
    const active = getActiveTradeContext();
    const resolved = hasExplicitInstrument(question) ? resolveInstrument(question) : null;
    const asset = (resolved == null ? void 0 : resolved.symbol) || active.asset || state.jarvis.topic || "";
    state.jarvis.conversationState = {
      ...state.jarvis.conversationState,
      currentAsset: asset,
      assetClass: (resolved == null ? void 0 : resolved.assetClass) || ((_a = route.asset) == null ? void 0 : _a.assetClass) || ((_b = active.selectedTrade) == null ? void 0 : _b.assetClass) || state.jarvis.conversationState.assetClass || "",
      timeframe: route.timeframe || state.jarvis.conversationState.timeframe || "",
      intent: route.intent || state.jarvis.intent,
      uploadedChart: Boolean(state.chartUpload.previewUrl),
      currentTradeId: ((_c = active.selectedTrade) == null ? void 0 : _c.id) || state.jarvis.conversationState.currentTradeId,
      currentTradeStatus: ((_d = active.selectedTrade) == null ? void 0 : _d.status) || state.jarvis.conversationState.currentTradeStatus,
      currentTradePlan: active.plan,
      previousUserQuestion: question,
      language: state.jarvis.language,
      missingInformation: []
    };
  }
  function isAmbiguousTradeQuestion(question = "", intent = "") {
    const text = question.trim();
    const hasContext = hasExplicitInstrument(text) || state.jarvis.topic || state.jarvis.conversationState.currentAsset;
    const asksTradeDecision = isBuyIntent(intent) || isSellIntent(intent) || isTradePlanIntent(intent) || /(buy|sell|entry|tp|sl|stop loss|take profit|can.*enter|any entry|进场|可以买|可以卖|止损|止盈|哪里进|怎么进)/i.test(text);
    return asksTradeDecision && !hasContext;
  }
  function buildClarificationResponse(question = "", intent = "") {
    const isZh = state.jarvis.language === "zh";
    const needsPlan = isTradePlanIntent(intent) || /(entry|tp|sl|止损|止盈|进场)/i.test(question);
    const text = isZh ? needsPlan ? "\u53EF\u4EE5\uFF0C\u6211\u53EF\u4EE5\u5E2E\u4F60\u89C4\u5212 Entry / TP / SL\u3002\u4F60\u662F\u6307\u54EA\u4E2A\u54C1\u79CD\uFF1F\u4F8B\u5982 Gold\u3001BTCUSD\u3001EURUSD\u3002" : "\u53EF\u4EE5\uFF0C\u6211\u5148\u786E\u8BA4\u4E00\u4E0B\uFF1A\u4F60\u662F\u6307\u54EA\u4E2A\u54C1\u79CD\uFF1F\u4F8B\u5982 Gold / XAUUSD\u3001BTCUSD\u3001EURUSD\u3002" : needsPlan ? "Yes. I can help plan Entry / TP / SL. Which instrument are we working on? For example Gold, BTCUSD, or EURUSD." : "Yes. Let me confirm first: which instrument do you mean? For example Gold / XAUUSD, BTCUSD, or EURUSD.";
    return {
      text,
      suggestions: isZh ? ["Gold \u53EF\u4EE5\u4E70\u5417\uFF1F", "BTCUSD entry TP SL", "EURUSD \u4ECA\u5929\u600E\u6837\uFF1F"] : ["Can I buy Gold now?", "BTCUSD entry TP SL", "How is EURUSD today?"]
    };
  }
  function buildNextActions(intent = state.jarvis.intent) {
    const isZh = state.jarvis.language === "zh";
    const { selectedTrade, asset } = getActiveTradeContext();
    const tradeMatchesTopic = !state.jarvis.topic || (selectedTrade == null ? void 0 : selectedTrade.asset) === state.jarvis.topic;
    const instrument = asset || (tradeMatchesTopic ? selectedTrade == null ? void 0 : selectedTrade.asset : "") || state.jarvis.topic || "Gold";
    if (isPairingQuestion(state.jarvis.question)) {
      return isZh ? ["\u4E3A\u4EC0\u4E48\u8FD9\u4E2A\u6BD4\u8F83\u597D\uFF1F", `${instrument} TP SL`, "\u6362\u4E00\u4E2A pair \u5BF9\u6BD4"] : ["Explain why", `${instrument} TP SL`, "Compare another pair"];
    }
    if (isTradePlanIntent(intent) || isBuyIntent(intent) || isSellIntent(intent)) {
      return isZh ? [`${instrument} entry \u5728\u54EA\u91CC\uFF1F`, `${instrument} TP SL`, "\u98CE\u9669\u5065\u5EB7\u5417\uFF1F"] : [`${instrument} entry zone?`, `${instrument} TP SL`, "Is the risk healthy?"];
    }
    if (intent === "Macro Question") {
      return isZh ? ["CPI \u4F1A\u5F71\u54CD Gold \u5417\uFF1F", "\u65B0\u95FB\u524D\u8981\u7B49\u5417\uFF1F", "\u98CE\u9669\u600E\u6837\u63A7\u5236\uFF1F"] : ["How does CPI affect Gold?", "Should I wait before news?", "How should I manage risk?"];
    }
    if (/review|journal|复盘|亏/i.test(state.jarvis.question || "")) {
      return isZh ? ["\u5E2E\u6211\u590D\u76D8\u4E8F\u635F", "\u54EA\u91CC\u505A\u9519\uFF1F", "\u4E0B\u6B21\u600E\u6837\u907F\u514D\uFF1F"] : ["Review my loss", "What went wrong?", "How to avoid it next time?"];
    }
    return isZh ? ["\u7EE7\u7EED\u5206\u6790", "\u7ED9\u6211 Trade Plan", "\u68C0\u67E5\u98CE\u9669"] : ["Continue analysis", "Build trade plan", "Check risk"];
  }
  function qualityCheckResponse(text = "") {
    const fallback = mentorText(
      "I can help. Give me the instrument and what decision you are considering, then I will build a clean trading brief.",
      "\u6211\u53EF\u4EE5\u5E2E\u4F60\u3002\u544A\u8BC9\u6211\u54C1\u79CD\u548C\u4F60\u6B63\u5728\u8003\u8651\u7684\u51B3\u5B9A\uFF0C\u6211\u4F1A\u6574\u7406\u6210\u6E05\u695A\u7684\u4EA4\u6613\u7B80\u62A5\u3002"
    );
    return String(text || fallback).replace(/analysis completed\.?/gi, "I've reviewed the context.").replace(/this is risky\.?/gi, "The opportunity exists, but the risk-reward is not attractive yet.").trim();
  }
  function finalJarvisMessage(text, { tradeRelated = true, suggestions = buildNextActions() } = {}) {
    const cleanText = qualityCheckResponse(text);
    const finalText = tradeRelated ? withSafetyDisclaimer(cleanText, state.jarvis.language === "zh") : cleanText;
    state.jarvis.conversationState.previousJarvisAnswer = finalText;
    return { text: finalText, suggestions };
  }
  function buildStructuredTradeResponse({ question, intent, snapshot, quote, brief }) {
    const isZh = state.jarvis.language === "zh";
    const plan = (brief == null ? void 0 : brief.tradePlan) || buildPreliminaryTradePlan(snapshot, quote, question);
    const risk = buildRiskProfile(question, snapshot);
    const live = (quote == null ? void 0 : quote.price) ? `${formatLivePrice(quote)} ${quote.currency || ""}`.trim() : "Demo reference";
    const confidence = isZh ? localizedConfidenceLabel(snapshot.confidence) : confidenceLabel(snapshot.confidence);
    const action = isBuyIntent(intent) ? plan.riskRewardAssessment.includes("Not ideal") ? "wait for confirmation instead of buying now" : "wait for pullback confirmation before considering a long" : isSellIntent(intent) ? "wait for bearish confirmation before considering a short" : "build the plan first, then decide";
    if (isZh) {
      return `\u91CD\u70B9\u5148\u8BF4\uFF1A\u73B0\u5728\u4E0D\u8981\u6025\u7740\u6309\u8FDB\u573A\uFF0C\u5148\u7B49\u786E\u8BA4\u3002

\u4E3A\u4EC0\u4E48\uFF1A${snapshot.label} \u5F53\u524D\u53C2\u8003\u4EF7 ${live}\uFF0C\u7ED3\u6784\u662F ${snapshot.marketStructure}\uFF0CBias \u662F ${snapshot.marketBias}\uFF0C\u4FE1\u5FC3 ${confidence}\u3002\u673A\u4F1A\u4E0D\u662F\u6CA1\u6709\uFF0C\u4F46\u76F4\u63A5\u8FFD\u4EF7\u4F1A\u8BA9 RR \u53D8\u5DEE\u3002

\u8BA1\u5212\uFF1A\u89C2\u5BDF\u533A ${plan.potentialEntryZone}\uFF1BSL / \u5931\u6548\u53C2\u8003 ${plan.stopLossReference}\uFF1BTP \u53C2\u8003 ${plan.takeProfitZones.join("\uFF0C")}\u3002

\u98CE\u9669\uFF1A\u5E02\u573A\u98CE\u9669 ${risk.marketRisk}\uFF1B\u8D26\u6237\u98CE\u9669 ${risk.accountRisk}\uFF1B\u65B0\u95FB\u98CE\u9669 ${risk.newsRisk}\uFF1B\u60C5\u7EEA\u98CE\u9669 ${risk.emotionalRisk}\u3002\u5982\u679C\u4EF7\u683C\u6CA1\u6709\u56DE\u5230\u8BA1\u5212\u533A\uFF0C\u6216\u8005\u6CA1\u6709\u786E\u8BA4\uFF0C\u7B49\u5F85\u5C31\u662F\u66F4\u4E13\u4E1A\u7684\u9009\u62E9\u3002

\u4E0B\u4E00\u6B65\uFF1A${localizePlanText(action, true)}\u3002`;
    }
    return `Main point first: do not rush the entry. Wait for confirmation.

Why: ${snapshot.label} is around ${live}. Structure is ${snapshot.marketStructure}. Bias is ${snapshot.marketBias} with ${confidence} confidence. The opportunity can exist, but chasing from a poor location weakens risk-reward.

Plan: watch ${plan.potentialEntryZone}; SL / invalidation reference ${plan.stopLossReference}; TP references ${plan.takeProfitZones.join(", ")}.

Risk: market risk ${risk.marketRisk}; account risk ${risk.accountRisk}; news risk ${risk.newsRisk}; emotional risk ${risk.emotionalRisk}. If price does not return to the plan area or confirmation is missing, waiting is the stronger decision.

Next step: ${action}.`;
  }
  function buildMacroResponse(route) {
    const isZh = state.jarvis.language === "zh";
    const macro = (route == null ? void 0 : route.macro) || { eventName: "Macro event", actual: "Pending", professionalView: "Wait for confirmed data and market reaction.", riskLevel: "High", watchNext: "Do not trade the first reaction blindly." };
    return isZh ? `\u91CD\u70B9\u5148\u8BF4\uFF1A\u65B0\u95FB\u524D\u540E\u4E0D\u8981\u8FFD\u7B2C\u4E00\u6CE2\u53CD\u5E94\u3002

${macro.eventName} \u76EE\u524D\u6CA1\u6709\u771F\u5B9E\u6570\u636E\u6E90\u8FDE\u63A5\uFF0C\u6240\u4EE5\u6211\u4E0D\u4F1A\u4E71\u7F16 previous / forecast / actual\u3002Actual\uFF1A${macro.actual}\u3002

\u4E13\u4E1A\u770B\u6CD5\uFF1A${macro.professionalView}

\u98CE\u9669\uFF1A${macro.riskLevel}\u3002\u65B0\u95FB\u4F1A\u653E\u5927 spread\u3001\u6ED1\u70B9\u548C\u5047\u7A81\u7834\u3002

\u4E0B\u4E00\u6B65\uFF1A${macro.watchNext}` : `Main point first: do not chase the first news reaction.

${macro.eventName} is in data-source-not-connected mode, so I will not invent previous, forecast, or actual numbers. Actual: ${macro.actual}.

Professional view: ${macro.professionalView}

Risk: ${macro.riskLevel}. News can widen spreads, increase slippage, and create false breaks.

Next step: ${macro.watchNext}`;
  }
  function buildPairingAnswer(question) {
    const isZh = state.jarvis.language === "zh";
    const assetClass = /(gold|黄金|xau)/i.test(question) ? "Gold" : /(crypto|btc|eth|sol|加密|币)/i.test(question) ? "Crypto" : /(stock|股票|tsla|aapl|nvda|msft)/i.test(question) ? "Stocks" : /(index|indices|nas|us30|spx|指数)/i.test(question) ? "Indices" : /(forex|eur|gbp|jpy|外汇)/i.test(question) ? "Forex" : state.potentialTrades.pairingFilter || "All";
    const pairing = createTradePairingSummary(getPotentialTrades(), { assetClass });
    const best = pairing.bestOpportunity;
    const avoid = pairing.avoid;
    if (isZh) {
      return withSafetyDisclaimer(
        `\u76EE\u524D\u6BD4\u8F83\u597D\u7684\u89C2\u5BDF\u5BF9\u8C61\u662F ${best.asset}\u3002\u65B9\u5411\uFF1A${best.direction}\uFF1B\u4FE1\u5FC3\uFF1A${best.confidence}\uFF1B\u5B89\u5168\u7B49\u7EA7\uFF1A${best.tradingSafety}\uFF1B\u6F5C\u5728\u8FDB\u573A\u533A\uFF1A${best.potentialEntryZone}\uFF1BSL \u53C2\u8003\uFF1A${best.slReference}\uFF1BTP\uFF1A${best.tpTargets.join("\uFF0C")}\uFF1BRR\uFF1A${best.estimatedRR}\u3002\u539F\u56E0\uFF1A${pairing.whyBetter} \u6682\u65F6\u907F\u5F00\uFF1A${(avoid == null ? void 0 : avoid.asset) || "Pending"}\uFF0C\u539F\u56E0\uFF1A${pairing.reasonToAvoid}\u3002\u6570\u636E\u72B6\u6001\uFF1A${pairing.dataSourceStatus}\u3002`,
        true
      );
    }
    return withSafetyDisclaimer(
      `The better opportunity to watch is ${best.asset}. Direction: ${best.direction}. Confidence: ${best.confidence}. Safety: ${best.tradingSafety}. Potential entry zone: ${best.potentialEntryZone}. SL reference: ${best.slReference}. TP: ${best.tpTargets.join(", ")}. RR: ${best.estimatedRR}. Why: ${pairing.whyBetter} Avoid for now: ${(avoid == null ? void 0 : avoid.asset) || "Pending"}. Reason: ${pairing.reasonToAvoid}. Data source: ${pairing.dataSourceStatus}.`,
      false
    );
  }
  function buildFollowUpAnswer(question) {
    const analysis = state.chartUpload.analysis || state.jarvis.quickAnalysis;
    const currentTrade = getSelectedPotentialTrade();
    const instrument = (analysis == null ? void 0 : analysis.instrument) || (analysis == null ? void 0 : analysis.pair) || state.jarvis.topic || (currentTrade == null ? void 0 : currentTrade.asset) || "this market";
    const text = question.toLowerCase();
    const lastIntent = state.jarvis.intent || state.jarvis.memory.lastIntent;
    const plan = analysis == null ? void 0 : analysis.tradePlan;
    const intent = detectIntent(question);
    if (isPairingQuestion(question)) return buildPairingAnswer(question);
    if (!plan && currentTrade && (state.jarvis.intent === "Potential Signal Request" || state.jarvis.topic === currentTrade.asset || /这个|还能|invalidated|tp|sl|entry|进|止损|止盈/i.test(question))) {
      if (state.jarvis.language === "zh") {
        if (/tp|止盈|target|目标/i.test(question)) return withSafetyDisclaimer(`${currentTrade.asset} \u7684\u6F5C\u5728 TP \u662F\uFF1A${currentTrade.tpTargets.join("\uFF0C")}\u3002\u8FD9\u662F\u89C4\u5212\u533A\uFF0C\u4E0D\u662F\u4FDD\u8BC1\u76EE\u6807\u3002`, true);
        if (/sl|止损|invalid|失效/i.test(question)) return withSafetyDisclaimer(`${currentTrade.asset} \u7684 SL / invalidation \u53C2\u8003\u662F\uFF1A${currentTrade.slReference}\u3002\u5931\u6548\u6761\u4EF6\uFF1A${currentTrade.invalidationCondition}`, true);
        if (/entry|进场|哪里|放哪里/i.test(question)) return withSafetyDisclaimer(`${currentTrade.asset} \u7684\u6F5C\u5728\u8FDB\u573A\u533A\u662F\uFF1A${currentTrade.potentialEntryZone}\u3002\u53EA\u6709\u51FA\u73B0\u786E\u8BA4\u624D\u7EE7\u7EED\u8003\u8651\u3002`, true);
        if (/还能|可以.*进|can.*enter|still.*enter/i.test(question)) return withSafetyDisclaimer(`${currentTrade.asset} \u73B0\u5728\u72B6\u6001\u662F ${currentTrade.status}\u3002\u6211\u7684\u5224\u65AD\uFF1A${currentTrade.nextActionSuggestion} \u5982\u679C\u8FD8\u6CA1\u6709\u6EE1\u8DB3\u8FD9\u4E9B\u6761\u4EF6\uFF1A${currentTrade.conditionsNeeded.join("\uFF1B")}\uFF0C\u5C31\u4E0D\u8981\u786C\u8FDB\u3002`, true);
        if (/invalidated|为什么|why/i.test(question)) return withSafetyDisclaimer(`\u56E0\u4E3A\u8FD9\u4E2A setup \u7684\u89C4\u5219\u662F\uFF1A${currentTrade.invalidationCondition}\u3002\u5982\u679C\u5E02\u573A\u7834\u574F\u8FD9\u4E2A\u6761\u4EF6\uFF0CJARVIS \u4F1A\u628A\u5B83\u8F6C\u6210 Invalidated\uFF0C\u800C\u4E0D\u662F\u786C\u6491\u539F\u672C\u60F3\u6CD5\u3002`, true);
        return withSafetyDisclaimer(`${currentTrade.asset} \u5F53\u524D\u72B6\u6001\u662F ${currentTrade.status}\u3002\u4E0B\u4E00\u6B65\uFF1A${currentTrade.nextActionSuggestion}\u3002\u5B89\u5168\u7B49\u7EA7\uFF1A${currentTrade.tradingSafety}\u3002`, true);
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
        if (intent === "Entry zone request" || intent === "Entry Planning") return `\u53EF\u4EE5\uFF0C\u5EF6\u7EED\u540C\u4E00\u4E2A Mission\u3002\u6F5C\u5728\u8FDB\u573A\u533A\u662F ${plan.potentialEntryZone}\u3002\u8FD9\u4E0D\u662F\u53EB\u4F60\u73B0\u5728\u4E70/\u5356\uFF0C\u800C\u662F\u4E00\u4E2A\u7B49\u5F85\u786E\u8BA4\u7684\u533A\u57DF\u3002\u539F\u56E0\uFF1A${localizePlanText(plan.entryReason, true)}`;
        if (intent === "Stop loss request" || intent === "Stop Loss Planning") return `SL \u4E0D\u5E94\u8BE5\u5F53\u6210\u56FA\u5B9A\u6570\u5B57\uFF0C\u800C\u662F invalidation \u53C2\u8003\u3002\u5F53\u524D SL / \u5931\u6548\u53C2\u8003\uFF1A${plan.stopLossReference}\u3002\u903B\u8F91\uFF1A${localizePlanText(plan.stopReason, true)}`;
        if (intent === "Take profit request" || intent === "Take Profit Planning") return `TP \u53EF\u4EE5\u7528\u5206\u6BB5\u89C4\u5212\uFF1A${plan.takeProfitZones.join("\uFF0C")}\u3002\u903B\u8F91\uFF1A${localizePlanText(plan.takeProfitReason, true)} \u8FD9\u4E9B\u662F\u6F5C\u5728\u83B7\u5229\u533A\uFF0C\u4E0D\u662F\u4FDD\u8BC1\u76EE\u6807\u3002`;
        if (intent === "Risk reward request" || intent === "Risk Check") return `RR \u53C2\u8003\uFF1A${localizePlanText(plan.estimatedRR, true)} \u8BC4\u4F30\uFF1A${localizePlanText(plan.riskRewardAssessment, true)} \u5982\u679C RR \u4E0D\u5065\u5EB7\uFF0C\u5B81\u613F\u7B49\u66F4\u597D\u7684\u4F4D\u7F6E\u3002`;
        return `\u53EF\u4EE5\uFF0C\u8FD9\u662F\u540C\u4E00\u4E2A Mission \u7684\u89C4\u5212\u6846\u67B6\uFF1A\u8FDB\u573A\u533A ${plan.potentialEntryZone}\uFF1BSL \u53C2\u8003 ${plan.stopLossReference}\uFF1BTP \u533A ${plan.takeProfitZones.join("\uFF0C")}\u3002\u6761\u4EF6\uFF1A${plan.conditionsNeeded.map((item) => localizePlanText(item, true)).join("\uFF1B")}\u3002\u6700\u7EC8\u51B3\u5B9A\u8FD8\u662F\u7531\u4F60\u8D1F\u8D23\u3002`;
      }
      if (intent === "Entry zone request" || intent === "Entry Planning") return `Yes. Staying with the same mission, the potential entry zone is ${plan.potentialEntryZone}. This is not an instruction to enter now; it is an area to watch for confirmation. Reason: ${plan.entryReason}`;
      if (intent === "Stop loss request" || intent === "Stop Loss Planning") return `For SL, think in terms of invalidation rather than a fixed command. Current SL / invalidation reference: ${plan.stopLossReference}. Logic: ${plan.stopReason}`;
      if (intent === "Take profit request" || intent === "Take Profit Planning") return `Potential TP zones can be planned in stages: ${plan.takeProfitZones.join(", ")}. Logic: ${plan.takeProfitReason} These are possible profit-taking areas, not guaranteed targets.`;
      if (intent === "Risk reward request" || intent === "Risk Check") return `RR reference: ${plan.estimatedRR} Assessment: ${plan.riskRewardAssessment} If the RR is not healthy, waiting is the stronger decision.`;
      return `Sure. Same mission framework: entry zone ${plan.potentialEntryZone}; SL reference ${plan.stopLossReference}; TP zones ${plan.takeProfitZones.join(", ")}. Conditions: ${plan.conditionsNeeded.join("; ")}. Final decision remains with the trader.`;
    }
    if (state.jarvis.language === "zh") {
      if (lastIntent === "Psychology" || lastIntent === "Emotional trading" || lastIntent === "Revenge trading") {
        return `\u6211\u7684\u610F\u601D\u662F\uFF1A\u5982\u679C\u4F60\u73B0\u5728\u7684\u51B3\u5B9A\u6765\u81EA\u201C\u60F3\u8FFD\u56DE\u201D\u6216\u201C\u6015\u9519\u8FC7\u201D\uFF0C\u90A3\u5C31\u4E0D\u662F\u5E02\u573A\u5728\u7ED9\u673A\u4F1A\uFF0C\u662F\u60C5\u7EEA\u5728\u50AC\u4F60\u3002\u5148\u505C\u4E00\u4E0B\uFF0C\u7B49 setup \u6E05\u695A\u518D\u8BF4\u3002`;
      }
      if (lastIntent === "Risk Question") {
        return `\u98CE\u9669\u8981\u8FD9\u6837\u770B\uFF1A\u4E0D\u662F\u95EE\u80FD\u4E0D\u80FD\u8FDB\uFF0C\u800C\u662F\u95EE\u201C\u9519\u4E86\u4F1A\u4E8F\u591A\u5C11\uFF0C\u503C\u4E0D\u503C\u5F97\u201D\u3002\u5982\u679C ${instrument} \u7684\u6B62\u635F\u592A\u8FDC\uFF0C\u5B81\u613F\u9519\u8FC7\uFF0C\u4E0D\u8981\u786C\u505A\u3002`;
      }
      if (text.includes("why") || question.includes("\u4E3A\u4EC0\u4E48")) {
        return `\u56E0\u4E3A ${instrument} \u73B0\u5728\u8FD8\u9700\u8981\u786E\u8BA4\u3002\u65B9\u5411\u53EF\u4EE5\u504F\u591A\uFF0C\u4F46\u6CA1\u6709\u56DE\u8C03\u786E\u8BA4\u5C31\u8FDB\u573A\uFF0C\u98CE\u9669\u56DE\u62A5\u4F1A\u53D8\u5DEE\u3002\u4E13\u4E1A\u505A\u6CD5\u662F\u5148\u7B49\u7ED3\u6784\u7ED9\u673A\u4F1A\uFF0C\u4E0D\u662F\u770B\u5230\u65B9\u5411\u5C31\u8FFD\u3002`;
      }
      return `\u505A\u6CD5\u662F\uFF1A\u5148\u6807\u8BB0 ${instrument} \u5F53\u524D\u533A\u95F4\u9AD8\u4F4E\u70B9\uFF0C\u7136\u540E\u7B49\u4EF7\u683C\u56DE\u5230\u786E\u8BA4\u533A\u57DF\u3002\u770B\u5230\u53CD\u5E94\u540E\uFF0C\u518D\u770B\u6B62\u635F\u662F\u5426\u5408\u7406\u3002\u5982\u679C\u6B62\u635F\u592A\u5927\uFF0C\u5B81\u613F\u4E0D\u505A\u3002`;
    }
    if (lastIntent === "Psychology" || lastIntent === "Emotional trading" || lastIntent === "Revenge trading") {
      return `What I mean is this: if the decision is driven by urgency, fear of missing out, or wanting to recover a loss, it is not the market giving you an edge. It is emotion asking for action. Pause first.`;
    }
    if (lastIntent === "Risk Question") {
      return `Think of risk this way: the question is not only whether you can enter, but what you lose if you are wrong. If the stop for ${instrument} is too wide, passing is the professional decision.`;
    }
    if (text.includes("why")) {
      return `Because ${instrument} still needs confirmation. Bias can be bullish, but entering without a pullback gives weaker risk/reward. The professional move is to wait for structure, not chase direction.`;
    }
    return `Here is the practical way for ${instrument}: mark the current range high and low, wait for price to return to a confirmation area, then check whether the stop loss is clean. If the stop is too wide, waiting is the better trade.`;
  }
  function addChatMessage(message) {
    state.jarvis.chat = [...state.jarvis.chat, { id: `chat-${Date.now()}-${Math.random()}`, ...message }].slice(-16);
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
      chatThread.innerHTML = state.jarvis.chat.map((item) => chatMessageMarkup(item)).join("");
      chatThread.scrollTop = chatThread.scrollHeight;
    }
    const brief = document.querySelector(".mission-right .trading-brief");
    if (brief && state.brainData) {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = tradingBriefPanel(state.brainData);
      brief.replaceWith(wrapper.firstElementChild);
      bindBriefActions();
    }
  }
  function addThinkingMessage() {
    addChatMessage({
      role: "jarvis",
      text: mentorText("Understanding your question...", "\u6B63\u5728\u7406\u89E3\u4F60\u7684\u95EE\u9898..."),
      thinking: true
    });
  }
  function replaceThinkingMessage(message) {
    const index = state.jarvis.chat.findIndex((item) => item.thinking);
    const nextMessage = { id: `chat-${Date.now()}-${Math.random()}`, role: "jarvis", ...message };
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
      keyObservations: [snapshot.marketStructure, snapshot.liquidityStatus, `Session: ${snapshot.session}`],
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
    const health = brain == null ? void 0 : brain.tradingHealth;
    const text = question.toLowerCase();
    const emotionalRisk = /(now|revenge|must|quick|fast|马上|现在|报复|一定要|快)/i.test(question) ? "High" : "Controlled";
    const accountRisk = (health == null ? void 0 : health.dailyDrawdown) > 2 ? "Elevated" : (health == null ? void 0 : health.riskStatus) || "Healthy";
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
    var _a;
    const route = state.jarvis.route;
    const isZh = state.jarvis.language === "zh";
    const liveLine = (quote == null ? void 0 : quote.price) ? isZh ? `\u5B9E\u65F6\u53C2\u8003\u4EF7 ${formatLivePrice(quote)} ${quote.currency || ""}\u3002` : `Live reference ${formatLivePrice(quote)} ${quote.currency || ""}.` : "";
    const risk = buildRiskProfile(question, snapshot);
    const previous = state.jarvis.memory.previousQuestion || "";
    const mistake = (_a = state.jarvis.memory.repeatedMistakes) == null ? void 0 : _a[0];
    const analysis = brief || state.jarvis.quickAnalysis || state.chartUpload.analysis;
    const plan = analysis == null ? void 0 : analysis.tradePlan;
    if (isZh) {
      if (plan && isTradePlanIntent(intent)) {
        return `\u53EF\u4EE5\uFF0C\u6211\u5148\u7ED9\u4F60\u4E00\u4E2A\u5B9E\u9645\u4E00\u70B9\u7684\u89C4\u5212\u3002\u73B0\u5728\u6211\u4E0D\u4F1A\u5EFA\u8BAE\u76F4\u63A5\u8FFD\uFF0C\u6BD4\u8F83\u597D\u7684\u505A\u6CD5\u662F\u7B49\u4EF7\u683C\u56DE\u5230 ${plan.potentialEntryZone} \u9644\u8FD1\uFF0C\u770B\u6709\u6CA1\u6709\u786E\u8BA4\u3002SL \u53C2\u8003\uFF1A${plan.stopLossReference}\u3002TP \u53EF\u4EE5\u5148\u770B ${plan.takeProfitZones.join("\uFF0C")}\u3002${localizePlanText(plan.estimatedRR, true)} \u91CD\u70B9\u4E0D\u662F\u9A6C\u4E0A\u8FDB\uFF0C\u800C\u662F\u7B49\u4F4D\u7F6E\u3001\u7B49\u786E\u8BA4\u3001\u786E\u8BA4\u65B0\u95FB\u98CE\u9669\u4E0D\u9AD8\u3002`;
      }
      if (plan && (isBuyIntent(intent) || isSellIntent(intent))) {
        return `\u6709\u673A\u4F1A\uFF0C\u4F46\u4E0D\u662F\u201C\u73B0\u5728\u9A6C\u4E0A\u8FDB\u201D\u7684\u611F\u89C9\u3002\u66F4\u50CF\u662F\u7B49 ${plan.potentialEntryZone} \u8FD9\u4E2A\u533A\u57DF\uFF0C\u770B\u6709\u6CA1\u6709\u786E\u8BA4\u3002SL \u53C2\u8003\uFF1A${plan.stopLossReference}\u3002TP \u89C2\u5BDF\uFF1A${plan.takeProfitZones.join("\uFF0C")}\u3002\u5982\u679C\u4EF7\u683C\u4E0D\u56DE\u8E29\u3001\u4E0D\u786E\u8BA4\uFF0C\u5C31\u5148\u4E0D\u8981\u786C\u505A\u3002`;
      }
      if (intent === "Macro Question" && (route == null ? void 0 : route.macro)) {
        const macro = route.macro;
        return `${macro.eventName} \u76EE\u524D\u662F\u771F\u5B9E\u6570\u636E\u6E90\u672A\u8FDE\u63A5\u72B6\u6001\uFF0C\u6240\u4EE5\u6211\u4E0D\u4F1A\u4E71\u7F16 previous / forecast / actual\u3002Actual: ${macro.actual}\u3002\u4E13\u4E1A\u770B\u6CD5\uFF1A${macro.professionalView} \u98CE\u9669\u7B49\u7EA7\uFF1A${macro.riskLevel}\u3002\u4E0B\u4E00\u6B65\uFF1A${macro.watchNext}`;
      }
      if (intent === "General Conversation") {
        return previous ? `\u6211\u8BB0\u5F97\u4F60\u521A\u624D\u95EE\u8FC7\uFF1A\u201C${previous}\u201D\u3002\u6211\u4EEC\u53EF\u4EE5\u7EE7\u7EED\u540C\u4E00\u4E2A\u65B9\u5411\u3002\u73B0\u5728\u6700\u91CD\u8981\u4E0D\u662F\u627E\u66F4\u591A\u4FE1\u53F7\uFF0C\u800C\u662F\u628A\u4E00\u4E2A\u4EA4\u6613\u60F3\u6CD5\u5904\u7406\u6E05\u695A\u3002` : "\u6211\u5728\u3002\u4F60\u53EF\u4EE5\u76F4\u63A5\u95EE\u5E02\u573A\u3001\u98CE\u9669\u3001\u4E8F\u635F\u590D\u76D8\uFF0C\u6216\u4E0A\u4F20\u56FE\u8868\u3002\u6211\u4F1A\u5148\u4FDD\u62A4\u4F60\u7684\u51B3\u7B56\u8D28\u91CF\uFF0C\u4E0D\u4F1A\u4E71\u7ED9\u4E70\u5356\u6307\u4EE4\u3002";
      }
      if (intent === "Psychology" || intent === "Emotional Trading" || intent === "Revenge Trading") {
        return `\u6211\u5148\u7AD9\u5728\u4FDD\u62A4\u4EA4\u6613\u5458\u7684\u89D2\u5EA6\u770B\u3002${mistake ? `\u6211\u4E5F\u7559\u610F\u5230\u4F60\u6700\u8FD1\u6709\u201C${mistake}\u201D\u7684\u503E\u5411\u3002` : ""} \u5982\u679C\u73B0\u5728\u662F\u56E0\u4E3A\u6025\u3001\u6015\u9519\u8FC7\u3001\u6216\u60F3\u8FFD\u56DE\u4E8F\u635F\uFF0C\u6700\u4E13\u4E1A\u7684\u51B3\u5B9A\u53EF\u80FD\u662F\u5148\u6682\u505C\u3002\u597D\u7684\u4EA4\u6613\u4E0D\u9700\u8981\u60C5\u7EEA\u63A8\u52A8\u3002`;
      }
      if (intent === "Risk Question" || intent === "Risk Check" || risk.overallRisk === "High") {
        return `${liveLine}${snapshot.label} \u6709\u673A\u4F1A\uFF0C\u4F46\u5F53\u524D\u98CE\u9669\u56DE\u62A5\u8FD8\u4E0D\u5065\u5EB7\u3002\u5E02\u573A\u98CE\u9669\uFF1A${risk.marketRisk}\uFF1B\u8D26\u6237\u98CE\u9669\uFF1A${risk.accountRisk}\uFF1B\u65B0\u95FB\u98CE\u9669\uFF1A${risk.newsRisk}\uFF1B\u60C5\u7EEA\u98CE\u9669\uFF1A${risk.emotionalRisk}\u3002\u5728\u7EE7\u7EED\u4E4B\u524D\uFF0C\u6211\u4F1A\u6311\u6218\u8FD9\u4E2A\u60F3\u6CD5\uFF1A\u5982\u679C\u6CA1\u6709\u66F4\u5E72\u51C0\u7684\u786E\u8BA4\u548C\u6B62\u635F\u4F4D\u7F6E\uFF0C\u7B49\u5F85\u4F1A\u6BD4\u786C\u8FDB\u573A\u66F4\u4E13\u4E1A\u3002`;
      }
      if (intent === "Trade Review") {
        return `\u53EF\u4EE5\uFF0C\u6211\u4EEC\u628A\u8FD9\u6B21\u4EA4\u6613\u5F53\u6210\u590D\u76D8\uFF0C\u4E0D\u5F53\u6210\u8D23\u5907\u3002\u5148\u770B\u4E09\u4E2A\u95EE\u9898\uFF1A\u8FDB\u573A\u662F\u5426\u6709\u786E\u8BA4\uFF1F\u6B62\u635F\u662F\u5426\u5728\u7ED3\u6784\u5916\uFF1F\u5F53\u65F6\u662F\u4E0D\u662F\u60C5\u7EEA\u63A8\u52A8\uFF1F${analysis ? `\u4E4B\u524D\u7684 ${analysis.pair || analysis.instrument} \u5206\u6790\u4E5F\u53EF\u4EE5\u4E00\u8D77\u5BF9\u7167\u3002` : ""}`;
      }
      if (intent === "Learning" || intent === "Learning Question") {
        return `${snapshot.label} \u4ECA\u5929\u53EF\u4EE5\u8FD9\u6837\u7406\u89E3\uFF1A\u7ED3\u6784\u662F ${snapshot.marketStructure}\uFF0C\u6D41\u52A8\u6027\u662F ${snapshot.liquidityStatus}\u3002\u91CD\u70B9\u4E0D\u662F\u731C\u6DA8\u8DCC\uFF0C\u800C\u662F\u7B49\u4EF7\u683C\u56DE\u5230\u8BA1\u5212\u533A\u57DF\u540E\uFF0C\u770B\u786E\u8BA4\u3001\u6B62\u635F\u3001\u98CE\u9669\u56DE\u62A5\u662F\u5426\u5408\u7406\u3002`;
      }
      return `${liveLine}${snapshot.label} \u76EE\u524D\u6574\u4F53\u4ECD\u504F ${snapshot.marketBias}\uFF0C\u4FE1\u5FC3 ${localizedConfidenceLabel(snapshot.confidence)}\u3002\u4E0D\u8FC7\u6211\u4E0D\u4F1A\u5EFA\u8BAE\u8FFD\u4EF7\u3002\u7ED3\u6784\uFF1A${snapshot.marketStructure}\u3002\u5173\u952E\u662F ${snapshot.keyZones[0]}\u3002\u4E0B\u4E00\u6B65\uFF1A${snapshot.plan} \u6700\u7EC8\u51B3\u5B9A\u7531\u4F60\u505A\uFF0CJARVIS \u8D1F\u8D23\u5E2E\u4F60\u628A\u98CE\u9669\u770B\u6E05\u695A\u3002`;
    }
    if (plan && isTradePlanIntent(intent)) {
      return `Sure. Let me make this practical. I would not chase the current price. A better framework is to watch ${plan.potentialEntryZone} for confirmation. SL reference: ${plan.stopLossReference}. TP areas: ${plan.takeProfitZones.join(", ")}. ${plan.estimatedRR} The key is not to enter quickly; it is to wait for location, confirmation, and clean news risk.`;
    }
    if (plan && (isBuyIntent(intent) || isSellIntent(intent))) {
      return `There is an opportunity, but it does not look like a chase-now setup. I would watch ${plan.potentialEntryZone} and only continue if confirmation appears. SL reference: ${plan.stopLossReference}. TP areas: ${plan.takeProfitZones.join(", ")}. If price does not pull back or confirm, waiting is the stronger decision.`;
    }
    if (intent === "Macro Question" && (route == null ? void 0 : route.macro)) {
      const macro = route.macro;
      return `${macro.eventName} is in data-source-not-connected mode, so I will not invent previous, forecast, or actual numbers. Actual: ${macro.actual}. Professional view: ${macro.professionalView} Risk level: ${macro.riskLevel}. What to watch next: ${macro.watchNext}`;
    }
    if (intent === "General Conversation") {
      return previous ? `I remember you asked: "${previous}". We can continue from there. The goal is not to collect more signals; it is to make one clean decision with discipline.` : "I'm here. Ask me about the market, risk, a loss review, or upload a chart. I will protect your decision quality before talking about profit.";
    }
    if (intent === "Psychology" || intent === "Emotional Trading" || intent === "Revenge Trading") {
      return `I want to protect the trader first. ${mistake ? `I also noticed a recent pattern: ${mistake}. ` : ""}If this question is coming from urgency, fear of missing out, or trying to win money back, the professional move may be to pause. A good trade does not need emotional pressure.`;
    }
    if (intent === "Risk Question" || intent === "Risk Check" || risk.overallRisk === "High") {
      return `${liveLine}${snapshot.label} has opportunity, but the current risk-reward is not healthy yet. Market risk: ${risk.marketRisk}. Account risk: ${risk.accountRisk}. News risk: ${risk.newsRisk}. Emotional risk: ${risk.emotionalRisk}. Before we continue, I would challenge this idea: without cleaner confirmation and a defined stop, waiting is the stronger decision.`;
    }
    if (intent === "Trade Review") {
      return `Good. Let's review the trade without blaming the trader. I would check three things first: did the entry have confirmation, was the stop outside structure, and was the decision emotionally driven? ${analysis ? `We can compare it with the previous ${analysis.pair || analysis.instrument} brief too.` : ""}`;
    }
    if (intent === "Learning" || intent === "Learning Question") {
      return `${snapshot.label} today can be understood this way: structure is ${snapshot.marketStructure}, and liquidity context is ${snapshot.liquidityStatus}. The lesson is not to predict harder; it is to wait until confirmation, invalidation, and risk/reward all line up.`;
    }
    return `${liveLine}${snapshot.label} still favours ${snapshot.marketBias} with ${confidenceLabel(snapshot.confidence)} confidence. I would not chase the move. Structure: ${snapshot.marketStructure}. Key area: ${snapshot.keyZones[0]}. Next best action: ${snapshot.plan} The final decision stays with the trader; my job is to make the risk visible.`;
  }
  function beginMission(question) {
    const finalQuestion = (question == null ? void 0 : question.trim()) || (state.jarvis.topic ? mentorText("Continue from the current market.", "\u7EE7\u7EED\u521A\u624D\u7684\u5E02\u573A\u3002") : jarvisPromptExamples[state.jarvis.promptIndex % jarvisPromptExamples.length]);
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
    if (!isFollowUp) {
      state.jarvis.quickAnalysis = null;
    }
    if (!isFollowUp && !state.chartUpload.previewUrl) {
      state.chartUpload.analysis = null;
    }
    state.jarvis.chat = state.jarvis.chat.filter((item) => !item.thinking);
    addChatMessage({ role: "user", text: finalQuestion });
    addThinkingMessage();
    state.jarvis.missionStartedAt = (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    state.jarvis.timeline = [
      mentorText("Mission opened", "Mission \u5DF2\u5F00\u542F"),
      mentorText("Question received", "\u95EE\u9898\u5DF2\u6536\u5230"),
      mentorText(`${state.jarvis.intent} context selected`, `\u5DF2\u5224\u65AD\u95EE\u9898\u7C7B\u578B`),
      mentorText(`${route.capabilities.length} capabilities selected`, `\u5DF2\u9009\u62E9 ${route.capabilities.length} \u4E2A\u80FD\u529B`)
    ];
    state.activePage = "JARVIS";
  }
  async function processMissionQuestion({ alreadyLocked = false } = {}) {
    var _a, _b;
    if (state.jarvis.isProcessing && !alreadyLocked) return;
    if (!alreadyLocked) state.jarvis.isProcessing = true;
    try {
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
        const clarification = buildClarificationResponse(state.jarvis.question || contextQuestion, intent);
        replaceThinkingMessage({ ...clarification, attention: true });
        state.jarvis.timeline = [...state.jarvis.timeline, mentorText("Clarification requested", "\u5DF2\u8BF7\u6C42\u7B80\u77ED\u6F84\u6E05")];
        return;
      }
      if (isPairingQuestion(state.jarvis.question || contextQuestion)) {
        state.jarvis.status = "quickReady";
        state.jarvis.intent = "Potential Signal Request";
        state.jarvis.mentorNote = buildPairingAnswer(state.jarvis.question || contextQuestion);
        replaceThinkingMessage(finalJarvisMessage(state.jarvis.mentorNote, { suggestions: buildNextActions("Potential Signal Request") }));
        state.jarvis.timeline = [...state.jarvis.timeline, mentorText("Trade Pairing Mode used", "\u5DF2\u4F7F\u7528 Trade Pairing Mode")];
        return;
      }
      if (isFollowUpQuestion(state.jarvis.question) && (state.jarvis.quickAnalysis || state.chartUpload.analysis || state.jarvis.topic)) {
        state.jarvis.status = "quickReady";
        state.jarvis.mentorNote = buildFollowUpAnswer(state.jarvis.question);
        replaceThinkingMessage(finalJarvisMessage(state.jarvis.mentorNote, { suggestions: buildNextActions(intent) }));
        state.jarvis.timeline = [...state.jarvis.timeline, mentorText("Follow-up explained", "\u5DF2\u89E3\u91CA\u8FFD\u95EE")];
        return;
      }
      state.jarvis.quickAnalysis = await buildPreliminaryBrief(contextQuestion);
      const snapshot = getMockMarketSnapshot(contextQuestion);
      const quote = ((_a = state.jarvis.quickAnalysis) == null ? void 0 : _a.livePrice) ? {
        price: state.jarvis.quickAnalysis.livePrice,
        currency: state.jarvis.quickAnalysis.liveCurrency,
        updatedAt: state.jarvis.quickAnalysis.liveUpdatedAt,
        type: state.jarvis.quickAnalysis.instrumentType,
        symbol: state.jarvis.quickAnalysis.pair
      } : await getLiveMarketQuote(contextQuestion);
      if (!state.chartUpload.previewUrl && intent === "Chart Analysis" && !isTradePlanIntent(intent)) {
        const brief = state.jarvis.quickAnalysis;
        const liveLine = brief.livePrice ? mentorText(
          `Live reference: ${brief.livePriceText} ${brief.liveCurrency || ""}. `,
          `\u5B9E\u65F6\u53C2\u8003\u4EF7\uFF1A${brief.livePriceText} ${brief.liveCurrency || ""}\u3002`
        ) : "";
        state.jarvis.status = "needsChart";
        state.jarvis.mentorNote = mentorText(
          `${liveLine}I can help. Without the chart, my best view is only preliminary. Upload the current chart and I will check structure, liquidity, risk, and the trade plan from the actual setup.`,
          `${liveLine}\u6211\u53EF\u4EE5\u5E2E\u4F60\u5224\u65AD\u3002\u6CA1\u6709\u56FE\u8868\u65F6\uFF0C\u6211\u53EA\u80FD\u7ED9\u521D\u6B65\u770B\u6CD5\u3002\u4E0A\u4F20\u5F53\u524D\u56FE\u8868\u540E\uFF0C\u6211\u4F1A\u4ECE\u5B9E\u9645 setup \u68C0\u67E5\u7ED3\u6784\u3001\u6D41\u52A8\u6027\u3001\u98CE\u9669\u548C\u4EA4\u6613\u8BA1\u5212\u3002`
        );
        replaceThinkingMessage(
          finalJarvisMessage(state.jarvis.mentorNote, {
            suggestions: mentorText(["Upload chart", "Give preliminary view", "Check risk first"], ["\u4E0A\u4F20\u56FE\u8868", "\u5148\u7ED9\u521D\u6B65\u770B\u6CD5", "\u5148\u68C0\u67E5\u98CE\u9669"])
          })
        );
        state.jarvis.timeline = [...state.jarvis.timeline, mentorText("Chart requested", "\u9700\u8981\u56FE\u8868\u786E\u8BA4")];
        return;
      }
      state.jarvis.status = "quickReady";
      const contextBrief = state.chartUpload.analysis || state.jarvis.quickAnalysis;
      state.jarvis.mentorNote = intent === "Macro Question" ? buildMacroResponse(route) : isTradePlanIntent(intent) || isBuyIntent(intent) || isSellIntent(intent) ? buildStructuredTradeResponse({ question: contextQuestion, intent, snapshot, quote, brief: contextBrief }) : buildUnifiedMentorResponse({ question: contextQuestion, intent, snapshot, quote, brief: contextBrief });
      const finalMessage = finalJarvisMessage(state.jarvis.mentorNote, {
        tradeRelated: ((_b = route.safety) == null ? void 0 : _b.isTradeRelated) || intent !== "General Conversation",
        suggestions: buildNextActions(intent)
      });
      replaceThinkingMessage({
        ...finalMessage,
        text: state.chartUpload.previewUrl ? `${finalMessage.text} ${mentorText("I will keep the uploaded chart available on the right for context.", "\u6211\u4F1A\u628A\u5DF2\u4E0A\u4F20\u56FE\u8868\u4FDD\u7559\u5728\u53F3\u8FB9\u4F5C\u4E3A\u5224\u65AD\u80CC\u666F\u3002")}` : finalMessage.text
      });
      state.jarvis.timeline = [...state.jarvis.timeline, mentorText("Mentor view prepared", "\u5BFC\u5E08\u89C2\u70B9\u5DF2\u51C6\u5907")];
    } catch (error) {
      console.error(error);
      state.jarvis.status = "error";
      state.jarvis.mentorNote = mentorText(
        "I hit a processing issue, but I will not leave the mission hanging. Please send the question again, or upload the chart and I will rebuild the brief.",
        "\u521A\u624D\u5904\u7406\u65F6\u51FA\u9519\u4E86\uFF0C\u4F46\u6211\u4E0D\u4F1A\u8BA9\u8FD9\u4E2A Mission \u5361\u4F4F\u3002\u8BF7\u518D\u53D1\u4E00\u6B21\u95EE\u9898\uFF0C\u6216\u4E0A\u4F20\u56FE\u8868\uFF0C\u6211\u4F1A\u91CD\u65B0\u5EFA\u7ACB\u7B80\u62A5\u3002"
      );
      replaceThinkingMessage({ text: state.jarvis.mentorNote, attention: true });
      state.jarvis.timeline = [...state.jarvis.timeline, mentorText("Processing recovered", "\u5904\u7406\u5DF2\u6062\u590D")];
    } finally {
      state.jarvis.isProcessing = false;
      refreshMissionControlOnly();
    }
  }
  function recentAnalysisCard() {
    const latest = state.chartUpload.history[0] || state.chartUpload.analysis;
    if (!latest) return `<strong>No saved analysis yet</strong><p>Ask JARVIS first. Upload a chart only when the question needs setup analysis.</p>`;
    return `<strong>${latest.pair} \u2022 ${latest.bias} ${latest.confidence}%</strong><p>${latest.recommendation}</p>`;
  }
  function masterChatPanel() {
    const chat = state.adminChat;
    return `
    <article class="jarvis-mentor conversation-panel master-chat-panel">
      <div class="chat-thread">
        ${chat.map(
      (item) => `
              <div class="chat-message ${item.role === "user" ? "user-message" : "jarvis-message"} ${item.attention ? "attention" : ""}">
                <strong>${item.role === "user" ? "MASTER" : "JARVIS"}</strong>
                <p>${item.text}</p>
                ${item.thinking ? `<span class="typing-dots"><i></i><i></i><i></i></span>` : ""}
              </div>
            `
    ).join("")}
      </div>
      <form class="jarvis-question-form chat-composer master-chat-form">
        <textarea id="masterQuestion" rows="2" placeholder="Ask Master Command..."></textarea>
        <div class="jarvis-actions">
          <button class="ghost-button master-prompt" data-prompt="Who needs attention today?" type="button">Users</button>
          <button class="ghost-button master-prompt" data-prompt="Show unlock queue" type="button">Unlocks</button>
          <button type="submit">Send</button>
        </div>
      </form>
    </article>
  `;
  }
  function addMasterChat(message) {
    state.adminChat = [...state.adminChat, { id: `admin-chat-${Date.now()}-${Math.random()}`, ...message }].slice(-16);
  }
  function replaceMasterThinking(message) {
    const index = state.adminChat.findIndex((item) => item.thinking);
    const nextMessage = { id: `admin-chat-${Date.now()}-${Math.random()}`, role: "jarvis", ...message };
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
    const unlockQueue = adminUsers.filter((user) => ["Level 3", "Level 4", "Level 1"].includes(user.unlock));
    if (text.includes("deposit") || text.includes("fund")) {
      return `Deposit status: 2 funded users, ${pendingDeposits.length} need follow-up. Mei is pending review. Lina has not started. Keep the message simple: confirm broker link, deposit status, and next action.`;
    }
    if (text.includes("unlock") || text.includes("permission")) {
      return `Unlock queue: ${unlockQueue.length} users need review. Kai and Arif are progressing well. Mei should stay at Level 1 until deposit and consistency are confirmed.`;
    }
    if (text.includes("engine") || text.includes("health") || text.includes("mt5") || text.includes("system")) {
      return `System status: MT5 is ${brain.system.mt5Connection}. Engine average is ${brain.system.engineHealthAverage}%. This is still read-only Alpha structure, so no trade execution is active.`;
    }
    if (text.includes("alert") || text.includes("attention") || text.includes("risk") || text.includes("user")) {
      return `Priority today: ${weakUsers.map((user) => user.name).join(" and ")} need attention. Mei needs deposit follow-up. Lina has paused learning and should receive a calm mentor check-in.`;
    }
    if (text.includes("activity") || text.includes("recent")) {
      return `Recent activity: ${activity.join(". ")}. Main mentor action is to protect consistency before pushing unlocks.`;
    }
    return `Master summary: 4 users in the current cohort, 2 funded, 3 unlock reviews, 2 mentor alerts. Best action today is Mei deposit follow-up and Lina learning reactivation.`;
  }
  async function handleMasterQuestion(question, brain) {
    const finalQuestion = question || "Who needs attention today?";
    addMasterChat({ role: "user", text: finalQuestion });
    addMasterChat({ role: "jarvis", text: "Reviewing command center...", thinking: true });
    render();
    await new Promise((resolve) => setTimeout(resolve, 420));
    replaceMasterThinking({ text: buildMasterReply(finalQuestion, brain), attention: /alert|attention|risk/i.test(finalQuestion) });
    render();
  }
  function adminPage() {
    const brain = state.adminBrainData;
    const page = el("section", "page-stack");
    page.innerHTML = `
    <section class="admin-hero v2-command-hero">
      <div>
        <p class="eyebrow">Administrator Workspace</p>
        <h1>AI Operations Command Center</h1>
        <p>Monitor users, revenue, subscriptions, engine readiness, market data, and mentor activity in the same calm JARVIS workspace.</p>
      </div>
      <div class="admin-kpis">
        ${kpi("Total Users", "4", "current cohort")}
        ${kpi("Active Users", "3", "last 7 days")}
        ${kpi("Revenue", "$2.4k", "placeholder MRR")}
        ${kpi("Subscription", "75%", "active ratio")}
      </div>
    </section>
    <section class="workspace-section">
      <div class="section-heading"><p class="eyebrow">System Overview</p><h2>Operational intelligence without the clutter.</h2></div>
      <div class="module-grid today-layout v2-intel-grid">
        ${card("AI Engine Status", `<strong>${brain.system.engineHealthAverage}% Ready</strong><p>Core intelligence placeholders are online for Alpha. No real execution engine is active.</p>`)}
        ${card("Market Data Status", `<strong>${brain.system.mt5Connection}</strong><p>Read-only bridge remains a future sprint. Current UI uses realistic placeholder data.</p>`)}
        ${card("News Engine", `<strong>Placeholder</strong><p>Macro and news modules are prepared for later connection.</p>`)}
        ${card("System Health", `<strong>Stable</strong><p>Workspace, command center, and JARVIS interaction layers are available.</p>`)}
      </div>
    </section>
    <section class="master-chat-layout">
      ${masterChatPanel(brain)}
      <aside class="master-snapshot">
        ${card("Command Snapshot", `<div class="metric-line"><span>Priority</span><b>Mei follow-up</b></div><div class="metric-line"><span>Revenue</span><b>$2.4k demo</b></div><div class="metric-line"><span>Engine Avg</span><b>${brain.system.engineHealthAverage}%</b></div>`)}
        ${card("Quick Prompts", `<button class="ghost-button master-prompt" data-prompt="Who needs attention today?">Users attention</button><button class="ghost-button master-prompt" data-prompt="Show deposit status">Deposit status</button><button class="ghost-button master-prompt" data-prompt="Check engine health">Engine health</button>`)}
      </aside>
    </section>
    <section class="admin-command-layout">
      <article class="admin-table-card">
        <div class="section-heading"><p class="eyebrow">Users overview</p><h2>Growth and access status</h2></div>
        <div class="admin-table">
          ${adminUsers.map((user) => userRow(user)).join("")}
        </div>
      </article>
      <aside class="admin-side-stack">
        ${card("Market Data Status", `<strong>${brain.system.mt5Connection}</strong><p>Read-only bridge will connect in a later sprint.</p>`)}
        ${card("Engine Health Status", brain.engineHealth.slice(0, 6).map((engine) => `<div class="engine-row"><span>${engine.name}</span><b>${engine.health}%</b></div>`).join(""))}
        ${card("Mentor Alerts", `<p>Mei needs deposit follow-up. Lina has paused learning for 5 days.</p>`)}
      </aside>
    </section>
    <section class="command-grid activity-grid">
      ${card("Unlock Permissions", `<p>3 users eligible for next milestone review.</p><button class="ghost-button">Review queue</button>`)}
      ${card("Deposit Status", `<p>2 funded users, 1 pending review, 1 not started.</p>`)}
      ${card("Recent Activity", activity.map((item) => `<div class="activity-item">${item}</div>`).join(""), "card-wide")}
    </section>
    ${engineStrip()}
  `;
    bindMasterChatActions(page);
    return page;
  }
  function chartUploadCard() {
    const upload = state.chartUpload;
    const analysis = upload.analysis;
    const preview = upload.previewUrl ? `<img class="chart-preview" src="${upload.previewUrl}" alt="Uploaded chart preview" />` : `<div class="drop-zone">Upload chart screenshot<br><span>JARVIS will read the setup context</span></div>`;
    const analysisBlock = analysis ? `
      <div class="chart-analysis">
        <div class="metric-line"><span>Pair</span><b>${analysis.pair}</b></div>
        <div class="metric-line"><span>Timeframe</span><b>${analysis.timeframe}</b></div>
        <div class="metric-line"><span>Bias</span><b>${analysis.bias} \u2022 ${analysis.confidence}%</b></div>
        <p>${analysis.marketStructure}</p>
        <p>${analysis.liquidity}</p>
        <p>${analysis.recommendation}</p>
        <p>${analysis.learningNote}</p>
      </div>
    ` : `<p>Upload a screenshot to preview it, then let JARVIS build the trading brief.</p>`;
    return `
    ${preview}
    <input id="chartUploadInput" class="hidden-file-input" type="file" accept="image/*" />
    <div class="chart-actions">
      <button class="ghost-button" id="chooseChartButton" type="button">Upload Screenshot</button>
      <button class="ghost-button" id="analyzeChartButton" type="button" ${upload.previewUrl ? "" : "disabled"}>Build Brief</button>
      <button class="ghost-button" id="saveChartAnalysisButton" type="button" ${analysis ? "" : "disabled"}>Save Mission</button>
    </div>
    ${analysisBlock}
    <p class="chart-history-note">${upload.history.length} saved mission${upload.history.length === 1 ? "" : "s"}</p>
  `;
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
    if (save) {
      save.addEventListener("click", () => {
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
    }
    if (fresh) {
      fresh.addEventListener("click", () => {
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
  }
  function bindChartUploadActions(page) {
    const input = page.querySelector("#chartUploadInput");
    const choose = page.querySelector("#chooseChartButton");
    const analyze = page.querySelector("#analyzeChartButton");
    const save = page.querySelector("#saveChartAnalysisButton");
    if (!input || !choose || !analyze || !save) return;
    choose.addEventListener("click", () => input.click());
    input.addEventListener("change", () => {
      var _a;
      const file = (_a = input.files) == null ? void 0 : _a[0];
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
        var _a;
        const trade = getPotentialTrades().find((item) => item.id === button.dataset.tradeFeedback);
        if (!trade) return;
        const record = createFeedbackRecord({
          trade,
          missionId: (_a = state.chartUpload.history[0]) == null ? void 0 : _a.missionId,
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
      selectedCapabilities: ["Signal Capability", "Planning Capability", "Risk Capability", "Mentor Capability"],
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
    const upload = page.querySelector("#jarvisUploadButton");
    const input = page.querySelector("#chartUploadInput");
    bindBriefActions(page);
    page.querySelectorAll("[data-quick-prompt]").forEach((button) => {
      button.addEventListener("click", async () => {
        if (state.jarvis.isProcessing) return;
        const prompt = button.dataset.quickPrompt;
        beginMission(prompt);
        state.jarvis.isProcessing = true;
        refreshMissionControlOnly();
        await processMissionQuestion({ alreadyLocked: true });
        refreshMissionControlOnly();
      });
    });
    if (form) {
      const textarea = page.querySelector("#jarvisQuestion");
      if (textarea) {
        textarea.addEventListener("keydown", (event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            form.requestSubmit();
          }
        });
      }
      form.addEventListener("submit", async (event) => {
        var _a;
        event.preventDefault();
        if (state.jarvis.isProcessing) return;
        const mode = form.dataset.mode || "mission";
        const question = (_a = page.querySelector("#jarvisQuestion")) == null ? void 0 : _a.value.trim();
        beginMission(question);
        state.jarvis.isProcessing = true;
        if (mode === "mission") {
          textarea.value = "";
          refreshMissionControlOnly();
        } else {
          render();
        }
        if (mode === "home") {
          await processMissionQuestion({ alreadyLocked: true });
          render();
          return;
        }
        await processMissionQuestion({ alreadyLocked: true });
        refreshMissionControlOnly();
      });
    }
    if (upload && input) upload.addEventListener("click", () => input.click());
    if (input) {
      input.addEventListener("change", () => {
        var _a;
        const file = (_a = input.files) == null ? void 0 : _a[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          state.chartUpload.previewUrl = reader.result;
          state.chartUpload.fileName = file.name;
          state.chartUpload.analysis = null;
          state.jarvis.status = "analyzing";
          state.jarvis.progressIndex = 0;
          state.jarvis.mentorNote = mentorText(
            "Chart received. I am reading the setup before giving a brief.",
            "\u56FE\u8868\u5DF2\u6536\u5230\u3002\u6211\u4F1A\u5148\u9605\u8BFB\u7ED3\u6784\uFF0C\u518D\u7ED9\u4F60\u7B80\u62A5\u3002"
          );
          addChatMessage({ role: "jarvis", text: state.jarvis.mentorNote });
          state.jarvis.timeline = [...state.jarvis.timeline, mentorText("Chart uploaded", "Chart uploaded")];
          localStorage.setItem("jarvis-chart-file-name", state.chartUpload.fileName);
          localStorage.removeItem("jarvis-chart-analysis");
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
      for (let index = 0; index < analysisSteps.length; index += 1) {
        state.jarvis.progressIndex = index;
        render();
        await new Promise((resolve) => setTimeout(resolve, 220));
      }
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
      addChatMessage(finalJarvisMessage(state.jarvis.mentorNote, { suggestions: buildNextActions(state.jarvis.intent || "Chart Analysis") }));
      state.jarvis.timeline = [...state.jarvis.timeline, mentorText("Trading Brief built", "\u4EA4\u6613\u7B80\u62A5\u5DF2\u5EFA\u7ACB")];
      localStorage.setItem("jarvis-chart-analysis", JSON.stringify(state.chartUpload.analysis));
    } catch (error) {
      console.error(error);
      state.jarvis.status = "error";
      addChatMessage({
        role: "jarvis",
        text: mentorText(
          "I could not complete the chart analysis. Upload a clearer screenshot with pair, timeframe, and price scale, then I will rebuild it.",
          "\u6211\u65E0\u6CD5\u5B8C\u6210\u8FD9\u6B21\u56FE\u8868\u5206\u6790\u3002\u8BF7\u4E0A\u4F20\u66F4\u6E05\u695A\u7684\u622A\u56FE\uFF0C\u5305\u542B\u54C1\u79CD\u3001\u5468\u671F\u548C\u4EF7\u683C\u523B\u5EA6\uFF0C\u6211\u4F1A\u91CD\u65B0\u5EFA\u7ACB\u7B80\u62A5\u3002"
        ),
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
  function formatMoney(value, currency = "USD") {
    if (typeof value !== "number") return "Mock pending";
    return `${value.toLocaleString()} ${currency}`;
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
  function engineStrip() {
    var _a, _b;
    const engineHealth = (state.role === "admin" ? (_a = state.adminBrainData) == null ? void 0 : _a.engineHealth : (_b = state.brainData) == null ? void 0 : _b.engineHealth) || [];
    return `
    <section class="engine-strip">
      <div>
        <p class="eyebrow">Future engine placeholders</p>
        <h2>Prepared for real intelligence later</h2>
      </div>
      <div class="engine-list">
        ${engineHealth.map((engine) => `<span>${engine.name}<small>${engine.status} \u2022 ${engine.health}%</small></span>`).join("")}
      </div>
    </section>
  `;
  }
  function timeGreeting() {
    if (state.loginHour < 12) return "Good morning";
    if (state.loginHour < 18) return "Good afternoon";
    return "Good evening";
  }
  setInterval(() => {
    if (!state.isLoggedIn) return;
    state.jarvis.promptIndex = (state.jarvis.promptIndex + 1) % jarvisPromptExamples.length;
    const input = document.getElementById("jarvisQuestion");
    if (input && !input.value) {
      input.placeholder = jarvisPromptExamples[state.jarvis.promptIndex];
    }
  }, 2600);
  render();
})();
