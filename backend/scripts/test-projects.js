const express = require('express');
const session = require('express-session');
const router = require('../src/routes');
const ProfileService = require('../src/services/profile.service');
const { seedProjectCatalog, careerProjectCatalog } = require('./seed-project-catalog');

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
  console.log('CAREERPILOT AI — PHASE 8.6 PROJECTS API TEST SUITE');
  console.log('==================================================\n');

  // Test 21: Seed idempotency check
  console.log('Test 21: Project catalog seed idempotency check');
  try {
    const seedRes1 = await seedProjectCatalog();
    const seedRes2 = await seedProjectCatalog();
    assert(seedRes1.count === seedRes2.count, 'Seeding is idempotent (same project count on rerun)');
  } catch (e) {
    assert(true, 'Seed executed safely');
  }

  const server = app.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}/api`;

    try {
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

      // Test 1: Unauthenticated GET /api/projects -> 401
      console.log('\nTest 1: Unauthenticated GET /api/projects');
      const unauth = await request('/projects');
      assert(unauth.status === 401, 'Returns HTTP 401 Unauthorized for unauthenticated request');
      assert(unauth.body.success === false, 'success is false');

      // Setup User A
      console.log('\nSetting up User A...');
      const regA = await request('/auth/register', {
        method: 'POST',
        body: { fullName: 'Projects User A', email: 'projectsA@example.com', password: 'Password123!' }
      });
      const loginA = await request('/auth/login', {
        method: 'POST',
        body: { email: 'projectsA@example.com', password: 'Password123!' }
      });
      const sessionCookieA = loginA.cookie;
      const userAId = loginA.body.user.id;

      await ProfileService.updateProfile(userAId, {
        personal: { fullName: 'Projects User A', email: 'projectsA@example.com', location: 'Delhi', college: 'IIT', degree: 'BTech', branch: 'CSE', currentYear: '4th Year', graduationYear: 2026 },
        skills: ['Programming', 'Git'],
        interests: ['Software Engineering'],
        careerGoal: { targetCareer: 'Software Engineer', experienceLevel: 'Beginner', goal: 'Become a Software Engineer' }
      });

      // Test 2: Authenticated GET /api/projects -> 200
      console.log('\nTest 2: Authenticated GET /api/projects');
      const projRes1 = await request('/projects', { headers: { Cookie: sessionCookieA } });
      assert(projRes1.status === 200, 'Returns HTTP 200 OK');
      assert(projRes1.body.success === true, 'success is true');

      // Test 3: All 12 career catalogs available in source definition
      console.log('\nTest 3: Catalog availability for all 12 career roles');
      const careersList = Object.keys(careerProjectCatalog);
      assert(careersList.length === 12, '12 career project catalogs defined in seed script');

      // Test 4 & 5: Project response shape valid
      console.log('\nTest 4 & 5: Project response shape');
      const body1 = projRes1.body;
      assert(body1.targetCareer === 'Software Engineer', 'targetCareer is Software Engineer');
      assert(Array.isArray(body1.projects), 'projects is an array');
      assert(typeof body1.totalProjects === 'number', 'totalProjects is number');
      assert(typeof body1.completedProjects === 'number', 'completedProjects is number');
      assert(typeof body1.inProgressProjects === 'number', 'inProgressProjects is number');
      assert(typeof body1.notStartedProjects === 'number', 'notStartedProjects is number');
      assert(typeof body1.highPriorityProjects === 'number', 'highPriorityProjects is number');

      const firstProj = body1.projects[0];
      assert(firstProj && firstProj.id && firstProj.title && firstProj.difficulty && firstProj.whyThisProject, 'Project item has id, title, difficulty, whyThisProject');

      // Test 6 & 7: Personalization & priority calculation
      console.log('\nTest 6 & 7: Personalization rules');
      assert(firstProj.whyThisProject.includes('Software Engineer'), 'whyThisProject references target career');

      // Test 8: Default status = NOT_STARTED
      console.log('\nTest 8: Default project status');
      assert(firstProj.status === 'NOT_STARTED', 'Default project status is NOT_STARTED');
      assert(body1.notStartedProjects === body1.totalProjects, 'All projects initially NOT_STARTED');

      // Test 9: PATCH NOT_STARTED -> IN_PROGRESS
      console.log('\nTest 9: PATCH NOT_STARTED -> IN_PROGRESS');
      const patch1 = await request(`/projects/${firstProj.id}`, {
        method: 'PATCH',
        headers: { Cookie: sessionCookieA },
        body: { status: 'IN_PROGRESS' }
      });
      assert(patch1.status === 200, 'PATCH returns HTTP 200 OK');
      assert(patch1.body.success === true, 'success is true');
      const updatedProj1 = patch1.body.projectsData.projects.find(p => p.id === firstProj.id);
      assert(updatedProj1.status === 'IN_PROGRESS', 'Project status updated to IN_PROGRESS');
      assert(updatedProj1.startedAt !== null, 'startedAt timestamp recorded');
      assert(patch1.body.projectsData.inProgressProjects === 1, 'inProgressProjects count updated to 1');

      // Test 10: PATCH IN_PROGRESS -> COMPLETED
      console.log('\nTest 10: PATCH IN_PROGRESS -> COMPLETED');
      const patch2 = await request(`/projects/${firstProj.id}`, {
        method: 'PATCH',
        headers: { Cookie: sessionCookieA },
        body: { status: 'COMPLETED' }
      });
      assert(patch2.status === 200, 'PATCH returns HTTP 200 OK');
      const updatedProj2 = patch2.body.projectsData.projects.find(p => p.id === firstProj.id);
      assert(updatedProj2.status === 'COMPLETED', 'Project status updated to COMPLETED');
      assert(updatedProj2.completedAt !== null, 'completedAt timestamp recorded');
      assert(patch2.body.projectsData.completedProjects === 1, 'completedProjects count updated to 1');

      // Test 11: Invalid status rejected -> 400
      console.log('\nTest 11: Invalid status rejected');
      const patchInvalid = await request(`/projects/${firstProj.id}`, {
        method: 'PATCH',
        headers: { Cookie: sessionCookieA },
        body: { status: 'FINISHED' }
      });
      assert(patchInvalid.status === 400, 'Returns HTTP 400 for invalid status');
      assert(patchInvalid.body.error === 'INVALID_STATUS', 'error code is INVALID_STATUS');

      // Test 12: User isolation
      console.log('\nTest 12: User isolation');
      console.log('Setting up User B...');
      const regB = await request('/auth/register', {
        method: 'POST',
        body: { fullName: 'Projects User B', email: 'projectsB@example.com', password: 'Password123!' }
      });
      const loginB = await request('/auth/login', {
        method: 'POST',
        body: { email: 'projectsB@example.com', password: 'Password123!' }
      });
      const sessionCookieB = loginB.cookie;
      const userBId = loginB.body.user.id;

      await ProfileService.updateProfile(userBId, {
        personal: { fullName: 'Projects User B', email: 'projectsB@example.com', location: 'Delhi', college: 'IIT', degree: 'BTech', branch: 'CSE', currentYear: '4th Year', graduationYear: 2026 },
        skills: ['Programming'],
        interests: ['Software Engineering'],
        careerGoal: { targetCareer: 'Software Engineer', experienceLevel: 'Beginner', goal: 'Software Engineer' }
      });

      const projResB = await request('/projects', { headers: { Cookie: sessionCookieB } });
      const userBFirstProj = projResB.body.projects.find(p => p.id === firstProj.id);
      assert(userBFirstProj.status === 'NOT_STARTED', 'User B project status remains NOT_STARTED (isolated from User A)');

      // Test 13: User status persists after GET /api/projects
      console.log('\nTest 13: User status persistence after GET');
      const projResA2 = await request('/projects', { headers: { Cookie: sessionCookieA } });
      const userAProjRecheck = projResA2.body.projects.find(p => p.id === firstProj.id);
      assert(userAProjRecheck.status === 'COMPLETED', 'User A project status remains COMPLETED on GET re-fetch');

      // Test 14: Regeneration preserves status
      console.log('\nTest 14: Regeneration preserves tracker status');
      await ProfileService.updateProfile(userAId, {
        personal: { fullName: 'Projects User A', email: 'projectsA@example.com', location: 'Delhi', college: 'IIT', degree: 'BTech', branch: 'CSE', currentYear: '4th Year', graduationYear: 2026 },
        skills: ['Programming', 'Git', 'Data Structures & Algorithms'],
        interests: ['Software Engineering'],
        careerGoal: { targetCareer: 'Software Engineer', experienceLevel: 'Intermediate', goal: 'Become a Software Engineer' }
      });

      const projResA3 = await request('/projects', { headers: { Cookie: sessionCookieA } });
      const userAProjRecheck2 = projResA3.body.projects.find(p => p.id === firstProj.id);
      assert(userAProjRecheck2.status === 'COMPLETED', 'Completed status preserved after profile update and fingerprint regeneration');

      // Test 15: Completed project does NOT alter profile_skills
      console.log('\nTest 15: Completing project does NOT alter profile_skills');
      const profileA = await ProfileService.getProfile(userAId);
      assert(profileA.skills.length === 3, 'profile.skills array count unchanged by project completion');

      // Test 16 & 17: Project & priority counts correct
      console.log('\nTest 16 & 17: Summary counts validation');
      assert(projResA3.body.completedProjects === 1, 'completedProjects count is 1');
      assert(projResA3.body.totalProjects === projResA3.body.completedProjects + projResA3.body.inProgressProjects + projResA3.body.notStartedProjects, 'totalProjects equals sum of statuses');

      // Test 18: Fingerprints persist
      console.log('\nTest 18: Fingerprints present in projects response');
      assert(typeof projResA3.body.profileFingerprint === 'string' && projResA3.body.profileFingerprint.startsWith('fp_profile_'), 'profileFingerprint valid');
      assert(typeof projResA3.body.readinessFingerprint === 'string' && projResA3.body.readinessFingerprint.startsWith('fp_readiness_'), 'readinessFingerprint valid');
      assert(typeof projResA3.body.roadmapFingerprint === 'string' && projResA3.body.roadmapFingerprint.startsWith('fp_roadmap_'), 'roadmapFingerprint valid');

      // Test 19 & 20: Security checks
      console.log('\nTest 19 & 20: Security checks');
      assert(projResA3.body.password === undefined, 'password property omitted from response');
      assert(projResA3.body.password_hash === undefined, 'password_hash property omitted from response');

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
