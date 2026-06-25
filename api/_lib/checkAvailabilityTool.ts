import { tool } from "ai";
import { z } from "zod";
import { bookingSystemFirestore } from "./firebaseAdmin";

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

/**
 * Real availability lookup against the cattleyaresort-react booking system's
 * Firestore `slots` collection. Queries all slots for the given date, then
 * matches the guest's spoken pool name against each doc's `pool` field
 * (stripping the "NN-" numeric prefix) rather than relying on a hardcoded
 * name→ID table, so this stays correct if pools are renamed/added in the
 * booking system without a matching change here.
 */
export const checkAvailabilityTool = tool({
  description:
    "Check whether a specific pool is available for booking on a given date. Use this whenever a guest asks if a pool is free/open/available on a date. Performs a live lookup against the resort's booking system.",
  inputSchema: z.object({
    poolName: z.string().describe("The name of the pool the guest is asking about"),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be in YYYY-MM-DD format")
      .describe("The date the guest is asking about, in YYYY-MM-DD format"),
  }),
  execute: async ({ poolName, date }) => {
    try {
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

      // A slot is occupied for any status other than CANCELLED — matches the
      // booking system's own invariant (see DateSlotsModal.tsx, ReservePage.tsx,
      // mutations.ts), so this stays correct if new statuses are added there.
      const statusFor = (type: "DAY" | "NIGHT"): AvailabilityStatus => {
        const isBooked = matchingDocs.some(
          (slot) => slot.type === type && slot.status !== "CANCELLED"
        );
        return isBooked ? "booked" : "available";
      };

      return {
        poolName,
        date,
        day: statusFor("DAY"),
        night: statusFor("NIGHT"),
        ...(matchingDocs.length === 0
          ? { note: "No existing reservations found for this pool/date." }
          : {}),
      };
    } catch (err) {
      console.error("[chat:critical] checkAvailability Firestore query failed:", err);
      return {
        poolName,
        date,
        error: "Unable to check availability right now.",
      };
    }
  },
});
