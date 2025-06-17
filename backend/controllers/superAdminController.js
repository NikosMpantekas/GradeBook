const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const School = require('../models/schoolModel');
const jwt = require('jsonwebtoken');

// @desc    Create a new school owner (admin)
// @route   POST /api/superadmin/create-school-owner
// @access  Private/SuperAdmin
const createSchoolOwner = asyncHandler(async (req, res) => {
  const { name, email, password, schoolName, schoolAddress, schoolEmail, emailDomain } = req.body;

  if (!name || !email || !password || !schoolName || !schoolAddress || !emailDomain) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Check if domain is valid format
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
  if (!domainRegex.test(emailDomain)) {
    res.status(400);
    throw new Error('Please provide a valid email domain (e.g., school.com)');
  }

  // Check if school with email domain already exists
  const schoolExists = await School.findOne({ emailDomain });
  if (schoolExists) {
    res.status(400);
    throw new Error('School with this email domain already exists');
  }

  // Check if user with email already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User with this email already exists');
  }

  try {
    // CRITICAL FIX: Extract database name from email domain (schoolclustername.com -> schoolclustername)
    // This ensures users with @schoolclustername.com emails connect to the correct database
    const domainParts = emailDomain.split('.');
    const dbName = domainParts[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    console.log(`Creating database with name derived from domain: ${emailDomain} -> ${dbName}`);
    
    // Create database configuration using the domain name as the database name
    const dbConfig = {
      // Use the domain prefix as the database name
      dbName: dbName
    };
    
    // Create school first
    const school = await School.create({
      name: schoolName,
      address: schoolAddress,
      email: schoolEmail || email, // Use provided school email or fallback to admin email
      emailDomain,
      dbConfig: dbConfig, // Store the database configuration
      active: true,
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin user for the school with schoolId for multi-tenancy
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin', // School owner is an admin
      schoolDomain: emailDomain,
      active: true,
      school: school._id, // Legacy field - keeping for compatibility
      schoolId: school._id, // New field for multi-tenancy
    });

    if (user) {
      // In single-database architecture, we don't need to set up a separate database
      // Just log that the school and user were created successfully
      console.log(`Created school ${schoolName} with ID ${school._id}`);
      console.log(`Created school admin user with email ${email} and schoolId ${school._id}`);
      
      // Note about the migration
      console.log(`IMPORTANT: No additional database setup required with new single-database architecture`)

      res.status(201).json({
        message: 'School owner created successfully',
        user: {
          _id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        school: {
          _id: school.id,
          name: school.name,
          emailDomain: school.emailDomain,
        },
      });
    } else {
      // If user creation failed, delete the school to maintain consistency
      await School.findByIdAndDelete(school._id);
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    res.status(400);
    throw new Error(`Failed to create school owner: ${error.message}`);
  }
});

// @desc    Get all school owners (admins)
// @route   GET /api/superadmin/school-owners
// @access  Private/SuperAdmin
const getSchoolOwners = asyncHandler(async (req, res) => {
  // Find all admin users with their associated schools
  const schoolOwners = await User.find({ role: 'admin' })
    .select('-password')
    .populate('school', 'name address email emailDomain active');

  res.status(200).json(schoolOwners);
});

// @desc    Get school owner by ID
// @route   GET /api/superadmin/school-owners/:id
// @access  Private/SuperAdmin
const getSchoolOwnerById = asyncHandler(async (req, res) => {
  const schoolOwner = await User.findById(req.params.id)
    .select('-password')
    .populate('school', 'name address email emailDomain active dbConfig');

  if (!schoolOwner) {
    res.status(404);
    throw new Error('School owner not found');
  }

  res.status(200).json(schoolOwner);
});

// @desc    Update school owner status (enable/disable)
// @route   PUT /api/superadmin/school-owners/:id/status
// @access  Private/SuperAdmin
const updateSchoolOwnerStatus = asyncHandler(async (req, res) => {
  const { active } = req.body;

  if (active === undefined) {
    res.status(400);
    throw new Error('Please provide active status');
  }

  const user = await User.findById(req.params.id);

  if (!user || user.role !== 'admin') {
    res.status(404);
    throw new Error('School owner not found');
  }

  // Update user active status
  user.active = active;
  await user.save();

  // Also update the school's active status
  if (user.school) {
    const school = await School.findById(user.school);
    if (school) {
      school.active = active;
      await school.save();
    }
  }

  res.status(200).json({
    message: `School owner ${active ? 'enabled' : 'disabled'} successfully`,
    _id: user.id,
    name: user.name,
    active: user.active,
  });
});

// @desc    Create a first superadmin account (temporary endpoint for setup)
// @route   POST /api/superadmin/create-first-superadmin
// @access  Public (but checks for existing superadmins)
const createFirstSuperAdmin = asyncHandler(async (req, res) => {
  // Check if any superadmin already exists
  const superAdminExists = await User.findOne({ role: 'superadmin' });

  if (superAdminExists) {
    res.status(400);
    throw new Error('A superadmin account already exists');
  }

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please add all fields');
  }

  // Check if user exists with this email
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create superadmin user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'superadmin',
    active: true,
  });

  if (user) {
    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid superadmin data');
  }
});

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Delete a school owner (admin)
// @route   DELETE /api/superadmin/school-owners/:id
// @access  Private/SuperAdmin
const deleteSchoolOwner = asyncHandler(async (req, res) => {
  try {
    // Find the school owner by ID
    const schoolOwner = await User.findById(req.params.id);

    if (!schoolOwner) {
      res.status(404);
      throw new Error('School owner not found');
    }

    // Verify that the user is an admin (school owner)
    if (schoolOwner.role !== 'admin') {
      res.status(400);
      throw new Error('User is not a school owner');
    }

    // Find the associated school
    const school = await School.findById(schoolOwner.school);
    
    if (!school) {
      console.log('Warning: School not found for this owner, proceeding with deletion anyway');
    } else {
      console.log(`Found associated school: ${school.name}`);
      
      // We could optionally disable the school here but we'll keep it 
      // in case there are other admins or it needs to be reassigned
      console.log(`School ${school.name} will remain in the system`);
    }

    // Delete the school owner
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ 
      message: 'School owner deleted successfully',
      id: req.params.id
    });
  } catch (error) {
    console.error('Error deleting school owner:', error.message);
    res.status(500);
    throw new Error('Failed to delete school owner: ' + error.message);
  }
});

// @desc    Update school owner permissions
// @route   PUT /api/superadmin/school-owner/:id/permissions
// @access  Private/SuperAdmin
const updateSchoolOwnerPermissions = asyncHandler(async (req, res) => {
  const { permissions } = req.body;

  if (!permissions) {
    res.status(400);
    throw new Error('Please provide permissions to update');
  }

  const user = await User.findById(req.params.id);

  if (!user || user.role !== 'admin') {
    res.status(404);
    throw new Error('School owner not found');
  }

  console.log(`PERMISSIONS: Updating school owner ${user.name} (${user._id}) permissions:`, {
    current: user.adminPermissions || 'none',
    requested: permissions
  });

  // Initialize adminPermissions if it doesn't exist
  if (!user.adminPermissions) {
    user.adminPermissions = {
      canManageGrades: true,
      canSendNotifications: true,
      canManageUsers: true,
      canManageSchools: true,
      canManageDirections: true,
      canManageSubjects: true,
      canAccessReports: true,
      canManageEvents: true
    };
  }

  // Update admin permissions
  user.adminPermissions = {
    ...user.adminPermissions,
    ...permissions
  };

  await user.save();
  console.log(`PERMISSIONS: Updated school owner ${user.name} permissions:`, user.adminPermissions);

  // Also update the school's feature permissions if school ID exists
  if (user.schoolId || user.school) {
    const schoolId = user.schoolId || user.school;
    const updateResult = await updateSchoolFeaturePermissionsFromAdmin(schoolId, permissions);
    console.log(`PERMISSIONS: School features update result:`, updateResult);
  } else {
    console.warn(`PERMISSIONS: School owner ${user.name} has no associated school`);
  }

  // Update all other admin users with the same school to have matching permissions
  if (user.schoolId || user.school) {
    const schoolId = user.schoolId || user.school;
    
    try {
      // Find other admin users with the same school
      const otherAdmins = await User.find({
        _id: { $ne: user._id }, // Exclude the current user
        role: 'admin',
        $or: [
          { schoolId: schoolId },
          { school: schoolId }
        ]
      });
      
      if (otherAdmins.length > 0) {
        console.log(`PERMISSIONS: Found ${otherAdmins.length} other admins to sync permissions with`);
        
        // Update each admin's permissions
        for (const admin of otherAdmins) {
          // Initialize adminPermissions if it doesn't exist
          admin.adminPermissions = admin.adminPermissions || {};
          
          // Update only the permissions that were changed
          for (const [key, value] of Object.entries(permissions)) {
            admin.adminPermissions[key] = value;
          }
          
          await admin.save();
          console.log(`PERMISSIONS: Synced permissions for admin ${admin.name} (${admin._id})`);
        }
      }
    } catch (error) {
      console.error(`PERMISSIONS: Error syncing other admins' permissions:`, error.message);
    }
  }

  res.status(200).json({
    message: 'School owner permissions updated successfully. These permissions will apply to all users in the school.',
    _id: user.id,
    name: user.name,
    adminPermissions: user.adminPermissions,
  });
});

// Helper function to update school feature permissions based on admin permissions
const updateSchoolFeaturePermissionsFromAdmin = async (schoolId, adminPermissions) => {
  try {
    const school = await School.findById(schoolId);
    if (!school) {
      console.error(`PERMISSIONS: School not found with ID: ${schoolId}`);
      return { success: false, reason: 'school-not-found' };
    }

    console.log(`PERMISSIONS: Updating school ${school.name} (${school._id}) from admin permissions`);

    // Initialize featurePermissions if it doesn't exist
    if (!school.featurePermissions) {
      school.featurePermissions = {
        enableNotifications: true,
        enableGrades: true,
        enableRatingSystem: true,
        enableCalendar: true,
        enableStudentProgress: true
      };
    }

    let isUpdated = false;
    const previousPermissions = { ...school.featurePermissions };
    
    // Map admin permissions to school feature permissions
    if (adminPermissions.canSendNotifications !== undefined) {
      school.featurePermissions.enableNotifications = adminPermissions.canSendNotifications;
      isUpdated = true;
    }
    
    if (adminPermissions.canManageGrades !== undefined) {
      school.featurePermissions.enableGrades = adminPermissions.canManageGrades;
      isUpdated = true;
    }

    if (adminPermissions.canManageEvents !== undefined) {
      school.featurePermissions.enableCalendar = adminPermissions.canManageEvents;
      isUpdated = true;
    }

    if (adminPermissions.canAccessReports !== undefined) {
      school.featurePermissions.enableRatingSystem = adminPermissions.canAccessReports;
      school.featurePermissions.enableStudentProgress = adminPermissions.canAccessReports;
      isUpdated = true;
    }

    // Only save if there are changes
    if (isUpdated) {
      await school.save();
      console.log(`PERMISSIONS: Updated school ${school.name} feature permissions:`, {
        before: previousPermissions,
        after: school.featurePermissions
      });
      return { 
        success: true, 
        school: school.name, 
        previousPermissions,
        currentPermissions: school.featurePermissions
      };
    }
    
    return { success: true, message: 'No changes needed' };
  } catch (error) {
    console.error('PERMISSIONS: Error updating school feature permissions:', error.message);
    return { success: false, error: error.message };
  }
};

// @desc    Update school feature permissions directly
// @route   PUT /api/superadmin/schools/:id/features
// @access  Private/SuperAdmin
const updateSchoolFeaturePermissions = asyncHandler(async (req, res) => {
  const { features } = req.body;
  const { id } = req.params;

  if (!features) {
    res.status(400);
    throw new Error('Please provide feature settings to update');
  }

  // Find the school
  const school = await School.findById(id);
  if (!school) {
    res.status(404);
    throw new Error('School not found');
  }

  // Detailed logging before update
  const previousPermissions = { ...school.featurePermissions };
  console.log(`PERMISSIONS: Updating school ${school.name} (${school._id}) features:`, {
    current: previousPermissions || 'none',
    requested: features
  });

  // Initialize featurePermissions if it doesn't exist
  if (!school.featurePermissions) {
    school.featurePermissions = {
      enableNotifications: true,
      enableGrades: true,
      enableRatingSystem: true,
      enableCalendar: true,
      enableStudentProgress: true
    };
  }

  // Update school feature permissions
  school.featurePermissions = {
    ...school.featurePermissions,
    ...features
  };

  await school.save();
  
  console.log(`PERMISSIONS: Updated school ${school.name} features:`, {
    before: previousPermissions || 'none',
    after: school.featurePermissions
  });

  // Find all admin users associated with this school to update their permission flags too
  const schoolAdmins = await User.find({
    role: 'admin',
    $or: [
      { schoolId: school._id },
      { school: school._id }
    ]
  });

  console.log(`PERMISSIONS: Found ${schoolAdmins.length} admin users to update for school ${school.name}`);

  // Update each school admin's permissions
  for (const admin of schoolAdmins) {
    // Initialize adminPermissions if it doesn't exist
    admin.adminPermissions = admin.adminPermissions || {};
    let adminUpdated = false;
    
    // Map school feature permissions to admin permissions
    if (features.enableNotifications !== undefined) {
      admin.adminPermissions.canSendNotifications = features.enableNotifications;
      adminUpdated = true;
    }
    
    if (features.enableGrades !== undefined) {
      admin.adminPermissions.canManageGrades = features.enableGrades;
      adminUpdated = true;
    }
    
    if (features.enableCalendar !== undefined) {
      admin.adminPermissions.canManageEvents = features.enableCalendar;
      adminUpdated = true;
    }
    
    if (features.enableRatingSystem !== undefined) {
      admin.adminPermissions.canAccessReports = features.enableRatingSystem;
      adminUpdated = true;
    }

    if (features.enableStudentProgress !== undefined && admin.adminPermissions.canAccessReports !== features.enableStudentProgress) {
      // Only override reports access if rating system wasn't already set
      if (features.enableRatingSystem === undefined) {
        admin.adminPermissions.canAccessReports = features.enableStudentProgress;
        adminUpdated = true;
      }
    }
    
    if (adminUpdated) {
      await admin.save();
      console.log(`PERMISSIONS: Updated admin ${admin.name} (${admin._id}) permissions to match school settings`);
    }
  }

  res.status(200).json({
    message: 'School feature permissions updated successfully. These features will apply to all users in the school.',
    _id: school._id,
    name: school.name,
    featurePermissions: school.featurePermissions,
    adminsUpdated: schoolAdmins.length
  });
});

module.exports = {
  createSchoolOwner,
  getSchoolOwners,
  getSchoolOwnerById,
  updateSchoolOwnerStatus,
  deleteSchoolOwner,
  createFirstSuperAdmin,
  updateSchoolOwnerPermissions,
  updateSchoolFeaturePermissions,
};
