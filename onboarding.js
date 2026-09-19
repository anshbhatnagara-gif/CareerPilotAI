/**
 * CAREERPILOT AI - PHASE 8.8.2 ONBOARDING ENGINE
 * 
 * Manages 6-step onboarding workflow, input validation, custom skill tags,
 * interest selection, profile review, and backend Profile API persistence via
 * GET /api/profile and PUT /api/profile.
 */

const API_BASE_URL = 'http://localhost:5000/api';
const PROFILE_STORAGE_KEY = 'careerPilotProfile';

const OnboardingApp = {
  currentStep: 1,
  totalSteps: 6,
  customSkills: [],

  async init() {
    const isAuth = await this.protectRoute();
    if (!isAuth) return;

    this.bindEvents();
    await this.loadProfile();
    this.renderStep(this.currentStep);
  },

  /**
   * Route Guard: Ensure user is authenticated with active backend session
   */
  async protectRoute() {
    if (typeof AuthService !== 'undefined') {
      const status = await AuthService.checkAuthStatus();
      if (!status.success) {
        window.location.href = 'login.html';
        return false;
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
    // Navigation buttons
    document.getElementById('next-btn').addEventListener('click', () => this.nextStep());
    document.getElementById('back-btn').addEventListener('click', () => this.prevStep());
    document.getElementById('edit-btn').addEventListener('click', () => this.renderStep(1));
    document.getElementById('save-btn').addEventListener('click', () => this.saveProfile());
    document.getElementById('continue-phase3-btn').addEventListener('click', () => this.handlePhase3Continue());

    // Logout buttons
    document.getElementById('logout-btn').addEventListener('click', async () => {
      if (typeof AuthService !== 'undefined') {
        await AuthService.logout();
      } else {
        window.location.href = 'login.html';
      }
    });

    // Custom Skill handlers
    document.getElementById('add-skill-btn').addEventListener('click', () => this.addCustomSkill());
    document.getElementById('custom-skill-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.addCustomSkill();
      }
    });

    // Interest 'Other' checkbox toggle
    const otherInterestCheckbox = document.getElementById('interest-other-checkbox');
    if (otherInterestCheckbox) {
      otherInterestCheckbox.addEventListener('change', (e) => {
        const block = document.getElementById('custom-interest-block');
        block.style.display = e.target.checked ? 'block' : 'none';
      });
    }

    // Step dots navigation (only allow backward or validated navigation)
    document.querySelectorAll('.step-dot').forEach(dot => {
      dot.addEventListener('click', (e) => {
        const targetStep = parseInt(e.target.getAttribute('data-step'), 10);
        if (targetStep < this.currentStep) {
          this.renderStep(targetStep);
        }
      });
    });
  },

  /**
   * Load profile directly from backend GET /api/profile
   */
  async loadProfile() {
    try {
      const res = await fetch(`${API_BASE_URL}/profile`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });

      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = 'login.html';
          return;
        }
        console.warn('Failed to fetch profile from backend API:', res.status);
        return;
      }

      const data = await res.json();
      if (!data.success || !data.profile) return;

      const profile = data.profile;

      // Step 1: Personal
      if (profile.personal) {
        if (profile.personal.fullName) {
          document.getElementById('step1-fullName').value = profile.personal.fullName;
          document.getElementById('header-user-name').textContent = profile.personal.fullName;
        }
        if (profile.personal.email) {
          document.getElementById('step1-email').value = profile.personal.email;
        }
        if (profile.personal.location) {
          document.getElementById('step1-location').value = profile.personal.location;
        }
      }

      // Step 2: Education
      if (profile.education) {
        if (profile.education.college) document.getElementById('step2-college').value = profile.education.college;
        if (profile.education.degree) document.getElementById('step2-degree').value = profile.education.degree;
        if (profile.education.branch) document.getElementById('step2-branch').value = profile.education.branch;
        if (profile.education.currentYear) document.getElementById('step2-currentYear').value = profile.education.currentYear;
        if (profile.education.graduationYear) document.getElementById('step2-graduationYear').value = String(profile.education.graduationYear);
      }

      // Step 3: Skills
      if (Array.isArray(profile.skills)) {
        const standardSkills = ["C", "C++", "Java", "Python", "JavaScript", "HTML", "CSS", "React", "Node.js", "MySQL", "MongoDB", "PostgreSQL", "Git", "GitHub", "VS Code"];
        
        this.customSkills = [];
        profile.skills.forEach(skill => {
          if (standardSkills.includes(skill)) {
            const cb = document.querySelector(`.skill-checkbox[value="${CSS.escape(skill)}"]`);
            if (cb) cb.checked = true;
          } else {
            // Custom skill
            if (!this.customSkills.includes(skill)) {
              this.customSkills.push(skill);
            }
          }
        });
        this.renderCustomSkillTags();
      }

      // Step 4: Interests
      if (Array.isArray(profile.interests)) {
        const standardInterests = ["Software Development", "Web Development", "App Development", "AI / Machine Learning", "Data Science", "Cybersecurity", "Cloud Computing", "DevOps", "UI/UX Design"];
        
        let customInterestValue = '';

        profile.interests.forEach(interest => {
          if (standardInterests.includes(interest)) {
            const cb = document.querySelector(`.interest-checkbox[value="${CSS.escape(interest)}"]`);
            if (cb) cb.checked = true;
          } else {
            // Other / Custom interest
            const otherCb = document.getElementById('interest-other-checkbox');
            if (otherCb) otherCb.checked = true;
            customInterestValue = interest;
          }
        });

        if (customInterestValue) {
          document.getElementById('custom-interest-block').style.display = 'block';
          document.getElementById('custom-interest-input').value = customInterestValue;
        }
      }

      // Step 5: Career Goal
      if (profile.careerGoal) {
        if (profile.careerGoal.targetCareer) document.getElementById('step5-targetCareer').value = profile.careerGoal.targetCareer;
        if (profile.careerGoal.goal) document.getElementById('step5-careerGoal').value = profile.careerGoal.goal;
        if (profile.careerGoal.experienceLevel) {
          const radio = document.querySelector(`input[name="experienceLevel"][value="${CSS.escape(profile.careerGoal.experienceLevel)}"]`);
          if (radio) radio.checked = true;
        }
      }
    } catch (e) {
      console.error('Error loading profile from backend:', e);
    }
  },

  /**
   * Render target step UI and update progress
   */
  renderStep(stepNumber) {
    this.clearAlerts();
    this.currentStep = stepNumber;

    // Hide all step containers
    for (let i = 1; i <= this.totalSteps; i++) {
      const el = document.getElementById(`step-${i}`);
      if (el) el.style.display = 'none';
    }

    // Show target step container
    const activeEl = document.getElementById(`step-${stepNumber}`);
    if (activeEl) activeEl.style.display = 'block';

    // Update Progress Bar & Counter
    const percent = Math.round((stepNumber / this.totalSteps) * 100);
    document.getElementById('progress-bar-fill').style.width = `${percent}%`;

    const stepTitles = [
      "ABOUT YOU",
      "EDUCATION",
      "SKILLS",
      "INTERESTS",
      "CAREER GOAL",
      "REVIEW PROFILE"
    ];
    document.getElementById('progress-step-title').textContent = `STEP ${stepNumber}: ${stepTitles[stepNumber - 1]}`;
    document.getElementById('progress-step-counter').textContent = `STEP ${stepNumber} OF 6 (${percent}%)`;

    // Update Step Dots
    document.querySelectorAll('.step-dot').forEach(dot => {
      const dotStep = parseInt(dot.getAttribute('data-step'), 10);
      dot.classList.remove('active', 'completed');
      if (dotStep === stepNumber) {
        dot.classList.add('active');
      } else if (dotStep < stepNumber) {
        dot.classList.add('completed');
      }
    });

    // Manage Navigation Buttons
    const backBtn = document.getElementById('back-btn');
    const nextBtn = document.getElementById('next-btn');
    const editBtn = document.getElementById('edit-btn');
    const saveBtn = document.getElementById('save-btn');
    const continueBtn = document.getElementById('continue-phase3-btn');

    // Reset buttons
    backBtn.style.visibility = stepNumber === 1 ? 'hidden' : 'visible';
    nextBtn.style.display = stepNumber === this.totalSteps ? 'none' : 'inline-flex';
    editBtn.style.display = stepNumber === this.totalSteps ? 'inline-flex' : 'none';
    saveBtn.style.display = stepNumber === this.totalSteps ? 'inline-flex' : 'none';
    continueBtn.style.display = 'none';

    // Step 6 special review render
    if (stepNumber === this.totalSteps) {
      this.renderReview();
    }
  },

  /**
   * Validate current step inputs before proceeding
   */
  validateStep(stepNumber) {
    this.clearAlerts();

    if (stepNumber === 1) {
      const name = document.getElementById('step1-fullName').value.trim();
      const location = document.getElementById('step1-location').value.trim();

      if (!name) {
        this.showError('Please enter your full name.');
        document.getElementById('step1-fullName').focus();
        return false;
      }
      if (!location) {
        this.showError('Please enter your location.');
        document.getElementById('step1-location').focus();
        return false;
      }
      return true;
    }

    if (stepNumber === 2) {
      const college = document.getElementById('step2-college').value.trim();
      const degree = document.getElementById('step2-degree').value;
      const branch = document.getElementById('step2-branch').value.trim();
      const currentYear = document.getElementById('step2-currentYear').value;
      const gradYear = document.getElementById('step2-graduationYear').value;

      if (!college) {
        this.showError('Please enter your college or university.');
        document.getElementById('step2-college').focus();
        return false;
      }
      if (!degree) {
        this.showError('Please select your degree/program.');
        document.getElementById('step2-degree').focus();
        return false;
      }
      if (!branch) {
        this.showError('Please enter your branch/specialization.');
        document.getElementById('step2-branch').focus();
        return false;
      }
      if (!currentYear) {
        this.showError('Please select your current year.');
        document.getElementById('step2-currentYear').focus();
        return false;
      }
      if (!gradYear) {
        this.showError('Please select your expected graduation year.');
        document.getElementById('step2-graduationYear').focus();
        return false;
      }
      return true;
    }

    if (stepNumber === 3) {
      const selectedSkills = this.getSelectedSkills();
      if (selectedSkills.length === 0) {
        this.showError('Please select at least one skill.');
        return false;
      }
      return true;
    }

    if (stepNumber === 4) {
      const selectedInterests = this.getSelectedInterests();
      if (selectedInterests.length === 0) {
        this.showError('Please select at least one area of interest.');
        return false;
      }
      return true;
    }

    if (stepNumber === 5) {
      const targetCareer = document.getElementById('step5-targetCareer').value;
      const expRadio = document.querySelector('input[name="experienceLevel"]:checked');
      const goal = document.getElementById('step5-careerGoal').value.trim();

      if (!targetCareer) {
        this.showError('Please select your target career.');
        document.getElementById('step5-targetCareer').focus();
        return false;
      }
      if (!expRadio) {
        this.showError('Please select your experience level.');
        return false;
      }
      if (!goal) {
        this.showError('Please enter your career goal.');
        document.getElementById('step5-careerGoal').focus();
        return false;
      }
      return true;
    }

    return true;
  },

  nextStep() {
    if (this.validateStep(this.currentStep)) {
      if (this.currentStep < this.totalSteps) {
        this.renderStep(this.currentStep + 1);
      }
    }
  },

  prevStep() {
    if (this.currentStep > 1) {
      this.renderStep(this.currentStep - 1);
    }
  },

  /**
   * Helper to collect all checked and custom skills
   */
  getSelectedSkills() {
    const checked = Array.from(document.querySelectorAll('.skill-checkbox:checked')).map(cb => cb.value);
    const combined = [...checked, ...this.customSkills];
    return Array.from(new Set(combined));
  },

  /**
   * Helper to collect all selected interests
   */
  getSelectedInterests() {
    const checked = Array.from(document.querySelectorAll('.interest-checkbox:checked')).map(cb => cb.value);
    const interests = [];

    checked.forEach(val => {
      if (val === 'Other') {
        const customVal = document.getElementById('custom-interest-input').value.trim();
        if (customVal) {
          interests.push(customVal);
        }
      } else {
        interests.push(val);
      }
    });

    return Array.from(new Set(interests));
  },

  /**
   * Custom Skills Tag Management
   */
  addCustomSkill() {
    const input = document.getElementById('custom-skill-input');
    const val = input.value.trim();

    if (!val) return;

    // Check duplicate
    if (this.customSkills.map(s => s.toLowerCase()).includes(val.toLowerCase())) {
      input.value = '';
      return;
    }

    this.customSkills.push(val);
    input.value = '';
    this.renderCustomSkillTags();
  },

  removeCustomSkill(index) {
    this.customSkills.splice(index, 1);
    this.renderCustomSkillTags();
  },

  renderCustomSkillTags() {
    const container = document.getElementById('custom-skills-tags');
    container.innerHTML = '';

    this.customSkills.forEach((skill, idx) => {
      const tag = document.createElement('div');
      tag.className = 'tag-pill';
      tag.innerHTML = `
        <span>${this.escapeHtml(skill)}</span>
        <button type="button" class="tag-remove-btn" onclick="OnboardingApp.removeCustomSkill(${idx})">×</button>
      `;
      container.appendChild(tag);
    });
  },

  /**
   * Step 6 Summary Review Renderer
   */
  renderReview() {
    const container = document.getElementById('review-sections-stack');
    container.innerHTML = '';

    const name = document.getElementById('step1-fullName').value.trim();
    const email = document.getElementById('step1-email').value.trim();
    const location = document.getElementById('step1-location').value.trim();

    const college = document.getElementById('step2-college').value.trim();
    const degree = document.getElementById('step2-degree').value;
    const branch = document.getElementById('step2-branch').value.trim();
    const currentYear = document.getElementById('step2-currentYear').value;
    const gradYear = document.getElementById('step2-graduationYear').value;

    const skills = this.getSelectedSkills();
    const interests = this.getSelectedInterests();

    const targetCareer = document.getElementById('step5-targetCareer').value;
    const expRadio = document.querySelector('input[name="experienceLevel"]:checked');
    const expLevel = expRadio ? expRadio.value : 'N/A';
    const goal = document.getElementById('step5-careerGoal').value.trim();

    const skillsTagsHTML = skills.length 
      ? skills.map(s => `<span class="tag-pill" style="margin-right: 0.35rem; margin-bottom: 0.35rem;">${this.escapeHtml(s)}</span>`).join('')
      : '<span style="color: var(--text-muted);">None selected</span>';

    const interestsTagsHTML = interests.length 
      ? interests.map(i => `<span class="tag-pill" style="margin-right: 0.35rem; margin-bottom: 0.35rem;">${this.escapeHtml(i)}</span>`).join('')
      : '<span style="color: var(--text-muted);">None selected</span>';

    container.innerHTML = `
      <div class="review-section-card">
        <div class="review-section-header">PERSONAL INFORMATION</div>
        <div class="review-grid">
          <div class="review-item"><span class="review-label">Full Name</span><span class="review-value">${this.escapeHtml(name)}</span></div>
          <div class="review-item"><span class="review-label">Email</span><span class="review-value">${this.escapeHtml(email)}</span></div>
          <div class="review-item"><span class="review-label">Location</span><span class="review-value">${this.escapeHtml(location)}</span></div>
        </div>
      </div>

      <div class="review-section-card">
        <div class="review-section-header">EDUCATION</div>
        <div class="review-grid">
          <div class="review-item"><span class="review-label">College / University</span><span class="review-value">${this.escapeHtml(college)}</span></div>
          <div class="review-item"><span class="review-label">Degree / Program</span><span class="review-value">${this.escapeHtml(degree)}</span></div>
          <div class="review-item"><span class="review-label">Branch</span><span class="review-value">${this.escapeHtml(branch)}</span></div>
          <div class="review-item"><span class="review-label">Current Year</span><span class="review-value">${this.escapeHtml(currentYear)}</span></div>
          <div class="review-item"><span class="review-label">Graduation Year</span><span class="review-value">${this.escapeHtml(gradYear)}</span></div>
        </div>
      </div>

      <div class="review-section-card">
        <div class="review-section-header">SKILLS</div>
        <div style="margin-top: 0.5rem; display: flex; flex-wrap: wrap;">${skillsTagsHTML}</div>
      </div>

      <div class="review-section-card">
        <div class="review-section-header">INTERESTS</div>
        <div style="margin-top: 0.5rem; display: flex; flex-wrap: wrap;">${interestsTagsHTML}</div>
      </div>

      <div class="review-section-card">
        <div class="review-section-header">CAREER GOAL</div>
        <div class="review-grid" style="margin-bottom: 0.75rem;">
          <div class="review-item"><span class="review-label">Target Career</span><span class="review-value">${this.escapeHtml(targetCareer)}</span></div>
          <div class="review-item"><span class="review-label">Experience Level</span><span class="review-value">${this.escapeHtml(expLevel)}</span></div>
        </div>
        <div class="review-item">
          <span class="review-label">Career Goal Statement</span>
          <span class="review-value" style="margin-top: 0.2rem; font-style: italic;">"${this.escapeHtml(goal)}"</span>
        </div>
      </div>
    `;
  },

  /**
   * Save Career Profile to backend PUT /api/profile
   */
  async saveProfile() {
    // Validate final state across all steps
    for (let step = 1; step <= 5; step++) {
      if (!this.validateStep(step)) {
        this.renderStep(step);
        return;
      }
    }

    const expRadio = document.querySelector('input[name="experienceLevel"]:checked');

    const profilePayload = {
      personal: {
        location: document.getElementById('step1-location').value.trim()
      },
      education: {
        college: document.getElementById('step2-college').value.trim(),
        degree: document.getElementById('step2-degree').value,
        branch: document.getElementById('step2-branch').value.trim(),
        currentYear: document.getElementById('step2-currentYear').value,
        graduationYear: document.getElementById('step2-graduationYear').value
      },
      skills: this.getSelectedSkills(),
      interests: this.getSelectedInterests(),
      careerGoal: {
        targetCareer: document.getElementById('step5-targetCareer').value,
        experienceLevel: expRadio ? expRadio.value : '',
        goal: document.getElementById('step5-careerGoal').value.trim()
      }
    };

    try {
      const res = await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profilePayload)
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 200 && data.success) {
        // Remove legacy profile key from localStorage once backend save is verified
        localStorage.removeItem(PROFILE_STORAGE_KEY);

        // Show save success message
        this.clearAlerts();
        const successAlert = document.getElementById('success-alert');
        successAlert.textContent = "Your career profile has been saved successfully.";
        successAlert.style.display = 'block';

        // Hide save/edit buttons and show CONTINUE button
        document.getElementById('edit-btn').style.display = 'none';
        document.getElementById('save-btn').style.display = 'none';
        document.getElementById('continue-phase3-btn').style.display = 'inline-flex';
      } else if (res.status === 400 && data.errors && data.errors.length > 0) {
        this.showError(data.errors[0].message || data.message || 'Failed to save profile.');
      } else {
        this.showError(data.message || 'Failed to save profile. Please try again.');
      }
    } catch (e) {
      console.error('Error saving career profile to backend:', e);
      this.showError('Unable to connect to the CareerPilot server. Please try again.');
    }
  },

  handlePhase3Continue() {
    window.location.href = 'assessment.html';
  },

  showError(msg) {
    const errorAlert = document.getElementById('error-alert');
    errorAlert.textContent = msg;
    errorAlert.style.display = 'block';
    errorAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  clearAlerts() {
    const errorAlert = document.getElementById('error-alert');
    const successAlert = document.getElementById('success-alert');
    if (errorAlert) {
      errorAlert.style.display = 'none';
      errorAlert.textContent = '';
    }
    if (successAlert) {
      successAlert.style.display = 'none';
      successAlert.textContent = '';
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

// Initialize when DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
  OnboardingApp.init();
});
