const asyncHandler = require('express-async-handler');
const SchoolPermissions = require('../models/schoolPermissionsModel');
const logger = require('../utils/logger');

/**
 * Middleware to check if a specific feature is enabled for a school
 * This middleware should be used after the auth middleware (protect)
 * @param {string} featureName - The name of the feature to check (e.g., 'enableCalendar')
 * @returns {function} Express middleware
 */
const checkFeatureEnabled = (featureName) => {
  return asyncHandler(async (req, res, next) => {
    // Skip feature checks for superadmin users
    if (req.isSuperadmin) {
      logger.info('FEATURE', `Superadmin bypassing ${featureName} feature check`);
      // Set a flag to indicate the feature is enabled for the frontend
      req.featureEnabled = true;
      return next();
    }

    // Ensure user has schoolId
    if (!req.user || !req.user.schoolId) {
      logger.error('FEATURE', `No schoolId available to check ${featureName} feature`);
      res.status(403);
      throw new Error('School context required to access this feature');
    }

    try {
      // Find school permissions
      const schoolPermissions = await SchoolPermissions.findOne({ 
        schoolId: req.user.schoolId 
      });

      if (!schoolPermissions) {
        logger.warn('FEATURE', `No permissions found for school ${req.user.schoolId}`);
        res.status(403);
        throw new Error('School not configured for this feature');
      }

      // Check if the specific feature is enabled
      const isEnabled = schoolPermissions.features && 
                       schoolPermissions.features[featureName] === true;

      if (!isEnabled) {
        logger.warn('FEATURE', `${featureName} is disabled for school ${req.user.schoolId}`);
        res.status(403);
        throw new Error('This feature is not enabled for your school');
      }

      // Set a flag to indicate the feature is enabled for the frontend
      req.featureEnabled = true;
      logger.info('FEATURE', `${featureName} is enabled for school ${req.user.schoolId}`);
      next();
    } catch (error) {
      if (error.message === 'This feature is not enabled for your school' || 
          error.message === 'School not configured for this feature') {
        throw error;
      }
      
      logger.error('FEATURE', `Error checking ${featureName} feature:`, {
        error: error.message,
        schoolId: req.user.schoolId,
        stack: error.stack
      });
      res.status(500);
      throw new Error('Error checking feature availability');
    }
  });
};

// Specific middleware instances for each feature
const checkCalendarEnabled = checkFeatureEnabled('enableCalendar');
const checkRatingEnabled = checkFeatureEnabled('enableRatingSystem');

/**
 * Middleware that adds feature toggle information to the response
 * This doesn't block requests but adds feature flags to res.locals
 * for use in subsequent middleware or controllers
 */
const addFeatureFlags = asyncHandler(async (req, res, next) => {
  // Skip for superadmin - all features are available
  if (req.isSuperadmin) {
    res.locals.features = {
      enableCalendar: true,
      enableRatingSystem: true
    };
    return next();
  }

  // Check if we have a school context
  if (!req.user || !req.user.schoolId) {
    res.locals.features = {
      enableCalendar: false,
      enableRatingSystem: false
    };
    return next();
  }

  try {
    // Find school permissions
    const schoolPermissions = await SchoolPermissions.findOne({ 
      schoolId: req.user.schoolId 
    });

    if (!schoolPermissions) {
      res.locals.features = {
        enableCalendar: false,
        enableRatingSystem: false
      };
    } else {
      // Set feature flags based on school permissions
      res.locals.features = {
        enableCalendar: schoolPermissions.features?.enableCalendar === true,
        enableRatingSystem: schoolPermissions.features?.enableRatingSystem === true
      };
    }

    logger.debug('FEATURE', `Feature flags set for school ${req.user.schoolId}`, res.locals.features);
    next();
  } catch (error) {
    logger.error('FEATURE', `Error setting feature flags:`, {
      error: error.message,
      schoolId: req.user.schoolId,
      stack: error.stack
    });
    
    // Don't block the request, just set features as disabled
    res.locals.features = {
      enableCalendar: false,
      enableRatingSystem: false
    };
    next();
  }
});

module.exports = {
  checkFeatureEnabled,
  checkCalendarEnabled,
  checkRatingEnabled,
  addFeatureFlags
};
