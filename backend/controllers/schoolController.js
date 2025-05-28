const asyncHandler = require('express-async-handler');
const School = require('../models/schoolModel');

// @desc    Create a new school branch
// @route   POST /api/schools
// @access  Private/Admin
const createSchool = asyncHandler(async (req, res) => {
  const { 
    name, 
    address, 
    phone, 
    email, 
    website, 
    logo, 
    schoolDomain, 
    emailDomain,
    parentCluster,
    isClusterSchool,
    branchDescription 
  } = req.body;

  if (!name || !address) {
    res.status(400);
    throw new Error('Please provide school branch name and address');
  }
  
  // Prepare the school domain (brand name) - if not provided, derive from name
  const sanitizedSchoolDomain = schoolDomain || name.toLowerCase().replace(/\s+/g, '');
  
  // Set a default email domain if not provided
  const sanitizedEmailDomain = emailDomain || `${sanitizedSchoolDomain}.edu`;

  // Check if school branch already exists with this name
  const schoolExists = await School.findOne({ name });

  if (schoolExists) {
    res.status(400);
    throw new Error('School branch already exists with this name');
  }

  // Create the school branch
  const school = await School.create({
    name,
    address,
    phone,
    email,
    website,
    logo,
    schoolDomain: sanitizedSchoolDomain,
    emailDomain: sanitizedEmailDomain,
    parentCluster: parentCluster || null,
    isClusterSchool: isClusterSchool || false,
    branchDescription: branchDescription || '',
  });

  if (school) {
    res.status(201).json(school);
  } else {
    res.status(400);
    throw new Error('Invalid school data');
  }
});

// @desc    Get all schools/branches belonging to admin's domain
// @route   GET /api/schools
// @access  Private/Admin
const getSchools = asyncHandler(async (req, res) => {
  console.log('getSchools endpoint called');
  
  try {
    let schools = [];
    
    // Allow access for both req.user and req.school (handles both auth methods)
    if (!req.user && !req.school) {
      res.status(401);
      throw new Error('Not authorized to access school branches');
    }
    
    // Determine which schools to fetch based on user role
    if (req.user.role === 'superadmin') {
      // Superadmin can see all schools
      console.log('Fetching all schools for superadmin');
      schools = await School.find({});
    } 
    else if (req.user.role === 'admin') {
      // Get the admin's email domain to filter schools
      const adminEmailParts = req.user.email.split('@');
      if (adminEmailParts.length !== 2) {
        res.status(400);
        throw new Error('Invalid admin email format');
      }
      
      const adminDomain = adminEmailParts[1];
      console.log(`Filtering schools for admin with domain: ${adminDomain}`);
      
      // Find schools that match the admin's domain
      // This ensures admins only see schools belonging to their domain
      schools = await School.find({
        $or: [
          { emailDomain: adminDomain },
          { schoolDomain: adminDomain.split('.')[0] } // Match domain without TLD
        ]
      });
      
      console.log(`Found ${schools.length} schools for admin domain: ${adminDomain}`);
    }
    else if (req.user.role === 'secretary' && req.user.secretaryPermissions?.canManageSchools) {
      // Secretary with school management permission - same filtering as admin
      const secretaryEmailParts = req.user.email.split('@');
      if (secretaryEmailParts.length !== 2) {
        res.status(400);
        throw new Error('Invalid secretary email format');
      }
      
      const secretaryDomain = secretaryEmailParts[1];
      console.log(`Filtering schools for secretary with domain: ${secretaryDomain}`);
      
      schools = await School.find({
        $or: [
          { emailDomain: secretaryDomain },
          { schoolDomain: secretaryDomain.split('.')[0] }
        ]
      });
    }
    else if (req.school) {
      // In single-database architecture, just return the user's school
      console.log(`Fetching school with ID: ${req.school._id}`);
      
      // For a school-specific user, just return their own school
      const school = await School.findById(req.school._id);
      
      if (school) {
        schools = [school];
      }
    }
    else {
      // For other roles, return no schools
      console.log('User not authorized to view schools');
      schools = [];
    }
    
    console.log(`Retrieved ${schools.length} schools`);
    res.status(200).json(schools);
  } catch (error) {
    console.error('Error fetching schools:', error.message);
    res.status(500);
    throw new Error('Server error: ' + error.message);
  }
});

// @desc    Get a specific school
// @route   GET /api/schools/:id
// @access  Public
const getSchoolById = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id);

  if (school) {
    res.status(200).json(school);
  } else {
    res.status(404);
    throw new Error('School not found');
  }
});

// @desc    Update a school
// @route   PUT /api/schools/:id
// @access  Private/Admin
const updateSchool = asyncHandler(async (req, res) => {
  // Validate that id is provided and not undefined
  if (!req.params.id || req.params.id === 'undefined') {
    res.status(400);
    throw new Error('School ID is required');
  }

  const school = await School.findById(req.params.id);

  if (!school) {
    res.status(404);
    throw new Error('School not found');
  }

  // Update fields
  const updatedSchool = await School.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json(updatedSchool);
});

// @desc    Delete a school
// @route   DELETE /api/schools/:id
// @access  Private/Admin
const deleteSchool = asyncHandler(async (req, res) => {
  // Find school first to verify it exists
  const school = await School.findById(req.params.id);

  if (!school) {
    res.status(404);
    throw new Error('School not found');
  }
  
  // Use findByIdAndDelete instead of remove() method
  await School.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: 'School branch removed' });
});

module.exports = {
  createSchool,
  getSchools,
  getSchoolById,
  updateSchool,
  deleteSchool,
};
