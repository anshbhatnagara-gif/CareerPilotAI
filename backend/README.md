# CareerPilot AI Backend

## Phase
**8.5 — Assessment + Readiness APIs + Backend Persistence**

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

## Assessment & Readiness Endpoints
All endpoints require active session authentication (`requireAuth` middleware):

- `GET /api/assessment` — Generate or fetch deterministic Phase 3 Career Assessment report.
  - Requires a completed profile.
  - Generates deterministic strengths, current skills, focus areas, career advice, and qualitative confidence level (`HIGH` | `MODERATE` | `LOW`).
  - Persists result in `assessment_reports` with profile fingerprint (`fp_<hash>`) change detection.

- `GET /api/readiness` — Generate or fetch deterministic Phase 4 Career Readiness & Skill Gap report.
  - Requires a completed profile with a valid `targetCareer`.
  - Evaluates profile against exact requirement specifications for 12 career roles.
  - Applies conservative skill normalization rules (e.g. `Git`, `GitHub`, `MySQL` -> `SQL`, `Node.js` -> `Backend Development`).
  - Calculates weighted score (0–100) using `HIGH = 3`, `MEDIUM = 2`, `LOW = 1` priority weights.
  - Maps score to 5 status tiers (`JOB-READY FOUNDATION`, `STRONG FOUNDATION`, `DEVELOPING`, `EARLY STAGE`, `STARTING POINT`).
  - Persists report in `readiness_reports` with fingerprint (`fp_readiness_<hash>`) change detection.

## Package Commands
- `npm run start` — Start API server (`src/server.js`)
- `npm run dev` — Start API server in watch mode
- `npm run db:test` — Verify connection to TiDB Cloud / MySQL
- `npm run db:migrate` — Execute schema migrations (`001_initial_schema.sql`, `002_auth_sessions.sql`)
- `npm run test:auth` — Execute 15-point automated authentication test suite
- `npm run test:profile` — Execute 20-point automated profile API test suite
- `npm run test:assessment` — Execute 16-point automated assessment test suite
- `npm run test:readiness` — Execute 20-point automated readiness test suite

## Database Schema Tables
1. `users` — User credentials (`fullName` and `email` canonical identity source)
2. `profiles` — User profile details (1-to-1 with users)
3. `profile_skills` — User skill list
4. `profile_interests` — User interest list
5. `assessment_reports` — Phase 3 assessment outputs & fingerprints
6. `readiness_reports` — Phase 4 readiness analysis & fingerprints
7. `roadmap_instances` — Phase 5 roadmap metadata
8. `roadmap_items` — Phase 5 roadmap action items
9. `project_catalog` — Master project catalog
10. `user_projects` — User project tracking state
11. `interview_questions` — Master question bank
12. `interview_sessions` — Interview simulator sessions
13. `interview_responses` — Detailed interview responses and scores
14. `portfolio_evidence` — Portfolio evidence links and notes
15. `sessions` — Persistent server-side session store (`express-mysql-session`)

## Next Phase
**8.6 — Roadmap + Projects APIs**
