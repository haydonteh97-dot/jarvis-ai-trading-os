import { VisionProvider } from "./provider.js";
export class MockVisionProvider extends VisionProvider {
  get name() { return "MockVisionProvider"; }
  getStatus() { return { status: "demo", provider: this.name, configured: true, dataStatus: "demo", message: "Vision foundation is running in Demo mode. Live image analysis is not connected." }; }
  async inspectImage(input) { return input; }
  async extractChartContext(upload) { return upload.chartContext; }
  async analyseChart(upload) {
    return { uploadId: upload.id, imageStatus: upload.imageStatus, chartContext: upload.chartContext, detectedValues: null, imageQuality: upload.imageQuality, confidence: 0, unknownFields: upload.unknownFields, warnings: upload.warnings, analysisStatus: "unavailable", message: "Live vision provider not connected. No chart structure or price levels were generated.", provider: this.name, dataStatus: "demo" };
  }
}
