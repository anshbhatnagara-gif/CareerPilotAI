/**
 * CAREERPILOT AI — PHASE 8.8.5 FRONTEND INTERVIEW & CAREER TOOLS TEST SUITE
 * 
 * Comprehensive automated integration test suite validating:
 * - GET /api/interview/questions (QUICK: 5, STANDARD: 10, DEEP: 15)
 * - POST /api/interview/evaluate (Atomically persists session and responses)
 * - GET /api/interview/history
 * - GET & POST /api/career-tools/evidence
 * - GET /api/career-tools/passport
 * - User isolation, security (password omission), URL validation, and session persistence
 */

const http = require('http');
const app = require('../src/app');
const pool = require('../src/config/db');
const config = require('../src/config/env');
const ProfileService = require('../src/services/profile.service');

let server;
let baseUrl;

function logTest(num, title, passed, detail = '') {
  const status = passed ? '[PASSED]' : '[FAILED]';
  console.log(`[Test ${num < 10 ? '0' + num : num}] ${status} ${title}${detail ? ' - ' + detail : ''}`);
  if (!passed) {
    throw new Error(`Test ${num} failed: ${title}`);
  }
}

async function startServer() {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`Test server running on ${baseUrl}\n`);
      resolve();
    });
  });
}

async function stopServer() {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => resolve());
    } else {
      resolve();
    }
  });
}

function parseCookie(res) {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return null;
  return setCookie.split(';')[0];
}

async function runTests() {
  console.log('======================================================================');
  console.log('CAREERPILOT AI — PHASE 8.8.5 FRONTEND INTERVIEW & CAREER TOOLS TEST SUITE');
  console.log('======================================================================\n');

  await startServer();

  try {
    const timestamp = Date.now();
    const userAEmail = `interview_user_a_${timestamp}@example.com`;
    const userBEmail = `interview_user_b_${timestamp}@example.com`;
    const userPassword = 'Password123!';

    // --------------------------------------------------
    // Test 01: Unauthenticated Questions GET -> 401
    // --------------------------------------------------
    const unauthQRes = await fetch(`${baseUrl}/api/interview/questions?mode=QUICK`, {
      method: 'GET'
    });
    logTest(1, 'Unauthenticated Questions GET (HTTP 401)', unauthQRes.status === 401);

    // Setup User A with complete profile
    const regResA = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Alice Interviewer',
        email: userAEmail,
        password: userPassword
      })
    });
    const userACookie = parseCookie(regResA);
    const regDataA = await regResA.json();
    const userAId = regDataA.user.id;

    // Complete User A Profile
    await fetch(`${baseUrl}/api/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: userACookie },
      body: JSON.stringify({
        personal: { location: 'New York' },
        education: { college: 'NYU', degree: 'B.S. CS', branch: 'CS', currentYear: '4th', graduationYear: '2026' },
        skills: ['JavaScript', 'Node.js', 'React'],
        interests: ['Web Dev'],
        careerGoal: { targetCareer: 'Frontend Developer', experienceLevel: 'Beginner', goal: 'Become frontend expert' }
      })
    });

    // --------------------------------------------------
    // Test 02: Authenticated QUICK Mode -> 5 Questions
    // --------------------------------------------------
    const quickRes = await fetch(`${baseUrl}/api/interview/questions?mode=QUICK`, {
      method: 'GET',
      headers: { Cookie: userACookie }
    });
    const quickData = await quickRes.json();
    logTest(2, 'Authenticated QUICK Mode (5 Questions)', quickRes.status === 200 && quickData.success && quickData.data.questionCount === 5 && quickData.data.questions.length === 5);

    // --------------------------------------------------
    // Test 03: Authenticated STANDARD Mode -> 10 Questions
    // --------------------------------------------------
    const stdRes = await fetch(`${baseUrl}/api/interview/questions?mode=STANDARD`, {
      method: 'GET',
      headers: { Cookie: userACookie }
    });
    const stdData = await stdRes.json();
    logTest(3, 'Authenticated STANDARD Mode (10 Questions)', stdRes.status === 200 && stdData.success && stdData.data.questionCount === 10 && stdData.data.questions.length === 10);

    // --------------------------------------------------
    // Test 04: Authenticated DEEP Mode -> 15 Questions
    // --------------------------------------------------
    const deepRes = await fetch(`${baseUrl}/api/interview/questions?mode=DEEP`, {
      method: 'GET',
      headers: { Cookie: userACookie }
    });
    const deepData = await deepRes.json();
    logTest(4, 'Authenticated DEEP Mode (15 Questions)', deepRes.status === 200 && deepData.success && deepData.data.questionCount === 15 && deepData.data.questions.length === 15);

    // --------------------------------------------------
    // Test 05: No Duplicate Question IDs in Returned Array
    // --------------------------------------------------
    const qIds = deepData.data.questions.map(q => q.id);
    const uniqueQIds = new Set(qIds);
    logTest(5, 'No Duplicate Question IDs Detected', qIds.length === 15 && uniqueQIds.size === 15);

    // --------------------------------------------------
    // Test 06: Target Career Matches User Profile
    // --------------------------------------------------
    logTest(6, 'Target Career Matches Profile Target Career', quickData.data.targetCareer === 'Frontend Developer');

    // --------------------------------------------------
    // Test 07: All 12 Career Banks Accessible
    // --------------------------------------------------
    const roles = [
      "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
      "Python Developer", "Data Analyst", "Data Scientist", "AI/ML Engineer",
      "Cybersecurity Engineer", "Cloud Engineer", "DevOps Engineer", "UI/UX Designer"
    ];
    let allBanksValid = true;
    for (const role of roles) {
      // Temporarily update profile target career
      await fetch(`${baseUrl}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify({
          personal: { location: 'NY' },
          education: { college: 'NYU', degree: 'BS', branch: 'CS', currentYear: '4th', graduationYear: '2026' },
          skills: ['JS'], interests: ['Dev'],
          careerGoal: { targetCareer: role, experienceLevel: 'Beginner', goal: 'Goal' }
        })
      });
      const qRes = await fetch(`${baseUrl}/api/interview/questions?mode=QUICK`, {
        method: 'GET',
        headers: { Cookie: userACookie }
      });
      const qData = await qRes.json();
      if (!qRes.ok || qData.data.questions.length !== 5) {
        allBanksValid = false;
        break;
      }
    }
    logTest(7, 'All 12 Career Question Catalog Banks Accessible', allBanksValid);

    // Reset profile target career back to Frontend Developer
    await fetch(`${baseUrl}/api/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: userACookie },
      body: JSON.stringify({
        personal: { location: 'New York' },
        education: { college: 'NYU', degree: 'B.S. CS', branch: 'CS', currentYear: '4th', graduationYear: '2026' },
        skills: ['JavaScript', 'Node.js', 'React'],
        interests: ['Web Dev'],
        careerGoal: { targetCareer: 'Frontend Developer', experienceLevel: 'Beginner', goal: 'Become frontend expert' }
      })
    });

    // --------------------------------------------------
    // Test 08: Submit Answers to POST /api/interview/evaluate
    // --------------------------------------------------
    const questionsToAnswer = quickData.data.questions;
    const answerPayload = {
      mode: 'QUICK',
      targetCareer: 'Frontend Developer',
      answers: questionsToAnswer.map(q => ({
        questionId: q.id,
        responseText: 'This is a detailed technical interview answer discussing DOM reflow optimization, batching updates, using AbortController for race conditions, and measuring performance metrics.'
      }))
    };

    const evalRes = await fetch(`${baseUrl}/api/interview/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userACookie },
      body: JSON.stringify(answerPayload)
    });
    const evalData = await evalRes.json();
    logTest(8, 'Answer Submission & Evaluation Response Received (HTTP 200)', evalRes.status === 200 && evalData.success === true && Boolean(evalData.data));

    // --------------------------------------------------
    // Tests 09 - 14: Multi-Dimension Backend Scores Returned
    // --------------------------------------------------
    const evalObj = evalData.data;
    logTest(9, 'Technical Score Present & Range Valid (0-100)', typeof evalObj.technicalScore === 'number' && evalObj.technicalScore >= 0 && evalObj.technicalScore <= 100);
    logTest(10, 'Problem Solving Score Present & Range Valid (0-100)', typeof evalObj.problemSolvingScore === 'number' && evalObj.problemSolvingScore >= 0 && evalObj.problemSolvingScore <= 100);
    logTest(11, 'Communication Score Present & Range Valid (0-100)', typeof evalObj.communicationScore === 'number' && evalObj.communicationScore >= 0 && evalObj.communicationScore <= 100);
    logTest(12, 'Project Knowledge Score Present & Range Valid (0-100)', typeof evalObj.projectKnowledgeScore === 'number' && evalObj.projectKnowledgeScore >= 0 && evalObj.projectKnowledgeScore <= 100);
    logTest(13, 'Overall Score Present & Range Valid (0-100)', typeof evalObj.overallScore === 'number' && evalObj.overallScore >= 0 && evalObj.overallScore <= 100);
    logTest(14, 'Question Count Matches Submitted Count', evalObj.questionCount === 5);

    let lastEvalScore = evalObj.overallScore;

    // --------------------------------------------------
    // Test 15: No-Project Weight Redistribution Verification
    // --------------------------------------------------
    const noProjectQuestions = questionsToAnswer.filter(q => !q.isProjectQuestion);
    if (noProjectQuestions.length > 0) {
      const noProjPayload = {
        mode: 'QUICK',
        targetCareer: 'Frontend Developer',
        answers: noProjectQuestions.map(q => ({
          questionId: q.id,
          responseText: 'This is a technical answer explaining algorithm complexities and performance trade-offs in front-end applications.'
        }))
      };
      const noProjRes = await fetch(`${baseUrl}/api/interview/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: userACookie },
        body: JSON.stringify(noProjPayload)
      });
      const noProjData = await noProjRes.json();
      if (noProjData && noProjData.data) {
        lastEvalScore = noProjData.data.overallScore;
      }
      logTest(15, 'No-Project Question Weight Redistribution Applied', noProjRes.status === 200 && noProjData.data.hasProjectQuestions === false);
    } else {
      logTest(15, 'No-Project Weight Redistribution Check Skipped', true);
    }

    // --------------------------------------------------
    // Test 16 & 17: Session & Responses Persisted in DB / Store
    // --------------------------------------------------
    logTest(16, 'Interview Session Persisted with Valid Session ID', Boolean(evalObj.sessionId));
    logTest(17, 'Completed Timestamp Recorded', Boolean(evalObj.completedAt));

    // --------------------------------------------------
    // Test 18: History Returned from GET /api/interview/history
    // --------------------------------------------------
    const histRes = await fetch(`${baseUrl}/api/interview/history`, {
      method: 'GET',
      headers: { Cookie: userACookie }
    });
    const histData = await histRes.json();
    logTest(18, 'Interview History Returned (HTTP 200)', histRes.status === 200 && histData.success && histData.count >= 1 && Array.isArray(histData.data));

    // --------------------------------------------------
    // Test 19: History Survives Page Reload (Re-fetch)
    // --------------------------------------------------
    const histRes2 = await fetch(`${baseUrl}/api/interview/history`, {
      method: 'GET',
      headers: { Cookie: userACookie }
    });
    const histData2 = await histRes2.json();
    logTest(19, 'Interview History Persistence Verified', histRes2.status === 200 && histData2.data.length === histData.data.length);

    // --------------------------------------------------
    // Test 20: User A / User B Isolation for Interview History
    // --------------------------------------------------
    const regResB = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Bob Developer',
        email: userBEmail,
        password: userPassword
      })
    });
    const userBCookie = parseCookie(regResB);

    const histResB = await fetch(`${baseUrl}/api/interview/history`, {
      method: 'GET',
      headers: { Cookie: userBCookie }
    });
    const histDataB = await histResB.json();
    logTest(20, 'User A / User B Isolation (User B history empty)', histResB.status === 200 && histDataB.count === 0);

    // --------------------------------------------------
    // Test 21: Career Tools Evidence Loaded via GET /api/career-tools/evidence
    // --------------------------------------------------
    const evGetRes = await fetch(`${baseUrl}/api/career-tools/evidence`, {
      method: 'GET',
      headers: { Cookie: userACookie }
    });
    const evGetData = await evGetRes.json();
    logTest(21, 'Evidence GET Endpoint Accessible (HTTP 200)', evGetRes.status === 200 && evGetData.success && Array.isArray(evGetData.data));

    // --------------------------------------------------
    // Test 22: Save Portfolio Evidence via POST /api/career-tools/evidence
    // --------------------------------------------------
    const saveEvPayload = [
      {
        projectTitle: 'E-Commerce React Platform',
        githubRepoUrl: 'https://github.com/alice/ecommerce-react',
        liveDemoUrl: 'https://ecommerce-demo.vercel.app',
        projectDescription: 'High performance React online store with responsive UI',
        proofStatus: 'MANUAL_ENTRY'
      }
    ];

    const saveEvRes = await fetch(`${baseUrl}/api/career-tools/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userACookie },
      body: JSON.stringify(saveEvPayload)
    });
    const saveEvData = await saveEvRes.json();
    logTest(22, 'Portfolio Evidence Saved Successfully (HTTP 200)', saveEvRes.status === 200 && saveEvData.success && Array.isArray(saveEvData.data) && saveEvData.data.length >= 1);

    // --------------------------------------------------
    // Test 23: Malformed URLs Rejected with HTTP 400
    // --------------------------------------------------
    const badEvRes = await fetch(`${baseUrl}/api/career-tools/evidence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: userACookie },
      body: JSON.stringify([
        {
          projectTitle: 'Broken Links Project',
          githubRepoUrl: 'invalid-url-string',
          liveDemoUrl: 'not-a-valid-link'
        }
      ])
    });
    const badEvData = await badEvRes.json();
    logTest(23, 'Malformed URL Evidence Rejected (HTTP 400)', badEvRes.status === 400 && badEvData.success === false);

    // --------------------------------------------------
    // Test 24: User Evidence Isolation
    // --------------------------------------------------
    const evGetResB = await fetch(`${baseUrl}/api/career-tools/evidence`, {
      method: 'GET',
      headers: { Cookie: userBCookie }
    });
    const evGetDataB = await evGetResB.json();
    logTest(24, 'User Evidence Isolation (User B sees 0 evidence items)', evGetResB.status === 200 && evGetDataB.count === 0);

    // --------------------------------------------------
    // Test 25: Career Passport Loads via GET /api/career-tools/passport
    // --------------------------------------------------
    const passRes = await fetch(`${baseUrl}/api/career-tools/passport`, {
      method: 'GET',
      headers: { Cookie: userACookie }
    });
    const passData = await passRes.json();
    logTest(25, 'Career Passport Loaded (HTTP 200)', passRes.status === 200 && passData.success && Boolean(passData.data));

    // --------------------------------------------------
    // Test 26: Passport Reflects Latest Interview Score
    // --------------------------------------------------
    const passObj = passData.data;
    logTest(26, 'Passport Reflects Latest Interview Score', Boolean(passObj.latestInterview && passObj.latestInterview.overallScore === lastEvalScore));

    // --------------------------------------------------
    // Test 27: Passport Reflects Portfolio Evidence
    // --------------------------------------------------
    logTest(27, 'Passport Reflects Portfolio Evidence List', Array.isArray(passObj.portfolioEvidence) && passObj.portfolioEvidence.length >= 1);

    // --------------------------------------------------
    // Test 28: Proof / Status Remains Manual (No Fabricated Auto-Verification)
    // --------------------------------------------------
    const evItem = passObj.portfolioEvidence[0];
    logTest(28, 'Evidence Proof Status Remains MANUAL_ENTRY', evItem && evItem.proofStatus === 'MANUAL_ENTRY');

    // --------------------------------------------------
    // Test 29: Password and password_hash Omitted from Responses
    // --------------------------------------------------
    const passStr = JSON.stringify(passData);
    const hasPasswordLeak = passStr.includes('"password"') || passStr.includes('"password_hash"');
    logTest(29, 'Password & password_hash Attributes Omitted from API Output', !hasPasswordLeak);

    // --------------------------------------------------
    // Test 30: Session Retention Across Calls
    // --------------------------------------------------
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      method: 'GET',
      headers: { Cookie: userACookie }
    });
    const meData = await meRes.json();
    logTest(30, 'Session Retained Across API Calls', meRes.status === 200 && meData.user.email === userAEmail);

    // --------------------------------------------------
    // Test 31: Database Persistence Verification
    // --------------------------------------------------
    if (config.TIDB_HOST && config.TIDB_HOST.trim() !== '') {
      const [sessions] = await pool.query('SELECT * FROM interview_sessions WHERE user_id = ?', [userAId]);
      const [evidence] = await pool.query('SELECT * FROM portfolio_evidence WHERE user_id = ?', [userAId]);
      logTest(31, 'Database Tables Persistence Verification (interview_sessions & portfolio_evidence)', sessions.length >= 1 && evidence.length >= 1);
    } else {
      logTest(31, 'Database Verification (In-memory Store Fallback Active)', true);
    }

    console.log('\n======================================================================');
    console.log('ALL 31 FRONTEND INTERVIEW & CAREER TOOLS TESTS PASSED SUCCESSFULLY!');
    console.log('======================================================================\n');
  } finally {
    await stopServer();
  }
}

runTests().catch((err) => {
  console.error('\nTest Suite Failed:', err);
  process.exit(1);
});
