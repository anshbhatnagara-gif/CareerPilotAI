# CAREERPILOT AI — PRODUCTION DEPLOYMENT GUIDE

This guide details the native cloud deployment procedures for CareerPilot AI.

---

## TARGET CLOUD ARCHITECTURE

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

## 1. RECOMMENDED DEPLOYMENT ORDER

To avoid service connection failures, deploy in the following strict order:

1. **TiDB Cloud Database** (Provision cluster & obtain SQL credentials)
2. **Render FastAPI AI Service** (Deploy Python service & set `GEMINI_API_KEY`, `AI_SERVICE_SECRET`)
3. **Render Node Backend Service** (Deploy Node service with `TIDB_*`, `SESSION_SECRET`, and `AI_SERVICE_URL`)
4. **Cloudflare Pages Frontend** (Deploy static frontend repository)
5. **Configure Cross-Service Production URLs & CORS**
6. **Execute E2E Verification**

---

## 2. SERVICE CONFIGURATION SPECIFICATIONS

### A. TiDB Cloud Database
- **Console**: [https://tidbcloud.com](https://tidbcloud.com)
- Obtain connection details: `TIDB_HOST`, `TIDB_PORT` (4000), `TIDB_USER`, `TIDB_PASSWORD`, `TIDB_DATABASE` (`careerpilot`).
- Ensure SSL is enabled (`TIDB_ENABLE_SSL=true`).

### B. Render FastAPI AI Service
- **Type**: Web Service (Native Python runtime)
- **Build Command**: `cd ai-service && pip install -r requirements.txt`
- **Start Command**: `cd ai-service && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Health Check Path**: `/health`
- **Environment Variables (Set in Render Dashboard)**:
  - `ENVIRONMENT=production`
  - `AI_SERVICE_HOST=0.0.0.0`
  - `AI_SERVICE_SECRET` = `<STRONG_RANDOM_SECRET_KEY>` *(DO NOT COMMIT)*
  - `GEMINI_API_KEY` = `<YOUR_GEMINI_API_KEY>` *(DO NOT COMMIT)*
  - `GEMINI_MODEL` = `gemini-2.5-flash`
  - `GEMINI_TIMEOUT_MS` = `10000`

### C. Render Node Backend Service
- **Type**: Web Service (Native Node.js runtime)
- **Build Command**: `cd backend && npm install`
- **Start Command**: `cd backend && npm start`
- **Health Check Path**: `/api/health`
- **Environment Variables (Set in Render Dashboard)**:
  - `NODE_ENV=production`
  - `FRONTEND_URL` = `https://<your-app>.pages.dev`
  - `CORS_ALLOWED_ORIGINS` = `https://<your-app>.pages.dev,https://<custom-domain>`
  - `TIDB_HOST` = `<tidb-cluster-host>`
  - `TIDB_PORT` = `4000`
  - `TIDB_USER` = `<tidb-username>`
  - `TIDB_PASSWORD` = `<tidb-password>` *(DO NOT COMMIT)*
  - `TIDB_DATABASE` = `careerpilot`
  - `TIDB_ENABLE_SSL` = `true`
  - `SESSION_SECRET` = `<STRONG_RANDOM_SESSION_SECRET>` *(DO NOT COMMIT)*
  - `SESSION_COOKIE_NAME` = `careerpilot.sid`
  - `SESSION_MAX_AGE_MS` = `86400000`
  - `SECURE_COOKIE` = `true`
  - `AI_SERVICE_URL` = `https://<careerpilot-ai-service>.onrender.com`
  - `AI_SERVICE_SECRET` = `<MUST_MATCH_AI_SERVICE_SECRET>` *(DO NOT COMMIT)*
  - `AI_SERVICE_TIMEOUT_MS` = `5000`

### D. Cloudflare Pages Frontend
- **Console**: [https://dash.cloudflare.com](https://dash.cloudflare.com)
- **Framework Preset**: None (Static HTML/CSS/JS)
- **Build Command**: *(Leave empty)*
- **Build Output Directory**: `.` (Root directory)
- **Environment Variables**:
  - `CAREERPILOT_API_BASE_URL` = `https://<careerpilot-backend>.onrender.com/api`

---

## 3. CORS & SESSION SECURITY AUDIT

- **CORS Allowed Origins**: Backend dynamically validates request origin against `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS`.
- **Credentials**: `credentials: true` enabled. Wildcard `*` origins are rejected.
- **Cookies**: HTTP-Only, `SameSite=Lax`, `Secure=true` over HTTPS in production.
- **Client Storage**: Zero credentials, tokens, or session keys stored in `localStorage` or `sessionStorage`.

---

## 4. HEALTH CHECK MONITORING

| Service | Protocol / Path | Expected Response |
| :--- | :--- | :--- |
| **FastAPI Microservice** | `GET /health` | `{"success": true, "service": "careerpilot-ai-service"}` |
| **Node Backend Service** | `GET /api/health` | `{"success": true, "service": "careerpilot-backend"}` |
| **Database Connectivity** | `GET /api/health/db` | `{"success": true, "database": "connected"}` |
| **AI Client Pipeline** | `GET /api/health/ai` | `{"success": true, "aiService": "connected"}` |
