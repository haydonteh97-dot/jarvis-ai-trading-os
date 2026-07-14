# Vision Intelligence Foundation (API-006A)

API-006A provides the provider-agnostic image validation and chart-context boundary. API-006B adds an OpenAI Responses API image-input adapter without changing the Core Agent or any approved page layout. OCR remains disconnected. MT5 is not connected, and broker execution and automatic trading are not supported. These are permanent product boundaries for Beta and V1, not future sprint items.

## Environment

```env
VISION_PROVIDER=
VISION_MODE=mock
VISION_MAX_FILE_SIZE=10485760
VISION_ALLOWED_TYPES=image/png,image/jpeg,image/webp
VISION_TIMEOUT=15000
VISION_ENABLE_OCR=false
OPENAI_VISION_MODEL=
OPENAI_VISION_DETAIL=high
OPENAI_VISION_MAX_OUTPUT_TOKENS=2400
```

`mock` validates image files and returns `dataStatus: demo`. It preserves explicit user hints but never infers trend, market structure, indicators, prices, Entry, SL, or TP. Live analysis requires `VISION_PROVIDER=openai`, `VISION_MODE=live`, the server-side `OPENAI_API_KEY`, and an explicit image-capable `OPENAI_VISION_MODEL`. No model fallback is used.

The live adapter sends only server-validated PNG, JPEG or WEBP bytes as a Base64 data URL. It never accepts a remote image URL from the browser and never sends local paths, storage credentials, unrelated user data, Core Agent prompts or API keys. Structured output is constrained by JSON Schema and validated again locally. Provider observations remain preliminary; visible image prices remain observations until market-data verification or explicit user confirmation. Executable Entry, SL, TP, RR, position size, scanner score and execution state are excluded from the provider schema.

## Routes

- `GET /api/vision/status`
- `POST /api/vision/uploads` using multipart fields `file`, optional `asset`, `timeframe`, `platform`
- `GET /api/vision/uploads/:id`
- `POST /api/vision/uploads/:id/analyse`
- `GET /api/vision/uploads/:id/context?target=ask-jarvis|ai-analysis|trade-planner`

Uploaded image bytes are validated, hashed and held in owner-scoped temporary memory until deletion or expiry. The OpenAI adapter reads those private bytes through the existing storage boundary without exposing a public path. Page components and internal route contracts remain unchanged.

## Chart Observation Engine

API-006A Part 2 adds deterministic, provider-agnostic observation contracts. Vision observations are supplementary and use these rules:

- Vision observes; Market Data verifies; engines calculate; the Core Agent explains; the user decides.
- Strong BOS requires a prior visible swing, a visible close beyond it, and evidence.
- MSS requires visible prior structure, an opposite structural break, a swing reference, and evidence.
- FVG requires a visible three-candle imbalance pattern.
- Order Block requires a visible origin candle, displacement, and later reaction.
- Premium/Discount requires a valid dealing range.
- Exact prices remain `null` unless the price scale is readable and the values pass validation; image levels remain unverified.
- Image text and future OCR output are untrusted and cannot change system rules or verification status.

Observation routes:

- `POST /api/vision/analysis`
- `GET /api/vision/analysis/:analysisId`
- `GET /api/vision/analysis/:analysisId/observations`
- `POST /api/vision/analysis/:analysisId/verify`

Demo fixtures are fixed, non-current examples and must be requested explicitly. Ordinary uploads produce no pixel-derived observations while no live Vision provider is connected.

## Part 3: secure lifecycle

The completed API-006A Foundation uses `MemoryVisionImageStorage`, a replaceable temporary-storage adapter that works in both Node tests and the current server runtime without writing uploads into public or source directories.

Upload flow:

1. Require a valid JARVIS session boundary.
2. Validate multipart content type, request size, and a one-file limit.
3. Validate extension, declared MIME, file signature, static-image status, structural integrity, dimensions, and pixel count.
4. Sanitize the original filename for metadata only; an internal UUID controls storage.
5. Hash bytes with SHA-256 and deduplicate only inside the same owner boundary.
6. Store bytes temporarily in memory and persist a safe metadata record.
7. Produce a Demo observation contract, optionally cross-check market-data availability, and persist only structured output.

Default limits are 10 MB, 480x320 minimum, 10000x10000 maximum, and 40 million pixels. PNG chunks and CRCs are checked, JPEG requires structural image and scan markers, and WEBP validates its RIFF container and rejects animation. GIF, SVG, PDF, executable, script, HTML, mismatched, malformed, and suspicious double-extension uploads are rejected before provider use.

Storage lifecycle is `uploading -> validated -> temporary -> analysis_ready -> deletion_pending -> deleted`. Originals expire after 24 hours by default. Structured analyses expire after 30 days. No retention consent UI exists, so `retained_with_consent` is never selected. Deletion uses the full-privacy policy: bytes, upload cache, and related analysis records are invalidated. The callable `cleanupExpired()` service performs expiry cleanup; no uncontrolled scheduler was added.

All image read, analysis, handoff, verification, and deletion operations require the same `x-jarvis-session-id`. The current project has no server-side identity provider, so this is a session-isolation foundation rather than production-grade authentication. A future deployment should bind the owner ID to verified authentication and replace the memory adapter with durable private object storage. Process restart currently removes temporary images and analyses.

No raw image, local path, image hash, provider payload, OCR output, hidden prompt, API key, or broker information is returned. Browser previews use revocable `blob:` URLs. Mock mode is always `Demo`; no external Vision or OCR request occurs.
