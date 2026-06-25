# Chat Model Fallback on Quota Exhaustion

Date: 2026-06-25

## Background

The chatbot calls Groq's `llama-3.3-70b-versatile` directly. Groq's free/"on_demand" tier caps that model at 100,000 tokens/day — a cap hit during this session's own testing (manual `tsx`-based verification of the availability and booking-intake features made many real calls against the live endpoint). When the cap is hit, every message fails with a `RetryError` wrapping a 429 `APICallError`, and the guest sees the friendly fallback message added in a prior fix ("I'm having trouble answering right now, please try again shortly") — but every message keeps failing the same way until the daily quota resets, since nothing currently changes which model is being called.

This is a testing-convenience and small-scale-resilience improvement, not a production SLA guarantee: the goal is that once the primary model is known to be exhausted, subsequent messages automatically use a different model with its own separate quota, instead of every message failing identically until the human notices and intervenes.

## Key constraint: no mid-stream provider swap

By the time a rate-limit error surfaces, the AI SDK has typically already started streaming the response to the browser — confirmed in this session's own testing, where the SSE stream showed a `{"type":"start"}` event before the `{"type":"error",...}` event. This means the *message that discovers the exhaustion* cannot be silently retried on a different model — the response has already begun. The fallback this spec implements is forward-looking: the failing message still shows the existing friendly error text, but every message *after* that one automatically uses the fallback model until the remembered cooldown window passes.

## Design

**Fallback target:** a smaller Groq model, `llama-3.1-8b-instant`. Same provider and API key (`GROQ_API_KEY`, already configured) — Groq tracks quota per model, so this is a completely separate 100k/day bucket from the 70B model, with no new environment variable or provider dependency needed.

**Cooldown tracking:** in-memory only (a module-scope variable in the new `api/_lib/modelFallback.ts`), not persisted to any external store. This is the simplest option and avoids adding infrastructure for what is fundamentally a testing-convenience feature. The tradeoff: a cold serverless instance start forgets the cooldown and may attempt the primary model again — but since Groq's 429 response always includes a `retry-after` header with the exact remaining seconds, a wrong guess only costs one wasted attempt before the cooldown is immediately re-established with the correct remaining time. Acceptable given the low-traffic context.

**Detecting the failure:** `streamText`'s `onError` callback (a documented option, used for side-effect logging/hooks — it does not replace or suppress the existing error already surfaced into the UI message stream) is used to inspect the error. The AI SDK exports `APICallError` and `RetryError` classes with static `.isInstance()` type guards (matching the `Symbol(vercel.ai.error.*)` markers already observed on these error objects during this session's testing). Only an error that is specifically a 429 — via `RetryError.lastError.statusCode === 429` or a direct `APICallError.statusCode === 429` — triggers the fallback. A different failure (network blip, malformed request, a different status code) must NOT cause us to abandon the primary model for 30+ minutes over an unrelated problem.

**Extracting the cooldown duration:** read the `retry-after` header (in seconds) off the 429 response, already present in Groq's error responses (observed directly in this session: `'retry-after': '1909'`). If that header is ever missing, fall back to a fixed default of 30 minutes (1800 seconds) — long enough to be safe, short enough not to needlessly avoid a model that may have already recovered.

## Components

### New: `api/_lib/modelFallback.ts`

```typescript
import { groq } from "@ai-sdk/groq";
import { APICallError, RetryError, type LanguageModel } from "ai";

const PRIMARY_MODEL_ID = "llama-3.3-70b-versatile";
const FALLBACK_MODEL_ID = "llama-3.1-8b-instant";
const DEFAULT_COOLDOWN_SECONDS = 1800;

let primaryCooldownUntil: number | null = null;

/**
 * Returns the model to use for the current request: the primary model
 * unless it's currently within a remembered rate-limit cooldown window, in
 * which case the fallback model (a separate Groq quota bucket) is used
 * instead. State is in-memory and per-instance — see design doc for why
 * that's an acceptable tradeoff here.
 */
export function getChatModel(): LanguageModel {
  const withinCooldown = primaryCooldownUntil !== null && Date.now() < primaryCooldownUntil;
  return groq(withinCooldown ? FALLBACK_MODEL_ID : PRIMARY_MODEL_ID);
}

/**
 * Inspects a streamText error and, if it's specifically a 429 rate-limit
 * failure from the primary model, records a cooldown window so subsequent
 * requests route to the fallback model. Any other kind of error is ignored
 * here — it's already surfaced to the guest via the existing UI stream
 * error path; this function's only job is deciding whether to switch models
 * going forward.
 */
export function recordStreamError(error: unknown): void {
  const rateLimitError = extractRateLimitError(error);
  if (!rateLimitError) return;

  const retryAfterHeader = rateLimitError.responseHeaders?.["retry-after"];
  const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : DEFAULT_COOLDOWN_SECONDS;
  primaryCooldownUntil = Date.now() + retryAfterSeconds * 1000;

  console.error(
    `[chat:critical] Groq primary model (${PRIMARY_MODEL_ID}) rate-limited; ` +
      `falling back to ${FALLBACK_MODEL_ID} until ${new Date(primaryCooldownUntil).toISOString()}`
  );
}

function extractRateLimitError(error: unknown): APICallError | null {
  if (RetryError.isInstance(error) && APICallError.isInstance(error.lastError) && error.lastError.statusCode === 429) {
    return error.lastError;
  }
  if (APICallError.isInstance(error) && error.statusCode === 429) {
    return error;
  }
  return null;
}
```

(Exact code may be lightly adjusted during implementation if the `ai` package's actual exported type guards differ slightly from what's shown here — verify `APICallError`/`RetryError` are exported with `.isInstance()` static methods from the installed `ai` package version before finalizing.)

### `api/chat.ts`

- Replace the hardcoded `model: groq("llama-3.3-70b-versatile")` with `model: getChatModel()`.
- Add `onError: ({ error }) => recordStreamError(error)` to the `streamText({...})` options.
- Import `getChatModel` and `recordStreamError` from `./_lib/modelFallback`.

No other changes to `chat.ts` — `stopWhen`, `maxRetries`, `tools`, and the rest of the existing options are unaffected.

## Error handling

- Only 429 errors trigger the fallback recording; all other error types pass through unaffected (existing `onError`-independent UI-stream error surfacing already handles them, via the friendly message added in the prior fix).
- The existing `maxRetries: 4` setting still applies before `onError` ever fires — a 429 on the primary model is retried (with exponential backoff) up to 5 total attempts before `streamText` gives up and surfaces the `RetryError`, exactly as today. This spec does not change that retry behavior; it only adds a reaction to the final failure. This means the one message that discovers the exhaustion is slower (several seconds of retries) before falling through to the error path — an accepted tradeoff, since it's a rare, one-time cost per cooldown cycle.
- If `recordStreamError` is ever called with something that isn't a recognized rate-limit shape, it's a no-op — no model switch happens, no exception thrown from inside the callback.

## Testing

Manual only, per project preference. Verify by:
- Confirming via code reading/type-checking that `getChatModel()` and `recordStreamError()` compile and the `onError` wiring is correct.
- Since the primary model is already rate-limited from today's testing, sending a real chat request and directly observing (via the `[chat:critical]` log line, or temporarily logging the resolved model ID) that it automatically uses `llama-3.1-8b-instant` instead of failing again.
- Confirm a non-429 error (e.g. temporarily misconfiguring an unrelated env var to force a different failure) does NOT set the cooldown — `recordStreamError` should no-op.

## Out of scope

- Persisting cooldown state outside the running serverless instance (e.g. Vercel KV, Edge Config) — in-memory is accepted as sufficient for this testing-convenience feature.
- Reducing or skipping the existing `maxRetries` backoff specifically for 429s (e.g. failing fast instead of retrying a model already known to be exhausted) — not requested, and changing retry classification is a separate, riskier change.
- A third or further fallback tier (e.g. also trying Gemini if both Groq models are exhausted) — two models (one primary, one fallback) is the scope agreed for this feature; revisit only if this proves insufficient in practice.
- Any change to the model selection for non-rate-limit reasons (e.g. cost-based routing, quality-based routing).
