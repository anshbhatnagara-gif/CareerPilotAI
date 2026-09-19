const RoadmapService = require('../services/roadmap.service');

async function getRoadmap(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await RoadmapService.getRoadmap(userId);

    if (result.incompleteProfile) {
      return res.status(400).json({
        success: false,
        error: 'PROFILE_INCOMPLETE',
        message: 'Please complete your onboarding profile before generating a learning roadmap.'
      });
    }

    if (result.missingTargetCareer) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_TARGET_CAREER',
        message: 'Please select a target career goal before generating a learning roadmap.'
      });
    }

    return res.status(200).json({
      success: true,
      roadmap: result
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getRoadmap
};
