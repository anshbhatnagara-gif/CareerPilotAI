/**
 * CAREERPILOT AI - AUTHENTICATION SERVICE (PHASE 1)
 * 
 * Manages user registration, credential verification, session state,
 * input validation, and route protection using localStorage.
 * 
 * Temporary local authentication only. Production authentication must use
 * server-side password hashing and secure session/token handling.
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
   * Helper to clear active user career profile & generated state from localStorage
   */
  clearActiveUserCareerState() {
    const userKeys = [
      'careerPilotProfile',
      'careerPilotAssessment',
      'careerPilotReadiness',
      'careerPilotRoadmap',
      'careerPilotProjects',
      'careerPilotInterview',
      'careerPilotInterviewHistory',
      'careerPilotCareerTools'
    ];
    userKeys.forEach(key => localStorage.removeItem(key));
  },

  /**
   * Helper to clear active career profile & state if a different user logs in
   */
  clearStaleUserData(activeEmail) {
    try {
      const profileRaw = localStorage.getItem('careerPilotProfile');
      if (profileRaw) {
        const profile = JSON.parse(profileRaw);
        if (profile && profile.personal && profile.personal.email && profile.personal.email.toLowerCase() !== activeEmail.toLowerCase()) {
          this.clearActiveUserCareerState();
        }
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  },

  /**
   * Register a new account
   * Temporary local authentication only. Production authentication must use
   * server-side password hashing and secure session/token handling.
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

    // Clear any leftover career data from previous active session before creating new account
    this.clearActiveUserCareerState();

    // Create user data object (prototype storage only)
    const newUser = {
      fullName: cleanName,
      email: cleanEmail,
      password: password // Temporary local prototype authentication
    };

    // Save to localStorage
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));

    // Set logged in state
    localStorage.setItem(STORAGE_KEYS.LOGGED_IN, 'true');

    return { success: true, user: { fullName: cleanName, email: cleanEmail } };
  },

  /**
   * Verify credentials and log in
   * Temporary local authentication only. Production authentication must use
   * server-side password hashing and secure session/token handling.
   */
  login(email, password) {
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    if (!cleanEmail || !password) {
      return { success: false, message: 'Invalid email or password.' };
    }

    const users = this.getRegisteredUsers();
    const matchedUser = users.find(u => u.email.toLowerCase() === cleanEmail && u.password === password);

    if (matchedUser) {
      // Clear career data if switching to a different user account
      this.clearStaleUserData(cleanEmail);

      const activeUser = { fullName: matchedUser.fullName, email: matchedUser.email };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(activeUser));
      localStorage.setItem(STORAGE_KEYS.LOGGED_IN, 'true');
      return { success: true, user: activeUser };
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
   * Retrieve active user details (without password attribute)
   */
  getCurrentUser() {
    try {
      const userRaw = localStorage.getItem(STORAGE_KEYS.USER);
      if (!userRaw) return null;
      const parsed = JSON.parse(userRaw);
      if (parsed) {
        return { fullName: parsed.fullName || '', email: parsed.email || '' };
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Log out active user and clear all user-specific career data
   */
  logout() {
    localStorage.removeItem(STORAGE_KEYS.LOGGED_IN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    this.clearActiveUserCareerState();
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
