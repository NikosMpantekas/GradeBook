const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Class = require('../models/classModel');
const logger = require('../utils/logger');
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
  
  logger.info('AUTH', `Login attempt for email: ${email}`, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    requestPath: req.path
  });

  // Special handling for superadmin logins - always check by role
  try {
    const isSuperAdmin = await User.findOne({ email, role: 'superadmin' });
    
    logger.info('AUTH', 'Superadmin check result', { 
      email,
      found: !!isSuperAdmin,
      superadminId: isSuperAdmin?._id,
      hasPassword: !!isSuperAdmin?.password
    });
    
    if (isSuperAdmin) {
      logger.info('AUTH', 'Superadmin login attempt', {
        id: isSuperAdmin._id,
        name: isSuperAdmin.name,
        active: isSuperAdmin.active,
        createdAt: isSuperAdmin.createdAt,
        hasToken: false // Not yet generated
      });
      
      // Verify superadmin password and login status
      if (isSuperAdmin.active === false) {
        logger.warn('AUTH', `Superadmin account is disabled`, {
          id: isSuperAdmin._id,
          email
        });
        res.status(403);
        throw new Error('Your account has been disabled. Please contact system administrator');
      }
      
      const isMatch = await bcrypt.compare(password, isSuperAdmin.password);
      if (!isMatch) {
        logger.warn('AUTH', 'Invalid superadmin password', { id: isSuperAdmin._id, email });
        res.status(401);
        throw new Error('Invalid credentials');
      }
    
      // Update login timestamp and refresh token without triggering validation
      // Use updateOne instead of save to bypass validation that might require schoolId
      await User.updateOne(
        { _id: isSuperAdmin._id },
        { 
          lastLogin: Date.now(),
          saveCredentials: req.body.saveCredentials || false
        }
      );
      
      // Generate access token and refresh token for superadmin
      const accessToken = generateToken(isSuperAdmin._id);
      const userRefreshToken = generateRefreshToken(isSuperAdmin._id);
      
      logger.info('AUTH', 'Superadmin tokens generated', {
        id: isSuperAdmin._id,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!userRefreshToken,
        accessTokenLength: accessToken?.length,
        refreshTokenLength: userRefreshToken?.length
      });

      // Save refresh token also using updateOne to bypass validation
      await User.updateOne(
        { _id: isSuperAdmin._id },
        { refreshToken: userRefreshToken }
      );
      
      logger.info('AUTH', 'Superadmin data updated successfully');

      // Prepare response object with detailed logging
      const responseObj = {
        _id: isSuperAdmin.id,
        name: isSuperAdmin.name,
        email: isSuperAdmin.email,
        role: isSuperAdmin.role,
        token: accessToken,
        refreshToken: userRefreshToken,
        saveCredentials: isSuperAdmin.saveCredentials,
        school: null,
        schoolId: null,
        schoolName: null,
        schools: [],
        directions: [],
        subjects: [],
        darkMode: isSuperAdmin.darkMode || false
      };
      
      // Log the response object keys for debugging
      logger.info('AUTH', 'Superadmin login response prepared', {
        responseKeys: Object.keys(responseObj),
        hasId: !!responseObj._id,
        role: responseObj.role,
        hasToken: !!responseObj.token
      });

      // Return superadmin user information with all fields expected by frontend
      return res.json(responseObj);
    }
  } catch (error) {
    logger.error('AUTH', 'Error during superadmin authentication', {
      error: error.message,
      stack: error.stack,
      email
    });
    throw error; // Re-throw to be caught by error handler
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
    
    // Update user's last login timestamp
    user.lastLogin = Date.now();
    user.saveCredentials = req.body.saveCredentials || false;
    await user.save();
    
    // Create a token that includes both user ID and school ID
    const token = generateToken(user._id, user.schoolId);
    
    // Get school feature permissions from the dedicated SchoolPermissions collection
    let schoolFeatures = null;
    if (user.schoolId) {
      const SchoolPermissions = mongoose.model('SchoolPermissions');
      
      // Try to find permissions for this school
      let permissions = await SchoolPermissions.findOne({ schoolId: user.schoolId });
      
      // If no permissions record exists yet, check legacy location and create one
      if (!permissions) {
        logger.info('AUTH', 'No dedicated permissions found, creating default permissions', {
          schoolId: user.schoolId,
        });
        
        // Create default permissions using SchoolPermissions model (no legacy fallback)
        permissions = await SchoolPermissions.createDefaultPermissions(user.schoolId);
        
        logger.info('AUTH', 'Created new school permissions from legacy data', {
          schoolId: user.schoolId,
          features: Object.keys(permissions.features)
        });
      }
      
      // Use the features from permissions record
      if (permissions && permissions.features) {
        schoolFeatures = permissions.features;
        
        logger.info('AUTH', 'School features loaded from permissions collection', {
          schoolId: user.schoolId,
          features: Object.keys(permissions.features),
          lastModified: permissions.lastModifiedDate
        });
      }
    }
    
    logger.info('AUTH', 'Login successful', {
      userId: user._id,
      role: user.role,
      schoolId: user.schoolId,
      hasToken: true,
      tokenLength: token.length,
      hasSchoolFeatures: !!schoolFeatures
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      school: user.school,
      secretaryPermissions: user.secretaryPermissions,
      adminPermissions: user.adminPermissions,
      // Include school feature permissions
      schoolFeatures,
      token,
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
  console.log(`[USER PROFILE] Loading profile for user ID: ${req.user.id}`);
  
  // Find user and populate all reference fields
  const user = await User.findById(req.user.id)
    .select('-password')
    // Populate both old and new field names for maximum compatibility
    .populate('school', 'name')     // Old: Single school field (students)
    .populate('direction', 'name direction subject schoolBranch')  // Legacy field now references Class model
    .populate('schools', 'name')    // New: Multiple schools array (teachers)
    .populate('directions', 'name direction subject schoolBranch') // Legacy field now references Class model
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
        .populate('direction', 'name direction subject schoolBranch')
        .populate('subjects', 'name')
        .populate('schools', 'name')
        .populate('directions', 'name direction subject schoolBranch')
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
        .populate('direction', 'name direction subject schoolBranch')
        .populate('subjects', 'name')
        .populate('schools', 'name')
        .populate('directions', 'name direction subject schoolBranch')
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

// @desc    Create new user by admin
// @route   POST /api/users/admin/create
// @access  Private/Admin
const createUserByAdmin = asyncHandler(async (req, res) => {
  console.log('Admin create user endpoint called');
  
  try {
    const { 
      name, 
      email, 
      password, 
      role, 
      school, 
      direction, 
      subjects,
      mobilePhone,
      personalEmail
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      res.status(400);
      throw new Error('Please provide name, email, password and role');
    }

    // Check if admin is in the same school
    if (req.user.role !== 'superadmin' && !req.user.schoolId) {
      res.status(401);
      throw new Error('Not authorized - no school context');
    }

    // Use admin's school if no school is provided in request
    // Add validation to ensure targetSchool is a valid ObjectId
    let targetSchool;
    
    // Detailed logging for debugging
    console.log('School from request:', school);
    console.log('Admin schoolId:', req.user.schoolId);
    
    // First try to get a valid school from the request
    if (school && mongoose.Types.ObjectId.isValid(school)) {
      targetSchool = school;
      console.log('Using school from request as targetSchool');
    } 
    // Otherwise use admin's school if it's valid
    else if (req.user.schoolId && mongoose.Types.ObjectId.isValid(req.user.schoolId)) {
      targetSchool = req.user.schoolId;
      console.log('Using admin schoolId as targetSchool');
    } 
    // Fallback to error if we don't have a valid school
    else {
      console.log('No valid school ID found in request or admin context');
      res.status(400);
      throw new Error('School is required. Please provide a valid school ID or ensure admin has valid school context.');
    }
    
    console.log('Final targetSchool:', targetSchool);

    // Check if user exists
    const userExists = await User.findOne({ 
      email, 
      schoolId: role === 'student' ? targetSchool : { $exists: true } 
    });

    if (userExists) {
      res.status(400);
      throw new Error('User with this email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user data object
    const userData = {
      name,
      email,
      password: hashedPassword,
      role,
      mobilePhone: mobilePhone || '',
      personalEmail: personalEmail || '',
      active: true
    };

    // Set school differently based on role
    if (role === 'student') {
      // Students have a single school
      userData.schoolId = targetSchool;
      
      // Optional: Set class if provided
      if (req.body.class) {
        userData.class = req.body.class;
      }
    } else if (role === 'teacher') {
      // ALWAYS assign the validated targetSchool as the schoolId
      // This ensures schoolId is always a valid ObjectId which is required
      userData.schoolId = targetSchool;
      
      // For detailed logging to track the issue
      console.log('Creating teacher user with targetSchool:', targetSchool);
      console.log('targetSchool type:', typeof targetSchool);
      console.log('targetSchool valid ObjectId:', mongoose.Types.ObjectId.isValid(targetSchool));
      
      // ALWAYS initialize schools array with the validated targetSchool
      // This ensures we always have at least one valid school
      userData.schools = [targetSchool];
      
      // Log request schools for debugging
      if (req.body.schools) {
        console.log('Request schools value:', JSON.stringify(req.body.schools));
        console.log('req.body.schools type:', typeof req.body.schools);
        console.log('Is array:', Array.isArray(req.body.schools));
      }
      
      // Handle schools from request - with extra validation and error handling
      try {
        if (req.body.schools && Array.isArray(req.body.schools)) {
          // CRITICAL: Create a fresh array with only valid ObjectId schools
          const validSchools = [];
          
          // Check each item carefully
          for (const school of req.body.schools) {
            // Skip empty or invalid values
            if (!school) {
              console.log('Skipping empty school value');
              continue;
            }
            
            // Handle string values
            if (typeof school === 'string' && mongoose.Types.ObjectId.isValid(school)) {
              console.log(`Adding valid school ID: ${school}`);
              validSchools.push(school);
            } else {
              console.log(`Skipping invalid school value: ${school}`, typeof school);
            }
          }
          
          // Only use the collected schools if we found valid ones
          if (validSchools.length > 0) {
            console.log(`Found ${validSchools.length} valid schools in request`);
            userData.schools = validSchools;
          } else {
            console.log('No valid schools in request, using admin school as fallback');
          }
        } else {
          console.log('No schools array in request, using admin school as fallback');
        }
      } catch (error) {
        console.error('Error processing schools array:', error);
        // Keep using the default admin's school on error
      }
      
      // Optional: Set classes if provided with validation
      if (req.body.classes) {
        try {
          if (Array.isArray(req.body.classes)) {
            const validClasses = req.body.classes.filter(cls => 
              cls && typeof cls === 'string' && mongoose.Types.ObjectId.isValid(cls)
            );
            
            if (validClasses.length > 0) {
              userData.classes = validClasses;
              console.log(`Added ${validClasses.length} valid classes to teacher`);
            }
          }
        } catch (error) {
          console.error('Error processing classes array:', error);
        }
      }
      
      // Final log of what will be used
      console.log(`Teacher user final data: schoolId=${userData.schoolId}, schools=`, JSON.stringify(userData.schools));
    } else if (role === 'secretary') {
      // Always use the targetSchool (admin's school) as the base schoolId
      // This ensures schoolId is always a valid ObjectId
      userData.schoolId = targetSchool;
      
      // Initialize schools with admin's school as a safe default
      userData.schools = [targetSchool];
      
      // Only add schools from the request if they exist and are valid
      if (req.body.schools && Array.isArray(req.body.schools) && req.body.schools.length > 0) {
        try {
          // Only add valid school IDs, ignore any invalid ones
          const validSchools = req.body.schools.filter(school => 
            school && typeof school === 'string' && mongoose.Types.ObjectId.isValid(school)
          );
          
          // Only replace the default if we have valid schools
          if (validSchools.length > 0) {
            userData.schools = validSchools;
          }
        } catch (error) {
          console.error('Error processing secretary schools array:', error);
          // Keep the default admin's school on error
        }
      }
      
      console.log(`Secretary user: Using schoolId=${userData.schoolId} and schools=`, userData.schools);
      
      // Set secretary permissions if provided
      if (req.body.secretaryPermissions) {
        userData.secretaryPermissions = req.body.secretaryPermissions;
      }
    } else if (role === 'admin') {
      // Admins are tied to a school
      userData.schoolId = targetSchool;
      
      // Set admin permissions if provided
      if (req.body.adminPermissions) {
        userData.adminPermissions = req.body.adminPermissions;
      }
    }

    console.log('Creating user with data:', { ...userData, password: '[HIDDEN]' });

    // Create user
    const user = await User.create(userData);

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        message: 'User created successfully'
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    console.error('Error creating user:', error.message);
    res.status(400);
    throw new Error('Failed to create user: ' + error.message);
  }
});

// @desc    Get users by role (admin, teacher, student, etc.)
// @route   GET /api/users/role/:role
// @access  Private/Admin/Teacher
const getUsersByRole = asyncHandler(async (req, res) => {
  const { role } = req.params;
  const validRoles = ['admin', 'teacher', 'student', 'secretary', 'parent'];
  
  console.log(`getUsersByRole endpoint called for role: ${role} by user ${req.user.name} (${req.user.role})`);
  
  if (!validRoles.includes(role)) {
    res.status(400);
    throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
  }
  
  try {
    // Check if requesting user is admin, teacher, or secretary
    const canAccess = ['admin', 'teacher', 'secretary', 'superadmin'].includes(req.user.role);
    if (!canAccess) {
      res.status(403);
      throw new Error('Not authorized to access user list by role');
    }
    
    // Apply schoolId filtering for multi-tenancy (except for superadmin)
    const filter = { role };
    if (req.user.role !== 'superadmin' && req.user.schoolId) {
      filter.schoolId = req.user.schoolId;
    }
    
    // CLASS-BASED FILTERING FOR TEACHERS
    // If teacher is looking for students, only show students from their classes
    let users = [];
    
    if (req.user.role === 'teacher' && role === 'student') {
      // Get the teacher's classes first
      console.log(`Teacher ${req.user.name} (${req.user._id}) fetching their students`);
      
      // Find classes where this teacher is assigned
      const teacherClasses = await Class.find({
        teachers: req.user._id
      }).lean();
      
      if (teacherClasses && teacherClasses.length > 0) {
        console.log(`Teacher has ${teacherClasses.length} assigned classes:`, 
          teacherClasses.map(c => c.name || c._id));
        
        // Get all student IDs from these classes
        const studentIds = [];
        for (const cls of teacherClasses) {
          if (cls.students && cls.students.length > 0) {
            studentIds.push(...cls.students);
          }
        }
        
        // Remove duplicates from studentIds
        const uniqueStudentIds = [...new Set(studentIds)];
        console.log(`Found ${uniqueStudentIds.length} unique students in teacher's classes`);
        
        // Add student IDs to filter
        if (uniqueStudentIds.length > 0) {
          filter._id = { $in: uniqueStudentIds };
        } else {
          // If teacher has no students, return empty array instead of all students
          console.log(`Teacher has no students in their classes, returning empty array`);
          return res.json([]); 
        }
      } else {
        console.log(`Teacher has no assigned classes, returning empty array`);
        return res.json([]);
      }
    }
    
    console.log(`Fetching ${role}s with filter:`, filter);
    
    users = await User.find(filter)
      .select('-password')
      .populate('school', 'name')
      .populate('direction', 'name direction subject schoolBranch')
      .populate('subjects', 'name')
      .populate('schools', 'name')
      .populate('directions', 'name direction subject schoolBranch')
      .lean();
    
    console.log(`Found ${users.length} ${role}s`);
    return res.json(users); // Added return to ensure response completes
  } catch (error) {
    console.error(`Error in getUsersByRole (${role}):`, error.message);
    // Ensure we return proper error response
    return res.status(error.statusCode || 500).json({
      message: error.message || `Error retrieving ${role} list`
    });
  }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  console.log(`getUserById endpoint called for ID: ${req.params.id}`);
  
  try {
    // Check if id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.error(`Invalid user ID format: ${req.params.id}`);
      res.status(400);
      throw new Error('Invalid user ID format');
    }
    
    // Find the user with multi-tenancy filtering for regular admins
    // Superadmins can access any user
    const query = { _id: req.params.id };
    
    // If not superadmin, restrict to users in the same school
    if (req.user.role !== 'superadmin') {
      query.schoolId = req.user.schoolId;
    }
    
    console.log(`Searching for user with query:`, query);
    
    // Find user with populated fields
    const user = await User.findOne(query)
      .select('-password')
      .populate('school', 'name domain')
      .populate('direction', 'name direction subject schoolBranch')
      .populate('schools', 'name domain')
      .populate('directions', 'name direction subject schoolBranch')
      .populate('subjects', 'name');
    
    if (!user) {
      console.error(`User not found with ID: ${req.params.id}`);
      res.status(404);
      throw new Error('User not found');
    }
    
    console.log(`Found user: ${user.name} (${user.email})`);
    res.status(200).json(user);
  } catch (error) {
    console.error(`Error retrieving user by ID:`, error);
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw error;
  }
});

// @desc    Update user by ID (for admin to edit user permissions/details)
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  console.log(`updateUser endpoint called for user ID: ${req.params.id}`);
  console.log('Update data:', req.body);
  
  try {
    // Find the user by ID
    const user = await User.findById(req.params.id);
    
    if (!user) {
      console.error(`User with ID ${req.params.id} not found`);
      res.status(404);
      throw new Error('User not found');
    }
    
    // Update user fields if provided in the request
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    if (req.body.role) user.role = req.body.role;
    if (req.body.isActive !== undefined) user.isActive = req.body.isActive;
    if (req.body.mobilePhone !== undefined) user.mobilePhone = req.body.mobilePhone;
    if (req.body.personalEmail !== undefined) user.personalEmail = req.body.personalEmail;
    
    // Handle array fields specially - replacing the entire array if provided
    if (req.body.schools) {
      console.log('Updating schools:', req.body.schools);
      user.schools = req.body.schools;
      
      // CRITICAL FIX: Don't set school singular field for teachers/secretaries
      // This prevents schema validation errors with arrays vs single values
      if (user.role === 'student' && req.body.school) {
        // Only set singular school field for students
        user.school = req.body.school;
      }
    } else if (req.body.school && user.role === 'student') {
      // Handle singular school field - only for students
      user.school = req.body.school;
    }
    
    if (req.body.directions) {
      console.log('Updating directions:', req.body.directions);
      // Set the array field
      user.directions = req.body.directions;
      
      // CRITICAL FIX: Don't set direction singular field for teachers/secretaries
      // This prevents the casting error when trying to assign an array to a single ObjectId
      if (user.role === 'student' && req.body.direction) {
        // Only set the singular direction field for students
        user.direction = req.body.direction;
      }
    } else if (req.body.direction && user.role === 'student') {
      // Handle singular direction field - only for students
      user.direction = req.body.direction;
    }
    
    // Update subjects if provided
    if (req.body.subjects) {
      console.log('Updating subjects:', req.body.subjects);
      user.subjects = req.body.subjects;
    }
    
    // CRITICAL FIX: Handle teacher-specific permission fields
    if (user.role === 'teacher') {
      console.log('Processing teacher permissions:');
      
      // Handle canSendNotifications permission
      if (req.body.canSendNotifications !== undefined) {
        console.log(`Setting canSendNotifications to: ${req.body.canSendNotifications}`);
        user.canSendNotifications = req.body.canSendNotifications;
      }
      
      // Handle canAddGradeDescriptions permission
      if (req.body.canAddGradeDescriptions !== undefined) {
        console.log(`Setting canAddGradeDescriptions to: ${req.body.canAddGradeDescriptions}`);
        user.canAddGradeDescriptions = req.body.canAddGradeDescriptions;
      }
    }
    
    // Handle secretary permissions if present
    if (user.role === 'secretary' && req.body.secretaryPermissions) {
      console.log('Updating secretary permissions:', req.body.secretaryPermissions);
      user.secretaryPermissions = {
        ...user.secretaryPermissions, // Keep existing permissions
        ...req.body.secretaryPermissions // Apply updates
      };
    }
    
    // Only update password if provided and not empty
    if (req.body.password && req.body.password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }
    
    // Save the updated user
    const updatedUser = await user.save();
    console.log('User successfully updated with ID:', updatedUser._id);
    
    // Return the updated user without password
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      schools: updatedUser.schools,
      directions: updatedUser.directions,
      subjects: updatedUser.subjects,
      canSendNotifications: updatedUser.canSendNotifications,
      canAddGradeDescriptions: updatedUser.canAddGradeDescriptions,
      secretaryPermissions: updatedUser.secretaryPermissions,
      mobilePhone: updatedUser.mobilePhone,
      personalEmail: updatedUser.personalEmail,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500);
    throw new Error('Failed to update user: ' + error.message);
  }
});

// @desc    Get all teachers for admin
// @route   GET /api/users/teachers
// @access  Private/Admin
const getTeachers = asyncHandler(async (req, res) => {
  console.log('getTeachers endpoint called for admin');
  
  try {
    const teachers = await User.find({
      schoolId: req.user.schoolId,
      role: 'teacher',
      isActive: { $ne: false }
    })
    .select('_id name email')
    .lean();
    
    console.log(`Found ${teachers.length} teachers for school ${req.user.schoolId}`);
    res.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500);
    throw new Error('Failed to fetch teachers');
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
  getUserById,
  createUserByAdmin,
  getUsersByRole,
  updateUser,
  getTeachers,
  generateToken,
  generateRefreshToken
};
