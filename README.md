# APEX JARVIS V2

Static deployment source for the JARVIS V2 premium AI Trading Operating System UI.

The approved UI remains demo-safe by default. Server-side provider layers support Twelve Data market data and the OpenAI Responses API when runtime credentials and modes are configured. Deterministic Mock modes remain available for development. MT5 is not connected. Broker execution and automatic trading are not supported. These are permanent product boundaries for Beta and V1, not future sprint items.

See `docs/market-data-foundation.md`, `docs/jarvis-openai-provider.md` and `.env.example` for setup and data-honesty rules.
# Vision Intelligence Foundation

API-006A runs in `VISION_MODE=mock` and requires no API key. See `docs/vision-foundation.md` for the routes, limits, and provider boundary. Live chart vision and OCR are intentionally not connected.
