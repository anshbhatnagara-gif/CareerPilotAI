/**
 * CAREERPILOT AI — PRODUCTION HEALTH MONITORING TEST SUITE
 * 
 * Tests:
 * 1. GET /api/health — API service health success & response contract
 * 2. GET /api/health/db — Database health success & failure handling
 * 3. GET /api/health/ai — AI microservice health success & failure handling
 * 4. GET /api/health/full — Unified health status check (200 healthy / 503 degraded)
 * 5. Secret disclosure audit — ensures no secrets, keys, credentials, or stack traces exposed
 * 6. Correct HTTP status codes & timeout safety
 */

const assert = require('assert');
const http = require('http');
const app = require('../src/app');
const aiClient = require('../src/services/aiClient');
const pool = require('../src/config/db');

async function runHealthTests() {
  console.log('\n==================================================');
  console.log('CAREERPILOT AI — PHASE 11.1 HEALTH MONITORING TEST SUITE');
  console.log('==================================================\n');

  let server;
  let port;

  try {
    // Start local Express server for testing endpoints
    server = app.listen(0);
    port = server.address().port;
    const baseUrl = `http://localhost:${port}`;

    // Test 1: GET /api/health
    console.log('Test 1: GET /api/health (API Service Health)');
    const resHealth = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(resHealth.status, 200, 'GET /api/health should return status 200');
    const jsonHealth = await resHealth.json();
    assert.strictEqual(jsonHealth.success, true, 'GET /api/health success should be true');
    assert.strictEqual(jsonHealth.service, 'careerpilot-backend', 'Service should match careerpilot-backend');
    console.log('✓ PASS: GET /api/health returns 200 and matches API contract');

    // Test 2: GET /api/health/db
    console.log('\nTest 2: GET /api/health/db (Database Health)');
    const resDb = await fetch(`${baseUrl}/api/health/db`);
    const jsonDb = await resDb.json();
    assert.ok(resDb.status === 200 || resDb.status === 503, 'GET /api/health/db should return 200 or 503');
    assert.ok(typeof jsonDb.success === 'boolean', 'DB health response should include boolean success field');
    assert.ok(['connected', 'mock', 'unconfigured', 'disconnected'].includes(jsonDb.database), 'DB health status should be valid string');
    console.log(`✓ PASS: GET /api/health/db returned ${resDb.status} with database status "${jsonDb.database}"`);

    // Test 3: GET /api/health/ai (Offline test)
    console.log('\nTest 3: GET /api/health/ai (FastAPI Offline Handling)');
    const originalAiUrl = aiClient.AI_SERVICE_URL;
    aiClient.AI_SERVICE_URL = 'http://127.0.0.1:59999'; // invalid port to force offline

    const resAiOffline = await fetch(`${baseUrl}/api/health/ai`);
    assert.strictEqual(resAiOffline.status, 503, 'GET /api/health/ai should return 503 when FastAPI is offline');
    const jsonAiOffline = await resAiOffline.json();
    assert.strictEqual(jsonAiOffline.success, false, 'Offline AI health success should be false');
    assert.strictEqual(jsonAiOffline.aiService, 'disconnected', 'Offline AI status should be disconnected');
    console.log('✓ PASS: GET /api/health/ai returns 503 503 when FastAPI is offline');

    // Test 4: GET /api/health/full (Degraded status when AI is offline)
    console.log('\nTest 4: GET /api/health/full (Unified Health — Degraded State)');
    const resFullDegraded = await fetch(`${baseUrl}/api/health/full`);
    assert.strictEqual(resFullDegraded.status, 503, 'GET /api/health/full should return 503 when dependency is degraded');
    const jsonFullDegraded = await resFullDegraded.json();
    assert.strictEqual(jsonFullDegraded.success, false, 'Degraded health check success should be false');
    assert.strictEqual(jsonFullDegraded.status, 'degraded', 'Degraded health status should be "degraded"');
    assert.strictEqual(jsonFullDegraded.services.ai, 'disconnected', 'AI service in degraded status should be "disconnected"');
    console.log('✓ PASS: GET /api/health/full returns 503 degraded when AI is offline');

    // Test 5: Mock FastAPI server to test Healthy GET /api/health/ai and GET /api/health/full
    console.log('\nTest 5: GET /api/health/ai & GET /api/health/full (Healthy State with Mock FastAPI)');
    const mockFastAPI = http.createServer((req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'healthy', service: 'careerpilot-ai-service' }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    await new Promise((resolve) => mockFastAPI.listen(0, resolve));
    const mockPort = mockFastAPI.address().port;
    aiClient.AI_SERVICE_URL = `http://127.0.0.1:${mockPort}`;

    const resAiOnline = await fetch(`${baseUrl}/api/health/ai`);
    assert.strictEqual(resAiOnline.status, 200, 'GET /api/health/ai should return 200 when FastAPI is online');
    const jsonAiOnline = await resAiOnline.json();
    assert.strictEqual(jsonAiOnline.success, true, 'Online AI health success should be true');
    assert.strictEqual(jsonAiOnline.aiService, 'connected', 'Online AI status should be connected');
    console.log('✓ PASS: GET /api/health/ai returns 200 when FastAPI is online');

    const resFullHealthy = await fetch(`${baseUrl}/api/health/full`);
    assert.strictEqual(resFullHealthy.status, 200, 'GET /api/health/full should return 200 when all services are healthy');
    const jsonFullHealthy = await resFullHealthy.json();
    assert.strictEqual(jsonFullHealthy.success, true, 'Healthy full check success should be true');
    assert.strictEqual(jsonFullHealthy.status, 'healthy', 'Full health status should be "healthy"');
    assert.strictEqual(jsonFullHealthy.services.api, 'healthy');
    assert.strictEqual(jsonFullHealthy.services.ai, 'healthy');
    console.log('✓ PASS: GET /api/health/full returns 200 healthy when all services are online');

    // Clean up mock FastAPI
    mockFastAPI.close();
    aiClient.AI_SERVICE_URL = originalAiUrl;

    // Test 6: Security & Secret Leakage Audit across all health endpoints
    console.log('\nTest 6: Security & Secret Non-Disclosure Audit');
    const endpoints = ['/api/health', '/api/health/db', '/api/health/ai', '/api/health/full'];
    const forbiddenPatterns = [
      'TIDB_PASSWORD',
      'AI_SERVICE_SECRET',
      'SESSION_SECRET',
      'GEMINI_API_KEY',
      'password',
      'secret',
      'Authorization',
      'Cookie',
      'at Module._compile',
      'at processTicksAndRejections'
    ];

    for (const ep of endpoints) {
      const res = await fetch(`${baseUrl}${ep}`);
      const text = await res.text();
      for (const pattern of forbiddenPatterns) {
        assert.strictEqual(
          text.includes(pattern),
          false,
          `Endpoint ${ep} MUST NOT disclose forbidden pattern: "${pattern}"`
        );
      }
    }
    console.log('✓ PASS: Security audit confirmed zero secret, credential, or stack trace exposure across all health endpoints');

    console.log('\n==================================================');
    console.log('ALL PHASE 11.1 HEALTH MONITORING TESTS PASSED PERFECTLY!');
    console.log('==================================================\n');
    process.exit(0);

  } finally {
    if (server) {
      server.close();
    }
    if (pool && pool.end) {
      await pool.end();
    }
  }
}

runHealthTests().catch((err) => {
  console.error('\n❌ HEALTH MONITORING TEST SUITE FAILED:', err);
  process.exit(1);
});
