const asyncHandler = require('express-async-handler');
const School = require('../models/schoolModel');

// @desc    Create a new school
// @route   POST /api/schools
// @access  Private/Admin
const createSchool = asyncHandler(async (req, res) => {
  const { name, address, phone, email, website, logo } = req.body;

  if (!name || !address) {
    res.status(400);
    throw new Error('Please provide name and address');
  }

  // Check if school already exists
  const schoolExists = await School.findOne({ name });

  if (schoolExists) {
    res.status(400);
    throw new Error('School already exists');
  }

  const school = await School.create({
    name,
    address,
    phone,
    email,
    website,
    logo,
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
      // Superadmin can see all schools from the main database
      console.log('Fetching all schools for superadmin');
      schools = await School.find({});
    } 
    // Check if this is a school-specific user
    else if (req.school) {
      // For school users, just return their own school
      console.log(`Fetching school info for: ${req.school.name}`);
      schools = [req.school];
    } 
    // Fallback to main database for backward compatibility
    else {
      console.log('Fetching schools from main database');
      schools = await School.find({}).sort({ name: 1 });
      
      // Enhanced logging to help debug the missing schools issue
      console.log(`Found ${schools.length} schools in main database:`);
      schools.forEach(school => {
        console.log(`- School: ${school.name} (ID: ${school._id})`);
      });
    }
    
    console.log('Returning schools to client');
    res.status(200).json(schools);
  } catch (error) {
    console.error('Error fetching schools:', error.message);
    res.status(500);
    throw new Error('Server error: ' + error.message);
  }
});

// @desc    Get school by ID
// @route   GET /api/schools/:id
// @access  Public
const getSchoolById = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id);

  if (school) {
    res.json(school);
  } else {
    res.status(404);
    throw new Error('School not found');
  }
});

// @desc    Update school
// @route   PUT /api/schools/:id
// @access  Private/Admin
const updateSchool = asyncHandler(async (req, res) => {
  const { name, address, phone, email, website, logo } = req.body;

  const school = await School.findById(req.params.id);

  if (school) {
    school.name = name || school.name;
    school.address = address || school.address;
    school.phone = phone || school.phone;
    school.email = email || school.email;
    school.website = website || school.website;
    school.logo = logo || school.logo;

    const updatedSchool = await school.save();
    res.json(updatedSchool);
  } else {
    res.status(404);
    throw new Error('School not found');
  }
});

// @desc    Delete school
// @route   DELETE /api/schools/:id
// @access  Private/Admin
const deleteSchool = asyncHandler(async (req, res) => {
  const school = await School.findById(req.params.id);

  if (school) {
    await school.deleteOne();
    res.json({ message: 'School removed' });
  } else {
    res.status(404);
    throw new Error('School not found');
  }
});

module.exports = {
  createSchool,
  getSchools,
  getSchoolById,
  updateSchool,
  deleteSchool,
};
