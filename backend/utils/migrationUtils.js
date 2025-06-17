const User = require('../models/userModel');
const School = require('../models/schoolModel');
const logger = require('./logger');

/**
 * Migration utility to update school feature permissions
 * This can be called directly from a route or controller
 */
const migrateSchoolFeatures = async () => {
  try {
    logger.info('MIGRATION', 'Starting migration of school features');
    console.log('Starting migration of school features');

    // 1. Find all existing schools that don't have featurePermissions
    const schoolsCount = await School.countDocuments();
    const schoolsWithoutFeatures = await School.countDocuments({ featurePermissions: { $exists: false } });
    
    console.log(`Found ${schoolsCount} total schools, ${schoolsWithoutFeatures} without feature permissions`);
    logger.info('MIGRATION', `Found ${schoolsCount} total schools, ${schoolsWithoutFeatures} without feature permissions`);

    // 2. Update all schools with default feature permissions structure if they don't have it
    if (schoolsWithoutFeatures > 0) {
      const updateResult = await School.updateMany(
        { featurePermissions: { $exists: false } },
        { 
          $set: { 
            featurePermissions: {
              enableNotifications: true,
              enableGrades: true,
              enableRatingSystem: true,
              enableCalendar: true,
              enableStudentProgress: true
            }
          }
        }
      );
      
      console.log(`Updated ${updateResult.modifiedCount} schools with default feature permissions`);
      logger.info('MIGRATION', `Updated ${updateResult.modifiedCount} schools with default feature permissions`);
    }

    // 3. Find all MAIN schools (exclude branches that have a parent cluster)
    const schools = await School.find({ parentCluster: null });
    const branchSchools = await School.find({ parentCluster: { $ne: null } });
    
    logger.info('MIGRATION', `Found ${schools.length} main schools and ${branchSchools.length} branch schools`);
    console.log(`Found ${schools.length} main schools and ${branchSchools.length} branch schools`);
    console.log(`Processing ${schools.length} main schools to sync with admins (branches will be skipped)`);

    // 4. For each main school, find its admins and sync permissions
    const schoolsProcessed = [];
    let totalAdminsUpdated = 0;

    for (const school of schools) {
      const schoolLog = {
        schoolId: school._id,
        schoolName: school.name,
        adminsFound: 0,
        adminsUpdated: 0,
        details: []
      };

      try {
        // Find admins for this school
        const admins = await User.find({
          role: 'admin',
          $or: [
            { schoolId: school._id },
            { school: school._id }
          ]
        });

        schoolLog.adminsFound = admins.length;
        console.log(`Found ${admins.length} admins for school "${school.name}"`);

        // Make sure the school has featurePermissions
        if (!school.featurePermissions) {
          school.featurePermissions = {
            enableNotifications: true,
            enableGrades: true,
            enableRatingSystem: true,
            enableCalendar: true,
            enableStudentProgress: true
          };
          await school.save();
          schoolLog.details.push('Initialized missing featurePermissions');
        }

        // Update each admin
        for (const admin of admins) {
          const adminLog = {
            adminId: admin._id,
            adminName: admin.name, 
            changes: []
          };

          // Initialize admin permissions if they don't exist
          if (!admin.adminPermissions) {
            admin.adminPermissions = {
              canManageGrades: true,
              canSendNotifications: true,
              canManageUsers: true,
              canManageSchools: true,
              canManageDirections: true,
              canManageSubjects: true,
              canAccessReports: true,
              canManageEvents: true
            };
            adminLog.changes.push('Initialized missing adminPermissions');
          }

          // Map school feature permissions to admin permissions
          let adminUpdated = false;

          // Sync notifications permission
          if (admin.adminPermissions.canSendNotifications !== school.featurePermissions.enableNotifications) {
            admin.adminPermissions.canSendNotifications = school.featurePermissions.enableNotifications;
            adminLog.changes.push(`Updated canSendNotifications to ${school.featurePermissions.enableNotifications}`);
            adminUpdated = true;
          }

          // Sync grades permission
          if (admin.adminPermissions.canManageGrades !== school.featurePermissions.enableGrades) {
            admin.adminPermissions.canManageGrades = school.featurePermissions.enableGrades;
            adminLog.changes.push(`Updated canManageGrades to ${school.featurePermissions.enableGrades}`);
            adminUpdated = true;
          }

          // Sync reports/rating permission
          if (admin.adminPermissions.canAccessReports !== school.featurePermissions.enableRatingSystem) {
            admin.adminPermissions.canAccessReports = school.featurePermissions.enableRatingSystem;
            adminLog.changes.push(`Updated canAccessReports to ${school.featurePermissions.enableRatingSystem}`);
            adminUpdated = true;
          }

          // Sync calendar/events permission
          if (admin.adminPermissions.canManageEvents !== school.featurePermissions.enableCalendar) {
            admin.adminPermissions.canManageEvents = school.featurePermissions.enableCalendar;
            adminLog.changes.push(`Updated canManageEvents to ${school.featurePermissions.enableCalendar}`);
            adminUpdated = true;
          }

          // Only save if changes were made
          if (adminUpdated) {
            await admin.save();
            schoolLog.adminsUpdated++;
            totalAdminsUpdated++;
          }

          if (adminLog.changes.length > 0) {
            schoolLog.details.push(adminLog);
          }
        }

        schoolsProcessed.push(schoolLog);
      } catch (error) {
        console.error(`Error processing school ${school.name}:`, error.message);
        logger.error('MIGRATION', `Error processing school ${school.name}: ${error.message}`);
        schoolLog.error = error.message;
        schoolsProcessed.push(schoolLog);
      }
    }

    // Log summary
    console.log(`Migration complete: Processed ${schools.length} main schools, updated ${totalAdminsUpdated} admin users`);
    logger.info('MIGRATION', `Migration complete: Processed ${schools.length} main schools, updated ${totalAdminsUpdated} admin users`);

    return {
      success: true,
      totalSchools: schools.length,
      branchSchoolsSkipped: branchSchools.length,
      totalAdminsUpdated,
      schoolsProcessed
    };
  } catch (error) {
    console.error('Migration failed:', error);
    logger.error('MIGRATION', `Migration failed: ${error.message}`);
    
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  migrateSchoolFeatures
};
