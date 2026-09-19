const pool = require('../config/db');
const config = require('../config/env');
const AuthService = require('./auth.service');
const ProfileService = require('./profile.service');
const ReadinessService = require('./readiness.service');
const RoadmapService = require('./roadmap.service');
const ProjectsService = require('./projects.service');
const InterviewService = require('./interview.service');

// In-memory fallback store for local testing
// Key: userId -> Array of evidence objects
const mockPortfolioEvidence = new Map();

const isValidUrl = (urlStr) => {
  if (!urlStr || typeof urlStr !== 'string' || urlStr.trim() === '') return true; // optional field
  const trimmed = urlStr.trim();
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
};

const CareerToolsService = {
  isDbConfigured() {
    return Boolean(config.TIDB_HOST && config.TIDB_HOST.trim() !== '');
  },

  async getEvidence(userId) {
    if (this.isDbConfigured()) {
      const [rows] = await pool.query(
        `SELECT id, user_id, project_title, github_repo_url, live_demo_url,
                project_description, architecture_notes, tech_stack, proof_status,
                created_at, updated_at
         FROM portfolio_evidence
         WHERE user_id = ?
         ORDER BY id ASC`,
        [userId]
      );

      return rows.map(r => ({
        id: r.id,
        userId: r.user_id,
        projectTitle: r.project_title,
        githubRepoUrl: r.github_repo_url,
        liveDemoUrl: r.live_demo_url,
        projectDescription: r.project_description,
        architectureNotes: r.architecture_notes,
        techStack: r.tech_stack,
        proofStatus: r.proof_status || 'MANUAL_ENTRY',
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }));
    }

    const list = mockPortfolioEvidence.get(Number(userId)) || [];
    return list.map(item => ({ ...item }));
  },

  async saveEvidence(userId, payload) {
    // Payload can be a single evidence item or an array of evidence items
    const items = Array.isArray(payload) ? payload : [payload];

    if (items.length === 0) {
      throw new Error('Evidence data is required.');
    }

    const validatedItems = [];

    for (const item of items) {
      const projectTitle = (item.projectTitle || item.title || '').trim();
      const githubRepoUrl = (item.githubRepoUrl || item.githubUrl || '').trim();
      const liveDemoUrl = (item.liveDemoUrl || item.liveUrl || '').trim();
      const projectDescription = (item.projectDescription || item.description || '').trim();
      const architectureNotes = (item.architectureNotes || item.notes || '').trim();
      const techStack = (item.techStack || '').trim();
      const proofStatus = (item.proofStatus || 'MANUAL_ENTRY').trim();

      if (!projectTitle) {
        throw new Error('Project title is required for portfolio evidence.');
      }

      if (projectTitle.length > 200) {
        throw new Error('Project title cannot exceed 200 characters.');
      }

      if (!isValidUrl(githubRepoUrl)) {
        throw new Error('Malformed GitHub repository URL. Must start with http:// or https://');
      }

      if (!isValidUrl(liveDemoUrl)) {
        throw new Error('Malformed live demo URL. Must start with http:// or https://');
      }

      validatedItems.push({
        id: item.id || null,
        projectTitle,
        githubRepoUrl,
        liveDemoUrl,
        projectDescription,
        architectureNotes,
        techStack,
        proofStatus
      });
    }

    if (this.isDbConfigured()) {
      const savedList = [];
      for (const item of validatedItems) {
        if (item.id) {
          await pool.query(
            `UPDATE portfolio_evidence
             SET project_title = ?, github_repo_url = ?, live_demo_url = ?,
                 project_description = ?, architecture_notes = ?, tech_stack = ?,
                 proof_status = ?
             WHERE id = ? AND user_id = ?`,
            [
              item.projectTitle,
              item.githubRepoUrl,
              item.liveDemoUrl,
              item.projectDescription,
              item.architectureNotes,
              item.techStack,
              item.proofStatus,
              item.id,
              userId
            ]
          );
          savedList.push({ ...item, userId });
        } else {
          const [result] = await pool.query(
            `INSERT INTO portfolio_evidence
              (user_id, project_title, github_repo_url, live_demo_url, project_description, architecture_notes, tech_stack, proof_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              userId,
              item.projectTitle,
              item.githubRepoUrl,
              item.liveDemoUrl,
              item.projectDescription,
              item.architectureNotes,
              item.techStack,
              item.proofStatus
            ]
          );
          savedList.push({ ...item, id: result.insertId, userId });
        }
      }
      return savedList;
    }

    // In-memory fallback
    const existing = mockPortfolioEvidence.get(Number(userId)) || [];
    const updatedList = [...existing];

    for (const item of validatedItems) {
      if (item.id) {
        const idx = updatedList.findIndex(e => e.id === Number(item.id));
        if (idx !== -1) {
          updatedList[idx] = {
            ...updatedList[idx],
            ...item,
            userId: Number(userId),
            updatedAt: new Date().toISOString()
          };
        } else {
          const newItem = {
            ...item,
            id: Date.now() + Math.floor(Math.random() * 1000),
            userId: Number(userId),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          updatedList.push(newItem);
        }
      } else {
        const newItem = {
          ...item,
          id: Date.now() + Math.floor(Math.random() * 1000),
          userId: Number(userId),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        updatedList.push(newItem);
      }
    }

    mockPortfolioEvidence.set(Number(userId), updatedList);
    return updatedList;
  },

  async getPassport(userId) {
    const user = await AuthService.findUserById(userId);
    const profile = await ProfileService.getProfile(userId);
    const readiness = await ReadinessService.getReadiness(userId);
    const roadmap = await RoadmapService.getRoadmap(userId);
    const projects = await ProjectsService.getProjects(userId);
    const history = await InterviewService.getHistory(userId);
    const evidenceList = await this.getEvidence(userId);

    const latestInterview = history && history.length > 0 ? history[0] : null;

    return {
      user: {
        id: user ? user.id : userId,
        fullName: user ? user.full_name : 'Candidate',
        email: user ? user.email : ''
      },
      profile: {
        targetCareer: (profile && profile.careerGoal && profile.careerGoal.targetCareer) || (readiness && readiness.targetCareer) || 'Software Engineer',
        degree: (profile && profile.education && profile.education.degree) || 'Computer Science',
        experienceLevel: (profile && profile.careerGoal && profile.careerGoal.experienceLevel) || 'Entry Level',
        skills: (profile && profile.skills) || []
      },
      readiness: {
        score: readiness ? readiness.score : 0,
        status: readiness ? readiness.status : 'PENDING',
        metSkills: readiness ? readiness.metSkills : [],
        missingSkills: readiness ? readiness.missingSkills : []
      },
      roadmap: {
        status: roadmap ? roadmap.status : 'NOT_STARTED',
        completedItems: roadmap ? roadmap.completedItems : 0,
        totalItems: roadmap ? roadmap.totalItems : 0
      },
      projects: {
        completedProjects: projects ? projects.completedProjects : 0,
        totalProjects: projects ? projects.totalProjects : 0
      },
      latestInterview: latestInterview ? {
        sessionId: latestInterview.sessionId,
        mode: latestInterview.mode,
        targetCareer: latestInterview.targetCareer,
        overallScore: latestInterview.overallScore,
        technicalScore: latestInterview.technicalScore,
        problemSolvingScore: latestInterview.problemSolvingScore,
        communicationScore: latestInterview.communicationScore,
        projectKnowledgeScore: latestInterview.projectKnowledgeScore,
        completedAt: latestInterview.completedAt
      } : null,
      portfolioEvidence: evidenceList
    };
  }
};

module.exports = CareerToolsService;
