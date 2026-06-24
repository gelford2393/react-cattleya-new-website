import { supabaseServer } from "./supabaseServer";

type PoolRow = {
  id: string;
  pool_number: number | string;
  name: string;
  capacity: number | null;
  rates: { day?: number; night?: number } | null;
  amenities?: string[] | null;
};

type CmsPageRow = {
  slug: string;
  title: string;
  content: string;
};

/** Strips HTML tags from CMS rich-text content so it reads cleanly in a prompt. */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Fetches all pools for grounding the system prompt.
 *
 * On a Supabase error we deliberately degrade gracefully (return `[]`) instead
 * of throwing, so a transient DB problem doesn't take down the whole chat
 * endpoint — the prompt simply falls back to "No pool data is currently
 * available." We log at `error` level with a `[chat:critical]` tag (not a quiet
 * `warn`) because a silent, prolonged "no data" state should be alertable in
 * the serverless logs.
 */
async function fetchPools(): Promise<PoolRow[]> {
  const { data, error } = await supabaseServer
    .from("pools")
    .select("id,pool_number,name,capacity,rates,amenities")
    .order("pool_number");

  if (error) {
    console.error("[chat:critical] Failed to fetch pools for system prompt:", error.message);
    return [];
  }
  return data ?? [];
}

/**
 * Fetches a single CMS page by slug for the policies/info section of the prompt.
 *
 * Returns `null` both when the page genuinely doesn't exist and when the fetch
 * fails — callers treat a missing page as "just omit that section." The error
 * case is logged at `error` level with the `[chat:critical]` tag so an
 * infrastructure failure (vs. an intentionally unpublished page) is visible in
 * the logs.
 */
async function fetchCmsPage(slug: string): Promise<CmsPageRow | null> {
  const { data, error } = await supabaseServer
    .from("cms_pages")
    .select("slug,title,content")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error(`[chat:critical] Failed to fetch CMS page "${slug}":`, error.message);
    return null;
  }
  return data;
}

/**
 * Formats one pool row into a single human-readable bullet for the prompt,
 * e.g. `- Pool 1 "Lagoon": capacity 20, day rate ₱1500, night rate ₱2000. ...`.
 * Gracefully handles missing rates (→ "rate not set"), unknown capacity
 * (→ "unspecified"), and empty amenities (→ omits the amenities sentence).
 */
function formatPool(pool: PoolRow): string {
  const rateParts: string[] = [];
  if (pool.rates?.day != null) rateParts.push(`day rate ₱${pool.rates.day}`);
  if (pool.rates?.night != null) rateParts.push(`night rate ₱${pool.rates.night}`);
  const rateText = rateParts.length > 0 ? rateParts.join(", ") : "rate not set";

  const amenitiesText =
    pool.amenities && pool.amenities.length > 0
      ? `Amenities: ${pool.amenities.join(", ")}.`
      : "";

  return `- Pool ${pool.pool_number} "${pool.name}": capacity ${pool.capacity ?? "unspecified"}, ${rateText}. ${amenitiesText}`.trim();
}

/**
 * Builds the chatbot's system prompt from live Supabase data so answers stay
 * accurate as pools/rates/CMS content change.
 *
 * KNOWN LIMITATION (deferred follow-up): this runs on EVERY chat message — not
 * once per conversation — so each follow-up message re-issues these 4 Supabase
 * queries even though the underlying data rarely changes. Acceptable for launch
 * volume; revisit with a short-TTL cache (e.g. in-memory or Redis) if chat
 * traffic grows. Tracked in docs/pr-1-review-fixes.md item #3.
 */
export async function buildSystemPrompt(): Promise<string> {
  const [pools, contactPage, reservationPage, notePage] = await Promise.all([
    fetchPools(),
    fetchCmsPage("contact-us"),
    fetchCmsPage("reservation"),
    fetchCmsPage("note"),
  ]);

  const poolsSection =
    pools.length > 0
      ? pools.map(formatPool).join("\n")
      : "No pool data is currently available.";

  const cmsSections = [contactPage, reservationPage, notePage]
    .filter((page): page is CmsPageRow => page !== null)
    .map((page) => `### ${page.title}\n${stripHtml(page.content)}`)
    .join("\n\n");

  return `You are the friendly customer-service assistant for Cattleya Resort.
Answer guest questions about pools, rates, hours, amenities, and policies using ONLY the information below.
If you don't know something, say so honestly and suggest the guest contact the resort directly — never invent rates, pools, or policies.
Keep answers short and conversational.

## Current Pools & Rates
${poolsSection}

## Resort Policies & Info
${cmsSections || "No additional policy content is currently published."}`;
}
