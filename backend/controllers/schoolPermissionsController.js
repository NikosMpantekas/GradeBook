const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const SchoolPermissions = require('../models/schoolPermissionsModel');
const logger = require('../utils/logger');

// @desc    Get school permissions
// @route   GET /api/schools/permissions/:schoolId
// @access  Private (Admin, Superadmin)
const getSchoolPermissions = asyncHandler(async (req, res) => {
  const { schoolId } = req.params;
  
  // Validate schoolId
  if (!mongoose.Types.ObjectId.isValid(schoolId)) {
    res.status(400);
    throw new Error('Invalid school ID');
  }

  // Log the request
  logger.info('PERMISSIONS', `Fetching school permissions for school: ${schoolId}`, {
    userId: req.user.id,
    userRole: req.user.role,
    schoolId,
  });

  // Check if user has access to this school
  if (req.user.role !== 'superadmin' && req.user.schoolId.toString() !== schoolId) {
    logger.warn('PERMISSIONS', `User attempted to access permissions for another school`, {
      userId: req.user.id,
      userRole: req.user.role,
      userSchoolId: req.user.schoolId,
      requestedSchoolId: schoolId,
    });
    res.status(403);
    throw new Error('You do not have permission to access this school');
  }

  // Get permissions for the specified school
  let permissions = await SchoolPermissions.findOne({ schoolId });

  // If permissions don't exist yet, create default permissions
  if (!permissions) {
    logger.info('PERMISSIONS', `Creating default permissions for school: ${schoolId}`);
    
    permissions = await SchoolPermissions.create({
      schoolId,
      features: {
        enableNotifications: true,
        enableGrades: true,
        enableRatingSystem: true,
        enableCalendar: true,
        enableStudentProgress: true,
      },
      lastModifiedBy: req.user.id,
    });
  }

  res.status(200).json(permissions);
});

// @desc    Update school permissions
// @route   PUT /api/schools/permissions/:schoolId
// @access  Private (Superadmin only)
const updateSchoolPermissions = asyncHandler(async (req, res) => {
  const { schoolId } = req.params;
  const { features } = req.body;
  
  // Validate schoolId
  if (!mongoose.Types.ObjectId.isValid(schoolId)) {
    res.status(400);
    throw new Error('Invalid school ID');
  }

  // Only superadmin can update permissions
  if (req.user.role !== 'superadmin') {
    logger.warn('PERMISSIONS', `Non-superadmin attempted to update school permissions`, {
      userId: req.user.id,
      userRole: req.user.role,
      schoolId,
    });
    res.status(403);
    throw new Error('Only superadmin can update school feature permissions');
  }

  // Log the update request
  logger.info('PERMISSIONS', `Updating permissions for school: ${schoolId}`, {
    userId: req.user.id,
    features: JSON.stringify(features),
  });

  // Find and update school permissions, or create if they don't exist
  let permissions = await SchoolPermissions.findOneAndUpdate(
    { schoolId },
    { 
      features,
      lastModifiedBy: req.user.id,
      lastModifiedDate: Date.now()
    },
    { 
      new: true, 
      upsert: true,
      runValidators: true,
    }
  );

  // Return updated permissions
  res.status(200).json(permissions);
});

// @desc    Check if feature is enabled for a school
// @route   GET /api/schools/permissions/:schoolId/feature/:featureName
// @access  Private
const checkFeatureEnabled = asyncHandler(async (req, res) => {
  const { schoolId, featureName } = req.params;

  // Log the check
  logger.info('PERMISSIONS', `Checking if feature ${featureName} is enabled for school ${schoolId}`, {
    userId: req.user.id,
    userRole: req.user.role,
  });

  // Admin and superadmin always have feature access
  if (req.user.role === 'superadmin' || req.user.role === 'admin') {
    return res.status(200).json({ enabled: true, bypassReason: 'admin_role' });
  }

  // Get the school permissions
  const permissions = await SchoolPermissions.findOne({ schoolId });
  
  // If no permissions exist, default to enabled
  if (!permissions) {
    return res.status(200).json({ enabled: true, reason: 'default' });
  }

  // Check if the specific feature exists and is enabled
  const isEnabled = permissions.features[featureName] === true;
  
  return res.status(200).json({ enabled: isEnabled });
});

// @desc    Migrate old school feature permissions to the new model
// @route   POST /api/schools/permissions/migrate
// @access  Private (Superadmin only)
const migrateSchoolPermissions = asyncHandler(async (req, res) => {
  // Only superadmin can run migration
  if (req.user.role !== 'superadmin') {
    res.status(403);
    throw new Error('Only superadmin can run migrations');
  }

  logger.info('MIGRATE', 'Starting migration of school feature permissions', {
    userId: req.user.id,
  });

  // Get all schools
  const School = mongoose.model('School');
  const schools = await School.find({}).select('_id featurePermissions');
  
  const results = {
    total: schools.length,
    migrated: 0,
    skipped: 0,
    errors: 0,
    details: []
  };

  // Process each school
  for (const school of schools) {
    try {
      // Check if permissions already exist for this school
      const existingPermissions = await SchoolPermissions.findOne({ schoolId: school._id });
      
      if (existingPermissions) {
        // Skip if already migrated
        results.skipped++;
        results.details.push({
          schoolId: school._id,
          status: 'skipped',
          reason: 'already_exists'
        });
        continue;
      }

      // Create new permissions entry
      const newPermissions = await SchoolPermissions.create({
        schoolId: school._id,
        features: school.featurePermissions || {
          enableNotifications: true,
          enableGrades: true,
          enableRatingSystem: true,
          enableCalendar: true,
          enableStudentProgress: true,
        },
        lastModifiedBy: req.user.id,
      });

      results.migrated++;
      results.details.push({
        schoolId: school._id,
        status: 'migrated',
        permissions: newPermissions.features
      });

    } catch (error) {
      logger.error('MIGRATE', `Error migrating permissions for school ${school._id}`, {
        error: error.message,
      });
      
      results.errors++;
      results.details.push({
        schoolId: school._id,
        status: 'error',
        error: error.message
      });
    }
  }

  logger.info('MIGRATE', 'Migration completed', results);
  res.status(200).json(results);
});

module.exports = {
  getSchoolPermissions,
  updateSchoolPermissions,
  checkFeatureEnabled,
  migrateSchoolPermissions,
};
