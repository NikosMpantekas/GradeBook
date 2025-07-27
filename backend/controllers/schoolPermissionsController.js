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
    console.log('🔍 [SchoolPermissions] Getting all schools with permissions for superadmin...');
    
    // CRITICAL: Get ONLY main schools, NOT branches 
    // Main schools have non-empty dbConfig.dbName, branches have empty or missing dbName
    const schools = await School.find({
      $and: [
        { dbConfig: { $exists: true } },
        { 'dbConfig.dbName': { $exists: true, $ne: '', $ne: null, $regex: /.+/ } }
      ]
    }).lean();
    
    // ADDITIONAL FILTERING: Remove any schools with empty dbName that slipped through
    const mainSchools = schools.filter(school => {
      const hasValidDbName = school.dbConfig?.dbName && 
                            typeof school.dbConfig.dbName === 'string' && 
                            school.dbConfig.dbName.trim().length > 0;
      
      if (!hasValidDbName) {
        console.log(`🚫 [SchoolPermissions] Filtered out branch: ${school.name} (dbName: '${school.dbConfig?.dbName}')`);
        return false;
      }
      return true;
    });
    
    console.log(`📊 [SchoolPermissions] Found ${mainSchools.length} MAIN schools (filtered out ${schools.length - mainSchools.length} branches)`);
    
    // Log details about what we found
    mainSchools.forEach(school => {
      console.log(`🏫 [SchoolPermissions] Main school: ${school.name} (dbName: ${school.dbConfig?.dbName})`);
    });
    
    if (mainSchools.length === 0) {
      console.log('⚠️ [SchoolPermissions] No MAIN schools found in database');
      res.json({
        success: true,
        message: 'No main schools found',
        data: { schools: [] }
      });
      return;
    }
    
    // Get permissions for each MAIN school only
    const schoolsWithPermissions = [];
    const errors = [];
    
    for (const school of mainSchools) {
      try {
        console.log(`🏫 [SchoolPermissions] Processing school: ${school.name} (${school._id})`);
        
        // CRITICAL FIX: Validate school._id before using it
        if (!school._id) {
          console.error(`❌ [SchoolPermissions] School has invalid ID: ${school.name}`);
          errors.push({ schoolName: school.name, error: 'Invalid school ID' });
          continue;
        }
        
        // Get or create permissions for this school
        const permissions = await SchoolPermissions.getSchoolPermissions(school._id);
        
        if (!permissions) {
          console.log(`🆕 [SchoolPermissions] Creating default permissions for ${school.name}`);
          await SchoolPermissions.createDefaultPermissions(school._id);
          const newPermissions = await SchoolPermissions.getSchoolPermissions(school._id);
          
          schoolsWithPermissions.push({
            school: {
              _id: school._id,
              name: school.name,
              emailDomain: school.emailDomain,
              active: school.active
            },
            permissions: newPermissions
          });
        } else {
          schoolsWithPermissions.push({
            school: {
              _id: school._id,
              name: school.name,
              emailDomain: school.emailDomain,
              active: school.active
            },
            permissions: permissions
          });
        }
        
        console.log(`✅ [SchoolPermissions] Successfully processed ${school.name}`);
        
      } catch (error) {
        console.error(`💥 [SchoolPermissions] Error processing school ${school.name}:`, error.message);
        errors.push({ 
          schoolName: school.name, 
          schoolId: school._id,
          error: error.message 
        });
        // Continue with other schools even if one fails
      }
    }
    
    console.log(`🎉 [SchoolPermissions] Completed processing. Success: ${schoolsWithPermissions.length}, Errors: ${errors.length}`);
    
    res.json({
      success: true,
      data: {
        schools: schoolsWithPermissions,
        totalSchools: schools.length,
        processedSchools: schoolsWithPermissions.length,
        errors: errors.length > 0 ? errors : undefined
      }
    });
    
  } catch (error) {
    console.error('💥 [SchoolPermissions] Critical error getting all school permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get school permissions',
      error: error.message
    });
  }
});

// @desc    Fix school permissions (System Maintenance)
// @route   POST /api/school-permissions/fix
// @access  Private/SuperAdmin
const fixSchoolPermissions = asyncHandler(async (req, res) => {
  try {
    console.log('Starting school permissions fix process...');
    
    // CRITICAL: Get ONLY main schools, NOT branches!
    // Main schools have non-empty dbConfig.dbName, branches have empty or missing dbName
    const schools = await School.find({
      $and: [
        { dbConfig: { $exists: true } },
        { 'dbConfig.dbName': { $exists: true, $ne: '', $ne: null, $regex: /.+/ } }
      ]
    });
    
    // ADDITIONAL FILTERING: Remove any schools with empty dbName that slipped through
    const mainSchools = schools.filter(school => {
      const hasValidDbName = school.dbConfig?.dbName && 
                            typeof school.dbConfig.dbName === 'string' && 
                            school.dbConfig.dbName.trim().length > 0;
      
      if (!hasValidDbName) {
        console.log(`🚫 [SchoolPermissions] Filtered out branch: ${school.name} (dbName: '${school.dbConfig?.dbName}')`);
        return false;
      }
      return true;
    });
    
    console.log(`📊 [SchoolPermissions] Found ${mainSchools.length} MAIN schools for permissions fix (filtered out ${schools.length - mainSchools.length} branches)`);
    
    // Log which schools we're processing
    mainSchools.forEach(school => {
      console.log(`🏫 [SchoolPermissions] Will fix: ${school.name} (dbName: ${school.dbConfig?.dbName})`);
    });
    
    if (mainSchools.length === 0) {
      console.log('⚠️ [SchoolPermissions] No MAIN schools found to fix permissions for');
      res.json({
        success: true,
        message: 'No main schools found to fix permissions for',
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
    
    // Process each MAIN school only
    for (const school of mainSchools) {
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
