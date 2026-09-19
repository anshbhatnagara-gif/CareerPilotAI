const pool = require('../config/db');
const config = require('../config/env');
const ProfileService = require('./profile.service');
const ReadinessService = require('./readiness.service');

// In-memory fallback roadmap store for local testing
const mockRoadmaps = new Map();

const careerSequences = {
  "Software Engineer": [
    { skill: "Programming", stage: "stage-1", defaultPriority: "HIGH", reason: "Fundamental logic and programming language syntax." },
    { skill: "Problem Solving", stage: "stage-1", defaultPriority: "HIGH", reason: "Deconstructing complex technical specifications into code logic." },
    { skill: "Data Structures & Algorithms", stage: "stage-2", defaultPriority: "HIGH", reason: "Core computer science foundation for algorithmic efficiency." },
    { skill: "Git", stage: "stage-2", defaultPriority: "MEDIUM", reason: "Essential version control system for tracking repository history." },
    { skill: "GitHub", stage: "stage-2", defaultPriority: "MEDIUM", reason: "Collaborative code hosting and peer review workflows." },
    { skill: "Backend Fundamentals", stage: "stage-3", defaultPriority: "MEDIUM", reason: "Server infrastructure and request processing mechanisms." },
    { skill: "APIs", stage: "stage-3", defaultPriority: "MEDIUM", reason: "Designing and consuming HTTP web services." },
    { skill: "Database Fundamentals", stage: "stage-4", defaultPriority: "LOW", reason: "Data storage concepts, indexing, and query execution." },
    { skill: "Software Architecture", stage: "stage-4", defaultPriority: "LOW", reason: "System design patterns and clean code principles." },
    { skill: "Technical Problem Solving", stage: "stage-5", defaultPriority: "MEDIUM", reason: "Algorithmic interview preparation and system design practice." }
  ],
  "Frontend Developer": [
    { skill: "HTML", stage: "stage-1", defaultPriority: "HIGH", reason: "Semantic document markup foundation for web pages." },
    { skill: "CSS", stage: "stage-1", defaultPriority: "HIGH", reason: "Styling, layouts, flexbox, and grid for visual interfaces." },
    { skill: "JavaScript", stage: "stage-1", defaultPriority: "HIGH", reason: "Browser application logic, DOM manipulation, and ES6+ features." },
    { skill: "Responsive Design", stage: "stage-2", defaultPriority: "HIGH", reason: "Creating adaptive mobile-first layouts across all viewports." },
    { skill: "Git", stage: "stage-2", defaultPriority: "LOW", reason: "Version control tracking for frontend repositories." },
    { skill: "GitHub", stage: "stage-2", defaultPriority: "LOW", reason: "Hosting web projects and managing code iterations." },
    { skill: "React", stage: "stage-3", defaultPriority: "MEDIUM", reason: "Component-based UI framework for scalable web applications." },
    { skill: "APIs", stage: "stage-3", defaultPriority: "MEDIUM", reason: "Asynchronous data fetching and REST integration." },
    { skill: "State Management", stage: "stage-4", defaultPriority: "LOW", reason: "Global application state architecture (Redux/Context)." },
    { skill: "Portfolio Preparedness", stage: "stage-5", defaultPriority: "MEDIUM", reason: "Assembling responsive frontend projects into a showcase." }
  ],
  "Backend Developer": [
    { skill: "Programming", stage: "stage-1", defaultPriority: "HIGH", reason: "Server-side language mastery (Python, Java, Node.js, C++)." },
    { skill: "Backend Development", stage: "stage-1", defaultPriority: "HIGH", reason: "Web servers, routing, middleware, and request processing." },
    { skill: "Databases", stage: "stage-2", defaultPriority: "HIGH", reason: "Data modeling, relational schemas, and document stores." },
    { skill: "SQL", stage: "stage-2", defaultPriority: "MEDIUM", reason: "Writing efficient relational queries and database migrations." },
    { skill: "APIs", stage: "stage-3", defaultPriority: "HIGH", reason: "Building RESTful endpoints and API microservices." },
    { skill: "Authentication", stage: "stage-3", defaultPriority: "MEDIUM", reason: "JWT tokens, password hashing, and user permission security." },
    { skill: "Git", stage: "stage-4", defaultPriority: "LOW", reason: "Managing backend code versions and branches." },
    { skill: "GitHub", stage: "stage-4", defaultPriority: "LOW", reason: "Code reviews and repository management." },
    { skill: "Deployment", stage: "stage-5", defaultPriority: "MEDIUM", reason: "Deploying server applications to production hosting environments." }
  ],
  "Full Stack Developer": [
    { skill: "HTML", stage: "stage-1", defaultPriority: "HIGH", reason: "Web page structure and markup." },
    { skill: "CSS", stage: "stage-1", defaultPriority: "HIGH", reason: "Styling and responsive web layouts." },
    { skill: "JavaScript", stage: "stage-1", defaultPriority: "HIGH", reason: "Universal language for frontend interactivity and backend logic." },
    { skill: "Responsive Design", stage: "stage-2", defaultPriority: "HIGH", reason: "Mobile-responsive user experience across devices." },
    { skill: "React", stage: "stage-2", defaultPriority: "MEDIUM", reason: "Modern component UI framework." },
    { skill: "Backend Development", stage: "stage-3", defaultPriority: "HIGH", reason: "Server-side routing, controllers, and business logic." },
    { skill: "APIs", stage: "stage-3", defaultPriority: "HIGH", reason: "Connecting client frontend with server backend APIs." },
    { skill: "Databases", stage: "stage-3", defaultPriority: "HIGH", reason: "Persisting application data in SQL or NoSQL stores." },
    { skill: "SQL", stage: "stage-4", defaultPriority: "MEDIUM", reason: "Relational database querying and data management." },
    { skill: "Authentication", stage: "stage-4", defaultPriority: "MEDIUM", reason: "User login sessions and security tokens." },
    { skill: "Git", stage: "stage-4", defaultPriority: "LOW", reason: "Source code version control." },
    { skill: "GitHub", stage: "stage-4", defaultPriority: "LOW", reason: "Repository hosting and project management." },
    { skill: "Deployment", stage: "stage-5", defaultPriority: "MEDIUM", reason: "End-to-end full stack web application deployment." }
  ],
  "Python Developer": [
    { skill: "Python", stage: "stage-1", defaultPriority: "HIGH", reason: "Core Python syntax, data types, and standard library." },
    { skill: "Object-Oriented Programming", stage: "stage-1", defaultPriority: "HIGH", reason: "Classes, inheritance, encapsulation, and design principles." },
    { skill: "Data Structures & Algorithms", stage: "stage-2", defaultPriority: "HIGH", reason: "Lists, dicts, recursion, and algorithmic efficiency." },
    { skill: "APIs", stage: "stage-3", defaultPriority: "MEDIUM", reason: "Building web microservices with FastAPI or Flask." },
    { skill: "Databases", stage: "stage-3", defaultPriority: "MEDIUM", reason: "Connecting Python applications to database storage." },
    { skill: "SQL", stage: "stage-3", defaultPriority: "MEDIUM", reason: "ORM integration and raw SQL query execution." },
    { skill: "Git", stage: "stage-4", defaultPriority: "LOW", reason: "Version control management for Python scripts." },
    { skill: "GitHub", stage: "stage-4", defaultPriority: "LOW", reason: "Showcasing Python code packages and tools." },
    { skill: "Testing & Automation", stage: "stage-5", defaultPriority: "MEDIUM", reason: "PyTest unit testing and automated script execution." }
  ],
  "Data Analyst": [
    { skill: "Excel", stage: "stage-1", defaultPriority: "HIGH", reason: "Spreadsheet formulas, pivot tables, and data manipulation." },
    { skill: "SQL", stage: "stage-1", defaultPriority: "HIGH", reason: "Querying relational databases, aggregations, and joins." },
    { skill: "Python", stage: "stage-2", defaultPriority: "HIGH", reason: "Data analysis scripting and library usage." },
    { skill: "Statistics", stage: "stage-2", defaultPriority: "HIGH", reason: "Descriptive statistics, distributions, and hypothesis testing." },
    { skill: "Pandas", stage: "stage-3", defaultPriority: "HIGH", reason: "DataFrames, data transformation, and cleaning." },
    { skill: "Data Cleaning", stage: "stage-3", defaultPriority: "MEDIUM", reason: "Handling missing values, deduplication, and parsing." },
    { skill: "Data Visualization", stage: "stage-4", defaultPriority: "MEDIUM", reason: "Charts, dashboards, and storytelling with Matplotlib/Seaborn." },
    { skill: "Business Intelligence", stage: "stage-5", defaultPriority: "LOW", reason: "Translating data insights into business reporting." }
  ],
  "Data Scientist": [
    { skill: "Python", stage: "stage-1", defaultPriority: "HIGH", reason: "Primary data science programming language." },
    { skill: "SQL", stage: "stage-1", defaultPriority: "HIGH", reason: "Extracting datasets from analytical databases." },
    { skill: "Statistics", stage: "stage-1", defaultPriority: "HIGH", reason: "Probability, statistical modeling, and inference." },
    { skill: "NumPy", stage: "stage-2", defaultPriority: "HIGH", reason: "Numerical computing and matrix operations." },
    { skill: "Pandas", stage: "stage-2", defaultPriority: "HIGH", reason: "Data manipulation, feature preparation, and exploration." },
    { skill: "Data Visualization", stage: "stage-3", defaultPriority: "MEDIUM", reason: "Exploratory data analysis visual plots." },
    { skill: "Machine Learning", stage: "stage-4", defaultPriority: "HIGH", reason: "Predictive modeling, regression, and classification algorithms." },
    { skill: "Model Evaluation", stage: "stage-5", defaultPriority: "MEDIUM", reason: "Validation metrics, cross-validation, and hyperparameter tuning." }
  ],
  "AI/ML Engineer": [
    { skill: "Python", stage: "stage-1", defaultPriority: "HIGH", reason: "Core language for AI models and ML frameworks." },
    { skill: "Mathematics", stage: "stage-1", defaultPriority: "HIGH", reason: "Linear algebra, calculus, and vector spaces." },
    { skill: "Statistics", stage: "stage-1", defaultPriority: "HIGH", reason: "Probability distributions and statistical modeling." },
    { skill: "Data Structures & Algorithms", stage: "stage-2", defaultPriority: "HIGH", reason: "Computational efficiency and algorithmic optimization." },
    { skill: "Machine Learning", stage: "stage-3", defaultPriority: "HIGH", reason: "Supervised and unsupervised learning techniques." },
    { skill: "Deep Learning", stage: "stage-4", defaultPriority: "HIGH", reason: "Neural networks, PyTorch/TensorFlow, and architecture design." },
    { skill: "Model Deployment", stage: "stage-5", defaultPriority: "MEDIUM", reason: "Serving machine learning models via API endpoints." }
  ],
  "Cybersecurity Engineer": [
    { skill: "Operating Systems", stage: "stage-1", defaultPriority: "HIGH", reason: "OS process management, permissions, and security." },
    { skill: "Networking", stage: "stage-1", defaultPriority: "HIGH", reason: "TCP/IP protocol stack, DNS, routing, and firewalls." },
    { skill: "Linux", stage: "stage-2", defaultPriority: "HIGH", reason: "Command line administration and shell scripting." },
    { skill: "Cybersecurity Fundamentals", stage: "stage-2", defaultPriority: "HIGH", reason: "Threat landscapes, attack vectors, and defense mechanisms." },
    { skill: "Authentication", stage: "stage-3", defaultPriority: "MEDIUM", reason: "Access control, identity management, and MFA." },
    { skill: "Cryptography", stage: "stage-3", defaultPriority: "MEDIUM", reason: "Symmetric/asymmetric encryption, hashing, and PKI." },
    { skill: "Security Tools", stage: "stage-4", defaultPriority: "LOW", reason: "SIEM, vulnerability scanners, and penetration tools." },
    { skill: "Incident Response", stage: "stage-5", defaultPriority: "MEDIUM", reason: "Analyzing security breaches and threat mitigation." }
  ],
  "Cloud Engineer": [
    { skill: "Linux", stage: "stage-1", defaultPriority: "HIGH", reason: "Server operating system administration." },
    { skill: "Networking", stage: "stage-1", defaultPriority: "HIGH", reason: "VPCs, subnets, gateways, and load balancing." },
    { skill: "Cloud Fundamentals", stage: "stage-2", defaultPriority: "HIGH", reason: "Cloud architecture, IAM, storage, and compute instances." },
    { skill: "AWS", stage: "stage-3", defaultPriority: "MEDIUM", reason: "Amazon Web Services platform services." },
    { skill: "Azure", stage: "stage-3", defaultPriority: "LOW", reason: "Microsoft Azure cloud ecosystem." },
    { skill: "GCP", stage: "stage-3", defaultPriority: "LOW", reason: "Google Cloud Platform infrastructure." },
    { skill: "Containers", stage: "stage-4", defaultPriority: "HIGH", reason: "Docker containerization and orchestration concepts." },
    { skill: "Deployment", stage: "stage-5", defaultPriority: "MEDIUM", reason: "Automated cloud application deployment pipelines." }
  ],
  "DevOps Engineer": [
    { skill: "Linux", stage: "stage-1", defaultPriority: "HIGH", reason: "Linux system administration and shell scripting." },
    { skill: "Git", stage: "stage-1", defaultPriority: "HIGH", reason: "Branching strategies and source code control." },
    { skill: "Automation", stage: "stage-2", defaultPriority: "HIGH", reason: "Automating repetitive infrastructure operations." },
    { skill: "CI/CD", stage: "stage-2", defaultPriority: "HIGH", reason: "Continuous integration and automated build deployment pipelines." },
    { skill: "Docker", stage: "stage-3", defaultPriority: "HIGH", reason: "Containerizing microservices and environment parity." },
    { skill: "Cloud", stage: "stage-3", defaultPriority: "MEDIUM", reason: "Cloud provider infrastructure and virtual resources." },
    { skill: "Infrastructure", stage: "stage-4", defaultPriority: "MEDIUM", reason: "Infrastructure as Code (Terraform / Ansible)." },
    { skill: "Deployment", stage: "stage-5", defaultPriority: "MEDIUM", reason: "Production release management and monitoring." }
  ],
  "UI/UX Designer": [
    { skill: "UI Design Principles", stage: "stage-1", defaultPriority: "HIGH", reason: "Visual hierarchy, typography, color theory, and layout." },
    { skill: "UX Design Principles", stage: "stage-1", defaultPriority: "HIGH", reason: "User flow, information architecture, and usability." },
    { skill: "User Research", stage: "stage-2", defaultPriority: "HIGH", reason: "User interviews, personas, and usability testing." },
    { skill: "Wireframing", stage: "stage-2", defaultPriority: "MEDIUM", reason: "Low-fidelity structural layout sketches." },
    { skill: "Prototyping", stage: "stage-3", defaultPriority: "MEDIUM", reason: "Interactive high-fidelity screen transitions." },
    { skill: "Design Systems", stage: "stage-3", defaultPriority: "MEDIUM", reason: "Reusable component libraries and style guides." },
    { skill: "Figma", stage: "stage-4", defaultPriority: "HIGH", reason: "Industry-standard UI design and prototyping software." },
    { skill: "Design Portfolio", stage: "stage-5", defaultPriority: "MEDIUM", reason: "Case study documentation and UX portfolio presentation." }
  ]
};

const prereqMap = {
  "CSS": ["HTML"],
  "Responsive Design": ["CSS"],
  "JavaScript": ["HTML"],
  "React": ["JavaScript"],
  "APIs": ["JavaScript"],
  "Data Structures & Algorithms": ["Programming"],
  "Backend Development": ["Programming"],
  "Databases": ["Backend Development"],
  "SQL": ["Databases"],
  "Authentication": ["Backend Development"],
  "Pandas": ["Python"],
  "NumPy": ["Python"],
  "Statistics": ["Mathematics"],
  "Data Visualization": ["Pandas"],
  "Data Cleaning": ["Pandas"],
  "Machine Learning": ["Python", "Statistics"],
  "Deep Learning": ["Machine Learning"],
  "Model Deployment": ["Machine Learning"],
  "Docker": ["Linux"],
  "CI/CD": ["Git"],
  "Containers": ["Linux"],
  "Infrastructure": ["Cloud Fundamentals"],
  "Deployment": ["Containers"],
  "Cybersecurity Fundamentals": ["Networking"],
  "Cryptography": ["Cybersecurity Fundamentals"],
  "Security Tools": ["Cybersecurity Fundamentals"],
  "UX Design Principles": ["UI Design Principles"],
  "Wireframing": ["UI Design Principles"],
  "Prototyping": ["Wireframing"],
  "Design Systems": ["UI Design Principles"],
  "Figma": ["Prototyping"]
};

const effortMap = {
  "HTML": "3–5 hours",
  "CSS": "6–10 hours",
  "JavaScript": "10–20 hours",
  "Responsive Design": "6–10 hours",
  "React": "10–20 hours",
  "APIs": "6–10 hours",
  "Git": "3–5 hours",
  "GitHub": "3–5 hours",
  "Programming": "10–20 hours",
  "Data Structures & Algorithms": "20–30 hours",
  "Problem Solving": "10–20 hours",
  "Backend Fundamentals": "6–10 hours",
  "Backend Development": "10–20 hours",
  "Database Fundamentals": "6–10 hours",
  "Databases": "10–20 hours",
  "SQL": "6–10 hours",
  "Authentication": "6–10 hours",
  "Deployment": "6–10 hours",
  "Python": "10–20 hours",
  "Object-Oriented Programming": "6–10 hours",
  "Excel": "3–5 hours",
  "Statistics": "10–20 hours",
  "Data Visualization": "6–10 hours",
  "Pandas": "6–10 hours",
  "NumPy": "3–5 hours",
  "Data Cleaning": "6–10 hours",
  "Machine Learning": "20–30 hours",
  "Deep Learning": "20–30 hours",
  "Model Deployment": "10–20 hours",
  "Mathematics": "10–20 hours",
  "Networking": "10–20 hours",
  "Linux": "10–20 hours",
  "Cybersecurity Fundamentals": "10–20 hours",
  "Cryptography": "10–20 hours",
  "Security Tools": "10–20 hours",
  "Operating Systems": "10–20 hours",
  "Cloud Fundamentals": "6–10 hours",
  "AWS": "10–20 hours",
  "Azure": "10–20 hours",
  "GCP": "10–20 hours",
  "Containers": "6–10 hours",
  "CI/CD": "6–10 hours",
  "Docker": "10–20 hours",
  "Cloud": "10–20 hours",
  "Infrastructure": "10–20 hours",
  "Automation": "6–10 hours",
  "UI Design Principles": "6–10 hours",
  "UX Design Principles": "6–10 hours",
  "Wireframing": "3–5 hours",
  "Prototyping": "6–10 hours",
  "Design Systems": "6–10 hours",
  "Figma": "10–20 hours",
  "User Research": "6–10 hours"
};

const RoadmapService = {
  isDbConfigured() {
    return Boolean(config.TIDB_HOST && config.TIDB_HOST.trim() !== '');
  },

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
    return 'fp_profile_' + Math.abs(hash);
  },

  generateReadinessFingerprint(readiness) {
    if (!readiness) return '';
    const str = JSON.stringify({
      t: readiness.targetCareer,
      s: readiness.score,
      g: readiness.skillGaps,
      m: readiness.metSkills
    });
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return 'fp_readiness_' + Math.abs(hash);
  },

  normalizeSkill(skillStr) {
    if (!skillStr || typeof skillStr !== 'string') return '';
    const s = skillStr.trim().toLowerCase();

    if (s === 'git') return 'Git';
    if (s === 'github') return 'GitHub';
    if (s === 'html' || s === 'html5') return 'HTML';
    if (s === 'css' || s === 'css3') return 'CSS';
    if (s === 'javascript' || s === 'js') return 'JavaScript';
    if (s === 'react' || s === 'react.js' || s === 'reactjs') return 'React';
    if (s === 'python' || s === 'python 3') return 'Python';
    if (s === 'node.js' || s === 'nodejs' || s === 'express') return 'Backend Development';
    if (s === 'mysql' || s === 'postgres' || s === 'postgresql' || s === 'mongodb' || s === 'sql server' || s === 'database') return 'Databases';
    if (s === 'sql') return 'SQL';
    if (s === 'excel' || s === 'microsoft excel') return 'Excel';
    if (s === 'figma') return 'Figma';
    if (s === 'docker') return 'Docker';
    if (s === 'linux') return 'Linux';
    if (s === 'aws' || s === 'amazon web services') return 'AWS';
    if (s === 'azure') return 'Azure';
    if (s === 'gcp' || s === 'google cloud') return 'GCP';
    if (s === 'pandas') return 'Pandas';
    if (s === 'numpy') return 'NumPy';
    if (s === 'statistics') return 'Statistics';
    if (s === 'data structure' || s === 'data structures' || s === 'dsa') return 'Data Structures & Algorithms';
    if (s === 'problem solving') return 'Problem Solving';
    if (s === 'programming' || s === 'coding') return 'Programming';
    if (s === 'api' || s === 'apis' || s === 'rest api') return 'APIs';

    return skillStr.trim();
  },

  getPrerequisites(skillName) {
    return prereqMap[skillName] || [];
  },

  getEstimatedEffort(skillName) {
    return effortMap[skillName] || "6–10 hours";
  },

  getCareerSequence(targetCareer) {
    return careerSequences[targetCareer] || careerSequences["Software Engineer"];
  },

  getStageMeta(stageId, targetCareer) {
    const metaMap = {
      "stage-1": {
        title: "STAGE 1 — FOUNDATION",
        description: "Establish essential baseline concepts and core tools required for " + targetCareer + ".",
        milestone: "Master core syntax, foundational rules, and essential syntax."
      },
      "stage-2": {
        title: "STAGE 2 — CORE SKILLS",
        description: "Build fundamental domain competence and core working knowledge.",
        milestone: "Apply core principles confidently in practical application scenarios."
      },
      "stage-3": {
        title: "STAGE 3 — DEVELOPMENT DEPTH",
        description: "Expand into specialized workflows, frameworks, and system integration.",
        milestone: "Integrate multi-tier components into cohesive technical solutions."
      },
      "stage-4": {
        title: "STAGE 4 — ADVANCED / SPECIALIZATION",
        description: "Deepen expertise with advanced patterns, tools, and architecture concepts.",
        milestone: "Achieve fluency with advanced industry tools and architectural practices."
      },
      "stage-5": {
        title: "STAGE 5 — JOB PREPARATION FOUNDATION",
        description: "Synthesize acquired technical capabilities into practical portfolio readiness.",
        milestone: "Consolidate learning into career-ready technical problem solving."
      }
    };
    return metaMap[stageId] || {
      title: "STAGE — LEARNING PHASE",
      description: "Progressive learning module.",
      milestone: "Complete target learning objectives."
    };
  },

  generateRoadmap(profile, readiness, profileFp, readinessFp) {
    const targetCareer = readiness.targetCareer || (profile.careerGoal ? profile.careerGoal.targetCareer : "Software Engineer");
    const rawSkills = profile.skills || [];
    const normalizedUserSkills = rawSkills.map(s => this.normalizeSkill(s));

    const sequenceTemplate = this.getCareerSequence(targetCareer);

    const priorityMap = {};
    if (readiness.skillGaps && Array.isArray(readiness.skillGaps)) {
      readiness.skillGaps.forEach(gap => {
        if (gap.skill) {
          priorityMap[this.normalizeSkill(gap.skill)] = gap.priority;
        }
      });
    }

    const stagesMap = {
      "stage-1": [],
      "stage-2": [],
      "stage-3": [],
      "stage-4": [],
      "stage-5": []
    };

    let totalItems = 0;
    let completedItems = 0;
    let upcomingItems = 0;
    let highPriorityItems = 0;
    let totalMinHours = 0;
    let totalMaxHours = 0;

    const roadmapItemsList = [];

    sequenceTemplate.forEach((item, index) => {
      const normalizedItemSkill = this.normalizeSkill(item.skill);

      const isCompleted = normalizedUserSkills.includes(normalizedItemSkill);
      const status = isCompleted ? "COMPLETED" : "UPCOMING";

      const priority = priorityMap[normalizedItemSkill] || item.defaultPriority || "MEDIUM";

      if (status === "COMPLETED") {
        completedItems++;
      } else {
        upcomingItems++;
        if (priority === "HIGH") highPriorityItems++;
      }

      totalItems++;

      const prereqs = this.getPrerequisites(normalizedItemSkill);
      const effortStr = this.getEstimatedEffort(normalizedItemSkill);

      const effortParts = effortStr.match(/\d+/g);
      if (effortParts && effortParts.length >= 2) {
        totalMinHours += parseInt(effortParts[0], 10);
        totalMaxHours += parseInt(effortParts[1], 10);
      } else if (effortParts && effortParts.length === 1) {
        totalMinHours += parseInt(effortParts[0], 10);
        totalMaxHours += parseInt(effortParts[0], 10);
      }

      const itemObj = {
        id: "item-" + (index + 1),
        skill: item.skill,
        stage: item.stage,
        priority: priority,
        status: status,
        reason: item.reason,
        prerequisites: prereqs,
        estimatedEffort: effortStr,
        order: index + 1
      };

      roadmapItemsList.push(itemObj);

      const targetStageKey = item.stage || "stage-1";
      if (stagesMap[targetStageKey]) {
        stagesMap[targetStageKey].push(itemObj);
      } else {
        stagesMap["stage-1"].push(itemObj);
      }
    });

    const stages = ["stage-1", "stage-2", "stage-3", "stage-4", "stage-5"].map(stageId => {
      const meta = this.getStageMeta(stageId, targetCareer);
      return {
        id: stageId,
        title: meta.title,
        description: meta.description,
        milestone: meta.milestone,
        items: stagesMap[stageId] || []
      };
    }).filter(s => s.items.length > 0);

    const estimatedTotalEffort = totalMinHours + "–" + totalMaxHours + " hours";

    return {
      targetCareer: targetCareer,
      readinessScore: readiness.score || 0,
      status: readiness.status || "DEVELOPING",
      stages: stages,
      allItems: roadmapItemsList,
      totalItems: totalItems,
      completedItems: completedItems,
      upcomingItems: upcomingItems,
      highPriorityItems: highPriorityItems,
      estimatedTotalEffort: estimatedTotalEffort,
      generatedAt: new Date().toISOString(),
      profileFingerprint: profileFp,
      readinessFingerprint: readinessFp
    };
  },

  async getRoadmap(userId) {
    if (!userId) throw new Error('User ID is required');

    const profile = await ProfileService.getProfile(userId);
    if (!profile) {
      return { incompleteProfile: true };
    }

    const personal = profile.personal || {};
    const skills = Array.isArray(profile.skills) ? profile.skills : [];
    const education = profile.education || {};

    const hasBasicInfo = Boolean((personal.location && personal.location.trim()) || (skills.length > 0) || (education.college && education.college.trim()));
    const hasTargetCareer = Boolean(profile.careerGoal && profile.careerGoal.targetCareer && profile.careerGoal.targetCareer.trim());

    if (!hasTargetCareer) {
      if (hasBasicInfo) {
        return { missingTargetCareer: true };
      }
      return { incompleteProfile: true };
    }

    if (profile.completed !== true) {
      return { incompleteProfile: true };
    }

    const readiness = await ReadinessService.getReadiness(userId);
    if (readiness.incompleteProfile || readiness.missingTargetCareer) {
      return readiness;
    }

    const profileFp = this.generateProfileFingerprint(profile);
    const readinessFp = this.generateReadinessFingerprint(readiness);

    if (this.isDbConfigured()) {
      const [instances] = await pool.query(
        `SELECT id, target_career, readiness_score, status, total_items, completed_items, upcoming_items,
                high_priority_items, estimated_total_effort, profile_fingerprint, readiness_fingerprint, generated_at
         FROM roadmap_instances
         WHERE user_id = ?
         ORDER BY generated_at DESC LIMIT 1`,
        [userId]
      );

      if (instances.length > 0 &&
          instances[0].profile_fingerprint === profileFp &&
          instances[0].readiness_fingerprint === readinessFp) {
        const inst = instances[0];

        const [items] = await pool.query(
          `SELECT id, skill, stage, priority, status, reason, prerequisites, estimated_effort, item_order
           FROM roadmap_items
           WHERE roadmap_id = ?
           ORDER BY item_order ASC`,
          [inst.id]
        );

        const allItems = items.map((item, idx) => ({
          id: `item-${idx + 1}`,
          skill: item.skill,
          stage: item.stage,
          priority: item.priority,
          status: item.status,
          reason: item.reason,
          prerequisites: typeof item.prerequisites === 'string' ? JSON.parse(item.prerequisites) : (item.prerequisites || []),
          estimatedEffort: item.estimated_effort,
          order: item.item_order
        }));

        const stagesMap = {
          "stage-1": [], "stage-2": [], "stage-3": [], "stage-4": [], "stage-5": []
        };
        allItems.forEach(item => {
          const stg = item.stage || "stage-1";
          if (stagesMap[stg]) stagesMap[stg].push(item);
          else stagesMap["stage-1"].push(item);
        });

        const stages = ["stage-1", "stage-2", "stage-3", "stage-4", "stage-5"].map(stageId => {
          const meta = this.getStageMeta(stageId, inst.target_career);
          return {
            id: stageId,
            title: meta.title,
            description: meta.description,
            milestone: meta.milestone,
            items: stagesMap[stageId] || []
          };
        }).filter(s => s.items.length > 0);

        return {
          targetCareer: inst.target_career,
          readinessScore: Number(inst.readiness_score),
          status: inst.status,
          stages: stages,
          allItems: allItems,
          totalItems: Number(inst.total_items),
          completedItems: Number(inst.completed_items),
          upcomingItems: Number(inst.upcoming_items),
          highPriorityItems: Number(inst.high_priority_items),
          estimatedTotalEffort: inst.estimated_total_effort,
          generatedAt: inst.generated_at ? new Date(inst.generated_at).toISOString() : new Date().toISOString(),
          profileFingerprint: inst.profile_fingerprint,
          readinessFingerprint: inst.readiness_fingerprint
        };
      }

      // Generate new roadmap & persist in a database transaction
      const generated = this.generateRoadmap(profile, readiness, profileFp, readinessFp);

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        const [insertInst] = await connection.query(
          `INSERT INTO roadmap_instances (
            user_id, target_career, readiness_score, status, total_items, completed_items,
            upcoming_items, high_priority_items, estimated_total_effort, profile_fingerprint,
            readiness_fingerprint, generated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            userId,
            generated.targetCareer,
            generated.readinessScore,
            generated.status,
            generated.totalItems,
            generated.completedItems,
            generated.upcomingItems,
            generated.highPriorityItems,
            generated.estimatedTotalEffort,
            profileFp,
            readinessFp
          ]
        );

        const roadmapId = insertInst.insertId;

        for (const item of generated.allItems) {
          await connection.query(
            `INSERT INTO roadmap_items (
              roadmap_id, skill, stage, priority, status, reason, prerequisites, estimated_effort, item_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              roadmapId,
              item.skill,
              item.stage,
              item.priority,
              item.status,
              item.reason,
              JSON.stringify(item.prerequisites || []),
              item.estimatedEffort,
              item.order
            ]
          );
        }

        await connection.commit();
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }

      return generated;
    }

    // In-memory fallback
    const cached = mockRoadmaps.get(Number(userId));
    if (cached && cached.profileFingerprint === profileFp && cached.readinessFingerprint === readinessFp) {
      return cached;
    }

    const calculated = this.generateRoadmap(profile, readiness, profileFp, readinessFp);
    mockRoadmaps.set(Number(userId), calculated);
    return calculated;
  }
};

module.exports = RoadmapService;
