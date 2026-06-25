import { tool } from "ai";
import { z } from "zod";
import { bookingSystemFirestore } from "./firebaseAdmin";
import { addDays } from "./dateUtils";

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
 * Queries the cattleyaresort-react booking system's Firestore `slots`
 * collection for one date, matching the guest's spoken pool name against
 * each doc's `pool` field (stripping the "NN-" numeric prefix) rather than
 * relying on a hardcoded name→ID table, so this stays correct if pools are
 * renamed/added in the booking system without a matching change here.
 *
 * A slot is occupied for any status other than CANCELLED — this includes
 * PENDING and PENCIL (a tentative hold), not just BOOKED — matching the
 * booking system's own invariant (see DateSlotsModal.tsx, ReservePage.tsx,
 * mutations.ts in cattleyaresort-react), so this stays correct if new
 * statuses are added there.
 */
async function getSlotAvailability(
  poolName: string,
  date: string
): Promise<{ day: AvailabilityStatus; night: AvailabilityStatus }> {
  const snapshot = await bookingSystemFirestore
    .collection("slots")
    .where("date", "==", date)
    .get();

  const matchingDocs = snapshot.docs
    .map((doc) => doc.data() as SlotDoc)
    .filter((slot) => {
      const slotName = poolNameFromField(slot.pool).toLowerCase();
      const guestName = poolName.toLowerCase();
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
 * Resolves availability for one of the resort's four stay types:
 * - DAY (9am-5pm) / NIGHT (7pm-7am next day): a single date's matching field.
 * - STRAIGHT_AM (9am-7am next day): DAY + NIGHT of the SAME date — both legs
 *   must be free.
 * - STRAIGHT_PM (7pm-5pm next day): NIGHT of `date` + DAY of `date + 1` — this
 *   is the cross-date case, with the next date computed via `addDays` rather
 *   than left to the model (the model has no reliable way to do date math).
 */
async function resolveStayTypeAvailability(
  stayType: StayType,
  poolName: string,
  date: string
): Promise<AvailabilityStatus> {
  if (stayType === "DAY" || stayType === "NIGHT") {
    const { day, night } = await getSlotAvailability(poolName, date);
    return stayType === "DAY" ? day : night;
  }

  if (stayType === "STRAIGHT_AM") {
    const { day, night } = await getSlotAvailability(poolName, date);
    return day === "booked" || night === "booked" ? "booked" : "available";
  }

  // STRAIGHT_PM: night of `date` + day of `date + 1`.
  const [current, next] = await Promise.all([
    getSlotAvailability(poolName, date),
    getSlotAvailability(poolName, addDays(date, 1)),
  ]);
  return current.night === "booked" || next.day === "booked" ? "booked" : "available";
}

export const checkAvailabilityTool = tool({
  description:
    "Check whether a specific pool is available for a given date and stay type (day, night, or straight). Use this whenever a guest asks if a pool is free/open/available, after you know the date and stay type. Performs a live lookup against the resort's booking system.",
  inputSchema: z.object({
    poolName: z.string().describe("The name of the pool the guest is asking about"),
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
      const available = await resolveStayTypeAvailability(stayType, poolName, date);
      return { poolName, date, stayType, available };
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
