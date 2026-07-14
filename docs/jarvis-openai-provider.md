# JARVIS OpenAI Responses Provider (API-005B)

## Architecture

One `JarvisCoreOrchestrator` uses either `MockAIModelProvider` or `OpenAIResponsesProvider`. There are no subagents. The deterministic planner limits which read-only tools OpenAI can call for each turn. Tool names and arguments are converted to strict allowlisted function schemas, validated server-side, executed by the existing `ToolRegistry`, sanitised, size-limited and submitted to the same Responses API flow.

The final model output uses the existing JARVIS answer contract as a strict JSON Schema. Conversation continuity primarily uses `previous_response_id` when response storage is enabled. Core instructions are resent every turn. No hidden reasoning is stored or returned.

## Environment

```env
AI_PROVIDER=openai
AI_MODE=live
OPENAI_API_KEY=
OPENAI_MODEL=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_STORE_RESPONSES=true
OPENAI_MAX_OUTPUT_TOKENS=1200
OPENAI_MAX_TOOL_CALLS=6
OPENAI_MAX_ITERATIONS=4
OPENAI_REQUEST_TIMEOUT_MS=20000
OPENAI_REASONING_EFFORT=low
OPENAI_STREAMING_ENABLED=false
OPENAI_MAX_TOOL_RESULT_BYTES=24000
OPENAI_REQUESTS_PER_MINUTE=12
OPENAI_MAX_CONVERSATION_REQUESTS=100
```

The Beta default for `OPENAI_STORE_RESPONSES` is `true` so `previous_response_id` can provide provider-side continuity. This permits OpenAI response storage according to the account's API data controls and retention terms; it must not be described as zero retention. Set it deliberately for the deployment's privacy requirements.

## Controls

- Maximum tool calls and iterations are bounded independently.
- The same tool with identical arguments may run once per turn.
- Tool output has a byte limit and never includes credentials or raw provider secrets.
- OpenAI requests are limited per privacy-safe user identifier and per conversation.
- One bounded retry is allowed for transient failures; authentication, model, permission and request errors are not retried.
- Usage captures input, output, cached input, reasoning-token counts when reported, model, response ID, duration and tool-call count. Monetary cost is not calculated.
- Streaming configuration is recognised, but the strict final result remains non-streamed. Existing UI thinking/status states remain the safe visible progress transport.

## Error mapping

Stable errors include `AI_PROVIDER_NOT_CONFIGURED`, `AI_AUTH_FAILED`, `AI_MODEL_UNAVAILABLE`, `AI_RATE_LIMITED`, `AI_TIMEOUT`, `AI_UNAVAILABLE`, `AI_INVALID_REQUEST`, `AI_INVALID_RESPONSE`, `AI_STRUCTURED_OUTPUT_FAILED`, `AI_TOOL_SCHEMA_INVALID`, `AI_TOOL_CALL_FAILED`, `AI_TOOL_UNAVAILABLE`, `AI_MAX_TOOL_CALLS_REACHED`, `AI_CONTEXT_EXPIRED`, `AI_CONVERSATION_NOT_FOUND` and `AI_STREAM_INTERRUPTED`.

Live failures never render the old Demo answer as Live. MT5 is not connected, and broker execution and automatic trading are not supported. These are permanent product boundaries for Beta and V1, not future sprint items.
