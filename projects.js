/**
 * CAREERPILOT AI - PHASE 8.8.4 PROJECTS & PROJECT TRACKER ENGINE
 * 
 * Fetches authoritative personalized project recommendations and manages interactive
 * project status tracking directly via backend APIs:
 * - GET /api/projects
 * - PATCH /api/projects/:id
 * 
 * Manages route protection, detail modal, real-time UI filtering, clean error handling,
 * and DOM rendering without client-side catalog specs or local fingerprint logic.
 */

const API_BASE_URL = 'http://localhost:5000/api';

const ProjectsApp = {
  projectsData: null,
  activeFilter: 'ALL',
  selectedProjectId: null,

  async init() {
    const isAuth = await this.protectRoute();
    if (!isAuth) return;

    this.bindEvents();
    await this.loadProjects();
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
    // Logout
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

    // Review Profile
    const reviewBtn = document.getElementById('review-profile-btn');
    if (reviewBtn) {
      reviewBtn.addEventListener('click', () => {
        window.location.href = 'onboarding.html';
      });
    }

    // Back to Roadmap
    const backRoadmapBtn = document.getElementById('back-roadmap-btn');
    if (backRoadmapBtn) {
      backRoadmapBtn.addEventListener('click', () => {
        window.location.href = 'roadmap.html';
      });
    }

    // Continue to Phase 7 (Interview Simulator & Career Tools)
    const continueBtn = document.getElementById('continue-phase7-btn');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        window.location.href = 'interview.html';
      });
    }

    // Filter Buttons
    const filterContainer = document.getElementById('project-filters');
    if (filterContainer) {
      filterContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;

        filterContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        this.activeFilter = btn.dataset.filter || 'ALL';
        this.renderProjectsList();
      });
    }

    // Modal Close
    const modalBackdrop = document.getElementById('project-modal-backdrop');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', () => this.closeDetailModal());
    }

    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) this.closeDetailModal();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalBackdrop && modalBackdrop.style.display !== 'none') {
        this.closeDetailModal();
      }
    });

    // Modal Status Update Buttons
    const btnNotStarted = document.getElementById('btn-status-notstarted');
    const btnInProgress = document.getElementById('btn-status-inprogress');
    const btnCompleted = document.getElementById('btn-status-completed');

    if (btnNotStarted) {
      btnNotStarted.addEventListener('click', () => {
        if (this.selectedProjectId) this.updateProjectStatus(this.selectedProjectId, 'NOT_STARTED');
      });
    }
    if (btnInProgress) {
      btnInProgress.addEventListener('click', () => {
        if (this.selectedProjectId) this.updateProjectStatus(this.selectedProjectId, 'IN_PROGRESS');
      });
    }
    if (btnCompleted) {
      btnCompleted.addEventListener('click', () => {
        if (this.selectedProjectId) this.updateProjectStatus(this.selectedProjectId, 'COMPLETED');
      });
    }

    // Next recommended project view button
    const nextViewBtn = document.getElementById('next-proj-view-btn');
    if (nextViewBtn) {
      nextViewBtn.addEventListener('click', () => {
        const nextProj = this.getNextRecommendedProject();
        if (nextProj) this.openDetailModal(nextProj.id);
      });
    }
  },

  /**
   * Load Projects from backend API GET /api/projects
   */
  async loadProjects() {
    try {
      const res = await fetch(`${API_BASE_URL}/projects`, {
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
          errData.message || 'Please complete your career profile before viewing personalized project recommendations.',
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
      if (data && data.success && Array.isArray(data.projects)) {
        // Remove obsolete localStorage projects data source once backend GET succeeds
        localStorage.removeItem('careerPilotProjects');

        this.projectsData = data;
        this.renderAll();
      } else {
        this.showErrorState('Unable to load project recommendations. Please try again.');
      }
    } catch (e) {
      console.error('Projects API Network Error:', e);
      this.showErrorState('Unable to connect to the CareerPilot server. Please try again.');
    }
  },

  /**
   * Update Project Status via PATCH /api/projects/:id
   */
  async updateProjectStatus(projectId, newStatus) {
    if (!projectId || !newStatus) return;

    try {
      const res = await fetch(`${API_BASE_URL}/projects/${encodeURIComponent(projectId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (res.status === 401) {
        window.location.href = 'login.html';
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || 'Failed to update project status.');
        return;
      }

      const data = await res.json();
      if (data && data.success && data.projectsData) {
        this.projectsData = data.projectsData;
        this.renderAll();

        // If detail modal is open for this project, update modal state
        if (this.selectedProjectId === projectId) {
          const proj = (this.projectsData.projects || []).find(p => p.id === projectId || p.dbId === Number(projectId));
          if (proj) {
            this.updateModalStatusView(proj.status);
          }
        }
      }
    } catch (e) {
      console.error('Update Project Status Network Error:', e);
      alert('Unable to connect to the CareerPilot server. Please try again.');
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
        <div class="onboarding-container" style="max-width: 1000px; margin-top: 2rem;">
          <div class="onboarding-card" style="text-align: center; padding: 3rem 2rem; border-color: var(--accent-red);">
            <h2 style="font-size: 1.35rem; color: #f87171; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 1rem;">
              PROJECTS ERROR
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
   * Next Recommended Project Helper
   */
  getNextRecommendedProject() {
    if (!this.projectsData || !Array.isArray(this.projectsData.projects)) return null;
    const projects = this.projectsData.projects;

    // First in-progress or not-started high-priority project
    const inProgress = projects.find(p => p.status === 'IN_PROGRESS');
    if (inProgress) return inProgress;

    const notStartedHigh = projects.find(p => p.status === 'NOT_STARTED' && p.priority === 'HIGH');
    if (notStartedHigh) return notStartedHigh;

    const notStartedAny = projects.find(p => p.status === 'NOT_STARTED');
    if (notStartedAny) return notStartedAny;

    return projects[0] || null;
  },

  /**
   * Open Detail Modal
   */
  openDetailModal(projectId) {
    if (!this.projectsData || !Array.isArray(this.projectsData.projects)) return;

    const proj = this.projectsData.projects.find(p => String(p.id) === String(projectId) || String(p.dbId) === String(projectId));
    if (!proj) return;

    this.selectedProjectId = proj.id;

    const modalBackdrop = document.getElementById('project-modal-backdrop');
    const titleEl = document.getElementById('modal-project-title');
    const diffEl = document.getElementById('modal-project-difficulty');
    const prioEl = document.getElementById('modal-project-priority');
    const effortEl = document.getElementById('modal-project-effort');
    const whyEl = document.getElementById('modal-project-why');
    const objEl = document.getElementById('modal-project-objective');
    const descEl = document.getElementById('modal-project-description');
    const skillsEl = document.getElementById('modal-project-skills');
    const prereqsEl = document.getElementById('modal-project-prereqs');
    const techEl = document.getElementById('modal-project-tech');
    const milesEl = document.getElementById('modal-project-milestones');

    if (titleEl) titleEl.textContent = proj.title;
    if (whyEl) whyEl.textContent = proj.whyThisProject || 'This project reinforces core domain competencies.';
    if (objEl) objEl.textContent = proj.objective || 'Demonstrate practical project proficiency.';
    if (descEl) descEl.textContent = proj.description || '';
    if (effortEl) effortEl.textContent = proj.estimatedEffort || '6–10 hours';

    if (diffEl) {
      diffEl.textContent = proj.difficulty;
      diffEl.className = "diff-badge diff-" + proj.difficulty.toLowerCase();
    }

    if (prioEl) {
      prioEl.textContent = proj.priority + " PRIORITY";
      prioEl.className = "priority-badge priority-" + proj.priority.toLowerCase();
    }

    // Skills Covered Tags
    if (skillsEl) {
      skillsEl.innerHTML = '';
      (proj.skillsCovered || []).forEach(s => {
        const tag = document.createElement('span');
        tag.className = 'skill-tag skill-tag-met';
        tag.textContent = '✓ ' + s;
        skillsEl.appendChild(tag);
      });
    }

    // Prerequisites Tags
    if (prereqsEl) {
      prereqsEl.innerHTML = '';
      const reqs = proj.requiredSkills || [];
      if (reqs.length > 0) {
        reqs.forEach(r => {
          const tag = document.createElement('span');
          tag.className = 'tag-pill';
          tag.textContent = r;
          prereqsEl.appendChild(tag);
        });
      } else {
        prereqsEl.innerHTML = '<span style="color: var(--text-secondary); font-size: 0.85rem;">None</span>';
      }
    }

    // Tech Stack Tags
    if (techEl) {
      techEl.innerHTML = '';
      (proj.techStack || []).forEach(t => {
        const tag = document.createElement('span');
        tag.className = 'tag-pill';
        tag.style.backgroundColor = '#141414';
        tag.textContent = t;
        techEl.appendChild(tag);
      });
    }

    // Milestones Checklist
    if (milesEl) {
      milesEl.innerHTML = '';
      (proj.milestones || []).forEach((m, i) => {
        const item = document.createElement('div');
        item.style.padding = '0.35rem 0';
        item.style.fontSize = '0.9rem';
        item.style.color = 'var(--text-primary)';
        item.innerHTML = `<strong>${i + 1}.</strong> ${this.escapeHtml(m)}`;
        milesEl.appendChild(item);
      });
    }

    this.updateModalStatusView(proj.status);

    if (modalBackdrop) modalBackdrop.style.display = 'flex';
  },

  /**
   * Update Modal Status Buttons & Pill
   */
  updateModalStatusView(status) {
    const pill = document.getElementById('modal-project-status-pill');
    if (pill) {
      if (status === 'COMPLETED') {
        pill.className = 'status-pill status-completed';
        pill.textContent = '✓ COMPLETED';
      } else if (status === 'IN_PROGRESS') {
        pill.className = 'status-pill status-inprogress';
        pill.textContent = '⚙ IN PROGRESS';
      } else {
        pill.className = 'status-pill status-notstarted';
        pill.textContent = '○ NOT STARTED';
      }
    }

    const btnNotStarted = document.getElementById('btn-status-notstarted');
    const btnInProgress = document.getElementById('btn-status-inprogress');
    const btnCompleted = document.getElementById('btn-status-completed');

    if (btnNotStarted) {
      btnNotStarted.className = status === 'NOT_STARTED' ? 'btn btn-primary' : 'btn btn-secondary';
    }
    if (btnInProgress) {
      btnInProgress.className = status === 'IN_PROGRESS' ? 'btn btn-primary' : 'btn btn-secondary';
    }
    if (btnCompleted) {
      btnCompleted.className = status === 'COMPLETED' ? 'btn btn-primary' : 'btn btn-secondary';
    }
  },

  /**
   * Close Detail Modal
   */
  closeDetailModal() {
    const modalBackdrop = document.getElementById('project-modal-backdrop');
    if (modalBackdrop) modalBackdrop.style.display = 'none';
    this.selectedProjectId = null;
  },

  /**
   * Render All Project Page Sections
   */
  renderAll() {
    if (!this.projectsData) return;
    const data = this.projectsData;

    // Header info
    const targetEl = document.getElementById('proj-target-career');
    if (targetEl) targetEl.textContent = data.targetCareer || 'Software Engineer';

    const scoreEl = document.getElementById('proj-readiness-score');
    if (scoreEl) scoreEl.textContent = (data.readinessScore || 0) + " / 100";

    const statusBadge = document.getElementById('proj-tracking-status');
    if (statusBadge) {
      statusBadge.textContent = (data.completedProjects || 0) + " / " + (data.totalProjects || 0) + " COMPLETED";
      if (data.completedProjects > 0) {
        statusBadge.className = 'alignment-badge alignment-badge-high';
      } else {
        statusBadge.className = 'alignment-badge alignment-badge-medium';
      }
    }

    // Metric Counters
    const totalEl = document.getElementById('metric-total-projects');
    if (totalEl) totalEl.textContent = data.totalProjects || 0;

    const compEl = document.getElementById('metric-completed-projects');
    if (compEl) compEl.textContent = data.completedProjects || 0;

    const inprogEl = document.getElementById('metric-inprogress-projects');
    if (inprogEl) inprogEl.textContent = data.inProgressProjects || 0;

    const notstartEl = document.getElementById('metric-notstarted-projects');
    if (notstartEl) notstartEl.textContent = data.notStartedProjects || 0;

    const highEl = document.getElementById('metric-high-projects');
    if (highEl) highEl.textContent = data.highPriorityProjects || 0;

    // Current Position Statement
    const posEl = document.getElementById('proj-current-position');
    if (posEl) {
      if (data.completedProjects === 0 && data.inProgressProjects === 0) {
        posEl.textContent = "Your project journey has not started yet. Begin with the highest-priority project to build your initial portfolio proof.";
      } else if (data.completedProjects === data.totalProjects && data.totalProjects > 0) {
        posEl.textContent = "You have completed all " + data.totalProjects + " recommended portfolio projects! Continue strengthening your codebase with deeper architectural complexity.";
      } else if (data.inProgressProjects > 0 && data.completedProjects === 0) {
        posEl.textContent = "You are currently building practical proof. Keep moving through your active project.";
      } else {
        posEl.textContent = "You have completed " + data.completedProjects + " of " + data.totalProjects + " recommended projects (" + data.inProgressProjects + " currently in progress). Focus on closing the next priority project.";
      }
    }

    // Next Recommended Project Highlight Card
    const nextProj = this.getNextRecommendedProject();
    const nextWrapper = document.getElementById('next-project-wrapper');

    if (nextProj && nextWrapper) {
      const titleEl = document.getElementById('next-proj-title');
      const reasonEl = document.getElementById('next-proj-reason');
      const diffEl = document.getElementById('next-proj-difficulty');
      const prioEl = document.getElementById('next-proj-priority');
      const effortEl = document.getElementById('next-proj-effort');
      const skillsContainer = document.getElementById('next-proj-skills');

      if (titleEl) titleEl.textContent = nextProj.title;
      if (reasonEl) reasonEl.textContent = nextProj.whyThisProject || 'This project reinforces core domain competencies.';
      if (effortEl) effortEl.textContent = "Effort: " + (nextProj.estimatedEffort || '6–10 hours');

      if (diffEl) {
        diffEl.textContent = nextProj.difficulty;
        diffEl.className = "diff-badge diff-" + nextProj.difficulty.toLowerCase();
      }

      if (prioEl) {
        prioEl.textContent = nextProj.priority + " PRIORITY";
        prioEl.className = "priority-badge priority-" + nextProj.priority.toLowerCase();
      }

      if (skillsContainer) {
        skillsContainer.innerHTML = '';
        (nextProj.skillsCovered || []).forEach(s => {
          const tag = document.createElement('span');
          tag.className = 'skill-tag skill-tag-met';
          tag.textContent = '✓ ' + s;
          skillsContainer.appendChild(tag);
        });
      }

      nextWrapper.style.display = 'block';
    } else if (nextWrapper) {
      nextWrapper.style.display = 'none';
    }

    this.renderProjectsList();
  },

  /**
   * Render Filtered Projects Grid
   */
  renderProjectsList() {
    const grid = document.getElementById('projects-grid');
    if (!grid || !this.projectsData || !Array.isArray(this.projectsData.projects)) return;

    grid.innerHTML = '';

    // Filter projects based on active filter
    const filtered = this.projectsData.projects.filter(p => {
      if (this.activeFilter === 'ALL') return true;
      if (this.activeFilter === 'HIGH') return p.priority === 'HIGH';
      if (this.activeFilter === 'BEGINNER') return p.difficulty === 'BEGINNER';
      if (this.activeFilter === 'INTERMEDIATE') return p.difficulty === 'INTERMEDIATE';
      if (this.activeFilter === 'ADVANCED') return p.difficulty === 'ADVANCED';
      if (this.activeFilter === 'NOT_STARTED') return p.status === 'NOT_STARTED';
      if (this.activeFilter === 'IN_PROGRESS') return p.status === 'IN_PROGRESS';
      if (this.activeFilter === 'COMPLETED') return p.status === 'COMPLETED';
      return true;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="onboarding-card" style="grid-column: 1 / -1; text-align: center; padding: 2.5rem 1rem;">
          <p style="color: var(--text-secondary); margin: 0;">No projects match the "${this.escapeHtml(this.activeFilter)}" filter.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(proj => {
      const card = document.createElement('div');
      card.className = 'project-card onboarding-card';
      if (proj.status === 'COMPLETED') card.classList.add('proj-card-completed');
      else if (proj.status === 'IN_PROGRESS') card.classList.add('proj-card-inprogress');
      else card.classList.add('proj-card-notstarted');

      let statusPillClass = 'status-notstarted';
      let statusPillText = '○ NOT STARTED';
      if (proj.status === 'COMPLETED') {
        statusPillClass = 'status-completed';
        statusPillText = '✓ COMPLETED';
      } else if (proj.status === 'IN_PROGRESS') {
        statusPillClass = 'status-inprogress';
        statusPillText = '⚙ IN PROGRESS';
      }

      const skillsTags = (proj.skillsCovered || []).map(s => `<span class="skill-tag skill-tag-met">✓ ${this.escapeHtml(s)}</span>`).join('');
      const techTags = (proj.techStack || []).map(t => `<span class="skill-tag" style="background:#141414;">${this.escapeHtml(t)}</span>`).join('');

      card.innerHTML = `
        <div class="project-card-header">
          <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
            <span class="diff-badge diff-${proj.difficulty.toLowerCase()}">${this.escapeHtml(proj.difficulty)}</span>
            <span class="priority-badge priority-${proj.priority.toLowerCase()}">${this.escapeHtml(proj.priority)}</span>
          </div>
          <span class="status-pill ${statusPillClass}">${statusPillText}</span>
        </div>

        <h3 class="project-card-title">${this.escapeHtml(proj.title)}</h3>
        <p class="project-card-desc">${this.escapeHtml(proj.description || '')}</p>

        <div style="margin-bottom: 0.75rem;">
          <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.3rem;">Skills Covered:</div>
          <div class="tags-container">${skillsTags}</div>
        </div>

        <div style="margin-bottom: 1rem;">
          <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.3rem;">Tech Stack:</div>
          <div class="tags-container">${techTags}</div>
        </div>

        <div class="project-card-footer">
          <span class="effort-badge">Effort: ${this.escapeHtml(proj.estimatedEffort || '6–10 hours')}</span>
          <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            <select class="status-select" data-proj-id="${this.escapeHtml(String(proj.id))}" aria-label="Change project status">
              <option value="NOT_STARTED" ${proj.status === 'NOT_STARTED' ? 'selected' : ''}>NOT STARTED</option>
              <option value="IN_PROGRESS" ${proj.status === 'IN_PROGRESS' ? 'selected' : ''}>IN PROGRESS</option>
              <option value="COMPLETED" ${proj.status === 'COMPLETED' ? 'selected' : ''}>COMPLETED</option>
            </select>
            <button type="button" class="btn btn-secondary view-details-btn" data-proj-id="${this.escapeHtml(String(proj.id))}" style="width: auto; padding: 0.35rem 0.85rem; font-size: 0.8rem;">
              DETAILS →
            </button>
          </div>
        </div>
      `;

      grid.appendChild(card);
    });

    // Attach event listeners for status selects and detail buttons in the grid
    grid.querySelectorAll('.status-select').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const pId = e.target.dataset.projId;
        const newStat = e.target.value;
        this.updateProjectStatus(pId, newStat);
      });
    });

    grid.querySelectorAll('.view-details-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pId = e.currentTarget.dataset.projId;
        this.openDetailModal(pId);
      });
    });
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
  ProjectsApp.init();
});
