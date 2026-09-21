/**
 * CAREERPILOT AI - PHASE 8.8.3 ASSESSMENT ENGINE
 * 
 * Fetches authoritative career assessment report directly from backend API
 * via GET /api/assessment using HTTP-only credentials session.
 * 
 * Manages route protection, loading checklist animation, clean error handling,
 * and DOM rendering without local calculation or fingerprint logic.
 */

var getApiBaseUrl = (typeof window !== 'undefined' && window.getApiBaseUrl) ? window.getApiBaseUrl : function () {
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname === '127.0.0.1' || hostname === 'localhost') {
      return `${window.location.protocol}//${hostname}:5000/api`;
    }
    if (window.CAREERPILOT_API_BASE_URL) {
      return window.CAREERPILOT_API_BASE_URL;
    }
    return `${window.location.protocol}//${window.location.host}/api`;
  }
  return (typeof process !== 'undefined' && process.env && process.env.API_BASE_URL) || '/api';
};

var API_BASE_URL = (typeof window !== 'undefined' && window.API_BASE_URL) ? window.API_BASE_URL : getApiBaseUrl();

const AssessmentApp = {
  assessmentData: null,

  async init() {
    const isAuth = await this.protectRoute();
    if (!isAuth) return;

    this.bindEvents();
    await this.loadAssessment();
  },

  /**
   * Route Guard: Verify active backend session via GET /api/auth/me
   */
  async protectRoute() {
    if (typeof AuthService !== 'undefined') {
      const status = await AuthService.checkAuthStatus();
      if (!status.success) {
        window.location.href = 'login.html';
        return false;
      }

      if (status.user && status.user.fullName) {
        const badgeName = document.getElementById('header-user-name');
        if (badgeName) badgeName.textContent = status.user.fullName;
      }
      return true;
    } else {
      window.location.href = 'login.html';
      return false;
    }
  },

  /**
   * Bind DOM event listeners
   */
  bindEvents() {
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        if (typeof AuthService !== 'undefined') {
          await AuthService.logout();
        } else {
          window.location.href = 'login.html';
        }
      });
    }

    // Review Profile button
    const reviewBtn = document.getElementById('review-profile-btn');
    if (reviewBtn) {
      reviewBtn.addEventListener('click', () => {
        window.location.href = 'onboarding.html';
      });
    }

    // Continue to Phase 4 Readiness button
    const continueBtn = document.getElementById('continue-phase4-btn');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        window.location.href = 'readiness.html';
      });
    }
  },

  /**
   * Load Assessment from backend API GET /api/assessment
   */
  async loadAssessment() {
    this.showAnalyzingState(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/assessment`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          credentials: 'include'
        });

        if (res.status === 401) {
          window.location.href = 'login.html';
          return;
        }

        if (res.status === 400) {
          const errData = await res.json().catch(() => ({}));
          this.showErrorState(
            errData.message || 'Please complete your career profile before generating an assessment.',
            'onboarding.html',
            'GO TO PROFILE'
          );
          return;
        }

        if (!res.ok) {
          this.showErrorState('Unable to connect to the CareerPilot server. Please try again.');
          return;
        }

        const data = await res.json();
        if (data && data.success && data.assessment) {
          // Remove obsolete localStorage assessment data source once backend GET succeeds
          localStorage.removeItem('careerPilotAssessment');

          this.assessmentData = data.assessment;
          this.renderAssessmentResults();
        } else {
          this.showErrorState('Unable to load assessment data. Please try again.');
        }
      } catch (e) {
        console.error('Assessment API Network Error:', e);
        this.showErrorState('Unable to connect to the CareerPilot server. Please try again.');
      }
    });
  },

  /**
   * Simple Analysis Loading Checklist Animation
   */
  showAnalyzingState(onComplete) {
    const loadingCard = document.getElementById('analyzing-card');
    const resultsWrapper = document.getElementById('assessment-results-wrapper');

    if (loadingCard) loadingCard.style.display = 'block';
    if (resultsWrapper) resultsWrapper.style.display = 'none';

    const steps = ['check-step-1', 'check-step-2', 'check-step-3', 'check-step-4'];
    let idx = 0;

    const interval = setInterval(() => {
      if (idx < steps.length) {
        const stepEl = document.getElementById(steps[idx]);
        if (stepEl) {
          stepEl.classList.add('completed');
          stepEl.querySelector('.check-mark').textContent = '✓';
        }
        idx++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          if (loadingCard) loadingCard.style.display = 'none';
          if (onComplete) onComplete();
        }, 300);
      }
    }, 150);
  },

  /**
   * Display Error State in UI
   */
  showErrorState(message, linkUrl = null, linkText = null) {
    const loadingCard = document.getElementById('analyzing-card');
    const resultsWrapper = document.getElementById('assessment-results-wrapper');

    if (loadingCard) loadingCard.style.display = 'none';
    if (resultsWrapper) {
      resultsWrapper.style.display = 'block';
      let actionBtnHTML = '';
      if (linkUrl && linkText) {
        actionBtnHTML = `
          <div style="margin-top: 1.5rem;">
            <a href="${linkUrl}" class="btn btn-primary" style="display: inline-block; padding: 0.75rem 1.5rem; text-decoration: none;">${this.escapeHtml(linkText)}</a>
          </div>
        `;
      }
      resultsWrapper.innerHTML = `
        <div class="onboarding-card" style="text-align: center; padding: 3rem 2rem; border-color: var(--accent-red);">
          <h2 style="font-size: 1.35rem; color: #f87171; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 1rem;">
            ASSESSMENT ERROR
          </h2>
          <p class="assessment-paragraph-text" style="color: var(--text-muted); font-size: 1rem; max-width: 500px; margin: 0 auto;">
            ${this.escapeHtml(message)}
          </p>
          ${actionBtnHTML}
        </div>
      `;
    }
  },

  /**
   * Render Assessment Results UI
   */
  renderAssessmentResults() {
    const data = this.assessmentData;
    if (!data) return;

    const resultsWrapper = document.getElementById('assessment-results-wrapper');
    if (resultsWrapper) resultsWrapper.style.display = 'block';

    // 1. Career Direction & Alignment
    const directionTitle = document.getElementById('res-career-direction');
    const badgeEl = document.getElementById('res-alignment-badge');

    if (directionTitle) {
      // Extract target career from backend careerDirection statement if present
      let targetTitle = 'Software Engineer';
      if (data.careerDirection && data.careerDirection.includes('target career of ')) {
        targetTitle = data.careerDirection.split('target career of ')[1].replace(/\.$/, '');
      }
      directionTitle.textContent = targetTitle;
    }

    if (badgeEl && data.confidenceLevel) {
      badgeEl.textContent = `ALIGNMENT: ${data.confidenceLevel}`;
      badgeEl.className = `alignment-badge alignment-badge-${data.confidenceLevel.toLowerCase()}`;
    }

    // 2. Profile Summary
    const summaryEl = document.getElementById('res-profile-summary');
    if (summaryEl) summaryEl.textContent = data.profileSummary || '';

    // 3. Strengths
    const strengthsContainer = document.getElementById('res-strengths-list');
    if (strengthsContainer) {
      strengthsContainer.innerHTML = '';
      if (Array.isArray(data.strengths) && data.strengths.length > 0) {
        data.strengths.forEach(st => {
          const card = document.createElement('div');
          card.className = 'feature-pill-card';
          card.innerHTML = `<span class="pill-icon">✦</span> <span>${this.escapeHtml(st)}</span>`;
          strengthsContainer.appendChild(card);
        });
      } else {
        strengthsContainer.innerHTML = '<span style="color: var(--text-muted);">None recorded</span>';
      }
    }

    // 4. Current Skills
    const skillsContainer = document.getElementById('res-current-skills-list');
    if (skillsContainer) {
      skillsContainer.innerHTML = '';
      if (Array.isArray(data.currentSkills) && data.currentSkills.length > 0) {
        data.currentSkills.forEach(sk => {
          const tag = document.createElement('span');
          tag.className = 'tag-pill';
          tag.textContent = sk;
          skillsContainer.appendChild(tag);
        });
      } else {
        skillsContainer.innerHTML = '<span style="color: var(--text-muted);">No skills selected</span>';
      }
    }

    // 5. Recommended Focus Areas
    const focusContainer = document.getElementById('res-focus-areas-list');
    if (focusContainer) {
      focusContainer.innerHTML = '';
      if (Array.isArray(data.focusAreas) && data.focusAreas.length > 0) {
        data.focusAreas.forEach(fa => {
          const card = document.createElement('div');
          card.className = 'focus-item-card';
          card.innerHTML = `<div class="focus-bullet">▸</div><div class="focus-text">${this.escapeHtml(fa)}</div>`;
          focusContainer.appendChild(card);
        });
      } else {
        focusContainer.innerHTML = '<span style="color: var(--text-muted);">None recommended</span>';
      }
    }

    // 6. Career Advice
    const adviceEl = document.getElementById('res-career-advice');
    if (adviceEl) adviceEl.textContent = data.careerAdvice || '';
  },

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  AssessmentApp.init();
});
