// New School Permissions Controller
// Handles all school feature permissions for the comprehensive permission control system

const asyncHandler = require('express-async-handler');
const SchoolPermissions = require('../models/schoolPermissionsModel');
const School = require('../models/schoolModel');
const User = require('../models/userModel');

// @desc    Get school permissions for a specific school
// @route   GET /api/school-permissions/:schoolId
// @access  Private/SuperAdmin
const getSchoolPermissions = asyncHandler(async (req, res) => {
  try {
    const { schoolId } = req.params;
    
    // Validate school exists
    const school = await School.findById(schoolId);
    if (!school) {
      res.status(404);
      throw new Error('School not found');
    }
    
    // Get or create permissions for the school
    const permissions = await SchoolPermissions.getSchoolPermissions(schoolId);
    
    res.json({
      success: true,
      data: {
        school: {
          _id: school._id,
          name: school.name,
          emailDomain: school.emailDomain,
          active: school.active
        },
        permissions: permissions
      }
    });
    
  } catch (error) {
    console.error('Error getting school permissions:', error);
    res.status(500);
    throw new Error('Failed to get school permissions: ' + error.message);
  }
});

// @desc    Update school permissions for a specific school
// @route   PUT /api/school-permissions/:schoolId
// @access  Private/SuperAdmin
const updateSchoolPermissions = asyncHandler(async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { features } = req.body;
    
    // Validate school exists
    const school = await School.findById(schoolId);
    if (!school) {
      res.status(404);
      throw new Error('School not found');
    }
    
    // Validate features object
    if (!features || typeof features !== 'object') {
      res.status(400);
      throw new Error('Features object is required');
    }
    
    // Get available features to validate against
    const availableFeatures = SchoolPermissions.getAvailableFeatures();
    const validFeatureKeys = Object.keys(availableFeatures);
    
    // Validate that all provided features are valid
    for (const featureKey of Object.keys(features)) {
      if (!validFeatureKeys.includes(featureKey)) {
        res.status(400);
        throw new Error(`Invalid feature: ${featureKey}`);
      }
      
      if (typeof features[featureKey] !== 'boolean') {
        res.status(400);
        throw new Error(`Feature ${featureKey} must be a boolean value`);
      }
    }
    
    // Find existing permissions or create new ones
    let permissions = await SchoolPermissions.findOne({ school_id: schoolId });
    
    if (!permissions) {
      permissions = await SchoolPermissions.createDefaultPermissions(schoolId, req.user._id);
    }
    
    // Update the features
    permissions.features = {
      ...permissions.features,
      ...features
    };
    
    permissions.updatedBy = req.user._id;
    permissions.lastUpdated = new Date();
    
    await permissions.save();
    
    console.log(`School permissions updated for school ${schoolId} by user ${req.user._id}`);
    
    res.json({
      success: true,
      message: 'School permissions updated successfully',
      data: {
        school: {
          _id: school._id,
          name: school.name,
          emailDomain: school.emailDomain
        },
        permissions: permissions
      }
    });
    
  } catch (error) {
    console.error('Error updating school permissions:', error);
    res.status(500);
    throw new Error('Failed to update school permissions: ' + error.message);
  }
});

// @desc    Get permissions for the current user's school
// @route   GET /api/school-permissions/current
// @access  Private
const getCurrentSchoolPermissions = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    
    // Superadmin gets all permissions enabled
    if (user.role === 'superadmin') {
      const availableFeatures = SchoolPermissions.getAvailableFeatures();
      const allFeaturesEnabled = {};
      
      Object.keys(availableFeatures).forEach(feature => {
        allFeaturesEnabled[feature] = true;
      });
      
      res.json({
        success: true,
        data: {
          features: allFeaturesEnabled,
          isSuperAdmin: true
        }
      });
      return;
    }
    
    // Regular users need a schoolId
    if (!user.schoolId) {
      res.status(400);
      throw new Error('User is not associated with a school');
    }
    
    // Get permissions for the user's school
    const permissions = await SchoolPermissions.getSchoolPermissions(user.schoolId);
    
    res.json({
      success: true,
      data: {
        features: permissions.features,
        schoolId: user.schoolId,
        isSuperAdmin: false
      }
    });
    
  } catch (error) {
    console.error('Error getting current school permissions:', error);
    res.status(500);
    throw new Error('Failed to get current school permissions: ' + error.message);
  }
});

// @desc    Get all schools with their permissions (for superadmin)
// @route   GET /api/school-permissions/all
// @access  Private/SuperAdmin
const getAllSchoolPermissions = asyncHandler(async (req, res) => {
  try {
    // Get all schools
    const schools = await School.find({ active: true }).select('name emailDomain address active');
    
    // Get permissions for each school
    const schoolsWithPermissions = await Promise.all(
      schools.map(async (school) => {
        try {
          const permissions = await SchoolPermissions.getSchoolPermissions(school._id);
          return {
            _id: school._id,
            name: school.name,
            emailDomain: school.emailDomain,
            address: school.address,
            active: school.active,
            permissions: permissions
          };
        } catch (error) {
          console.error(`Error getting permissions for school ${school._id}:`, error);
          return {
            _id: school._id,
            name: school.name,
            emailDomain: school.emailDomain,
            address: school.address,
            active: school.active,
            permissions: null,
            error: error.message
          };
        }
      })
    );
    
    res.json({
      success: true,
      data: {
        schools: schoolsWithPermissions,
        totalSchools: schools.length
      }
    });
    
  } catch (error) {
    console.error('Error getting all school permissions:', error);
    res.status(500);
    throw new Error('Failed to get all school permissions: ' + error.message);
  }
});

// @desc    Fix school permissions (System Maintenance)
// @route   POST /api/school-permissions/fix
// @access  Private/SuperAdmin
const fixSchoolPermissions = asyncHandler(async (req, res) => {
  try {
    console.log('Starting school permissions fix process...');
    
    // Get all schools
    const schools = await School.find({});
    
    if (schools.length === 0) {
      res.json({
        success: true,
        message: 'No schools found to fix permissions for',
        data: {
          processed: 0,
          created: 0,
          errors: []
        }
      });
      return;
    }
    
    let created = 0;
    let processed = 0;
    const errors = [];
    
    // Process each school
    for (const school of schools) {
      try {
        processed++;
        console.log(`Processing school: ${school.name} (${school._id})`);
        
        // Check if permissions already exist
        const existingPermissions = await SchoolPermissions.findOne({ school_id: school._id });
        
        if (!existingPermissions) {
          // Create default permissions
          await SchoolPermissions.createDefaultPermissions(school._id, req.user._id);
          created++;
          console.log(`Created permissions for school: ${school.name}`);
        } else {
          console.log(`Permissions already exist for school: ${school.name}`);
        }
        
      } catch (error) {
        console.error(`Error processing school ${school.name}:`, error);
        errors.push({
          schoolId: school._id,
          schoolName: school.name,
          error: error.message
        });
      }
    }
    
    console.log(`School permissions fix completed. Processed: ${processed}, Created: ${created}, Errors: ${errors.length}`);
    
    res.json({
      success: true,
      message: `School permissions fix completed successfully. ${created} new permission records created.`,
      data: {
        processed,
        created,
        errors,
        totalSchools: schools.length
      }
    });
    
  } catch (error) {
    console.error('Error fixing school permissions:', error);
    res.status(500);
    throw new Error('Failed to fix school permissions: ' + error.message);
  }
});

// @desc    Get all available features list
// @route   GET /api/school-permissions/features
// @access  Private/SuperAdmin
const getAvailableFeatures = asyncHandler(async (req, res) => {
  try {
    console.log('Getting available features list...');
    
    // Get features from the model (returns an object)
    const featuresObj = SchoolPermissions.getAvailableFeatures();
    
    // Convert to array format for frontend
    const features = Object.keys(featuresObj).map(key => ({
      key: key,
      name: featuresObj[key]
    }));
    
    res.json({
      success: true,
      data: features,
      count: features.length
    });
    
  } catch (error) {
    console.error('Error getting available features:', error);
    res.status(500);
    throw new Error('Failed to get available features: ' + error.message);
  }
});

module.exports = {
  getSchoolPermissions,
  updateSchoolPermissions,
  getCurrentSchoolPermissions,
  getAllSchoolPermissions,
  fixSchoolPermissions,
  getAvailableFeatures
};
