/**
 * CAREERPILOT AI - PHASE 4 CAREER READINESS & SKILL GAP ENGINE
 * 
 * Computes a local deterministic Career Readiness Score (0-100) and Skill Gap Analysis
 * based on the user's saved 'careerPilotProfile' and 'careerPilotAssessment'.
 * 
 * Features:
 * - Deterministic requirement mapping for 12 career roles
 * - Weighted readiness calculation (HIGH=3, MEDIUM=2, LOW=1)
 * - Skill Gap Analysis with HIGH/MEDIUM/LOW priorities & explanations
 * - First Focus recommendations
 * - LocalStorage persistence under 'careerPilotReadiness' with fingerprint change detection
 * - Zero password storage & zero external AI dependencies
 */

const PROFILE_STORAGE_KEY = 'careerPilotProfile';
const ASSESSMENT_STORAGE_KEY = 'careerPilotAssessment';
const READINESS_STORAGE_KEY = 'careerPilotReadiness';

const ReadinessApp = {
  profile: null,
  assessment: null,
  readinessData: null,

  init() {
    if (!this.protectRoute()) return;
    this.bindEvents();
    this.runCalculationFlow();
  },

  /**
   * Route Guard: Requires login, completed profile, and valid target career
   */
  protectRoute() {
    // 1. Session check
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

    // 2. Profile completion check
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

      if (!this.profile.careerGoal || !this.profile.careerGoal.targetCareer) {
        window.location.href = 'assessment.html';
        return false;
      }
    } catch (e) {
      console.error('Error reading profile:', e);
      window.location.href = 'onboarding.html';
      return false;
    }

    // 3. Load assessment if present
    try {
      const assessmentRaw = localStorage.getItem(ASSESSMENT_STORAGE_KEY);
      if (assessmentRaw) {
        this.assessment = JSON.parse(assessmentRaw);
      }
    } catch (e) {
      this.assessment = null;
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

    // Continue to Phase 5 button
    const continueBtn = document.getElementById('continue-phase5-btn');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        const lockedAlert = document.getElementById('phase5-locked-alert');
        if (lockedAlert) {
          lockedAlert.textContent = "Phase 5: Personalized Learning Roadmap — Coming in Next Phase.";
          lockedAlert.style.display = 'block';
          lockedAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    }
  },

  /**
   * Run Calculation Workflow (Loading Checklist -> Render Results)
   */
  runCalculationFlow() {
    const currentFingerprint = this.generateProfileFingerprint(this.profile);
    let savedReadiness = null;

    try {
      const savedRaw = localStorage.getItem(READINESS_STORAGE_KEY);
      if (savedRaw) {
        savedReadiness = JSON.parse(savedRaw);
      }
    } catch (e) {
      savedReadiness = null;
    }

    if (savedReadiness && savedReadiness.profileFingerprint === currentFingerprint) {
      this.readinessData = savedReadiness;
      this.renderReadinessResults();
    } else {
      this.showCalculationState(() => {
        this.readinessData = this.calculateReadiness(this.profile, this.assessment, currentFingerprint);
        this.saveReadiness(this.readinessData);
        this.renderReadinessResults();
      });
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
          if (resultsWrapper) resultsWrapper.style.display = 'block';
          if (onComplete) onComplete();
        }, 400);
      }
    }, 220);
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
    return 'fp_readiness_' + Math.abs(hash);
  },

  /**
   * Deterministic Career Requirement Specification Engine
   */
  getCareerRequirements(targetCareer) {
    const specs = {
      "Software Engineer": [
        { name: "Programming", priority: "HIGH", reason: "Core programming foundation needed to design algorithms and build software." },
        { name: "Data Structures & Algorithms", priority: "HIGH", reason: "Essential for efficient problem solving, technical interviews, and scalable code." },
        { name: "Problem Solving", priority: "HIGH", reason: "Fundamental capability to breakdown complex technical problems into logic." },
        { name: "Git", priority: "MEDIUM", reason: "Essential version control system for managing code history." },
        { name: "GitHub", priority: "MEDIUM", reason: "Standard platform for code collaboration, code reviews, and project hosting." },
        { name: "Backend Fundamentals", priority: "MEDIUM", reason: "Core server architecture and data flow principles." },
        { name: "APIs", priority: "MEDIUM", reason: "Enables integration between software components and third-party services." },
        { name: "Database Fundamentals", priority: "LOW", reason: "Understands basic data storage, persistence, and queries." },
        { name: "Projects", priority: "LOW", reason: "Practical application of software concepts in portfolio projects." }
      ],
      "Frontend Developer": [
        { name: "HTML", priority: "HIGH", reason: "Standard markup language for web page structure." },
        { name: "CSS", priority: "HIGH", reason: "Styling language for creating modern, attractive web user interfaces." },
        { name: "JavaScript", priority: "HIGH", reason: "Core programming language for browser interactivity and application logic." },
        { name: "Responsive Design", priority: "HIGH", reason: "Needed to build interfaces that adapt seamlessly across mobile, tablet, and desktop." },
        { name: "React", priority: "MEDIUM", reason: "Popular UI library for building component-based frontend web applications." },
        { name: "APIs", priority: "MEDIUM", reason: "Important for connecting frontend applications with backend services." },
        { name: "Git", priority: "LOW", reason: "Version control system for tracking frontend code changes." },
        { name: "GitHub", priority: "LOW", reason: "Platform for hosting and showcasing frontend repositories." }
      ],
      "Backend Developer": [
        { name: "Programming", priority: "HIGH", reason: "Core server-side programming language (Python, Java, Node.js, C++)." },
        { name: "Backend Development", priority: "HIGH", reason: "Server architecture, routing, business logic, and request processing." },
        { name: "APIs", priority: "HIGH", reason: "Designing and building RESTful or GraphQL Web API interfaces." },
        { name: "Databases", priority: "HIGH", reason: "Data persistence, schema design, and query optimization." },
        { name: "SQL", priority: "MEDIUM", reason: "Structured Query Language for managing relational database tables." },
        { name: "Authentication", priority: "MEDIUM", reason: "User session management, security, hashing, and token authorization." },
        { name: "Git", priority: "LOW", reason: "Version control system for managing backend repositories." },
        { name: "GitHub", priority: "LOW", reason: "Collaboration and codebase storage for backend projects." }
      ],
      "Full Stack Developer": [
        { name: "HTML", priority: "HIGH", reason: "Frontend structure and semantic markup." },
        { name: "CSS", priority: "HIGH", reason: "Frontend styling and responsive visual design." },
        { name: "JavaScript", priority: "HIGH", reason: "Primary language spanning both client browser and server environments." },
        { name: "React", priority: "MEDIUM", reason: "Frontend library for building dynamic single-page web applications." },
        { name: "Backend Development", priority: "HIGH", reason: "Server-side routing, logic, and API management." },
        { name: "APIs", priority: "MEDIUM", reason: "Connecting frontend user interfaces with backend endpoints." },
        { name: "Databases", priority: "MEDIUM", reason: "Managing data persistence in relational or NoSQL database stores." },
        { name: "SQL", priority: "MEDIUM", reason: "Relational database querying and management." },
        { name: "Authentication", priority: "MEDIUM", reason: "User authentication, security, and session management." },
        { name: "Git", priority: "LOW", reason: "Version control for full-stack codebases." },
        { name: "GitHub", priority: "LOW", reason: "Portfolio hosting and code collaboration." },
        { name: "Deployment", priority: "LOW", reason: "Packaging and deploying applications to production hosting platforms." }
      ],
      "Python Developer": [
        { name: "Python", priority: "HIGH", reason: "Core syntax, data types, standard library, and execution environment." },
        { name: "Object-Oriented Programming", priority: "HIGH", reason: "Designing clean modular code using classes, inheritance, and encapsulation." },
        { name: "Data Structures & Algorithms", priority: "HIGH", reason: "Data structures for optimal algorithmic efficiency." },
        { name: "APIs", priority: "MEDIUM", reason: "Building web services using Python frameworks (Flask/FastAPI/Django)." },
        { name: "Databases", priority: "MEDIUM", reason: "Interfacing Python code with SQL or NoSQL database stores." },
        { name: "SQL", priority: "MEDIUM", reason: "Relational database queries and ORM integration." },
        { name: "Git", priority: "LOW", reason: "Tracking python codebase revisions." },
        { name: "GitHub", priority: "LOW", reason: "Sharing and hosting Python projects." }
      ],
      "Data Analyst": [
        { name: "Python", priority: "HIGH", reason: "Primary scripting language for automated data manipulation." },
        { name: "SQL", priority: "HIGH", reason: "Querying relational data warehouses and database tables." },
        { name: "Excel", priority: "HIGH", reason: "Fundamental spreadsheet data manipulation and quick analysis." },
        { name: "Statistics", priority: "HIGH", reason: "Statistical analysis, distribution, mean/variance, and hypothesis testing." },
        { name: "Data Visualization", priority: "MEDIUM", reason: "Creating charts and visual summaries of business metrics." },
        { name: "Pandas", priority: "MEDIUM", reason: "Core Python library for data manipulation and DataFrame analysis." },
        { name: "Data Cleaning", priority: "LOW", reason: "Transforming raw data into clean, structured analytical datasets." }
      ],
      "Data Scientist": [
        { name: "Python", priority: "HIGH", reason: "Core programming ecosystem for scientific computing." },
        { name: "SQL", priority: "HIGH", reason: "Extracting data from complex enterprise databases." },
        { name: "Statistics", priority: "HIGH", reason: "Probability distributions, statistical modeling, and inference." },
        { name: "Pandas", priority: "MEDIUM", reason: "Data manipulation and feature engineering." },
        { name: "NumPy", priority: "MEDIUM", reason: "High-performance numerical matrix operations." },
        { name: "Machine Learning", priority: "HIGH", reason: "Supervised and unsupervised machine learning models." },
        { name: "Data Visualization", priority: "LOW", reason: "Visualizing model performance and data trends." }
      ],
      "AI/ML Engineer": [
        { name: "Python", priority: "HIGH", reason: "Core language for machine learning frameworks." },
        { name: "Mathematics", priority: "HIGH", reason: "Linear algebra, calculus, and matrix math for ML models." },
        { name: "Statistics", priority: "HIGH", reason: "Probability theory and statistical estimation." },
        { name: "Machine Learning", priority: "HIGH", reason: "Feature engineering, model selection, and training." },
        { name: "Deep Learning", priority: "MEDIUM", reason: "Neural networks and deep learning models (PyTorch/TensorFlow)." },
        { name: "Data Structures & Algorithms", priority: "MEDIUM", reason: "Efficient algorithm design for model pipelines." },
        { name: "Model Deployment", priority: "LOW", reason: "Serving ML models as production APIs." }
      ],
      "Cybersecurity Engineer": [
        { name: "Networking", priority: "HIGH", reason: "TCP/IP networking, routing, DNS, and packet analysis." },
        { name: "Linux", priority: "HIGH", reason: "Linux operating system administration and command line." },
        { name: "Cybersecurity Fundamentals", priority: "HIGH", reason: "Core security concepts, threats, vulnerabilities, and defense." },
        { name: "Authentication", priority: "MEDIUM", reason: "Identity management, access control, and PKI." },
        { name: "Cryptography", priority: "MEDIUM", reason: "Encryption algorithms, hashing, and secure communication." },
        { name: "Security Tools", priority: "LOW", reason: "Penetration testing and security scanner tools." },
        { name: "Operating Systems", priority: "LOW", reason: "OS internal security mechanics and hardening." }
      ],
      "Cloud Engineer": [
        { name: "Linux", priority: "HIGH", reason: "Linux server administration and shell scripting." },
        { name: "Networking", priority: "HIGH", reason: "VPCs, subnets, firewalls, and cloud network architecture." },
        { name: "Cloud Fundamentals", priority: "HIGH", reason: "Core cloud infrastructure concepts (compute, storage, IAM)." },
        { name: "AWS", priority: "MEDIUM", reason: "Amazon Web Services cloud platform." },
        { name: "Azure", priority: "LOW", reason: "Microsoft Azure cloud environment." },
        { name: "GCP", priority: "LOW", reason: "Google Cloud Platform tools." },
        { name: "Containers", priority: "MEDIUM", reason: "Containerizing workloads with Docker." },
        { name: "Deployment", priority: "MEDIUM", reason: "Automated cloud deployment and infrastructure management." }
      ],
      "DevOps Engineer": [
        { name: "Linux", priority: "HIGH", reason: "Linux system administration and shell scripting." },
        { name: "Git", priority: "HIGH", reason: "Version control for source code and infrastructure scripts." },
        { name: "CI/CD", priority: "HIGH", reason: "Continuous Integration and Continuous Deployment pipelines." },
        { name: "Docker", priority: "MEDIUM", reason: "Containerizing application workloads." },
        { name: "Cloud", priority: "MEDIUM", reason: "Cloud infrastructure provisioning." },
        { name: "Infrastructure", priority: "MEDIUM", reason: "Infrastructure as Code and system management." },
        { name: "Deployment", priority: "MEDIUM", reason: "Automating reliable software releases." },
        { name: "Automation", priority: "LOW", reason: "Scripting and task automation." }
      ],
      "UI/UX Designer": [
        { name: "UI Design Principles", priority: "HIGH", reason: "Visual hierarchy, typography, color theory, and layout." },
        { name: "UX Design Principles", priority: "HIGH", reason: "User-centered design, usability, and user journeys." },
        { name: "Wireframing", priority: "HIGH", reason: "Creating structural page blueprints and sketches." },
        { name: "Prototyping", priority: "MEDIUM", reason: "Building interactive clickable prototype demonstrations." },
        { name: "Design Systems", priority: "MEDIUM", reason: "Creating reusable component libraries and style guides." },
        { name: "Figma", priority: "MEDIUM", reason: "Industry standard design and prototyping tool." },
        { name: "User Research", priority: "LOW", reason: "User testing, interviews, and feedback gathering." }
      ]
    };

    const defaultRequirements = [
      { name: "Core Domain Fundamentals", priority: "HIGH", reason: "Core foundational knowledge required for the target role." },
      { name: "Problem Solving", priority: "HIGH", reason: "Analytical problem solving capability." },
      { name: "Git", priority: "MEDIUM", reason: "Version control for managing project code." },
      { name: "Portfolio Projects", priority: "MEDIUM", reason: "Practical projects demonstrating domain application." },
      { name: "Industry Tools", priority: "LOW", reason: "Standard toolset used in the profession." }
    ];

    return specs[targetCareer] || defaultRequirements;
  },

  /**
   * Deterministic Skill Normalization & Satisfiability Check
   */
  checkSkillSatisfaction(reqName, userSkills) {
    const normReq = reqName.toLowerCase();
    const normUserSkills = userSkills.map(s => s.toLowerCase());

    // Exact name match
    if (normUserSkills.includes(normReq)) return true;

    // Normalization rules mapping user skills to domain requirements
    if (normReq === 'programming' && normUserSkills.some(s => ['c', 'c++', 'java', 'python', 'javascript'].includes(s))) return true;
    if (normReq === 'backend development' && normUserSkills.some(s => ['node.js', 'python', 'java'].includes(s))) return true;
    if (normReq === 'backend fundamentals' && normUserSkills.some(s => ['node.js', 'python', 'java'].includes(s))) return true;
    if (normReq === 'databases' && normUserSkills.some(s => ['mysql', 'mongodb', 'postgresql'].includes(s))) return true;
    if (normReq === 'database fundamentals' && normUserSkills.some(s => ['mysql', 'mongodb', 'postgresql'].includes(s))) return true;
    if (normReq === 'sql' && normUserSkills.some(s => ['mysql', 'postgresql'].includes(s))) return true;
    if (normReq === 'html & css' && normUserSkills.includes('html') && normUserSkills.includes('css')) return true;
    if (normReq === 'html' && normUserSkills.includes('html')) return true;
    if (normReq === 'css' && normUserSkills.includes('css')) return true;
    if (normReq === 'javascript' && normUserSkills.includes('javascript')) return true;
    if (normReq === 'react' && normUserSkills.includes('react')) return true;
    if (normReq === 'python' && normUserSkills.includes('python')) return true;
    if (normReq === 'git' && normUserSkills.includes('git')) return true;
    if (normReq === 'github' && normUserSkills.includes('github')) return true;

    return false;
  },

  /**
   * Main Deterministic Readiness Calculation Engine
   */
  calculateReadiness(profile, assessment, fingerprint) {
    const targetCareer = profile.careerGoal.targetCareer || 'Software Engineer';
    const userSkills = Array.isArray(profile.skills) ? profile.skills : [];
    const expLevel = profile.careerGoal.experienceLevel || 'Beginner';

    const requirements = this.getCareerRequirements(targetCareer);

    // Priority Weights: HIGH = 3, MEDIUM = 2, LOW = 1
    const weightMap = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    let totalRequiredWeight = 0;
    let metWeight = 0;

    const metSkills = [];
    const missingSkills = [];
    const skillGaps = [];

    let highPriorityCount = 0;
    let mediumPriorityCount = 0;
    let lowPriorityCount = 0;

    requirements.forEach(req => {
      const weight = weightMap[req.priority] || 1;
      totalRequiredWeight += weight;

      const isMet = this.checkSkillSatisfaction(req.name, userSkills);

      if (isMet) {
        metWeight += weight;
        metSkills.push(req.name);
      } else {
        missingSkills.push(req.name);
        skillGaps.push({
          skill: req.name,
          priority: req.priority,
          reason: req.reason
        });

        if (req.priority === 'HIGH') highPriorityCount++;
        else if (req.priority === 'MEDIUM') mediumPriorityCount++;
        else if (req.priority === 'LOW') lowPriorityCount++;
      }
    });

    // Score Calculation (0-100)
    let score = totalRequiredWeight > 0 ? Math.round((metWeight / totalRequiredWeight) * 100) : 0;
    score = Math.max(0, Math.min(100, score));

    // Qualitative Score Status
    let status = "STARTING POINT";
    if (score >= 90) status = "JOB-READY FOUNDATION";
    else if (score >= 75) status = "STRONG FOUNDATION";
    else if (score >= 50) status = "DEVELOPING";
    else if (score >= 25) status = "EARLY STAGE";

    // Alignment from assessment or score
    let alignment = "MODERATE";
    if (this.assessment && this.assessment.confidenceLevel) {
      alignment = this.assessment.confidenceLevel;
    } else {
      if (score >= 70) alignment = "HIGH";
      else if (score < 40) alignment = "LOW";
    }

    // Dynamic Readiness Summary
    const requiredCount = requirements.length;
    const coveredCount = metSkills.length;
    const summary = `Your profile currently satisfies ${coveredCount} of ${requiredCount} core domain requirements for ${targetCareer}. You have established a solid baseline, but several key technical capabilities remain to be developed. Closing the highest-priority skill gaps will directly elevate your readiness for this career.`;

    // Dynamic Career Advice
    let advice = "";
    if (expLevel === 'Beginner' && score < 50) {
      advice = "Start by building hands-on fundamentals for your highest-priority missing skills. Avoid jumping straight into complex frameworks before mastering foundational concepts.";
    } else if (expLevel === 'Intermediate' || (score >= 50 && score < 80)) {
      advice = "Your core foundation is developing well. Focus your next efforts on closing medium and high-priority skill gaps while building 1 or 2 portfolio projects.";
    } else {
      advice = "Your profile shows strong domain alignment. Concentrate on production-level deployment, advanced technical problem solving, and targeted interview preparation.";
    }

    return {
      targetCareer,
      score,
      status,
      requiredSkills: requirements.map(r => r.name),
      metSkills,
      missingSkills,
      skillGaps,
      highPriorityCount,
      mediumPriorityCount,
      lowPriorityCount,
      coveredCount,
      requiredCount,
      alignment,
      summary,
      advice,
      generatedAt: new Date().toISOString(),
      profileFingerprint: fingerprint
    };
  },

  /**
   * Save readiness data to localStorage
   */
  saveReadiness(data) {
    try {
      localStorage.setItem(READINESS_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving readiness:', e);
    }
  },

  /**
   * Render Readiness UI
   */
  renderReadinessResults() {
    const data = this.readinessData;
    if (!data) return;

    // 1. Hero Readiness Score & Status
    const targetCareerTitle = document.getElementById('res-target-career');
    const scoreValEl = document.getElementById('res-score-value');
    const statusValEl = document.getElementById('res-status-value');
    const scoreProgressFill = document.getElementById('res-score-progress-fill');

    if (targetCareerTitle) targetCareerTitle.textContent = data.targetCareer;
    if (scoreValEl) scoreValEl.textContent = `${data.score} / 100`;
    if (statusValEl) statusValEl.textContent = data.status;
    if (scoreProgressFill) scoreProgressFill.style.width = `${data.score}%`;

    // 2. Readiness Summary
    const summaryEl = document.getElementById('res-readiness-summary');
    if (summaryEl) summaryEl.textContent = data.summary;

    // 3. Skill Coverage Stat
    const coverageEl = document.getElementById('res-skill-coverage');
    if (coverageEl) coverageEl.textContent = `${data.coveredCount} / ${data.requiredCount} REQUIRED SKILLS COVERED`;

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

    if (highCountEl) highCountEl.textContent = data.highPriorityCount;
    if (medCountEl) medCountEl.textContent = data.mediumPriorityCount;
    if (lowCountEl) lowCountEl.textContent = data.lowPriorityCount;

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
      const highGaps = data.skillGaps.filter(g => g.priority === 'HIGH').slice(0, 3);
      const displayFocus = highGaps.length > 0 ? highGaps : data.skillGaps.slice(0, 3);

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
    if (alignmentValEl) {
      alignmentValEl.textContent = `${data.alignment} ALIGNMENT`;
      alignmentValEl.className = `alignment-badge alignment-badge-${data.alignment.toLowerCase()}`;
    }

    // 9. Career Advice
    const adviceEl = document.getElementById('res-career-advice');
    if (adviceEl) adviceEl.textContent = data.advice;
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
