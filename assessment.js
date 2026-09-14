/**
 * CAREERPILOT AI - PHASE 3 AI CAREER ASSESSMENT ENGINE
 * 
 * Performs a deterministic local analysis of the user's saved 'careerPilotProfile',
 * evaluating career alignment, strengths, current skills, recommended focus areas,
 * and actionable career guidance.
 * 
 * Manages route protection, simulated analysis checklist, profile fingerprinting,
 * and localStorage persistence under 'careerPilotAssessment'.
 */

const PROFILE_STORAGE_KEY = 'careerPilotProfile';
const ASSESSMENT_STORAGE_KEY = 'careerPilotAssessment';

const AssessmentApp = {
  profile: null,
  assessmentData: null,

  init() {
    if (!this.protectRoute()) return;
    this.bindEvents();
    this.runAnalysisFlow();
  },

  /**
   * Route Protection: Require active session and completed career profile
   */
  protectRoute() {
    // 1. Check logged in state
    if (typeof AuthService !== 'undefined') {
      if (!AuthService.isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
      }
    } else {
      if (localStorage.getItem('careerPilotLoggedIn') !== 'true') {
        window.location.href = 'login.html';
        return false;
      }
    }

    // 2. Check profile existence and completion
    try {
      const profileRaw = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (!profileRaw) {
        window.location.href = 'onboarding.html';
        return false;
      }

      this.profile = JSON.parse(profileRaw);
      if (!this.profile || this.profile.completed !== true) {
        window.location.href = 'onboarding.html';
        return false;
      }
    } catch (e) {
      console.error('Error reading profile:', e);
      window.location.href = 'onboarding.html';
      return false;
    }

    return true;
  },

  /**
   * Event Bindings
   */
  bindEvents() {
    // Header user name
    if (this.profile && this.profile.personal && this.profile.personal.fullName) {
      const badgeName = document.getElementById('header-user-name');
      if (badgeName) badgeName.textContent = this.profile.personal.fullName;
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (typeof AuthService !== 'undefined') {
          AuthService.logout();
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

    // Continue to Phase 4 Readiness button
    const continueBtn = document.getElementById('continue-phase4-btn');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        window.location.href = 'readiness.html';
      });
    }
  },

  /**
   * Analysis Workflow (Simulated Loading -> Render Assessment)
   */
  runAnalysisFlow() {
    const currentFingerprint = this.generateProfileFingerprint(this.profile);
    let savedAssessment = null;

    try {
      const savedRaw = localStorage.getItem(ASSESSMENT_STORAGE_KEY);
      if (savedRaw) {
        savedAssessment = JSON.parse(savedRaw);
      }
    } catch (e) {
      savedAssessment = null;
    }

    // Check if stored assessment matches current profile fingerprint
    if (savedAssessment && savedAssessment.profileFingerprint === currentFingerprint) {
      this.assessmentData = savedAssessment;
      this.renderAssessmentResults();
    } else {
      // Show short analysis checklist state then generate new assessment
      this.showAnalyzingState(() => {
        this.assessmentData = this.generateAssessment(this.profile, currentFingerprint);
        this.saveAssessment(this.assessmentData);
        this.renderAssessmentResults();
      });
    }
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
          if (resultsWrapper) resultsWrapper.style.display = 'block';
          if (onComplete) onComplete();
        }, 400);
      }
    }, 250);
  },

  /**
   * Deterministic Profile Fingerprint
   */
  generateProfileFingerprint(profile) {
    if (!profile) return '';
    const str = JSON.stringify({
      p: profile.personal,
      e: profile.education,
      s: profile.skills,
      i: profile.interests,
      c: profile.careerGoal
    });
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return 'fp_' + Math.abs(hash);
  },

  /**
   * Deterministic Local AI Assessment Engine
   */
  generateAssessment(profile, fingerprint) {
    const targetCareer = (profile.careerGoal && profile.careerGoal.targetCareer) ? profile.careerGoal.targetCareer : 'Software Engineer';
    const expLevel = (profile.careerGoal && profile.careerGoal.experienceLevel) ? profile.careerGoal.experienceLevel : 'Beginner';
    const userSkills = Array.isArray(profile.skills) ? profile.skills : [];
    const userInterests = Array.isArray(profile.interests) ? profile.interests : [];
    const degree = (profile.education && profile.education.degree) ? profile.education.degree : '';
    const goalText = (profile.careerGoal && profile.careerGoal.goal) ? profile.careerGoal.goal : '';

    // Requirement map for target careers
    const requirementMap = {
      "Software Engineer": ["Programming Fundamentals", "Data Structures & Algorithms", "Git & GitHub", "Problem Solving", "Backend Fundamentals", "Software Projects"],
      "Frontend Developer": ["HTML & CSS", "JavaScript", "Responsive Design", "React", "REST APIs", "Git & GitHub"],
      "Backend Developer": ["Programming Fundamentals", "REST APIs", "Database Design", "Authentication & Security", "Server-Side Development", "Git & GitHub"],
      "Full Stack Developer": ["HTML/CSS & JavaScript", "Frontend Frameworks", "Backend Fundamentals", "REST APIs", "Databases", "Authentication & Deployment"],
      "Python Developer": ["Python Core", "Object-Oriented Programming", "Data Structures", "REST APIs", "Databases & SQL", "Git & GitHub"],
      "Data Analyst": ["Python Basics", "SQL & Querying", "Excel Analytics", "Statistics", "Data Visualization", "Pandas & Data Cleaning"],
      "Data Scientist": ["Python Core", "SQL & Databases", "Applied Statistics", "Pandas & NumPy", "Machine Learning Algorithms", "Data Modeling"],
      "AI/ML Engineer": ["Python Core", "Applied Mathematics & Statistics", "Machine Learning", "Deep Learning Frameworks", "Model Deployment", "Git & GitHub"],
      "Cybersecurity Engineer": ["Computer Networking", "Linux Systems", "Security Fundamentals", "Authentication Protocols", "Cryptography Basics", "Security Tools"],
      "Cloud Engineer": ["Linux Administration", "Networking Basics", "Cloud Fundamentals (AWS/Azure/GCP)", "Containerization (Docker)", "Cloud Deployment", "Git"],
      "DevOps Engineer": ["Linux Systems", "Git Version Control", "CI/CD Pipelines", "Docker & Containers", "Cloud Infrastructure", "Automation Scripting"],
      "UI/UX Designer": ["UI Design Principles", "UX Research", "Wireframing & Layouts", "Interactive Prototyping", "Design Systems", "Figma / Design Tools"]
    };

    const defaultRequirements = ["Core Domain Fundamentals", "Technical Problem Solving", "Industry Tools", "Portfolio Projects", "Software Engineering Best Practices"];
    const domainRequirements = requirementMap[targetCareer] || defaultRequirements;

    // 1. Current Skills (Exact match to profile.skills)
    const currentSkills = [...userSkills];

    // 2. Strengths Analysis
    const strengths = [];
    const progSkills = ["C", "C++", "Java", "Python", "JavaScript"];
    const webSkills = ["HTML", "CSS", "React", "Node.js"];
    const dbSkills = ["MySQL", "MongoDB", "PostgreSQL"];
    const toolSkills = ["Git", "GitHub", "VS Code"];

    if (userSkills.some(s => progSkills.includes(s))) {
      strengths.push("Programming Foundation");
    }
    if (userSkills.some(s => toolSkills.includes(s))) {
      strengths.push("Version Control & Tooling Awareness");
    }
    if (userSkills.some(s => webSkills.includes(s))) {
      strengths.push("Web Development Exposure");
    }
    if (userSkills.some(s => dbSkills.includes(s))) {
      strengths.push("Database & Data Persistence Knowledge");
    }
    if (["B.Tech", "B.E.", "BCA", "MCA", "M.Tech"].includes(degree)) {
      strengths.push("Relevant Academic Computer Science Background");
    }
    if (userInterests.some(i => i.toLowerCase().includes(targetCareer.toLowerCase()) || targetCareer.toLowerCase().includes(i.toLowerCase()))) {
      strengths.push("Strong Target Domain Alignment");
    }
    if (strengths.length === 0) {
      strengths.push("Clear Career Objective & Direction");
    }

    // 3. Recommended Focus Areas
    const focusAreas = [];
    const normalizedUserSkills = userSkills.map(s => s.toLowerCase());

    domainRequirements.forEach(req => {
      const reqLower = req.toLowerCase();
      // Check if user already has a skill matching this requirement
      let matched = false;
      if (reqLower.includes('python') && normalizedUserSkills.includes('python')) matched = true;
      if (reqLower.includes('java') && (normalizedUserSkills.includes('java') || normalizedUserSkills.includes('javascript'))) matched = true;
      if (reqLower.includes('html') && (normalizedUserSkills.includes('html') || normalizedUserSkills.includes('css'))) matched = true;
      if (reqLower.includes('git') && (normalizedUserSkills.includes('git') || normalizedUserSkills.includes('github'))) matched = true;
      if (reqLower.includes('database') && (normalizedUserSkills.includes('mysql') || normalizedUserSkills.includes('mongodb') || normalizedUserSkills.includes('postgresql'))) matched = true;
      if (reqLower.includes('react') && normalizedUserSkills.includes('react')) matched = true;

      if (!matched) {
        focusAreas.push(req);
      }
    });

    if (focusAreas.length === 0) {
      focusAreas.push("Advanced System Architecture", "Production Deployment", "Full-Stack Project Portfolio");
    }

    // 4. Qualitative Career Alignment (HIGH / MODERATE / LOW)
    let score = 0;
    score += Math.min(userSkills.length * 15, 45); // skill count weight
    if (["B.Tech", "B.E.", "BCA", "MCA", "M.Tech"].includes(degree)) score += 20; // degree weight
    if (userInterests.length > 0) score += 15; // interest weight
    if (expLevel === 'Intermediate' || expLevel === 'Advanced') score += 15; // experience weight

    let confidenceLevel = "MODERATE";
    if (score >= 65) {
      confidenceLevel = "HIGH";
    } else if (score < 35) {
      confidenceLevel = "LOW";
    }

    // 5. Career Direction Statement
    const careerDirection = `Your current profile demonstrates a ${confidenceLevel} alignment with your selected target career of ${targetCareer}.`;

    // 6. Dynamic Profile Summary Paragraph
    const academicText = degree ? `Pursuing a ${degree} background` : 'With your current academic background';
    const skillCountText = userSkills.length > 0 ? `possessing key foundational skills in ${userSkills.slice(0, 3).join(', ')}` : 'currently building your technical foundation';
    const interestText = userInterests.length > 0 ? `interested in ${userInterests.slice(0, 2).join(' and ')}` : 'focused on career growth';

    const profileSummary = `Based on your profile, ${academicText} and ${skillCountText}, you show a developing foundation for ${targetCareer}. Being ${interestText}, your strongest immediate advantage is your existing technical exposure. To advance to the next stage, your focus should be directed toward mastering core domain competencies and building practical portfolio applications.`;

    // 7. Dynamic Career Advice
    let careerAdvice = '';
    if (expLevel === 'Beginner') {
      careerAdvice = `As a ${expLevel} aiming for a role as a ${targetCareer}, concentrate first on solidifying core fundamentals before diving into complex framework abstractions. Prioritize hands-on problem solving, version control discipline with Git/GitHub, and small end-to-end projects.`;
    } else if (expLevel === 'Intermediate') {
      careerAdvice = `With an ${expLevel} foundation targeting ${targetCareer}, focus on building production-style projects, deepening your architectural understanding, and mastering API design, automated testing, and deployment workflows.`;
    } else {
      careerAdvice = `As an ${expLevel} candidate aiming for ${targetCareer}, sharpen your system-level design knowledge, contribute to open-source or complex full-stack repositories, and prepare thoroughly for technical domain interviews.`;
    }

    return {
      careerDirection,
      profileSummary,
      strengths,
      currentSkills,
      focusAreas,
      careerAdvice,
      confidenceLevel,
      generatedAt: new Date().toISOString(),
      profileFingerprint: fingerprint
    };
  },

  /**
   * Save assessment to localStorage (No passwords stored)
   */
  saveAssessment(data) {
    try {
      localStorage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving assessment:', e);
    }
  },

  /**
   * Render Assessment Results UI
   */
  renderAssessmentResults() {
    const data = this.assessmentData;
    if (!data) return;

    // 1. Career Direction & Alignment
    const directionTitle = document.getElementById('res-career-direction');
    const badgeEl = document.getElementById('res-alignment-badge');
    
    if (directionTitle) {
      directionTitle.textContent = (this.profile && this.profile.careerGoal) ? this.profile.careerGoal.targetCareer : 'Software Engineer';
    }

    if (badgeEl) {
      badgeEl.textContent = `ALIGNMENT: ${data.confidenceLevel}`;
      badgeEl.className = `alignment-badge alignment-badge-${data.confidenceLevel.toLowerCase()}`;
    }

    // 2. Profile Summary
    const summaryEl = document.getElementById('res-profile-summary');
    if (summaryEl) summaryEl.textContent = data.profileSummary;

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

    // 4. Current Skills (Exact match)
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
      }
    }

    // 6. Career Advice
    const adviceEl = document.getElementById('res-career-advice');
    if (adviceEl) adviceEl.textContent = data.careerAdvice;
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
