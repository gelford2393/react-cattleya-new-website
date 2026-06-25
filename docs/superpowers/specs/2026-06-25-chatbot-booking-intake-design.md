# Chatbot Booking Intake & Stay-Type Availability

Date: 2026-06-25

## Background

The chatbot can already check whether a pool is free on a given date (see `2026-06-25-chatbot-availability-lookup-design.md`), reporting separate DAY and NIGHT status. In practice, the resort sells three kinds of stays, not two:

- **Day:** 9:00 AM – 5:00 PM
- **Night:** 7:00 PM – 7:00 AM (next day)
- **Straight:** a 22-hour combined stay, in one of two windows:
  - **Straight AM:** 9:00 AM – 7:00 AM (next day)
  - **Straight PM:** 7:00 PM – 5:00 PM (next day)

Guests asking about "straight" availability today get no real answer — the bot doesn't know these windows exist, and doesn't ask for the details (party size, date, which stay type) needed to give a useful answer. This spec adds that conversational intake and extends availability-checking to cover all four stay types, including the cross-date `STRAIGHT_PM` case.

**Non-goal (unchanged from the original design):** still no booking creation or modification through chat. This remains intake + availability-checking only; the guest finalizes the actual reservation through the existing process.

## Booking system data model (recap)

A `STRAIGHT` stay has no dedicated representation in the booking system — it's recorded as two separate slot docs (one `DAY`, one `NIGHT`) that happen to be consecutive. A `NIGHT` slot's `date` field is the date the evening starts (e.g. a doc dated `2026-06-10` with `type: "NIGHT"` represents 7pm on the 10th through 7am on the 11th). This means:

- `STRAIGHT_AM` (9am(D)–7am(D+1)) = `DAY(D)` + `NIGHT(D)` — same calendar date, no cross-date query.
- `STRAIGHT_PM` (7pm(D)–5pm(D+1)) = `NIGHT(D)` + `DAY(D+1)` — spans two calendar dates.

Resolving `STRAIGHT_PM` requires computing `D+1` and querying both dates. This date arithmetic is done in code (a shared `addDays` utility), not left to the model — the same class of bug just fixed for "tomorrow" (the model has no reliable way to do date math itself; see the prior spec's date-resolution fix).

**Status rule (unchanged, carries through to all four stay types):** a slot is occupied for any status other than `CANCELLED` — this includes `PENDING`, `BOOKED`, and `PENCIL` (a tentative hold). `PENCIL`/`PENDING` are not treated as "still available" just because no payment or final confirmation happened yet. `getSlotAvailability` already enforces this rule (fixed in the prior availability-lookup work after `PENCIL` was found to be missed), and because every `STRAIGHT_AM`/`STRAIGHT_PM` check is built directly on top of `getSlotAvailability`, this rule automatically applies to the combined stay types too — a `PENCIL`'d `DAY` slot blocks `STRAIGHT_AM` exactly like a `BOOKED` one would, with no separate logic needed.

## Architecture

```
Guest signals booking intent ("I want to book Pool 1")
   │
   ▼
Leya (system prompt) asks for: pax count, date, stay type
   │  (if guest says "straight" without AM/PM, asks which)
   ▼
checkAvailability({ poolName, date, stayType })
   │
   ▼
api/_lib/checkAvailabilityTool.ts
   │  resolveStayTypeAvailability(stayType, poolName, date)
   │    DAY/NIGHT        → one getSlotAvailability(date) call
   │    STRAIGHT_AM      → one getSlotAvailability(date) call (both fields)
   │    STRAIGHT_PM      → getSlotAvailability(date) [night] +
   │                       getSlotAvailability(addDays(date, 1)) [day]
   ▼
{ poolName, date, stayType, available: "available" | "booked" }
   │
   ▼
Leya compares pax to the pool's capacity (already in the prompt)
   │  and reports availability + any capacity concern, then directs
   │  the guest to the actual reservation process to finalize
```

## Components

### New: `api/_lib/dateUtils.ts`

- `getResortTodayDate(): string` — moved out of `buildSystemPrompt.ts` (no behavior change, just relocated since `checkAvailabilityTool.ts` now also needs resort-local date logic alongside it).
- `addDays(dateStr: string, days: number): string` — given a `YYYY-MM-DD` string, returns the date `days` later, also as `YYYY-MM-DD`. Implemented via UTC-based `Date` arithmetic (parsing as `${dateStr}T00:00:00Z`, adding `days * 86400000` ms, formatting back with `toISOString().slice(0, 10)`) so it's never affected by the server's local timezone or DST — this is pure calendar-date math, not a wall-clock computation.

### `api/_lib/checkAvailabilityTool.ts` (restructured)

- **Input schema:** adds a required `stayType: z.enum(["DAY", "NIGHT", "STRAIGHT_AM", "STRAIGHT_PM"])`. Required (not optional/defaulted) — the model must have an explicit stay type before calling the tool, which is exactly the detail-gathering behavior the system prompt now enforces.
- **`getSlotAvailability(poolName, date): Promise<{ day: AvailabilityStatus; night: AvailabilityStatus }>`** — the existing Firestore query + pool-name-matching + day/night derivation logic from the current implementation, extracted as a named function but otherwise unchanged (same `slots` collection query, same `poolNameFromField` matching, same "anything but CANCELLED is booked" rule).
- **`resolveStayTypeAvailability(stayType, poolName, date): Promise<AvailabilityStatus>`**:
  - `"DAY"` → `(await getSlotAvailability(poolName, date)).day`
  - `"NIGHT"` → `(await getSlotAvailability(poolName, date)).night`
  - `"STRAIGHT_AM"` → fetch once for `date`; `"booked"` if either `day` or `night` is `"booked"`, else `"available"`
  - `"STRAIGHT_PM"` → fetch `getSlotAvailability(poolName, date)` for the `night` field and `getSlotAvailability(poolName, addDays(date, 1))` for the `day` field; `"booked"` if either is `"booked"`, else `"available"`
- **The exported `tool({...})`**: validates input (via the existing Zod schema, now including `stayType`), calls `resolveStayTypeAvailability`, and returns `{ poolName, date, stayType, available }`. On a Firestore error from either underlying call, catches and returns the existing `{ poolName, date, error: "Unable to check availability right now." }` shape (unchanged from the current implementation). No `note` field for the "no matching docs" case is needed anymore for STRAIGHT_AM/PM, since `getSlotAvailability` already returns `"available"` (not an error) when there are no matching docs — same as today.

### `api/_lib/buildSystemPrompt.ts`

- Replace the local `getResortTodayDate` definition with `import { getResortTodayDate } from "./dateUtils";` — no other change to existing behavior.
- New section appended after the existing "Today's date is..." instruction:

  ```
  ## Booking Types & Hours
  Day: 9:00 AM – 5:00 PM (same day)
  Night: 7:00 PM – 7:00 AM (the next day)
  Straight AM: 9:00 AM – 7:00 AM (the next day) — combined day + night
  Straight PM: 7:00 PM – 5:00 PM (the next day) — combined night + day

  When a guest signals they want to book (not just asking about rates), ask for: how many guests (pax), the date, and which stay type (day, night, or straight). If they say "straight" without specifying morning or evening, ask which — Straight AM (9am–7am) or Straight PM (7pm–5pm) — before checking availability. Once you have date and stay type, call checkAvailability with the matching stayType ("DAY", "NIGHT", "STRAIGHT_AM", or "STRAIGHT_PM"). Compare the guest's pax count to the pool's capacity (see Current Pools & Rates above) and mention if the group exceeds it. After confirming availability, remind the guest this chat does not finalize the booking — direct them to the resort's actual reservation process to complete it.
  ```

  (Exact wording may be lightly adjusted during implementation for tone consistency with the rest of the prompt, but the content/instructions above must all be present.)

## Error handling

- Unchanged from the existing tool: Firestore failures are caught and returned as a structured `error` field, never thrown, so the model can tell the guest to contact the resort directly rather than crashing the response.
- `STRAIGHT_PM`'s two underlying `getSlotAvailability` calls are for independent dates, so they should run via `Promise.all` rather than sequentially — consistent with the rest of the codebase's style (`buildSystemPrompt.ts` already uses `Promise.all` for independent fetches).
- If `addDays` is given a `date` that already failed the existing `YYYY-MM-DD` regex validation, it's never reached — the Zod schema validates `date` before `execute` runs, same as today.

## Testing

Manual only, per project preference. Verify directly against real Firestore data (extending the approach already used for the availability-lookup feature):
- `DAY`/`NIGHT` stay types still return correct results for known booked/open dates (regression check after the restructure).
- `STRAIGHT_AM` on a date with an existing DAY or NIGHT booking correctly reports `"booked"`.
- `STRAIGHT_PM` on a date where the *next* day's DAY slot is booked (even though the given date's NIGHT slot is open) correctly reports `"booked"` — this is the key case proving the cross-date logic works.
- Full conversational flow through `api/chat.ts`: a guest says "I want to book Pool 1," confirm Leya asks for pax/date/stay-type rather than answering blind; a guest says "straight" without AM/PM, confirm Leya asks which.

## Out of scope

- Actually creating or modifying a reservation through chat (unchanged non-goal).
- Pricing/quoting the straight-rate total (the existing pool data only has separate day/night rates; combining them into a "straight rate" display is not requested here — the bot can state both component rates if asked, using existing data).
- Persisting any of the gathered intake details (pax/date/stay-type) beyond the conversation — no database write, no handoff record. The guest still has to provide these again through the real reservation channel.
