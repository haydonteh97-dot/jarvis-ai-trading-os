export class MarketDataProvider {
  get name() {
    throw new Error("MarketDataProvider.name must be implemented");
  }

  async getQuote() {
    throw new Error("getQuote must be implemented");
  }

  async getCandles() {
    throw new Error("getCandles must be implemented");
  }

  getSupportedSymbols() {
    throw new Error("getSupportedSymbols must be implemented");
  }

  getSymbolMetadata() {
    throw new Error("getSymbolMetadata must be implemented");
  }

  getProviderStatus() {
    throw new Error("getProviderStatus must be implemented");
  }

  normaliseSymbol() {
    throw new Error("normaliseSymbol must be implemented");
  }

  mapTimeframe() {
    throw new Error("mapTimeframe must be implemented");
  }
}
