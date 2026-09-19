# CareerPilot AI Backend

## Phase
**8.4 — Profile APIs + Backend Profile Persistence**

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

## Profile Routes (`/api/profile`)
All profile endpoints require active session authentication (`requireAuth` middleware):
- `GET /api/profile` — Fetch authenticated user's profile details (`personal`, `education`, `skills`, `interests`, `careerGoal`, `completed`).
- `PUT /api/profile` — Update authenticated user's profile within a database transaction.

### Data Contract & Response Format
```json
{
  "success": true,
  "profile": {
    "personal": {
      "fullName": "User Alpha",
      "email": "user@example.com",
      "location": "Kota"
    },
    "education": {
      "college": "Career Point University",
      "degree": "B.Tech",
      "branch": "Computer Science",
      "currentYear": "2nd Year",
      "graduationYear": "2028"
    },
    "skills": ["Python", "JavaScript", "SQL"],
    "interests": ["AI / Machine Learning", "Web Development"],
    "careerGoal": {
      "targetCareer": "Software Engineer",
      "experienceLevel": "Beginner",
      "goal": "Become job ready"
    },
    "completed": true
  }
}
```

### Profile Completion Rule
`completed` is dynamically evaluated as `true` ONLY if all required Phase 2 fields are present:
- `location`, `college`, `degree`, `branch`, `currentYear`, `graduationYear`
- `skills` (at least 1 item)
- `interests` (at least 1 item)
- `targetCareer`, `experienceLevel` (`Beginner` | `Intermediate` | `Advanced`), `goal`

## Package Commands
- `npm run start` — Start API server (`src/server.js`)
- `npm run dev` — Start API server in watch mode
- `npm run db:test` — Verify connection to TiDB Cloud / MySQL
- `npm run db:migrate` — Execute schema migrations (`001_initial_schema.sql`, `002_auth_sessions.sql`)
- `npm run test:auth` — Execute 15-point automated authentication test suite
- `npm run test:profile` — Execute 20-point automated profile API test suite

## Database Schema Tables
1. `users` — User credentials (`fullName` and `email` canonical identity source)
2. `profiles` — User profile details (1-to-1 with users)
3. `profile_skills` — User skill list (unique `(user_id, skill_name)`)
4. `profile_interests` — User interest list (unique `(user_id, interest_name)`)
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
**8.5 — Assessment + Readiness APIs**
