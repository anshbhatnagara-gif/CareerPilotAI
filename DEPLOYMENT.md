# CAREERPILOT AI — STAGING & PRODUCTION DEPLOYMENT GUIDE

This document provides step-by-step instructions for deploying CareerPilot AI to **Staging** and **Production** native cloud environments.

---

## TARGET CLOUD ARCHITECTURE (NO DOCKER)

```
┌──────────────────────────────────────────────┐
│          Vercel Platform (Frontend)          │
│          Vanilla HTML5 / CSS3 / JS           │
│        Rewrites /api/* to Render API         │
└──────────────────────┬───────────────────────┘
                       │ HTTPS CORS / API requests
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

## 1. ENVIRONMENT MATRIX

| Service / Parameter | Staging Environment | Production Environment |
| :--- | :--- | :--- |
| **Frontend Host (Vercel)** | `https://staging-careerpilot.vercel.app` | `https://career-pilot-ai-vert-six.vercel.app` |
| **Node Backend Host (Render)** | `https://careerpilot-backend-staging.onrender.com` | `https://careerpilotai-ly8b.onrender.com` |
| **FastAPI Microservice Host (Render)** | `https://careerpilot-ai-staging.onrender.com` | Service Name: `careerpilot-ai-service` (Internal Render Host) |
| **Database Cluster (TiDB Cloud)** | TiDB Cloud Staging Database (`careerpilot_staging`) | TiDB Cloud Production Cluster (`careerpilot`) |
| **Node Environment (`NODE_ENV`)**| `staging` | `production` |
| **FastAPI Environment (`ENVIRONMENT`)**| `staging` | `production` |
| **Cookie Security (`SECURE_COOKIE`)**| `true` (HTTPS mandatory) | `true` (HTTPS mandatory) |

---

## 2. DEPLOYMENT ORDER & DISCOVERY

Deploy services in the exact sequence below to ensure smooth cross-service discovery:

1. **Step 1: TiDB Cloud Database**
   - Provision a TiDB Cloud Serverless cluster.
   - Obtain connection host (`TIDB_HOST`), user, and password.
   - Enable SSL (`TIDB_ENABLE_SSL=true`).
   - Run migrations via `npm run db:migrate` in `backend/`.

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

4. **Step 4: Vercel Static Frontend & Rewrite Gateway**
   - Connect repository to Vercel dashboard.
   - Root directory: `./`
   - Vercel automatically reads `vercel.json` rewrite configuration:
     ```json
     {
       "rewrites": [
         {
           "source": "/api/:path*",
           "destination": "https://careerpilotai-ly8b.onrender.com/api/:path*"
         }
       ]
     }
     ```

5. **Step 5: Cross-Origin CORS Configuration**
   - In Render Node backend dashboard, set `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` to `https://career-pilot-ai-vert-six.vercel.app`.

6. **Step 6: Health & E2E Verification**
   - Run health checks: `/api/health`, `/api/health/db`, `/api/health/ai`, `/health`.
   - Execute full user flow verification.

---

## 3. DASHBOARD ENVIRONMENT VARIABLES REFERENCE

> [!CAUTION]
> NEVER commit real credentials, passwords, or API keys to git. All secret values listed below must be entered directly in Vercel and Render web dashboards.

### Render FastAPI AI Service Environment
```env
ENVIRONMENT=production
AI_SERVICE_HOST=0.0.0.0
AI_SERVICE_SECRET=<GENERATED_RANDOM_SECRET>
GEMINI_API_KEY=<YOUR_GOOGLE_GEMINI_API_KEY>
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TIMEOUT_MS=10000
```

### Render Node Backend Service Environment
```env
NODE_ENV=production
FRONTEND_URL=https://career-pilot-ai-vert-six.vercel.app
CORS_ALLOWED_ORIGINS=https://career-pilot-ai-vert-six.vercel.app
TIDB_HOST=<TIDB_CLUSTER_HOST>
TIDB_PORT=4000
TIDB_USER=<TIDB_USERNAME>
TIDB_PASSWORD=<TIDB_PASSWORD>
TIDB_DATABASE=careerpilot
TIDB_ENABLE_SSL=true
DB_CONNECTION_LIMIT=10
SESSION_SECRET=<GENERATED_RANDOM_SESSION_SECRET>
SESSION_COOKIE_NAME=careerpilot.sid
SESSION_MAX_AGE_MS=86400000
SECURE_COOKIE=true
AI_SERVICE_URL=http://careerpilot-ai-service:10000
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

## 5. E2E VERIFICATION AUDIT CHECKLIST

- [x] Register user via `POST /api/auth/register`
- [x] Login & receive HTTP-Only session cookie (`careerpilot.sid`)
- [x] Complete 6 Onboarding steps & save profile (`PUT /api/profile`)
- [x] Calculate Assessment & Readiness score (`GET /api/readiness`)
- [x] Query AI Dashboard Intelligence (`GET /api/ai/dashboard`)
- [x] Generate 5-stage personalized roadmap (`GET /api/roadmap`)
- [x] Update project status (`PATCH /api/projects/:id`)
- [x] Complete Interview Simulator session (`POST /api/interview/evaluate`)
- [x] Save portfolio evidence & view Career Passport (`GET /api/career-tools/passport`)
- [x] Logout (`POST /api/auth/logout`)
