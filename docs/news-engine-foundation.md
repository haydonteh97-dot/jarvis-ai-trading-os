# News Intelligence Engine Foundation (API-004A)

The News Intelligence layer supports provider-independent Demo mode and a server-side MarketAux live adapter.

## Configuration

```env
NEWS_DATA_PROVIDER=marketaux
NEWS_DATA_MODE=mock
NEWS_DATA_API_KEY=
NEWS_DATA_API_SECRET=
NEWS_DATA_BASE_URL=https://api.marketaux.com/v1
```

Mock mode returns fixed, non-current demonstration scenarios from `MockNewsDataProvider`. Live mode supports MarketAux when `NEWS_DATA_PROVIDER=marketaux` and a server-side `NEWS_DATA_API_KEY` is configured. MarketAux uses the token as an outbound query parameter; it is never returned to the frontend or logged. Live mode never silently falls back to Demo.

## Routes

- `GET /api/news/status`
- `GET /api/news/articles`
- `GET /api/news/articles/:articleId`
- `GET /api/news/top-stories`
- `GET /api/news/breaking`
- `GET /api/news/summary`

## Deterministic rules

- Top Story score: impact up to 40, verification up to 25, developing status 10, selected-category relevance 15, affected-asset breadth up to 10.
- Breaking requires an explicit provider flag, high impact, configured recency, and a meaningful non-duplicate item. Mock fixtures are fixed historical scenarios and are never Breaking.
- Deduplication prefers canonical URL, then provider ID, then normalized headline/source/publication window.
- Story clusters use shared named entities, with normalized headline fallback.
- Template summaries use source summary, category, and data-status facts only.
- Interpretation exposes market mechanism, affected assets, uncertainty, and confirmation requirement without Buy/Sell language.
- Demo or unavailable news gives Scanner score `0`; Trade Planner receives `Demo` or `Source Unavailable` rather than `Clear`.
