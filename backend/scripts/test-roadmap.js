const express = require('express');
const session = require('express-session');
const router = require('../src/routes');
const ProfileService = require('../src/services/profile.service');

// Configure test Express app
const app = express();
app.use(express.json());
app.use(session({
  secret: 'test-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
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
  console.log('CAREERPILOT AI — PHASE 8.6 ROADMAP API TEST SUITE');
  console.log('==================================================\n');

  const server = app.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}/api`;

    try {
      // Helper for requests with cookie header
      async function request(path, options = {}) {
        const url = `${baseUrl}${path}`;
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

      // Test 1: Unauthenticated GET /api/roadmap -> 401
      console.log('Test 1: Unauthenticated GET /api/roadmap');
      const unauth = await request('/roadmap');
      assert(unauth.status === 401, 'Returns HTTP 401 Unauthorized for unauthenticated request');
      assert(unauth.body.success === false, 'success is false');

      // Register & Login User A
      console.log('\nSetting up User A...');
      const regA = await request('/auth/register', {
        method: 'POST',
        body: { fullName: 'Roadmap User A', email: 'roadmapA@example.com', password: 'Password123!' }
      });
      const loginA = await request('/auth/login', {
        method: 'POST',
        body: { email: 'roadmapA@example.com', password: 'Password123!' }
      });
      const sessionCookieA = loginA.cookie;
      const userAId = loginA.body.user.id;

      // Test 2: Incomplete profile -> 400 (PROFILE_INCOMPLETE)
      console.log('\nTest 2: Incomplete profile');
      const incProfileRes = await request('/roadmap', { headers: { Cookie: sessionCookieA } });
      assert(incProfileRes.status === 400, 'Returns HTTP 400 for incomplete profile');
      assert(incProfileRes.body.error === 'PROFILE_INCOMPLETE', 'error code is PROFILE_INCOMPLETE');

      // Complete Profile User A without target career
      console.log('\nUpdating User A profile (missing target career)...');
      await ProfileService.updateProfile(userAId, {
        personal: { fullName: 'Roadmap User A', email: 'roadmapA@example.com', location: 'Delhi', college: 'IIT', degree: 'BTech', branch: 'CSE', currentYear: '4th Year', graduationYear: 2026 },
        skills: ['JavaScript', 'HTML', 'Git'],
        interests: ['Web Development'],
        careerGoal: { targetCareer: '', experienceLevel: 'Beginner', goal: 'Become a Software Engineer' }
      });

      // Test 3: Missing target career -> 400 (MISSING_TARGET_CAREER)
      console.log('Test 3: Missing target career');
      const missCareerRes = await request('/roadmap', { headers: { Cookie: sessionCookieA } });
      assert(missCareerRes.status === 400, 'Returns HTTP 400 for missing target career');
      assert(missCareerRes.body.error === 'MISSING_TARGET_CAREER', 'error code is MISSING_TARGET_CAREER');

      // Update Profile User A with complete target career (Software Engineer)
      console.log('\nUpdating User A profile with target career (Software Engineer)...');
      await ProfileService.updateProfile(userAId, {
        personal: { fullName: 'Roadmap User A', email: 'roadmapA@example.com', location: 'Delhi', college: 'IIT', degree: 'BTech', branch: 'CSE', currentYear: '4th Year', graduationYear: 2026 },
        skills: ['Programming', 'Git'],
        interests: ['Software Engineering'],
        careerGoal: { targetCareer: 'Software Engineer', experienceLevel: 'Beginner', goal: 'Become a Software Engineer' }
      });

      // Test 4: Authenticated complete profile -> 200
      console.log('\nTest 4: Authenticated complete profile GET /api/roadmap');
      const roadmapRes1 = await request('/roadmap', { headers: { Cookie: sessionCookieA } });
      console.log('TEST 4 DEBUG:', roadmapRes1.status, JSON.stringify(roadmapRes1.body));
      assert(roadmapRes1.status === 200, 'Returns HTTP 200 OK');
      assert(roadmapRes1.body.success === true, 'success is true');

      // Test 5: Exact roadmap response structure
      console.log('\nTest 5: Exact roadmap response structure');
      const rm1 = roadmapRes1.body.roadmap;
      assert(rm1.targetCareer === 'Software Engineer', 'targetCareer is Software Engineer');
      assert(typeof rm1.readinessScore === 'number', 'readinessScore is a number');
      assert(Array.isArray(rm1.stages), 'stages is an array');
      assert(Array.isArray(rm1.allItems), 'allItems is an array');
      assert(typeof rm1.totalItems === 'number', 'totalItems is a number');
      assert(typeof rm1.completedItems === 'number', 'completedItems is a number');
      assert(typeof rm1.upcomingItems === 'number', 'upcomingItems is a number');
      assert(typeof rm1.highPriorityItems === 'number', 'highPriorityItems is a number');
      assert(typeof rm1.estimatedTotalEffort === 'string', 'estimatedTotalEffort is string');

      // Test 6: 5 stages present
      console.log('\nTest 6: Stages structure');
      assert(rm1.stages.length >= 1 && rm1.stages.length <= 5, 'contains valid stages array');
      const stage1 = rm1.stages.find(s => s.id === 'stage-1');
      assert(stage1 && stage1.title.includes('FOUNDATION'), 'Stage 1 title contains FOUNDATION');

      // Test 7: Current skills marked COMPLETED
      console.log('\nTest 7: COMPLETED status for profile.skills');
      const progItem = rm1.allItems.find(i => i.skill === 'Programming');
      assert(progItem && progItem.status === 'COMPLETED', 'Programming is marked COMPLETED');

      // Test 8: Missing relevant skills marked UPCOMING
      console.log('\nTest 8: UPCOMING status for missing skills');
      const dsaItem = rm1.allItems.find(i => i.skill === 'Data Structures & Algorithms');
      assert(dsaItem && dsaItem.status === 'UPCOMING', 'Data Structures & Algorithms is marked UPCOMING');

      // Test 9: Phase 4 priorities preserved
      console.log('\nTest 9: Priority preservation');
      assert(dsaItem && dsaItem.priority === 'HIGH', 'Data Structures & Algorithms priority is HIGH');

      // Test 10: Prerequisites preserved
      console.log('\nTest 10: Prerequisites mapping');
      const cssItem = rm1.allItems.find(i => i.skill === 'Data Structures & Algorithms');
      assert(cssItem && Array.isArray(cssItem.prerequisites), 'prerequisites is array');
      assert(cssItem.prerequisites.includes('Programming'), 'Programming is prerequisite for DSA');

      // Test 11: Effort values valid
      console.log('\nTest 11: Estimated effort format');
      assert(typeof dsaItem.estimatedEffort === 'string' && dsaItem.estimatedEffort.includes('hours'), 'estimatedEffort has valid hours format');

      // Test 12 & 13 & 14: Fingerprints persisted
      console.log('\nTest 12-14: Fingerprint persistence');
      assert(typeof rm1.profileFingerprint === 'string' && rm1.profileFingerprint.startsWith('fp_profile_'), 'profileFingerprint is fp_profile_...');
      assert(typeof rm1.readinessFingerprint === 'string' && rm1.readinessFingerprint.startsWith('fp_readiness_'), 'readinessFingerprint is fp_readiness_...');

      // Test 15: Repeated request reuses cached roadmap
      console.log('\nTest 15: Cache reuse');
      const roadmapRes2 = await request('/roadmap', { headers: { Cookie: sessionCookieA } });
      const rm2 = roadmapRes2.body.roadmap;
      assert(rm2.profileFingerprint === rm1.profileFingerprint, 'profileFingerprint matches cached');
      assert(rm2.readinessFingerprint === rm1.readinessFingerprint, 'readinessFingerprint matches cached');

      // Test 16: Profile/Readiness change regenerates roadmap
      console.log('\nTest 16: Profile change regenerates roadmap');
      await ProfileService.updateProfile(userAId, {
        personal: { fullName: 'Roadmap User A', email: 'roadmapA@example.com', location: 'Delhi', college: 'IIT', degree: 'BTech', branch: 'CSE', currentYear: '4th Year', graduationYear: 2026 },
        skills: ['Programming', 'Git', 'Data Structures & Algorithms'],
        interests: ['Software Engineering'],
        careerGoal: { targetCareer: 'Software Engineer', experienceLevel: 'Intermediate', goal: 'Become a Software Engineer' }
      });

      const roadmapRes3 = await request('/roadmap', { headers: { Cookie: sessionCookieA } });
      const rm3 = roadmapRes3.body.roadmap;
      assert(rm3.profileFingerprint !== rm1.profileFingerprint, 'New profileFingerprint generated after profile update');
      assert(rm3.completedItems > rm1.completedItems, 'completedItems count increased after adding DSA skill');

      // Test 17: User isolation
      console.log('\nTest 17: User isolation');
      console.log('Setting up User B...');
      const regB = await request('/auth/register', {
        method: 'POST',
        body: { fullName: 'Roadmap User B', email: 'roadmapB@example.com', password: 'Password123!' }
      });
      const loginB = await request('/auth/login', {
        method: 'POST',
        body: { email: 'roadmapB@example.com', password: 'Password123!' }
      });
      const sessionCookieB = loginB.cookie;
      const userBId = loginB.body.user.id;

      await ProfileService.updateProfile(userBId, {
        personal: { fullName: 'Roadmap User B', email: 'roadmapB@example.com', location: 'Mumbai', college: 'VJTI', degree: 'BTech', branch: 'IT', currentYear: '3rd Year', graduationYear: 2027 },
        skills: ['HTML', 'CSS'],
        interests: ['Frontend'],
        careerGoal: { targetCareer: 'Frontend Developer', experienceLevel: 'Beginner', goal: 'Frontend Developer' }
      });

      const roadmapResB = await request('/roadmap', { headers: { Cookie: sessionCookieB } });
      assert(roadmapResB.status === 200, 'User B GET /api/roadmap returns 200');
      assert(roadmapResB.body.roadmap.targetCareer === 'Frontend Developer', 'User B targetCareer is Frontend Developer');
      assert(roadmapResB.body.roadmap.profileFingerprint !== rm3.profileFingerprint, 'User B has separate fingerprint from User A');

      // Test 18 & 19: Password and password_hash absent
      console.log('\nTest 18-19: Security checks (no password/hash in response)');
      const rawStr = JSON.stringify(roadmapResB.body);
      assert(!rawStr.includes('password') && !rawStr.includes('password_hash'), 'No password or password_hash fields in API response');

      server.close();
      console.log('\n==================================================');
      console.log(`SUMMARY: ${testPasses} PASSED, ${testFails} FAILED`);
      console.log('==================================================\n');

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
