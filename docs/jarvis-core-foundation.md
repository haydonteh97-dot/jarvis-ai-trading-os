# JARVIS Core AI Brain Foundation (API-005A)

API-005A implements one Core Orchestrator coordinating deterministic read-only tools. It is not a multi-agent system and does not connect OpenAI or any live AI provider.

## Configuration

```env
AI_PROVIDER=
AI_MODE=mock
AI_API_KEY=
AI_BASE_URL=
AI_MODEL=
AI_TIMEOUT_MS=9000
AI_MAX_OUTPUT_TOKENS=1200
```

`MockAIModelProvider` composes only supplied tool results and clearly reports Demo mode. API-005B adds `OpenAIResponsesProvider` behind the same provider boundary. Live mode never silently falls back to Mock.

The single `JarvisCoreOrchestrator` remains authoritative for intent, entity resolution, deterministic tool allowlisting, context and final response wrapping. OpenAI coordinates only the tools selected by the existing deterministic planner. Engines remain authoritative for all numeric values.

## Routes

- `GET /api/jarvis/status`
- `GET /api/jarvis/tools`
- `POST /api/jarvis/conversations`
- `GET /api/jarvis/conversations/:conversationId`
- `POST /api/jarvis/message`

## Safety

- Only allowlisted read tools can be registered.
- Frontend callers cannot invoke tools by name.
- MT5 is not connected. Broker execution and automatic trading are not supported. These are permanent product boundaries for Beta and V1, not future sprint items. Broker, execution, deposit and withdrawal operations remain absent and blocked.
- Tool output is untrusted, sanitized and cannot change permissions or system rules.
- Responses preserve source, timestamp, freshness and data status.
- Demo, stale and unavailable data lower overall data quality.
- No hidden chain-of-thought, prompts or provider secrets are returned.
