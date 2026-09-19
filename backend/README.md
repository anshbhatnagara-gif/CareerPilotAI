# CareerPilot AI Backend

## Phase
**8.6 — Roadmap + Projects APIs + Backend Persistence**

## Stack
- **Runtime:** Node.js
- **Framework:** Express.js (JavaScript)
- **Database Driver:** `mysql2/promise` (Connection pool with TLS v1.2)
- **Authentication & Security:**
  - `bcrypt` (12 rounds password hashing)
  - `express-session` + `express-mysql-session` (Persistent HTTP-only cookie session store)
  - `express-validator` (Strict input validation & normalization)
  - `express-rate-limit` (Route-specific brute-force rate limiting)
  - `cors` (Credentials-enabled CORS configured for `FRONTEND_URL`)
  - `helmet` (HTTP security headers)

## Core API Endpoints
All protected endpoints require active session authentication (`requireAuth` middleware):

- `GET /api/roadmap` — Generate or fetch deterministic Phase 5 Learning Roadmap.
  - Requires a completed profile with target career and readiness analysis.
  - Generates 5 stages (`FOUNDATION`, `CORE SKILLS`, `DEVELOPMENT DEPTH`, `ADVANCED / SPECIALIZATION`, `JOB PREPARATION FOUNDATION`) across 12 tech roles.
  - Maps prerequisite graphs, deterministic effort estimates (`3–5h`, `6–10h`, `10–20h`, `20–30h`), and stage milestones.
  - Uses double fingerprinting (`profileFingerprint` and `readinessFingerprint`) for caching and change detection.
  - Persists instances and items in `roadmap_instances` and `roadmap_items` via database transactions.

- `GET /api/projects` — Fetch personalized project recommendations and tracker state.
  - Evaluates missing skills and roadmap upcoming skills against 12-career project catalog.
  - Dynamically personalizes `whyThisProject` and boosts priorities (`HIGH` / `MEDIUM` / `LOW`).
  - Merges tracker state from `user_projects` (`NOT_STARTED` | `IN_PROGRESS` | `COMPLETED`).
  - Uses triple fingerprinting (`profileFingerprint`, `readinessFingerprint`, `roadmapFingerprint`).

- `PATCH /api/projects/:id` — Update project status in user tracker.
  - Body payload: `{ "status": "IN_PROGRESS" }` (allowed: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`).
  - Updates `user_projects` table for authenticated user, setting `started_at` and `completed_at` timestamps.
  - Preserves user isolation and does NOT alter user profile skills.

## Package Commands
- `npm run start` — Start API server (`src/server.js`)
- `npm run dev` — Start API server in watch mode
- `npm run db:test` — Verify connection to TiDB Cloud / MySQL
- `npm run db:migrate` — Execute schema migrations (`001_initial_schema.sql`, `002_auth_sessions.sql`)
- `npm run db:seed:projects` — Seed 12-career curated project catalog into `project_catalog`
- `npm run test:auth` — Execute 15-point automated authentication test suite
- `npm run test:profile` — Execute 20-point automated profile API test suite
- `npm run test:assessment` — Execute 16-point automated assessment test suite
- `npm run test:readiness` — Execute 20-point automated readiness test suite
- `npm run test:roadmap` — Execute 35-point automated roadmap API test suite
- `npm run test:projects` — Execute 39-point automated projects API test suite

## Database Schema Tables
1. `users` — User credentials (`fullName` and `email` canonical identity source)
2. `profiles` — User profile details (1-to-1 with users)
3. `profile_skills` — User skill list
4. `profile_interests` — User interest list
5. `assessment_reports` — Phase 3 assessment outputs & fingerprints
6. `readiness_reports` — Phase 4 readiness analysis & fingerprints
7. `roadmap_instances` — Phase 5 roadmap metadata
8. `roadmap_items` — Phase 5 roadmap action items
9. `project_catalog` — Master project catalog across 12 tech roles
10. `user_projects` — User project tracking state
11. `interview_questions` — Master question bank
12. `interview_sessions` — Interview simulator sessions
13. `interview_responses` — Detailed interview responses and scores
14. `portfolio_evidence` — Portfolio evidence links and notes
15. `sessions` — Persistent server-side session store (`express-mysql-session`)

## Next Phase
**8.7 — Interview + Career Tools APIs**
