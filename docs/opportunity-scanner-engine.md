# Opportunity Scanner Engine

The production scanner uses the shared market-data service and never reads provider data directly from the browser.

## Required inputs

- D1, H4 and H1 candles are required for every symbol.
- M15 is optional and is requested only for a single-symbol scan.
- A symbol is classified exactly once as completed, partial or unavailable.
- Macro, News and Risk/Reward are not connected in API-002 and contribute zero points.

## Deterministic indicators

- EMA 20, EMA 50 and EMA 200
- ATR 14
- ADX 14
- Confirmed two-candle swing pivots
- Breakout, pullback, range and liquidity-context approximations derived from closed candles

## Opportunity Score

| Component | Maximum |
| --- | ---: |
| Multi-timeframe trend alignment | 20 |
| Market structure | 20 |
| Liquidity context | 15 |
| Volatility suitability | 10 |
| Setup confirmation | 15 |
| Risk/Reward | 10 |
| Macro risk | 5 |
| News risk | 5 |

The practical technical-only maximum is 90 because RR, Macro and News are unavailable. Delayed data receives a 10-point data-quality penalty. Stale, demo, insufficient or structurally invalid input is hard-rejected and scores zero.

Quality bands are High 75-100, Medium 50-74 and Low 1-49. They describe model-derived setup quality, not win rate.

## API

- `POST /api/scanner/run`
- `GET /api/scanner/status?scanId=...`
- `GET /api/scanner/results?scanId=...`
- `GET /api/scanner/latest`

The scanner caches identical results for 30 seconds, reuses the market-data cache, prevents duplicate active scans and stops new provider requests after a rate-limit response. Completed results are preserved when later symbols fail.
