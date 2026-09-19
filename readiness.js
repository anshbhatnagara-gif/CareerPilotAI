/**
 * CAREERPILOT AI - PHASE 8.8.3 CAREER READINESS ENGINE
 * 
 * Fetches authoritative career readiness score, status, and skill gap report
 * directly from backend API via GET /api/readiness using HTTP-only credentials session.
 * 
 * Manages route protection, loading checklist animation, clean error handling,
 * and DOM rendering without local calculation or fingerprint logic.
 */

const API_BASE_URL = 'http://localhost:5000/api';

const ReadinessApp = {
  readinessData: null,

  async init() {
    const isAuth = await this.protectRoute();
    if (!isAuth) return;

    this.bindEvents();
    await this.loadReadiness();
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
          localStorage.removeItem('careerPilotLoggedIn');
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

    // Continue to Phase 5 Roadmap button
    const continueBtn = document.getElementById('continue-phase5-btn');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        window.location.href = 'roadmap.html';
      });
    }
  },

  /**
   * Load Readiness report from backend API GET /api/readiness
   */
  async loadReadiness() {
    this.showCalculationState(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/readiness`, {
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
            errData.message || 'Please complete your career profile and select a target career before generating readiness.',
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
        if (data && data.success && data.readiness) {
          // Remove obsolete localStorage readiness data source once backend GET succeeds
          localStorage.removeItem('careerPilotReadiness');

          this.readinessData = data.readiness;
          this.renderReadinessResults();
        } else {
          this.showErrorState('Unable to load readiness data. Please try again.');
        }
      } catch (e) {
        console.error('Readiness API Network Error:', e);
        this.showErrorState('Unable to connect to the CareerPilot server. Please try again.');
      }
    });
  },

  /**
   * Calculation Loading State Transition
   */
  showCalculationState(onComplete) {
    const calcCard = document.getElementById('calculating-card');
    const resultsWrapper = document.getElementById('readiness-results-wrapper');

    if (calcCard) calcCard.style.display = 'block';
    if (resultsWrapper) resultsWrapper.style.display = 'none';

    const steps = ['calc-step-1', 'calc-step-2', 'calc-step-3', 'calc-step-4', 'calc-step-5'];
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
          if (calcCard) calcCard.style.display = 'none';
          if (onComplete) onComplete();
        }, 300);
      }
    }, 150);
  },

  /**
   * Display Error State in UI
   */
  showErrorState(message, linkUrl = null, linkText = null) {
    const calcCard = document.getElementById('calculating-card');
    const resultsWrapper = document.getElementById('readiness-results-wrapper');

    if (calcCard) calcCard.style.display = 'none';
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
            READINESS ERROR
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
   * Render Readiness UI from backend data
   */
  renderReadinessResults() {
    const data = this.readinessData;
    if (!data) return;

    const resultsWrapper = document.getElementById('readiness-results-wrapper');
    if (resultsWrapper) resultsWrapper.style.display = 'block';

    // 1. Hero Readiness Score & Status
    const targetCareerTitle = document.getElementById('res-target-career');
    const scoreValEl = document.getElementById('res-score-value');
    const statusValEl = document.getElementById('res-status-value');
    const scoreProgressFill = document.getElementById('res-score-progress-fill');

    if (targetCareerTitle) targetCareerTitle.textContent = data.targetCareer || 'Software Engineer';
    if (scoreValEl) scoreValEl.textContent = `${data.score || 0} / 100`;
    if (statusValEl) statusValEl.textContent = data.status || 'STARTING POINT';
    if (scoreProgressFill) scoreProgressFill.style.width = `${data.score || 0}%`;

    // 2. Readiness Summary
    const summaryEl = document.getElementById('res-readiness-summary');
    if (summaryEl) summaryEl.textContent = data.summary || '';

    // 3. Skill Coverage Stat
    const coverageEl = document.getElementById('res-skill-coverage');
    if (coverageEl) coverageEl.textContent = `${data.coveredCount || 0} / ${data.requiredCount || 0} REQUIRED SKILLS COVERED`;

    // 4. Current Skills (Met Requirements)
    const metSkillsContainer = document.getElementById('res-met-skills-list');
    if (metSkillsContainer) {
      metSkillsContainer.innerHTML = '';
      if (Array.isArray(data.metSkills) && data.metSkills.length > 0) {
        data.metSkills.forEach(sk => {
          const tag = document.createElement('span');
          tag.className = 'tag-pill';
          tag.style.backgroundColor = 'rgba(20, 83, 45, 0.3)';
          tag.style.borderColor = '#15803d';
          tag.textContent = `✓ ${sk}`;
          metSkillsContainer.appendChild(tag);
        });
      } else {
        metSkillsContainer.innerHTML = '<span style="color: var(--text-muted);">No met skills recorded</span>';
      }
    }

    // 5. Skill Gap Breakdown & Priorities
    const highCountEl = document.getElementById('res-high-count');
    const medCountEl = document.getElementById('res-med-count');
    const lowCountEl = document.getElementById('res-low-count');

    if (highCountEl) highCountEl.textContent = data.highPriorityCount || 0;
    if (medCountEl) medCountEl.textContent = data.mediumPriorityCount || 0;
    if (lowCountEl) lowCountEl.textContent = data.lowPriorityCount || 0;

    // 6. Skill Gap Analysis Cards
    const gapsContainer = document.getElementById('res-skill-gaps-container');
    if (gapsContainer) {
      gapsContainer.innerHTML = '';
      if (Array.isArray(data.skillGaps) && data.skillGaps.length > 0) {
        data.skillGaps.forEach(gap => {
          const card = document.createElement('div');
          card.className = 'gap-card';
          
          let badgeClass = 'priority-high';
          if (gap.priority === 'MEDIUM') badgeClass = 'priority-medium';
          if (gap.priority === 'LOW') badgeClass = 'priority-low';

          card.innerHTML = `
            <div class="gap-card-header">
              <span class="gap-skill-title">${this.escapeHtml(gap.skill)}</span>
              <span class="priority-badge ${badgeClass}">${gap.priority} PRIORITY</span>
            </div>
            <p class="gap-reason-text">${this.escapeHtml(gap.reason)}</p>
          `;
          gapsContainer.appendChild(card);
        });
      } else {
        gapsContainer.innerHTML = '<p style="color: #4ade80; font-weight: 600;">✓ Excellent! All core domain requirements are satisfied by your profile.</p>';
      }
    }

    // 7. First Focus Areas
    const firstFocusContainer = document.getElementById('res-first-focus-list');
    if (firstFocusContainer) {
      firstFocusContainer.innerHTML = '';
      const gapsList = Array.isArray(data.skillGaps) ? data.skillGaps : [];
      const highGaps = gapsList.filter(g => g.priority === 'HIGH').slice(0, 3);
      const displayFocus = highGaps.length > 0 ? highGaps : gapsList.slice(0, 3);

      if (displayFocus.length > 0) {
        displayFocus.forEach((gf, i) => {
          const item = document.createElement('div');
          item.className = 'focus-item-card';
          item.innerHTML = `<div class="focus-bullet">${i + 1}.</div><div class="focus-text"><strong>${this.escapeHtml(gf.skill)}</strong> — ${this.escapeHtml(gf.reason)}</div>`;
          firstFocusContainer.appendChild(item);
        });
      } else {
        firstFocusContainer.innerHTML = '<span style="color: var(--text-muted);">None required at this time</span>';
      }
    }

    // 8. Career Alignment
    const alignmentValEl = document.getElementById('res-alignment-val');
    if (alignmentValEl && data.alignment) {
      alignmentValEl.textContent = `${data.alignment} ALIGNMENT`;
      alignmentValEl.className = `alignment-badge alignment-badge-${data.alignment.toLowerCase()}`;
    }

    // 9. Career Advice
    const adviceEl = document.getElementById('res-career-advice');
    if (adviceEl) adviceEl.textContent = data.advice || '';
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
  ReadinessApp.init();
});
