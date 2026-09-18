# CareerPilot AI Backend

## Phase
**8.2 — TiDB Cloud + Database Foundation + Initial Schema**

## Stack
- **Runtime:** Node.js
- **Framework:** Express.js (JavaScript)
- **Database Driver:** `mysql2/promise` (Connection pool with TLS v1.2)
- **Security & Utilities:**
  - `dotenv` (Environment variable management)
  - `cors` (Cross-Origin Resource Sharing control)
  - `helmet` (HTTP security headers)
  - `express-rate-limit` (Rate limiting protection)
  - `express-validator` (Request validation ready)

## Environment Configuration
Database credentials must be supplied via environment variables (`backend/.env`):
- `TIDB_HOST`
- `TIDB_PORT` (Default: 4000)
- `TIDB_USER`
- `TIDB_PASSWORD`
- `TIDB_DATABASE` (Default: `careerpilot`)
- `TIDB_ENABLE_SSL` (Default: `true`)
- `TIDB_CA_PATH`
- `DB_CONNECTION_LIMIT` (Default: 10)

> **Security Note:** `.env` is ignored by Git and will never be committed. API endpoints do not expose database credentials or connection strings.

## Package Commands
- `npm run start` — Start API server (`src/server.js`)
- `npm run dev` — Start API server in watch mode
- `npm run db:test` — Verify connection to TiDB Cloud / MySQL
- `npm run db:migrate` — Execute initial schema migrations (`001_initial_schema.sql`)

## Endpoints
- `GET /api/health` — API service availability check
- `GET /api/health/db` — Database connectivity check (`SELECT 1`)

```json
{
  "success": true,
  "message": "Database connection is healthy",
  "database": "connected"
}
```

## Initial Database Schema (14 Tables)
1. `users` — User credentials and account state (`password_hash` reserved)
2. `profiles` — User profile details (1-to-1 with users)
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

## Next Phase
**8.3 — User Authentication & Session Security (JWT / Passwords)**
