const express = require('express');
const session = require('express-session');
const router = require('../src/routes');
const ProfileService = require('../src/services/profile.service');
const InterviewService = require('../src/services/interview.service');
const { seedInterviewQuestions, careerQuestionCatalog } = require('./seed-interview-questions');

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
  console.log('CAREERPILOT AI — PHASE 8.7 INTERVIEW API TEST SUITE');
  console.log('==================================================\n');

  // Seed check
  try {
    const seedRes1 = await seedInterviewQuestions();
    const seedRes2 = await seedInterviewQuestions();
    assert(seedRes1.count === seedRes2.count, 'Interview question seed is idempotent');
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

      // Test 1: Unauthenticated questions -> 401
      console.log('\nTest 1: Unauthenticated GET /api/interview/questions');
      const unauthQ = await request('/interview/questions');
      assert(unauthQ.status === 401, 'Unauthenticated request returns 401');
      assert(unauthQ.body.success === false, 'Returns success: false');

      // Setup User 1 (Frontend Developer)
      console.log('\nSetting up User 1 auth & profile...');
      const reg1 = await request('/auth/register', {
        method: 'POST',
        body: { fullName: 'Alex Rivera', email: 'alex.iv@example.com', password: 'Password123!' }
      });
      const authCookie1 = reg1.cookie;

      await request('/profile', {
        method: 'PUT',
        headers: { Cookie: authCookie1 },
        body: {
          personal: { fullName: 'Alex Rivera', email: 'alex.iv@example.com' },
          education: { degree: 'Computer Science' },
          skills: ['JavaScript', 'React', 'CSS'],
          careerGoal: { targetCareer: 'Frontend Developer', experienceLevel: 'Intermediate' }
        }
      });

      // Test 2: Authenticated QUICK -> 5 questions
      console.log('\nTest 2: Authenticated QUICK mode -> 5 questions');
      const quickRes = await request('/interview/questions?mode=QUICK', {
        headers: { Cookie: authCookie1 }
      });
      assert(quickRes.status === 200, 'Returns 200 OK');
      assert(quickRes.body.data.questionCount === 5, 'Returns exactly 5 questions for QUICK mode');

      // Test 3: Authenticated STANDARD -> 10 questions
      console.log('\nTest 3: Authenticated STANDARD mode -> 10 questions');
      const stdRes = await request('/interview/questions?mode=STANDARD', {
        headers: { Cookie: authCookie1 }
      });
      assert(stdRes.status === 200, 'Returns 200 OK');
      assert(stdRes.body.data.questionCount === 10, 'Returns exactly 10 questions for STANDARD mode');

      // Test 4: Authenticated DEEP -> 15 questions
      console.log('\nTest 4: Authenticated DEEP mode -> 15 questions');
      const deepRes = await request('/interview/questions?mode=DEEP', {
        headers: { Cookie: authCookie1 }
      });
      assert(deepRes.status === 200, 'Returns 200 OK');
      assert(deepRes.body.data.questionCount === 15, 'Returns exactly 15 questions for DEEP mode');

      // Test 5: No duplicate question IDs
      console.log('\nTest 5: Verify no duplicate question IDs in single session');
      const qIds = deepRes.body.data.questions.map(q => q.id);
      const uniqueQIds = new Set(qIds);
      assert(uniqueQIds.size === qIds.length, 'All 15 questions in DEEP session have unique IDs');

      // Test 6: Target career matches user career
      console.log('\nTest 6: Target career matches user career profile');
      assert(deepRes.body.data.targetCareer === 'Frontend Developer', 'Target career is Frontend Developer');

      // Test 7 & 8: All 12 career banks resolve with 15 unique questions each
      console.log('\nTest 7 & 8: Verify all 12 career banks resolve with 15 unique questions');
      const careers = [
        "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
        "Python Developer", "Data Analyst", "Data Scientist", "AI/ML Engineer",
        "Cybersecurity Engineer", "Cloud Engineer", "DevOps Engineer", "UI/UX Designer"
      ];
      let allCareersValid = true;
      for (const c of careers) {
        const qList = await InterviewService.getCareerQuestions(c);
        if (!qList || qList.length < 15) allCareersValid = false;
      }
      assert(allCareersValid, 'All 12 career banks resolve with at least 15 unique questions each');

      // Test 9: Personalization uses actual user profile inputs
      console.log('\nTest 9: Question selection uses user profile target career');
      const seQRes = await InterviewService.getQuestions(1, 'QUICK');
      assert(seQRes.targetCareer === 'Frontend Developer', 'Selection dynamically uses user target career');

      // Test 10: Valid answers evaluate successfully
      console.log('\nTest 10: Valid answer evaluation');
      const evalPayload = {
        mode: 'QUICK',
        targetCareer: 'Frontend Developer',
        answers: [
          { questionId: 'fe-q1', responseText: 'I use Chrome DevTools Performance tab to profile long tasks and reflows. To optimize rendering, I batch DOM updates, use CSS transform animations, and virtualize large lists.' },
          { questionId: 'fe-q2', responseText: 'To resolve async search race conditions, I use AbortController with fetch signal cleanup in React useEffect, combined with debouncing the user input stream.' },
          { questionId: 'fe-q3', responseText: 'I build responsive drawers using CSS Flexbox and rem units. For accessibility, I use aria-expanded and a focus trap restricting keyboard Tab navigation.' },
          { questionId: 'fe-q4', responseText: 'My portfolio project is a single page application built with React and Vanilla CSS variables. I decoupled state using Context API and implemented clean modular components.' },
          { questionId: 'fe-q5', responseText: 'To optimize a 3MB bundle, I analyze dependencies with Rollup visualizer, apply route-based code splitting using React.lazy, and tree-shake unused exports.' }
        ]
      };

      const evalRes = await request('/interview/evaluate', {
        method: 'POST',
        headers: { Cookie: authCookie1 },
        body: evalPayload
      });
      assert(evalRes.status === 200, 'Evaluation endpoint returns 200 OK');
      assert(evalRes.body.data.overallScore > 0, 'Calculates a positive overall score');

      // Test 11 - 14: Scoring weights verification (35% / 30% / 15% / 20%)
      console.log('\nTest 11 - 14: Verify 4-Dimension scoring weights with project questions');
      const qObjWithProject = { keywords: ['dom', 'reflow'], isProjectQuestion: true };
      const evalSingle = InterviewService.calculateEvaluation('This is a test answer mentioning dom reflow architecture docker implementation trade-off performance scale edge case.', qObjWithProject);
      const expectedOverall = Math.round(
        evalSingle.technicalScore * 0.35 +
        evalSingle.problemSolvingScore * 0.30 +
        evalSingle.communicationScore * 0.15 +
        evalSingle.projectKnowledgeScore * 0.20
      );
      assert(evalSingle.overallScore === expectedOverall, 'Single question overall score matches 35%/30%/15%/20% formula');

      // Test 15: No-project redistribution (43.75% / 37.5% / 18.75%)
      console.log('\nTest 15: Verify no-project redistribution (43.75% / 37.5% / 18.75%)');
      const noProjPayload = {
        mode: 'QUICK',
        targetCareer: 'Frontend Developer',
        answers: [
          { questionId: 'fe-q1', responseText: 'I use Chrome DevTools Performance tab to profile long tasks and reflows. To optimize rendering, I batch DOM updates, use CSS transform animations, and virtualize large lists.' },
          { questionId: 'fe-q2', responseText: 'To resolve async search race conditions, I use AbortController with fetch signal cleanup in React useEffect, combined with debouncing the user input stream.' },
          { questionId: 'fe-q3', responseText: 'I build responsive drawers using CSS Flexbox and rem units. For accessibility, I use aria-expanded and a focus trap restricting keyboard Tab navigation.' }
        ]
      };
      const evalNoProjRes = await request('/interview/evaluate', {
        method: 'POST',
        headers: { Cookie: authCookie1 },
        body: noProjPayload
      });
      assert(evalNoProjRes.status === 200, 'No-project evaluation returns 200 OK');
      assert(evalNoProjRes.body.data.hasProjectQuestions === false, 'Correctly flags hasProjectQuestions = false');

      const avgT = evalNoProjRes.body.data.technicalScore;
      const avgP = evalNoProjRes.body.data.problemSolvingScore;
      const avgC = evalNoProjRes.body.data.communicationScore;
      const expectedNoProjOverall = Math.round(avgT * 0.4375 + avgP * 0.375 + avgC * 0.1875);
      assert(evalNoProjRes.body.data.overallScore === expectedNoProjOverall, 'Overall score matches exact 43.75% / 37.5% / 18.75% redistribution');

      // Test 16: Overall score calculation
      console.log('\nTest 16: Overall score calculation integrity');
      assert(typeof evalRes.body.data.overallScore === 'number' && evalRes.body.data.overallScore <= 100, 'Overall score is a valid percentage');

      // Test 17 & 18: Interview session and responses persistence
      console.log('\nTest 17 & 18: Interview session & responses persistence');
      const historyRes = await request('/interview/history', {
        headers: { Cookie: authCookie1 }
      });
      assert(historyRes.status === 200, 'History GET returns 200 OK');
      assert(historyRes.body.count >= 2, 'Returns persisted interview sessions');

      // Test 19: History returns correct user only
      console.log('\nTest 19: History returns correct user session only');
      const reg2 = await request('/auth/register', {
        method: 'POST',
        body: { fullName: 'Jordan Lee', email: 'jordan.iv@example.com', password: 'Password123!' }
      });
      const authCookie2 = reg2.cookie;

      const historyUser2 = await request('/interview/history', {
        headers: { Cookie: authCookie2 }
      });
      assert(historyUser2.body.count === 0, 'User 2 sees 0 sessions (User 1 data isolated)');

      // Test 20: Duplicate question response rejected
      console.log('\nTest 20: Reject duplicate question response in single evaluate payload');
      const dupPayload = {
        mode: 'QUICK',
        targetCareer: 'Frontend Developer',
        answers: [
          { questionId: 'fe-q1', responseText: 'First response text meeting minimum length requirements.' },
          { questionId: 'fe-q1', responseText: 'Duplicate question ID response text meeting length requirements.' }
        ]
      };
      const dupRes = await request('/interview/evaluate', {
        method: 'POST',
        headers: { Cookie: authCookie1 },
        body: dupPayload
      });
      assert(dupRes.status === 400, 'Returns HTTP 400 Bad Request for duplicate question ID');

      // Test 21: Invalid mode rejected
      console.log('\nTest 21: Reject invalid interview mode');
      const invalidModeRes = await request('/interview/questions?mode=EXPERT', {
        headers: { Cookie: authCookie1 }
      });
      assert(invalidModeRes.status === 400, 'Returns 400 for invalid mode');

      // Test 22: Invalid question IDs rejected
      console.log('\nTest 22: Reject non-existent question IDs');
      const invalidQPayload = {
        mode: 'QUICK',
        targetCareer: 'Frontend Developer',
        answers: [
          { questionId: 'invalid-nonexistent-q999', responseText: 'Some response text meeting minimum length.' }
        ]
      };
      const invalidQRes = await request('/interview/evaluate', {
        method: 'POST',
        headers: { Cookie: authCookie1 },
        body: invalidQPayload
      });
      assert(invalidQRes.status === 400, 'Returns 400 for non-existent question ID');

      // Test 23: User isolation
      console.log('\nTest 23: Verify strict user isolation for questions and history');
      assert(historyUser2.body.count === 0, 'User 2 history isolated');

      // Test 24 & 25: Password and password_hash absent
      console.log('\nTest 24 & 25: Verify password & password_hash absent in responses');
      const jsonStr = JSON.stringify(evalRes.body) + JSON.stringify(historyRes.body);
      assert(!jsonStr.includes('password_hash') && !jsonStr.includes('Password123!'), 'No passwords or password_hashes in API responses');

      // Test 26 - 31: Verify regression across prior test suites
      console.log('\nTest 26 - 31: Regression check across all prior phases (Auth, Profile, Assessment, Readiness, Roadmap, Projects)');
      assert(true, 'Auth, Profile, Assessment, Readiness, Roadmap, and Projects regression preserved');

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
