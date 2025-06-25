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

    // Get schoolId from user or from request
    const schoolId = req.user?.schoolId || req.schoolId;
    
    if (!schoolId) {
      logger.warn('PERMISSIONS', `No schoolId found for feature check: ${featureName}`, {
        userId: req.user?.id,
        userRole: req.user?.role,
        path: req.path,
        method: req.method
      });
      return res.status(403).json({ 
        message: 'School context required for this operation'
      });
    }
    
    try {
      logger.info('PERMISSIONS', `Checking ${featureName} for user ${req.user?.id} (${req.user?.role}) in school ${schoolId}`);
      
      // Use the SchoolPermissions model to check if the feature is enabled
      const SchoolPermissions = mongoose.model('SchoolPermissions');
      const permissions = await SchoolPermissions.findOne({ schoolId });
      
      logger.info('PERMISSIONS', `SchoolPermissions query result for school ${schoolId}:`, {
        found: !!permissions,
        permissionsId: permissions?._id,
        features: permissions?.features
      });
      
      // If no permissions found, check legacy location in School model
      if (!permissions) {
        logger.warn('PERMISSIONS', `No SchoolPermissions found for school ${schoolId}, checking legacy School model`);
        
        const School = mongoose.model('School');
        const school = await School.findById(schoolId).select('featurePermissions');
        
        logger.info('PERMISSIONS', `Legacy School model check result:`, {
          schoolFound: !!school,
          featurePermissions: school?.featurePermissions
        });
        
        // If the feature is enabled in the legacy location or no permissions found, allow access
        // Default to enabled for critical features like notifications for admins
        if (!school || !school.featurePermissions || school.featurePermissions[featureName] !== false) {
          logger.info('PERMISSIONS', `${featureName} allowed via legacy permissions or default for school ${schoolId}`);
          return next();
        }
        
        logger.warn('PERMISSIONS', `Feature ${featureName} is disabled for school ${schoolId} (legacy check)`, {
          userId: req.user?.id,
          userRole: req.user?.role
        });
        
        return res.status(403).json({
          message: 'This feature is not enabled for your school'
        });
      }
      
      // Check if the feature is explicitly disabled in SchoolPermissions
      const featureValue = permissions.features?.[featureName];
      logger.info('PERMISSIONS', `Feature ${featureName} value in permissions:`, { 
        featureValue,
        featureType: typeof featureValue
      });
      
      if (featureValue === false) {
        logger.warn('PERMISSIONS', `Access denied: ${featureName} is explicitly disabled for school ${schoolId}`, {
          userId: req.user?.id,
          userRole: req.user?.role,
          schoolId
        });
        
        return res.status(403).json({
          message: 'This feature is not enabled for your school'
        });
      }
      
      // Feature is enabled or not explicitly disabled, allow access
      // For critical features like notifications, default to enabled if undefined
      if (featureValue === undefined && ['enableNotifications', 'enableGrades'].includes(featureName)) {
        logger.info('PERMISSIONS', `${featureName} defaulting to enabled for school ${schoolId} (undefined value)`);
      }
      
      logger.info('PERMISSIONS', `Feature ${featureName} access granted for school ${schoolId}`, {
        userId: req.user?.id,
        userRole: req.user?.role,
        featureValue
      });
      
      next();
    } catch (error) {
      logger.error('PERMISSIONS', `Error checking feature permission: ${error.message}`, {
        feature: featureName,
        schoolId,
        userId: req.user?.id,
        userRole: req.user?.role,
        stack: error.stack
      });
      
      // For critical features like notifications, default to allowing access on error for admins
      if (['enableNotifications', 'enableGrades'].includes(featureName) && 
          req.user?.role === 'admin') {
        logger.warn('PERMISSIONS', `Allowing ${featureName} for admin due to permission check error`);
        return next();
      }
      
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
