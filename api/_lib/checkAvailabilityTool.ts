import { tool } from "ai";
import { z } from "zod";
import { bookingSystemFirestore } from "./firebaseAdmin.js";
import { supabaseServer } from "./supabaseServer.js";
import { addDays } from "./dateUtils.js";

type SlotStatus = "PENDING" | "BOOKED" | "CANCELLED" | "PENCIL";

interface SlotDoc {
  pool: string;
  type: "DAY" | "NIGHT";
  date: string;
  status: SlotStatus;
}

/** Strips the leading "NN-" numeric prefix from a pool field like "01-Corazon", returning "Corazon". */
function poolNameFromField(pool: string): string {
  const dashIndex = pool.indexOf("-");
  return dashIndex === -1 ? pool : pool.slice(dashIndex + 1);
}

type AvailabilityStatus = "available" | "booked";

type StayType = "DAY" | "NIGHT" | "STRAIGHT_AM" | "STRAIGHT_PM";

/**
 * Fetches the canonical list of pool names from Supabase (the same source the
 * system prompt is grounded in), ordered by pool number. Used when the guest
 * asks an open-ended "what's available?" question without naming a pool, so we
 * can evaluate every pool in a single tool call instead of the model calling
 * this tool once per pool. Degrades to `[]` on error (the tool then reports it
 * couldn't look anything up) rather than throwing.
 */
async function fetchAllPoolNames(): Promise<string[]> {
  const { data, error } = await supabaseServer
    .from("pools")
    .select("name")
    .order("pool_number");

  if (error) {
    console.error("[chat:critical] Failed to fetch pool list for availability:", error.message);
    return [];
  }
  return (data ?? []).map((row) => row.name).filter((name): name is string => Boolean(name));
}

/**
 * Fetches every `slots` doc for a single date in ONE query. We pull the whole
 * date and filter per pool in memory so checking many pools costs one Firestore
 * read per date instead of one read per pool.
 */
async function fetchSlotsForDate(date: string): Promise<SlotDoc[]> {
  const snapshot = await bookingSystemFirestore
    .collection("slots")
    .where("date", "==", date)
    .get();
  return snapshot.docs.map((doc) => doc.data() as SlotDoc);
}

/**
 * Computes DAY/NIGHT availability for one pool from an already-fetched set of
 * slot docs. Matches the guest's spoken pool name against each doc's `pool`
 * field (stripping the "NN-" prefix) rather than a hardcoded name→ID table, so
 * this stays correct if pools are renamed/added in the booking system.
 *
 * A slot is occupied for any status other than CANCELLED — this includes
 * PENDING and PENCIL (a tentative hold), not just BOOKED — matching the
 * booking system's own invariant (DateSlotsModal.tsx, ReservePage.tsx,
 * mutations.ts in cattleyaresort-react).
 */
function availabilityFromSlots(
  slots: SlotDoc[],
  poolName: string
): { day: AvailabilityStatus; night: AvailabilityStatus } {
  const guestName = poolName.toLowerCase();
  const matchingDocs = slots.filter((slot) => {
    const slotName = poolNameFromField(slot.pool).toLowerCase();
    return slotName.includes(guestName) || guestName.includes(slotName);
  });

  const statusFor = (type: "DAY" | "NIGHT"): AvailabilityStatus => {
    const isBooked = matchingDocs.some(
      (slot) => slot.type === type && slot.status !== "CANCELLED"
    );
    return isBooked ? "booked" : "available";
  };

  return { day: statusFor("DAY"), night: statusFor("NIGHT") };
}

/**
 * Collapses a pool's DAY/NIGHT availability into a single answer for the
 * requested stay type:
 * - DAY (9am-5pm) / NIGHT (7pm-7am next day): the matching field of `date`.
 * - STRAIGHT_AM (9am-7am next day): DAY + NIGHT of the SAME date — both legs
 *   must be free.
 * - STRAIGHT_PM (7pm-5pm next day): NIGHT of `date` + DAY of `date + 1` — the
 *   cross-date case, which is why `nextSlots` is passed in.
 */
function resolveStayType(
  stayType: StayType,
  poolName: string,
  currentSlots: SlotDoc[],
  nextSlots: SlotDoc[]
): AvailabilityStatus {
  const current = availabilityFromSlots(currentSlots, poolName);

  if (stayType === "DAY") return current.day;
  if (stayType === "NIGHT") return current.night;
  if (stayType === "STRAIGHT_AM") {
    return current.day === "booked" || current.night === "booked" ? "booked" : "available";
  }

  // STRAIGHT_PM: night of `date` + day of `date + 1`.
  const next = availabilityFromSlots(nextSlots, poolName);
  return current.night === "booked" || next.day === "booked" ? "booked" : "available";
}

/**
 * Resolves availability for a set of pools against a date + stay type, fetching
 * each needed date's slots only once (one read for `date`, plus one for
 * `date + 1` only when the stay type spans into the next day).
 */
async function resolveForPools(
  stayType: StayType,
  poolNames: string[],
  date: string
): Promise<{ poolName: string; available: AvailabilityStatus }[]> {
  const needsNextDay = stayType === "STRAIGHT_PM";
  const [currentSlots, nextSlots] = await Promise.all([
    fetchSlotsForDate(date),
    needsNextDay ? fetchSlotsForDate(addDays(date, 1)) : Promise.resolve<SlotDoc[]>([]),
  ]);

  return poolNames.map((poolName) => ({
    poolName,
    available: resolveStayType(stayType, poolName, currentSlots, nextSlots),
  }));
}

export const checkAvailabilityTool = tool({
  description:
    "Check pool availability for a given date and stay type (day, night, or straight) via a live lookup against the resort's booking system. " +
    "Call this whenever a guest asks what's free/open/available, once you know the date and stay type. " +
    "If the guest named a specific pool, pass `poolName`. If they did NOT name a pool (e.g. 'what's available tonight?'), OMIT `poolName` to check ALL pools in a single call — do not call this tool once per pool.",
  inputSchema: z.object({
    poolName: z
      .string()
      .optional()
      .describe(
        "Optional. The specific pool the guest asked about. OMIT to check every pool at once."
      ),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format")
      .describe("The start date of the stay, in YYYY-MM-DD format"),
    stayType: z
      .enum(["DAY", "NIGHT", "STRAIGHT_AM", "STRAIGHT_PM"])
      .describe(
        "DAY (9am-5pm), NIGHT (7pm-7am next day), STRAIGHT_AM (9am-7am next day), or STRAIGHT_PM (7pm-5pm next day)"
      ),
  }),
  execute: async ({ poolName, date, stayType }) => {
    try {
      const poolNames = poolName ? [poolName] : await fetchAllPoolNames();
      if (poolNames.length === 0) {
        return {
          date,
          stayType,
          error: "No pools are available to check right now.",
        };
      }

      const results = await resolveForPools(stayType, poolNames, date);

      // Single-pool query: return a flat result the model can read directly.
      if (poolName) {
        return { poolName, date, stayType, available: results[0].available };
      }

      // All-pools query: return the full matrix in one shot.
      return { date, stayType, pools: results };
    } catch (err) {
      console.error("[chat:critical] checkAvailability Firestore query failed:", err);
      return {
        poolName,
        date,
        stayType,
        error: "Unable to check availability right now.",
      };
    }
  },
});
