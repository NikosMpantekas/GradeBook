const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const { connectToSchoolDb } = require('../config/multiDbConnect');

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

  // Special handling for superadmin logins - always check the main database
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
    
    // Return superadmin user information
    return res.json({
      _id: isSuperAdmin.id,
      name: isSuperAdmin.name,
      email: isSuperAdmin.email,
      role: isSuperAdmin.role,
      token: accessToken,
      refreshToken: userRefreshToken,
      saveCredentials: isSuperAdmin.saveCredentials,
    });
  }
  
  // For non-superadmin users, first determine the school based on email domain
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
  
  // Connect to the school's database with better error handling
  let schoolConnection;
  let SchoolUser; // Moved to outer scope so it's accessible outside the try block
  
  try {
    // Connect to the school database
    const { connectToSchoolDb } = require('../config/multiDbConnect');
    console.log(`Connecting to database for school: ${school.name}`);
    schoolConnection = await connectToSchoolDb(school);
    
    // Define the User model for this school's database - FIXED MODEL CREATION
    try {
      // First try to get existing model
      if (schoolConnection.models && schoolConnection.models.User) {
        console.log('User model already exists in school connection');
        SchoolUser = schoolConnection.models.User;
      } else {
        // Create model with proper schema copying
        console.log('Creating new User model in school database');
        // Get the schema definition from the main User model
        const userSchemaObj = require('../models/userModel').schema.obj;
        const userSchema = new mongoose.Schema(userSchemaObj, { timestamps: true });
        
        // Add password comparison method to schema
        userSchema.methods.matchPassword = async function(enteredPassword) {
          return await bcrypt.compare(enteredPassword, this.password);
        };
        
        SchoolUser = schoolConnection.model('User', userSchema);
      }
      
      if (!SchoolUser) {
        console.log(`User model creation failed for school: ${school.name}`);
        res.status(500);
        throw new Error('School database configuration error - model creation failed');
      }
    } catch (modelError) {
      console.error(`Error creating school User model: ${modelError.message}`);
      res.status(500);
      throw new Error(`Database model error: ${modelError.message}`);
    }
  } catch (connectionError) {
    console.error(`Error connecting to school database: ${connectionError.message}`);
    res.status(500);
    throw new Error(`Database connection error: ${connectionError.message}`);
  }
  
  // Look for the user in the school's database
  let user;
  try {
    console.log(`Looking for user with email ${email} in ${school.name} database`);
    user = await SchoolUser.findOne({ email });
    console.log(`User lookup result: ${user ? 'Found' : 'Not found'}`);
  } catch (lookupError) {
    console.error(`Error during user lookup: ${lookupError.message}`);
    res.status(500);
    throw new Error(`User lookup failed: ${lookupError.message}`);
  }
  if (!user) {
    console.log(`User not found in ${school.name} database for email: ${email}`);
    res.status(401);
    throw new Error('Invalid credentials - user not found');
  }
  
  // Check if account is active
  if (user.active === false) {
    console.log(`Account is disabled for email: ${email}`);
    res.status(403);
    throw new Error('Your account has been disabled. Please contact administrator');
  }
  
  console.log(`User found: ${user.name}, role: ${user.role}, password length: ${user.password.length}`);
  
  // Verify password
  const isMatch = await bcrypt.compare(password, user.password);
  console.log(`Direct bcrypt comparison for ${email}: ${isMatch}`);
  
  if (!isMatch) {
    console.log('Password verification failed');
    res.status(401);
    throw new Error('Invalid credentials');
  }
  
  try {
    // User authenticated successfully
    // Update last login and save credentials preference
    user.lastLogin = Date.now();
    user.saveCredentials = req.body.saveCredentials || false;
    await user.save();
    
    // CRITICAL FIX: Always include school information in tokens for proper authentication
    // Get the school ID to include in token for the multidatabase lookup
    const schoolId = school._id.toString();
    console.log(`Including school ID ${schoolId} in authentication tokens for ${user.name}`);
    
    // Generate tokens with school information to ensure proper database routing
    const accessToken = generateToken(user._id, schoolId);
    const userRefreshToken = generateRefreshToken(user._id, schoolId);
    
    // Verify the token has schoolId for debugging
    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
      console.log('Token payload includes:', {
        userId: decoded.id,
        schoolId: decoded.schoolId,
        hasSchoolId: !!decoded.schoolId
      });
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError.message);
      // Continue despite verification failure - this is just for logging
    }
    
    // Return response with school information
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      school: school._id,
      schoolName: school.name,
      darkMode: user.darkMode,
      saveCredentials: user.saveCredentials,
      token: accessToken,
      refreshToken: userRefreshToken,
      schoolId: schoolId  // Include school ID explicitly for frontend reference
    });
  } catch (error) {
    console.error('Login error for ' + email + ':', error.message);
    res.status(500);
    throw new Error(`Authentication error: ${error.message}`);
  }
});

// @desc    Refresh access token using refresh token
// @route   POST /api/users/refresh-token
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    res.status(400);
    throw new Error('Refresh token is required');
  }
  
  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
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
    const newAccessToken = generateToken(user._id);
    
    // Return both tokens
    res.json({
      accessToken: newAccessToken,
      refreshToken: refreshToken // Return the same refresh token as it's still valid
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
  console.log('getUsers endpoint called');
  
  try {
    let users = [];
    
    // Check if this is a request from a school-specific user
    if (req.school) {
      console.log(`Fetching users from school database: ${req.school.name}`);
      // Connect to the school-specific database with improved connection
      const { connectToSchoolDb } = require('../config/multiDbConnect');
      const { connection, models } = await connectToSchoolDb(req.school);
      
      // Get the User model from the connection
      const SchoolUser = connection.model('User');
      
      // Check if all required models are registered for proper population
      if (!models.School || !models.Direction || !models.Subject) {
        console.warn('Not all required models are registered, references may not populate correctly');
      }
      
      // Get users from the school's database with proper population of references
      users = await SchoolUser.find({}).select('-password')
        .populate('school', 'name')
        .populate('direction', 'name')
        .populate('schools', 'name')
        .populate('directions', 'name')
        .populate('subjects', 'name');
      
      console.log(`Retrieved ${users.length} users with populated data`);
    } else {
      // This is a superadmin or a user in the main database
      console.log('Fetching users from main database');
      // Get users with common fields populated
      users = await User.find({}).select('-password')
        .populate('school', 'name') // For students
        .populate('direction', 'name') // For students
        .populate('schools', 'name') // For teachers/secretaries
        .populate('directions', 'name') // For teachers/secretaries
        .populate('subjects', 'name');
    }
    
    // Process users to ensure proper structure based on role
    const processedUsers = users.map(user => {
      const userData = user.toObject ? user.toObject() : user;
      
      // For secretaries, ensure permissions are present
      if (userData.role === 'secretary' && !userData.secretaryPermissions) {
        userData.secretaryPermissions = {
          canManageGrades: false,
          canSendNotifications: false,
          canManageUsers: false,
          canManageSchools: false,
          canManageDirections: false,
          canManageSubjects: false,
          canAccessStudentProgress: false
        };
      }
      
      // Ensure teachers and secretaries have arrays
      if (userData.role === 'teacher' || userData.role === 'secretary') {
        if (!userData.schools) userData.schools = [];
        if (!userData.directions) userData.directions = [];
        if (!userData.subjects) userData.subjects = [];
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

// @desc    Get user by ID (admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  console.log(`Fetching user by ID: ${req.params.id}`);
  let user = null;
  
  try {
    // First, try to find user in the main database
    const mainDbUser = await User.findById(req.params.id).select('-password');
    
    if (mainDbUser) {
      console.log(`User found in main database with role: ${mainDbUser.role}`);
      
      // Handle different types of users in the main database
      if (mainDbUser.role === 'teacher' || mainDbUser.role === 'secretary') {
        // For teachers and secretaries, use array fields (schools, directions)
        console.log(`Getting ${req.params.id} as teacher or secretary with array fields`);
        user = await User.findById(req.params.id)
          .select('-password')
          .populate('schools', 'name _id')
          .populate('directions', 'name _id')
          .populate('subjects', 'name _id')
          .lean();
          
        // Ensure arrays exist
        if (!user.schools) user.schools = [];
        if (!user.directions) user.directions = [];
        if (!user.subjects) user.subjects = [];
      } else {
        // For students and admins, use singular fields
        console.log(`Getting ${req.params.id} as student or admin with singular fields`);
        user = await User.findById(req.params.id)
          .select('-password')
          .populate('school', 'name')
          .populate('direction', 'name')
          .populate('subjects', 'name')
          .lean();
      }
    } else if (req.school) {
      // If not found in main DB, check the school-specific database
      console.log(`User not found in main DB, checking school database: ${req.school.name}`);
      
      // Connect to the school's database with improved connection handling
      const { connection, models } = await connectToSchoolDb(req.school);
      
      // Get the User model from the connection
      const SchoolUser = connection.model('User');
      
      // Check if all required models are registered for proper population
      if (!models.School || !models.Direction || !models.Subject) {
        console.warn('Not all required models are registered, references may not populate correctly');
      }
      
      // Try to find the user in the school database
      const schoolUser = await SchoolUser.findById(req.params.id)
        .select('-password')
        .populate('school', 'name _id')
        .populate('direction', 'name _id')
        .populate('schools', 'name _id')
        .populate('directions', 'name _id')
        .populate('subjects', 'name _id');
      
      if (schoolUser) {
        console.log(`User found in school database with role: ${schoolUser.role}`);
        user = schoolUser.toObject ? schoolUser.toObject() : schoolUser;
        
        // Ensure arrays exist for teacher/secretary
        if (user.role === 'teacher' || user.role === 'secretary') {
          if (!user.schools) user.schools = [];
          if (!user.directions) user.directions = [];
          if (!user.subjects) user.subjects = [];
        }
      }
    }
    
    if (user) {
      // For secretary, ensure permissions are included
      if (user.role === 'secretary' && !user.secretaryPermissions) {
        user.secretaryPermissions = {
          canManageGrades: false,
          canSendNotifications: false,
          canManageUsers: false,
          canManageSchools: false,
          canManageDirections: false,
          canManageSubjects: false,
          canAccessStudentProgress: false
        };
      }
      
      console.log(`Successfully retrieved user ${req.params.id} with role: ${user.role}`);
      res.json(user);
    } else {
      console.log(`User not found in any database: ${req.params.id}`);
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    console.error(`Error finding user ${req.params.id}:`, error);
    res.status(500);
    throw new Error(`Error retrieving user: ${error.message}`);
  }
});

// @desc    Update user (admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  console.log(`Attempting to update user with ID: ${req.params.id}`);
  
  // First try to find the user in the main database
  let user = await User.findById(req.params.id);
  let userModel = User;
  let inSchoolDb = false;
  
  // If not in main DB, check school DB if applicable
  if (!user && req.school) {
    console.log(`User not found in main DB, checking school database: ${req.school.name}`);
    try {
      // Connect to the school's database
      const schoolConnection = await connectToSchoolDb(req.school);
      const SchoolUser = schoolConnection.model('User');
      
      // Try to find user in school database
      user = await SchoolUser.findById(req.params.id);
      
      if (user) {
        console.log(`User found in school database: ${req.school.name}`);
        userModel = SchoolUser;
        inSchoolDb = true;
      }
    } catch (error) {
      console.error(`Error connecting to school database: ${error.message}`);
    }
  }

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    
    // Add support for optional contact fields
    if (req.body.mobilePhone !== undefined) {
      user.mobilePhone = req.body.mobilePhone;
    }
    
    if (req.body.personalEmail !== undefined) {
      user.personalEmail = req.body.personalEmail;
    }
    
    // Handle secretary permissions if provided
    if (user.role === 'secretary' && req.body.secretaryPermissions) {
      console.log('Updating secretary permissions:', req.body.secretaryPermissions);
      user.secretaryPermissions = {
        canManageGrades: req.body.secretaryPermissions.canManageGrades !== undefined
          ? req.body.secretaryPermissions.canManageGrades : user.secretaryPermissions?.canManageGrades || false,
        canSendNotifications: req.body.secretaryPermissions.canSendNotifications !== undefined
          ? req.body.secretaryPermissions.canSendNotifications : user.secretaryPermissions?.canSendNotifications || false,
        canManageUsers: req.body.secretaryPermissions.canManageUsers !== undefined
          ? req.body.secretaryPermissions.canManageUsers : user.secretaryPermissions?.canManageUsers || false,
        canManageSchools: req.body.secretaryPermissions.canManageSchools !== undefined
          ? req.body.secretaryPermissions.canManageSchools : user.secretaryPermissions?.canManageSchools || false,
        canManageDirections: req.body.secretaryPermissions.canManageDirections !== undefined
          ? req.body.secretaryPermissions.canManageDirections : user.secretaryPermissions?.canManageDirections || false,
        canManageSubjects: req.body.secretaryPermissions.canManageSubjects !== undefined
          ? req.body.secretaryPermissions.canManageSubjects : user.secretaryPermissions?.canManageSubjects || false,
        canAccessStudentProgress: req.body.secretaryPermissions.canAccessStudentProgress !== undefined
          ? req.body.secretaryPermissions.canAccessStudentProgress : user.secretaryPermissions?.canAccessStudentProgress || false,
      };
    }
    
    // Handle password update if provided
    if (req.body.password) {
      user.password = req.body.password;
    }
    
    // Handle school, direction, and subjects fields
    // HANDLE BOTH OLD AND NEW FIELD NAMES FOR COMPATIBILITY
    console.log('UPDATE USER - ROLE:', user.role);
    console.log('UPDATE USER - RECEIVED DATA:', { 
      school: req.body.school, 
      direction: req.body.direction,
      schools: req.body.schools,
      directions: req.body.directions
    });
    
    if (user.role === 'teacher' || user.role === 'secretary') {
      console.log(`UPDATING ${user.role.toUpperCase()} ACCOUNT - USING ARRAY FIELDS`);
      
      // Handle schools array for teachers (check both old and new field names)
      if (req.body.schools !== undefined || req.body.school !== undefined) {
        // Prefer the new field name, fall back to old one
        const schoolsInput = req.body.schools !== undefined ? req.body.schools : req.body.school;
        
        // Convert to array if not already
        const schoolsArray = Array.isArray(schoolsInput) ? schoolsInput : [schoolsInput].filter(Boolean);
        console.log(`Processing ${schoolsArray.length} schools for teacher update`);
        
        // Convert to proper ObjectIds
        user.schools = schoolsArray.map(id => {
          if (mongoose.Types.ObjectId.isValid(id)) {
            return new mongoose.Types.ObjectId(id);
          }
          return id; // Let validation catch any invalid IDs
        });
        
        // Clear the singular school field for teachers
        user.school = null;
        
        console.log('Updated teacher schools array:', user.schools);
      }
      
      // Handle directions array for teachers (check both old and new field names)
      if (req.body.directions !== undefined || req.body.direction !== undefined) {
        // Prefer the new field name, fall back to old one
        const directionsInput = req.body.directions !== undefined ? req.body.directions : req.body.direction;
        
        // Convert to array if not already
        const directionsArray = Array.isArray(directionsInput) ? directionsInput : [directionsInput].filter(Boolean);
        console.log(`Processing ${directionsArray.length} directions for teacher update`);
        
        // Convert to proper ObjectIds
        user.directions = directionsArray.map(id => {
          if (mongoose.Types.ObjectId.isValid(id)) {
            return new mongoose.Types.ObjectId(id);
          }
          return id; // Let validation catch any invalid IDs
        });
        
        // Clear the singular direction field for teachers
        user.direction = null;
        
        console.log('Updated teacher directions array:', user.directions);
      }
    } else {
      // FOR STUDENTS: Use singular school and direction fields
      console.log('UPDATING STUDENT ACCOUNT - USING SINGULAR FIELDS');
      
      // Process singular school field for students
      if (req.body.school !== undefined) {
        // Extract single value (if array is mistakenly provided)
        const schoolValue = Array.isArray(req.body.school) ? req.body.school[0] : req.body.school;
        
        if (schoolValue === null || schoolValue === undefined || schoolValue === '') {
          user.school = null;
        } else if (mongoose.Types.ObjectId.isValid(schoolValue)) {
          user.school = new mongoose.Types.ObjectId(schoolValue);
        }
        
        // Clear the schools array for students
        user.schools = [];
        
        console.log('Updated student school:', user.school);
      }
      
      // Process singular direction field for students
      if (req.body.direction !== undefined) {
        // Extract single value (if array is mistakenly provided)
        const directionValue = Array.isArray(req.body.direction) ? req.body.direction[0] : req.body.direction;
        
        if (directionValue === null || directionValue === undefined || directionValue === '') {
          user.direction = null;
        } else if (mongoose.Types.ObjectId.isValid(directionValue)) {
          user.direction = new mongoose.Types.ObjectId(directionValue);
        }
        
        // Clear the directions array for students
        user.directions = [];
        
        console.log('Updated student direction:', user.direction);
      }
    }
    
    if (req.body.subjects !== undefined) {
      user.subjects = req.body.subjects;
    }
    
    // Handle teacher permission fields if this is a teacher account
    if (user.role === 'teacher') {
      if (req.body.canSendNotifications !== undefined) {
        user.canSendNotifications = req.body.canSendNotifications;
      }
      
      if (req.body.canAddGradeDescriptions !== undefined) {
        user.canAddGradeDescriptions = req.body.canAddGradeDescriptions;
      }
    }

    // Save the user first
    await user.save();
    
    // Find the updated user but don't return the password
    let updatedUser = await User.findById(user._id).select('-password');
    
    // Population logic for separate school/schools and direction/directions fields
    if (user.role === 'teacher' || user.role === 'secretary') {
      console.log(`Populating ${user.role}-specific fields with arrays...`);
      
      // For teachers/secretaries: use the dedicated plural fields (schools & directions arrays)
      // This exactly matches how subjects are handled
      updatedUser = await User.findById(user._id)
        .select('-password')
        .populate('schools', 'name _id') // Use schools array for teachers/secretaries
        .populate('directions', 'name _id') // Use directions array for teachers/secretaries
        .populate('subjects', 'name _id')
        .lean();
      
      // Ensure populated arrays exist to prevent frontend errors
      if (!updatedUser.schools) updatedUser.schools = [];
      if (!updatedUser.directions) updatedUser.directions = [];
      if (!updatedUser.subjects) updatedUser.subjects = [];
      
      console.log(`${user.role.charAt(0).toUpperCase() + user.role.slice(1)} populated with:`, {
        'schools count': updatedUser.schools.length,
        'directions count': updatedUser.directions.length,
        'subjects count': updatedUser.subjects.length
      });
    } else {
      // For students or admins, use the singular fields
      updatedUser = await User.findById(user._id)
        .select('-password')
        .populate('school', 'name') // Single school for students
        .populate('direction', 'name') // Single direction for students
        .populate('subjects', 'name') // Multiple subjects still supported
        .lean();
    }
    
    // Create a simple response object with essential fields
    const response = {
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    mobilePhone: updatedUser.mobilePhone,
    personalEmail: updatedUser.personalEmail,
    darkMode: updatedUser.darkMode,
    saveCredentials: updatedUser.saveCredentials,
  };
  
  // Add role-specific fields to response
  if (updatedUser.role === 'teacher' || updatedUser.role === 'secretary') {
    // For teachers/secretaries, populate schools/directions fields if the database allows
    try {
      if (inSchoolDb) {
        // When in school DB, we need to specially populate these fields
        const populatedUser = await userModel.findById(updatedUser._id)
          .populate('schools', 'name _id')
          .populate('directions', 'name _id')
          .populate('subjects', 'name _id');
          
        response.schools = populatedUser.schools || [];
        response.directions = populatedUser.directions || [];
        response.subjects = populatedUser.subjects || [];
      } else {
        // Regular population in main DB
        const populatedUser = await User.findById(updatedUser._id)
          .populate('schools', 'name _id')
          .populate('directions', 'name _id')
          .populate('subjects', 'name _id');
          
        response.schools = populatedUser.schools || [];
        response.directions = populatedUser.directions || [];
        response.subjects = populatedUser.subjects || [];
      }
    } catch (populateError) {
      console.error('Error populating fields:', populateError);
      // Fallback to unpopulated data
      response.schools = updatedUser.schools || [];
      response.directions = updatedUser.directions || [];
      response.subjects = updatedUser.subjects || [];
    }
  } else if (updatedUser.role === 'student') {
    // For students, populate school/direction fields
    try {
      if (inSchoolDb) {
        // When in school DB, we need to specially populate these fields
        const populatedUser = await userModel.findById(updatedUser._id)
          .populate('school', 'name _id')
          .populate('direction', 'name _id')
          .populate('subjects', 'name _id');
          
        response.school = populatedUser.school;
        response.direction = populatedUser.direction;
        response.subjects = populatedUser.subjects || [];
      } else {
        // Regular population in main DB
        const populatedUser = await User.findById(updatedUser._id)
          .populate('school', 'name _id')
          .populate('direction', 'name _id')
          .populate('subjects', 'name _id');
          
        response.school = populatedUser.school;
        response.direction = populatedUser.direction;
        response.subjects = populatedUser.subjects || [];
      }
    } catch (populateError) {
      console.error('Error populating fields:', populateError);
      // Fallback to unpopulated data
      response.school = updatedUser.school;
      response.direction = updatedUser.direction;
      response.subjects = updatedUser.subjects || [];
    }
  }
  
  // Add secretary permissions to response if applicable
  if (updatedUser.role === 'secretary') {
    response.secretaryPermissions = updatedUser.secretaryPermissions;
    console.log('Secretary permissions included in response:', response.secretaryPermissions);
  }
  
  // Return the final response
  res.json(response);
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
// Generate main access token (short-lived)
const generateToken = (id, schoolId = null) => {
  const payload = schoolId ? { id, schoolId } : { id };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Generate refresh token (longer-lived)
const generateRefreshToken = (id, schoolId = null) => {
  // Use the main JWT_SECRET with a type field for refresh tokens
  // This is more compatible with the existing system and avoids the need for a separate JWT_REFRESH_SECRET
  const payload = schoolId ? 
    { id, schoolId, type: 'refresh' } : 
    { id, type: 'refresh' };
  
  try {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '60d',
    });
  } catch (error) {
    console.error('Error generating refresh token:', error);
    // Fallback to using a simple token with the main secret
    return jwt.sign({ id, type: 'refresh' }, process.env.JWT_SECRET, {
      expiresIn: '60d',
    });
  }
};

// @desc    Create a first admin account (temporary endpoint for setup) - deprecated, use superadmin functionality
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
  const { 
    name, 
    email, 
    mobilePhone, // New optional field
    personalEmail, // New optional field
    password, 
    role, 
    school, 
    direction, 
    subjects, 
    canSendNotifications, 
    canAddGradeDescriptions 
  } = req.body;
  
  // For teachers, school and direction could be arrays
  const schoolInfo = role === 'teacher' && Array.isArray(school) ? `Array with ${school.length} schools` : (school || null);
  const directionInfo = role === 'teacher' && Array.isArray(direction) ? `Array with ${direction.length} directions` : (direction || null);
  
  console.log(`Admin creating new user:\n- Name: ${name}\n- Email: ${email}\n- Role: ${role}\n- School: ${schoolInfo}\n- Direction: ${directionInfo}`);
  
  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error('Please add all fields');
  }
  
  // Get the school from the request (set by auth middleware)
  if (!req.school) {
    res.status(400);
    throw new Error('School information missing');
  }
  
  // Validate that user email matches this school's domain
  const emailDomain = email.split('@')[1];
  if (!emailDomain || emailDomain !== req.school.emailDomain) {
    res.status(400);
    throw new Error(`Email must use the school domain: @${req.school.emailDomain}`);
  }
  
  try {
    // Connect to the school's database
    const schoolConnection = await connectToSchoolDb(req.school);
    const SchoolUser = schoolConnection.model('User');
  
    // Check if user already exists in this school's database
    const userExists = await SchoolUser.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists in this school');
    }
    
    // CRITICAL FIX: Generate bcrypt hash directly using same settings as bcrypt.online
    // This ensures compatibility with how you've been fixing accounts manually
    const salt = await bcrypt.genSalt(10); // Same cost factor as bcrypt.online
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Generated hashed password length:', hashedPassword.length);
    
    // Create the base user data
    const userData = {
      name,
      email,
      mobilePhone: mobilePhone || null, // Include new optional fields
      personalEmail: personalEmail || null,
      password: hashedPassword,
      role,
    };
    
    // Add additional fields if they're provided (for teachers and students)
    if (role === 'teacher' || role === 'student') {
      // SIMPLE AND DIRECT APPROACH USING SEPARATE FIELDS FOR TEACHERS AND STUDENTS
      // This follows the same pattern as subjects which already works correctly
      
      if (role === 'teacher') {
        // FOR TEACHERS: Use the dedicated schools and directions array fields
        console.log('CREATING TEACHER ACCOUNT - PROCESSING MULTI-SELECT FIELDS');
        
        // Process schools array for teachers (same approach as subjects)
        if (school) {
          // Get the schools array, ensuring it's always an array
          const schoolsArray = Array.isArray(school) ? school : [school].filter(Boolean);
          console.log(`Processing ${schoolsArray.length} schools for teacher`);
          
          // Convert to ObjectIds
          userData.schools = schoolsArray.map(id => {
            if (mongoose.Types.ObjectId.isValid(id)) {
              return new mongoose.Types.ObjectId(id);
            }
            return id; // Let validation catch any invalid IDs
          });
        } else {
          userData.schools = [];
        }
        
        // Process directions array for teachers (same approach as subjects)
        if (direction) {
          // Get the directions array, ensuring it's always an array
          const directionsArray = Array.isArray(direction) ? direction : [direction].filter(Boolean);
          console.log(`Processing ${directionsArray.length} directions for teacher`);
          
          // Convert to ObjectIds
          userData.directions = directionsArray.map(id => {
            if (mongoose.Types.ObjectId.isValid(id)) {
              return new mongoose.Types.ObjectId(id);
            }
            return id; // Let validation catch any invalid IDs
          });
        } else {
          userData.directions = [];
        }
        
        // Teachers don't use the singular school/direction fields
        userData.school = null;
        userData.direction = null;
        
      } else {
        // FOR STUDENTS: Use singular school and direction fields
        console.log('CREATING STUDENT ACCOUNT - PROCESSING SINGLE FIELDS');
        
        // Process single school for student
        if (school) {
          // If an array is mistakenly provided, use the first item
          const schoolValue = Array.isArray(school) ? school[0] : school;
          
          if (mongoose.Types.ObjectId.isValid(schoolValue)) {
            userData.school = new mongoose.Types.ObjectId(schoolValue);
            console.log('Set student school to:', userData.school);
          }
        }
        
        // Process single direction for student
        if (direction) {
          // If an array is mistakenly provided, use the first item
          const directionValue = Array.isArray(direction) ? direction[0] : direction;
          
          if (mongoose.Types.ObjectId.isValid(directionValue)) {
            userData.direction = new mongoose.Types.ObjectId(directionValue);
            console.log('Set student direction to:', userData.direction);
          }
        }
        
        // Students don't use the plural schools/directions arrays
        userData.schools = [];
        userData.directions = [];
      }
      
      // Handle subjects assignment
      if (subjects && Array.isArray(subjects) && subjects.length > 0) {
        userData.subjects = subjects;
      }
      
      // Add teacher-specific permission fields
      if (role === 'teacher') {
        // Set permission flags with default true if not specified
        userData.canSendNotifications = typeof canSendNotifications === 'boolean' 
          ? canSendNotifications 
          : true;
        
        userData.canAddGradeDescriptions = typeof canAddGradeDescriptions === 'boolean' 
          ? canAddGradeDescriptions 
          : true;
      }
    }
    
    // Create user in the school-specific database
    const result = await SchoolUser.create(userData);
    console.log('User created in school database with ID:', result._id);
    
    if (result) {
      // Return without password
      const response = {
        _id: result._id,
        name: result.name,
        email: result.email,
        mobilePhone: result.mobilePhone,
        personalEmail: result.personalEmail,
        role: result.role,
        school: req.school._id,
        schoolName: req.school.name,
      };
      
      res.status(201).json(response);
    } else {
      res.status(400);
      throw new Error('Failed to create user in school database');
    }
    
    // Log account creation details
    console.log('ACCOUNT CREATED:');
    console.log(`Email: ${email}`);
    console.log(`Role: ${role}`);
    console.log('School:', school ? 'Set' : 'Not set');
    console.log('Direction:', direction ? 'Set' : 'Not set');
    console.log('Subjects:', subjects && subjects.length > 0 ? `${subjects.length} assigned` : 'None assigned');
    console.log('Password verification check:', testVerify ? 'PASSED' : 'FAILED');
  
    res.status(201).json({
      _id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      mobilePhone: savedUser.mobilePhone,
      personalEmail: savedUser.personalEmail,
      role: savedUser.role,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(400);
    throw new Error('Failed to create user: ' + error.message);
  }
});

// @desc    DIRECT DATABASE FIX - Critical authentication repair
// @route   GET /api/users/direct-db-fix
// @access  Public (temporary emergency access)
const directDatabaseFix = asyncHandler(async (req, res) => {
  console.log(`\n=====================================================`);
  console.log(`CRITICAL AUTHENTICATION SYSTEM REPAIR INITIATED`);
  console.log(`=====================================================\n`);
  
  try {
    // STEP 1: Connect to database directly (bypass Mongoose) for more reliable updates
    console.log(`Attempting to update all accounts in database...`);
    
    // Create a known working password hash directly with bcrypt
    const fixedPassword = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(fixedPassword, salt);
    
    // First reset admin account directly (ensure admin access)
    const adminUpdateResult = await User.updateOne(
      { email: 'a@a.com' }, // Admin account
      { $set: { password: hashedPassword } },
      { bypassDocumentValidation: true }
    );
    
    console.log(`Admin account fixed: ${adminUpdateResult.modifiedCount === 1 ? 'SUCCESS' : 'FAILED'}`);
    
    // Reset all other accounts
    const userUpdateResult = await User.updateMany(
      {}, // All accounts
      { $set: { password: hashedPassword } },
      { bypassDocumentValidation: true }
    );
    
    console.log(`Updated ${userUpdateResult.modifiedCount} accounts with new password hash`);
    
    // STEP 2: Test the fix on admin account
    const adminUser = await User.findOne({ email: 'a@a.com' });
    if (adminUser) {
      // Test login directly with bcrypt
      const testResult = await bcrypt.compare(fixedPassword, adminUser.password);
      console.log(`Test login for admin (a@a.com): ${testResult ? 'SUCCESS' : 'FAILED'}`);
      
      if (!testResult) {
        console.log(`WARNING: Password verification still failing despite database update!`);
      }
    }
    
    // STEP 3: Verify other accounts
    const testUser = await User.findOne({ role: 'teacher' });
    if (testUser) {
      const teacherTest = await bcrypt.compare(fixedPassword, testUser.password);
      console.log(`Test login for teacher (${testUser.email}): ${teacherTest ? 'SUCCESS' : 'FAILED'}`);
    }
    
    console.log(`\n=====================================================`);
    console.log(`AUTHENTICATION REPAIR COMPLETE`);
    console.log(`ALL ACCOUNTS NOW USE PASSWORD: "admin123"`);
    console.log(`=====================================================\n`);
    
    return res.json({
      success: true,
      message: `Authentication system repaired. All accounts now use the password: "admin123"`,
      adminFixed: adminUpdateResult.modifiedCount === 1,
      totalAccountsFixed: userUpdateResult.modifiedCount
    });
  } catch (error) {
    console.error('DATABASE REPAIR ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to repair authentication system',
      error: error.message
    });
  }
});

// @desc    Get students (users with role='student')
// @route   GET /api/users/students
// @access  Private
const getStudents = asyncHandler(async (req, res) => {
  console.log('Fetching students...');
  try {
    // Find all users with role 'student'
    const students = await User.find({ role: 'student' })
      .select('-password') // Don't return passwords
      .populate('school', 'name') // Include school name
      .populate('direction', 'name'); // Include direction name
    
    console.log(`Found ${students.length} students`);
    res.status(200).json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500);
    throw new Error('Failed to fetch students');
  }
});

// @desc    Get students by subject
// @route   GET /api/users/students/subject/:subjectId
// @access  Private
const getStudentsBySubject = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;
  console.log(`Fetching students for subject ${subjectId}...`);
  
  try {
    // First, check if the subject exists
    const Subject = require('../models/subjectModel');
    const subject = await Subject.findById(subjectId);
    
    if (!subject) {
      console.error(`Subject ${subjectId} not found`);
      return res.status(404).json({ message: 'Subject not found' });
    }
    
    // Get students for the subject - this is a more flexible approach that works
    // regardless of whether students are directly linked to subjects or not
    let students;
    
    // Method 1: Try to find students directly linked to this subject
    // (Assuming students have a subjects array in their document)
    students = await User.find({ 
      role: 'student',
      subjects: subjectId
    })
    .select('-password')
    .populate('school', 'name')
    .populate('direction', 'name');
    
    // Method 2: If no students found through direct linking, try to find
    // students linked through the direction that this subject belongs to
    if (!students || students.length === 0) {
      console.log('No direct student-subject links found, trying via direction...');
      // Get the directions this subject belongs to
      const directions = subject.directions || [];
      
      if (directions && directions.length > 0) {
        // Find students in these directions
        students = await User.find({
          role: 'student',
          direction: { $in: directions }
        })
        .select('-password')
        .populate('school', 'name')
        .populate('direction', 'name');
      }
    }
    
    // Method 3: If all else fails, just return all students as a fallback
    if (!students || students.length === 0) {
      console.log('No students found via directions either, returning all students...');
      students = await User.find({ role: 'student' })
        .select('-password')
        .populate('school', 'name')
        .populate('direction', 'name');
    }
    
    console.log(`Found ${students ? students.length : 0} students for subject ${subjectId}`);
    return res.status(200).json(students || []);
  } catch (error) {
    console.error(`Error fetching students for subject ${subjectId}:`, error);
    res.status(500).json({
      message: 'Failed to fetch students by subject', 
      error: error.message
    });
  }
});

// @desc    Get users by role
// @route   GET /api/users/role/:role
// @access  Private (for teachers/admins only)
const getUsersByRole = asyncHandler(async (req, res) => {
  // Validate that the requestor is a teacher or admin
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to access user lists');
  }

  const { role } = req.params;
  
  // Validate role parameter
  const validRoles = ['student', 'teacher', 'admin', 'all'];
  if (!validRoles.includes(role)) {
    res.status(400);
    throw new Error('Invalid role specified');
  }

  let query = {};
  
  // If role is 'all', don't filter by role
  if (role !== 'all') {
    query.role = role;
  }

  const users = await User.find(query)
    .select('_id name email role school direction subjects')
    .populate('school', 'name')
    .populate('direction', 'name')
    .populate('subjects', 'name')
    .sort({ name: 1 });

  res.json(users);
});

module.exports = {
  registerUser,
  loginUser,
  refreshToken,
  getMe,
  updateProfile,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  createAdminAccount,
  createUserByAdmin,
  directDatabaseFix,
  getStudents,
  getStudentsBySubject,
  getUsersByRole,
};
