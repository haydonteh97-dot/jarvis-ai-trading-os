export class VisionProvider {
  get name() { return "VisionProvider"; }
  getStatus() { throw new Error("getStatus() must be implemented"); }
  async inspectImage() { throw new Error("inspectImage() must be implemented"); }
  async extractChartContext() { throw new Error("extractChartContext() must be implemented"); }
  async analyseChart() { throw new Error("analyseChart() must be implemented"); }
}

export class LiveVisionProvider extends VisionProvider {
  get name() { return "LiveVisionProvider"; }
  getStatus() {
    return { status: "disconnected", provider: null, configured: false, dataStatus: "unavailable", message: "Live vision provider not connected." };
  }
  async inspectImage() { const error = new Error("Live vision provider not connected."); error.code = "VISION_PROVIDER_NOT_CONFIGURED"; throw error; }
  async extractChartContext() { const error = new Error("Live vision provider not connected."); error.code = "VISION_PROVIDER_NOT_CONFIGURED"; throw error; }
  async analyseChart() { const error = new Error("Live vision provider not connected."); error.code = "VISION_PROVIDER_NOT_CONFIGURED"; throw error; }
}
