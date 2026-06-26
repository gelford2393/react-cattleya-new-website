import { groq } from "@ai-sdk/groq";
import { APICallError, RetryError, type LanguageModel } from "ai";

const PRIMARY_MODEL_ID = "openai/gpt-oss-120b";
const FALLBACK_MODEL_ID = "openai/gpt-oss-20b";
const DEFAULT_COOLDOWN_SECONDS = 1800;

let primaryCooldownUntil: number | null = null;

/**
 * Returns the model to use for the current request: the primary model
 * unless it's currently within a remembered rate-limit cooldown window, in
 * which case the fallback model (a separate Groq quota bucket, same API
 * key) is used instead.
 *
 * State is in-memory and per-serverless-instance, not persisted externally.
 * A cold start forgets the cooldown and may retry the primary model once
 * more than necessary — but since Groq's 429 response always includes the
 * exact remaining seconds via `retry-after`, a wrong guess only costs one
 * wasted attempt before the correct cooldown is re-established. Acceptable
 * for this low-traffic, testing-convenience feature.
 */
export function getChatModel(): LanguageModel {
  const withinCooldown = primaryCooldownUntil !== null && Date.now() < primaryCooldownUntil;
  return groq(withinCooldown ? FALLBACK_MODEL_ID : PRIMARY_MODEL_ID);
}

/**
 * Inspects a streamText error and, if it's specifically a 429 rate-limit
 * failure, records a cooldown window so subsequent requests route to the
 * fallback model. Any other kind of error (network blip, malformed
 * request, etc.) is ignored — this function's only job is decided whether
 * to switch models going forward, not handling the error itself (that's
 * already surfaced to the guest via the existing UI stream error path).
 */
export function recordStreamError(error: unknown): void {
  const rateLimitError = extractRateLimitError(error);
  if (!rateLimitError) return;

  // Retry-After is permitted by HTTP spec to be an HTTP-date rather than a
  // number of seconds; Groq sends seconds today, but guard against a
  // non-numeric value parsing to NaN, which would otherwise silently disable
  // the cooldown (Date.now() < NaN is always false) right when it's needed.
  const retryAfterHeader = rateLimitError.responseHeaders?.["retry-after"];
  const parsedRetryAfter = retryAfterHeader ? Number(retryAfterHeader) : NaN;
  const retryAfterSeconds =
    Number.isFinite(parsedRetryAfter) && parsedRetryAfter > 0 ? parsedRetryAfter : DEFAULT_COOLDOWN_SECONDS;
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
