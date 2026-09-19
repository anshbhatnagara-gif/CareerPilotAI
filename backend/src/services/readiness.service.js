const pool = require('../config/db');
const config = require('../config/env');
const ProfileService = require('./profile.service');
const AssessmentService = require('./assessment.service');

// In-memory fallback readiness store for local dev/testing
const mockReadiness = new Map();

const careerRequirementSpecs = {
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

const ReadinessService = {
  isDbConfigured() {
    return Boolean(config.TIDB_HOST && config.TIDB_HOST.trim() !== '');
  },

  /**
   * Deterministic Readiness Profile Fingerprint
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
   * Get career requirement specifications for target career
   */
  getCareerRequirements(targetCareer) {
    return careerRequirementSpecs[targetCareer] || defaultRequirements;
  },

  /**
   * Conservative skill normalization and satisfiability check
   */
  checkSkillSatisfaction(reqName, userSkills) {
    const normReq = reqName.toLowerCase();
    const normUserSkills = userSkills.map(s => s.toLowerCase());

    if (normUserSkills.includes(normReq)) return true;

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
   * Calculate deterministic readiness score & report
   */
  calculateReadiness(profile, assessment, fingerprint) {
    const targetCareer = (profile.careerGoal && profile.careerGoal.targetCareer) ? profile.careerGoal.targetCareer.trim() : 'Software Engineer';
    const userSkills = Array.isArray(profile.skills) ? profile.skills : [];
    const expLevel = (profile.careerGoal && profile.careerGoal.experienceLevel) ? profile.careerGoal.experienceLevel.trim() : 'Beginner';

    const requirements = this.getCareerRequirements(targetCareer);

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

    let score = totalRequiredWeight > 0 ? Math.round((metWeight / totalRequiredWeight) * 100) : 0;
    score = Math.max(0, Math.min(100, score));

    let status = "STARTING POINT";
    if (score >= 90) status = "JOB-READY FOUNDATION";
    else if (score >= 75) status = "STRONG FOUNDATION";
    else if (score >= 50) status = "DEVELOPING";
    else if (score >= 25) status = "EARLY STAGE";

    let alignment = "MODERATE";
    if (assessment && assessment.confidenceLevel) {
      alignment = assessment.confidenceLevel;
    } else {
      if (score >= 70) alignment = "HIGH";
      else if (score < 40) alignment = "LOW";
    }

    const requiredCount = requirements.length;
    const coveredCount = metSkills.length;
    const summary = `Your profile currently satisfies ${coveredCount} of ${requiredCount} core domain requirements for ${targetCareer}. You have established a solid baseline, but several key technical capabilities remain to be developed. Closing the highest-priority skill gaps will directly elevate your readiness for this career.`;

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
   * Fetch readiness with fingerprint caching & database persistence
   */
  async getReadiness(userId) {
    if (!userId) throw new Error('User ID is required');

    const profile = await ProfileService.getProfile(userId);
    if (!profile || profile.completed !== true) {
      return { incompleteProfile: true };
    }

    if (!profile.careerGoal || !profile.careerGoal.targetCareer || !profile.careerGoal.targetCareer.trim()) {
      return { missingTargetCareer: true };
    }

    const fingerprint = this.generateProfileFingerprint(profile);
    const assessment = await AssessmentService.getAssessment(userId).catch(() => null);

    if (this.isDbConfigured()) {
      // Check latest persisted readiness report
      const [rows] = await pool.query(
        `SELECT target_career, score, status, required_skills, met_skills, missing_skills,
                skill_gaps, high_priority_count, medium_priority_count, low_priority_count,
                covered_count, required_count, alignment, summary, advice, profile_fingerprint, generated_at
         FROM readiness_reports
         WHERE user_id = ?
         ORDER BY generated_at DESC LIMIT 1`,
        [userId]
      );

      if (rows.length > 0 && rows[0].profile_fingerprint === fingerprint) {
        const stored = rows[0];
        return {
          targetCareer: stored.target_career,
          score: Number(stored.score),
          status: stored.status,
          requiredSkills: typeof stored.required_skills === 'string' ? JSON.parse(stored.required_skills) : (stored.required_skills || []),
          metSkills: typeof stored.met_skills === 'string' ? JSON.parse(stored.met_skills) : (stored.met_skills || []),
          missingSkills: typeof stored.missing_skills === 'string' ? JSON.parse(stored.missing_skills) : (stored.missing_skills || []),
          skillGaps: typeof stored.skill_gaps === 'string' ? JSON.parse(stored.skill_gaps) : (stored.skill_gaps || []),
          highPriorityCount: Number(stored.high_priority_count),
          mediumPriorityCount: Number(stored.medium_priority_count),
          lowPriorityCount: Number(stored.low_priority_count),
          coveredCount: Number(stored.covered_count),
          requiredCount: Number(stored.required_count),
          alignment: stored.alignment,
          summary: stored.summary,
          advice: stored.advice,
          generatedAt: stored.generated_at ? new Date(stored.generated_at).toISOString() : new Date().toISOString(),
          profileFingerprint: stored.profile_fingerprint
        };
      }

      // Generate new readiness report & persist
      const newReadiness = this.calculateReadiness(profile, assessment, fingerprint);

      await pool.query(
        `INSERT INTO readiness_reports (
          user_id, target_career, score, status, required_skills, met_skills,
          missing_skills, skill_gaps, high_priority_count, medium_priority_count,
          low_priority_count, covered_count, required_count, alignment, summary,
          advice, profile_fingerprint, generated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          userId,
          newReadiness.targetCareer,
          newReadiness.score,
          newReadiness.status,
          JSON.stringify(newReadiness.requiredSkills),
          JSON.stringify(newReadiness.metSkills),
          JSON.stringify(newReadiness.missingSkills),
          JSON.stringify(newReadiness.skillGaps),
          newReadiness.highPriorityCount,
          newReadiness.mediumPriorityCount,
          newReadiness.lowPriorityCount,
          newReadiness.coveredCount,
          newReadiness.requiredCount,
          newReadiness.alignment,
          newReadiness.summary,
          newReadiness.advice,
          fingerprint
        ]
      );

      return newReadiness;
    }

    // In-memory fallback
    const cached = mockReadiness.get(Number(userId));
    if (cached && cached.profileFingerprint === fingerprint) {
      return cached;
    }

    const calculated = this.calculateReadiness(profile, assessment, fingerprint);
    mockReadiness.set(Number(userId), calculated);
    return calculated;
  }
};

module.exports = ReadinessService;
