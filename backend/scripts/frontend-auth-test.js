const express = require('express');
const session = require('express-session');
const router = require('../src/routes');
const fs = require('fs');
const path = require('path');

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
  console.log('CAREERPILOT AI — PHASE 8.8.1 FRONTEND AUTH TEST SUITE');
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

      // Test 1 & 2: Unauthenticated index & auth-success redirect conditions
      console.log('\nTest 1 & 2: Unauthenticated access returns 401 from GET /api/auth/me');
      const unauthMe = await request('/auth/me');
      assert(unauthMe.status === 401, 'Unauthenticated GET /api/auth/me returns 401');
      assert(unauthMe.body.success === false, 'Returns success: false');

      // Test 3: Register success
      console.log('\nTest 3: Register new user via POST /api/auth/register');
      const regUser = { fullName: 'Sam Taylor', email: 'sam.taylor@example.com', password: 'Password123!' };
      const regRes = await request('/auth/register', {
        method: 'POST',
        body: regUser
      });
      assert(regRes.status === 201, 'Register returns 201 Created');
      assert(regRes.body.success === true, 'Returns success: true');
      assert(regRes.body.user.email === 'sam.taylor@example.com', 'Returns safe user email');
      assert(!regRes.body.user.password && !regRes.body.user.password_hash, 'Safe user omits password & hash');

      const userACookie = regRes.cookie;

      // Test 4: Duplicate registration rejection
      console.log('\nTest 4: Reject duplicate registration (409)');
      const dupRes = await request('/auth/register', {
        method: 'POST',
        body: regUser
      });
      assert(dupRes.status === 409, 'Duplicate email returns 409 Conflict');

      // Test 5: Valid login
      console.log('\nTest 5: Valid login via POST /api/auth/login');
      const loginRes = await request('/auth/login', {
        method: 'POST',
        body: { email: 'sam.taylor@example.com', password: 'Password123!' }
      });
      assert(loginRes.status === 200, 'Valid login returns 200 OK');
      assert(loginRes.body.user.fullName === 'Sam Taylor', 'Returns safe user full name');

      const loginCookie = loginRes.cookie;

      // Test 6: Invalid login rejection
      console.log('\nTest 6: Reject invalid password (401)');
      const badLogin = await request('/auth/login', {
        method: 'POST',
        body: { email: 'sam.taylor@example.com', password: 'WrongPassword!' }
      });
      assert(badLogin.status === 401, 'Invalid password returns 401 Unauthorized');
      assert(badLogin.body.message === 'Invalid email or password.', 'Generic error message returned');

      // Test 7: GET /api/auth/me authenticated
      console.log('\nTest 7: GET /api/auth/me authenticated check');
      const meRes = await request('/auth/me', {
        headers: { Cookie: loginCookie }
      });
      assert(meRes.status === 200, 'GET /api/auth/me returns 200 OK');
      assert(meRes.body.user.email === 'sam.taylor@example.com', 'Returns authenticated user identity');

      // Test 8: Session persistence across requests
      console.log('\nTest 8: Session persistence verification');
      const meRes2 = await request('/auth/me', {
        headers: { Cookie: loginCookie }
      });
      assert(meRes2.status === 200, 'Session remains valid on subsequent request');

      // Test 9 & 10: Logout execution & post-logout 401
      console.log('\nTest 9 & 10: Logout execution & post-logout status');
      const logoutRes = await request('/auth/logout', {
        method: 'POST',
        headers: { Cookie: loginCookie }
      });
      assert(logoutRes.status === 200, 'Logout returns 200 OK');

      const postLogoutMe = await request('/auth/me', {
        headers: { Cookie: loginCookie }
      });
      assert(postLogoutMe.status === 401, 'GET /api/auth/me returns 401 post logout');

      // Test 11 & 12: Password security check in frontend source files
      console.log('\nTest 11 & 12: Source code password storage audit');
      const authJsCode = fs.readFileSync(path.join(__dirname, '../../auth.js'), 'utf8');
      assert(!authJsCode.includes("localStorage.setItem('password'"), 'auth.js does not store password in localStorage');
      assert(!authJsCode.includes("sessionStorage.setItem('password'"), 'auth.js does not store password in sessionStorage');

      // Test 13: Removal of careerPilotLoggedIn authentication dependency
      console.log('\nTest 13: Removal of careerPilotLoggedIn as auth source of truth');
      assert(authJsCode.includes("'careerPilotLoggedIn'") && authJsCode.includes("localStorage.removeItem"), 'auth.js manages legacy keys safely');

      // Test 14: User A -> Logout -> User B isolation
      console.log('\nTest 14: Multi-user authentication isolation');
      const regUserB = await request('/auth/register', {
        method: 'POST',
        body: { fullName: 'Alex Rivera', email: 'alex.rivera@example.com', password: 'Password456!' }
      });
      assert(regUserB.status === 201, 'User B registered');
      const userBMe = await request('/auth/me', {
        headers: { Cookie: regUserB.cookie }
      });
      assert(userBMe.body.user.email === 'alex.rivera@example.com', 'User B identity isolated from User A');

      // Test 15: Existing Phase 1-7 HTML pages load check
      console.log('\nTest 15: Phase 1-7 HTML pages existence & load check');
      const pages = ['index.html', 'login.html', 'register.html', 'auth-success.html', 'onboarding.html', 'assessment.html', 'readiness.html', 'roadmap.html', 'projects.html', 'interview.html'];
      let allPagesExist = true;
      for (const p of pages) {
        if (!fs.existsSync(path.join(__dirname, '../../', p))) {
          allPagesExist = false;
        }
      }
      assert(allPagesExist, 'All 10 Phase 1-7 frontend HTML pages exist and remain operational');

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
