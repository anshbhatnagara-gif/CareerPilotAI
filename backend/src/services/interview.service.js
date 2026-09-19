const pool = require('../config/db');
const config = require('../config/env');
const ProfileService = require('./profile.service');
const ReadinessService = require('./readiness.service');
const RoadmapService = require('./roadmap.service');
const ProjectsService = require('./projects.service');
const { careerQuestionCatalog } = require('../../scripts/seed-interview-questions');

// In-memory fallback stores for testing when TiDB Cloud is unconfigured
const mockInterviewSessions = new Map(); // sessionId -> session object
const mockInterviewResponses = new Map(); // sessionId -> array of response objects
let nextMockSessionId = 1;

const InterviewService = {
  isDbConfigured() {
    return Boolean(config.TIDB_HOST && config.TIDB_HOST.trim() !== '');
  },

  normalizeTargetCareer(target) {
    if (!target) return "Software Engineer";
    const lower = target.toLowerCase();
    if (lower.includes("frontend") || lower.includes("front-end")) return "Frontend Developer";
    if (lower.includes("backend") || lower.includes("back-end")) return "Backend Developer";
    if (lower.includes("full stack") || lower.includes("fullstack")) return "Full Stack Developer";
    if (lower.includes("python")) return "Python Developer";
    if (lower.includes("data analyst")) return "Data Analyst";
    if (lower.includes("data scientist")) return "Data Scientist";
    if (lower.includes("ai") || lower.includes("ml") || lower.includes("machine learning")) return "AI/ML Engineer";
    if (lower.includes("cyber") || lower.includes("security")) return "Cybersecurity Engineer";
    if (lower.includes("cloud")) return "Cloud Engineer";
    if (lower.includes("devops") || lower.includes("site reliability") || lower.includes("sre")) return "DevOps Engineer";
    if (lower.includes("ui") || lower.includes("ux") || lower.includes("designer")) return "UI/UX Designer";
    return "Software Engineer";
  },

  async getCareerQuestions(targetCareer) {
    const normalizedTarget = this.normalizeTargetCareer(targetCareer);

    if (this.isDbConfigured()) {
      const [rows] = await pool.query(
        `SELECT id, question_key, target_career, category, difficulty, question_text, expected_topics, is_project_question
         FROM interview_questions
         WHERE target_career = ?
         ORDER BY id ASC`,
        [normalizedTarget]
      );

      if (rows.length > 0) {
        return rows.map(r => {
          let parsedTopics = {};
          try {
            parsedTopics = typeof r.expected_topics === 'string' ? JSON.parse(r.expected_topics) : (r.expected_topics || {});
          } catch (e) {
            parsedTopics = {};
          }
          return {
            dbId: r.id,
            id: r.question_key,
            title: r.question_text.split('\n')[0] || r.question_key,
            difficulty: r.difficulty,
            category: r.category,
            isProjectQuestion: Boolean(r.is_project_question),
            scenario: r.question_text,
            hint: parsedTopics.hint || "",
            keywords: parsedTopics.keywords || [],
            tradeoffConcepts: parsedTopics.tradeoffConcepts || [],
            idealApproach: parsedTopics.idealApproach || "",
            sampleAnswer: parsedTopics.sampleAnswer || ""
          };
        });
      }
    }

    // Fallback catalog
    const list = careerQuestionCatalog[normalizedTarget] || careerQuestionCatalog["Software Engineer"];
    return list.map((q, idx) => ({
      dbId: idx + 1,
      id: q.id,
      title: q.title,
      difficulty: q.difficulty,
      category: q.category,
      isProjectQuestion: Boolean(q.isProjectQuestion),
      scenario: q.scenario,
      hint: q.hint || "",
      keywords: q.keywords || [],
      tradeoffConcepts: q.tradeoffConcepts || [],
      idealApproach: q.idealApproach || "",
      sampleAnswer: q.sampleAnswer || ""
    }));
  },

  async getQuestions(userId, mode = 'QUICK') {
    const validModes = ['QUICK', 'STANDARD', 'DEEP'];
    if (!validModes.includes(mode)) {
      throw new Error('Invalid interview mode. Must be QUICK, STANDARD, or DEEP.');
    }

    const profile = await ProfileService.getProfile(userId);
    const targetCareer = (profile && profile.careerGoal && profile.careerGoal.targetCareer)
      ? profile.careerGoal.targetCareer
      : 'Software Engineer';

    const fullBank = await this.getCareerQuestions(targetCareer);

    let limit = 5;
    if (mode === 'STANDARD') limit = 10;
    else if (mode === 'DEEP') limit = 15;

    const questions = fullBank.slice(0, Math.min(limit, fullBank.length));

    // Return sanitized frontend-compatible question objects
    return {
      mode,
      targetCareer,
      questionCount: questions.length,
      questions: questions.map(q => ({
        id: q.id,
        dbId: q.dbId,
        title: q.title,
        difficulty: q.difficulty,
        category: q.category,
        isProjectQuestion: q.isProjectQuestion,
        scenario: q.scenario,
        hint: q.hint,
        sampleAnswer: q.sampleAnswer
      }))
    };
  },

  calculateEvaluation(text, question) {
    const lowerText = text.toLowerCase();
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // 1. Technical Depth Score (0-100)
    const keywords = question.keywords || [];
    let matchedKeywords = 0;
    const matchedList = [];
    const missingList = [];

    keywords.forEach(kw => {
      if (lowerText.includes(kw.toLowerCase())) {
        matchedKeywords++;
        matchedList.push(kw);
      } else {
        missingList.push(kw);
      }
    });

    const keywordRatio = keywords.length > 0 ? (matchedKeywords / keywords.length) : 0.75;
    let technicalScore = Math.round(keywordRatio * 75 + (wordCount >= 60 ? 25 : (wordCount / 60) * 25));
    technicalScore = Math.max(30, Math.min(100, technicalScore));

    // 2. Communication Clarity Score (0-100)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const hasParagraphs = text.includes('\n');
    let communicationScore = 50;

    if (wordCount >= 40) communicationScore += 20;
    if (wordCount >= 90) communicationScore += 15;
    if (sentences.length >= 3) communicationScore += 10;
    if (hasParagraphs) communicationScore += 5;
    communicationScore = Math.max(35, Math.min(100, communicationScore));

    // 3. Problem Solving Score (0-100)
    const problemSolvingKeywords = [
      "tradeoff", "trade-off", "performance", "scale", "latency", "memory", "complexity",
      "edge case", "alternative", "optimize", "handling", "mitigate", "bottleneck", "security", "algorithm"
    ];
    let matchedProbTerms = 0;
    problemSolvingKeywords.forEach(term => {
      if (lowerText.includes(term)) matchedProbTerms++;
    });

    let problemSolvingScore = 40 + (matchedProbTerms * 12);
    if (wordCount >= 80) problemSolvingScore += 10;
    problemSolvingScore = Math.max(30, Math.min(100, problemSolvingScore));

    // 4. Project Knowledge Score (0-100)
    const projectKeywords = [
      "architecture", "implemented", "deployed", "stack", "testing", "portfolio", "framework",
      "docker", "github", "pipeline", "database", "api", "client", "server", "workflow"
    ];
    let matchedProjTerms = 0;
    projectKeywords.forEach(term => {
      if (lowerText.includes(term)) matchedProjTerms++;
    });

    let projectKnowledgeScore = 35 + (matchedProjTerms * 12);
    if (question.isProjectQuestion) projectKnowledgeScore += 15;
    projectKnowledgeScore = Math.max(30, Math.min(100, projectKnowledgeScore));

    const overallScore = Math.round(
      technicalScore * 0.35 +
      problemSolvingScore * 0.30 +
      communicationScore * 0.15 +
      projectKnowledgeScore * 0.20
    );

    const strengths = [];
    const weaknesses = [];

    if (technicalScore >= 75) strengths.push("Strong technical terminology & keyword precision");
    else weaknesses.push("Incorporate deeper domain terms");

    if (communicationScore >= 75) strengths.push("Clear, structured explanation with good flow");
    else weaknesses.push("Format answer into distinct, well-structured paragraphs");

    if (problemSolvingScore >= 75) strengths.push("Evaluates trade-offs, complexity, and performance factors");
    else weaknesses.push("Discuss performance trade-offs and edge-case handling explicitly");

    if (projectKnowledgeScore >= 75) strengths.push("Demonstrates practical architectural & implementation knowledge");
    else weaknesses.push("Elaborate on hands-on project choices and implementation tools");

    if (strengths.length === 0) strengths.push("Established baseline technical concept understanding");
    if (weaknesses.length === 0) weaknesses.push("Quantify real-world benchmark metrics and latency constraints");

    return {
      technicalScore,
      communicationScore,
      problemSolvingScore,
      projectKnowledgeScore,
      overallScore,
      strengths,
      weaknesses
    };
  },

  async evaluateSession(userId, payload) {
    const { mode, targetCareer, answers } = payload || {};

    const validModes = ['QUICK', 'STANDARD', 'DEEP'];
    if (!mode || !validModes.includes(mode)) {
      throw new Error('Invalid interview mode. Must be QUICK, STANDARD, or DEEP.');
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      throw new Error('Answers array is required and cannot be empty.');
    }

    // Duplicate question ID validation
    const questionIdSet = new Set();
    for (const ans of answers) {
      if (!ans.questionId) {
        throw new Error('Each answer must contain a valid questionId.');
      }
      if (questionIdSet.has(ans.questionId)) {
        throw new Error(`Duplicate question ID detected: ${ans.questionId}`);
      }
      questionIdSet.add(ans.questionId);
    }

    // Fetch full question objects for evaluation
    const profile = await ProfileService.getProfile(userId);
    const userTargetCareer = targetCareer || (profile && profile.careerGoal && profile.careerGoal.targetCareer) || 'Software Engineer';
    const allCareerQuestions = await this.getCareerQuestions(userTargetCareer);
    const qMap = new Map(allCareerQuestions.map(q => [q.id, q]));

    let totalTech = 0;
    let totalProb = 0;
    let totalComm = 0;
    let totalProj = 0;
    let hasProjectQuestions = false;

    const evaluatedResponses = [];

    for (const ans of answers) {
      const q = qMap.get(ans.questionId);
      if (!q) {
        throw new Error(`Question ID ${ans.questionId} not found in career bank.`);
      }

      if (q.isProjectQuestion || (q.category && q.category.includes('PROJECT'))) {
        hasProjectQuestions = true;
      }

      const text = (ans.responseText || ans.userAnswer || '').trim();
      if (text.length < 15) {
        throw new Error(`Answer text for question ${ans.questionId} must be at least 15 characters.`);
      }

      const evalResult = this.calculateEvaluation(text, q);
      evaluatedResponses.push({
        questionId: q.id,
        dbQuestionId: q.dbId,
        responseText: text,
        technicalScore: evalResult.technicalScore,
        problemSolvingScore: evalResult.problemSolvingScore,
        communicationScore: evalResult.communicationScore,
        projectKnowledgeScore: evalResult.projectKnowledgeScore
      });

      totalTech += evalResult.technicalScore;
      totalProb += evalResult.problemSolvingScore;
      totalComm += evalResult.communicationScore;
      totalProj += evalResult.projectKnowledgeScore;
    }

    const count = answers.length;
    const avgTech = Math.round(totalTech / count);
    const avgProb = Math.round(totalProb / count);
    const avgComm = Math.round(totalComm / count);
    const avgProj = Math.round(totalProj / count);

    let overallScore = 0;
    if (hasProjectQuestions) {
      // 35% Tech + 30% Prob + 15% Comm + 20% Proj
      overallScore = Math.round(avgTech * 0.35 + avgProb * 0.30 + avgComm * 0.15 + avgProj * 0.20);
    } else {
      // No-project redistribution: Tech 43.75%, Prob 37.5%, Comm 18.75%, Proj 0%
      overallScore = Math.round(avgTech * 0.4375 + avgProb * 0.375 + avgComm * 0.1875);
    }

    const completedAt = new Date();

    if (this.isDbConfigured()) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        const [sessionResult] = await connection.query(
          `INSERT INTO interview_sessions
            (user_id, mode, target_career, technical_score, problem_solving_score, communication_score, project_knowledge_score, overall_score, question_count, completed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            mode,
            userTargetCareer,
            avgTech,
            avgProb,
            avgComm,
            avgProj,
            overallScore,
            count,
            completedAt
          ]
        );

        const sessionId = sessionResult.insertId;

        for (const resp of evaluatedResponses) {
          await connection.query(
            `INSERT INTO interview_responses
              (session_id, question_id, response_text, technical_score, problem_solving_score, communication_score, project_knowledge_score)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              sessionId,
              resp.dbQuestionId,
              resp.responseText,
              resp.technicalScore,
              resp.problemSolvingScore,
              resp.communicationScore,
              resp.projectKnowledgeScore
            ]
          );
        }

        await connection.commit();
        connection.release();

        return {
          sessionId,
          userId,
          mode,
          targetCareer: userTargetCareer,
          technicalScore: avgTech,
          problemSolvingScore: avgProb,
          communicationScore: avgComm,
          projectKnowledgeScore: avgProj,
          overallScore,
          questionCount: count,
          hasProjectQuestions,
          completedAt: completedAt.toISOString()
        };
      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    }

    // In-memory fallback persistence for test suites
    const sessionId = nextMockSessionId++;
    const sessionObj = {
      id: sessionId,
      userId,
      mode,
      targetCareer: userTargetCareer,
      technicalScore: avgTech,
      problemSolvingScore: avgProb,
      communicationScore: avgComm,
      projectKnowledgeScore: avgProj,
      overallScore,
      questionCount: count,
      hasProjectQuestions,
      createdAt: completedAt.toISOString(),
      completedAt: completedAt.toISOString()
    };

    mockInterviewSessions.set(sessionId, sessionObj);
    mockInterviewResponses.set(sessionId, evaluatedResponses);

    return {
      sessionId,
      userId,
      mode,
      targetCareer: userTargetCareer,
      technicalScore: avgTech,
      problemSolvingScore: avgProb,
      communicationScore: avgComm,
      projectKnowledgeScore: avgProj,
      overallScore,
      questionCount: count,
      hasProjectQuestions,
      completedAt: completedAt.toISOString()
    };
  },

  async getHistory(userId) {
    if (this.isDbConfigured()) {
      const [rows] = await pool.query(
        `SELECT id, user_id, mode, target_career, technical_score, problem_solving_score,
                communication_score, project_knowledge_score, overall_score, question_count,
                created_at, completed_at
         FROM interview_sessions
         WHERE user_id = ?
         ORDER BY created_at DESC, id DESC`,
        [userId]
      );

      return rows.map(r => ({
        sessionId: r.id,
        userId: r.user_id,
        mode: r.mode,
        targetCareer: r.target_career,
        questionCount: r.question_count,
        technicalScore: Number(r.technical_score || 0),
        problemSolvingScore: Number(r.problem_solving_score || 0),
        communicationScore: Number(r.communication_score || 0),
        projectKnowledgeScore: Number(r.project_knowledge_score || 0),
        overallScore: Number(r.overall_score || 0),
        createdAt: r.created_at,
        completedAt: r.completed_at
      }));
    }

    // In-memory fallback
    const userSessions = Array.from(mockInterviewSessions.values())
      .filter(s => s.userId === Number(userId))
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    return userSessions.map(s => ({
      sessionId: s.id,
      userId: s.userId,
      mode: s.mode,
      targetCareer: s.targetCareer,
      questionCount: s.questionCount,
      technicalScore: s.technicalScore,
      problemSolvingScore: s.problemSolvingScore,
      communicationScore: s.communicationScore,
      projectKnowledgeScore: s.projectKnowledgeScore,
      overallScore: s.overallScore,
      createdAt: s.createdAt,
      completedAt: s.completedAt
    }));
  },

  async getLatestSessionScore(userId) {
    const history = await this.getHistory(userId);
    if (history && history.length > 0) {
      return history[0];
    }
    return null;
  }
};

module.exports = InterviewService;
