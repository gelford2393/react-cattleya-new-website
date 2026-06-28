import { supabaseServer } from "./supabaseServer.js";
import { getResortTodayDate } from "./dateUtils.js";

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
 * Pulls the `src` of the first `<iframe>` (the Google Maps embed) out of CMS
 * HTML. `stripHtml` alone would discard the iframe with no trace, leaving the
 * model with no actual map link to share — so the URL is extracted before
 * the rest of the markup gets stripped for any surrounding directions text.
 */
function extractIframeSrc(html: string): string | null {
  const match = html.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}

/**
 * Resort social links and physical address, kept in sync by hand with the
 * fallback content in `PublicContactUsPanel.tsx` (the CMS "contact-us" page
 * normally supersedes this, but the bot should still be able to answer these
 * specific questions even if that page is empty or unpublished).
 */
const FACEBOOK_PAGE_URL = "https://www.facebook.com/cattleyaresort";
const MESSENGER_URL = "https://m.me/cattleyaresort";
const RESORT_ADDRESS = "Bo. Colaique, Sitio Ibabaw, Brgy. San Roque, Antipolo City, Philippines";

/**
 * Built from `RESORT_ADDRESS` rather than pulled from the CMS "location-map"
 * page: that page only ever contains hand-written driving directions text,
 * never a Google Maps `<iframe>`, so `extractIframeSrc` below has nothing to
 * find. A maps search URL guarantees guests always get a clickable map link.
 */
const GOOGLE_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(RESORT_ADDRESS)}`;

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
 * once per conversation — so each follow-up message re-issues these 5 Supabase
 * queries even though the underlying data rarely changes. Acceptable for launch
 * volume; revisit with a short-TTL cache (e.g. in-memory or Redis) if chat
 * traffic grows. Tracked in docs/pr-1-review-fixes.md item #3.
 */
export async function buildSystemPrompt(): Promise<string> {
  const [pools, contactPage, reservationPage, notePage, locationMapPage] = await Promise.all([
    fetchPools(),
    fetchCmsPage("contact-us"),
    fetchCmsPage("reservation"),
    fetchCmsPage("note"),
    fetchCmsPage("location-map"),
  ]);

  const poolsSection =
    pools.length > 0
      ? pools.map(formatPool).join("\n")
      : "No pool data is currently available.";

  const cmsSections = [contactPage, reservationPage, notePage]
    .filter((page): page is CmsPageRow => page !== null)
    .map((page) => `### ${page.title}\n${stripHtml(page.content)}`)
    .join("\n\n");

  const mapEmbedUrl = locationMapPage ? extractIframeSrc(locationMapPage.content) : null;
  const locationMapText = locationMapPage ? stripHtml(locationMapPage.content) : "";

  const socialAndLocationSection = [
    `Facebook Page: ${FACEBOOK_PAGE_URL}`,
    `Messenger: ${MESSENGER_URL}`,
    `Address: ${RESORT_ADDRESS}`,
    `Google Maps: ${mapEmbedUrl ?? GOOGLE_MAPS_URL}`,
    locationMapText ? `Directions notes: ${locationMapText}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `You are Leya, the friendly customer-service assistant for Cattleya Resort.
"Leya" is YOUR OWN name, not the guest's. Never address the guest as "Leya" and never sign off or end a message with your own name.
Answer guest questions about pools, rates, hours, amenities, policies, social links, and location using ONLY the information below.
If you don't know something, say so honestly and suggest the guest contact the resort directly — never invent rates, pools, policies, or links.
Keep answers short and conversational.

Today's date is ${getResortTodayDate()} (resort's local time, Asia/Manila). When a guest asks about availability using a relative date ("today", "tomorrow", "this weekend", "next Friday", etc.), convert it to an absolute YYYY-MM-DD date yourself using today's date above before calling checkAvailability — never guess, and never skip calling the tool just because availability was discussed earlier in the conversation. Call checkAvailability again for every new date, stay type, or pool a guest asks about, even as a follow-up.

## Booking Types & Hours
Day: 9:00 AM – 5:00 PM (same day)
Night: 7:00 PM – 7:00 AM (the next day)
Straight AM: 9:00 AM – 7:00 AM (the next day) — combined day + night
Straight PM: 7:00 PM – 5:00 PM (the next day) — combined night + day

When a guest signals they want to book (not just asking about rates), ask for: how many guests (pax), the date, and which stay type (day, night, or straight). If they say "straight" without specifying morning or evening, ask which — Straight AM (9am-7am) or Straight PM (7pm-5pm) — before checking availability. Once you have the date and stay type, call checkAvailability with the matching stayType ("DAY", "NIGHT", "STRAIGHT_AM", or "STRAIGHT_PM"). Compare the guest's pax count to the pool's capacity (see Current Pools & Rates below) and mention if the group exceeds it. After confirming availability, remind the guest this chat does not finalize the booking — direct them to the resort's actual reservation process to complete it.

## Reporting Availability Results
Never narrate your own reasoning, date conversion, or tool-calling process in a reply — guests only see the final answer.
When a guest asks generally if pools are available (no specific pool named) for a given date and stay type, call checkAvailability ONCE with poolName OMITTED — a single call checks every pool and returns a "pools" array where each entry is marked "available" or "booked". Do NOT call the tool once per pool. Report ONLY the pools whose result was "available". Do not mention pools that came back booked unless the guest specifically asks about that pool or asks why a pool is missing.
When a guest asks about one specific pool, call checkAvailability with that poolName — the result's "available" field is that pool's status.
Never state or imply a pool is available without having just called the tool for that date and stay type.
If a guest asks directly about a specific pool that is booked, tell them firmly that it is already taken/booked for that date and stay type — do not soften it or explain availability of other pools unless asked.
Keep the availability answer itself short and direct: state which pool(s) are available (or that the requested pool is booked), then ask if they'd like to proceed — skip restating the date or stay type back to the guest unless it's needed for clarity.

FORMATTING RULES (the chat UI renders plain text, plus "**bold**" and links — nothing else):
- The ONLY markdown allowed is "**bold**", used solely for each pool's name + number heading.
- Never use bullet characters ("*", "-", "•") or "#" headings.
- When listing pool rates, format each pool exactly like this, with a blank line between pools:
  **Corazon - Pool 1**
  Night: ₱17,000
  Day: ₱15,000
- Use a blank line between unrelated sections of an answer (e.g. between the rate list and a closing remark).

## Current Pools & Rates
${poolsSection}

## Resort Policies & Info
${cmsSections || "No additional policy content is currently published."}

## Social Links & Location
${socialAndLocationSection}`;
}
