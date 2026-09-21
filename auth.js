/**
 * CAREERPILOT AI - AUTHENTICATION SERVICE (PHASE 8.8.6 HARDENED)
 * 
 * Production REST API authentication engine connecting frontend to Node.js + Express backend.
 * 
 * Backend APIs are the authoritative source of application data. Browser storage is not used for persistent CareerPilot application state.
 * 
 * Features:
 * - Centralized API Configuration (http://localhost:5000/api)
 * - HTTP-Only Session Cookie persistence via `credentials: "include"`
 * - Real-time authentication verification via GET /api/auth/me
 * - Zero client-side password, token, or session storage (localStorage, sessionStorage, cookies)
 * - Legacy localStorage cleanup engine
 */

var getApiBaseUrl = (typeof window !== 'undefined' && window.getApiBaseUrl) ? window.getApiBaseUrl : function () {
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname === '127.0.0.1' || hostname === 'localhost') {
      return `${window.location.protocol}//${hostname}:5000/api`;
    }
  }
  return 'http://localhost:5000/api';
};

var API_BASE_URL = (typeof window !== 'undefined' && window.API_BASE_URL) ? window.API_BASE_URL : getApiBaseUrl();
if (typeof window !== 'undefined') {
  window.getApiBaseUrl = getApiBaseUrl;
  window.API_BASE_URL = API_BASE_URL;
}

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
   * Helper to clear active user career profile & legacy keys from localStorage
   */
  clearActiveUserCareerState() {
    const legacyKeys = [
      'careerPilotLoggedIn',
      'careerPilotUser',
      'careerPilotUsersList',
      'careerPilotProfile',
      'careerPilotAssessment',
      'careerPilotReadiness',
      'careerPilotRoadmap',
      'careerPilotProjects',
      'careerPilotInterview',
      'careerPilotInterviewHistory',
      'careerPilotCareerTools'
    ];
    legacyKeys.forEach(key => {
      try { localStorage.removeItem(key); } catch (e) {}
    });
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
          // Clean up legacy localStorage keys on authenticated startup
          this.clearActiveUserCareerState();
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

    if (!cleanName) {
      return { success: false, message: 'Please enter your full name.' };
    }

    if (!cleanEmail || !this.isValidEmail(cleanEmail)) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    if (!password || password.length < 8) {
      return { success: false, message: 'Password must be at least 8 characters.' };
    }

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
        this.clearActiveUserCareerState();
        return { success: true, user: data.user };
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
        this.clearActiveUserCareerState();
        return { success: true, user: data.user };
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
   * Synchronous check for login state (Primary guards use async checkAuthStatus())
   */
  isLoggedIn() {
    return false;
  },

  /**
   * Retrieve active user details (backend GET /api/auth/me is authoritative)
   */
  getCurrentUser() {
    return null;
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
