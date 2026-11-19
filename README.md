# SaathiBus (साथी बस) - Every journey, for everyone

> Real-World Accessible Public Transit Platform for Passengers with Disabilities.
> Built adhering strictly to WCAG 2.2 AAA accessibility standards.

---

## 🌟 What is SaathiBus?

People with disabilities (blind, deaf, speech-impaired, wheelchair users, cognitive disabilities, seniors) face severe hurdles when trying to travel independently on public transit.

**SaathiBus** transforms government bus travel into a dignified, guaranteed service:
1. **Voice-First Navigation**: A blind user says *"Hey Bus, find bus to Salt Lake tomorrow at 9 AM"* and the app operates end-to-end by voice in English, Hindi, or Bengali.
2. **Nearest-Time Search Logic**: If no bus runs at the exact requested time, SaathiBus never strands the passenger. It automatically calculates and suggests the **nearest earlier** (e.g. 8:42 AM) and **nearest later** (e.g. 9:25 AM) accessible buses.
3. **Conductor Dispatch & Accountability**: Every booking alerts the bus conductor in real-time. The conductor must acknowledge the passenger's assistance needs (ramp deployment, boarding guidance, tactile stop announcements). Unacknowledged alerts escalate automatically to the central transit depot.
4. **Adaptive Accessibility Profiles**:
   - 🦯 **Blind / Low Vision**: Voice orb, high-contrast yellow on black, screen-reader optimized.
   - 🧏 **Deaf / Hard of Hearing**: Live visual captions, haptic alerts, no audio-only dependencies.
   - ♿ **Wheelchair / Mobility**: Automatic ramp confirmation, power chair width validation, wheelchair bay locking.
   - 🗣️ **Speech-Impaired / Non-Verbal**: Tap-only booking, AAC picture grid, "Speak for me" button.
   - 🧩 **Cognitive / Autism / Dyslexia**: Simple Mode (one question per screen), calm colors, OpenDyslexic font.

---

## 🏗️ Project Architecture

```
tryal/
├── backend/                  # Fastify + TypeScript + SQLite + Gemini API
│   ├── src/
│   │   ├── server/           # Fastify server, CORS, error handling
│   │   ├── db/               # SQLite schema & Kolkata transit seed
│   │   ├── services/
│   │   │   ├── search/       # Nearest-Time search algorithm (pure function)
│   │   │   ├── booking/      # Atomic booking engine & concurrency protection
│   │   │   ├── alerts/       # Conductor alert dispatch & SSE streams
│   │   │   ├── tracking/     # Live bus tracking simulator & delay handler
│   │   │   ├── assistant/    # Gemini voice assistant with resilient fallback
│   │   │   └── sos/          # Emergency SOS dispatch & concession verification
│   │   ├── routes/           # REST & SSE endpoints
│   │   └── tests/            # Vitest unit test suites & 26-case assistant harness
│   └── HANDOFF.md            # Backend status & documentation
│
├── frontend/                 # React 18 + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/       # VoiceOrb, Navbar, BottomNav, AccessibilityPanel, JudgeModePanel
│   │   ├── pages/            # 17 complete accessible screens
│   │   ├── features/         # Zustand stores (a11y, voice)
│   │   ├── mock/             # In-memory mock adapter for offline safety
│   │   └── styles/           # Tailwind CSS tokens & WCAG AAA contrast themes
│   └── HANDOFF.md            # Frontend status & documentation
│
└── docs/
    ├── openapi.yaml          # Complete OpenAPI 3.0 API Specification
    └── PROMPTS.md            # Master Competition Prompt Specifications
```

---

## 🚀 Quick Start Guide

### 1. Run the Backend
```bash
cd backend
npm install
npm run seed       # Seeds 12 Kolkata stops, routes, buses, and demo personas
npm test           # Runs all 27 unit tests (Nearest-time & Concurrency)
npm run test:assistant # Runs the 26-case multilingual voice assistant harness
npm run dev        # Starts backend API on http://localhost:4000
```

### 2. Run the Frontend
```bash
cd frontend
npm install
npm run dev        # Starts accessible UI on http://localhost:5173
```

---

## 🏆 3-Minute Judge Demo Script (Ctrl + J)

Press **Ctrl + J** anywhere in the frontend to open the **Judge Mode** panel.

| Time | Action | What Judges See & Hear |
| :--- | :--- | :--- |
| **0:00** | Landing Page | Tagline: *"Every journey, for everyone"*. Breathing gradient Voice Orb. |
| **0:20** | Persona **Asha (Blind)** | High-contrast yellow-on-black theme. Press Space or say *"Hey Bus, I want to travel from Esplanade to Salt Lake tomorrow at 9 AM"*. |
| **0:50** | **Nearest-Time Engine** | No bus at 9:00 AM. Assistant speaks and highlights: **Closest Before: 8:42 AM** (18 min earlier) & **Closest After: 9:25 AM** (25 min later). |
| **1:15** | Confirm Booking | Say *"the earlier one"* and *"confirm"*. Ticket pass generated with 6-char code (`8KG5QD`) and live status timeline. |
| **1:40** | **Conductor Screen** | Open `/conductor`. Real-time alert arrives: *"Stop Esplanade: Asha, blind, ramp assistance, guide dog"*. Tap **Acknowledge**. Passenger ticket updates in real time! |
| **2:10** | Persona **Rohan (Wheelchair)** | Top-down bus diagram. Select **Wheelchair Bay 1**. Width validation confirms motorized chair compatibility. |
| **2:35** | Persona **Meera (Deaf)** | Full visual captions and vibration cues. Conductor instructed: *"Light tap on shoulder, do not call out"*. |
| **2:50** | Persona **Dev (Cognitive)** | Simple Mode: One question per screen, calm colors, OpenDyslexic font. |

---

## 🔒 Security & Privacy by Design
- **No Medical Data Stored**: Only actionable assistance requirements (ramp, audio stop announcement) are passed to crew.
- **AES-256-GCM Encryption**: Emergency contacts and user notes are encrypted at rest.
- **Data Export & Deletion**: Fully compliant with `GET /api/me/export` and `DELETE /api/me`.
- **Zero Token Leakage**: Gemini API keys live strictly on the backend; the browser receives only structured intent replies.

---

## 📤 Pushing to GitHub

When ready to push to your GitHub account:
```bash
git add -A
git commit -m "feat: complete SaathiBus frontend and backend ready for competition"
gh repo create tryal --private --source=. --remote=origin --push
```
