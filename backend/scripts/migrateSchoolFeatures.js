/**
 * Migration script to update schools with feature permissions and sync from admin users
 * 
 * Run with: node scripts/migrateSchoolFeatures.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/userModel');
const School = require('../models/schoolModel');
const logger = require('../utils/logger');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected - Running migration'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Function to migrate school features from admin permissions
const migrateSchoolFeatures = async () => {
  try {
    console.log('Starting migration of school features');
    logger.info('MIGRATION', 'Starting migration of school features');

    // 1. Ensure all schools have featurePermissions object
    console.log('Updating all schools with feature permissions structure...');
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

    // 2. Find all admin users
    const adminUsers = await User.find({ role: 'admin' });
    console.log(`Found ${adminUsers.length} admin users to process`);
    logger.info('MIGRATION', `Found ${adminUsers.length} admin users to process`);

    // 3. For each admin, update their school's feature permissions
    for (const admin of adminUsers) {
      const schoolId = admin.school || admin.schoolId;
      
      if (!schoolId) {
        console.warn(`Admin ${admin._id} (${admin.name}) has no associated school`);
        logger.warn('MIGRATION', `Admin ${admin._id} (${admin.name}) has no associated school`);
        continue;
      }

      try {
        const school = await School.findById(schoolId);
        
        if (!school) {
          console.warn(`School not found for admin ${admin._id} (${admin.name}), schoolId: ${schoolId}`);
          logger.warn('MIGRATION', `School not found for admin ${admin._id} (${admin.name}), schoolId: ${schoolId}`);
          continue;
        }

        // Ensure admin has adminPermissions object
        admin.adminPermissions = admin.adminPermissions || {
          canManageGrades: true,
          canSendNotifications: true,
          canManageUsers: true,
          canManageSchools: true,
          canManageDirections: true,
          canManageSubjects: true,
          canAccessReports: true,
          canManageEvents: true
        };

        // Update school features based on admin permissions
        const featurePermissions = {
          enableNotifications: admin.adminPermissions.canSendNotifications !== false,
          enableGrades: admin.adminPermissions.canManageGrades !== false,
          enableRatingSystem: admin.adminPermissions.canAccessReports !== false,
          enableCalendar: admin.adminPermissions.canManageEvents !== false,
          enableStudentProgress: admin.adminPermissions.canAccessReports !== false
        };

        // Update the school with these feature permissions
        school.featurePermissions = {
          ...school.featurePermissions,
          ...featurePermissions
        };
        await school.save();

        console.log(`Updated school "${school.name}" with feature permissions from admin ${admin.name}`);
        logger.info('MIGRATION', `Updated school "${school.name}" with feature permissions from admin ${admin.name}`);

      } catch (error) {
        console.error(`Error updating school for admin ${admin._id}:`, error.message);
        logger.error('MIGRATION', `Error updating school for admin ${admin._id}: ${error.message}`);
      }
    }

    console.log('Migration completed successfully');
    logger.info('MIGRATION', 'Migration completed successfully');
    process.exit(0);

  } catch (error) {
    console.error('Migration failed:', error);
    logger.error('MIGRATION', `Migration failed: ${error.message}`);
    process.exit(1);
  }
};

// Run the migration
migrateSchoolFeatures();
