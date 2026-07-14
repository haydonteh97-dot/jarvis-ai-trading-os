# Macro Intelligence Engine Foundation (API-003A)

API-003A provides a provider-agnostic macro-data engine. It intentionally does not connect a live provider.

## Configuration

```env
MACRO_DATA_PROVIDER=
MACRO_DATA_MODE=mock
MACRO_DATA_API_KEY=
MACRO_DATA_BASE_URL=
```

`mock` returns clearly labelled Demo data from `MockMacroProvider`. `live` uses the non-operational `LiveMacroDataProvider` interface and returns `MACRO_DATA_NOT_CONFIGURED`; it never silently falls back to Demo.

## Routes

- `GET /api/macro/status`
- `GET /api/macro/events`
- `GET /api/macro/event/:id`
- `GET /api/macro/summary`

All routes return the existing internal response envelope with safe errors. Events preserve unavailable values as `null`.

## Architecture

- `provider.js`: provider contract and live-provider placeholder
- `mock-provider.js`: fixed, non-current Demo fixtures
- `model.js`, `validation.js`, `normalizers.js`: canonical event contract
- `cache.js`: TTL cache and in-flight request deduplication
- `timezone.js`: timezone validation and display conversion
- `interpretation.js`: deterministic event-specific interpretation
- `risk.js`, `sentiment.js`: conservative risk and macro context
- `integrations.js`: read-only Scanner, AI Analysis, Trade Planner, and Ask JARVIS context adapters
- `service.js`, `router.js`: engine orchestration and API transport

Demo macro context is always treated as unavailable by Scanner and Trade Planner. A future provider should extend `MacroDataProvider`, normalize its events, and be selected by configuration.
