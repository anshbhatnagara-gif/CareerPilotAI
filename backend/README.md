# CareerPilot AI Backend

## Phase
**8.1 — Node.js + Express Backend Foundation**

## Stack
- **Runtime:** Node.js
- **Framework:** Express.js (JavaScript)
- **Security & Utilities:**
  - `dotenv` (Environment variable management)
  - `cors` (Cross-Origin Resource Sharing control)
  - `helmet` (HTTP security headers)
  - `express-rate-limit` (Rate limiting middleware)
  - `express-validator` (Request validation ready)
  - `mysql2` (Prepared for TiDB Cloud connectivity in Phase 8.2)

## Current Endpoint
- `GET /api/health` — Returns system status and service identifier.

```json
{
  "success": true,
  "message": "CareerPilot API is running",
  "service": "careerpilot-backend"
}
```

## System Status
- **Database:** Not connected yet.
- **Authentication:** Not implemented yet.
- **AI Service:** Not implemented yet.

## Next Phase
**8.2 — TiDB Cloud + Database Schema**
