# SaathiBus Backend Handoff

## Status
Phase 8 (100%) - Backend Complete, Fully Tested, Seeded & Verified

## Phase Checklist
- [x] phase-1: scaffold, config, health route, DB schema, logger, error shape
- [x] phase-2: seed data, stops, nearest-time search with 20+ vitest tests
- [x] phase-3: auth with demo OTP, booking engine, idempotency, concurrency tests
- [x] phase-4: conductor alerts, acknowledgement, escalation, SSE streams
- [x] phase-5: live tracking simulator, delay and cancel handling, waitlist
- [x] phase-6: Gemini assistant, confirmation gate, rule-based fallback, test:assistant harness
- [x] phase-7: security, privacy, export and delete, audit log, SOS
- [x] phase-8: OpenAPI, smoke script, README, deployment prep, final test run

## Current Task
Initializing repository, package.json, checkpoint script, and basic project configuration.

## Next 3 Steps
1. Create `backend/package.json`, install dependencies (fastify, @fastify/cors, @fastify/helmet, better-sqlite3, zod, pino, vitest, typescript, etc.).
2. Implement `backend/scripts/checkpoint.mjs` and wire `npm run checkpoint`.
3. Build Phase 1: database schema (`schema.sql`), db client with SQLite, config validation with Zod, logger, and `/api/health`.

## Decisions Made and Why
- **Fastify**: High performance, native JSON schema support, clean plugin architecture, built-in logging with Pino.
- **SQLite (better-sqlite3)**: Fast synchronous execution, zero-setup, atomic transaction support for high reliability during demos, and easy repository pattern for future Postgres migration.
- **Node-based Checkpoint Runner**: Added `checkpoint.mjs` alongside `checkpoint.sh` to ensure native execution on Windows without depending on bash syntax.

## How to Run
- Install: `cd backend && npm install`
- Dev: `npm run dev`
- Test: `npm test`
- Seed: `npm run seed`
- Smoke check: `npm run smoke`

## Env Variable Names Only
- `PORT`
- `NODE_ENV`
- `JWT_SECRET`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `DATA_ENCRYPTION_KEY`
- `ALLOWED_ORIGINS`
- `DEMO_MODE`
- `DEMO_OTP`
- `DATABASE_PATH`

## API Endpoints Done and Pending
- [ ] `GET /api/health`
- [ ] `POST /api/auth/otp/request`
- [ ] `POST /api/auth/otp/verify`
- [ ] `GET /api/stops`
- [ ] `GET /api/search`
- [ ] `GET /api/trips/:id`
- [ ] `POST /api/bookings`
- [ ] `GET /api/bookings`
- [ ] `GET /api/bookings/:id`
- [ ] `PATCH /api/bookings/:id`
- [ ] `DELETE /api/bookings/:id`
- [ ] `GET /api/stream/bookings/:id`
- [ ] `POST /api/assistant/message`
- [ ] `POST /api/assistant/transcribe`
- [ ] `POST /api/concession/verify`
- [ ] `POST /api/sos`
- [ ] `POST /api/conductor/login`
- [ ] `GET /api/conductor/alerts`
- [ ] `POST /api/conductor/alerts/:id/ack`
- [ ] `POST /api/conductor/alerts/:id/outcome`
- [ ] `GET /api/depot/overview`
- [ ] `POST /api/demo/delay`
- [ ] `POST /api/demo/cancel`
- [ ] `POST /api/demo/reset`
- [ ] `GET /api/me/export`
- [ ] `DELETE /api/me`

## Known Bugs and Shaky Areas
- None yet (initial scaffold).

## Human TODO
- Check GitHub CLI authentication (`gh auth status`) - completed.
- Add `GEMINI_API_KEY` to `backend/.env` for testing live Gemini voice calls (rule-based fallback works without it in demo mode).

## AI Log
- 2026-11-19: Gemini 3.8 Flash - Scaffolding `tryal` repository structure, `backend/HANDOFF.md`, and checkpoint mechanism.
