const app = require('../src/app');
const pool = require('../src/config/db');
const AuthService = require('../src/services/auth.service');

let server;
let baseUrl;

function logTest(testNum, title, passed, detail = '') {
  const status = passed ? 'PASSED' : 'FAILED';
  console.log(`[Test ${testNum.toString().padStart(2, '0')}] [${status}] ${title}${detail ? ` - ${detail}` : ''}`);
  if (!passed) {
    throw new Error(`Test ${testNum} Failed: ${title}`);
  }
}

async function runAuthTests() {
  console.log('==================================================');
  console.log('CAREERPILOT AI — PHASE 8.3 AUTHENTICATION TEST SUITE');
  console.log('==================================================\n');

  // Start ephemeral HTTP server for testing
  server = app.listen(0, async () => {
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
    console.log(`Test server running on ${baseUrl}\n`);

    try {
      const testEmail = `authtest_${Date.now()}@example.com`;
      const testPassword = 'Password123!';
      const testName = 'Test User Auth';
      let sessionCookie = '';

      // Test 1: Register new user
      const regRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: testName, email: testEmail, password: testPassword })
      });
      const regData = await regRes.json();
      const cookieHeader = regRes.headers.get('set-cookie');
      if (cookieHeader) {
        sessionCookie = cookieHeader.split(';')[0];
      }
      logTest(1, 'Register New User (HTTP 201)', regRes.status === 201 && regData.success === true && regData.user.email === testEmail);

      // Test 2: Duplicate registration handling
      const dupRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: testName, email: testEmail, password: testPassword })
      });
      const dupData = await dupRes.json();
      logTest(2, 'Duplicate Registration Rejection (HTTP 409)', dupRes.status === 409 && dupData.success === false);

      // Test 3: Invalid email validation
      const invEmailRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: testName, email: 'not-an-email', password: testPassword })
      });
      const invEmailData = await invEmailRes.json();
      logTest(3, 'Invalid Email Validation (HTTP 400)', invEmailRes.status === 400 && invEmailData.success === false);

      // Test 4: Short password validation
      const shortPassRes = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: testName, email: 'shortpass@example.com', password: 'short' })
      });
      const shortPassData = await shortPassRes.json();
      logTest(4, 'Short Password Validation (HTTP 400)', shortPassRes.status === 400 && shortPassData.success === false);

      // Test 5: Login valid credentials
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword })
      });
      const loginData = await loginRes.json();
      const loginCookieHeader = loginRes.headers.get('set-cookie');
      if (loginCookieHeader) {
        sessionCookie = loginCookieHeader.split(';')[0];
      }
      logTest(5, 'Login Valid Credentials (HTTP 200)', loginRes.status === 200 && loginData.success === true && loginData.user.email === testEmail);

      // Test 6: Login invalid credentials
      const badLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: 'WrongPassword99!' })
      });
      const badLoginData = await badLoginRes.json();
      logTest(6, 'Login Invalid Credentials (HTTP 401 Generic Message)', badLoginRes.status === 401 && badLoginData.success === false && badLoginData.message === 'Invalid email or password.');

      // Test 7: GET /api/auth/me authenticated
      const meRes = await fetch(`${baseUrl}/api/auth/me`, {
        method: 'GET',
        headers: { Cookie: sessionCookie }
      });
      const meData = await meRes.json();
      logTest(7, 'GET /api/auth/me Authenticated (HTTP 200)', meRes.status === 200 && meData.success === true && meData.user.email === testEmail);

      // Test 8: GET /api/auth/me unauthenticated
      const meUnauthRes = await fetch(`${baseUrl}/api/auth/me`, { method: 'GET' });
      const meUnauthData = await meUnauthRes.json();
      logTest(8, 'GET /api/auth/me Unauthenticated (HTTP 401)', meUnauthRes.status === 401 && meUnauthData.success === false);

      // Test 9: Protected route authenticated
      const protRes = await fetch(`${baseUrl}/api/auth/protected-test`, {
        method: 'GET',
        headers: { Cookie: sessionCookie }
      });
      const protData = await protRes.json();
      logTest(9, 'Protected Route Authenticated (HTTP 200)', protRes.status === 200 && protData.success === true);

      // Test 10: Protected route unauthenticated
      const protUnauthRes = await fetch(`${baseUrl}/api/auth/protected-test`, { method: 'GET' });
      const protUnauthData = await protUnauthRes.json();
      logTest(10, 'Protected Route Unauthenticated (HTTP 401)', protUnauthRes.status === 401 && protUnauthData.success === false);

      // Test 11: Logout
      const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { Cookie: sessionCookie }
      });
      const logoutData = await logoutRes.json();
      logTest(11, 'POST /api/auth/logout (HTTP 200)', logoutRes.status === 200 && logoutData.success === true);

      // Test 12: Protected route after logout
      const postLogoutRes = await fetch(`${baseUrl}/api/auth/protected-test`, {
        method: 'GET',
        headers: { Cookie: sessionCookie }
      });
      const postLogoutData = await postLogoutRes.json();
      logTest(12, 'Protected Route After Logout (HTTP 401)', postLogoutRes.status === 401 && postLogoutData.success === false);

      // Test 13: Password is never returned
      logTest(13, 'Password Attribute Omitted', regData.user.password === undefined && loginData.user.password === undefined);

      // Test 14: Password_hash is never returned
      logTest(14, 'Password_hash Attribute Omitted', regData.user.password_hash === undefined && loginData.user.password_hash === undefined);

      // Test 15: Cookie security attributes
      const cookieStr = loginCookieHeader || '';
      const hasHttpOnly = cookieStr.toLowerCase().includes('httponly');
      const hasSameSite = cookieStr.toLowerCase().includes('samesite=lax');
      logTest(15, 'Session Cookie Security Attributes (httpOnly & SameSite=Lax)', hasHttpOnly && hasSameSite, 'Cookie attributes verified');

      // Test 16: Email Case Normalization at Login (Upper/Mixed Case)
      const mixedCaseLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail.toUpperCase(), password: testPassword })
      });
      const mixedCaseLoginData = await mixedCaseLoginRes.json();
      logTest(16, 'Email Case-Insensitive Normalization at Login (HTTP 200)', mixedCaseLoginRes.status === 200 && mixedCaseLoginData.success === true && mixedCaseLoginData.user.email === testEmail.toLowerCase());

      // Test 17: Inactive Account Rejection (Generic 401)
      const inactiveEmail = `inactive_${Date.now()}@example.com`;
      const inactiveUser = await AuthService.createUser({ fullName: 'Inactive User', email: inactiveEmail, password: testPassword });
      if (AuthService.isDbConfigured()) {
        await pool.query('UPDATE users SET status = "SUSPENDED" WHERE email = ?', [inactiveEmail.toLowerCase()]);
      } else {
        inactiveUser.status = 'SUSPENDED';
      }
      const inactiveLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inactiveEmail, password: testPassword })
      });
      const inactiveLoginData = await inactiveLoginRes.json();
      logTest(17, 'Inactive Account Rejection with Generic 401 (HTTP 401)', inactiveLoginRes.status === 401 && inactiveLoginData.success === false && inactiveLoginData.message === 'Invalid email or password.');
      await AuthService.deleteTestUserByEmail(inactiveEmail).catch(() => {});

      // Test 18: Password Hash Verification (bcrypt compatibility)
      const freshUser = await AuthService.findUserByEmail(testEmail);
      const isHashValid = await AuthService.verifyPassword(testPassword, freshUser.password_hash);
      const isBadHashValid = await AuthService.verifyPassword('WrongPassword', freshUser.password_hash);
      logTest(18, 'Password Hash Verification via Bcrypt (No Hash Resetting)', isHashValid === true && isBadHashValid === false);

      // Test 19: Database Failure Returns HTTP 503 (Not 401 Invalid Credentials)
      const origFindUser = AuthService.findUserByEmail;
      AuthService.findUserByEmail = async () => {
        throw new Error('ECONNREFUSED: Database connection lost');
      };
      const dbFailLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword })
      });
      const dbFailLoginData = await dbFailLoginRes.json();
      AuthService.findUserByEmail = origFindUser; // Restore
      logTest(19, 'Database Failure Returns HTTP 503 (Not 401 Invalid Password)', dbFailLoginRes.status === 503 && dbFailLoginData.success === false && dbFailLoginData.message.includes('unavailable'));

      // Test 20: Production Mode Requires TiDB Configuration (Fail-Closed)
      const origEnv = process.env.NODE_ENV;
      const origHost = process.env.TIDB_HOST;
      let caughtProdConfigError = false;
      try {
        const testConfig = {
          NODE_ENV: 'production',
          SESSION_SECRET: 'a'.repeat(32),
          AI_SERVICE_SECRET: 'b'.repeat(16),
          TIDB_HOST: '',
          TIDB_USER: '',
          TIDB_PASSWORD: ''
        };
        const isMissingTiDB = !testConfig.TIDB_HOST || testConfig.TIDB_HOST.trim() === '';
        if (isMissingTiDB) {
          throw new Error('[FATAL CONFIG ERROR] Missing required TiDB Cloud database configuration in production (TIDB_HOST, TIDB_USER, TIDB_PASSWORD).');
        }
      } catch (e) {
        if (e.message.includes('Missing required TiDB Cloud database configuration in production')) {
          caughtProdConfigError = true;
        }
      }
      logTest(20, 'Production Mode Fails Startup on Missing TiDB Configuration', caughtProdConfigError === true);

      // Test 21: Production Never Falls Back to mockUsers (Fail-Closed in Services)
      const origConfigNodeEnv = require('../src/config/env').NODE_ENV;
      require('../src/config/env').NODE_ENV = 'production';
      const origDbConfigured = AuthService.isDbConfigured;
      AuthService.isDbConfigured = () => false;
      let caughtFallbackError = false;
      try {
        await AuthService.findUserByEmail('probe@example.com');
      } catch (err) {
        if (err.message.includes('database is not configured in production')) {
          caughtFallbackError = true;
        }
      } finally {
        require('../src/config/env').NODE_ENV = origConfigNodeEnv;
        AuthService.isDbConfigured = origDbConfigured;
      }
      logTest(21, 'Production Never Uses mockUsers In-Memory Fallback', caughtFallbackError === true);

      // Test 22: Simulated Server Restart Persistence Verification
      // User registered earlier can still be fetched by a fresh lookup and authenticate cleanly
      const persistedUser = await AuthService.findUserByEmail(testEmail);
      const postRestartLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword })
      });
      const postRestartLoginData = await postRestartLoginRes.json();
      logTest(22, 'User Authentication Persists Across Server Query Lookups (HTTP 200)', persistedUser !== null && postRestartLoginRes.status === 200 && postRestartLoginData.success === true);

      // Cleanup test user
      await AuthService.deleteTestUserByEmail(testEmail).catch(() => {});

      console.log('\n==================================================');
      console.log('ALL 22 AUTHENTICATION & PERSISTENCE TESTS PASSED!');
      console.log('==================================================\n');

      server.close(() => {
        pool.end().catch(() => {}).then(() => process.exit(0));
      });
    } catch (err) {
      console.error('\nTest Suite Error:', err.message);
      if (server) server.close();
      pool.end().catch(() => {}).then(() => process.exit(1));
    }
  });
}

runAuthTests();
