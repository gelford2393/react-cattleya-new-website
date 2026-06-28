/**
 * Best-effort abuse/cost guards for the public `/api/chat` endpoint.
 *
 * This is the cheap, zero-dependency FIRST layer: an origin allowlist (stops
 * browser-based cross-site abuse — i.e. someone using our endpoint as a free
 * AI backend from their own site) plus hard caps on conversation size (stops
 * giant-payload cost amplification). The planned SECOND layer is a real per-IP
 * rate limit backed by Upstash Redis — tracked in docs/pr-1-review-fixes.md.
 *
 * Deliberately NOT relied on as a security boundary on its own: the `Origin`
 * header can be spoofed by non-browser clients, which is exactly why the rate
 * limit is the follow-up. Together they raise the cost of abuse enough for a
 * low-traffic public marketing site.
 */

/** Reject conversations with more than this many messages. */
export const MAX_MESSAGES = 40;

/**
 * Reject request payloads larger than this many characters (serialized). Caps
 * the worst case where a caller stuffs a single request with a huge history to
 * inflate token cost per call.
 */
export const MAX_PAYLOAD_CHARS = 20_000;

/** Local dev origins (Vite / `vercel dev`) are always allowed. */
const LOCALHOST_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/**
 * Builds the set of allowed origins from:
 *  - `CHAT_ALLOWED_ORIGINS` — comma-separated list of your real domains
 *    (e.g. `https://cattleyaresort.com`); set this in the Vercel dashboard.
 *  - Vercel's auto-injected deployment URLs, so same-origin requests from the
 *    production domain and from preview deployments pass without extra config.
 *
 * Note we match the project's OWN Vercel URLs specifically (not all of
 * `*.vercel.app`), so another person's `*.vercel.app` deployment can't call us.
 */
function getAllowedOrigins(): string[] {
  const fromEnv = (process.env.CHAT_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const vercelOrigins = [
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
  ]
    .filter((host): host is string => Boolean(host))
    .map((host) => `https://${host}`);

  return [...fromEnv, ...vercelOrigins];
}

/**
 * Returns `true` if a request carrying this `Origin` header should be allowed.
 *
 * A MISSING `Origin` (server-to-server calls, and some same-origin requests)
 * is allowed here on purpose: we can't make a cross-site judgement without it,
 * so we defer to the payload caps and the planned rate limit. Browser-based
 * cross-site abuse always sends an `Origin`, which is precisely what this
 * blocks.
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true;
  if (LOCALHOST_PATTERN.test(origin)) return true;
  return getAllowedOrigins().includes(origin);
}

/**
 * Validates conversation size. Returns a human-readable reason string when the
 * payload is too large (the caller turns it into a 400), or `null` when OK.
 */
export function checkPayloadLimits(messages: unknown[]): string | null {
  if (messages.length > MAX_MESSAGES) {
    return `Conversation too long (max ${MAX_MESSAGES} messages).`;
  }
  if (JSON.stringify(messages).length > MAX_PAYLOAD_CHARS) {
    return "Message payload too large.";
  }
  return null;
}
