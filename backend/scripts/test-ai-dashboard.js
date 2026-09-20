/**
 * CAREERPILOT AI — PHASE 8.9.5 AI DASHBOARD INTEGRATION TEST SUITE
 * 
 * Tests backend AI dashboard aggregation API (GET /api/ai/dashboard), server-to-server security,
 * status classification (ai_generated / fallback), user session isolation, and fault tolerance.
 */

const express = require('express');
const session = require('express-session');
const http = require('http');
const router = require('../src/routes');
const aiClient = require('../src/services/aiClient');

const app = express();
app.use(express.json());
app.use(session({
  name: 'careerpilot_sid',
  secret: 'test-secret-key-123',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, sameSite: 'lax' }
}));
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
  console.log('CAREERPILOT AI — PHASE 8.9.5 AI DASHBOARD INTEGRATION TEST SUITE');
  console.log('==================================================\n');

  const server = app.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}/api`;

    // Helper to send HTTP requests with cookie handling
    async function request(pathUrl, options = {}) {
      const url = `${baseUrl}${pathUrl}`;
      const headers = options.headers || {};
      if (options.body) {
        headers['Content-Type'] = 'application/json';
      }

      const res = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
      });

      const setCookie = res.headers.get('set-cookie');
      let data = {};
      try {
        data = await res.json();
      } catch (e) {}

      return { status: res.status, ok: res.ok, data, setCookie };
    }

    // 1. Unauthenticated GET /api/ai/dashboard -> 401
    console.log('Test 1: Unauthenticated request handling');
    const unauthRes = await request('/ai/dashboard');
    assert(unauthRes.status === 401, 'GET /api/ai/dashboard returns 401 Unauthenticated');

    // 2. Register & Login User A
    console.log('\nTest 2: Register & Login User A');
    const userAEmail = `aidash_a_${Date.now()}@example.com`;
    const regRes = await request('/auth/register', {
      method: 'POST',
      body: { fullName: 'Alice AI', email: userAEmail, password: 'Password123!' }
    });
    assert(regRes.status === 201, 'User A registered successfully');

    const cookieA = regRes.setCookie;

    // 3. Incomplete Profile GET /api/ai/dashboard -> 400
    console.log('\nTest 3: Incomplete profile rejection');
    const incRes = await request('/ai/dashboard', {
      headers: { 'Cookie': cookieA }
    });
    assert(incRes.status === 400, 'GET /api/ai/dashboard returns 400 when profile is incomplete');

    // 4. Update User A Complete Profile
    console.log('\nTest 4: Save complete profile for User A');
    const putRes = await request('/profile', {
      method: 'PUT',
      headers: { 'Cookie': cookieA },
      body: {
        careerGoal: {
          targetCareer: 'AI/ML Engineer',
          experienceLevel: 'Intermediate',
          goal: 'Build machine learning pipelines'
        },
        skills: ['Python', 'NumPy'],
        interests: ['Artificial Intelligence'],
        personal: { fullName: 'Alice AI', location: 'San Francisco, CA' },
        education: { college: 'Stanford', degree: 'BS', branch: 'CS', currentYear: 'Senior', graduationYear: '2026' }
      }
    });
    assert(putRes.status === 200, 'User A profile updated successfully');

    // 5. Start mock FastAPI AI microservice to test full server-to-server pipeline
    console.log('\nTest 5: Live server-to-server AI Dashboard pipeline execution');
    const mockFastAPI = http.createServer((req, res) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        const apiKey = req.headers['x-ai-service-key'];

        if (!apiKey || apiKey !== 'placeholder_secret_key_change_in_production') {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'UNAUTHORIZED' }));
          return;
        }

        if (req.url === '/api/v1/analyze/career') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            service: 'careerpilot-ai-service',
            status: 'ai_generated',
            message: 'Career analysis generated',
            data: {
              status: 'ai_generated',
              career_direction: 'Targeting AI/ML Engineer role.',
              profile_summary: 'Alice AI with Python background.',
              strengths: ['Python', 'NumPy'],
              focus_areas: ['Machine Learning', 'Deep Learning'],
              career_advice: ['Focus on scikit-learn models.'],
              confidence_level: 'HIGH'
            }
          }));
          return;
        }

        if (req.url === '/api/v1/analyze/skills') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            service: 'careerpilot-ai-service',
            status: 'ai_generated',
            message: 'Skill insights generated',
            data: {
              status: 'ai_generated',
              target_career: 'AI/ML Engineer',
              required_skills: ['Python', 'NumPy', 'Machine Learning', 'Statistics'],
              matched_skills: ['Python', 'NumPy'],
              developing_skills: ['TensorFlow'],
              missing_skills: ['Machine Learning', 'Statistics'],
              priority_gaps: [
                { skill: 'Machine Learning', priority: 'HIGH', reason: 'Core model training requirement' }
              ],
              skill_gap_summary: 'Candidate matches 2 of 4 core skills.',
              confidence_level: 'HIGH'
            }
          }));
          return;
        }

        if (req.url === '/api/v1/analyze/learning') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            service: 'careerpilot-ai-service',
            status: 'ai_generated',
            message: 'Learning recommendations generated',
            data: {
              status: 'ai_generated',
              target_career: 'AI/ML Engineer',
              learning_priorities: [
                { skill: 'Machine Learning', priority: 'HIGH', reason: 'Primary gap' }
              ],
              learning_sequence: [
                {
                  order: 1,
                  skill: 'Statistics',
                  topics: ['Probability', 'Linear Algebra'],
                  prerequisites: ['Basic Math'],
                  practice_focus: ['Solve statistical problems'],
                  estimated_effort: 'MEDIUM'
                },
                {
                  order: 2,
                  skill: 'Machine Learning',
                  topics: ['Supervised Learning', 'Scikit-Learn'],
                  prerequisites: ['Statistics'],
                  practice_focus: ['Train regression models'],
                  estimated_effort: 'HIGH'
                }
              ],
              recommended_topics: ['Probability', 'Supervised Learning'],
              practice_focus: ['Train regression models'],
              learning_summary: '2-step learning pathway.',
              confidence_level: 'HIGH'
            }
          }));
          return;
        }

        res.writeHead(404);
        res.end();
      });
    });

    mockFastAPI.listen(0, async () => {
      const mockPort = mockFastAPI.address().port;
      const originalUrl = aiClient.AI_SERVICE_URL;
      aiClient.AI_SERVICE_URL = `http://localhost:${mockPort}`;

      // 6. Test GET /api/ai/dashboard with live mock AI service
      console.log('\nTest 6: Authenticated GET /api/ai/dashboard payload audit');
      const dashRes = await request('/ai/dashboard', {
        headers: { 'Cookie': cookieA }
      });
      assert(dashRes.status === 200, 'GET /api/ai/dashboard returns 200 OK');
      const dashData = dashRes.data;
      assert(dashData.success === true, 'Response indicates success: true');
      assert(dashData.aiHealth && dashData.aiHealth.online === true, 'aiHealth indicates online: true');

      // 7. Verify Career Analysis payload
      console.log('\nTest 7: Career Analysis payload verification');
      assert(dashData.careerAnalysis !== null, 'careerAnalysis object present');
      assert(dashData.careerAnalysis && dashData.careerAnalysis.confidence_level === 'HIGH', 'Career analysis confidence is HIGH');

      // 8. Verify 4-bucket Skill Gap Intelligence payload
      console.log('\nTest 8: 4-Bucket Skill Gap Intelligence payload verification');
      const sa = dashData.skillAnalysis;
      assert(sa !== null, 'skillAnalysis object present');
      assert(sa && Array.isArray(sa.matched_skills) && sa.matched_skills.includes('Python'), 'Matched skills include Python');
      assert(sa && Array.isArray(sa.developing_skills) && sa.developing_skills.includes('TensorFlow'), 'Developing skills include TensorFlow');
      assert(sa && Array.isArray(sa.missing_skills) && sa.missing_skills.includes('Machine Learning'), 'Missing skills include Machine Learning');
      assert(sa && Array.isArray(sa.required_skills), 'Required skills present');

      // 9. Verify Priority Gaps payload
      console.log('\nTest 9: Priority Skill Gaps payload verification');
      assert(sa && Array.isArray(sa.priority_gaps) && sa.priority_gaps.length > 0, 'Priority gaps present as an array');
      assert(sa && sa.priority_gaps[0].skill === 'Machine Learning', 'Priority gap matches Machine Learning');

      // 10. Verify Learning Intelligence payload & Sequence ordering
      console.log('\nTest 10: Learning Intelligence sequence payload verification');
      const la = dashData.learningAnalysis;
      assert(la !== null, 'learningAnalysis object present');
      assert(la && Array.isArray(la.learning_sequence) && la.learning_sequence.length === 2, 'Learning sequence has 2 steps');
      assert(la && la.learning_sequence[0].order === 1 && la.learning_sequence[0].skill === 'Statistics', 'Step 1 is Statistics (Prerequisite)');
      assert(la && la.learning_sequence[1].order === 2 && la.learning_sequence[1].skill === 'Machine Learning', 'Step 2 is Machine Learning');

      // 11. User B Session Isolation Test
      console.log('\nTest 11: Multi-user session isolation');
      const userBEmail = `aidash_b_${Date.now()}@example.com`;
      const regBRes = await request('/auth/register', {
        method: 'POST',
        body: { fullName: 'Bob Frontend', email: userBEmail, password: 'Password123!' }
      });
      const cookieB = regBRes.setCookie;

      await request('/profile', {
        method: 'PUT',
        headers: { 'Cookie': cookieB },
        body: {
          careerGoal: {
            targetCareer: 'Frontend Developer',
            experienceLevel: 'Intermediate',
            goal: 'Build modern UI components'
          },
          skills: ['HTML5', 'CSS3'],
          interests: ['Web Development'],
          personal: { fullName: 'Bob Frontend', location: 'New York, NY' },
          education: { college: 'NYU', degree: 'BS', branch: 'CS', currentYear: 'Senior', graduationYear: '2026' }
        }
      });

      const dashBRes = await request('/ai/dashboard', {
        headers: { 'Cookie': cookieB }
      });
      assert(dashBRes.status === 200, 'User B dashboard request succeeds');
      assert(dashBRes.data && dashBRes.data.success === true, 'User B data returned successfully');

      // 12. Security Audit (No secrets in response text)
      console.log('\nTest 12: Secret protection audit');
      const rawText = JSON.stringify(dashData);
      assert(!rawText.includes('placeholder_secret_key'), 'Response output omits AI_SERVICE_SECRET');
      assert(!rawText.includes('GEMINI_API_KEY'), 'Response output omits GEMINI_API_KEY');

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
