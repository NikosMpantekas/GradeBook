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

// @desc    Get all schools
// @route   GET /api/schools
// @access  Public
const getSchools = asyncHandler(async (req, res) => {
  console.log('getSchools endpoint called');
  
  try {
    let schools = [];
    
    // Check if this is a request from a superadmin
    if (req.user && req.user.role === 'superadmin') {
      // Superadmin can see all schools from the database
      console.log('Fetching all schools for superadmin');
      
      // CRITICAL: Apply PERMANENT FIXED FILTER to remove cluster/primary schools
      // This ensures primary schools used for database assignment don't appear in the school list
      // We use a strict multi-condition filter to guarantee cluster schools never appear
      const filter = { 
        $and: [
          // First, explicitly filter out by isClusterSchool flag
          { $or: [
              { isClusterSchool: { $exists: false } }, // If flag doesn't exist
              { isClusterSchool: { $ne: true } }       // Or if flag is not true
          ]},
          // Second, filter out by name patterns (absolute block for clusters)
          { name: { $not: { $regex: /primary|cluster|general|main|central|district|organization/i } } },
          // Third, filter out any name shorter than 5 chars (likely an acronym for a district)
          { $expr: { $gt: [{ $strLenCP: "$name" }, 4] } }
        ]
      };
      
      console.log('FIXED: Applying strict cluster school filter:', JSON.stringify(filter));
      schools = await School.find(filter);
      console.log(`FIXED: After filtering, returning ${schools.length} genuine schools (no clusters)`);
    } 
    // Check if this is a school-specific user
    else if (req.school) {
      // In single-database architecture, just return the user's school
      console.log(`Fetching school with ID: ${req.school._id}`);
      
      // For a school-specific user, just return their own school
      const school = await School.findById(req.school._id);
      
      if (school) {
        schools = [school];
      }
    } else {
      // Public access - return basic school info for public display
      console.log('Fetching basic school info for public access');
      schools = await School.find({}).select('name address website logo');
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
  const school = await School.findById(req.params.id);

  if (!school) {
    res.status(404);
    throw new Error('School not found');
  }

  await school.remove();
  res.status(200).json({ message: 'School removed' });
});

module.exports = {
  createSchool,
  getSchools,
  getSchoolById,
  updateSchool,
  deleteSchool,
};
