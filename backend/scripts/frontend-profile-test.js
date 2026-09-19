const express = require('express');
const session = require('express-session');
const router = require('../src/routes');

const app = express();
app.use(express.json());
app.use(session({
  name: 'careerpilot_sid',
  secret: 'test-secret',
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
  console.log('CAREERPILOT AI — PHASE 8.8.2 FRONTEND PROFILE TEST SUITE');
  console.log('==================================================\n');

  const server = app.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}/api`;

    try {
      async function request(pathUrl, options = {}) {
        const url = `${baseUrl}${pathUrl}`;
        const headers = options.headers || {};
        if (options.body) {
          headers['Content-Type'] = 'application/json';
        }
        const res = await fetch(url, {
          method: options.method || 'GET',
          headers: headers,
          body: options.body ? JSON.stringify(options.body) : undefined
        });
        const cookieHeader = res.headers.get('set-cookie');
        const json = await res.json().catch(() => ({}));
        return { status: res.status, body: json, cookie: cookieHeader };
      }

      // Test 1: Unauthenticated GET /api/profile -> 401
      console.log('\nTest 1: Unauthenticated GET /api/profile returns 401');
      const unauthGet = await request('/profile');
      assert(unauthGet.status === 401, 'Unauthenticated GET /api/profile returns 401');

      // Setup User A
      console.log('\nSetting up User A auth...');
      const regA = await request('/auth/register', {
        method: 'POST',
        body: { fullName: 'Ansh Bhatnagar', email: 'ansh.bhatnagar@example.com', password: 'Password123!' }
      });
      const cookieUserA = regA.cookie;

      // Test 2 & 3: Authenticated onboarding GET profile load
      console.log('\nTest 2 & 3: Authenticated GET /api/profile returns initial profile object');
      const getProfileA1 = await request('/profile', {
        headers: { Cookie: cookieUserA }
      });
      assert(getProfileA1.status === 200, 'GET /api/profile returns 200 OK');
      assert(getProfileA1.body.profile.personal.fullName === 'Ansh Bhatnagar', 'Personal fullName matches user identity');
      assert(getProfileA1.body.profile.personal.email === 'ansh.bhatnagar@example.com', 'Personal email matches user identity');
      assert(getProfileA1.body.profile.completed === false, 'Initial profile completed status is false');

      // Test 4: PUT /api/profile saves complete onboarding form
      console.log('\nTest 4: PUT /api/profile saves complete onboarding profile data');
      const profileDataUserA = {
        personal: { location: 'Kota, Rajasthan' },
        education: {
          college: 'LPU',
          degree: 'B.Tech',
          branch: 'Computer Science & Engineering',
          currentYear: '3rd Year',
          graduationYear: '2026'
        },
        skills: ['JavaScript', 'React', 'Node.js', 'Docker'],
        interests: ['Web Development', 'Software Development'],
        careerGoal: {
          targetCareer: 'Full Stack Developer',
          experienceLevel: 'Intermediate',
          goal: 'Build high performance scalable web applications'
        }
      };

      const putResA = await request('/profile', {
        method: 'PUT',
        headers: { Cookie: cookieUserA },
        body: profileDataUserA
      });
      assert(putResA.status === 200, 'PUT /api/profile returns 200 OK');
      assert(putResA.body.success === true, 'Returns success: true');
      assert(putResA.body.profile.completed === true, 'Backend marks profile completed = true');

      // Test 5, 6, 7 & 8: Reload profile from backend restores saved skills, interests, and completion
      console.log('\nTest 5 - 8: Reload profile from backend restores saved data & skills/interests');
      const getProfileA2 = await request('/profile', {
        headers: { Cookie: cookieUserA }
      });
      assert(getProfileA2.body.profile.personal.location === 'Kota, Rajasthan', 'Location reloads correctly');
      assert(getProfileA2.body.profile.education.college === 'LPU', 'College reloads correctly');
      assert(getProfileA2.body.profile.skills.includes('Docker'), 'Custom skill Docker saved & reloaded');
      assert(getProfileA2.body.profile.interests.includes('Web Development'), 'Interests saved & reloaded');
      assert(getProfileA2.body.profile.completed === true, 'Completion status remains true');

      // Test 9 & 10: Strict User A vs User B profile isolation
      console.log('\nTest 9 & 10: User A vs User B profile isolation');
      const regB = await request('/auth/register', {
        method: 'POST',
        body: { fullName: 'Priya Sharma', email: 'priya.sharma@example.com', password: 'Password456!' }
      });
      const cookieUserB = regB.cookie;

      const getProfileB = await request('/profile', {
        headers: { Cookie: cookieUserB }
      });
      assert(getProfileB.body.profile.personal.fullName === 'Priya Sharma', 'User B sees own name');
      assert(getProfileB.body.profile.personal.location === '', 'User B location is isolated (empty)');
      assert(getProfileB.body.profile.completed === false, 'User B profile is uncompleted');

      // Test 11: Absence of password or password_hash in profile payload
      console.log('\nTest 11: Security check - no passwords in profile response');
      const jsonStr = JSON.stringify(getProfileA2.body);
      assert(!jsonStr.includes('password') && !jsonStr.includes('password_hash'), 'No password or password_hash in profile response');

      // Test 12: Compatibility with existing backend tests
      console.log('\nTest 12: Verification of profile endpoints completeness');
      assert(getProfileA2.body.profile.careerGoal.targetCareer === 'Full Stack Developer', 'Target career persisted cleanly');

      console.log('\n--------------------------------------------------');
      console.log(`TEST SUMMARY: ${testPasses} Passed, ${testFails} Failed`);
      console.log('--------------------------------------------------\n');

      server.close();
      if (testFails > 0) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    } catch (err) {
      console.error('Test execution error:', err);
      server.close();
      process.exit(1);
    }
  });
}

runTests();
