/**
 * CAREERPILOT AI - PHASE 8.9.5 CAREER READINESS & AI DASHBOARD ENGINE
 * 
 * Fetches authoritative career readiness score and skill gap report directly from backend API
 * via GET /api/readiness and AI intelligence via GET /api/ai/dashboard using HTTP-only credentials session.
 * 
 * Manages route protection, loading checklist animation, clean error handling,
 * and DOM rendering for AI Career Analysis, 4-Bucket Skill Gap Intelligence,
 * Priority Skill Gaps, AI Learning Sequence, and Practice Focus.
 */

const API_BASE_URL = 'http://localhost:5000/api';

const ReadinessApp = {
  readinessData: null,
  aiDashboardData: null,
  aiLoaded: false,

  async init() {
    const isAuth = await this.protectRoute();
    if (!isAuth) return;

    this.bindEvents();
    await this.loadReadiness();
    await this.loadAIDashboard();
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
   * Load AI Dashboard Intelligence from backend API GET /api/ai/dashboard
   */
  async loadAIDashboard() {
    if (this.aiLoaded) return; // Prevent duplicate requests
    this.aiLoaded = true;

    try {
      const res = await fetch(`${API_BASE_URL}/ai/dashboard`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });

      if (!res.ok) {
        this.renderAIFallbackNotice('AI intelligence is temporarily unavailable. Your saved career data remains available.');
        return;
      }

      const data = await res.json();
      if (data && data.success) {
        this.aiDashboardData = data;
        this.renderAIDashboardResults();
      } else {
        this.renderAIFallbackNotice('AI intelligence is temporarily offline. Your readiness score remains active.');
      }
    } catch (err) {
      console.warn('AI Dashboard Fetch Error:', err);
      this.renderAIFallbackNotice('AI intelligence is temporarily unavailable. Your saved career data remains available.');
    }
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
   * Fallback notice when AI service is unavailable
   */
  renderAIFallbackNotice(msg) {
    const badgeText = document.getElementById('ai-status-badge-text');
    if (badgeText) badgeText.textContent = 'AI MODE: FALLBACK';

    const summaryEl = document.getElementById('ai-career-summary');
    if (summaryEl) summaryEl.textContent = msg;
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

    // 6. Career Alignment & Advice
    const alignmentValEl = document.getElementById('res-alignment-val');
    if (alignmentValEl && data.alignment) {
      alignmentValEl.textContent = `${data.alignment} ALIGNMENT`;
      alignmentValEl.className = `alignment-badge alignment-badge-${data.alignment.toLowerCase()}`;
    }

    const adviceEl = document.getElementById('res-career-advice');
    if (adviceEl) adviceEl.textContent = data.advice || '';
  },

  /**
   * Render AI Intelligence Dashboard Results
   */
  renderAIDashboardResults() {
    const ai = this.aiDashboardData;
    if (!ai) return;

    // AI Status Badge
    const badgeText = document.getElementById('ai-status-badge-text');
    if (badgeText) {
      const isFallback = ai.careerAnalysis?.status === 'fallback' || ai.skillAnalysis?.status === 'fallback';
      badgeText.textContent = isFallback ? 'AI MODE: FALLBACK' : 'AI MODE: GEMINI ONLINE';
    }

    // A. AI Career Analysis
    if (ai.careerAnalysis) {
      const ca = ai.careerAnalysis;
      const summaryEl = document.getElementById('ai-career-summary');
      if (summaryEl) summaryEl.textContent = ca.profile_summary || ca.career_direction || '';

      const confBadge = document.getElementById('ai-confidence-badge');
      if (confBadge && ca.confidence_level) {
        confBadge.textContent = `${ca.confidence_level} CONFIDENCE`;
        confBadge.className = `alignment-badge alignment-badge-${ca.confidence_level.toLowerCase()}`;
      }

      this.renderTagsContainer('ai-strengths-list', ca.strengths, 'rgba(20, 83, 45, 0.3)', '#15803d', '✓');
      this.renderTagsContainer('ai-focus-areas-list', ca.focus_areas, 'rgba(185, 28, 28, 0.3)', '#b91c1c', '•');
    }

    // B & C. Skill Gap Intelligence (4 Buckets)
    if (ai.skillAnalysis) {
      const sa = ai.skillAnalysis;
      this.renderTagsContainer('ai-matched-skills', sa.matched_skills, 'rgba(20, 83, 45, 0.3)', '#15803d', '✓');
      this.renderTagsContainer('ai-developing-skills', sa.developing_skills, 'rgba(217, 119, 6, 0.3)', '#d97706', '◐');
      this.renderTagsContainer('ai-missing-skills', sa.missing_skills, 'rgba(185, 28, 28, 0.3)', '#ef4444', '×');
      this.renderTagsContainer('ai-required-skills', sa.required_skills, 'rgba(30, 41, 59, 0.6)', '#64748b', '•');

      // D. Priority Skill Gaps
      const priorityGapsContainer = document.getElementById('ai-priority-gaps-container');
      if (priorityGapsContainer) {
        priorityGapsContainer.innerHTML = '';
        if (Array.isArray(sa.priority_gaps) && sa.priority_gaps.length > 0) {
          sa.priority_gaps.forEach(gap => {
            const card = document.createElement('div');
            card.className = 'gap-card';
            let badgeClass = 'priority-high';
            if (gap.priority === 'MEDIUM') badgeClass = 'priority-medium';
            if (gap.priority === 'LOW') badgeClass = 'priority-low';

            card.innerHTML = `
              <div class="gap-card-header">
                <span class="gap-skill-title">${this.escapeHtml(gap.skill)}</span>
                <span class="priority-badge ${badgeClass}">${this.escapeHtml(gap.priority)} PRIORITY</span>
              </div>
              <p class="gap-reason-text">${this.escapeHtml(gap.reason)}</p>
            `;
            priorityGapsContainer.appendChild(card);
          });
        } else {
          priorityGapsContainer.innerHTML = '<span style="color: #4ade80;">✓ All primary skill gaps addressed!</span>';
        }
      }
    }

    // E & F. AI Learning Plan & Sequence
    if (ai.learningAnalysis) {
      const la = ai.learningAnalysis;
      const summaryEl = document.getElementById('ai-learning-summary');
      if (summaryEl) summaryEl.textContent = la.learning_summary || '';

      const seqContainer = document.getElementById('ai-learning-sequence-container');
      if (seqContainer) {
        seqContainer.innerHTML = '';
        if (Array.isArray(la.learning_sequence) && la.learning_sequence.length > 0) {
          la.learning_sequence.forEach(step => {
            const card = document.createElement('div');
            card.className = 'onboarding-card';
            card.style.padding = '1rem 1.25rem';
            card.style.marginBottom = '0.75rem';
            card.style.borderLeft = '4px solid var(--accent-red-bright)';

            const topicsHTML = Array.isArray(step.topics)
              ? step.topics.map(t => `<span class="tag-pill" style="font-size: 0.775rem;">${this.escapeHtml(t)}</span>`).join('')
              : '';

            const prereqsHTML = Array.isArray(step.prerequisites) && step.prerequisites.length > 0
              ? step.prerequisites.join(', ')
              : 'None';

            card.innerHTML = `
              <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.4rem;">
                <div style="font-weight: 700; color: var(--text-primary); font-size: 1.05rem;">
                  <span style="color: var(--accent-red-bright); margin-right: 0.5rem;">0${step.order}</span> ${this.escapeHtml(step.skill)}
                </div>
                <span class="effort-badge">Effort: ${this.escapeHtml(step.estimated_effort || 'MEDIUM')}</span>
              </div>
              <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                Prerequisites: <strong style="color: var(--text-primary);">${this.escapeHtml(prereqsHTML)}</strong>
              </div>
              <div class="tags-container">${topicsHTML}</div>
            `;
            seqContainer.appendChild(card);
          });
        } else {
          seqContainer.innerHTML = '<span style="color: var(--text-muted);">No sequence items defined</span>';
        }
      }

      // G. Practice Focus
      const pfContainer = document.getElementById('ai-practice-focus-container');
      if (pfContainer) {
        pfContainer.innerHTML = '';
        if (Array.isArray(la.practice_focus) && la.practice_focus.length > 0) {
          la.practice_focus.forEach((pf, idx) => {
            const card = document.createElement('div');
            card.className = 'focus-item-card';
            card.innerHTML = `
              <div class="focus-bullet">${idx + 1}.</div>
              <div class="focus-text"><strong>${this.escapeHtml(pf)}</strong></div>
            `;
            pfContainer.appendChild(card);
          });
        } else {
          pfContainer.innerHTML = '<span style="color: var(--text-muted);">Complete practice exercises matching missing skills</span>';
        }
      }
    }
  },

  /**
   * Helper to render tag pills inside a container
   */
  renderTagsContainer(containerId, list, bg, border, prefix = '') {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';

    if (Array.isArray(list) && list.length > 0) {
      list.forEach(item => {
        const tag = document.createElement('span');
        tag.className = 'tag-pill';
        tag.style.backgroundColor = bg;
        tag.style.borderColor = border;
        tag.textContent = prefix ? `${prefix} ${item}` : item;
        el.appendChild(tag);
      });
    } else {
      el.innerHTML = '<span style="color: var(--text-muted); font-size: 0.8rem;">None recorded</span>';
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
  ReadinessApp.init();
});
