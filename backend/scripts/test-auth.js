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

      // Cleanup test user
      await AuthService.deleteTestUserByEmail(testEmail).catch(() => {});

      console.log('\n==================================================');
      console.log('ALL 15 AUTHENTICATION TESTS PASSED SUCCESSFULLY!');
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
