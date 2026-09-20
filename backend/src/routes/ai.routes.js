const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const ProfileService = require('../services/profile.service');
const aiClient = require('../services/aiClient');

router.use(requireAuth);

/**
 * GET /api/ai/dashboard
 * Aggregates server-to-server AI intelligence for the authenticated user's dashboard.
 * Derived strictly from authenticated session req.user.id.
 */
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await ProfileServic
    e.getProfile(userId);

    const targetCareer = (profile && profile.careerGoal && profile.careerGoal.targetCareer) || (profile && profile.targetCareer) || '';
    const experienceLevel = (profile && profile.careerGoal && profile.careerGoal.experienceLevel) || (profile && profile.experienceLevel) || 'Entry Level';
    const goal = (profile && profile.careerGoal && profile.careerGoal.goal) || (profile && profile.goal) || '';

    if (!profile || !targetCareer) {
      return res.status(400).json({
        success: false,
        incompleteProfile: true,
        message: 'Please complete your career profile and set a target career before generating AI dashboard insights.'
      });
    }

    const profileData = {
      targetCareer: targetCareer,
      experienceLevel: experienceLevel,
      goal: goal,
      skills: Array.isArray(profile.skills) ? profile.skills : [],
      interests: Array.isArray(profile.interests) ? profile.interests : [],
      personal: profile.personal || {},
      education: profile.education || {}
    };

    // Execute server-to-server AI calls in parallel safely
    const [careerRes, skillsRes, learningRes] = await Promise.all([
      aiClient.analyzeCareer(profileData).catch(() => ({ success: false })),
      aiClient.analyzeSkills(profileData, []).catch(() => ({ success: false })),
      aiClient.analyzeLearning(profileData, [], [], [], []).catch(() => ({ success: false }))
    ]);

    const isOnline = Boolean(careerRes.success && skillsRes.success && learningRes.success);

    return res.status(200).json({
      success: true,
      aiHealth: {
        online: isOnline,
        status: isOnline ? 'online' : 'degraded'
      },
      careerAnalysis: careerRes.data || null,
      skillAnalysis: skillsRes.data || null,
      learningAnalysis: learningRes.data || null
    });
  } catch (error) {
    if (req.app.get('env') === 'development') {
      console.error('AI Dashboard Endpoint Error:', error);
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to generate AI dashboard insights'
    });
  }
});

/**
 * POST /api/ai/career
 */
router.post('/career', async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await ProfileService.getProfile(userId);
    const targetCareer = (profile && profile.careerGoal && profile.careerGoal.targetCareer) || (profile && profile.targetCareer) || '';
    if (!profile || !targetCareer) {
      return res.status(400).json({ success: false, message: 'Profile required' });
    }
    const result = await aiClient.analyzeCareer({
      targetCareer: targetCareer,
      skills: profile.skills || []
    });
    return res.status(result.success ? 200 : 503).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Career AI analysis failed' });
  }
});

/**
 * POST /api/ai/skills
 */
router.post('/skills', async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await ProfileService.getProfile(userId);
    const targetCareer = (profile && profile.careerGoal && profile.careerGoal.targetCareer) || (profile && profile.targetCareer) || '';
    if (!profile || !targetCareer) {
      return res.status(400).json({ success: false, message: 'Profile required' });
    }
    const targetSkills = req.body.targetSkills || [];
    const result = await aiClient.analyzeSkills({
      targetCareer: targetCareer,
      skills: profile.skills || []
    }, targetSkills);
    return res.status(result.success ? 200 : 503).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Skill gap AI analysis failed' });
  }
});

/**
 * POST /api/ai/learning
 */
router.post('/learning', async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await ProfileService.getProfile(userId);
    const targetCareer = (profile && profile.careerGoal && profile.careerGoal.targetCareer) || (profile && profile.targetCareer) || '';
    if (!profile || !targetCareer) {
      return res.status(400).json({ success: false, message: 'Profile required' });
    }
    const { focusAreas, missingSkills, developingSkills, priorityGaps } = req.body;
    const result = await aiClient.analyzeLearning(
      { targetCareer: targetCareer, skills: profile.skills || [] },
      focusAreas || [],
      missingSkills || [],
      developingSkills || [],
      priorityGaps || []
    );
    return res.status(result.success ? 200 : 503).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Learning AI analysis failed' });
  }
});

module.exports = router;
