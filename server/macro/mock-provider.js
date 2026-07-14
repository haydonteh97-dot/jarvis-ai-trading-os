import { MacroDataProvider } from "./provider.js";
import { normaliseMacroEvent } from "./normalizers.js";

const DEMO_EVENTS = [
  { id: "demo-us-inflation-released", title: "Sample Core Inflation Release", country: "United States", currency: "USD", category: "inflation", impact: "high", scheduledAt: null, previous: 3.3, forecast: 3.2, actual: 3.1, unit: "%", releaseStatus: "released", dateRange: "Today" },
  { id: "demo-us-employment-upcoming", title: "Sample Employment Report", country: "United States", currency: "USD", category: "employment", impact: "high", scheduledAt: null, previous: null, forecast: null, actual: null, releaseStatus: "upcoming", dateRange: "Today" },
  { id: "demo-eu-growth-upcoming", title: "Sample Growth Survey", country: "Euro Area", currency: "EUR", category: "growth", impact: "medium", scheduledAt: null, previous: null, forecast: null, actual: null, releaseStatus: "upcoming", dateRange: "Tomorrow" },
  { id: "demo-jp-central-bank", title: "Sample Central-Bank Decision", country: "Japan", currency: "JPY", category: "central_bank", impact: "high", scheduledAt: null, previous: null, forecast: null, actual: null, releaseStatus: "upcoming", dateRange: "This Week" },
].map((event) => normaliseMacroEvent(event, { timezone: "UTC", source: "MockMacroProvider", verificationStatus: "demo", dataStatus: "demo", lastUpdated: null }));

export class MockMacroProvider extends MacroDataProvider {
  get name() { return "MockMacroProvider"; }
  getProviderStatus() { return { status: "demo", provider: this.name, configured: true, dataStatus: "demo", lastSuccessfulUpdate: null, message: "Demo macro data is active." }; }
  getSupportedCountries() { return ["United States", "Euro Area", "Japan"]; }
  getSupportedCurrencies() { return ["USD", "EUR", "JPY"]; }
  getSupportedCategories() { return ["inflation", "employment", "growth", "central_bank"]; }
  async getEvents() { return DEMO_EVENTS.map((event) => ({ ...event })); }
  async getEventById(eventId) { return (await this.getEvents()).find((event) => event.id === eventId) || null; }
}
