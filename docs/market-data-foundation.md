# JARVIS Market Data Foundation

## Provider modes

Production uses Twelve Data through server-side API routes. Browser code never calls Twelve Data directly and never receives the API key.

Required runtime variables:

```dotenv
MARKET_DATA_PROVIDER=twelvedata
MARKET_DATA_MODE=live
TWELVE_DATA_API_KEY=
TWELVE_DATA_BASE_URL=https://api.twelvedata.com
```

If `MARKET_DATA_MODE=live` and `TWELVE_DATA_API_KEY` is empty, every protected market request returns `MARKET_DATA_NOT_CONFIGURED`. The UI must show Market Data Source Not Connected.

For deterministic development fixtures, set `MARKET_DATA_MODE=mock`. Mock responses are always labelled `demo` and use a fixed historical timestamp. Live mode never falls back to mock or Yahoo Finance.

## Supported markets

| Internal | Twelve Data | Class | Timeframes |
| --- | --- | --- | --- |
| XAUUSD | XAU/USD | Metal | D1, H4, H1, M30, M15, M5 |
| EURUSD | EUR/USD | Forex | D1, H4, H1, M30, M15, M5 |
| GBPUSD | GBP/USD | Forex | D1, H4, H1, M30, M15, M5 |
| USDJPY | USD/JPY | Forex | D1, H4, H1, M30, M15, M5 |
| BTCUSD | BTC/USD | Crypto | D1, H4, H1, M30, M15, M5 |

Twelve Data account entitlements are validated at runtime. An unsupported or plan-restricted response remains unavailable; no substitute instrument is used.

## Routes

- `GET /api/market/status`
- `GET /api/market/symbols`
- `GET /api/market/quote?symbol=XAUUSD`
- `GET /api/market/candles?symbol=XAUUSD&timeframe=H1&limit=300`

All routes use the same `{ success, data, meta, error }` envelope. Provider errors are converted to stable JARVIS error codes. Raw payloads, credentials, internal paths, and stack traces are not returned.

## Caching and freshness

Quotes are cached for 15 seconds. Candle cache duration is 30 seconds for M5, 60 seconds for M15, 2 minutes for M30, 5 minutes for H1, 15 minutes for H4, and 30 minutes for D1. Cache keys include provider, request type, symbol, timeframe, and limit. Identical in-flight requests share one provider call.

Freshness uses the original provider timestamp. Serving cached data never changes it. Quote and candle responses are classified as current, delayed, stale, or unavailable; delayed and stale data are never labelled verified/current.

## Legacy Yahoo proxy

`jarvis-mvp/live-data-proxy.mjs` and `jarvis-mvp/site-server.mjs` contain the previous anonymous Yahoo Finance quote prototype. They are retained only as legacy local references. Production market routes do not import, call, or silently fall back to them, and Yahoo responses are never classified as verified production data.

## Trade Planner limitation

Twelve Data is a market-data source, not a broker contract-specification source. Until tick size, contract size, minimum size, maximum size, and size step are verified from an appropriate source or explicitly entered by the user, JARVIS must show:

`Position size unavailable — verified symbol specification required.`
