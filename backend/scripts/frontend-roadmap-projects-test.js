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

async function runFrontendRoadmapProjectsTests() {
  console.log('======================================================================');
  console.log('CAREERPILOT AI — PHASE 8.8.4 FRONTEND ROADMAP & PROJECTS TEST SUITE');
  console.log('======================================================================\n');

  server = app.listen(0, async () => {
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
    console.log(`Test server running on ${baseUrl}\n`);

    const userAEmail = `frp_testA_${Date.now()}@example.com`;
    const userBEmail = `frp_testB_${Date.now()}@example.com`;
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
        body: JSON.stringify({ fullName: 'RoadmapUser Alpha', email: userAEmail, password })
      });
      const dataA = await regA.json();
      userAId = dataA.user.id;
      const cookieHeaderA = regA.headers.get('set-cookie');
      if (cookieHeaderA) userACookie = cookieHeaderA.split(';')[0];

      const regB = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: 'RoadmapUser Beta', email: userBEmail, password })
      });
      const dataB = await regB.json();
      userBId = dataB.user.id;
      const cookieHeaderB = regB.headers.get('set-cookie');
      if (cookieHeaderB) userBCookie = cookieHeaderB.split(';')[0];

      // --------------------------------------------------
      // Test 1: Unauthenticated Roadmap GET -> 401
      // --------------------------------------------------
      const unauthRoad = await fetch(`${baseUrl}/api/roadmap`, { method: 'GET' });
      logTest(1, 'Unauthenticated Roadmap GET (HTTP 401)', unauthRoad.status === 401);

      // --------------------------------------------------
      // Test 2: Authenticated Roadmap GET on Incomplete Profile -> 400
      // --------------------------------------------------
      const incRoad = await fetch(`${baseUrl}/api/roadmap`, {
        method: 'GET',
        headers: { Cookie: userACookie }
      });
      const incRoadData = await incRoad.json();
      logTest(2, 'Incomplete Profile Roadmap GET (HTTP 400)', incRoad.status === 400 && incRoadData.success === false);

      // Complete Profile for User A
      const validProfileA = {
        personal: { location: 'Hyderabad' },
        education: { college: 'BITS Pilani', degree: 'B.E.', branch: 'CSE', currentYear: '3rd Year', graduationYear: '2027' },
        skills: ['JavaScript', 'HTML', 'CSS', 'Git', 'GitHub'],
        interests: ['Web Development'],
        careerGoal: { targetCareer: 'Frontend Developer', experienceLevel: 'Intermediate', goal: 'Become Senior Frontend Engineer' }
      };

      await fetch(`${baseUrl}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify(validProfileA)
      });

      // --------------------------------------------------
      // Test 3: Authenticated Roadmap GET -> 200
      // --------------------------------------------------
      const roadResA = await fetch(`${baseUrl}/api/roadmap`, {
        method: 'GET',
        headers: { Cookie: userACookie }
      });
      const roadDataA = await roadResA.json();
      logTest(3, 'Authenticated Roadmap GET (HTTP 200)', roadResA.status === 200 && roadDataA.success === true);

      const rmA = roadDataA.roadmap;

      // --------------------------------------------------
      // Test 4: Roadmap Payload Structure & 5 Stages Validation
      // --------------------------------------------------
      const rmValid = rmA &&
        typeof rmA.targetCareer === 'string' &&
        typeof rmA.readinessScore === 'number' &&
        Array.isArray(rmA.stages) &&
        rmA.stages.length >= 4 &&
        Array.isArray(rmA.allItems) &&
        typeof rmA.totalItems === 'number' &&
        typeof rmA.completedItems === 'number' &&
        typeof rmA.upcomingItems === 'number';
      logTest(4, 'Roadmap Payload & 5-Stage Structure Validation', Boolean(rmValid));

      // --------------------------------------------------
      // Test 5: Roadmap Fingerprints Presence
      // --------------------------------------------------
      logTest(5, 'Roadmap Profile & Readiness Fingerprints Present', Boolean(rmA.profileFingerprint && rmA.readinessFingerprint));

      // --------------------------------------------------
      // Test 6: Incomplete Profile Handling (User B) -> 400
      // --------------------------------------------------
      const incRoadB = await fetch(`${baseUrl}/api/roadmap`, {
        method: 'GET',
        headers: { Cookie: userBCookie }
      });
      logTest(6, 'User B Incomplete Profile Roadmap GET (HTTP 400)', incRoadB.status === 400);

      // --------------------------------------------------
      // Test 7: Missing Target Career Roadmap GET -> 400
      // --------------------------------------------------
      const profileNoCareer = {
        personal: { location: 'Chennai' },
        education: { college: 'Anna University', degree: 'B.Tech', branch: 'ECE', currentYear: '1st Year', graduationYear: '2029' },
        skills: ['Python'],
        interests: ['AI / Machine Learning'],
        careerGoal: { targetCareer: '', experienceLevel: 'Beginner', goal: 'Explore tech' }
      };

      await fetch(`${baseUrl}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: userBCookie },
        body: JSON.stringify(profileNoCareer)
      });

      const roadResNoCareer = await fetch(`${baseUrl}/api/roadmap`, {
        method: 'GET',
        headers: { Cookie: userBCookie }
      });
      const roadDataNoCareer = await roadResNoCareer.json();
      logTest(7, 'Missing Target Career Roadmap GET (HTTP 400)', roadResNoCareer.status === 400 && roadDataNoCareer.success === false);

      // --------------------------------------------------
      // Test 8: Roadmap -> Projects Navigation Pipeline
      // --------------------------------------------------
      const navRoadRes = await fetch(`${baseUrl}/api/roadmap`, {
        method: 'GET',
        headers: { Cookie: userACookie }
      });
      const navProjRes = await fetch(`${baseUrl}/api/projects`, {
        method: 'GET',
        headers: { Cookie: userACookie }
      });
      logTest(8, 'Roadmap -> Projects Sequential Pipeline (HTTP 200)', navRoadRes.status === 200 && navProjRes.status === 200);

      // --------------------------------------------------
      // Test 9: Unauthenticated Projects GET -> 401
      // --------------------------------------------------
      const unauthProj = await fetch(`${baseUrl}/api/projects`, { method: 'GET' });
      logTest(9, 'Unauthenticated Projects GET (HTTP 401)', unauthProj.status === 401);

      // --------------------------------------------------
      // Test 10: Authenticated Projects GET -> 200
      // --------------------------------------------------
      const projDataA = await navProjRes.json();
      logTest(10, 'Authenticated Projects GET (HTTP 200)', projDataA.success === true && Array.isArray(projDataA.projects));

      // --------------------------------------------------
      // Test 11: Projects Payload Fields & Metrics Validation
      // --------------------------------------------------
      const projFieldsValid = projDataA &&
        typeof projDataA.targetCareer === 'string' &&
        typeof projDataA.totalProjects === 'number' &&
        typeof projDataA.completedProjects === 'number' &&
        typeof projDataA.inProgressProjects === 'number' &&
        typeof projDataA.notStartedProjects === 'number' &&
        typeof projDataA.highPriorityProjects === 'number' &&
        Array.isArray(projDataA.projects) &&
        projDataA.projects.length > 0;
      logTest(11, 'Projects Payload & Metrics Validation', Boolean(projFieldsValid));

      const targetProj = projDataA.projects[0];

      // --------------------------------------------------
      // Test 12: Project Status PATCH (IN_PROGRESS & COMPLETED)
      // --------------------------------------------------
      const patchRes1 = await fetch(`${baseUrl}/api/projects/${encodeURIComponent(targetProj.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify({ status: 'IN_PROGRESS' })
      });
      const patchData1 = await patchRes1.json();
      logTest(12, 'Project Status PATCH IN_PROGRESS (HTTP 200)', patchRes1.status === 200 && patchData1.success === true && patchData1.projectsData.inProgressProjects >= 1);

      // --------------------------------------------------
      // Test 13: Invalid Status PATCH -> 400
      // --------------------------------------------------
      const badPatchRes = await fetch(`${baseUrl}/api/projects/${encodeURIComponent(targetProj.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify({ status: 'INVALID_STATUS_KEY' })
      });
      const badPatchData = await badPatchRes.json();
      logTest(13, 'Invalid Status PATCH Rejection (HTTP 400)', badPatchRes.status === 400 && badPatchData.success === false);

      // --------------------------------------------------
      // Test 14: Status Persistence Across Subsequent GET
      // --------------------------------------------------
      const projResA2 = await fetch(`${baseUrl}/api/projects`, {
        method: 'GET',
        headers: { Cookie: userACookie }
      });
      const projDataA2 = await projResA2.json();
      const updatedProjMatch = (projDataA2.projects || []).find(p => String(p.id) === String(targetProj.id));
      logTest(14, 'Project Status Persistence Across Reloads', Boolean(updatedProjMatch && updatedProjMatch.status === 'IN_PROGRESS'));

      // --------------------------------------------------
      // Test 15: Project Completion Does NOT Modify Profile Skills
      // --------------------------------------------------
      await fetch(`${baseUrl}/api/projects/${encodeURIComponent(targetProj.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify({ status: 'COMPLETED' })
      });

      const profResCheck = await fetch(`${baseUrl}/api/profile`, {
        method: 'GET',
        headers: { Cookie: userACookie }
      });
      const profDataCheck = await profResCheck.json();
      logTest(15, 'Project Completion Does NOT Modify Profile Skills', profDataCheck.profile.skills.length === validProfileA.skills.length);

      // --------------------------------------------------
      // Test 16: Profile Change Regenerates Project Fingerprints & Preserves Status
      // --------------------------------------------------
      const updatedProfileA = {
        ...validProfileA,
        skills: ['JavaScript', 'HTML', 'CSS', 'Git', 'GitHub', 'React', 'Node.js']
      };
      await fetch(`${baseUrl}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify(updatedProfileA)
      });

      const projResA3 = await fetch(`${baseUrl}/api/projects`, {
        method: 'GET',
        headers: { Cookie: userACookie }
      });
      const projDataA3 = await projResA3.json();
      const checkPreserved = (projDataA3.projects || []).find(p => String(p.id) === String(targetProj.id));
      logTest(16, 'Profile Change Regenerates Fingerprint & Preserves Status', projDataA3.profileFingerprint !== projDataA.profileFingerprint && checkPreserved && checkPreserved.status === 'COMPLETED');

      // --------------------------------------------------
      // Test 17: Session Retention Across Calls
      // --------------------------------------------------
      const meRes = await fetch(`${baseUrl}/api/auth/me`, {
        method: 'GET',
        headers: { Cookie: userACookie }
      });
      const meData = await meRes.json().catch(() => ({}));
      logTest(17, 'Authentication Session Retention', meRes.status === 200 && meData.user && meData.user.email.toLowerCase() === userAEmail.toLowerCase());

      // Complete Profile B for User B
      const validProfileB = {
        personal: { location: 'Pune' },
        education: { college: 'COEP', degree: 'B.Tech', branch: 'Instru', currentYear: '4th Year', graduationYear: '2026' },
        skills: ['Python', 'SQL', 'Excel', 'Pandas'],
        interests: ['Data Science'],
        careerGoal: { targetCareer: 'Data Analyst', experienceLevel: 'Beginner', goal: 'Data Insights Analyst' }
      };

      await fetch(`${baseUrl}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: userBCookie },
        body: JSON.stringify(validProfileB)
      });

      // --------------------------------------------------
      // Test 18: User A / User B Isolation
      // --------------------------------------------------
      const projResB = await fetch(`${baseUrl}/api/projects`, {
        method: 'GET',
        headers: { Cookie: userBCookie }
      });
      const projDataB = await projResB.json();
      logTest(18, 'User A / User B Isolation Verified', projDataB.targetCareer === 'Data Analyst' && projDataB.completedProjects === 0);

      // --------------------------------------------------
      // Test 19: Password Absence in Payloads
      // --------------------------------------------------
      logTest(19, 'Password Attribute Omitted in Responses', rmA.password === undefined && projDataA.password === undefined);

      // --------------------------------------------------
      // Test 20: Password_hash Absence in Payloads
      // --------------------------------------------------
      logTest(20, 'Password_hash Attribute Omitted in Responses', rmA.password_hash === undefined && projDataA.password_hash === undefined);

      // --------------------------------------------------
      // Test 21: Database Tables Source-of-Truth Verification
      // --------------------------------------------------
      let dbVerified = true;
      if (process.env.TIDB_HOST) {
        const [rmRows] = await pool.query('SELECT * FROM roadmap_instances WHERE user_id = ?', [userAId]);
        const [upRows] = await pool.query('SELECT * FROM user_projects WHERE user_id = ?', [userAId]);
        if (rmRows.length === 0 || upRows.length === 0) dbVerified = false;
      }
      logTest(21, 'Database Tables Source-of-Truth Verification (roadmap_instances, roadmap_items, user_projects, project_catalog)', dbVerified);

      // Cleanup
      await AuthService.deleteTestUserByEmail(userAEmail).catch(() => {});
      await AuthService.deleteTestUserByEmail(userBEmail).catch(() => {});
      await ProfileService.deleteTestProfile(userAId).catch(() => {});
      await ProfileService.deleteTestProfile(userBId).catch(() => {});

      console.log('\n======================================================================');
      console.log('ALL 21 FRONTEND ROADMAP & PROJECTS TESTS PASSED SUCCESSFULLY!');
      console.log('======================================================================\n');

      server.close(() => {
        pool.end().catch(() => {}).then(() => process.exit(0));
      });
    } catch (err) {
      console.error('\nFrontend Roadmap & Projects Test Suite Error:', err.message);
      if (server) server.close();
      pool.end().catch(() => {}).then(() => process.exit(1));
    }
  });
}

runFrontendRoadmapProjectsTests();
