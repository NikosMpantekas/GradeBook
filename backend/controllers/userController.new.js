const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const User = require('../models/userModel');
// Single database architecture - no need for multiDbConnect

// @desc    Register new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please add all fields');
  }
  
  // Extract email domain to determine school
  const emailDomain = email.includes('@') ? email.split('@')[1] : null;
  if (!emailDomain) {
    res.status(400);
    throw new Error('Invalid email format');
  }
  
  console.log(`User registration request for ${email} with domain ${emailDomain}`);
  
  // Special case for superadmin registration - always in main database
  if (role === 'superadmin') {
    console.log('Superadmin registration detected - using main database');
    
    // Check if user exists in main database
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create superadmin in main database
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'superadmin',
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
      throw new Error('Invalid user data');
    }
    
    return;
  }
  
  // For regular users, find the school based on email domain
  const school = await mongoose.model('School').findOne({ emailDomain });
  if (!school) {
    res.status(400);
    throw new Error('No school found for this email domain. Please use your school email address.');
  }
  
  // Check if user with same email already exists in the school
  const userExists = await User.findOne({ 
    email, 
    schoolId: school._id 
  });
  
  if (userExists) {
    res.status(400);
    throw new Error('User already exists in this school');
  }
  
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  // Create user with schoolId for multi-tenancy
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: role || 'student', // Default to student if role not specified
    schoolDomain: emailDomain,
    schoolId: school._id, // Set schoolId for multi-tenancy
    school: school._id, // Legacy field - keeping for compatibility
    active: true,
  });
  
  if (user) {
    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      schoolId: school._id,
      token: generateToken(user._id, school._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  console.log(`Login attempt for email: ${email}`);

  // Special handling for superadmin logins - always check by role
  const isSuperAdmin = await User.findOne({ email, role: 'superadmin' });
  
  if (isSuperAdmin) {
    console.log('Superadmin login attempt detected');
    
    // Verify superadmin password and login status
    if (isSuperAdmin.active === false) {
      console.log(`Superadmin account is disabled for email: ${email}`);
      res.status(403);
      throw new Error('Your account has been disabled. Please contact system administrator');
    }
    
    const isMatch = await bcrypt.compare(password, isSuperAdmin.password);
    if (!isMatch) {
      console.log('Invalid superadmin password');
      res.status(401);
      throw new Error('Invalid credentials');
    }
    
    // Update login timestamp
    isSuperAdmin.lastLogin = Date.now();
    isSuperAdmin.saveCredentials = req.body.saveCredentials || false;
    await isSuperAdmin.save();
    
    // Generate tokens for superadmin using the original format for backward compatibility
    // Don't use the schoolId parameter for superadmin to maintain original token structure
    const accessToken = jwt.sign({ id: isSuperAdmin._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });
    
    // Use the same secret for refresh token as the frontend expects
    const userRefreshToken = jwt.sign({ id: isSuperAdmin._id, type: 'refresh' }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });
    
    console.log('Generated superadmin token successfully');
    
    // Return superadmin user information with all fields expected by frontend
    return res.json({
      _id: isSuperAdmin.id,
      name: isSuperAdmin.name,
      email: isSuperAdmin.email,
      role: isSuperAdmin.role,
      token: accessToken,
      refreshToken: userRefreshToken,
      saveCredentials: isSuperAdmin.saveCredentials,
      // Add school-related fields that the frontend expects
      school: null,
      schoolId: null,
      schoolName: null,
      // Add empty arrays for collections the dashboard might check
      schools: [],
      directions: [],
      subjects: [],
      // Add darkMode property if the frontend uses it
      darkMode: isSuperAdmin.darkMode || false
    });
  }
  
  // For non-superadmin users, determine the school based on email domain
  const emailDomain = email.split('@')[1];
  if (!emailDomain) {
    console.log('Invalid email format');
    res.status(401);
    throw new Error('Invalid email format');
  }
  
  // Find the school associated with this email domain
  const school = await mongoose.model('School').findOne({ emailDomain });
  if (!school) {
    console.log(`No school found for email domain: ${emailDomain}`);
    res.status(401);
    throw new Error('Invalid email domain. Please use your school email address.');
  }
  
  // In the single-database architecture, we find the user directly with schoolId filter
  try {
    // Find the user with the matching email and schoolId
    console.log(`Looking for user with email ${email} in school ${school.name} (ID: ${school._id})`);
    const user = await User.findOne({ 
      email,
      schoolId: school._id
    });
    
    // If user not found
    if (!user) {
      console.log(`No user found with email ${email} in school ${school.name}`);
      res.status(401);
      throw new Error('Invalid credentials');
    }
    
    // Check if user account is active
    if (user.active === false) {
      console.log(`User account is disabled: ${email}`);
      res.status(403);
      throw new Error('Your account has been disabled. Please contact administrator');
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log(`Invalid password for user: ${email}`);
      res.status(401);
      throw new Error('Invalid credentials');
    }
    
    // Update login timestamp
    user.lastLogin = Date.now();
    user.saveCredentials = req.body.saveCredentials || false;
    await user.save();
    
    // Generate tokens with schoolId included for multi-tenancy
    const accessToken = generateToken(user._id, school._id);
    const userRefreshToken = generateRefreshToken(user._id, school._id);
    
    console.log(`User ${user.name} logged in successfully for school ${school.name}`);
    
    // Return user information with tokens
    return res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      schoolId: school._id,
      school: {
        _id: school._id,
        name: school.name
      },
      token: accessToken,
      refreshToken: userRefreshToken,
      saveCredentials: user.saveCredentials,
    });
    
  } catch (error) {
    console.error(`Login error: ${error.message}`);
    res.status(401);
    throw new Error(`Authentication failed: ${error.message}`);
  }
});

// @desc    Refresh access token using refresh token
// @route   POST /api/users/refresh-token
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: tokenFromRequest } = req.body;
  
  if (!tokenFromRequest) {
    res.status(400);
    throw new Error('Refresh token is required');
  }
  
  try {
    // Verify the refresh token
    const decoded = jwt.verify(tokenFromRequest, process.env.JWT_SECRET);
    
    // Check if it's actually a refresh token
    if (!decoded.type || decoded.type !== 'refresh') {
      res.status(401);
      throw new Error('Invalid refresh token');
    }
    
    // Find the user
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      res.status(401);
      throw new Error('User not found');
    }
    
    // Generate a new access token
    const newAccessToken = generateToken(user._id, decoded.schoolId);
    
    // Return both tokens
    res.json({
      accessToken: newAccessToken,
      refreshToken: tokenFromRequest // Return the same refresh token as it's still valid
    });
    
  } catch (error) {
    res.status(401);
    throw new Error('Invalid refresh token - ' + error.message);
  }
});

// @desc    Get user data
// @route   GET /api/users/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  // Find user and populate all reference fields
  const user = await User.findById(req.user.id)
    .select('-password')
    // Populate both old and new field names for maximum compatibility
    .populate('school', 'name')     // Old: Single school field (students)
    .populate('direction', 'name')  // Old: Single direction field (students)
    .populate('schools', 'name')    // New: Multiple schools array (teachers)
    .populate('directions', 'name') // New: Multiple directions array (teachers)
    .populate('subjects', 'name');  // Multiple subjects array (both roles)

  if (user) {
    res.status(200).json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.darkMode = req.body.darkMode !== undefined ? req.body.darkMode : user.darkMode;
    user.saveCredentials = req.body.saveCredentials !== undefined ? req.body.saveCredentials : user.saveCredentials;
    
    // Handle avatar update if provided
    if (req.body.avatar) {
      user.avatar = req.body.avatar;
    }
    
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      darkMode: updatedUser.darkMode,
      saveCredentials: updatedUser.saveCredentials,
      avatar: updatedUser.avatar,
      token: generateToken(updatedUser._id, updatedUser.schoolId),
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  console.log('getUsers endpoint called');
  
  try {
    let users = [];
    
    // Check if this is a request from a school-specific user
    if (req.school) {
      console.log(`Fetching users from school with ID: ${req.school._id}`);
      
      // In single-database architecture, we filter users by schoolId
      // Get all users for this school
      const rawUsers = await User.find({ schoolId: req.school._id })
        .select('-password')
        .populate('school', 'name')
        .populate('direction', 'name')
        .populate('subjects', 'name')
        .populate('schools', 'name')
        .populate('directions', 'name')
        .lean();
      
      console.log(`Found ${rawUsers.length} raw users in school database`);
      
      // Use the raw users directly since we're already using the main User model
      users = rawUsers;
    } else {
      // This is a superadmin or a user in the main database
      console.log('Fetching users from main database');
      // Get users with common fields populated
      users = await User.find({}).select('-password')
        .populate('school', 'name')
        .populate('direction', 'name')
        .populate('subjects', 'name')
        .populate('schools', 'name')
        .populate('directions', 'name')
        .lean();
    }
    
    // Process users to ensure consistent data structure
    const processedUsers = users.map(user => {
      // Convert to plain object or use as is
      const userData = user.toObject ? user.toObject() : user;
      
      // CRITICAL: Ensure all contact fields are present and have at least empty string values
      if (!userData.contact) {
        userData.contact = {};
      }
      
      // Make sure contact fields are never undefined
      const contactFields = [
        'mobilePhone', 'homePhone', 'address', 'city',
        'state', 'zipCode', 'emergencyContact', 'emergencyPhone'
      ];
      
      contactFields.forEach(field => {
        if (!userData.contact[field]) {
          userData.contact[field] = '';
        }
      });
      
      // Ensure school array for teachers even if empty
      if (userData.role === 'teacher' && !userData.schools) {
        userData.schools = [];
      }
      
      // Ensure directions array for teachers even if empty
      if (userData.role === 'teacher' && !userData.directions) {
        userData.directions = [];
      }
      
      // Ensure subjects array for teachers and students even if empty
      if ((userData.role === 'teacher' || userData.role === 'student') && !userData.subjects) {
        userData.subjects = [];
      }
      
      // Ensure proper structured school object for students
      if (userData.role === 'student') {
        if (!userData.school && userData.schoolId) {
          userData.school = { _id: userData.schoolId, name: 'Unknown School' };
        }
      }
      
      // Add secretary permissions if not present
      if (userData.role === 'secretary' && !userData.secretaryPermissions) {
        userData.secretaryPermissions = {
          canManageGrades: false,
          canSendNotifications: false,
          canManageUsers: false,
          canManageSubjects: false,
        };
      }
      
      return userData;
    });
    
    console.log(`Retrieved ${processedUsers.length} users`);
    res.status(200).json(processedUsers);
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500);
    throw new Error('Server error: ' + error.message);
  }
});

// Generate JWT
// Generate main access token (short-lived)
const generateToken = (id, schoolId = null) => {
  const payload = { id };
  if (schoolId) {
    payload.schoolId = schoolId;
  }
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

// Generate refresh token (longer-lived)
const generateRefreshToken = (id, schoolId = null) => {
  const payload = { id, type: 'refresh' };
  
  // Include schoolId in the token payload if provided
  if (schoolId) {
    payload.schoolId = schoolId;
  }
  
  // Use the same secret for refresh token
  // We only need the 'type' field to differentiate between token types
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '30d', // Refresh tokens typically have longer expiry
  });
};

// Export functions
module.exports = {
  registerUser,
  loginUser,
  refreshToken,
  getMe,
  updateProfile,
  getUsers,
  generateToken,
  generateRefreshToken
};
