# SaathiBus Frontend Handoff

## Status
fe-phase-8 (100%) - Complete Accessible Frontend, Tested, PWA-Ready, Mock Adapter & Live Backend Compatible

## Phase Checklist
- [x] fe-phase-1: Vite + React + TypeScript + Tailwind scaffold, design tokens, themes, Accessibility floating panel, i18n
- [x] fe-phase-2: API types, mock adapter with seeded Kolkata data, TanStack Query client, Zustand stores
- [x] fe-phase-3: landing page, onboarding, home with the interactive breathing voice orb
- [x] fe-phase-4: results with nearest-time logic, bus detail and seat picker, assistance and review screens
- [x] fe-phase-5: voice assistant state machine, wake phrase ("Hey Bus"), captions, confirmation gate, Simple mode
- [x] fe-phase-6: ticket, live status timeline, tracking, My Trips, delay and cancel handling, SOS
- [x] fe-phase-7: conductor view, depot view, Judge mode (Ctrl+J), Settings, Help
- [x] fe-phase-8: PWA, axe and keyboard pass, tests, README, live backend connection

## Screen Checklist (All 17 Screens Complete)
- [x] 1. Landing page (for judges: hero, tagline, live voice orb demo, 3-step how it works, persona preview cards, nearest-time demo)
- [x] 2. Onboarding: language, accessibility profile selection cards, emergency contact, consent
- [x] 3. Home: giant voice orb, From/To stop autocomplete, date/time picker, quick cards, saved places, SOS button
- [x] 4. Results with Nearest-Time Cards (Requested time pinned, "No bus at 9:00 AM. Here are closest options", 2 highlighted cards, badges)
- [x] 5. Bus detail & Seat Picker (interactive top-down bus layout with wheelchair bays, companion seats, list view toggle)
- [x] 6. Assistance & Details (ramp, boarding guidance, stop announcements, guide dog, conductor preview)
- [x] 7. Review & Confirm (spoken read-back, confirmation gate, calm non-flashing confirmation)
- [x] 8. Ticket (QR code, 6-char code, live status timeline via SSE/polling)
- [x] 9. Live Tracking (SVG route line with bus marker and ETA)
- [x] 10. My Trips (upcoming, past, cancel, reschedule, rebook)
- [x] 11. Delay / Cancellation Handling (alerts & one-tap rebooking)
- [x] 12. SOS (press & hold / voice, sends trip + emergency alert)
- [x] 13. Conductor Dashboard (`/conductor`): login with bus & shift code (1234), stop passenger list, sound/visual alert, Acknowledge button, boarding done / no-show
- [x] 14. Depot View (`/depot`): overview of buses, alerts, escalations
- [x] 15. Settings: accessibility, language, privacy, data export/delete
- [x] 16. Help: 60-second guided tour, voice commands list, keyboard shortcuts dialog
- [x] 17. Judge Mode (Ctrl+J floating panel): switch between Asha, Rohan, Meera, Dev personas, trigger delay, trigger conductor alert, reset data

## Decisions Made and Why
- **Dual Mode Connectivity**: Added robust automatic fallback so the frontend works with the live backend (`VITE_USE_MOCK=false`) AND can fall back to the in-memory mock adapter if offline, ensuring stage demos never crash.
- **Atkinson Hyperlegible Font**: Used as primary font with OpenDyslexic toggle for maximum cognitive and visual legibility.
- **WCAG 2.2 AAA Contrast**: Custom high-contrast theme (pure yellow on black) ensures maximum accessibility for low-vision users.

## How to Run
- Install: `npm install`
- Dev server: `npm run dev` (starts on `http://localhost:5173`)
- Build: `npm run build`
- Unit tests: `npm test`

## Env Variable Names Only
- `VITE_API_BASE_URL`
- `VITE_USE_MOCK`

## Human TODO
- To push everything to GitHub:
  1. `git add -A`
  2. `git commit -m "feat: complete SaathiBus frontend and backend with nearest-time search, voice assistant, and conductor dispatch"`
  3. `gh repo create tryal --private --source=. --remote=origin --push`
