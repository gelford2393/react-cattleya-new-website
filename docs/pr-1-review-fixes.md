# PR #1 — AI Chatbot Widget: Review Findings & Fix Plan

Branch: `feat/ai-chatbot` (no deploy until lahat ng items dito ay tapos na)
PR: https://github.com/gelford2393/react-cattleya-new-website/pull/1

Itong file ang tracker natin habang tinatapos natin ang mga issues na nahuli sa
code review. Tatackle natin nang isa-isa, top to bottom (pinaka-malala muna).
I-check off (`[x]`) kapag tapos, at sulat ng one-liner kung paano na-fix.

---

## 1. [x] Stub `checkAvailability` tool ay "nagsisinungaling" sa guests

- **File:** `api/_lib/checkAvailabilityTool.ts`, `api/chat.ts`
- **Problema:** Lagi `available: true` ang sagot, kahit hindi totoong booking
  check. Naka-wire na ito sa production chat tool list, at sinasabi sa LLM na
  "gamitin mo ito kapag tinanong ka ng availability."
- **Bakit mahalaga:** Guest-facing — pwedeng sabihan ng bot ang guest na
  "available" ang isang pool na hindi pala totoo, masisira tiwala sa resort.
- **Plano:** Alisin muna ang tool sa `tools: {}` list sa `api/chat.ts` hanggang
  hindi pa kumpirmado ang Firestore schema para sa totoong availability check.
  Optional: panatilihin ang file pero huwag i-wire, may TODO comment.
- **✅ NAGAWA:** Tinanggal ang `tools` block + import sa `chat.ts`. Pinanatili
  ang `checkAvailabilityTool.ts` file na may dagdag na ⚠️ warning comment na
  "NOT CURRENTLY WIRED." Dinagdagan din ng docstring ang `POST` handler na
  nagpapaliwanag bakit hindi naka-wire ang tool.

## 2. [x] Tahimik na nag-faifail ang Supabase error handling

- **File:** `api/_lib/buildSystemPrompt.ts` (fetchPools, fetchCmsPage)
- **Problema:** `console.warn` lang tapos tuloy-tuloy, hindi consistent sa
  ibang services (`poolServices.ts`, `cmsServices.ts` — `throw` sila).
- **Bakit mahalaga:** Kung sumira ang Supabase connection, walang malalaman
  ang sinuman — tahimik lang sasabihin sa lahat ng guest na "no data
  available."
- **Plano:** Panatilihin ang graceful fallback (hindi natin gustong bumagsak
  ang buong chat kung walang CMS data), pero dagdagan ng mas malinaw na
  logging/structured error na pwedeng ma-monitor (hal. tag bilang
  `[chat:critical]` para madaling hanapin sa logs).
- **✅ NAGAWA:** Pinalitan ang `console.warn` → `console.error` na may
  `[chat:critical]` tag sa `fetchPools` at `fetchCmsPage`. Pinanatili ang
  graceful fallback (deliberate — para hindi bumagsak ang chat), pero
  ipinaliwanag sa docstrings kung bakit ganito ang desisyon.

## 3. [x] `buildSystemPrompt()` tumatakbo sa bawat message, walang caching

- **File:** `api/chat.ts`, `api/_lib/buildSystemPrompt.ts`
- **Problema:** 4 Supabase queries bawat chat message (kahit follow-up lang),
  walang caching layer.
- **Bakit mahalaga:** Latency at DB cost, lumalala habang humahaba ang
  conversation. Alam na ito ng PR description bilang "deferred", pero dapat
  may plano.
- **Plano:** Follow-up item — hindi kailangan ayusin bago i-deploy ito, pero
  ilista bilang known limitation. (Pwedeng gawing separate ticket/PR.)
- **✅ NAGAWA (bilang documented limitation):** Pinalakas ang docstring ng
  `buildSystemPrompt()` — malinaw nang nakasaad na "KNOWN LIMITATION (deferred
  follow-up)," kasama ang cost at ang suggested fix (short-TTL cache). Walang
  code change pa — sinadya, follow-up PR ito kapag lumaki na ang traffic.

## 4. [x] `DefaultChatTransport` ginagawa ulit kada render

- **File:** `src/components/public/shared/ChatWidget/ChatWidget.tsx:19`
- **Problema:** `new DefaultChatTransport({...})` nasa loob ng component body,
  bagong instance kada render.
- **Bakit mahalaga:** Walang dahilan magbago ang config nito — sayang lang na
  paulit-ulit gawin.
- **Plano:** Ilipat sa module scope (sa labas ng component) dahil static
  naman ang config.
- **✅ NAGAWA:** Inilipat ang `chatTransport` sa module scope (sa labas ng
  component), isang beses na lang ginagawa. May docstring kung bakit.

## 5. [x] Duplicate na Supabase client setup

- **Files:** `api/_lib/supabaseServer.ts` vs `src/lib/supabase.ts`
- **Problema:** Pareho silang gumagawa ng client gamit parehong URL/key, iba
  lang env access (`process.env` vs `import.meta.env`).
- **Bakit mahalaga:** Minor lang — pero kung wala tayong comment na
  nagpapaliwanag bakit dalawa ito, baka isipin ng susunod na babasa na
  "mistake" ito.
- **Plano:** Dagdagan ng comment sa `supabaseServer.ts` na nagpapaliwanag
  bakit hiwalay siya sa client-side client (Node serverless vs Vite client
  env access).
- **✅ NAGAWA NA NOON:** May malinaw nang comment sa `supabaseServer.ts`
  (lines 10–18) na nagpapaliwanag bakit hiwalay — `process.env` (Node) vs
  `import.meta.env` (Vite client). Walang dagdag na kailangan.

## 6. [x] Kulang sa docstrings (CLAUDE.md: "Code comments: Heavy")

- **Files:** `api/_lib/buildSystemPrompt.ts` (fetchPools, fetchCmsPage,
  formatPool), `ChatWidget.tsx` (component + handlers)
- **Problema:** Walang docstring, hindi consistent sa ibang functions sa
  parehong file (`buildSystemPrompt()`, `stripHtml()` may docstring naman).
- **Plano:** Dagdagan ng short docstring sa bawat function — ano ang ginagawa
  at bakit (lalo na ang error-handling behavior nila — silent fallback vs
  throw).
- **✅ NAGAWA:** Dinagdagan ng docstring ang `fetchPools`, `fetchCmsPage`,
  `formatPool` (buildSystemPrompt.ts) at ang `ChatWidget` component +
  `handleSubmit` / `handleSuggestedPrompt` handlers + ang `chatTransport`
  module constant.

---

## Status: lahat ng 6 items ✅ — na-verify ang TypeScript build (`tsc -b`
para sa `src`, at standalone `tsc --noEmit` para sa `api/`, parehong exit 0).
Hindi pa naka-deploy, gaya ng usapan.

---

## Wala nang issue (na-verify na tama, hindi na kailangan ayusin)

- `vercel.json` routing fix (`/api/*` exclusion sa SPA catch-all) — tama.
- TinyMCE `licenseKey` migration — tama, sinusunod ang bagong API.
- `message.parts` rendering sa `ChatWidget.tsx` — safe, may type guard na.
