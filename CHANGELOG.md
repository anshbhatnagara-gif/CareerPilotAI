# CareerPilot AI — Project Changelog & Commit Ledger

All notable changes, architectural milestones, and commit histories for CareerPilot AI are documented in this file.

---

## 🚀 Phase 9 — Cloud Infrastructure & Production Deployment

### Commits & Milestones:
- **`84e3dff`**: `fix: connect vercel frontend to render backend`
  - Configured `vercel.json` rewrites to proxy `/api/*` requests directly to production Render backend (`https://careerpilotai-ly8b.onrender.com/api/:path*`).
- **`ec7aa1c`**: `fix: refine migration comment parsing logic for TiDB Cloud execution`
  - Fixed database migration script parser to support TiDB Cloud multi-statement execution and SQL comments.
- **`48505f2`**: `deploy: prepare live cloud staging infrastructure`
  - Finalized staging and production environment matrix, connection parameters, and health check validation rules.
- **`1f67d0b`**: `ci: add GitHub Actions validation pipeline`
  - Created `.github/workflows/ci.yml` and `deploy.yml` validating security, no-Docker policy, Python Pytest, and Node.js backend suites.
- **`39562c6`**: `chore: prepare native cloud deployment`
  - Configured `render.yaml` defining native Node.js web service (`careerpilot-backend`) and native Python FastAPI web service (`careerpilot-ai-service`).
- **`95ed26c`**: `chore: prepare production environment configuration`
  - Set up production environment variable templates, CORS origin validation, and cookie security rules (`SECURE_COOKIE=true`).

---

## 🤖 Phase 8 — Backend, Database & AI Microservice Integration

### Phase 8.6 – 8.9: FastAPI AI Microservice & Gemini Provider
- **`7a5d0fd`**: `feat: integrate AI intelligence into dashboard`
  - Created `GET /api/ai/dashboard` endpoint executing parallel career, skill gap, and learning roadmap AI analysis.
- **`106b2b8`**: `feat: implement AI learning intelligence`
  - Connected learning recommendations endpoint to FastAPI AI service.
- **`f5bd32a`**: `feat: implement AI skill gap intelligence`
  - Integrated skill gap analysis endpoint with server-to-server AI microservice.
- **`7540eb4`**: `feat: implement AI career intelligence`
  - Implemented career direction AI analysis endpoint.
- **`8f72234`**: `feat: integrate Gemini AI provider with fallback engine`
  - Created Google Gemini REST API client (`gemini-2.5-flash`) with timeout controls and deterministic fallback engine (`fallback_engine.py`).
- **`87cd520`**: `feat: initialize FastAPI AI service foundation`
  - Built Python 3.11 / FastAPI microservice (`ai-service/app`) with Pydantic schemas, health checks, and `X-AI-Service-Key` header authentication.

### Phase 8.1 – 8.5: Express Backend & Database Migration
- **`6e829a0`**: `fix: complete Phase 8.8.7 integration audit fixes`
  - Resolved session propagation issues, error logging, and header sanitation.
- **`4692045`**: `chore: remove legacy localStorage application state`
  - Migrated frontend state persistence completely from client `localStorage` to server REST APIs.
- **`304a23b`**: `feat: migrate interview and career tools to backend`
  - Connected `interview.js` to `/api/interview/*` and `/api/career-tools/*`.
- **`d8915d7`**: `feat: migrate roadmap and projects to backend`
  - Connected `roadmap.js` and `projects.js` to `/api/roadmap` and `/api/projects/*`.
- **`526b4cd`**: `feat: migrate assessment and readiness to backend`
  - Connected `assessment.js` and `readiness.js` to `/api/assessment` and `/api/readiness`.
- **`7f5a1b6`**: `feat: migrate frontend profile to backend`
  - Connected `onboarding.js` step builder to `GET/PUT /api/profile`.
- **`bfc0aa5`**: `feat: migrate frontend authentication to backend`
  - Replaced client-side auth mocks in `auth.js` with Express session authentication endpoints.
- **`a1ac8b4`**: `feat: implement interview and career tools APIs`
  - Created `interview.routes.js` and `career-tools.routes.js` endpoints and controllers.
- **`ed799f9`**: `feat: implement roadmap and projects APIs`
  - Created `roadmap.routes.js` and `projects.routes.js` controllers and seed data script.
- **`eae361d`**: `feat: implement assessment and readiness APIs`
  - Built assessment and readiness backend calculation controllers and routes.
- **`5999b8e`**: `feat: implement profile APIs and persistence`
  - Created profile service, skill/interest tables handler, and profile routes.
- **`999e15f`**: `feat: implement secure backend authentication`
  - Built user registration, login, logout, bcrypt password hashing, and express-mysql-session integration.
- **`9ffca3d`**: `feat: connect TiDB Cloud and add initial database schema`
  - Connected TiDB Cloud MySQL database pool and added migration files (`001_initial_schema.sql`, `002_auth_sessions.sql`).
- **`6ae67d2`**: `feat: initialize Node.js Express backend foundation`
  - Bootstrapped Express backend server (`backend/src/server.js`), health routes, and middleware pipeline.

---

## 🎨 Phases 1–7 — Core User Flow & Cinematic UI Engine

- **`e1b1977`**: `fix: prepare frontend for backend integration`
- **`031bb9a`**: `feat: complete Phase 7 interview modes scoring history and career tools`
- **`d4cc867`**: `feat: implement Phase 7 interview simulator, career tools and evidence engine`
- **`d60d9a3`**: `feat: implement Phase 6 projects and project tracker`
- **`98d5108`**: `feat: implement Phase 5 personalized learning roadmap`
- **`4ce0b4d`**: `feat: implement Phase 4 career readiness and skill gap engine`
- **`5630508`**: `feat: implement Phase 3 AI career assessment`
- **`23c27ea`**: `feat: implement Phase 2 onboarding and career profile`
- **`06f4b8d`**: `feat: implement Phase 1 authentication and horror UI`
