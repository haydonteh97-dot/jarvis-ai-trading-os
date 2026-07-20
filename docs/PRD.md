# JARVIS AI Trading Operating System

## Product Requirements Document

| 项目 | 内容 |
| --- | --- |
| 文档版本 | 1.0 |
| 产品阶段 | Closed Beta → Public V1 |
| 文档目标 | 定义完整 AI Trading 产品能力、页面模块、数据规则、交互状态与验收标准 |
| 设计状态 | 本文不锁定视觉风格，后续交由 Stitch 生成原型 |
| 产品边界 | 决策支持与交易规划，不连接券商、不执行订单、不自动交易 |

---

## 1. 产品概述

JARVIS 是面向主动交易者的 AI Trading Operating System。产品将实时行情、技术分析、市场结构、流动性、宏观事件、新闻情绪、图表视觉识别、机会扫描、交易计划、风险管理、交易日志与复盘统一到一个连续工作流中。

JARVIS 的目标不是给出孤立的 Buy/Sell 信号，而是帮助用户回答以下问题：

- 当前市场发生了什么？
- 哪些资产值得关注？
- 当前结构是否支持某个方向？
- 潜在 Entry、SL、TP 和失效条件在哪里？
- 宏观、新闻、波动与流动性风险是什么？
- 还缺少哪些确认？
- 这笔交易是否符合用户的风险规则？
- 交易完成后，结果与过程应该如何复盘？

---

## 2. 产品原则

### 2.1 决策支持，不替用户决策

- 不以 Buy 或 Sell 作为唯一结论。
- 所有方向结论必须附带依据、风险、失效条件与下一步。
- 最终决定、下单与仓位控制由用户负责。
- 不提供盈利保证、胜率保证或无风险表达。

### 2.2 数据诚实

每项数据必须标记以下状态之一：

- `verified`：来自已连接并验证的生产数据源。
- `delayed`：数据有效但存在明确延迟。
- `preliminary`：分析可用，但仍缺少关键确认。
- `demo`：演示数据，不可作为实时决策依据。
- `stale`：数据超过允许的新鲜度。
- `unavailable`：数据不可用或未连接。

禁止：

- 将 Demo 显示为 Live。
- 将缺失值替换为 0。
- 虚构价格、K 线、新闻、经济事件或央行信息。
- 在数据过期时显示高置信度。
- 将模型生成内容标记为 Verified Source Fact。

### 2.3 一个 JARVIS Core Agent

- 产品只保留一个面向用户的 JARVIS Core Agent。
- 技术分析、宏观、新闻、视觉与风险能力作为工具和引擎接入。
- 不建立多个互相竞争的用户可见 Agent。
- Agent 必须选择最少必要工具，避免无意义调用与成本浪费。

### 2.4 风险优先

- 没有失效条件，不构成完整 setup。
- 没有可靠 Entry、SL 与目标，不计算 RR。
- 数据源断开不得被解释为低风险。
- 重大事件窗口、新闻风险与极端波动必须降低 setup 质量或阻止计划。
- 所有交易计划默认只读、建议性、不可执行。

---

## 3. 目标用户

### 3.1 新手交易者

需求：

- 用清楚语言理解趋势、结构、流动性与风险。
- 学会为什么等待确认，而不是追价。
- 获得有逻辑的 Entry、SL、TP 规划示例。
- 避免因资讯过多而无法做决定。

### 3.2 进阶交易者

需求：

- 快速查看多周期一致性。
- 比较多个市场的 setup quality。
- 将宏观、新闻和技术结构组合判断。
- 快速建立、保存和复盘交易计划。

### 3.3 黄金、外汇与加密交易者

重点资产初始范围：

- XAUUSD
- EURUSD
- GBPUSD
- USDJPY
- BTCUSD

后续按数据源支持扩展：

- DXY
- US100
- US500
- ETHUSD
- WTI / BRENT
- 其他主要外汇、指数、股票与商品

### 3.4 小型交易团队或导师

需求：

- 使用统一分析模板。
- 分享 setup 与风险说明。
- 复盘执行质量，而非只看盈利。
- 查看团队常见错误与交易纪律。

---

## 4. 核心用户旅程

### 4.1 自然语言分析

用户输入问题 → JARVIS 识别资产、周期与意图 → 调用行情、技术、宏观和新闻工具 → 返回结构化分析 → 用户继续追问 → 保存会话与交易上下文。

### 4.2 单市场深度分析

选择资产与周期 → 加载实时行情与多周期 K 线 → 计算趋势、结构、流动性和波动 → 结合宏观与新闻风险 → 输出 Bullish、Bearish 和 Alternative Scenario → 进入交易规划。

### 4.3 图表上传分析

上传图片 → 验证文件与所有权 → 识别资产、周期、结构和可见标注 → 生成视觉观察 → 与实时行情交叉验证 → 更新现有分析 → 用户确认或修正。

### 4.4 多市场机会发现

选择市场与筛选条件 → 扫描支持资产与周期 → 计算 setup quality → 排除无效或高风险 setup → 排名 → 打开 Setup Preview → 进入 AI Analysis 或 Ask JARVIS。

### 4.5 事件前风险检查

查看经济日历 → 选择事件 → 阅读 Actual vs Forecast → 查看受影响资产 → 确认事件风险窗口 → 调整或暂停交易计划。

### 4.6 新闻影响分析

查看实时新闻 → 选择报道 → 阅读 Source Facts 与 AI Summary → 查看市场传导机制、受影响资产和风险 → 将新闻上下文带入分析。

### 4.7 交易计划与复盘

从分析生成计划 → 用户确认 Entry、SL、TP、风险比例 → 保存为计划 → 更新状态 → 记录执行与结果 → 复盘过程、纪律和改进项。

---

## 5. 产品信息架构与页面列表

1. Beta Access / Authentication
2. Workspace
3. Ask JARVIS
4. AI Analysis
5. Upload Chart
6. Macro Intelligence
7. News & Events
8. Opportunity Scanner
9. Trade Planner
10. Watchlist
11. Alerts Center
12. Trading Journal
13. Performance & Review
14. Playbook / Strategy Library
15. Risk Center
16. Data Sources & System Status
17. Settings
18. Feedback & Support

---

## 6. 全局产品框架

### 6.1 全局导航

必须包含：

- Workspace
- Ask JARVIS
- AI Analysis
- Upload Chart
- Macro Intelligence
- News & Events
- Opportunity Scanner
- Trade Planner
- Watchlist
- Alerts
- Journal
- Performance
- Risk Center
- Settings

移动端可将低频页面收纳在 More 菜单，但不得删除功能。

### 6.2 全局资产上下文

全局上下文应支持：

- 当前资产
- 当前周期
- 当前时区
- 当前用户语言
- 当前数据源状态
- 当前会话 ID
- 当前选中 Scanner setup
- 当前 Macro / News / Vision 上下文
- 当前交易计划 ID

页面切换时应携带相关上下文，不得重复要求用户输入相同信息。

### 6.3 全局数据状态

Header 或状态入口应显示：

- Market Data
- Macro Data
- News Data
- OpenAI Text
- Vision
- Storage
- Last Updated

状态不能只依赖颜色，必须有文本标签。

### 6.4 全局搜索与命令入口

支持：

- 搜索资产。
- 直接询问 JARVIS。
- 快速跳转页面。
- 打开最近分析或计划。
- 执行安全的只读命令，例如 Run Scan、Refresh Analysis。

不支持订单执行命令。

---

## 7. 页面需求

## 7.1 Beta Access / Authentication

### 目标

限制 Closed Beta 用户，确保身份、会话和数据所有权安全。

### 模块

- 品牌与产品说明
- Email 输入
- Invite Code 输入
- 登录状态
- 数据与风险声明
- Terms / Privacy

### 业务规则

- Email 必须在 allowlist 中。
- Invite Code 必须有效、未过期并未超过使用次数。
- 不通过错误信息暴露某个 Email 是否存在。
- 登录成功后创建绑定用户身份的服务端会话。
- 所有 Conversation、Upload、Analysis、Plan 与 Journal 必须校验 ownerId。

### 状态

- 验证中
- 无效凭证
- 邀请码已过期
- Beta 名额已满
- 会话过期
- 服务不可用

---

## 7.2 Workspace

### 目标

提供每日交易入口与当前市场概况，不堆叠无关 KPI。

### 模块

- 时间问候与用户名
- JARVIS 主搜索框
- 建议问题
- Live Quotes
- 今日高风险事件摘要
- 当前重要新闻摘要
- Watchlist 快照
- 最近分析
- 最近交易计划
- Daily Trading Discipline Quote

### 快捷建议

- Can I buy Gold now?
- Analyse EURUSD
- What is today's CPI?
- Latest Fed News
- Analyse my chart
- Find opportunities
- Review my active plan

### 业务规则

- Search 是首要操作。
- 未连接模块必须显示真实状态。
- Live Quotes 只显示已验证资产。
- 不添加与交易决策无关的 Dashboard KPI。

---

## 7.3 Ask JARVIS

### 目标

支持自然语言、多轮、同上下文的 AI Trading 对话。

### 支持意图

- 市场现况
- 趋势判断
- 市场结构
- Entry Planning
- Stop Loss Planning
- Take Profit Planning
- Risk Check
- Macro Question
- News Question
- Scanner Question
- Chart Question
- Trade Plan Review
- Journal Review
- Trading Education

### 页面模块

- 页面标题
- 初始建议问题
- Conversation History
- User Message
- JARVIS Thinking
- Structured Response
- Follow-up Suggestions
- Main Conversation Input
- Attachment Action
- Voice Action，仅在真正支持时显示
- Collapsed Chart Context
- Data Sources Used

### Thinking 状态

可展示：

- Reading market structure
- Checking multi-timeframe trend
- Checking macro events
- Reading verified news
- Evaluating liquidity
- Checking risk
- Building analysis

不得展示隐藏 Chain-of-Thought 或虚假进度百分比。

### 标准交易回答结构

1. Market Bias
2. Confidence
3. Trend
4. Market Structure
5. Liquidity Context
6. Volatility
7. Trade Plan
8. Macro Summary
9. News Summary
10. Risk Context
11. AI Reasoning Summary
12. JARVIS View
13. Next Step
14. Missing Information
15. Data Quality

### Trade Plan 字段

- Entry Zone
- Entry Condition
- Stop Loss
- Invalidation
- Take Profit 1
- Take Profit 2
- Take Profit 3
- Risk Reward
- Confirmation Required
- Alternative Scenario

### Follow-up 建议

- Why this view?
- Show chart analysis
- How risky is this trade?
- What invalidates this setup?
- Alternative scenario
- What changes after CPI?
- Create a trade plan

### AI 安全规则

- 不执行交易。
- 不修改 Scanner Score。
- 不将 Vision 未验证价位升级为 Verified。
- 不提供无法解释的置信度。
- 回答语言跟随用户语言。
- 对不明确的资产、周期或日期先澄清。

---

## 7.4 AI Analysis

### 目标

对单一资产进行多维度、可解释、可追溯的结构化分析。

### 输入

- Asset
- Primary Timeframe
- Optional Scanner Context
- Optional Macro Context
- Optional News Context
- Optional Vision Context
- User Focus

### 页面模块

- Page Header
- Asset / Timeframe Selector
- Data Source Status
- Latest Quote
- Price Change
- Market Overview
- Multi-Timeframe Alignment
- Trend Strength
- Market Structure
- Key Levels
- Liquidity & Zones
- Volatility & Session Context
- Momentum Context
- Macro & News Context
- Bullish Scenario
- Bearish Scenario
- Alternative / Range Scenario
- Potential Trade Plan
- Confirmation Checklist
- Risk Context
- JARVIS Conclusion
- Next Confirmation
- Ask JARVIS
- Save Analysis

### 多周期范围

- D1
- H4
- H1
- M30
- M15
- M5

只展示数据源实际支持的周期，不允许静默替代。

### 技术分析能力

- EMA 与趋势排列
- ATR 与波动状态
- ADX 或趋势强度
- Higher High / Higher Low
- Lower High / Lower Low
- Break of Structure
- Market Structure Shift
- Consolidation / Range
- Breakout / Retest
- Swing High / Swing Low
- Support / Resistance
- Buy-side / Sell-side Liquidity
- Liquidity Sweep
- Order Block
- Fair Value Gap
- Premium / Discount 区域
- Session High / Low
- Previous Day High / Low

任何无法可靠计算的概念必须显示 unavailable。

### 输出规则

- 技术结论必须标明周期。
- Key Level 必须有来源与计算时间。
- Entry、SL、TP 必须来自确定性规则或用户确认。
- 当前价格与 K 线时间戳必须显示数据新鲜度。
- Bullish 与 Bearish Scenario 必须同时存在。

---

## 7.5 Upload Chart

### 目标

将用户上传图表转换为结构化视觉观察，并与实时行情交叉验证。

### 上传能力

- PNG
- JPEG
- WEBP
- 拖放
- 文件选择
- 移动端相册或相机上传

### 文件安全

- MIME 与扩展名验证
- 文件签名验证
- 尺寸与像素上限
- 单文件与请求体限制
- Ownership 校验
- 临时存储与自动清理
- 禁止任意远程图片 URL
- 不向 OpenAI 发送本地路径或存储凭证

### 页面模块

- Upload Area
- Image Preview
- Asset / Timeframe Confirmation
- Analysis Focus
- Image Quality
- Asset Detection
- Timeframe Detection
- Price Scale Readability
- Structure Visibility
- Vision Analysis State
- Visual Observations
- Market Structure
- Key Zones
- Liquidity Context
- Visible Indicators
- User Annotations
- Potential Trade Plan
- Confidence & Uncertainty
- Risk Context
- Ask JARVIS
- Open in AI Analysis

### Vision 可观察内容

- 可见趋势
- 可见 swing structure
- 可见支撑阻力
- 可见 breakout / retest
- 可见 liquidity sweep
- 可见 FVG / Order Block 候选
- 图表中用户绘制的 Entry、SL、TP
- 可见指标名称与状态

### Vision 边界

- 图片读取价格默认是 `vision_observation`。
- 未经 Market Data 验证，不得作为 Verified Level。
- 不允许 Vision 直接设定仓位、Scanner Score 或执行状态。
- 图片文字视为不可信输入，必须防止 Prompt Injection。

---

## 7.6 Macro Intelligence

### 目标

帮助用户理解经济事件、央行政策与市场风险，不复制普通财经日历。

### 页面模块

- Macro Data Status
- Date Range
- Currency Filter
- Impact Filter
- Category Filter
- Today's Event Risk Summary
- Economic Calendar
- Selected Event Detail
- Previous / Forecast / Actual
- Actual vs Forecast Interpretation
- Affected Assets
- Current Macro Sentiment
- Central-Bank Context
- Event Risk Guidance
- JARVIS Macro Conclusion
- Ask JARVIS
- Open in AI Analysis

### 事件范围

- CPI / Core CPI
- PPI
- NFP
- Unemployment Rate
- ADP
- Jobless Claims
- GDP
- Retail Sales
- PMI
- Consumer Confidence
- Interest Rate Decision
- FOMC / ECB / BOE / BOJ Communication
- Central-Bank Speech
- Energy Inventories

### 核心逻辑

- Event-specific Actual vs Forecast 规则。
- Higher 不一定表示利多。
- 计算事件前、事件中与事件后风险窗口。
- 将相关事件映射至受影响资产。
- Missing Macro Source 必须等同于 Unavailable Risk，而不是 Clear。

### 输出

- Surprise Direction
- Preliminary Interpretation
- Currency Sensitivity
- Asset Sensitivity
- Event Risk Level
- Main Uncertainty
- Suggested Caution

---

## 7.7 News & Events

### 目标

将实时市场新闻转化为简洁、可验证的市场影响信息。

### 页面模块

- News Data Status
- Category Filters
- Impact Filter
- Time Filter
- Top Stories
- Breaking News
- Latest News
- Selected News Detail
- Source Facts
- AI Summary
- JARVIS Interpretation
- Market Impact
- Affected Assets
- Market Sentiment
- Risk Context
- News Timeline
- Related News
- JARVIS News Conclusion
- Ask JARVIS
- Open in AI Analysis

### 新闻类别

- Forex
- Gold
- Crypto
- Stocks
- Economy
- Central Banks
- Geopolitics
- Energy
- Regulation
- AI & Technology

### 业务规则

- 必须保留来源与发布时间。
- 不复制完整版权文章。
- Breaking 只能来自数据源的真实标记。
- 同一事件的重复新闻应去重或聚类。
- Source Facts 与 AI Interpretation 必须视觉和语义分离。
- 无法验证的新闻不得计算确定方向。

---

## 7.8 Opportunity Scanner

### 目标

扫描多个市场并识别值得进一步分析的 setup，不作为直接信号服务。

### 页面模块

- Scan Status
- Run New Scan
- Category Filters
- Advanced Filters
- Opportunity Summary
- Top Opportunities
- AI Market Overview
- Opportunity Distribution
- Most Active Markets
- Best Time to Monitor
- Opportunity Heatmap
- AI Setup Preview
- Entry / SL / TP
- Score Breakdown
- Confirmation Checklist
- Risk Context
- Custom Scan
- Scan Settings
- Saved Scans
- Ask JARVIS
- Open in AI Analysis

### 筛选条件

- Asset
- Category
- Timeframe
- Bias
- Setup Type
- Setup Quality Band
- Risk Level
- Minimum RR
- Macro Risk
- News Risk
- Multi-Timeframe Alignment
- Watchlist Only

### Opportunity Score

默认总分 100：

| 评分项 | 权重 |
| --- | ---: |
| Multi-Timeframe Alignment | 20 |
| Market Structure | 20 |
| Liquidity Context | 15 |
| Volatility Suitability | 10 |
| Setup Confirmation | 15 |
| Risk / Reward Quality | 10 |
| Macro Risk | 5 |
| News Risk | 5 |

Opportunity Score 表示 setup quality，不是 win rate。

### Hard Rejection

- Required Market Data 缺失
- 数据 stale
- 无有效结构
- 无法定义失效条件
- 极端波动
- 活跃重大事件窗口
- Breaking News 风险
- 高周期严重冲突
- 不满足用户最低条件

### Entry / SL / TP

- 只能在 Verified 或允许的 Delayed K 线下生成。
- 需要明确方向、有效 ATR 与确认 swing。
- Entry 应为区域，不应只是单点。
- SL 必须对应结构失效。
- TP 应基于 RR、流动性或结构目标。
- 输出必须标为 Preliminary Planning Reference，除非进一步确认。

### 重启恢复

- 页面进入时自动检查 Latest Scan。
- 没有可恢复结果时自动执行受控扫描。
- 不将历史结果伪装为当前结果。
- 扫描结果应持久化并保存时间戳与数据状态。

---

## 7.9 Trade Planner

### 目标

将分析转换为可审查的风险计划，不连接 Broker，不执行交易。

### 输入

- Asset
- Direction
- Entry Zone
- Stop Loss
- TP1 / TP2 / TP3
- Account Balance，可由用户输入
- Risk Percentage
- Position Size 参数
- Setup Source
- Macro / News / Vision Context

### 页面模块

- Plan Header
- Asset / Direction
- Data Source Status
- Current Price
- Entry Zone
- Stop Loss
- Invalidation
- Take Profits
- RR Calculator
- Risk Amount
- Position Size
- Partial Close Plan
- Break-even Rule
- Trailing Rule
- Confirmation Checklist
- Macro / News Risk
- Alternative Scenario
- Plan Status
- Save Plan
- Duplicate / Archive
- Ask JARVIS

### 仓位计算规则

- 需要已验证 Tick Size、Contract Size、Min/Max/Step。
- 规格缺失时显示 Position Size Unavailable。
- 不对所有资产使用统一公式。
- 用户手动输入规格时必须标记 User Provided。

### Plan 状态

- Draft
- Waiting Confirmation
- Ready for User Review
- Triggered，由用户更新
- Partially Closed
- Completed
- Invalidated
- Cancelled
- Archived

系统不得自动将计划改为 Triggered 或 Completed，除非未来有明确、已批准的数据规则。

---

## 7.10 Watchlist

### 目标

集中管理用户重点关注资产和 setup。

### 模块

- Asset List
- Current Price
- Daily Change
- Bias
- Scanner Score
- Next Macro Risk
- Active News Risk
- Alert Status
- Last Analysis
- Quick Analyse

### 功能

- 添加、删除与排序资产。
- 自定义标签与备注。
- 设置关注周期。
- 关联 Scanner 结果。
- 关联 Alert。
- 关联最近计划。

---

## 7.11 Alerts Center

### 目标

提醒用户重新检查条件，不生成自动下单动作。

### Alert 类型

- Price Level Reached
- Entry Zone Approaching
- Structure Confirmation Required
- Setup Invalidated
- Macro Event Approaching
- High-Impact Window
- Breaking News
- Data Source Disconnected
- Scan Completed
- Plan Review Reminder

### 业务规则

- Alert 必须说明来源、创建时间和触发条件。
- 价格提醒需要 Verified Market Data。
- 事件提醒需要 Verified Event Time。
- 不允许触发订单。
- 支持站内通知；Email / Push 只在真实集成后显示。

---

## 7.12 Trading Journal

### 目标

记录交易决策过程、执行与情绪，支持长期改进。

### Journal 字段

- Date / Time
- Asset
- Direction
- Setup Type
- Timeframe
- Entry / SL / TP
- Risk Percentage
- Position Size
- Entry Reason
- Confirmation Evidence
- Macro Context
- News Context
- Screenshot Before / After
- Emotion Before / During / After
- Execution Notes
- Outcome
- R Multiple
- Fees / Slippage，由用户输入
- Rule Violations
- Lessons
- Linked Conversation / Analysis / Plan

### 功能

- 手动建立 Journal。
- 从 Trade Plan 建立。
- 上传交易前后截图。
- 标记遵守或违反的规则。
- JARVIS 生成简洁复盘摘要。
- 支持搜索、筛选、标签和导出。

---

## 7.13 Performance & Review

### 目标

衡量执行质量与风险纪律，不只展示 win rate。

### 指标

- Total Trades
- Win / Loss / Break-even
- Net R
- Average R
- Expectancy
- Profit Factor，仅在数据完整时
- Maximum Drawdown
- Average Risk per Trade
- Rule Adherence Rate
- Average Holding Time
- Best / Worst Setup Type
- Best / Worst Session
- Performance by Asset
- Performance by Timeframe
- Performance by Bias
- Performance by Confirmation Status
- Performance near Macro Events

### AI Review

- 常见错误
- 过度交易
- 追价倾向
- SL 过近或过远
- 风险不一致
- 事件窗口交易表现
- 最有效 setup
- 下一周期改进重点

所有统计仅基于用户输入或可靠记录，不推测缺失结果。

---

## 7.14 Playbook / Strategy Library

### 目标

将用户可重复的 setup 规则结构化。

### Playbook 字段

- Name
- Market
- Timeframes
- Bias Requirements
- Structure Requirements
- Liquidity Requirements
- Entry Trigger
- Stop Rule
- TP Rule
- Minimum RR
- Macro Restrictions
- News Restrictions
- Session Restrictions
- Invalid Conditions
- Examples
- Checklist

### 功能

- 创建、编辑、复制和归档策略。
- 将 Scanner 结果与 Playbook 规则匹配。
- 在 Trade Planner 中引用。
- 在 Journal 中记录是否符合 Playbook。
- 不自动生成或执行订单。

---

## 7.15 Risk Center

### 目标

提供全局风险规则与用户自我约束。

### 模块

- Risk Profile
- Default Risk per Trade
- Daily Risk Limit
- Weekly Risk Limit
- Maximum Concurrent Plans
- Maximum Correlated Exposure
- Event Risk Rules
- News Risk Rules
- Drawdown Guardrails
- Cooling-Off Rules
- Risk Warnings

### 风险检查

- 单笔风险是否超限。
- 多个计划是否方向相关。
- 是否集中暴露于 USD。
- 是否接近重大事件。
- 是否连续亏损或高频交易。
- 是否缺少 SL 或失效点。
- 是否使用 stale / unavailable 数据。

Beta 阶段所有账户数据由用户输入，不读取 Broker。

---

## 7.16 Data Sources & System Status

### 目标

让用户清楚知道哪些功能真实可用。

### 模块

- Overall System Status
- Market Data Provider
- News Provider
- Macro Provider
- OpenAI Text
- OpenAI Vision
- Storage
- Last Successful Update
- Freshness
- Rate Limit Status
- Known Limitations
- Retry

### 状态规则

- Configured 不等于 Connected。
- Connected 必须有成功验证记录。
- Cached 数据必须保留原始 Provider Timestamp。
- Rate Limit 时保留安全缓存并标记 delayed。
- 不展示 API Key 或内部错误。

---

## 7.17 Settings

### 模块

- General
- Language
- Timezone
- Number / Currency Format
- Default Asset
- Default Timeframe
- Scanner Defaults
- Risk Defaults
- Notification Preferences
- Data Retention
- Privacy
- Beta Account
- Export Data
- Delete Account / Data

### 语言

- 跟随用户界面或当前会话语言。
- 不同时展示中英文，除非用户要求。
- 保留资产代码与官方术语。

---

## 7.18 Feedback & Support

### 模块

- Bug Report
- Incorrect Data Report
- AI Response Feedback
- Feature Request
- Screenshot Attachment
- Current Page / Request ID
- Severity

### 规则

- 不自动附带 API Key、Prompt 或敏感数据。
- 用户确认后才提交截图。
- Feedback 必须绑定版本、时间与安全 Request ID。

---

## 8. AI 系统要求

## 8.1 Intent Engine

必须识别：

- Asset
- Timeframe
- Language
- User Intent
- Follow-up Context
- Risk Intent
- Whether tools are required
- Whether clarification is required

## 8.2 Tool Orchestration

可用工具：

- Market Quote
- Market Candles
- Symbol Metadata
- Technical Analysis
- Scanner
- Macro Events
- Macro Summary
- News Search
- News Summary
- Vision Observation
- Trade Plan Validation
- Risk Validation
- Journal Lookup
- Playbook Lookup

规则：

- 只调用解决问题所需的工具。
- 防止重复调用与无限循环。
- Tool Output 视为不可信数据并验证。
- Provider 失败时不得回退成未标记 Mock。
- 记录安全的 usage metadata。

## 8.3 Structured Output

所有核心 AI 回答必须使用稳定 schema，至少包含：

- intent
- asset
- timeframe
- language
- summary
- marketBias
- confidence
- evidence
- tradePlan
- macroContext
- newsContext
- riskContext
- missingInformation
- nextStep
- dataSources
- dataQuality

## 8.4 Confidence

置信度必须考虑：

- Data completeness
- Data freshness
- Multi-timeframe alignment
- Structure clarity
- Macro availability
- News availability
- Vision quality
- Context conflicts

缺少关键数据时使用 Preliminary Confidence 或 Insufficient Data。

## 8.5 Explainability

JARVIS 必须提供简洁用户可见 reasoning summary，但不得暴露隐藏 Chain-of-Thought。

解释应覆盖：

- Trend
- Structure
- Liquidity
- Volatility
- Macro
- News
- Risk
- Confirmation

---

## 9. 数据模型

### 9.1 User

- id
- email
- role
- betaStatus
- timezone
- language
- preferences
- createdAt
- updatedAt

### 9.2 Conversation

- id
- ownerId
- title
- asset
- timeframe
- language
- context
- messages
- providerState
- createdAt
- updatedAt

### 9.3 Analysis

- id
- ownerId
- asset
- timeframe
- source
- marketTimestamp
- technicalContext
- macroContext
- newsContext
- visionContext
- conclusion
- dataQuality
- createdAt

### 9.4 ScannerResult

- id
- ownerId
- scanId
- criteria
- asset
- timeframe
- score
- components
- tradePlan
- risk
- dataQuality
- marketTimestamp
- createdAt

### 9.5 TradePlan

- id
- ownerId
- sourceIds
- asset
- direction
- entryZone
- stopLoss
- takeProfits
- riskReward
- riskAmount
- positionSize
- confirmationChecklist
- status
- createdAt
- updatedAt

### 9.6 VisionUpload

- id
- ownerId
- contentHash
- mimeType
- dimensions
- storageReference
- expiresAt
- deletedAt

### 9.7 VisionAnalysis

- id
- ownerId
- uploadId
- observations
- confidence
- uncertainty
- marketValidation
- dataQuality
- createdAt

### 9.8 JournalEntry

- id
- ownerId
- planId
- analysisId
- executionData
- outcome
- emotions
- ruleAdherence
- lessons
- attachments
- createdAt
- updatedAt

### 9.9 Alert

- id
- ownerId
- type
- asset
- condition
- status
- source
- triggeredAt
- acknowledgedAt

---

## 10. 持久化要求

必须持久保存：

- Users
- Beta Sessions
- Conversations
- Analyses
- Scanner Criteria
- Scanner Results 与时间戳
- Trade Plans
- Watchlists
- Alerts
- Journal Entries
- Playbooks
- Feedback
- Vision Metadata
- Vision Analysis

图片原始文件可使用受控对象存储或短期存储；数据库只保存安全 metadata 与 ownership。

### 重启要求

- 服务重启后用户会话按策略恢复或安全失效。
- Conversation History 不丢失。
- Scanner 历史必须标记 Historical，不伪装为 Current。
- Upload retention 与删除状态必须保留。
- Rate Limit 可在单实例阶段内存实现，但 Public V1 应使用共享存储。

---

## 11. 加载、空状态与错误状态

### 加载状态

- 保留旧数据直到新结果准备完成。
- 显示正在执行的安全阶段。
- 禁止虚假百分比。
- 防止重复刷新、扫描与提交。

### 空状态

- 无 Conversation：显示建议问题。
- 无 Scan：自动检查 Latest，再提供 Run Scan。
- 无 Macro Event：显示调整日期与 Reset Filters。
- 无 News：显示 Refresh 与数据源状态。
- 无 Watchlist：提供 Add Asset。
- 无 Journal：提供 Create Entry 或 Import from Plan。

### 错误状态

- Provider Not Configured
- Authentication Failed
- Rate Limited
- Timeout
- Invalid Response
- Stale Data
- Unsupported Symbol
- Unsupported Timeframe
- Storage Unavailable
- Session Expired
- Ownership Denied

错误必须提供安全消息、Retry 和 Request ID，不暴露 Stack Trace 或密钥。

---

## 12. 移动端要求

- 与 Desktop 使用相同信息层级与业务逻辑。
- 重要模块按页面顺序纵向堆叠。
- 表格转换为可读卡片。
- Filter 使用横向滚动、Drawer 或 Bottom Sheet。
- 固定底部导航不得遮挡内容。
- Entry、SL、TP、Risk 与 Data Status 不得因移动端被删除。
- 所有触控目标至少约 44px。
- 不允许页面级横向溢出。
- 上传支持相册与相机。
- 长图表可缩放查看。
- 长列表使用分页或渐进加载。

---

## 13. 非功能需求

### 性能

- 首屏应快速展示 Shell 与可用缓存。
- Provider 请求需要缓存与 in-flight deduplication。
- Scanner 使用受控并发。
- 不重复加载完整新闻内容。
- 图片上传与分析不得阻塞整个应用。

### 安全

- Secrets 仅存在服务端环境变量。
- 所有输入进行 allowlist 与长度验证。
- 所有数据访问执行 ownership check。
- 防止 Prompt Injection、SSRF、XSS 与路径注入。
- 上传进行文件签名、大小与像素验证。
- 日志自动脱敏。
- CORS 使用 allowlist。
- 请求体、速率与并发限制可配置。

### 可访问性

- 完整键盘导航。
- 明确 Focus State。
- 状态不只依赖颜色。
- Loading / Error 使用可访问 announcement。
- 图表提供文字摘要。
- 表单具有标签与错误关联。

### 可观察性

- Request ID
- Provider error category
- Latency
- Cache hit / miss
- Rate limit
- Token usage
- Scan duration
- Data freshness
- Safe audit log

不得记录 API Key、完整敏感 Prompt、图片路径或用户隐私内容。

---

## 14. Provider 与依赖

| 能力 | Beta Provider / 状态 | 产品要求 |
| --- | --- | --- |
| Market Data | Twelve Data | Quote、OHLC、Metadata、Freshness |
| News | MarketAux | Source、Timestamp、Article Metadata |
| Macro | 待选择 Live Provider | Calendar、Previous、Forecast、Actual |
| AI Text | OpenAI Responses API | Structured Output、Tool Calling |
| Vision | OpenAI image-capable model | Server validated bytes、Structured Observation |
| Storage | 待配置 Persistent Store | Ownership、Retention、Restart Recovery |

任何 Provider 未连接时必须进入明确的 Demo 或 Unavailable 状态。

---

## 15. 产品边界

Beta 与 V1 永久不支持：

- MT5 连接
- Broker 连接
- 账户余额读取
- 持仓读取
- 历史订单读取
- 自动下单
- 自动改单
- 自动平仓
- Copy Trading
- Custody
- Deposit / Withdrawal
- 保证收益

Trade Planner 只使用：

- 用户输入
- Verified Market Data
- Scanner Output
- Macro Context
- News Context
- Vision Observations
- Deterministic Risk Rules

---

## 16. 事件追踪与产品指标

### 核心事件

- login_success
- login_failed
- question_submitted
- analysis_requested
- analysis_completed
- provider_failed
- chart_uploaded
- vision_completed
- scan_started
- scan_completed
- opportunity_opened
- plan_created
- plan_updated
- journal_created
- alert_created
- feedback_submitted

### 产品指标

- Weekly Active Beta Users
- Questions per User
- Analysis Completion Rate
- Scanner to Analysis Conversion
- Analysis to Plan Conversion
- Plan to Journal Conversion
- Follow-up Question Rate
- Provider Failure Rate
- Average Response Time
- Data Unavailable Rate
- User Feedback Score
- Rule Adherence Improvement

不将交易盈利作为唯一产品成功指标。

---

## 17. 版本范围

### Closed Beta 必须完成

- Beta Access
- Workspace
- Ask JARVIS
- AI Analysis
- Upload Chart
- Opportunity Scanner
- Trade Planner
- Market Data Live
- News Live
- 诚实的 Macro / Vision 状态
- 安全错误与状态
- 基础持久化
- Feedback

### Public V1 必须完成

- OpenAI Text Live 稳定
- Vision Live 稳定
- Macro Live
- Persistent Database
- Conversation / Plan / Journal 持久化
- Watchlist
- Alerts
- Risk Center
- Performance Review
- 完整 Audit 与 Observability
- 数据导出与删除

### V1 后候选

- Playbook 匹配增强
- 团队协作
- 分享只读分析
- 高级 Journal Analytics
- 多 Provider 容灾
- 自定义指标与策略规则

仍不包含 Broker 或自动交易。

---

## 18. 核心验收标准

### 功能

- 用户可以自然语言提问并连续追问。
- AI Analysis 使用 Verified Market Data。
- Scanner 可扫描支持资产并解释评分。
- 有效结构可生成 Preliminary Entry、SL、TP 与 RR。
- 无效结构不会生成伪造计划。
- News 显示真实来源与时间。
- Macro 在无 Provider 时诚实显示 Unavailable / Demo。
- Vision 在无额度时诚实显示不可用，不回退伪 Live。
- Trade Planner 不执行交易。
- 重启后关键数据可恢复。

### 安全

- Frontend 不包含 Provider Secret。
- 所有用户数据有 ownership check。
- 上传文件经过验证。
- Prompt Injection 不改变系统安全规则。
- Provider Raw Error 不返回客户端。
- 不存在 MT5、Broker 或 Execution Route。

### 响应式

- Desktop 与 Mobile 信息顺序一致。
- 无页面级横向溢出。
- 核心操作可触控。
- 长标题、价位和错误消息不会重叠。
- 关键风险与数据状态在移动端可见。

### 数据质量

- Demo 永不显示为 Live。
- Stale 永不显示为 Current。
- Missing Value 永不变成 0。
- Opportunity Score 永不称为 Win Rate。
- Vision Observation 未验证前不能成为 executable level。

---

## 19. Stitch 原型输入建议

后续生成原型时，应优先表达以下产品关系，而非先决定视觉风格：

- Workspace 是所有交易工作流入口。
- Ask JARVIS 是跨模块的对话层。
- AI Analysis 是单资产深度分析层。
- Scanner 是多资产发现层。
- Macro 与 News 是风险上下文层。
- Upload Chart 是视觉输入层。
- Trade Planner 是决策整理层。
- Journal 与 Performance 是闭环复盘层。
- Risk Center 是全局约束层。
- System Status 是数据可信度层。

原型必须覆盖：

- Desktop 主流程
- Mobile 主流程
- 正常状态
- Loading
- Empty
- Demo
- Disconnected
- Delayed / Stale
- Error / Retry
- Partial Data
- Permission / Session Expired

---

## 20. 最终产品闭环

JARVIS 的完整产品闭环为：

**Observe → Understand → Compare → Plan → Validate Risk → Decide → Record → Review → Improve**

对应功能：

**Market / Macro / News / Vision → AI Analysis → Opportunity Scanner → Trade Planner → Risk Center → User Decision → Journal → Performance Review → Playbook Improvement**

这一闭环是后续所有页面、原型和工程任务的统一产品主线。
