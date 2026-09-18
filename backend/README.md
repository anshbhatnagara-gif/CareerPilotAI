# CareerPilot AI Backend

## Phase
**8.3 — Authentication + Security Foundation**

## Stack
- **Runtime:** Node.js
- **Framework:** Express.js (JavaScript)
- **Database Driver:** `mysql2/promise` (Connection pool with TLS v1.2)
- **Authentication & Security:**
  - `bcrypt` (12 rounds password hashing)
  - `express-session` + `express-mysql-session` (Persistent HTTP-only cookie-based session store)
  - `express-validator` (Strict input validation & normalization)
  - `express-rate-limit` (Route-specific brute-force rate limiting)
  - `cors` (Credentials-enabled CORS configured for `FRONTEND_URL`)
  - `helmet` (HTTP security headers)

## Authentication Routes
- `POST /api/auth/register` — Register a new user (`fullName`, `email`, `password`) -> Returns `201 Created` with safe user object.
- `POST /api/auth/login` — Authenticate user credentials & create secure session -> Returns `200 OK` with safe user object.
- `POST /api/auth/logout` — Destroy session & clear HTTP-only cookie -> Returns `200 OK`.
- `GET /api/auth/me` — Retrieve active user details (Protected by `requireAuth`) -> Returns `200 OK`.
- `GET /api/auth/protected-test` — Protected development verification route -> Returns `200 OK` (or `401 Unauthorized`).

## Health & Monitoring Endpoints
- `GET /api/health` — API service availability check
- `GET /api/health/db` — Database connectivity check (`SELECT 1`)

## Package Commands
- `npm run start` — Start API server (`src/server.js`)
- `npm run dev` — Start API server in watch mode
- `npm run db:test` — Verify connection to TiDB Cloud / MySQL
- `npm run db:migrate` — Execute schema migrations (`001_initial_schema.sql`, `002_auth_sessions.sql`)
- `npm run test:auth` — Execute 15-point automated authentication test suite

## Database Schema Tables
1. `users` — User credentials and account status (`password_hash` only, zero plaintext password columns)
2. `profiles` — User profile details
3. `profile_skills` — User skill list
4. `profile_interests` — User interest list
5. `assessment_reports` — Phase 3 assessment outputs
6. `readiness_reports` — Phase 4 readiness analysis
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
**8.4 — Profile APIs**
