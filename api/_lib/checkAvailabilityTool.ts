import { tool } from "ai";
import { z } from "zod";

/**
 * STUB IMPLEMENTATION — the real Firebase booking system's Firestore
 * collection/field names are not yet confirmed (see design doc's open
 * question). This returns deterministic mock data so the tool-calling flow
 * can be built and tested end-to-end now; swap the body for a real Firebase
 * Admin SDK query once the schema is confirmed.
 */
export const checkAvailabilityTool = tool({
  description:
    "Check whether a specific pool is available for booking on a given date. Use this whenever a guest asks if a pool is free/open/available on a date.",
  inputSchema: z.object({
    poolName: z.string().describe("The name of the pool the guest is asking about"),
    date: z.string().describe("The date the guest is asking about, in YYYY-MM-DD format"),
  }),
  execute: async ({ poolName, date }) => {
    console.warn(
      `[chat] checkAvailability STUB called for "${poolName}" on ${date} — returning mock data, not a real booking lookup`,
    );
    return {
      poolName,
      date,
      available: true,
      note: "This is placeholder availability data — real booking-system integration is not yet wired up.",
    };
  },
});
