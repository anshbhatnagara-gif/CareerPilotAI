const ProjectsService = require('../services/projects.service');

async function getProjects(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await ProjectsService.getProjects(userId);

    if (result.incompleteProfile) {
      return res.status(400).json({
        success: false,
        error: 'PROFILE_INCOMPLETE',
        message: 'Please complete your onboarding profile before viewing personalized project recommendations.'
      });
    }

    if (result.missingTargetCareer) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_TARGET_CAREER',
        message: 'Please select a target career goal before viewing personalized project recommendations.'
      });
    }

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
}

async function updateProjectStatus(req, res, next) {
  try {
    const userId = req.user.id;
    const projectId = req.params.id;
    const { status } = req.body;

    const validStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_STATUS',
        message: 'Status must be one of: NOT_STARTED, IN_PROGRESS, COMPLETED'
      });
    }

    const updatedData = await ProjectsService.updateProjectStatus(userId, projectId, status);

    return res.status(200).json({
      success: true,
      message: 'Project status updated successfully',
      projectsData: updatedData
    });
  } catch (err) {
    if (err.message === 'INVALID_STATUS') {
      return res.status(400).json({
        success: false,
        error: 'INVALID_STATUS',
        message: 'Status must be one of: NOT_STARTED, IN_PROGRESS, COMPLETED'
      });
    }
    if (err.message === 'PROJECT_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: 'PROJECT_NOT_FOUND',
        message: 'Project not found in catalog'
      });
    }
    next(err);
  }
}

module.exports = {
  getProjects,
  updateProjectStatus
};
