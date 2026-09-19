const pool = require('../config/db');
const config = require('../config/env');
const ProfileService = require('./profile.service');

// In-memory fallback assessment store for local dev/testing
const mockAssessments = new Map();

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

const AssessmentService = {
  isDbConfigured() {
    return Boolean(config.TIDB_HOST && config.TIDB_HOST.trim() !== '');
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
   * Deterministic Phase 3 Assessment Generator
   */
  generateAssessment(profile, fingerprint) {
    const targetCareer = (profile.careerGoal && profile.careerGoal.targetCareer) ? profile.careerGoal.targetCareer.trim() : 'Software Engineer';
    const expLevel = (profile.careerGoal && profile.careerGoal.experienceLevel) ? profile.careerGoal.experienceLevel.trim() : 'Beginner';
    const userSkills = Array.isArray(profile.skills) ? profile.skills : [];
    const userInterests = Array.isArray(profile.interests) ? profile.interests : [];
    const degree = (profile.education && profile.education.degree) ? profile.education.degree.trim() : '';
    const goalText = (profile.careerGoal && profile.careerGoal.goal) ? profile.careerGoal.goal.trim() : '';

    const domainRequirements = requirementMap[targetCareer] || defaultRequirements;

    // 1. Current Skills
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

    // 4. Qualitative Career Alignment
    let score = 0;
    score += Math.min(userSkills.length * 15, 45);
    if (["B.Tech", "B.E.", "BCA", "MCA", "M.Tech"].includes(degree)) score += 20;
    if (userInterests.length > 0) score += 15;
    if (expLevel === 'Intermediate' || expLevel === 'Advanced') score += 15;

    let confidenceLevel = "MODERATE";
    if (score >= 65) {
      confidenceLevel = "HIGH";
    } else if (score < 35) {
      confidenceLevel = "LOW";
    }

    // 5. Career Direction
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
      careerAdvice = `As an ${expLevel} practitioner targeting ${targetCareer}, bridge your skill gaps by building multi-tier application architectures and deploying live production applications to gain industry readiness.`;
    } else {
      careerAdvice = `With ${expLevel} experience targeting ${targetCareer}, focus on high-impact specialization, advanced system optimization, open-source contributions, and demonstrating domain mastery through complex projects.`;
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
   * Fetch assessment with fingerprint caching and database persistence
   */
  async getAssessment(userId) {
    if (!userId) throw new Error('User ID is required');

    const profile = await ProfileService.getProfile(userId);
    if (!profile || profile.completed !== true) {
      return { incompleteProfile: true };
    }

    const fingerprint = this.generateProfileFingerprint(profile);

    if (this.isDbConfigured()) {
      // Check latest persisted assessment
      const [rows] = await pool.query(
        `SELECT career_direction, profile_summary, strengths, current_skills, focus_areas,
                career_advice, confidence_level, profile_fingerprint, generated_at
         FROM assessment_reports
         WHERE user_id = ?
         ORDER BY generated_at DESC LIMIT 1`,
        [userId]
      );

      if (rows.length > 0 && rows[0].profile_fingerprint === fingerprint) {
        const stored = rows[0];
        return {
          careerDirection: stored.career_direction,
          profileSummary: stored.profile_summary,
          strengths: typeof stored.strengths === 'string' ? JSON.parse(stored.strengths) : (stored.strengths || []),
          currentSkills: typeof stored.current_skills === 'string' ? JSON.parse(stored.current_skills) : (stored.current_skills || []),
          focusAreas: typeof stored.focus_areas === 'string' ? JSON.parse(stored.focus_areas) : (stored.focus_areas || []),
          careerAdvice: stored.career_advice,
          confidenceLevel: stored.confidence_level,
          generatedAt: stored.generated_at ? new Date(stored.generated_at).toISOString() : new Date().toISOString(),
          profileFingerprint: stored.profile_fingerprint
        };
      }

      // Generate new assessment & persist
      const newAssessment = this.generateAssessment(profile, fingerprint);

      await pool.query(
        `INSERT INTO assessment_reports (
          user_id, career_direction, profile_summary, strengths, current_skills,
          focus_areas, career_advice, confidence_level, profile_fingerprint, generated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          userId,
          newAssessment.careerDirection,
          newAssessment.profileSummary,
          JSON.stringify(newAssessment.strengths),
          JSON.stringify(newAssessment.currentSkills),
          JSON.stringify(newAssessment.focusAreas),
          newAssessment.careerAdvice,
          newAssessment.confidenceLevel,
          fingerprint
        ]
      );

      return newAssessment;
    }

    // In-memory fallback
    const cached = mockAssessments.get(Number(userId));
    if (cached && cached.profileFingerprint === fingerprint) {
      return cached;
    }

    const generated = this.generateAssessment(profile, fingerprint);
    mockAssessments.set(Number(userId), generated);
    return generated;
  }
};

module.exports = AssessmentService;
