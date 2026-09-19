# CareerPilot AI Microservice (`ai-service`)

Phase 8.9 Python + FastAPI modular microservice architecture providing AI analysis pipelines for CareerPilot.

## Architecture

```
Browser
  ↓
Node.js Express API (Port 5000)
  ↓ (X-AI-Service-Key Server-to-Server Auth)
Python FastAPI AI Service (Port 8001)
  ↓
AI / ML Analysis Pipelines
```

- **Browser direct access**: Strictly prohibited. Frontend communicates only with Node.js Express.
- **Security**: Server-to-server header authentication (`X-AI-Service-Key`).
- **Database**: TiDB Cloud remains the application source of truth managed via Node.js.

## Environment Variables

Copy `.env.example` to `.env`:

```env
AI_SERVICE_PORT=8001
AI_SERVICE_HOST=0.0.0.0
AI_SERVICE_SECRET=placeholder_secret_key_change_in_production
```

## Setup & Running

### Using `uv` (Recommended)

```bash
cd ai-service

# Install dependencies into virtualenv
uv pip install -r requirements.txt

# Run FastAPI server
uv run uvicorn app.main:app --port 8001 --reload

# Run test suite
uv run pytest
```

### Standard Python Virtual Environment

```bash
cd ai-service

python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --port 8001 --reload
pytest
```

## API Endpoints

### Health Check (Unprotected)
- `GET /health` — Service liveness check
- `GET /health/dependencies` — System dependency status

### AI Pipelines (Protected via `X-AI-Service-Key`)
- `POST /api/v1/analyze/career` — Career profile analysis
- `POST /api/v1/analyze/skills` — Skill gap insights
- `POST /api/v1/analyze/learning` — Learning path recommendations
