# CareerPilot AI — AI-Powered Career Guidance Platform

CareerPilot AI is a production-ready, full-stack career guidance platform designed for students and freshers. It helps candidates determine career direction, measure current job readiness, discover skill gaps, follow personalized learning roadmaps, build portfolio projects, practice technical interviews, and generate career evidence passports to achieve job readiness.

---

## 🎯 What is CareerPilot AI?

CareerPilot AI provides an end-to-end intelligent career development suite comprising:

- **Career Direction & Assessment**: Evaluates student background, degree, skills, and goals to recommend aligned tech career paths.
- **Quantitative Career Readiness**: Calculates a deterministic, weighted Job Readiness Score (0–100%) against industry requirements for 12 career domains.
- **Skill Gap Analysis**: Identifies missing, developing, and met skills with prioritized actionable recommendations.
- **Personalized Learning Roadmap**: Generates a structured 5-stage learning path with prerequisite dependency graph mapping.
- **Portfolio Projects & Tracker**: Recommends domain-specific portfolio projects matching skill gaps and tracks execution progress.
- **Interactive Interview Simulator**: Simulates STAR-method technical interviews with multi-dimensional scoring across Technical Depth, Communication, and Problem-Solving.
- **Career Tools & Verified Evidence Passport**: Aggregates candidate proof of work (GitHub repositories and live deployment URLs) into a shareable candidate passport.
- **AI Intelligence Integration**: Combines server-side Google Gemini LLM analysis with deterministic fallback engines.

---

## 🔄 Product Flow

```mermaid
flowchart TD
    A[User] --> B[Authentication]
    B --> C[6-Step Onboarding]
    C --> D[Career Profile]
    D --> E[AI Career Assessment]
    E --> F[Career Readiness Analysis]
    F --> G[Student Dashboard]
    G --> H[Skill Gap Analysis]
    G --> I[Personalized Learning Roadmap]
    G --> J[Portfolio Projects]
    G --> K[Interview Practice Simulator]
    G --> L[Career Tools & Evidence]
    H --> M[Progress Tracking]
    I --> M
    J --> M
    K --> M
    L --> M
    M --> N[Job Ready Candidate]
```

---

## 🏗️ Technical Architecture Flowchart

```mermaid
flowchart TD
    subgraph Client ["Browser Environment"]
        A[User Web Browser]
    end

    subgraph Vercel ["Vercel Edge Platform"]
        B[Static Frontend HTML/CSS/JS]
        C[Vercel /api Rewrite Proxy]
    end

    subgraph Render ["Render Cloud Platform"]
        D[Node.js / Express Application API Service]
        E[FastAPI Python AI Microservice]
    end

    subgraph DataAI ["External Services & Storage"]
        F[(TiDB Cloud MySQL Cluster)]
        G[Google Gemini REST API]
    end

    A -->|HTTPS Requests| B
    A -->|HTTPS /api/* Calls| C
    C -->|HTTPS Forwarding| D
    D -->|SQL Queries Pool| F
    D -->|HTTP + X-AI-Service-Key Auth| E
    E -->|HTTPS generateContent| G
```

### Key Architectural Constraints & Enforcement:
1. **Zero Direct Browser AI Calls**: The user's browser never directly calls the FastAPI microservice or Google Gemini API.
2. **Node.js API Layer**: The Express backend acts as the single entry-point application API, handling authentication, session validation, route guards, and business logic.
3. **Isolated Secrets**: Database credentials, `SESSION_SECRET`, `GEMINI_API_KEY`, and `AI_SERVICE_SECRET` reside strictly on server-side environment configurations.
4. **Persistent Data Tier**: TiDB Cloud MySQL provides persistent storage for users, profiles, assessments, roadmaps, projects, interviews, and session states.
5. **Separated AI Microservice**: The Python/FastAPI service handles AI payload validation, prompt engineering, Gemini API communication, and fallback engine logic independently.

---

---

## 🌐 Current Production Status

- **GitHub Repository**: [https://github.com/anshbhatnagara-gif/CareerPilotAI](https://github.com/anshbhatnagara-gif/CareerPilotAI)
- **Production Frontend (Vercel)**: [https://career-pilot-ai-vert-six.vercel.app/](https://career-pilot-ai-vert-six.vercel.app/)
- **Registration Page**: [https://career-pilot-ai-vert-six.vercel.app/register.html](https://career-pilot-ai-vert-six.vercel.app/register.html)
- **Login Page**: [https://career-pilot-ai-vert-six.vercel.app/login.html](https://career-pilot-ai-vert-six.vercel.app/login.html)
- **Production Backend API (Render)**: [https://careerpilotai-ly8b.onrender.com](https://careerpilotai-ly8b.onrender.com)
- **Backend Health Check**: [https://careerpilotai-ly8b.onrender.com/api/health](https://careerpilotai-ly8b.onrender.com/api/health)
- **FastAPI AI Microservice (Render)**: `careerpilot-ai-service` (Internal Render Host communication; direct public URL *Not verified in repository*)
- **Database Engine**: TiDB Cloud Serverless MySQL Cluster (`careerpilot`)
- **CI/CD Pipeline**: GitHub Actions (`.github/workflows/ci.yml` and `deploy.yml`)
- **Current Operational Health**: Healthy (All primary user flows operational over HTTPS)
- **Known Limitations**: Render free-tier services spin down after inactivity, causing a short initial cold-start delay on first request.

---

## 🗄️ Database Architecture

CareerPilot AI utilizes **TiDB Cloud** (MySQL 8.0 compatible) with **15 verified tables**:

```mermaid
erDiagram
    users ||--o| profiles : "has"
    users ||--o{ profile_skills : "possesses"
    users ||--o{ profile_interests : "has"
    users ||--o{ assessment_reports : "generates"
    users ||--o{ readiness_reports : "calculates"
    users ||--o{ roadmap_instances : "tracks"
    users ||--o{ user_projects : "undertakes"
    users ||--o{ interview_sessions : "practices"
    users ||--o{ portfolio_evidence : "submits"
    roadmap_instances ||--o{ roadmap_items : "contains"
    project_catalog ||--o{ user_projects : "cataloged_in"
    interview_sessions ||--o{ interview_responses : "evaluates"
    interview_questions ||--o{ interview_responses : "answers"
```

### Table Definitions & Purpose:
1. `users`: Core user authentication credentials (full name, email, bcrypt password hash, account status, login timestamps).
2. `profiles`: Candidate profile details (college, branch, degree, current year, graduation year, target career, experience level, goal).
3. `profile_skills`: Normalised candidate skills list linked to `users.id`.
4. `profile_interests`: Candidate interest areas linked to `users.id`.
5. `assessment_reports`: Qualitative AI career direction, profile summary, strengths, focus areas, advice.
6. `readiness_reports`: Quantitative 0–100 job readiness scores, met/missing skill vectors, priority gap breakdowns.
7. `roadmap_instances`: Personalized learning roadmap instances, completion counters, total estimated effort.
8. `roadmap_items`: Stage-by-stage learning roadmap items, prerequisites, skill requirements, execution status (`UPCOMING`, `IN_PROGRESS`, `COMPLETED`).
9. `project_catalog`: Master portfolio project repository across 12 tech career domains, difficulty levels, milestones.
10. `user_projects`: Junction table tracking user project adoption, progress status (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`), start and completion timestamps.
11. `interview_questions`: Domain-specific technical question bank, categories, expected key concepts.
12. `interview_sessions`: Candidate interview session records, mode (QUICK, STANDARD, DEEP), multi-dimensional score aggregates.
13. `interview_responses`: Detailed candidate responses per question, STAR breakdown, technical/communication/problem-solving score vector.
14. `portfolio_evidence`: Candidate proof of work links (GitHub repository URL, live deployment URL, tech stack, proof status).
15. `sessions`: Server-side persistent session storage table for Express `express-mysql-session`.

---



---

## 🤖 AI Architecture



## 🔒 Security Architecture

- **Session Security**: Express HTTP-Only cookies (`careerpilot.sid`) with `SameSite=Lax`/`None` and `SECURE_COOKIE=true` on production HTTPS.
- **Password Protection**: Passwords stored using `bcrypt` password hashing with 10 salt rounds.
- **Rate Limiting**: `express-rate-limit` enforces max 30 auth requests per 15 minutes to prevent brute-force attacks.
- **Header Authentication**: Node to FastAPI AI communication protected via server-to-server `X-AI-Service-Key` verification.
- **Zero Secrets Leakage**: No API keys, database passwords, or session secrets are embedded in frontend code.
- **Cross-Origin Enforcement**: Backend strictly restricts CORS headers to authorized frontend origins.

---


---

## 🚀 Deployment Architecture

- **Frontend**: Vercel Static Hosting with `/api/*` rewrites.
- **Backend API**: Render Native Node.js Web Service.
- **AI Microservice**: Render Native Python Web Service.
- **Database**: TiDB Cloud Serverless MySQL Cluster.
- **CI/CD**: GitHub Actions workflows.

*Note: Containerization engines such as Docker are explicitly NOT required for this deployment architecture.*

```mermaid
flowchart LR
    subgraph S1 [Vercel Platform]
        F[Frontend HTML/JS]
    end
    subgraph S2 [Render Cloud]
        N[Node.js Express Backend]
        A[FastAPI AI Service]
    end
    subgraph S3 [Cloud Data & AI]
        DB[(TiDB Cloud DB)]
        G[Google Gemini API]
    end

    F -->|/api Rewrites| N
    N --> DB
    N --> A
    A --> G
```

---

## 🚀 GitHub Actions Workflows

Found under `.github/workflows/`:

1. **`ci.yml`**: Runs automatically on every push or pull request to `main`.
   - Validates repository security and absence of committed secrets.
   - Enforces native cloud runtime policy (No Docker).
   - Audits frontend JS syntax.
   - Executes Python Pytest suite (Python 3.11).
   - Executes Node.js backend & E2E integration test suites (Node 20.x).
2. **`deploy.yml`**: Dispatchable workflow for verifying production environment readiness and release triggers.

---



---

## 📁 Project Structure

```text
careerpilot-ai/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # GitHub Actions Continuous Integration pipeline
│       └── deploy.yml             # GitHub Actions Deployment preparation workflow
├── ai-service/
│   ├── app/
│   │   ├── api/routes/            # FastAPI router endpoints (analyze, health)
│   │   ├── config/                # Environment configuration settings
│   │   ├── core/                  # Structured logging and utilities
│   │   ├── providers/             # Gemini API REST client implementation
│   │   ├── schemas/               # Pydantic request/response data models
│   │   ├── services/              # AI service dispatcher & deterministic fallback engine
│   │   └── main.py                # FastAPI microservice entrypoint
│   ├── tests/                     # Pytest suite for AI microservice
│   ├── README.md                  # Microservice architecture documentation
│   └── requirements.txt           # Python dependencies
├── assets/                        # Design assets and background graphics
├── backend/
│   ├── migrations/                # TiDB Cloud SQL migrations (001_initial, 002_sessions)
│   ├── scripts/                   # Migration, seeding, and unit/integration test scripts
│   ├── src/
│   │   ├── config/                # Database pool & environment initialization
│   │   ├── controllers/           # API request handlers
│   │   ├── middleware/           # Session authentication & route protection
│   │   ├── routes/                # Express router endpoints
│   │   ├── services/              # Business logic & AI client integration
│   │   ├── app.js                 # Express application middleware assembly
│   │   └── server.js              # Server HTTP listener initialization
│   ├── package.json               # Node.js backend dependencies and test scripts
│   └── README.md                  # Backend service documentation
├── assessment.html / .js          # Career Assessment view & script
├── auth-success.html / auth.js    # Auth success callback & client session script
├── index.html                     # Project landing page
├── interview.html / .js           # Interview Simulator & Resume tools view & script
├── login.html                     # Account Login page
├── onboarding.html / .js          # 6-Step Career Profile Onboarding view & script
├── projects.html / .js            # Portfolio Projects & Tracker view & script
├── readiness.html / .js           # Job Readiness & Skill Gap view & script
├── register.html                  # Account Registration page
├── render.yaml                    # Native Cloud deployment manifest for Render
├── roadmap.html / .js             # Personalized Learning Roadmap view & script
├── style.css                      # Cinematic Dark UI Design System
├── vercel.json                    # Vercel proxy rewrite configuration
├── ARCHITECTURE.md                # System Architecture Documentation
├── CHANGELOG.md                   # Project History & Commit Ledger
├── DEPLOYMENT.md                  # Production Cloud Deployment Guide
├── ROADMAP.md                     # Completed vs Planned Feature Roadmap
└── README.md                      # Primary Project Documentation
```

---

## 🔗 Documentation Links

- [ARCHITECTURE.md](file:///c:/career%20pilot%20ai%202.0/careerpilot-ai/ARCHITECTURE.md) — Comprehensive System Architecture & Data Flow Diagrams
- [ROADMAP.md](file:///c:/career%20pilot%20ai%202.0/careerpilot-ai/ROADMAP.md) — Project Roadmap & Stage Tracking
- [CHANGELOG.md](file:///c:/career%20pilot%20ai%202.0/careerpilot-ai/CHANGELOG.md) — Full Commit History & Phase Evolution Ledger
- [DEPLOYMENT.md](file:///c:/career%20pilot%20ai%202.0/careerpilot-ai/DEPLOYMENT.md) — Native Cloud Deployment Guide
