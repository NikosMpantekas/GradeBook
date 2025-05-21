const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const School = require('../models/schoolModel');
const { connectToSchoolDb, getSchoolConnection } = require('../config/multiDbConnect');
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
    // Convert school name to valid database name (lowercase, no spaces, etc.)
    const dbName = schoolName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Create database configuration using the schoolName as the database name
    const dbConfig = {
      // Use the school name as the database name
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

    // Create admin user for the school
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin', // School owner is an admin
      schoolDomain: emailDomain,
      active: true,
      school: school._id, // Link to the school
    });

    if (user) {
      // Always connect to and create the school's database
      try {
        const connection = await connectToSchoolDb(school);
        console.log(`Created and connected to database for school: ${schoolName} (${dbName})`);
        
        // Create initial user in school's database (same as the admin we just created)
        // This allows the admin to login to their own school's system
        const SchoolUser = connection.model('User', mongoose.Schema({
          name: { type: String, required: true },
          email: { type: String, required: true, unique: true },
          password: { type: String, required: true },
          role: { type: String, required: true, default: 'admin' },
          active: { type: Boolean, default: true },
          schoolDomain: { type: String },
        }, { timestamps: true }));
        
        await SchoolUser.create({
          name: user.name,
          email: user.email,
          password: user.password, // Already hashed
          role: 'admin',
          active: true,
          schoolDomain: emailDomain
        });
        
        console.log(`Created initial admin user in school database: ${schoolName}`);
      } catch (error) {
        console.error(`Error setting up school database: ${error.message}`);
        // Continue anyway, as we can retry database setup later
      }

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

module.exports = {
  createSchoolOwner,
  getSchoolOwners,
  getSchoolOwnerById,
  updateSchoolOwnerStatus,
  createFirstSuperAdmin,
};
