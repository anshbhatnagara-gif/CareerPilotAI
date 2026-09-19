/**
 * CAREERPILOT AI - AUTHENTICATION SERVICE (PHASE 8.8.1 MIGRATION)
 * 
 * Production REST API authentication engine connecting frontend to Node.js + Express backend.
 * 
 * Features:
 * - Centralized API Configuration (http://localhost:5000/api)
 * - HTTP-Only Session Cookie persistence via `credentials: "include"`
 * - Real-time authentication verification via GET /api/auth/me
 * - Zero client-side password storage (localStorage, sessionStorage, cookies)
 * - Safe user display state synchronization
 * - Clean error mapping & network failure fallback
 */

const API_BASE_URL = 'http://localhost:5000/api';

const STORAGE_KEYS = {
  USER: 'careerPilotUser',
  USERS_LIST: 'careerPilotUsersList',
  LOGGED_IN: 'careerPilotLoggedIn'
};

const AuthService = {
  API_BASE_URL,

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
   * Check authenticated session status via backend GET /api/auth/me
   */
  async checkAuthStatus() {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.user) {
          // Sync safe display user object in localStorage (NO passwords or secrets)
          const safeUser = { fullName: data.user.fullName, email: data.user.email };
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(safeUser));
          localStorage.removeItem(STORAGE_KEYS.LOGGED_IN);
          return { success: true, user: data.user };
        }
      }
      return { success: false, user: null };
    } catch (e) {
      console.warn('Auth check connection failed:', e);
      return { success: false, user: null, networkError: true };
    }
  },

  /**
   * Register a new account via POST /api/auth/register
   */
  async register(fullName, email, password, confirmPassword) {
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

    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fullName: cleanName, email: cleanEmail, password })
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 201 && data.success) {
        // Clear any leftover career data from previous active session before creating new account
        this.clearActiveUserCareerState();

        const safeUser = { fullName: data.user.fullName, email: data.user.email };
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(safeUser));
        localStorage.removeItem(STORAGE_KEYS.LOGGED_IN);

        return { success: true, user: safeUser };
      } else if (res.status === 409) {
        return { success: false, message: 'An account with this email address already exists.' };
      } else if (res.status === 400 && data.errors && data.errors.length > 0) {
        return { success: false, message: data.errors[0].message || data.message || 'Validation failed.' };
      } else {
        return { success: false, message: data.message || 'Registration failed. Please try again.' };
      }
    } catch (e) {
      console.error('Registration API network error:', e);
      return { success: false, message: 'Unable to connect to the CareerPilot server. Please try again.' };
    }
  },

  /**
   * Verify credentials and log in via POST /api/auth/login
   */
  async login(email, password) {
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    if (!cleanEmail || !password) {
      return { success: false, message: 'Invalid email or password.' };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: cleanEmail, password })
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 200 && data.success) {
        // Clear career data if switching to a different user account
        this.clearStaleUserData(cleanEmail);

        const safeUser = { fullName: data.user.fullName, email: data.user.email };
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(safeUser));
        localStorage.removeItem(STORAGE_KEYS.LOGGED_IN);

        return { success: true, user: safeUser };
      } else if (res.status === 401) {
        return { success: false, message: 'Invalid email or password.' };
      } else if (res.status === 400 && data.errors && data.errors.length > 0) {
        return { success: false, message: data.errors[0].message || 'Invalid email or password.' };
      } else {
        return { success: false, message: data.message || 'Invalid email or password.' };
      }
    } catch (e) {
      console.error('Login API network error:', e);
      return { success: false, message: 'Unable to connect to the CareerPilot server. Please try again.' };
    }
  },

  /**
   * Synchronous check for login state (used by legacy sync guards)
   */
  isLoggedIn() {
    // Falls back to safe user presence; primary guards use async checkAuthStatus()
    return Boolean(this.getCurrentUser());
  },

  /**
   * Retrieve active user details (safe display object only, NO password)
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
   * Fetch fresh active user from backend GET /api/auth/me
   */
  async fetchCurrentUser() {
    const status = await this.checkAuthStatus();
    if (status.success && status.user) {
      return { fullName: status.user.fullName, email: status.user.email };
    }
    return null;
  },

  /**
   * Log out active user via POST /api/auth/logout
   */
  async logout() {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      console.warn('Logout request failed:', e);
    } finally {
      localStorage.removeItem(STORAGE_KEYS.LOGGED_IN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      this.clearActiveUserCareerState();
      window.location.href = 'login.html';
    }
  },

  /**
   * Route Guard: Protect auth-success.html (Async backend session verification)
   */
  async protectAuthSuccess() {
    const status = await this.checkAuthStatus();
    if (!status.success) {
      window.location.href = 'login.html';
      return null;
    }
    return status.user;
  },

  /**
   * Route Guard: Prevent logged-in users from accessing login/register
   */
  async redirectIfLoggedIn() {
    const status = await this.checkAuthStatus();
    if (status.success) {
      window.location.href = 'auth-success.html';
    }
  }
};
