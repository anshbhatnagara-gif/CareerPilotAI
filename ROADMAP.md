# CareerPilot AI — Project Roadmap

This document provides a comprehensive record of completed development phases and outlines the future development plan for CareerPilot AI.

---

## 🎯 Completed Development Phases (Verified)

### - [x] Phase 1 — Authentication Engine & Horror UI
- **Status**: ✅ Completed & Verified
- **Scope**: User Registration, Login, Logout, session management, route protection, dark cinematic horror design system (`#050505` palette).
- **Key Modules**: `login.html`, `register.html`, `auth.js`, `auth.routes.js`, `auth.controller.js`
- **Git Commit**: [`06f4b8d`](https://github.com/anshbhatnagara-gif/CareerPilotAI/commit/06f4b8d), [`999e15f`](https://github.com/anshbhatnagara-gif/CareerPilotAI/commit/999e15f)
- **Validation**: `npm run test:auth`, `frontend-auth-test.js`

### - [x] Phase 2 — Onboarding & Career Profile Engine
- **Status**: ✅ Completed & Verified
- **Scope**: Structured 6-step candidate onboarding wizard, profile persistence (personal details, education, skills, interests, target career, experience level, career goal).
- **Key Modules**: `onboarding.html`, `onboarding.js`, `profile.routes.js`, `profile.controller.js`, `profile.service.js`
- **Git Commit**: [`23c27ea`](https://github.com/anshbhatnagara-gif/CareerPilotAI/commit/23c27ea), [`5999b8e`](https://github.com/anshbhatnagara-gif/CareerPilotAI/commit/5999b8e)
- **Validation**: `npm run test:profile`, `frontend-profile-test.js`

### - [x] Phase 3 — AI Career Assessment Engine
- **Status**: ✅ Completed & Verified
- **Scope**: Qualitative career alignment assessment (`HIGH`, `MODERATE`, `LOW`), dynamic profile summary, strengths analysis, current skills display, focus areas, career guidance.
- **Key Modules**: `assessment.html`, `assessment.js`, `assessment.routes.js`, `assessment.controller.js`
- **Git Commit**: [`5630508`](https://github.com/anshbhatnagara-gif/CareerPilotAI/commit/5630508), [`eae361d`](https://github.com/anshbhatnagara-gif/CareerPilotAI/commit/eae361d)
- **Validation**: `npm run test:assessment`

### - [x] Phase 4 — Career Readiness & Skill Gap Engine
- **Status**: ✅ Completed & Verified
- **Scope**: Quantitative weighted Job Readiness Score (0–100%), skill gap breakdown (MET vs MISSING skills), priority levels, alignment summaries.
- **Key Modules**: `readiness.html`, `readiness.js`, `readiness.routes.js`, `readiness.controller.js`
- **Git Commit**: [`4ce0b4d`](https://github.com/anshbhatnagara-gif/CareerPilotAI/commit/4ce0b4d), [`eae361d`](https://github.com/anshbhatnagara-gif/CareerPilotAI/commit/eae361d)
- **Validation**: `npm run test:readiness`, `frontend-assessment-readiness-test.js`

### - [x] Phase 5 — Personalized Learning Roadmap Engine
- **Status**: ✅ Completed & Verified
- **Scope**: 5-Stage personalized learning path generator (Foundation, Core Skills, Development Depth, Advanced/Specialization, Job Prep Foundation), prerequisite dependency graph.
- **Key Modules**: `roadmap.html`, `roadmap.js`, `roadmap.routes.js`, `roadmap.controller.js`
- **Git Commit**: [`98d5108`](https://github.com/anshbhatnagara-gif/CareerPilotAI/commit/98d5108), [`ed799f9`](https://github.com/anshbhatnagara-gif/CareerPilotAI/commit/ed799f9)
- **Validation**: `npm run test:roadmap`

### - [x] Phase 6 — Projects & Project Tracker Engine
- **Status**: ✅ Completed & Verified
- **Scope**: Portfolio project recommendation catalog for 12 career domains, gap matching, status tracking (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`).
- **Key Modules**: `projects.html`, `projects.js`, `projects.routes.js`, `projects.controller.js`, `seed-project-catalog.js`
- **Git Commit**: [`d60d9a3`](https://github.com/anshbhatnagara-gif/CareerPilotAI/commit/d60d9a3), [`ed799f9`](https://github.com/anshbhatnagara-gif/CareerPilotAI/commit/ed799f9)
- **Validation**: `npm run test:projects`, `frontend-roadmap-projects-test.js`

### - [x] Phase 7 — Technical Interview Simulator & Career Tools
- **Status**: ✅ Completed & Verified
- **Scope**: STAR method technical interview simulator, multi-dimensional scoring (Technical, Communication, Problem-Solving), ATS resume preview, GitHub proof evidence tracker, Career Passport modal.
- **Key Modules**: `interview.html`, `interview.js`, `interview.routes.js`, `interview.controller.js`, `career-tools.routes.js`
- **Git Commit**: [`d4cc867`](https://github.com/anshbhatnagara-gif/CareerPilotAI/commit/d4cc867), [`031bb9a`](https://github.com/anshbhatnagara-gif/CareerPilotAI/commit/031bb9a), [`a1ac8b4`](https://github.com/anshbhatnagara-gif/CareerPilotAI/commit/a1ac8b4)
- **Validation**: `npm run test:interview`, `npm run test:career-tools`, `frontend-interview-careertools-test.js`

### - [x] Phase 8 — Backend, Database & Production Integration
- **Status**: ✅ Completed & Verified
- **Scope**: Node.js Express REST API, TiDB Cloud MySQL database setup (15 tables), persistent session store (`express-mysql-session`), Python FastAPI microservice initialization, Gemini 2.5 Flash API integration with local fallback engine.
- **Key Modules**: `backend/src/`, `ai-service/app/`, `migrations/001_initial_schema.sql`, `migrations/002_auth_sessions.sql`
- **Git Commit**: [`6ae67d2`](https://github.com/anshbhatnagara-gif/CareerPilotAI/commit/6ae67d2), [`9ffca3d`](https://github.com/anshbhatnagara-gif/CareerPilotAI/commit/9ffca3d), [`87cd520`](https://github.com/anshbhatnagara-gif/CareerPilotAI/commit/87cd520), [`7540eb4`](https://github.com/anshbhatnagara-gif/CareerPilotAI/commit/7540eb4), [`7a5d0fd`](https://github.com/anshbhatnagara-gif/CareerPilotAI/commit/7a5d0fd)
- **Validation**: `npm run test:ai`, `node scripts/test-ai-dashboard.js`, Pytest suite in `ai-service/tests`

### - [x] Phase 9 — Cloud Infrastructure & Production Deployment
- **Status**: ✅ Completed & Verified
- **Scope**: Vercel static frontend deployment (`vercel.json` rewrite proxy), Render Node.js backend web service, Render Python FastAPI AI service, TiDB Cloud production integration, GitHub Actions CI validation workflow.
- **Key Modules**: `vercel.json`, `render.yaml`, `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`
- **Git Commit**: [`39562c6`](https://github.com/anshbhatnagara-gif/CareerPilotAI/commit/39562c6), [`48505f2`](https://github.com/anshbhatnagara-gif/CareerPilotAI/commit/48505f2), [`ec7aa1c`](https://github.com/anshbhatnagara-gif/CareerPilotAI/commit/ec7aa1c), [`84e3dff`](https://github.com/anshbhatnagara-gif/CareerPilotAI/commit/84e3dff)
- **Validation**: Verified live on Vercel (`https://career-pilot-ai-vert-six.vercel.app/`) and Render (`https://careerpilotai-ly8b.onrender.com/api/health`)

---

## 🔮 Future Development Plan (Planned / Future)

> [!NOTE]
> The phases listed below represent future development goals and are currently unreleased.

### - [ ] Phase 10 — Production Hardening & Security Enforcement (Planned)
- **Rate Limiting Tuning**: Implement Redis-backed sliding window rate limiters for fine-grained protection.
- **Observability**: Integrate Sentry SDK for backend and frontend error tracking.
- **Security Headers**: Enforce strict Content Security Policy (CSP), HSTS, and X-Content-Type-Options headers.
- **Session Optimization**: Implement periodic cleanup for stale session records in TiDB.

### - [ ] Phase 11 — AI Intelligence Expansion (Planned)
- **Multimodal Interview Evaluation**: Audio recording input with Web Speech API / Whisper transcription and vocal tone scoring.
- **Vector Embeddings**: Use Gemini embeddings to match candidate profiles directly against uploaded job descriptions.
- **Interactive AI Career Mentor**: Real-time conversational AI mentor widget embedded in student dashboard.

### - [ ] Phase 12 — Student Experience & Motivation (Planned)
- **Gamified Achievements**: Unlock milestone badges (e.g., "First Project Completed", "5-Day Streak").
- **Learning Analytics**: Visual progress charts showing readiness score growth over time.
- **Email Digest**: Weekly progress emails notifying students of upcoming roadmap tasks.

### - [ ] Phase 13 — Career Ecosystem Integration (Planned)
- **Automated Resume Parsing**: Upload existing PDF resume to auto-populate onboarding profiles.
- **Job Posting Match Engine**: Crawl and present real-time entry-level tech openings matching candidate skills.
- **Recruiter Share Links**: Generate public shareable candidate passports with verified project proof.

### - [ ] Phase 14 — Enterprise Scaling & Infrastructure (Planned)
- **Caching Layer**: Deploy Redis cache cluster for AI insights, project catalogs, and user session caching.
- **Asynchronous Task Queue**: Offload heavy AI jobs to background workers (BullMQ / Celery).
- **Horizontal Scaling**: Auto-scale Render web services based on CPU/RAM thresholds.
