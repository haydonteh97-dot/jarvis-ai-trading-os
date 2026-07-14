import { AIModelProvider } from "./provider.js";
export class MockAIModelProvider extends AIModelProvider {
  get name() { return "MockAIModelProvider"; }
  getProviderStatus() { return { status: "demo", provider: this.name, mode: "mock", configured: true, message: "JARVIS Foundation is ready in Demo AI mode." }; }
  validateConfiguration() { return { valid: true }; }
  async createResponse(request) {
    const zh = request.language === "zh"; const available = request.toolResults.filter((item) => item.success && item.meta.dataStatus !== "unavailable"); const missing = request.toolResults.filter((item) => !item.success || item.meta.dataStatus === "unavailable").map((item) => item.tool);
    const quote = request.toolResults.find((item) => item.tool === "market.getQuote" && item.success)?.data; const scanner = request.toolResults.find((item) => item.tool === "scanner.getOpportunity" && item.success)?.data;
    const bias = scanner?.bias ? String(scanner.bias).toLowerCase() : null; const decisionStatus = request.prohibited ? "Source Unavailable" : missing.length ? "Data Required" : bias ? "Confirmation Required" : "Monitor";
    const current = quote?.last != null && quote?.timestamp ? (zh ? `${quote.symbol} 当前已验证报价为 ${quote.last}，时间 ${quote.timestamp}。` : `${quote.symbol} verified quote is ${quote.last} at ${quote.timestamp}.`) : (zh ? "当前没有足够的已验证市场资料。" : "Verified market context is currently insufficient.");
    return { headline: request.prohibited ? (zh ? "不支持交易执行" : "Execution Is Not Available") : bias ? `${bias[0].toUpperCase()}${bias.slice(1)} — Confirmation Required` : (zh ? "资料状态 — 需要确认" : "Data Status — Confirmation Required"), summary: request.prohibited ? (zh ? "JARVIS 只能提供分析与风险支持，不能代你下单。" : "JARVIS can provide analysis and risk support but cannot place trades.") : current, marketBias: bias, decisionStatus, mainFactors: available.map((item) => `${item.tool}: ${item.meta.dataStatus}`).slice(0, 4), mainRisks: missing.map((item) => `${item} unavailable`).slice(0, 4), nextConfirmation: missing.length ? (zh ? "补充缺失资料后重新评估。" : "Reassess after the missing data is available.") : (zh ? "等待结构确认。" : "Wait for structure confirmation."), riskWarning: zh ? "最终交易决定由你作出。" : "The final trading decision remains with you." };
  }
}
