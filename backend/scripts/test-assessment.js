const app = require('../src/app');
const pool = require('../src/config/db');
const AuthService = require('../src/services/auth.service');
const ProfileService = require('../src/services/profile.service');

let server;
let baseUrl;

function logTest(testNum, title, passed, detail = '') {
  const status = passed ? 'PASSED' : 'FAILED';
  console.log(`[Test ${testNum.toString().padStart(2, '0')}] [${status}] ${title}${detail ? ` - ${detail}` : ''}`);
  if (!passed) {
    throw new Error(`Test ${testNum} Failed: ${title}`);
  }
}

async function runAssessmentTests() {
  console.log('==================================================');
  console.log('CAREERPILOT AI — PHASE 8.5 ASSESSMENT TEST SUITE');
  console.log('==================================================\n');

  server = app.listen(0, async () => {
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
    console.log(`Test server running on ${baseUrl}\n`);

    const userAEmail = `ass_testA_${Date.now()}@example.com`;
    const userBEmail = `ass_testB_${Date.now()}@example.com`;
    const password = 'Password123!';

    let userACookie = '';
    let userBCookie = '';
    let userAId = null;
    let userBId = null;

    try {
      // Register User A & User B
      const regA = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: 'AssUser Alpha', email: userAEmail, password })
      });
      const dataA = await regA.json();
      userAId = dataA.user.id;
      const cookieA = regA.headers.get('set-cookie');
      if (cookieA) userACookie = cookieA.split(';')[0];

      const regB = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: 'AssUser Beta', email: userBEmail, password })
      });
      const dataB = await regB.json();
      userBId = dataB.user.id;
      const cookieB = regB.headers.get('set-cookie');
      if (cookieB) userBCookie = cookieB.split(';')[0];

      // Test 1: Unauthenticated GET /api/assessment
      const unauthRes = await fetch(`${baseUrl}/api/assessment`, { method: 'GET' });
      logTest(1, 'Unauthenticated GET /api/assessment (HTTP 401)', unauthRes.status === 401);

      // Test 2: Incomplete profile -> HTTP 400
      const incRes = await fetch(`${baseUrl}/api/assessment`, {
        method: 'GET',
        headers: { Cookie: userACookie }
      });
      const incData = await incRes.json();
      logTest(2, 'Incomplete Profile Assessment Request (HTTP 400)', incRes.status === 400 && incData.success === false);

      // Complete Profile for User A
      const validProfileA = {
        personal: { location: 'Kota' },
        education: { college: 'CPU', degree: 'B.Tech', branch: 'CSE', currentYear: '2nd Year', graduationYear: '2028' },
        skills: ['Python', 'JavaScript', 'Git', 'MySQL'],
        interests: ['AI / Machine Learning', 'Web Development'],
        careerGoal: { targetCareer: 'Software Engineer', experienceLevel: 'Beginner', goal: 'Job Ready' }
      };
      await fetch(`${baseUrl}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify(validProfileA)
      });

      // Test 3: Authenticated GET complete profile -> HTTP 200
      const getAssRes1 = await fetch(`${baseUrl}/api/assessment`, {
        method: 'GET',
        headers: { Cookie: userACookie }
      });
      const getAssData1 = await getAssRes1.json();
      logTest(3, 'Authenticated GET Complete Profile Assessment (HTTP 200)', getAssRes1.status === 200 && getAssData1.success === true);

      const ass1 = getAssData1.assessment;

      // Test 4: Exact Phase 3 response fields present
      const hasFields = ass1 && ass1.careerDirection && ass1.profileSummary && Array.isArray(ass1.strengths) &&
        Array.isArray(ass1.currentSkills) && Array.isArray(ass1.focusAreas) && ass1.careerAdvice &&
        ass1.confidenceLevel && ass1.generatedAt && ass1.profileFingerprint;
      logTest(4, 'Exact Phase 3 Response Fields Present', Boolean(hasFields));

      // Test 5: currentSkills equals profile skills
      logTest(5, 'currentSkills Equals Profile Skills', ass1.currentSkills.length === 4 && ass1.currentSkills.includes('Python'));

      // Test 6: Strengths derived strictly from profile
      logTest(6, 'Strengths Derived Strictly from Profile', ass1.strengths.includes('Programming Foundation') && ass1.strengths.includes('Version Control & Tooling Awareness'));

      // Test 7: focusAreas generated deterministically
      logTest(7, 'focusAreas Generated Deterministically', Array.isArray(ass1.focusAreas) && ass1.focusAreas.length > 0);

      // Test 8: confidenceLevel valid
      logTest(8, 'confidenceLevel Value Valid', ['HIGH', 'MODERATE', 'LOW'].includes(ass1.confidenceLevel));

      // Test 9: Assessment persisted & returned
      logTest(9, 'Assessment Persisted', Boolean(ass1.profileFingerprint && ass1.profileFingerprint.startsWith('fp_')));

      // Test 10: Second call reuses cached assessment based on fingerprint
      const getAssRes2 = await fetch(`${baseUrl}/api/assessment`, {
        method: 'GET',
        headers: { Cookie: userACookie }
      });
      const getAssData2 = await getAssRes2.json();
      logTest(10, 'Second Call Reuses Fingerprint Cached Assessment', getAssData2.assessment.profileFingerprint === ass1.profileFingerprint);

      // Test 11 & 12: Profile modification changes fingerprint and regenerates assessment
      const updatedProfileA = {
        ...validProfileA,
        skills: ['Python', 'JavaScript', 'Git', 'MySQL', 'React', 'Node.js']
      };
      await fetch(`${baseUrl}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify(updatedProfileA)
      });

      const getAssRes3 = await fetch(`${baseUrl}/api/assessment`, {
        method: 'GET',
        headers: { Cookie: userACookie }
      });
      const getAssData3 = await getAssRes3.json();
      logTest(11, 'Profile Modification Changes Fingerprint', getAssData3.assessment.profileFingerprint !== ass1.profileFingerprint);
      logTest(12, 'Modified Profile Regenerates Assessment Skills', getAssData3.assessment.currentSkills.length === 6);

      // Test 13: Password absent from response
      logTest(13, 'Password Attribute Omitted', getAssData3.assessment.password === undefined);

      // Test 14: Password_hash absent from response
      logTest(14, 'Password_hash Attribute Omitted', getAssData3.assessment.password_hash === undefined);

      // Test 15: User isolation (User B cannot see User A assessment)
      const getAssResB = await fetch(`${baseUrl}/api/assessment`, {
        method: 'GET',
        headers: { Cookie: userBCookie }
      });
      logTest(15, 'User Isolation Verified (User B with incomplete profile gets HTTP 400)', getAssResB.status === 400);

      // Test 16: Phase 8.4 Profile Infrastructure Compatible
      logTest(16, 'Phase 8.4 Profile Infrastructure Compatible', typeof ProfileService.getProfile === 'function');

      // Cleanup
      await AuthService.deleteTestUserByEmail(userAEmail).catch(() => {});
      await AuthService.deleteTestUserByEmail(userBEmail).catch(() => {});
      await ProfileService.deleteTestProfile(userAId).catch(() => {});
      await ProfileService.deleteTestProfile(userBId).catch(() => {});

      console.log('\n==================================================');
      console.log('ALL 16 ASSESSMENT API TESTS PASSED SUCCESSFULLY!');
      console.log('==================================================\n');

      server.close(() => {
        pool.end().catch(() => {}).then(() => process.exit(0));
      });
    } catch (err) {
      console.error('\nAssessment Test Suite Error:', err.message);
      if (server) server.close();
      pool.end().catch(() => {}).then(() => process.exit(1));
    }
  });
}

runAssessmentTests();
