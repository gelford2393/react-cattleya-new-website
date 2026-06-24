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

async function fetchPools(): Promise<PoolRow[]> {
  const { data, error } = await supabaseServer
    .from("pools")
    .select("id,pool_number,name,capacity,rates,amenities")
    .order("pool_number");

  if (error) {
    console.warn("[chat] Failed to fetch pools for system prompt:", error.message);
    return [];
  }
  return data ?? [];
}

async function fetchCmsPage(slug: string): Promise<CmsPageRow | null> {
  const { data, error } = await supabaseServer
    .from("cms_pages")
    .select("slug,title,content")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.warn(`[chat] Failed to fetch CMS page "${slug}":`, error.message);
    return null;
  }
  return data;
}

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
 * accurate as pools/rates/CMS content change. Runs on every request — no
 * caching layer in this version (per the design doc).
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
