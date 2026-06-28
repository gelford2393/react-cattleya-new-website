# Chatbot Availability Lookup — Real Firestore Wiring

Date: 2026-06-25

## Background

The AI chatbot design (`2026-06-23-ai-chatbot-design.md`) planned a `checkAvailability` tool so the assistant can answer "is pool X free on date Y" using live data from the resort's separate booking system (`cattleyaresort-react`, a Firebase/Firestore app). That tool was stubbed out (`api/_lib/checkAvailabilityTool.ts`) and deliberately left unwired — it always returns mock "available" data and is not registered in `api/chat.ts`'s `tools` option, because exposing fake availability to real guests would be worse than not answering at all.

This spec resolves the original design's open question (the booking system's actual Firestore schema) and completes the wiring: replace the mock body with a real Firebase Admin SDK query, and register the tool in `api/chat.ts`.

**Non-goal (unchanged from the original design):** no booking creation or modification through chat. This is availability lookup only — guests still book through the existing process.

## Booking system schema (confirmed)

From `cattleyaresort-react/src/lib/mutations.ts` and `src/store/useAppStore.ts`:

- Collection: `slots`
- Doc ID: `{bookingDate}_{pool}_{type}` (e.g. `2026-07-04_01-Corazon_DAY`)
- Fields: `pool` (string, e.g. `"01-Corazon"` — zero-padded number + name), `type` (`"DAY" | "NIGHT"`), `date` (string `YYYY-MM-DD`), `status` (`"PENDING" | "BOOKED" | "CANCELLED"`), plus `bookingNo`/`bookingDocId`.
- A slot is taken if a doc exists for that date+pool+type with `status` of `PENDING` or `BOOKED`. `CANCELLED` (or no doc at all) means available.
- `firestore.rules` denies all client reads/writes (`allow read, write: if false`) — access must go through the Firebase Admin SDK server-side, never the browser SDK.

The chatbot only knows the guest's pool by name (e.g. "Corazon"), grounded from the website's own Supabase `pools` table (`pool_number`, `name`). There's no shared ID between the two systems, so pool resolution happens by string-matching at query time (see Architecture).

## Architecture

```
Guest asks chatbot about availability
   │
   ▼
api/chat.ts → streamText() with `checkAvailability` tool registered
   │
   ▼
api/_lib/checkAvailabilityTool.ts
   │  execute({ poolName, date })
   ▼
api/_lib/firebaseAdmin.ts (new)
   │  Admin SDK app, initialized once from FIREBASE_SERVICE_ACCOUNT_KEY
   ▼
Firestore (cattleyaresort-react project) → query `slots` where date == date
   │  filter docs in code: strip "NN-" prefix from `pool`, case-insensitive
   │  match the remaining name against poolName
   ▼
Return { poolName, date, day: "available"|"booked", night: "available"|"booked" }
```

### `api/_lib/firebaseAdmin.ts` (new)

- Initializes a Firebase Admin SDK app as a module-level singleton (guarded so repeated serverless invocations / hot reloads don't re-initialize).
- Reads `FIREBASE_SERVICE_ACCOUNT_KEY` from `process.env` — a base64-encoded JSON service account key (same pattern as the original design doc proposed). Decoded and passed to `admin.credential.cert(...)`.
- Throws a clear error at module load if the env var is missing, matching the existing `supabaseServer.ts` pattern (`if (!supabaseUrl || !supabaseAnonKey) throw ...`).
- Exports a `Firestore` instance (`getFirestore(app)`).

### `api/_lib/checkAvailabilityTool.ts` (rewrite)

- Keeps the existing `tool({ description, inputSchema, execute })` shape and input schema (`poolName: string`, `date: string` in `YYYY-MM-DD`).
- `execute`:
  1. Query `slots` where `date == date` (single Firestore query, not per-pool).
  2. For each returned doc, derive the pool's name portion by splitting `pool` on the first `-` and discarding the numeric prefix (e.g. `"01-Corazon"` → `"Corazon"`).
  3. Case-insensitively compare that name against the guest's `poolName` (`includes` match in both directions to tolerate partial phrasing, e.g. guest says "Corazon pool").
  4. For matching docs, track `DAY`/`NIGHT` status: `"booked"` if any matching doc for that type has `status` `PENDING` or `BOOKED`; otherwise `"available"`.
  5. Return `{ poolName, date, day, night }`.
- On Firestore query failure (bad credentials, network issue, wrong project config): catch the error, log it server-side, and return `{ poolName, date, error: "Unable to check availability right now." }` instead of throwing — so the model can tell the guest to contact the resort directly rather than the whole chat response failing.
- If no pool name in the system matches `poolName` at all (guest mentioned a pool that doesn't exist): return `{ poolName, date, day: "available", night: "available", note: "No existing reservations found for this pool/date." }` — absence of any matching doc is indistinguishable from "no bookings yet," which is correctly available, not an error.

### `api/chat.ts`

- Add `tools: { checkAvailability: checkAvailabilityTool }` to the `streamText(...)` call.
- Remove the comment block explaining why the tool is *not* wired in (no longer accurate) — replace with a short note that the tool performs a live Firestore lookup against the separate booking project.

### Dependencies

- Add `firebase-admin` to `package.json` dependencies.

### Environment variable

- `FIREBASE_SERVICE_ACCOUNT_KEY` — base64-encoded JSON service account key for the `cattleyaresort-react` Firebase project, generated from Firebase Console → Project Settings → Service Accounts → Generate new private key. Server-side only (no `VITE_` prefix). Document in `.env.example` with a placeholder and instructions, matching the existing `GOOGLE_GENERATIVE_AI_API_KEY` comment style.
- The actual value is added directly to `.env.local` (gitignored) and to the Vercel project's environment variables for deployment — never pasted into chat or committed.

## Error handling

- Firestore query failure → tool returns an `error` field, model relays "unable to check right now, please contact us directly" — does not crash the chat response (matches the original design's stated behavior).
- Missing `FIREBASE_SERVICE_ACCOUNT_KEY` at module load → throws immediately with a clear message, surfaced in Vercel function logs (same as the existing Supabase env var check), rather than failing silently per-request.
- Pool name with no matches → treated as available, not an error (see above).

## Testing

- Manual verification only (per this session's "tests only when asked" preference): exercise the chat widget locally against the real Firestore project once the service account key is in `.env.local`, asking about a pool/date combination known to have an existing PENDING/BOOKED slot and one with none, confirming the tool's response matches Firestore state.

## Out of scope

- Booking creation/modification through chat (unchanged non-goal from the original design).
- Caching the Firestore query result (each tool call does a fresh query; no TTL cache layer, consistent with the rest of this codebase's "revisit if it becomes a real concern" approach).
- Changing the booking system (`cattleyaresort-react`) itself — this spec only touches the website repo.
