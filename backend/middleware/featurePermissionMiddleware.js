const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const logger = require('../utils/logger');

/**
 * DISABLED: Feature permission middleware - All school permission checks removed
 * This middleware has been disabled to eliminate all school permission restrictions
 * All features are now enabled by default regardless of school configuration
 * @param {string} featureName - Name of the feature (no longer checked)
 * @returns {Function} Express middleware function that always allows access
 */
const requireFeature = (featureName) => {
  return asyncHandler(async (req, res, next) => {
    // DISABLED: All permission checks removed - always allow access
    logger.info('PERMISSIONS', `Feature permission checking DISABLED - allowing access to ${featureName}`, {
      userId: req.user?.id,
      userRole: req.user?.role,
      schoolId: req.user?.schoolId,
      path: req.path,
      method: req.method,
      note: 'School permissions system has been completely disabled'
    });
    
    // Always proceed to next middleware - no permission checks
    next();
  });
};

module.exports = {
  requireFeature
};
