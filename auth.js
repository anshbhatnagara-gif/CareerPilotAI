/**
 * CAREERPILOT AI - AUTHENTICATION SERVICE (PHASE 1)
 * 
 * Manages user registration, credential verification, session state,
 * input validation, and route protection using localStorage.
 * 
 * Modular architecture designed to allow replacing localStorage calls
 * with a REST / Node.js backend API in future phases.
 */

const STORAGE_KEYS = {
  USER: 'careerPilotUser',
  USERS_LIST: 'careerPilotUsersList',
  LOGGED_IN: 'careerPilotLoggedIn'
};

const AuthService = {
  /**
   * Helper to fetch all registered users from localStorage
   * Supports multiple registered users while maintaining compatibility
   * with the single careerPilotUser primary object.
   */
  getRegisteredUsers() {
    try {
      const listRaw = localStorage.getItem(STORAGE_KEYS.USERS_LIST);
      if (listRaw) {
        return JSON.parse(listRaw);
      }
      const singleUserRaw = localStorage.getItem(STORAGE_KEYS.USER);
      if (singleUserRaw) {
        return [JSON.parse(singleUserRaw)];
      }
      return [];
    } catch (e) {
      console.error('Error parsing stored user data:', e);
      return [];
    }
  },

  /**
   * Helper to validate email format
   */
  isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  },

  /**
   * Register a new account
   */
  register(fullName, email, password, confirmPassword) {
    const cleanName = fullName ? fullName.trim() : '';
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    // 1. Full Name check
    if (!cleanName) {
      return { success: false, message: 'Please enter your full name.' };
    }

    // 2. Email format check
    if (!cleanEmail || !this.isValidEmail(cleanEmail)) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    // 3. Password length check
    if (!password || password.length < 8) {
      return { success: false, message: 'Password must be at least 8 characters.' };
    }

    // 4. Confirm Password check
    if (password !== confirmPassword) {
      return { success: false, message: 'Passwords do not match.' };
    }

    // 5. Existing email check
    const users = this.getRegisteredUsers();
    const existingUser = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existingUser) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    // Create user data object
    const newUser = {
      fullName: cleanName,
      email: cleanEmail,
      password: password // Prototype storage only
    };

    // Save to localStorage
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));

    // Set logged in state
    localStorage.setItem(STORAGE_KEYS.LOGGED_IN, 'true');

    return { success: true, user: newUser };
  },

  /**
   * Verify credentials and log in
   */
  login(email, password) {
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    if (!cleanEmail || !password) {
      return { success: false, message: 'Invalid email or password.' };
    }

    const users = this.getRegisteredUsers();
    const matchedUser = users.find(u => u.email.toLowerCase() === cleanEmail && u.password === password);

    if (matchedUser) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(matchedUser));
      localStorage.setItem(STORAGE_KEYS.LOGGED_IN, 'true');
      return { success: true, user: matchedUser };
    }

    return { success: false, message: 'Invalid email or password.' };
  },

  /**
   * Check login state
   */
  isLoggedIn() {
    return localStorage.getItem(STORAGE_KEYS.LOGGED_IN) === 'true';
  },

  /**
   * Retrieve active user details
   */
  getCurrentUser() {
    try {
      const userRaw = localStorage.getItem(STORAGE_KEYS.USER);
      return userRaw ? JSON.parse(userRaw) : null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Log out active user
   */
  logout() {
    localStorage.removeItem(STORAGE_KEYS.LOGGED_IN);
    window.location.href = 'login.html';
  },

  /**
   * Route Guard: Protect auth-success.html
   */
  protectAuthSuccess() {
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
    }
  },

  /**
   * Route Guard: Prevent logged-in users from accessing login/register
   */
  redirectIfLoggedIn() {
    if (this.isLoggedIn()) {
      window.location.href = 'auth-success.html';
    }
  }
};
