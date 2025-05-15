const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

// @desc    Register new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please add all fields');
  }

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: role || 'student', // Default role is student
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
});

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  console.log(`Login attempt for email: ${email}`);

  // Check for user email
  const user = await User.findOne({ email });
  
  if (!user) {
    console.log(`User not found for email: ${email}`);
    res.status(401);
    throw new Error('Invalid credentials - user not found');
  }
  
  console.log(`User found: ${user.name}, role: ${user.role}, password length: ${user.password.length}`);
  
  try {
    // Attempt password match
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`Direct bcrypt comparison for ${email}: ${isMatch}`);
    
    if (isMatch) {
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        darkMode: user.darkMode,
        saveCredentials: user.saveCredentials,
        token: generateToken(user._id),
      });
    } else {
      console.log(`Password didn't match for ${email}`);
      res.status(401);
      throw new Error('Invalid credentials - password mismatch');
    }
  } catch (error) {
    console.error(`Login error for ${email}:`, error.message);
    res.status(401);
    throw new Error(error.message || 'Invalid credentials');
  }
});

// @desc    Get user data
// @route   GET /api/users/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');

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
      token: generateToken(updatedUser._id),
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
  const users = await User.find({}).select('-password');
  res.json(users);
});

// @desc    Get user by ID (admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user (admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    
    if (req.body.school) {
      user.school = req.body.school;
    }
    
    if (req.body.direction) {
      user.direction = req.body.direction;
    }
    
    if (req.body.subjects) {
      user.subjects = req.body.subjects;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      school: updatedUser.school,
      direction: updatedUser.direction,
      subjects: updatedUser.subjects,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Delete user (admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    await user.deleteOne();
    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Create a first admin account (temporary endpoint for setup)
// @route   POST /api/users/create-admin
// @access  Public
const createAdminAccount = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please add all fields');
  }

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create admin user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'admin', // Force admin role
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
});

// @desc    Create user by admin
// @route   POST /api/users/admin/create
// @access  Private/Admin
const createUserByAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  console.log('Admin creating user:', { name, email, role, passwordLength: password ? password.length : 0 });

  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error('Please add all fields');
  }

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  try {
    // IMPORTANT: Direct password hashing - bypassing the model middleware
    // Generate salt and hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Generated hashed password length:', hashedPassword.length);
    
    // Create a new user document directly with the hashed password
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });
    
    // Save the user bypassing the middleware
    const savedUser = await user.save();
    console.log('User created successfully with ID:', savedUser._id);
    
    // Test password verification
    const testVerify = await bcrypt.compare(password, savedUser.password);
    console.log('Password verification test result:', testVerify);
  
    res.status(201).json({
      _id: savedUser.id,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      token: generateToken(savedUser._id),
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(400);
    throw new Error('Failed to create user: ' + error.message);
  }
});

// @desc    Emergency fix user accounts to allow login with password "password"  
// @route   GET /api/users/emergency-fix
// @access  Public (temporary)
const emergencyFixUsers = asyncHandler(async (req, res) => {
  // Create a fixed password for all users
  const salt = await bcrypt.genSalt(10);
  const fixedPassword = await bcrypt.hash('password', salt);
  
  // Update all users to use this password
  const result = await User.updateMany(
    {}, // Match all users
    { password: fixedPassword }
  );
  
  console.log(`Fixed ${result.modifiedCount} user accounts to use standard password`);
  
  // Test the fixed password
  const testUser = await User.findOne({});
  if (testUser) {
    const testResult = await bcrypt.compare('password', testUser.password);
    console.log(`Test login for ${testUser.email}: ${testResult}`);
  }
  
  res.json({
    message: `Fixed ${result.modifiedCount} accounts. Now use 'password' to log in to any account.`,
  });
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  createAdminAccount,
  createUserByAdmin,
  emergencyFixUsers,
};
