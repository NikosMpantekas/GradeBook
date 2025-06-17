const asyncHandler = require('express-async-handler');
const School = require('../models/schoolModel');
const User = require('../models/userModel');
const logger = require('../utils/logger');
const { migrateSchoolFeatures } = require('../utils/migrationUtils');
const { createDatabaseBackup, restoreDatabaseFromBackup } = require('../utils/backupUtils');

/**
 * Controller to handle database migrations and schema updates
 */

/**
 * @desc    Run the specified migration
 * @route   POST /api/admin/migrations/run
 * @access  Private/SuperAdmin
 */
const runMigration = asyncHandler(async (req, res) => {
  const { migrationType } = req.body;
  
  if (!migrationType) {
    res.status(400);
    throw new Error('Please specify which migration to run');
  }

  console.log(`MIGRATION: Running ${migrationType} migration`);
  logger.info('MIGRATION', `Superadmin ${req.user.name} (${req.user._id}) initiated ${migrationType} migration`);
  
  let result;
  let success = false;
  let backupPath = null;

  try {
    // Create database backup before migration
    logger.info('MIGRATION', 'Creating database backup before proceeding with migration');
    backupPath = await createDatabaseBackup();
    logger.info('MIGRATION', `Database backup created successfully at ${backupPath}`);

    // Run the appropriate migration
    switch (migrationType) {
      case 'school-features':
        // Run the school features migration
        result = await migrateSchoolFeatures();
        success = result.success;
        break;
        
      default:
        res.status(400);
        throw new Error(`Unknown migration type: ${migrationType}`);
    }

    // Log success or failure
    if (success) {
      logger.info('MIGRATION', `${migrationType} migration completed successfully`, { result });
    } else {
      logger.error('MIGRATION', `${migrationType} migration failed`, { result });
      
      // Attempt to restore from backup if migration failed
      logger.warn('MIGRATION', `Attempting to restore database from backup: ${backupPath}`);
      await restoreDatabaseFromBackup(backupPath);
      
      res.status(500);
      throw new Error(`Migration failed: ${result.error || 'Unknown error'}. System restored from backup.`);
    }

    return res.status(200).json({
      success: true,
      message: `${migrationType} migration completed successfully`,
      result,
      backup: {
        created: true,
        path: backupPath
      }
    });
    
  } catch (error) {
    logger.error('MIGRATION', `Error running ${migrationType} migration: ${error.message}`);
    
    // If we have a backup but restoration hasn't been attempted yet
    if (backupPath && !error.message.includes('restored from backup')) {
      try {
        logger.warn('MIGRATION', `Attempting to restore database from backup due to error: ${backupPath}`);
        await restoreDatabaseFromBackup(backupPath);
        logger.info('MIGRATION', 'Database successfully restored from backup after error');
      } catch (restoreError) {
        logger.error('MIGRATION', `Failed to restore database: ${restoreError.message}`);
      }
    }
    
    res.status(500);
    throw new Error(`Migration failed: ${error.message}`);
  }
});

/**
 * @desc    Get available migrations and their status
 * @route   GET /api/admin/migrations
 * @access  Private/SuperAdmin
 */
const getMigrations = asyncHandler(async (req, res) => {
  // Get counts to determine status
  const schoolsCount = await School.countDocuments();
  const schoolsWithFeatures = await School.countDocuments({ featurePermissions: { $exists: true } });
  const adminsCount = await User.countDocuments({ role: 'admin' });

  // Build migrations list with status
  const migrations = [
    {
      id: 'school-features',
      name: 'School Feature Permissions',
      description: 'Updates schools with feature permissions and synchronizes admin permissions',
      status: schoolsWithFeatures === schoolsCount ? 'completed' : 'pending',
      details: {
        totalSchools: schoolsCount,
        schoolsWithFeatures,
        totalAdmins: adminsCount
      }
    }
    // Add more migrations here as needed
  ];

  res.status(200).json({
    migrations
  });
});

module.exports = {
  runMigration,
  getMigrations
};
