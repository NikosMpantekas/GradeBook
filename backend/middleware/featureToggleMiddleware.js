const asyncHandler = require('express-async-handler');
const SchoolPermissions = require('../models/schoolPermissionsModel');
const logger = require('../utils/logger');

/**
 * DISABLED: Feature toggle middleware - All school permission checks removed
 * This middleware has been disabled to eliminate all school permission restrictions
 * All features are now enabled by default regardless of school configuration
 * @param {string} featureName - The name of the feature (no longer checked)
 * @returns {function} Express middleware that always allows access
 */
const checkFeatureEnabled = (featureName) => {
  return asyncHandler(async (req, res, next) => {
    // DISABLED: All permission checks removed - always allow access
    logger.info('FEATURE', `Feature toggle checking DISABLED - allowing access to ${featureName}`, {
      userId: req.user?.id,
      userRole: req.user?.role,
      schoolId: req.user?.schoolId,
      path: req.path,
      method: req.method,
      note: 'School permissions system has been completely disabled'
    });
    
    // Always set feature as enabled and proceed
    req.featureEnabled = true;
    next();
  });
};

// DISABLED: Specific middleware instances - all now return enabled by default
const checkCalendarEnabled = checkFeatureEnabled('enableCalendar');
const checkRatingEnabled = checkFeatureEnabled('enableRatingSystem');

/**
 * Middleware that adds feature toggle information to the response
 * This doesn't block requests but adds feature flags to res.locals
 * for use in subsequent middleware or controllers
 */
const addFeatureFlags = asyncHandler(async (req, res, next) => {
  // Get all available features and enable them by default
  const availableFeatures = SchoolPermissions.getAvailableFeatures();
  const allFeaturesEnabled = {};
  
  Object.keys(availableFeatures).forEach(feature => {
    allFeaturesEnabled[feature] = true;
  });
  
  // Set all features as enabled for now (since permission system is disabled)
  res.locals.features = allFeaturesEnabled;
  
  logger.debug('FEATURE', `Feature flags set for school ${req.user?.schoolId}`, res.locals.features);
  next();
});

module.exports = {
  checkFeatureEnabled,
  checkCalendarEnabled,
  checkRatingEnabled,
  addFeatureFlags
};
