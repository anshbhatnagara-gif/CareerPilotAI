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

async function runFrontendAssessmentReadinessTests() {
  console.log('======================================================================');
  console.log('CAREERPILOT AI — PHASE 8.8.3 FRONTEND ASSESSMENT & READINESS TEST SUITE');
  console.log('======================================================================\n');

  server = app.listen(0, async () => {
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
    console.log(`Test server running on ${baseUrl}\n`);

    const userAEmail = `far_testA_${Date.now()}@example.com`;
    const userBEmail = `far_testB_${Date.now()}@example.com`;
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
        body: JSON.stringify({ fullName: 'FrontendUser Alpha', email: userAEmail, password })
      });
      const dataA = await regA.json();
      userAId = dataA.user.id;
      const cookieHeaderA = regA.headers.get('set-cookie');
      if (cookieHeaderA) userACookie = cookieHeaderA.split(';')[0];

      const regB = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: 'FrontendUser Beta', email: userBEmail, password })
      });
      const dataB = await regB.json();
      userBId = dataB.user.id;
      const cookieHeaderB = regB.headers.get('set-cookie');
      if (cookieHeaderB) userBCookie = cookieHeaderB.split(';')[0];

      // --------------------------------------------------
      // Test 1: Unauthenticated Assessment GET -> 401
      // --------------------------------------------------
      const unauthAss = await fetch(`${baseUrl}/api/assessment`, { method: 'GET' });
      logTest(1, 'Unauthenticated Assessment GET (HTTP 401)', unauthAss.status === 401);

      // --------------------------------------------------
      // Test 2: Unauthenticated Readiness GET -> 401
      // --------------------------------------------------
      const unauthRead = await fetch(`${baseUrl}/api/readiness`, { method: 'GET' });
      logTest(2, 'Unauthenticated Readiness GET (HTTP 401)', unauthRead.status === 401);

      // --------------------------------------------------
      // Test 3: Incomplete Profile Assessment GET -> 400
      // --------------------------------------------------
      const incAss = await fetch(`${baseUrl}/api/assessment`, {
        method: 'GET',
        headers: { Cookie: userACookie }
      });
      const incAssData = await incAss.json();
      logTest(3, 'Incomplete Profile Assessment GET (HTTP 400)', incAss.status === 400 && incAssData.success === false);

      // --------------------------------------------------
      // Test 4: Incomplete Profile Readiness GET -> 400
      // --------------------------------------------------
      const incRead = await fetch(`${baseUrl}/api/readiness`, {
        method: 'GET',
        headers: { Cookie: userACookie }
      });
      const incReadData = await incRead.json();
      logTest(4, 'Incomplete Profile Readiness GET (HTTP 400)', incRead.status === 400 && incReadData.success === false);

      // Complete Profile for User A
      const validProfileA = {
        personal: { location: 'New Delhi' },
        education: { college: 'IIT Delhi', degree: 'B.Tech', branch: 'CSE', currentYear: '3rd Year', graduationYear: '2027' },
        skills: ['JavaScript', 'HTML', 'CSS', 'React', 'Node.js', 'Git', 'GitHub'],
        interests: ['Web Development', 'Software Development'],
        careerGoal: { targetCareer: 'Frontend Developer', experienceLevel: 'Intermediate', goal: 'Build production web applications' }
      };

      await fetch(`${baseUrl}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify(validProfileA)
      });

      // --------------------------------------------------
      // Test 5: Authenticated Assessment GET -> 200
      // --------------------------------------------------
      const assResA = await fetch(`${baseUrl}/api/assessment`, {
        method: 'GET',
        headers: { Cookie: userACookie }
      });
      const assDataA = await assResA.json();
      logTest(5, 'Authenticated Assessment GET (HTTP 200)', assResA.status === 200 && assDataA.success === true);

      const assA = assDataA.assessment;

      // --------------------------------------------------
      // Test 6: Assessment Payload Fields Validation
      // --------------------------------------------------
      const assFieldsValid = assA &&
        typeof assA.careerDirection === 'string' &&
        typeof assA.profileSummary === 'string' &&
        Array.isArray(assA.strengths) &&
        Array.isArray(assA.currentSkills) &&
        Array.isArray(assA.focusAreas) &&
        typeof assA.careerAdvice === 'string' &&
        typeof assA.confidenceLevel === 'string' &&
        typeof assA.generatedAt === 'string' &&
        typeof assA.profileFingerprint === 'string';
      logTest(6, 'Assessment Payload Fields Validation', Boolean(assFieldsValid));

      // --------------------------------------------------
      // Test 7: Assessment currentSkills Correctness
      // --------------------------------------------------
      const skillsMatch = Array.isArray(assA.currentSkills) &&
        assA.currentSkills.length === validProfileA.skills.length &&
        assA.currentSkills.includes('React');
      logTest(7, 'Assessment currentSkills Correctness', Boolean(skillsMatch));

      // --------------------------------------------------
      // Test 8: Assessment profileFingerprint Presence
      // --------------------------------------------------
      logTest(8, 'Assessment profileFingerprint Format', Boolean(assA.profileFingerprint && assA.profileFingerprint.startsWith('fp_')));

      // --------------------------------------------------
      // Test 9: Authenticated Readiness GET -> 200
      // --------------------------------------------------
      const readResA = await fetch(`${baseUrl}/api/readiness`, {
        method: 'GET',
        headers: { Cookie: userACookie }
      });
      const readDataA = await readResA.json();
      logTest(9, 'Authenticated Readiness GET (HTTP 200)', readResA.status === 200 && readDataA.success === true);

      const readA = readDataA.readiness;

      // --------------------------------------------------
      // Test 10: Readiness Payload Fields Validation
      // --------------------------------------------------
      const readFieldsValid = readA &&
        typeof readA.targetCareer === 'string' &&
        typeof readA.score === 'number' &&
        typeof readA.status === 'string' &&
        Array.isArray(readA.requiredSkills) &&
        Array.isArray(readA.metSkills) &&
        Array.isArray(readA.missingSkills) &&
        Array.isArray(readA.skillGaps) &&
        typeof readA.highPriorityCount === 'number' &&
        typeof readA.mediumPriorityCount === 'number' &&
        typeof readA.lowPriorityCount === 'number' &&
        typeof readA.coveredCount === 'number' &&
        typeof readA.requiredCount === 'number' &&
        typeof readA.alignment === 'string' &&
        typeof readA.summary === 'string' &&
        typeof readA.advice === 'string';
      logTest(10, 'Readiness Payload Fields Validation', Boolean(readFieldsValid));

      // --------------------------------------------------
      // Test 11: Readiness Score Range (0 - 100)
      // --------------------------------------------------
      logTest(11, 'Readiness Score Range (0 - 100)', readA.score >= 0 && readA.score <= 100);

      // --------------------------------------------------
      // Test 12: Readiness Status Validity
      // --------------------------------------------------
      const validStatuses = ["JOB-READY FOUNDATION", "STRONG FOUNDATION", "DEVELOPING", "EARLY STAGE", "STARTING POINT"];
      logTest(12, 'Readiness Status Validity', validStatuses.includes(readA.status));

      // --------------------------------------------------
      // Test 13: Missing Target Career Readiness GET -> 400
      // --------------------------------------------------
      const profileNoCareer = {
        personal: { location: 'Mumbai' },
        education: { college: 'VJTI', degree: 'B.E.', branch: 'IT', currentYear: '1st Year', graduationYear: '2029' },
        skills: ['Python'],
        interests: ['AI / Machine Learning'],
        careerGoal: { targetCareer: '', experienceLevel: 'Beginner', goal: 'Learn coding' }
      };

      await fetch(`${baseUrl}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: userBCookie },
        body: JSON.stringify(profileNoCareer)
      });

      const readResNoCareer = await fetch(`${baseUrl}/api/readiness`, {
        method: 'GET',
        headers: { Cookie: userBCookie }
      });
      const readDataNoCareer = await readResNoCareer.json();
      logTest(13, 'Missing Target Career Readiness GET (HTTP 400)', readResNoCareer.status === 400 && (readDataNoCareer.message.includes('target career') || readDataNoCareer.message.includes('profile')));

      // --------------------------------------------------
      // Test 14: Readiness Deterministic Repeatability
      // --------------------------------------------------
      const readResA2 = await fetch(`${baseUrl}/api/readiness`, {
        method: 'GET',
        headers: { Cookie: userACookie }
      });
      const readDataA2 = await readResA2.json();
      logTest(14, 'Readiness Deterministic Repeatability', readDataA2.readiness.profileFingerprint === readA.profileFingerprint && readDataA2.readiness.score === readA.score);

      // --------------------------------------------------
      // Test 15: Profile Change Regeneration
      // --------------------------------------------------
      const updatedProfileA = {
        ...validProfileA,
        skills: ['JavaScript', 'HTML', 'CSS', 'React', 'Node.js', 'Git', 'GitHub', 'Responsive Design', 'APIs']
      };
      await fetch(`${baseUrl}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify(updatedProfileA)
      });

      const readResA3 = await fetch(`${baseUrl}/api/readiness`, {
        method: 'GET',
        headers: { Cookie: userACookie }
      });
      const readDataA3 = await readResA3.json();
      logTest(15, 'Profile Change Regenerates Readiness Score & Fingerprint', readDataA3.readiness.profileFingerprint !== readA.profileFingerprint && readDataA3.readiness.score >= readA.score);

      // --------------------------------------------------
      // Test 16: Session Retention Across Calls
      // --------------------------------------------------
      const meRes = await fetch(`${baseUrl}/api/auth/me`, {
        method: 'GET',
        headers: { Cookie: userACookie }
      });
      const meData = await meRes.json().catch(() => ({}));
      logTest(16, 'Authentication Session Retention', meRes.status === 200 && meData.user && meData.user.email.toLowerCase() === userAEmail.toLowerCase());

      // Complete Profile B for User B
      const validProfileB = {
        personal: { location: 'Bengaluru' },
        education: { college: 'IISc', degree: 'M.Tech', branch: 'AI', currentYear: '2nd Year', graduationYear: '2026' },
        skills: ['Python', 'Statistics', 'Mathematics', 'Machine Learning', 'Deep Learning'],
        interests: ['AI / Machine Learning', 'Data Science'],
        careerGoal: { targetCareer: 'AI/ML Engineer', experienceLevel: 'Advanced', goal: 'Deploy LLMs and AI models' }
      };

      await fetch(`${baseUrl}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: userBCookie },
        body: JSON.stringify(validProfileB)
      });

      // --------------------------------------------------
      // Test 17: User A / User B Isolation
      // --------------------------------------------------
      const readResB = await fetch(`${baseUrl}/api/readiness`, {
        method: 'GET',
        headers: { Cookie: userBCookie }
      });
      const readDataB = await readResB.json();
      logTest(17, 'User A / User B Isolation Verified', readDataB.readiness.targetCareer === 'AI/ML Engineer' && readDataB.readiness.targetCareer !== readDataA3.readiness.targetCareer);

      // --------------------------------------------------
      // Test 18: Password Absence in Payloads
      // --------------------------------------------------
      logTest(18, 'Password Attribute Omitted in Responses', assA.password === undefined && readA.password === undefined);

      // --------------------------------------------------
      // Test 19: Password_hash Absence in Payloads
      // --------------------------------------------------
      logTest(19, 'Password_hash Attribute Omitted in Responses', assA.password_hash === undefined && readA.password_hash === undefined);

      // --------------------------------------------------
      // Test 20: Assessment -> Readiness Navigation Pipeline
      // --------------------------------------------------
      const navAssRes = await fetch(`${baseUrl}/api/assessment`, {
        method: 'GET',
        headers: { Cookie: userACookie }
      });

      const navReadRes = await fetch(`${baseUrl}/api/readiness`, {
        method: 'GET',
        headers: { Cookie: userACookie }
      });
      logTest(20, 'Assessment -> Readiness Sequential Pipeline (HTTP 200)', navAssRes.status === 200 && navReadRes.status === 200);

      // --------------------------------------------------
      // Test 21: Readiness -> Roadmap Navigation Compatibility
      // --------------------------------------------------
      const navRoadRes = await fetch(`${baseUrl}/api/roadmap`, {
        method: 'GET',
        headers: { Cookie: userACookie }
      });
      logTest(21, 'Readiness -> Roadmap Sequential Pipeline (HTTP 200)', navRoadRes.status === 200);

      // Cleanup
      await AuthService.deleteTestUserByEmail(userAEmail).catch(() => {});
      await AuthService.deleteTestUserByEmail(userBEmail).catch(() => {});
      await ProfileService.deleteTestProfile(userAId).catch(() => {});
      await ProfileService.deleteTestProfile(userBId).catch(() => {});

      console.log('\n======================================================================');
      console.log('ALL 21 FRONTEND ASSESSMENT & READINESS TESTS PASSED SUCCESSFULLY!');
      console.log('======================================================================\n');

      server.close(() => {
        pool.end().catch(() => {}).then(() => process.exit(0));
      });
    } catch (err) {
      console.error('\nFrontend Assessment & Readiness Test Suite Error:', err.message);
      if (server) server.close();
      pool.end().catch(() => {}).then(() => process.exit(1));
    }
  });
}

runFrontendAssessmentReadinessTests();
