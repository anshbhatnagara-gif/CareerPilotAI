const pool = require('../config/db');
const config = require('../config/env');
const ProfileService = require('./profile.service');
const ReadinessService = require('./readiness.service');
const RoadmapService = require('./roadmap.service');
const { careerProjectCatalog } = require('../../scripts/seed-project-catalog');

// In-memory fallback project tracker store for local testing
// Key: `${userId}_${projectKey}` -> { status, startedAt, completedAt }
const mockUserProjects = new Map();

const ProjectsService = {
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

  generateRoadmapFingerprint(roadmap) {
    if (!roadmap) return '';
    const str = JSON.stringify({
      t: roadmap.targetCareer,
      s: roadmap.readinessScore,
      c: roadmap.completedItems,
      u: roadmap.upcomingItems
    });
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return 'fp_roadmap_' + Math.abs(hash);
  },

  async getRawCatalogForCareer(targetCareer) {
    if (this.isDbConfigured()) {
      const [rows] = await pool.query(
        `SELECT id, project_key, target_career, title, difficulty, description,
                required_skills, recommended_skills, priority, why_this_project,
                milestones, estimated_effort
         FROM project_catalog
         WHERE target_career = ?
         ORDER BY id ASC`,
        [targetCareer]
      );

      if (rows.length > 0) {
        return rows.map(r => ({
          dbId: r.id,
          id: r.project_key,
          title: r.title,
          difficulty: r.difficulty,
          description: r.description,
          requiredSkills: typeof r.required_skills === 'string' ? JSON.parse(r.required_skills) : (r.required_skills || []),
          skillsCovered: typeof r.recommended_skills === 'string' ? JSON.parse(r.recommended_skills) : (r.recommended_skills || []),
          priority: r.priority,
          whyThisProject: r.why_this_project,
          milestones: typeof r.milestones === 'string' ? JSON.parse(r.milestones) : (r.milestones || []),
          estimatedEffort: r.estimated_effort
        }));
      }
    }

    // Fallback catalog
    const fallbackList = careerProjectCatalog[targetCareer] || careerProjectCatalog["Software Engineer"];
    return fallbackList.map((p, idx) => ({
      dbId: idx + 1,
      id: p.id,
      title: p.title,
      difficulty: p.difficulty,
      description: p.description,
      objective: p.objective,
      requiredSkills: p.requiredSkills || [],
      skillsCovered: p.skillsCovered || [],
      priority: p.priority || 'MEDIUM',
      whyThisProject: p.whyThisProject || '',
      milestones: p.milestones || [],
      estimatedEffort: p.estimatedEffort || '6–10 hours',
      techStack: p.techStack || []
    }));
  },

  async getProjects(userId) {
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

    const roadmap = await RoadmapService.getRoadmap(userId);

    const profileFp = this.generateProfileFingerprint(profile);
    const readinessFp = this.generateReadinessFingerprint(readiness);
    const roadmapFp = this.generateRoadmapFingerprint(roadmap);

    const targetCareer = readiness.targetCareer || profile.careerGoal.targetCareer.trim();

    const rawCatalog = await this.getRawCatalogForCareer(targetCareer);

    // Skill gaps from readiness & roadmap
    const missingSkills = (readiness.missingSkills || []).map(s => s.toLowerCase());
    const upcomingSkills = [];
    if (roadmap && roadmap.allItems && Array.isArray(roadmap.allItems)) {
      roadmap.allItems.forEach(item => {
        if (item.status === 'UPCOMING' && item.skill) {
          upcomingSkills.push(item.skill.toLowerCase());
        }
      });
    }
    const gapSkills = new Set([...missingSkills, ...upcomingSkills]);

    // Load user project statuses
    const userStatusMap = {};
    if (this.isDbConfigured()) {
      const [userProjRows] = await pool.query(
        `SELECT pc.project_key, up.status, up.started_at, up.completed_at
         FROM user_projects up
         JOIN project_catalog pc ON up.project_id = pc.id
         WHERE up.user_id = ?`,
        [userId]
      );
      userProjRows.forEach(r => {
        userStatusMap[r.project_key] = {
          status: r.status,
          startedAt: r.started_at ? new Date(r.started_at).toISOString() : null,
          completedAt: r.completed_at ? new Date(r.completed_at).toISOString() : null
        };
      });
    } else {
      rawCatalog.forEach(p => {
        const key = `${userId}_${p.id}`;
        if (mockUserProjects.has(key)) {
          userStatusMap[p.id] = mockUserProjects.get(key);
        }
      });
    }

    let completedCount = 0;
    let inProgressCount = 0;
    let notStartedCount = 0;
    let highPriorityCount = 0;

    const projectsList = rawCatalog.map((proj, idx) => {
      const coveredMatches = (proj.skillsCovered || []).filter(skill =>
        gapSkills.has(skill.toLowerCase())
      );

      let whyText = "";
      if (coveredMatches.length > 0) {
        whyText = "This project is recommended because it strengthens " +
          coveredMatches.join(", ") + " identified as key upcoming focus areas in your " + targetCareer + " roadmap.";
      } else {
        whyText = "This project establishes foundational practical proof for core " +
          targetCareer + " competencies.";
      }

      let priority = proj.priority || "MEDIUM";
      if (coveredMatches.length >= 2 && proj.difficulty !== "ADVANCED") {
        priority = "HIGH";
      }

      const trackerState = userStatusMap[proj.id] || { status: "NOT_STARTED", startedAt: null, completedAt: null };
      const status = trackerState.status;

      if (status === "COMPLETED") completedCount++;
      else if (status === "IN_PROGRESS") inProgressCount++;
      else notStartedCount++;

      if (priority === "HIGH") highPriorityCount++;

      return {
        id: proj.id,
        dbId: proj.dbId,
        title: proj.title,
        career: targetCareer,
        difficulty: proj.difficulty,
        priority: priority,
        description: proj.description || '',
        objective: proj.objective || 'Demonstrate practical skill proficiency.',
        skillsCovered: proj.skillsCovered || [],
        requiredSkills: proj.requiredSkills || [],
        techStack: proj.techStack || [],
        estimatedEffort: proj.estimatedEffort || "6–10 hours",
        whyThisProject: whyText,
        milestones: proj.milestones || [],
        order: idx + 1,
        status: status,
        startedAt: trackerState.startedAt,
        completedAt: trackerState.completedAt
      };
    });

    return {
      targetCareer: targetCareer,
      readinessScore: readiness.score || 0,
      projects: projectsList,
      totalProjects: projectsList.length,
      completedProjects: completedCount,
      inProgressProjects: inProgressCount,
      notStartedProjects: notStartedCount,
      highPriorityProjects: highPriorityCount,
      generatedAt: new Date().toISOString(),
      profileFingerprint: profileFp,
      readinessFingerprint: readinessFp,
      roadmapFingerprint: roadmapFp
    };
  },

  async updateProjectStatus(userId, projectKeyOrId, newStatus) {
    if (!userId) throw new Error('User ID is required');

    const validStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error('INVALID_STATUS');
    }

    if (this.isDbConfigured()) {
      // Find project in catalog by project_key or numeric id
      const [catRows] = await pool.query(
        `SELECT id, project_key FROM project_catalog WHERE project_key = ? OR id = ? LIMIT 1`,
        [projectKeyOrId, projectKeyOrId]
      );

      if (catRows.length === 0) {
        throw new Error('PROJECT_NOT_FOUND');
      }

      const catalogId = catRows[0].id;
      const projectKey = catRows[0].project_key;

      const [existingUserProj] = await pool.query(
        `SELECT id, status, started_at, completed_at FROM user_projects WHERE user_id = ? AND project_id = ?`,
        [userId, catalogId]
      );

      let startedAt = null;
      let completedAt = null;

      if (existingUserProj.length > 0) {
        startedAt = existingUserProj[0].started_at;
        completedAt = existingUserProj[0].completed_at;
      }

      if (newStatus === 'IN_PROGRESS') {
        if (!startedAt) startedAt = new Date();
        completedAt = null;
      } else if (newStatus === 'COMPLETED') {
        if (!startedAt) startedAt = new Date();
        completedAt = new Date();
      } else if (newStatus === 'NOT_STARTED') {
        startedAt = null;
        completedAt = null;
      }

      await pool.query(
        `INSERT INTO user_projects (user_id, project_id, status, started_at, completed_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
           status = VALUES(status),
           started_at = VALUES(started_at),
           completed_at = VALUES(completed_at),
           updated_at = NOW()`,
        [userId, catalogId, newStatus, startedAt, completedAt]
      );

      return this.getProjects(userId);
    }

    // In-memory fallback
    const key = `${userId}_${projectKeyOrId}`;
    let tracker = mockUserProjects.get(key) || { status: 'NOT_STARTED', startedAt: null, completedAt: null };

    if (newStatus === 'IN_PROGRESS') {
      if (!tracker.startedAt) tracker.startedAt = new Date().toISOString();
      tracker.completedAt = null;
    } else if (newStatus === 'COMPLETED') {
      if (!tracker.startedAt) tracker.startedAt = new Date().toISOString();
      tracker.completedAt = new Date().toISOString();
    } else if (newStatus === 'NOT_STARTED') {
      tracker.startedAt = null;
      tracker.completedAt = null;
    }

    tracker.status = newStatus;
    mockUserProjects.set(key, tracker);

    return this.getProjects(userId);
  }
};

module.exports = ProjectsService;
