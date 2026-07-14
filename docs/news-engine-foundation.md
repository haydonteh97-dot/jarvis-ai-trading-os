# News Intelligence Engine Foundation (API-004A)

API-004A adds a provider-independent News Intelligence layer. No live or paid provider is connected.

## Configuration

```env
NEWS_DATA_PROVIDER=
NEWS_DATA_MODE=mock
NEWS_DATA_API_KEY=
NEWS_DATA_API_SECRET=
NEWS_DATA_BASE_URL=
```

Mock mode returns fixed, non-current demonstration scenarios from `MockNewsDataProvider`. Live mode uses the placeholder `LiveNewsDataProvider` and returns `NEWS_DATA_NOT_CONFIGURED`; it never silently falls back to Demo.

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
