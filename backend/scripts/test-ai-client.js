/**
 * CAREERPILOT AI — NODE.JS AI CLIENT INTEGRATION TEST SUITE
 * 
 * Tests server-to-server communication between Node.js Express backend and Python FastAPI AI Service.
 * Verifies health checks, authentication, pipeline requests, timeout handling, and graceful offline fallback.
 */

const express = require('express');
const http = require('http');
const router = require('../src/routes');
const aiClient = require('../src/services/aiClient');

const app = express();
app.use(express.json());
app.use('/api', router);

let testPasses = 0;
let testFails = 0;

function assert(condition, description) {
  if (condition) {
    console.log(`  ✓ PASSED: ${description}`);
    testPasses++;
  } else {
    console.error(`  ✗ FAILED: ${description}`);
    testFails++;
  }
}

async function runTests() {
  console.log('\n==================================================');
  console.log('CAREERPILOT AI — PHASE 8.9 NODE.JS AI CLIENT TEST SUITE');
  console.log('==================================================\n');

  // 1. Offline / Unreachable FastAPI handling test
  console.log('Test 1: Unreachable FastAPI AI service fallback handling');
  const originalUrl = aiClient.AI_SERVICE_URL;
  // Point to a non-existent port
  aiClient.AI_SERVICE_URL = 'http://localhost:59999';

  const offlineHealth = await aiClient.checkHealth();
  assert(offlineHealth.success === false, 'Offline health check returns success: false');
  assert(offlineHealth.error === 'AI_SERVICE_UNAVAILABLE', 'Error code is AI_SERVICE_UNAVAILABLE');

  // Test GET /api/health/ai Express endpoint when offline
  const server = app.listen(0, async () => {
    const port = server.address().port;
    const res = await fetch(`http://localhost:${port}/api/health/ai`);
    assert(res.status === 503, 'GET /api/health/ai returns 503 when FastAPI is offline');
    const json = await res.json();
    assert(json.aiService === 'disconnected', 'Response indicates aiService is disconnected');

    // 2. Start mock FastAPI server to test live server-to-server communication
    console.log('\nTest 2 & 3: Server-to-server request authentication & pipelines');
    const mockFastAPI = http.createServer((req, res) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        const apiKey = req.headers['x-ai-service-key'];

        if (req.url === '/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, service: 'careerpilot-ai-service', message: 'CareerPilot AI service is running' }));
          return;
        }

        if (!apiKey || apiKey !== 'placeholder_secret_key_change_in_production') {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'UNAUTHORIZED', message: 'Invalid server key' }));
          return;
        }

        if (req.url === '/api/v1/analyze/career') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            service: 'careerpilot-ai-service',
            status: 'ready',
            message: 'AI career analysis pipeline is ready for model integration',
            data: { targetCareer: 'Software Engineer' }
          }));
          return;
        }

        if (req.url === '/api/v1/analyze/skills') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            service: 'careerpilot-ai-service',
            status: 'ready',
            message: 'AI skill analysis pipeline is ready for model integration'
          }));
          return;
        }

        if (req.url === '/api/v1/analyze/learning') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            service: 'careerpilot-ai-service',
            status: 'ready',
            message: 'AI learning recommendation pipeline is ready for model integration'
          }));
          return;
        }

        if (req.url === '/slow-endpoint') {
          // Delay response to test timeout
          setTimeout(() => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          }, 1000);
          return;
        }

        res.writeHead(404);
        res.end();
      });
    });

    mockFastAPI.listen(0, async () => {
      const mockPort = mockFastAPI.address().port;
      aiClient.AI_SERVICE_URL = `http://localhost:${mockPort}`;

      // Live health check
      const liveHealth = await aiClient.checkHealth();
      assert(liveHealth.success === true, 'Live health check returns success: true');

      // Live GET /api/health/ai check
      const liveExpressHealth = await fetch(`http://localhost:${port}/api/health/ai`);
      assert(liveExpressHealth.status === 200, 'GET /api/health/ai returns 200 when FastAPI is online');

      // Career Analysis request
      const careerRes = await aiClient.analyzeCareer({ targetCareer: 'Software Engineer', skills: ['JS'] });
      assert(careerRes.success === true, 'analyzeCareer returns success: true');
      assert(careerRes.status === 'ready', 'analyzeCareer returns status: ready');

      // Skills Analysis request
      const skillsRes = await aiClient.analyzeSkills({ skills: ['JS'] }, ['Python']);
      assert(skillsRes.success === true, 'analyzeSkills returns success: true');

      // Learning Analysis request
      const learningRes = await aiClient.analyzeLearning({ skills: ['JS'] }, ['Algorithms']);
      assert(learningRes.success === true, 'analyzeLearning returns success: true');

      // Test Timeout handling
      console.log('\nTest 4: Timeout handling verification');
      const timeoutRes = await aiClient._request('/slow-endpoint', { timeoutMs: 100 });
      assert(timeoutRes.success === false, 'Timeout request returns success: false');
      assert(timeoutRes.error === 'AI_SERVICE_TIMEOUT', 'Timeout error code is AI_SERVICE_TIMEOUT');

      // Test secret protection
      console.log('\nTest 5: Secret value protection audit');
      const resStr = JSON.stringify(careerRes);
      assert(!resStr.includes('placeholder_secret_key'), 'Response output omits AI_SERVICE_SECRET');

      // Restore original URL
      aiClient.AI_SERVICE_URL = originalUrl;

      mockFastAPI.close();
      server.close();

      console.log('\n--------------------------------------------------');
      console.log(`TEST SUMMARY: ${testPasses} Passed, ${testFails} Failed`);
      console.log('--------------------------------------------------\n');

      if (testFails > 0) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    });
  });
}

runTests();
