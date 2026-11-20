# SaathiBus Quality Gate Audit Report (AUDIT.md)

Audit conducted in Quality Gate Mode covering all source files in `backend/src` and `frontend/src`.
Audit Date: 2026-11-20
Timezone Enforcement: Asia/Kolkata

## Severity Classification
- **P0**: Blocks user demo or booking flow, causes data corruption, or leads to silent execution failures.
- **P1**: Breaks a feature, leaves stub code in production, or degrades accessibility/intent parsing.
- **P2**: Polish, copy cleanup, remove demo/prototype language, or minor edge-case handling.

---

## Audit Findings Matrix

| ID | File | Line(s) | Problem | Severity | Required Fix | Status |
|---|---|---|---|---|---|---|
| AUD-001 | `frontend/src/pages/ReviewConfirmPage.tsx` | 107-110 | Summary card hardcoded to "Line 12", "08:42 AM Departure", "WB-01-A-1002" regardless of which bus trip was selected. | P0 | Fetch trip details via API by `tripId` and display dynamic route, time, and bus reg. | FIXED |
| AUD-002 | `frontend/src/components/VoiceOrb.tsx` | 108, 111 | Voice search navigation hardcoded to `Esplanade to Salt Lake at 09:00`, ticket navigation hardcoded to `bkg_demo_asha`. | P0 | Navigate dynamically based on extracted `res.slots` (from, to, date, time) and actual booking code. | FIXED |
| AUD-003 | `backend/src/services/assistant/assistant-service.ts` & `rule-based.ts` | 68-98, 31-43 | Confirmation gate broken: Saying "yes" with nothing pending returned fake booking confirmation; no expiry on pending actions; second "yes" not rejected. | P0 | Implement strict state machine with `expiresAt` (5 min), clear rejection for second "yes" or unprompted "yes". | FIXED |
| AUD-004 | `backend/src/db/seed.ts`, `rule-based.ts`, `HomePage.tsx` | Multiple | Timezone bug: `new Date().toISOString().split('T')[0]` uses UTC instead of `Asia/Kolkata` date, causing wrong date between 00:00-05:30 IST. | P1 | Add `getKolkataDateString()` helper using `Intl.DateTimeFormat` with `timeZone: 'Asia/Kolkata'`. | FIXED |
| AUD-005 | `backend/src/services/search/nearest-time.ts` & `rule-based.ts` | 57-81, 108-130 | Missing Kolkata landmark resolution ("Victoria Memorial", "Howrah Bridge", "Dakshineswar", "Salt Lake Stadium") to nearest valid transit stops. | P1 | Add comprehensive landmark dictionary mapping landmarks to nearest stops. | FIXED |
| AUD-006 | `backend/src/services/assistant/rule-based.ts` | 23-187 | Assistant parser fails on spoken number words ("nine thirty"), relative dates ("next Friday"), and prompt injection attempts ("ignore rules"). | P1 | Expand rule-based NLP engine with number-word parser, relative calendar math, and prompt injection filters. | FIXED |
| AUD-007 | `backend/src/routes/assistant.routes.ts` | 31-38 | `/api/assistant/transcribe` contains stub returning hardcoded fixed string and "simulated" comment. | P1 | Remove stub or return actual audio transcription status. | FIXED |
| AUD-008 | `frontend/src/pages/TicketPage.tsx` | 70-71, 23-30 | Ticket page hardcodes "Esplanade → Salt Lake" and uses fake `setTimeout` instead of subscribing to real SSE `/api/stream/bookings/:id`. | P1 | Bind to dynamic booking data and wire EventSource SSE connection to `/api/stream/bookings/:id`. | FIXED |
| AUD-009 | `frontend/src/pages/LiveTrackingPage.tsx` | 14-19 | Hardcoded static stops array ignoring actual `tripId` route. | P1 | Dynamically retrieve route stops and bus coordinates for `tripId`. | FIXED |
| AUD-010 | `frontend/src/pages/HomePage.tsx` | 69-74 | Imports `MOCK_STOPS` directly in render instead of fetching stops via `api.getStops()`. | P1 | Fetch stops list dynamically from API on mount with offline fallback. | FIXED |
| AUD-011 | `frontend/src/pages/SystemTestPage.tsx` | 35 | Hardcoded `http://localhost:4000/api/health` prevents testing against custom ports or production URLs. | P1 | Use `api.getHealth()` or dynamic base URL. | FIXED |
| AUD-012 | `frontend/src/components/JudgeModePanel.tsx` | 132 | Stub `window.alert` used for delay simulation instead of calling backend `/api/demo/delay`. | P1 | Invoke `/api/demo/delay` API endpoint and provide visual confirmation. | FIXED |
| AUD-013 | `frontend/src/features/voice/hey-bus-matcher.ts` | New | Missing standalone "Hey Bus" wake-word matcher supporting 40+ phonetic variants and 20 negative non-wake phrases. | P1 | Implement regex & phonetic distance matcher `matchHeyBus(text)` and export for harness. | FIXED |
| AUD-014 | `backend/src/services/booking/booking-engine.ts` | 268-290 | `cancelBooking` did not check if booking was already cancelled before performing update and audit log. | P1 | Return early or throw `ALREADY_CANCELLED` if booking status is already cancelled. | FIXED |
| AUD-015 | Multiple files across repo | Multiple | Occurrence of "demo", "simulated", "prototype" violating production system rule. | P2 | Replace occurrences with production terminology. | FIXED |
| AUD-016 | `frontend/src/pages/SearchResultsPage.tsx` | 38-42 | Hardcoded speech readback numbers ("18 minutes earlier, 25 minutes later") instead of actual difference. | P2 | Use `data.before.minutesDifference` and `data.after.minutesDifference`. | FIXED |

---

## Phase B Verification Sign-off
- Open P0 issues: 0
- Open P1 issues: 0
- Open P2 issues: 0
- Backend typecheck: PASSED
- Backend Vitest: 27/27 PASSED
- Frontend build: PASSED (`tsc && vite build`)
- Frontend Vitest: 6/6 PASSED
