const User = require('../models/userModel');
const logger = require('./logger');

/**
 * Migration utilities that run during application startup
 */

// Default admin permissions - all enabled
const defaultAdminPermissions = {
  canManageGrades: true,
  canSendNotifications: true,
  canManageUsers: true,
  canManageSchools: true,
  canManageDirections: true,
  canManageSubjects: true,
  canAccessReports: true,
  canManageEvents: true
};

/**
 * Update all admin users with proper permissions
 * This runs automatically during server startup
 */
const updateAllAdminPermissions = async () => {
  try {
    logger.info('MIGRATION', 'Starting admin permissions migration');
    
    // Find all admin users
    const admins = await User.find({ role: 'admin' });
    logger.info('MIGRATION', `Found ${admins.length} admin users to update`);
    
    // Update each admin with the default permissions
    let updatedCount = 0;
    for (const admin of admins) {
      // Check if the admin permissions object exists and has all required permissions
      let needsUpdate = false;
      
      if (!admin.adminPermissions) {
        logger.info('MIGRATION', `Admin ${admin.name} (${admin._id}) has no adminPermissions - adding default permissions`);
        admin.adminPermissions = defaultAdminPermissions;
        needsUpdate = true;
      } else {
        // Check each permission and add any missing ones
        Object.keys(defaultAdminPermissions).forEach(permission => {
          if (admin.adminPermissions[permission] === undefined) {
            logger.info('MIGRATION', `Admin ${admin.name} (${admin._id}) is missing ${permission} - setting to true`);
            admin.adminPermissions[permission] = true;
            needsUpdate = true;
          }
        });
      }
      
      if (needsUpdate) {
        await admin.save();
        updatedCount++;
        logger.info('MIGRATION', `Updated admin ${admin.name} (${admin._id}) with complete permissions`);
      }
    }
    
    logger.info('MIGRATION', `Admin permissions migration completed - updated ${updatedCount} users`);
    return { success: true, updatedCount };
  } catch (error) {
    logger.error('MIGRATION', 'Error updating admin permissions', { error: error.message });
    return { success: false, error: error.message };
  }
};

module.exports = {
  updateAllAdminPermissions
};
