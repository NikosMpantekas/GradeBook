const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const logger = require('../utils/logger');

/**
 * Middleware to check if a specific feature is enabled for a school
 * @param {string} featureName - Name of the feature to check (e.g., 'enableNotifications')
 * @returns {Function} Express middleware function
 */
const requireFeature = (featureName) => {
  return asyncHandler(async (req, res, next) => {
    // Superadmins bypass all feature restrictions
    if (req.user && req.user.role === 'superadmin') {
      logger.info('PERMISSIONS', `Superadmin bypassing feature check for ${featureName}`, {
        userId: req.user.id
      });
      return next();
    }

    // School admins can see everything for their school, but API endpoints should still enforce permissions
    // This ensures admins can see toggles but can't use disabled functionality
    
    // Get schoolId from user or from request
    const schoolId = req.user?.schoolId || req.schoolId;
    
    if (!schoolId) {
      logger.warn('PERMISSIONS', `No schoolId found for feature check: ${featureName}`, {
        userId: req.user?.id,
        path: req.path,
        method: req.method
      });
      return res.status(403).json({ 
        message: 'School context required for this operation'
      });
    }
    
    try {
      // Use the SchoolPermissions model to check if the feature is enabled
      const SchoolPermissions = mongoose.model('SchoolPermissions');
      const permissions = await SchoolPermissions.findOne({ schoolId });
      
      // If no permissions found, check legacy location in School model
      if (!permissions) {
        const School = mongoose.model('School');
        const school = await School.findById(schoolId).select('featurePermissions');
        
        // If the feature is enabled in the legacy location or no permissions found, allow access
        if (!school || !school.featurePermissions || school.featurePermissions[featureName] !== false) {
          return next();
        }
        
        logger.warn('PERMISSIONS', `Feature ${featureName} is disabled for school ${schoolId} (legacy check)`, {
          userId: req.user?.id
        });
        
        return res.status(403).json({
          message: 'This feature is not enabled for your school'
        });
      }
      
      // Check if the feature is explicitly disabled
      if (permissions.features && permissions.features[featureName] === false) {
        logger.warn('PERMISSIONS', `Access denied: ${featureName} is disabled for school ${schoolId}`, {
          userId: req.user?.id,
          schoolId
        });
        
        return res.status(403).json({
          message: 'This feature is not enabled for your school'
        });
      }
      
      // Feature is enabled or not explicitly disabled, allow access
      logger.info('PERMISSIONS', `Feature ${featureName} access granted for school ${schoolId}`, {
        userId: req.user?.id
      });
      
      next();
    } catch (error) {
      logger.error('PERMISSIONS', `Error checking feature permission: ${error.message}`, {
        feature: featureName,
        schoolId,
        userId: req.user?.id,
        stack: error.stack
      });
      
      // In case of error, default to denying access for security
      return res.status(500).json({
        message: 'Error checking feature permissions'
      });
    }
  });
};

module.exports = {
  requireFeature
};
