# CAREERPILOT AI — STAGING & PRODUCTION DEPLOYMENT GUIDE

This document provides step-by-step instructions for deploying CareerPilot AI to **Staging** and **Production** native cloud environments.

---

## TARGET CLOUD ARCHITECTURE (NO DOCKER)

```
┌──────────────────────────────────────────────┐
│        Cloudflare Pages (Frontend)           │
│         Vanilla HTML5 / CSS3 / JS            │
└──────────────────────┬───────────────────────┘
                       │ HTTPS CORS API requests
                       ▼
┌──────────────────────────────────────────────┐
│        Render Node.js Backend Service        │
│          (Express + Session Auth)            │
└──────────────┬────────────────┬──────────────┘
               │                │
     SQL Query │                │ HTTP (X-AI-Service-Key)
               ▼                ▼
┌──────────────────────┐  ┌──────────────────────────────────────────────┐
│      TiDB Cloud      │  │        Render FastAPI AI Service             │
│ (MySQL Compatibility)│  │          (Python 3.11+ / Uvicorn)            │
└──────────────────────┘  └──────────────────────┬───────────────────────┘
                                                 │ Gemini API
                                                 ▼
                                          ┌──────────────┐
                                          │  Google AI   │
                                          └──────────────┘
```

---

## 1. STAGING VS. PRODUCTION ENVIRONMENT MATRIX

| Service / Parameter | Staging Environment | Production Environment |
| :--- | :--- | :--- |
| **Frontend Host** | `https://staging-careerpilot.pages.dev` | `https://careerpilot.ai` |
| **Node Backend Host** | `https://careerpilot-backend-staging.onrender.com` | `https://api.careerpilot.ai` |
| **FastAPI Microservice Host** | `https://careerpilot-ai-staging.onrender.com` | `https://ai.careerpilot.ai` |
| **Database Cluster** | TiDB Cloud Staging Database (`careerpilot_staging`) | TiDB Cloud Production Cluster (`careerpilot`) |
| **Node Environment (`NODE_ENV`)**| `staging` | `production` |
| **FastAPI Environment (`ENVIRONMENT`)**| `staging` | `production` |
| **Cookie Security (`SECURE_COOKIE`)**| `true` (HTTPS mandatory) | `true` (HTTPS mandatory) |

---

## 2. RECOMMENDED STEP-BY-STEP DEPLOYMENT ORDER

Deploy services in the exact sequence below to ensure smooth cross-service discovery:

1. **Step 1: TiDB Cloud Database**
   - Provision a TiDB Cloud Serverless / Dedicated cluster.
   - Obtain connection host (`TIDB_HOST`), user, and password.
   - Enable SSL (`TIDB_ENABLE_SSL=true`).

2. **Step 2: Render FastAPI AI Microservice**
   - Create a Web Service on Render using the repository path `ai-service/`.
   - Set build command: `cd ai-service && pip install -r requirements.txt`
   - Set start command: `cd ai-service && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Set health check path: `/health`
   - Configure secrets in Render Dashboard: `GEMINI_API_KEY` and `AI_SERVICE_SECRET`.

3. **Step 3: Render Node.js Backend Service**
   - Create a Web Service on Render using the repository path `backend/`.
   - Set build command: `cd backend && npm install`
   - Set start command: `cd backend && npm start`
   - Set health check path: `/api/health`
   - Configure environment variables: `TIDB_*`, `SESSION_SECRET`, `AI_SERVICE_URL` (pointing to Render FastAPI service), and `AI_SERVICE_SECRET`.

4. **Step 4: Cloudflare Pages Static Frontend**
   - Connect repository to Cloudflare Pages dashboard.
   - Framework preset: `None` (Static HTML/CSS/JS).
   - Build output directory: `.`
   - Set environment variable: `CAREERPILOT_API_BASE_URL` = `https://<backend-service-host>/api`

5. **Step 5: Cross-Origin CORS Configuration**
   - In Render Node backend dashboard, add the Cloudflare Pages URL to `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS`.

6. **Step 6: Live Staging Verification**
   - Run health checks: `/api/health`, `/api/health/db`, `/api/health/ai`, `/health`.
   - Execute full E2E user flow test.

---

## 3. DASHBOARD ENVIRONMENT VARIABLES REFERENCE

> [!CAUTION]
> NEVER commit real credentials, passwords, or API keys to git. All secret values listed below must be entered directly in Cloudflare Pages and Render web dashboards.

### Render FastAPI AI Service Environment
```env
ENVIRONMENT=staging
AI_SERVICE_HOST=0.0.0.0
AI_SERVICE_SECRET=<GENERATED_RANDOM_SECRET>
GEMINI_API_KEY=<YOUR_GOOGLE_GEMINI_API_KEY>
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TIMEOUT_MS=10000
```

### Render Node Backend Service Environment
```env
NODE_ENV=staging
FRONTEND_URL=https://staging-careerpilot.pages.dev
CORS_ALLOWED_ORIGINS=https://staging-careerpilot.pages.dev
TIDB_HOST=<TIDB_CLUSTER_HOST>
TIDB_PORT=4000
TIDB_USER=<TIDB_USERNAME>
TIDB_PASSWORD=<TIDB_PASSWORD>
TIDB_DATABASE=careerpilot_staging
TIDB_ENABLE_SSL=true
DB_CONNECTION_LIMIT=10
SESSION_SECRET=<GENERATED_RANDOM_SESSION_SECRET>
SESSION_COOKIE_NAME=careerpilot.sid
SESSION_MAX_AGE_MS=86400000
SECURE_COOKIE=true
AI_SERVICE_URL=https://careerpilot-ai-staging.onrender.com
AI_SERVICE_SECRET=<MUST_MATCH_FASTAPI_AI_SERVICE_SECRET>
AI_SERVICE_TIMEOUT_MS=5000
```

---

## 4. HEALTH CHECK MONITORING SPECIFICATIONS

| Service | Endpoint Path | Healthy Response HTTP Code | Expected Payload |
| :--- | :--- | :--- | :--- |
| **Node Backend** | `GET /api/health` | `200 OK` | `{"success": true, "service": "careerpilot-backend"}` |
| **Database** | `GET /api/health/db` | `200 OK` | `{"success": true, "database": "connected"}` |
| **AI Client Link** | `GET /api/health/ai` | `200 OK` | `{"success": true, "aiService": "connected"}` |
| **FastAPI Service**| `GET /health` | `200 OK` | `{"success": true, "service": "careerpilot-ai-service"}` |
| **AI Dependencies**| `GET /health/dependencies` | `200 OK` | `{"success": true, "dependencies": {...}}` |

---

## 5. FULL E2E STAGING AUDIT CHECKLIST

- [x] Register user via `POST /api/auth/register`
- [x] Login & receive HTTP-Only session cookie
- [x] Complete 6 Onboarding steps & save profile (`PUT /api/profile`)
- [x] Calculate Assessment & Readiness score (`GET /api/readiness`)
- [x] Query AI Dashboard Intelligence (`GET /api/ai/dashboard`)
- [x] Generate 5-stage personalized roadmap (`GET /api/roadmap`)
- [x] Update project status (`PATCH /api/projects/:id/status`)
- [x] Complete Interview Simulator session (`POST /api/interview/evaluate`)
- [x] Save portfolio evidence & view Career Passport (`GET /api/career-tools/passport`)
- [x] Logout (`POST /api/auth/logout`)
