/**
 * CAREERPILOT AI - PHASE 8.8.4 PERSONALIZED LEARNING ROADMAP ENGINE
 * 
 * Fetches authoritative learning roadmap directly from backend API
 * via GET /api/roadmap using HTTP-only credentials session.
 * 
 * Manages route protection, error handling, and DOM rendering without client-side
 * sequence generation or fingerprint logic.
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

const RoadmapApp = {
  roadmapData: null,

  async init() {
    const isAuth = await this.protectRoute();
    if (!isAuth) return;

    this.bindEvents();
    await this.loadRoadmap();
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

    // Back to Readiness button
    const backReadinessBtn = document.getElementById('back-readiness-btn');
    if (backReadinessBtn) {
      backReadinessBtn.addEventListener('click', () => {
        window.location.href = 'readiness.html';
      });
    }

    // Continue to Phase 6 Projects button
    const continueBtn = document.getElementById('continue-phase6-btn');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        window.location.href = 'projects.html';
      });
    }
  },

  /**
   * Load Roadmap from backend API GET /api/roadmap
   */
  async loadRoadmap() {
    try {
      const res = await fetch(`${API_BASE_URL}/roadmap`, {
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
          errData.message || 'Please complete your career profile before generating a learning roadmap.',
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
      if (data && data.success && data.roadmap) {
        // Remove obsolete localStorage roadmap data source once backend GET succeeds
        localStorage.removeItem('careerPilotRoadmap');

        this.roadmapData = data.roadmap;
        this.renderRoadmap(this.roadmapData);
      } else {
        this.showErrorState('Unable to load roadmap data. Please try again.');
      }
    } catch (e) {
      console.error('Roadmap API Network Error:', e);
      this.showErrorState('Unable to connect to the CareerPilot server. Please try again.');
    }
  },

  /**
   * Display Error State in UI
   */
  showErrorState(message, linkUrl = null, linkText = null) {
    const mainWrapper = document.querySelector('.main-wrapper');
    if (mainWrapper) {
      let actionBtnHTML = '';
      if (linkUrl && linkText) {
        actionBtnHTML = `
          <div style="margin-top: 1.5rem;">
            <a href="${linkUrl}" class="btn btn-primary" style="display: inline-block; padding: 0.75rem 1.5rem; text-decoration: none;">${this.escapeHtml(linkText)}</a>
          </div>
        `;
      }
      mainWrapper.innerHTML = `
        <div class="onboarding-container" style="max-width: 950px; margin-top: 2rem;">
          <div class="onboarding-card" style="text-align: center; padding: 3rem 2rem; border-color: var(--accent-red);">
            <h2 style="font-size: 1.35rem; color: #f87171; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 1rem;">
              ROADMAP ERROR
            </h2>
            <p class="assessment-paragraph-text" style="color: var(--text-muted); font-size: 1rem; max-width: 500px; margin: 0 auto;">
              ${this.escapeHtml(message)}
            </p>
            ${actionBtnHTML}
          </div>
        </div>
      `;
    }
  },

  /**
   * Render Roadmap UI from backend data
   */
  renderRoadmap(data) {
    if (!data) return;

    // Header info
    const targetEl = document.getElementById('rm-target-career');
    if (targetEl) targetEl.textContent = data.targetCareer || 'Software Engineer';

    const scoreEl = document.getElementById('rm-readiness-score');
    if (scoreEl) scoreEl.textContent = (data.readinessScore || 0) + " / 100";

    const statusEl = document.getElementById('rm-readiness-status');
    if (statusEl) {
      statusEl.textContent = data.status || 'DEVELOPING';
      const score = data.readinessScore || 0;
      if (score >= 75) {
        statusEl.className = 'alignment-badge alignment-badge-high';
      } else if (score >= 50) {
        statusEl.className = 'alignment-badge alignment-badge-medium';
      } else {
        statusEl.className = 'alignment-badge alignment-badge-low';
      }
    }

    // Metrics Cards
    const totalEl = document.getElementById('metric-total-items');
    if (totalEl) totalEl.textContent = data.totalItems || 0;

    const compEl = document.getElementById('metric-completed-items');
    if (compEl) compEl.textContent = data.completedItems || 0;

    const upEl = document.getElementById('metric-upcoming-items');
    if (upEl) upEl.textContent = data.upcomingItems || 0;

    const highEl = document.getElementById('metric-high-priority');
    if (highEl) highEl.textContent = data.highPriorityItems || 0;

    // Current Position Statement
    const posEl = document.getElementById('rm-current-position');
    if (posEl) {
      if (data.completedItems === 0) {
        posEl.textContent = "You're at the starting point of your " + (data.targetCareer || '') + " roadmap. Begin with the first foundational skill.";
      } else if (data.upcomingItems === 0) {
        posEl.textContent = "Congratulations! You have covered all core learning foundations for " + (data.targetCareer || '') + ".";
      } else {
        posEl.textContent = "You have completed " + data.completedItems + " of the " + data.totalItems + " roadmap learning foundations. Focus on closing the next recommended skills.";
      }
    }

    // Next Recommended Skill Highlight Card
    const upcomingList = (data.allItems || []).filter(i => i.status === "UPCOMING");
    const nextSkillWrapper = document.getElementById('next-skill-wrapper');

    if (upcomingList.length > 0) {
      const nextSkill = upcomingList[0];
      const nextTitle = document.getElementById('next-skill-title');
      const nextReason = document.getElementById('next-skill-reason');
      const nextPriority = document.getElementById('next-skill-priority');
      const nextEffort = document.getElementById('next-skill-effort');
      const nextPrereqs = document.getElementById('next-skill-prereqs');

      if (nextTitle) nextTitle.textContent = nextSkill.skill;
      if (nextReason) nextReason.textContent = nextSkill.reason;
      if (nextEffort) nextEffort.textContent = "Effort: " + (nextSkill.estimatedEffort || '6–10 hours');

      if (nextPriority) {
        nextPriority.textContent = (nextSkill.priority || 'MEDIUM') + " PRIORITY";
        nextPriority.className = "priority-badge priority-" + (nextSkill.priority || 'medium').toLowerCase();
      }

      if (nextPrereqs) {
        nextPrereqs.textContent = (nextSkill.prerequisites && nextSkill.prerequisites.length > 0)
          ? nextSkill.prerequisites.join(', ')
          : "None";
      }
      if (nextSkillWrapper) nextSkillWrapper.style.display = 'block';
    } else {
      if (nextSkillWrapper) nextSkillWrapper.style.display = 'none';
    }

    // Quick Summary Lists (Already Covered vs Coming Next)
    const coveredContainer = document.getElementById('rm-already-covered-list');
    if (coveredContainer) {
      coveredContainer.innerHTML = '';
      const completedList = (data.allItems || []).filter(i => i.status === "COMPLETED");

      if (completedList.length === 0) {
        coveredContainer.innerHTML = '<span style="color: var(--text-secondary); font-size: 0.85rem;">No current skills recorded in roadmap.</span>';
      } else {
        completedList.forEach(item => {
          const tag = document.createElement('span');
          tag.className = 'skill-tag skill-tag-met';
          tag.textContent = '✓ ' + item.skill;
          coveredContainer.appendChild(tag);
        });
      }
    }

    const comingNextContainer = document.getElementById('rm-coming-next-list');
    if (comingNextContainer) {
      comingNextContainer.innerHTML = '';
      if (upcomingList.length === 0) {
        comingNextContainer.innerHTML = '<span style="color: var(--text-secondary); font-size: 0.85rem;">All roadmap skills covered!</span>';
      } else {
        upcomingList.slice(0, 4).forEach((item, idx) => {
          const row = document.createElement('div');
          row.style.display = 'flex';
          row.style.alignItems = 'center';
          row.style.justifyContent = 'space-between';
          row.style.padding = '0.4rem 0';
          row.style.borderBottom = '1px solid var(--border-color)';
          row.style.fontSize = '0.85rem';

          row.innerHTML = `
            <span style="color: var(--text-primary); font-weight: 500;">${idx + 1}. ${this.escapeHtml(item.skill)}</span>
            <span class="priority-badge priority-${(item.priority || 'medium').toLowerCase()}" style="font-size: 0.7rem; padding: 0.1rem 0.4rem;">${this.escapeHtml(item.priority || 'MEDIUM')}</span>
          `;
          comingNextContainer.appendChild(row);
        });
      }
    }

    // Stages Timeline Rendering
    const stagesContainer = document.getElementById('stages-container');
    if (stagesContainer) {
      stagesContainer.innerHTML = '';

      (data.stages || []).forEach(stage => {
        const stageCard = document.createElement('div');
        stageCard.className = 'onboarding-card stage-card';
        stageCard.style.marginBottom = '1.5rem';

        let itemsHtml = '';
        (stage.items || []).forEach(item => {
          const isComp = item.status === "COMPLETED";
          const statusBadge = isComp 
            ? '<span class="status-pill status-completed">✓ COMPLETED</span>'
            : '<span class="status-pill status-upcoming">○ UPCOMING</span>';
          
          const itemPriority = item.priority || 'MEDIUM';
          const priorityBadge = `<span class="priority-badge priority-${itemPriority.toLowerCase()}">${this.escapeHtml(itemPriority)} PRIORITY</span>`;
          const prereqText = (item.prerequisites && item.prerequisites.length > 0) ? item.prerequisites.join(', ') : 'None';

          itemsHtml += `
            <div class="roadmap-item-card ${isComp ? 'item-completed' : 'item-upcoming'}">
              <div class="item-header">
                <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                  <h4 class="item-title">${this.escapeHtml(item.skill)}</h4>
                  ${statusBadge}
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                  ${priorityBadge}
                  <span class="effort-badge">${this.escapeHtml(item.estimatedEffort || '6–10 hours')}</span>
                </div>
              </div>
              <p class="item-reason">${this.escapeHtml(item.reason || '')}</p>
              <div class="item-meta">
                <span>Prerequisites: <strong>${this.escapeHtml(prereqText)}</strong></span>
              </div>
            </div>
          `;
        });

        stageCard.innerHTML = `
          <div class="stage-header">
            <h3 class="stage-title">${this.escapeHtml(stage.title || '')}</h3>
          </div>
          <p class="stage-desc">${this.escapeHtml(stage.description || '')}</p>
          <div class="milestone-box">
            <span class="milestone-label">MILESTONE:</span> ${this.escapeHtml(stage.milestone || '')}
          </div>
          <div class="stage-items-stack" style="margin-top: 1rem;">
            ${itemsHtml}
          </div>
        `;

        stagesContainer.appendChild(stageCard);
      });
    }

    // Why This Roadmap Section
    const whyEl = document.getElementById('rm-why-roadmap');
    if (whyEl) {
      whyEl.textContent = "Your personalized roadmap prioritizes key missing competencies for your target career as a " + 
        (data.targetCareer || 'Software Engineer') + ". Based on your current readiness score of " + (data.readinessScore || 0) + "/100, the learning items are arranged strictly by prerequisite dependencies and skill priorities to guide you step-by-step from core foundations to practical job readiness.";
    }
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
  RoadmapApp.init();
});
