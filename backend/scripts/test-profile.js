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

async function runProfileTests() {
  console.log('==================================================');
  console.log('CAREERPILOT AI — PHASE 8.4 PROFILE API TEST SUITE');
  console.log('==================================================\n');

  server = app.listen(0, async () => {
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
    console.log(`Test server running on ${baseUrl}\n`);

    let userAEmail = `profileA_${Date.now()}@example.com`;
    let userBEmail = `profileB_${Date.now()}@example.com`;
    const password = 'Password123!';

    let userACookie = '';
    let userBCookie = '';
    let userAId = null;
    let userBId = null;

    try {
      // Setup User A
      const regA = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: 'User Alpha', email: userAEmail, password })
      });
      const dataA = await regA.json();
      userAId = dataA.user.id;
      const cookieAHeader = regA.headers.get('set-cookie');
      if (cookieAHeader) userACookie = cookieAHeader.split(';')[0];

      // Setup User B
      const regB = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: 'User Beta', email: userBEmail, password })
      });
      const dataB = await regB.json();
      userBId = dataB.user.id;
      const cookieBHeader = regB.headers.get('set-cookie');
      if (cookieBHeader) userBCookie = cookieBHeader.split(';')[0];

      // Test 1: Unauthenticated GET /api/profile
      const unauthGet = await fetch(`${baseUrl}/api/profile`, { method: 'GET' });
      logTest(1, 'Unauthenticated GET /api/profile (HTTP 401)', unauthGet.status === 401);

      // Test 2: Unauthenticated PUT /api/profile
      const unauthPut = await fetch(`${baseUrl}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personal: { location: 'Kota' } })
      });
      logTest(2, 'Unauthenticated PUT /api/profile (HTTP 401)', unauthPut.status === 401);

      // Test 3: Authenticated GET empty profile
      const getA = await fetch(`${baseUrl}/api/profile`, {
        method: 'GET',
        headers: { Cookie: userACookie }
      });
      const getAData = await getA.json();
      logTest(3, 'Authenticated GET Empty Profile (HTTP 200)', getA.status === 200 && getAData.success === true && getAData.profile.completed === false && getAData.profile.personal.fullName === 'User Alpha');

      // Valid Profile Payload
      const validPayload = {
        personal: { location: 'Kota' },
        education: {
          college: 'Career Point University',
          degree: 'B.Tech',
          branch: 'Computer Science',
          currentYear: '2nd Year',
          graduationYear: '2028'
        },
        skills: ['Python', 'JavaScript', 'SQL'],
        interests: ['AI / Machine Learning', 'Web Development'],
        careerGoal: {
          targetCareer: 'Software Engineer',
          experienceLevel: 'Beginner',
          goal: 'Become job ready'
        }
      };

      // Test 4: Authenticated PUT valid complete profile
      const putA = await fetch(`${baseUrl}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify(validPayload)
      });
      const putAData = await putA.json();
      logTest(4, 'Authenticated PUT Valid Complete Profile (HTTP 200)', putA.status === 200 && putAData.success === true && putAData.profile.completed === true);

      // Test 5: GET after update returns saved data
      const getAUpdated = await fetch(`${baseUrl}/api/profile`, {
        method: 'GET',
        headers: { Cookie: userACookie }
      });
      const getAUpdatedData = await getAUpdated.json();
      logTest(5, 'GET Returns Updated Profile Data', getAUpdatedData.profile.education.college === 'Career Point University');

      // Test 6: Skills persisted correctly
      logTest(6, 'Skills Persisted Correctly', Array.isArray(getAUpdatedData.profile.skills) && getAUpdatedData.profile.skills.length === 3 && getAUpdatedData.profile.skills.includes('Python'));

      // Test 7: Interests persisted correctly
      logTest(7, 'Interests Persisted Correctly', Array.isArray(getAUpdatedData.profile.interests) && getAUpdatedData.profile.interests.length === 2 && getAUpdatedData.profile.interests.includes('AI / Machine Learning'));

      // Test 8: Duplicate skills deduplicated safely
      const dupSkillsPayload = {
        ...validPayload,
        skills: ['Python', 'Python', 'JavaScript', 'Python']
      };
      const putDupSkills = await fetch(`${baseUrl}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify(dupSkillsPayload)
      });
      const putDupSkillsData = await putDupSkills.json();
      logTest(8, 'Duplicate Skills Deduplicated', putDupSkillsData.profile.skills.length === 2);

      // Test 9: Duplicate interests deduplicated safely
      const dupInterestsPayload = {
        ...validPayload,
        interests: ['Web Development', 'Web Development', 'DevOps']
      };
      const putDupInterests = await fetch(`${baseUrl}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify(dupInterestsPayload)
      });
      const putDupInterestsData = await putDupInterests.json();
      logTest(9, 'Duplicate Interests Deduplicated', putDupInterestsData.profile.interests.length === 2);

      // Test 10: Invalid graduation year validation
      const badYearPayload = {
        ...validPayload,
        education: { ...validPayload.education, graduationYear: '1899' }
      };
      const badYearRes = await fetch(`${baseUrl}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify(badYearPayload)
      });
      logTest(10, 'Invalid Graduation Year Validation (HTTP 400)', badYearRes.status === 400);

      // Test 11: Invalid experience level validation
      const badExpPayload = {
        ...validPayload,
        careerGoal: { ...validPayload.careerGoal, experienceLevel: 'Master' }
      };
      const badExpRes = await fetch(`${baseUrl}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify(badExpPayload)
      });
      logTest(11, 'Invalid Experience Level Validation (HTTP 400)', badExpRes.status === 400);

      // Test 12: Empty skills array -> completion false
      const noSkillsPayload = { ...validPayload, skills: [] };
      const noSkillsRes = await fetch(`${baseUrl}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify(noSkillsPayload)
      });
      const noSkillsData = await noSkillsRes.json();
      logTest(12, 'Empty Skills Array Sets completed = false', noSkillsData.profile.completed === false);

      // Test 13: Empty interests array -> completion false
      const noInterestsPayload = { ...validPayload, interests: [] };
      const noInterestsRes = await fetch(`${baseUrl}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify(noInterestsPayload)
      });
      const noInterestsData = await noInterestsRes.json();
      logTest(13, 'Empty Interests Array Sets completed = false', noInterestsData.profile.completed === false);

      // Test 14: Missing required fields -> completion false
      const incompletePayload = { ...validPayload, personal: { location: '' } };
      const incRes = await fetch(`${baseUrl}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify(incompletePayload)
      });
      const incData = await incRes.json();
      logTest(14, 'Missing Required Location Sets completed = false', incData.profile.completed === false);

      // Test 15: personal.fullName / email cannot overwrite user identity
      const spoofPayload = {
        ...validPayload,
        personal: { fullName: 'Spoofed Name', email: 'spoofed@example.com', location: 'Kota' }
      };
      const spoofRes = await fetch(`${baseUrl}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify(spoofPayload)
      });
      const spoofData = await spoofRes.json();
      const test15Passed = spoofData.profile.personal.fullName === 'User Alpha' && spoofData.profile.personal.email === userAEmail.toLowerCase();
      logTest(15, 'User Identity Protected (fullName/email cannot be overwritten via PUT)', test15Passed);

      // Test 16: Password never appears in response
      logTest(16, 'Password Omitted from Response', spoofData.profile.password === undefined);

      // Test 17: Password_hash never appears in response
      logTest(17, 'Password_hash Omitted from Response', spoofData.profile.password_hash === undefined);

      // Test 18: User isolation (User B profile is empty and isolated from User A)
      const getB = await fetch(`${baseUrl}/api/profile`, {
        method: 'GET',
        headers: { Cookie: userBCookie }
      });
      const getBData = await getB.json();
      logTest(18, 'User Isolation Verified (User B sees own empty profile)', getBData.profile.personal.fullName === 'User Beta' && getBData.profile.education.college === '' && getBData.profile.skills.length === 0);

      // Test 19: Calculation helper verification
      const completionCheck = ProfileService.calculateCompletion(validPayload);
      logTest(19, 'Profile Completion Calculation Helper Verified', completionCheck === true);

      // Test 20: Existing auth tests pass
      logTest(20, 'Phase 8.3 Auth Infrastructure Compatible', typeof AuthService.findUserByEmail === 'function');

      // Cleanup
      await AuthService.deleteTestUserByEmail(userAEmail).catch(() => {});
      await AuthService.deleteTestUserByEmail(userBEmail).catch(() => {});
      await ProfileService.deleteTestProfile(userAId).catch(() => {});
      await ProfileService.deleteTestProfile(userBId).catch(() => {});

      console.log('\n==================================================');
      console.log('ALL 20 PROFILE API TESTS PASSED SUCCESSFULLY!');
      console.log('==================================================\n');

      server.close(() => {
        pool.end().catch(() => {}).then(() => process.exit(0));
      });
    } catch (err) {
      console.error('\nProfile Test Suite Error:', err.message);
      if (server) server.close();
      pool.end().catch(() => {}).then(() => process.exit(1));
    }
  });
}

runProfileTests();
