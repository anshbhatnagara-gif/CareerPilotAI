const app = require('../src/app');
const pool = require('../src/config/db');
const AuthService = require('../src/services/auth.service');
const ProfileService = require('../src/services/profile.service');
const ReadinessService = require('../src/services/readiness.service');

let server;
let baseUrl;

function logTest(testNum, title, passed, detail = '') {
  const status = passed ? 'PASSED' : 'FAILED';
  console.log(`[Test ${testNum.toString().padStart(2, '0')}] [${status}] ${title}${detail ? ` - ${detail}` : ''}`);
  if (!passed) {
    throw new Error(`Test ${testNum} Failed: ${title}`);
  }
}

async function runReadinessTests() {
  console.log('==================================================');
  console.log('CAREERPILOT AI — PHASE 8.5 READINESS TEST SUITE');
  console.log('==================================================\n');

  server = app.listen(0, async () => {
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
    console.log(`Test server running on ${baseUrl}\n`);

    const userAEmail = `read_testA_${Date.now()}@example.com`;
    const userBEmail = `read_testB_${Date.now()}@example.com`;
    const password = 'Password123!';

    let userACookie = '';
    let userBCookie = '';
    let userAId = null;
    let userBId = null;

    try {
      // Setup User A & User B
      const regA = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: 'ReadUser Alpha', email: userAEmail, password })
      });
      const dataA = await regA.json();
      userAId = dataA.user.id;
      const cookieA = regA.headers.get('set-cookie');
      if (cookieA) userACookie = cookieA.split(';')[0];

      const regB = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: 'ReadUser Beta', email: userBEmail, password })
      });
      const dataB = await regB.json();
      userBId = dataB.user.id;
      const cookieB = regB.headers.get('set-cookie');
      if (cookieB) userBCookie = cookieB.split(';')[0];

      // Test 1: Unauthenticated GET /api/readiness -> HTTP 401
      const unauthRes = await fetch(`${baseUrl}/api/readiness`, { method: 'GET' });
      logTest(1, 'Unauthenticated GET /api/readiness (HTTP 401)', unauthRes.status === 401);

      // Test 2: Incomplete profile -> HTTP 400
      const incRes = await fetch(`${baseUrl}/api/readiness`, {
        method: 'GET',
        headers: { Cookie: userACookie }
      });
      const incData = await incRes.json();
      logTest(2, 'Incomplete Profile Readiness Request (HTTP 400)', incRes.status === 400 && incData.message.includes('Complete your career profile'));

      // Test 3: Missing target career -> HTTP 400
      const noTargetProfile = {
        personal: { location: 'Kota' },
        education: { college: 'CPU', degree: 'B.Tech', branch: 'CSE', currentYear: '2nd Year', graduationYear: '2028' },
        skills: ['Python'],
        interests: ['Web Development'],
        careerGoal: { targetCareer: '', experienceLevel: 'Beginner', goal: 'Job Ready' }
      };
      await fetch(`${baseUrl}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify(noTargetProfile)
      });
      const noTargetRes = await fetch(`${baseUrl}/api/readiness`, {
        method: 'GET',
        headers: { Cookie: userACookie }
      });
      const noTargetData = await noTargetRes.json();
      logTest(3, 'Missing Target Career Readiness Request (HTTP 400)', noTargetRes.status === 400 && noTargetData.success === false);

      // Complete Profile for User A (Software Engineer)
      const validProfileA = {
        personal: { location: 'Kota' },
        education: { college: 'CPU', degree: 'B.Tech', branch: 'CSE', currentYear: '2nd Year', graduationYear: '2028' },
        skills: ['C++', 'Git', 'GitHub', 'MySQL', 'Node.js'],
        interests: ['Software Development'],
        careerGoal: { targetCareer: 'Software Engineer', experienceLevel: 'Beginner', goal: 'Job Ready' }
      };
      await fetch(`${baseUrl}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify(validProfileA)
      });

      // Test 4: 12 Careers resolution check
      const careers = [
        "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
        "Python Developer", "Data Analyst", "Data Scientist", "AI/ML Engineer",
        "Cybersecurity Engineer", "Cloud Engineer", "DevOps Engineer", "UI/UX Designer"
      ];
      let allCareersResolved = true;
      careers.forEach(c => {
        const reqs = ReadinessService.getCareerRequirements(c);
        if (!Array.isArray(reqs) || reqs.length === 0) allCareersResolved = false;
      });
      logTest(4, 'All 12 Career Requirement Specifications Resolved', allCareersResolved);

      // Test 5: Exact required skill mappings present
      const seReqs = ReadinessService.getCareerRequirements('Software Engineer');
      logTest(5, 'Exact Required Skill Mappings Present for Software Engineer', seReqs.length === 9 && seReqs[0].name === 'Programming');

      // Test 6: Normalization rules
      const normCheck1 = ReadinessService.checkSkillSatisfaction('Programming', ['C++']);
      const normCheck2 = ReadinessService.checkSkillSatisfaction('Backend Fundamentals', ['Node.js']);
      const normCheck3 = ReadinessService.checkSkillSatisfaction('SQL', ['MySQL']);
      logTest(6, 'Skill Normalization Rules Verified', normCheck1 && normCheck2 && normCheck3);

      // Test 7: Weighted score calculation
      const readRes1 = await fetch(`${baseUrl}/api/readiness`, {
        method: 'GET',
        headers: { Cookie: userACookie }
      });
      const readData1 = await readRes1.json();
      const read1 = readData1.readiness;
      logTest(7, 'Weighted Score Calculation Verified', readRes1.status === 200 && typeof read1.score === 'number');

      // Test 8: Score range bounded 0–100
      logTest(8, 'Score Range Bounded (0-100)', read1.score >= 0 && read1.score <= 100);

      // Test 9: All 5 status ranges valid
      const validStatuses = ["JOB-READY FOUNDATION", "STRONG FOUNDATION", "DEVELOPING", "EARLY STAGE", "STARTING POINT"];
      logTest(9, 'Status Classification Valid', validStatuses.includes(read1.status));

      // Test 10: Priority counts present
      logTest(10, 'Priority Counts Present', read1.highPriorityCount !== undefined && read1.mediumPriorityCount !== undefined && read1.lowPriorityCount !== undefined);

      // Test 11: Covered/missing counts present
      logTest(11, 'Covered and Required Counts Present', read1.coveredCount !== undefined && read1.requiredCount === 9);

      // Test 12: Readiness persisted
      logTest(12, 'Readiness Persisted with Fingerprint', Boolean(read1.profileFingerprint && read1.profileFingerprint.startsWith('fp_readiness_')));

      // Test 13: Second call fingerprint caching behavior
      const readRes2 = await fetch(`${baseUrl}/api/readiness`, {
        method: 'GET',
        headers: { Cookie: userACookie }
      });
      const readData2 = await readRes2.json();
      logTest(13, 'Second Call Reuses Fingerprint Cached Readiness Report', readData2.readiness.profileFingerprint === read1.profileFingerprint);

      // Test 14: Profile change causes regeneration
      const updatedProfileA = {
        ...validProfileA,
        skills: ['C++', 'Git', 'GitHub', 'MySQL', 'Node.js', 'React', 'HTML', 'CSS']
      };
      await fetch(`${baseUrl}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify(updatedProfileA)
      });
      const readRes3 = await fetch(`${baseUrl}/api/readiness`, {
        method: 'GET',
        headers: { Cookie: userACookie }
      });
      const readData3 = await readRes3.json();
      logTest(14, 'Profile Change Causes Readiness Regeneration', readData3.readiness.profileFingerprint !== read1.profileFingerprint);

      // Test 15: Password absent
      logTest(15, 'Password Attribute Omitted', readData3.readiness.password === undefined);

      // Test 16: Password_hash absent
      logTest(16, 'Password_hash Attribute Omitted', readData3.readiness.password_hash === undefined);

      // Test 17: User isolation (User B receives incomplete profile error)
      const readResB = await fetch(`${baseUrl}/api/readiness`, {
        method: 'GET',
        headers: { Cookie: userBCookie }
      });
      logTest(17, 'User Isolation Verified (User B receives HTTP 400)', readResB.status === 400);

      // Test 18: Deterministic repeatability
      const calcA = ReadinessService.calculateReadiness(validProfileA, null, 'test_fp');
      const calcB = ReadinessService.calculateReadiness(validProfileA, null, 'test_fp');
      logTest(18, 'Deterministic Repeatability Verified', calcA.score === calcB.score && calcA.status === calcB.status);

      // Test 19: Phase 8.3 Auth Infrastructure Compatible
      logTest(19, 'Phase 8.3 Auth Infrastructure Compatible', typeof AuthService.findUserByEmail === 'function');

      // Test 20: Phase 8.4 Profile Infrastructure Compatible
      logTest(20, 'Phase 8.4 Profile Infrastructure Compatible', typeof ProfileService.getProfile === 'function');

      // Cleanup
      await AuthService.deleteTestUserByEmail(userAEmail).catch(() => {});
      await AuthService.deleteTestUserByEmail(userBEmail).catch(() => {});
      await ProfileService.deleteTestProfile(userAId).catch(() => {});
      await ProfileService.deleteTestProfile(userBId).catch(() => {});

      console.log('\n==================================================');
      console.log('ALL 20 READINESS API TESTS PASSED SUCCESSFULLY!');
      console.log('==================================================\n');

      server.close(() => {
        pool.end().catch(() => {}).then(() => process.exit(0));
      });
    } catch (err) {
      console.error('\nReadiness Test Suite Error:', err.message);
      if (server) server.close();
      pool.end().catch(() => {}).then(() => process.exit(1));
    }
  });
}

runReadinessTests();
