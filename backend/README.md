# CareerPilot AI Backend

## Phase
**8.7 — Interview + Career Tools APIs + Backend Persistence**

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

- `GET /api/interview/questions` — Select personalized interview questions based on mode (`QUICK`: 5Q, `STANDARD`: 10Q, `DEEP`: 15Q).
  - Uses authenticated user identity (`req.user.id`).
  - Matches 180-question catalog across 12 tech roles.

- `POST /api/interview/evaluate` — Evaluates user interview responses with 4-dimension scoring.
  - Multi-dimension scoring: Technical (35%), Problem Solving (30%), Communication (15%), Project Knowledge (20%).
  - Automatic weight redistribution when NO project questions are present: Technical (43.75%), Problem Solving (37.5%), Communication (18.75%), Project (0%). Total = 100%.
  - Uses SQL transactions (`BEGIN ... COMMIT / ROLLBACK`) to persist `interview_sessions` and `interview_responses`.

- `GET /api/interview/history` — Returns user's past scored interview sessions ordered by most recent first.

- `GET /api/career-tools/evidence` — Fetch manual portfolio evidence items for authenticated user.

- `POST /api/career-tools/evidence` — Save/update manual portfolio evidence with strict URL validation.
  - Validates `http://` / `https://` format for GitHub repo and live demo URLs.
  - No external web scraping or automated verification.

- `GET /api/career-tools/passport` — Dynamically aggregates user profile, readiness score, roadmap/projects summary, latest interview score from history, and portfolio evidence.

- `GET /api/roadmap` — Generate or fetch deterministic Phase 5 Learning Roadmap.
- `GET /api/projects` — Fetch personalized project recommendations and tracker state.
- `PATCH /api/projects/:id` — Update project status in user tracker.

## Package Commands
- `npm run start` — Start API server (`src/server.js`)
- `npm run dev` — Start API server in watch mode
- `npm run db:test` — Verify connection to TiDB Cloud / MySQL
- `npm run db:migrate` — Execute schema migrations (`001_initial_schema.sql`, `002_auth_sessions.sql`)
- `npm run db:seed:projects` — Seed 12-career curated project catalog into `project_catalog`
- `npm run db:seed:interview` — Seed 180-question catalog across 12 tech roles into `interview_questions`
- `npm run test:auth` — Execute 15-point automated authentication test suite
- `npm run test:profile` — Execute 20-point automated profile API test suite
- `npm run test:assessment` — Execute 16-point automated assessment test suite
- `npm run test:readiness` — Execute 20-point automated readiness test suite
- `npm run test:roadmap` — Execute 35-point automated roadmap API test suite
- `npm run test:projects` — Execute 39-point automated projects API test suite
- `npm run test:interview` — Execute 29-point automated interview API test suite
- `npm run test:career-tools` — Execute 24-point automated career tools API test suite

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
11. `interview_questions` — Master question bank (180 questions across 12 careers)
12. `interview_sessions` — Interview simulator sessions
13. `interview_responses` — Detailed interview responses and scores
14. `portfolio_evidence` — Portfolio evidence links and notes
15. `sessions` — Persistent server-side session store (`express-mysql-session`)

## Next Phase
**8.8 — Frontend → Backend Migration**

