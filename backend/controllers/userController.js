const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const User = require('../models/userModel');
const Class = require('../models/classModel');
const logger = require('../utils/logger');
// Single database architecture - no need for multiDbConnect

// Email service function for sending credentials via Brevo SMTP
const sendCredentialsEmail = async ({ name, email, loginEmail, password, role, studentName }) => {
  // Create transporter for Brevo SMTP
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // false for port 587
    auth: {
      user: process.env.SMTP_USER, // Your Brevo account email
      pass: process.env.SMTP_PASS  // Your Brevo SMTP key
    }
  });

  const emailTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1976d2; margin: 0;">📚 GradeBook</h1>
          <p style="color: #666; margin: 5px 0 0 0;">Your Educational Management System</p>
        </div>
        
        <h2 style="color: #333; margin-bottom: 20px;">Welcome to GradeBook!</h2>
        
        <p style="color: #555; line-height: 1.6;">Hello <strong>${name}</strong>,</p>
        
        <p style="color: #555; line-height: 1.6;">
          Your account has been created in the GradeBook system with the role of <strong>${role}</strong>.
          ${role === 'parent' ? `This account is linked to your child <strong>${studentName}</strong>, allowing you to monitor their academic progress, grades, and school communications.` : 'You can now access the system using the credentials below.'}
        </p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1976d2;">
          <h3 style="color: #1976d2; margin-top: 0;">🔐 Login Credentials</h3>
          <p style="margin: 10px 0;"><strong>Email:</strong> ${loginEmail}</p>
          <p style="margin: 10px 0;"><strong>Password:</strong> <code style="background: #e3f2fd; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${password}</code></p>
        </div>
        
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h4 style="color: #856404; margin-top: 0;">⚠️ Important Security Notice</h4>
          <p style="color: #856404; margin: 0; line-height: 1.5;">
            For your security, you will be required to change this password when you first log in. 
            Please choose a strong, unique password that only you know.
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
             style="background-color: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            🚀 Login to GradeBook
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #888; font-size: 12px; text-align: center; margin: 0;">
          This email was sent from GradeBook System. If you did not expect this email, please contact your administrator.
        </p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"${process.env.SMTP_FROM_NAME || 'GradeBook System'}" <${process.env.SMTP_FROM_EMAIL || 'mail@gradebook.pro'}>`,
    to: email,
    subject: `🎓 Welcome to GradeBook - Your Login Credentials`,
    html: emailTemplate,
    replyTo: process.env.SMTP_FROM_EMAIL || 'mail@gradebook.pro'
  };

  await transporter.sendMail(mailOptions);
  console.log(`Credentials email sent to ${email} for user ${name}`);
};

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
      // First-login password change fields
      requirePasswordChange: user.requirePasswordChange,
      isFirstLogin: user.isFirstLogin,
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
      personalEmail,
      emailCredentials,
      generatedPassword
    } = req.body;
    
    // Debug email credentials
    console.log('Email credentials debug:', {
      emailCredentials,
      generatedPassword: generatedPassword ? '[PRESENT]' : '[MISSING]',
      personalEmail,
      hasEmailCredentials: !!emailCredentials,
      hasGeneratedPassword: !!generatedPassword
    });

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
      active: true,
      requirePasswordChange: true, // Force password change on first login
      isFirstLogin: true
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
      let responseMessage = 'User created successfully';
      
      // Handle email credentials if requested
      if (emailCredentials && generatedPassword) {
        console.log('Attempting to send credentials email...');
        try {
          await sendCredentialsEmail({
            name: user.name,
            email: personalEmail || user.email,
            loginEmail: user.email,
            password: generatedPassword,
            role: user.role
          });
          console.log('✅ Credentials email sent successfully');
          responseMessage += ' and credentials sent via email';
        } catch (emailError) {
          console.error('❌ Failed to send credentials email:', emailError.message);
          console.error('Email error details:', emailError);
          responseMessage += ' but failed to send email credentials';
        }
      } else {
        console.log('Email credentials not requested or missing data:', {
          emailCredentials,
          hasGeneratedPassword: !!generatedPassword
        });
      }
      
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        requirePasswordChange: user.requirePasswordChange,
        isFirstLogin: user.isFirstLogin,
        message: responseMessage
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

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  console.log(`deleteUser endpoint called for ID: ${req.params.id} by user ${req.user.name} (${req.user.role})`);
  
  try {
    // Check if id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.error(`Invalid user ID format: ${req.params.id}`);
      res.status(400);
      throw new Error('Invalid user ID format');
    }
    
    // Prevent users from deleting themselves
    if (req.params.id === req.user.id.toString()) {
      console.error(`User ${req.user.name} attempted to delete themselves`);
      res.status(400);
      throw new Error('Cannot delete your own account');
    }
    
    // Find the user with multi-tenancy filtering for regular admins
    // Superadmins can delete any user
    const query = { _id: req.params.id };
    
    // If not superadmin, restrict to users in the same school
    if (req.user.role !== 'superadmin') {
      query.schoolId = req.user.schoolId;
    }
    
    console.log(`Searching for user to delete with query:`, query);
    
    // Find the user first to check if it exists
    const userToDelete = await User.findOne(query);
    
    if (!userToDelete) {
      console.error(`User not found with ID: ${req.params.id}`);
      res.status(404);
      throw new Error('User not found');
    }
    
    // Prevent deletion of superadmin users by non-superadmins
    if (userToDelete.role === 'superadmin' && req.user.role !== 'superadmin') {
      console.error(`Non-superadmin ${req.user.name} attempted to delete superadmin user`);
      res.status(403);
      throw new Error('Cannot delete superadmin users');
    }
    
    console.log(`Deleting user: ${userToDelete.name} (${userToDelete.email}) - Role: ${userToDelete.role}`);
    
    // Delete the user
    await User.findByIdAndDelete(req.params.id);
    
    console.log(`Successfully deleted user: ${userToDelete.name}`);
    
    res.json({
      message: `User ${userToDelete.name} deleted successfully`,
      deletedUser: {
        _id: userToDelete._id,
        name: userToDelete.name,
        email: userToDelete.email,
        role: userToDelete.role
      }
    });
  } catch (error) {
    console.error(`Error in deleteUser:`, error.message);
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Failed to delete user');
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

// @desc    Change user password
// @route   POST /api/users/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  console.log(`changePassword endpoint called for user ${req.user.name} (${req.user._id})`);
  
  const { currentPassword, newPassword } = req.body;
  
  // Validate required fields
  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Current password and new password are required');
  }
  
  // Validate new password length
  if (newPassword.length < 6) {
    res.status(400);
    throw new Error('New password must be at least 6 characters long');
  }
  
  try {
    // Get the current user
    const user = await User.findById(req.user._id);
    
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      console.log(`Invalid current password for user: ${user.email}`);
      res.status(400);
      throw new Error('Current password is incorrect');
    }
    
    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    
    if (isSamePassword) {
      res.status(400);
      throw new Error('New password must be different from current password');
    }
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);
    
    // Update user password and clear first-login flags
    user.password = hashedNewPassword;
    user.requirePasswordChange = false;
    user.isFirstLogin = false;
    
    await user.save();
    
    console.log(`Password changed successfully for user: ${user.email}`);
    
    res.json({
      message: 'Password changed successfully',
      requirePasswordChange: false,
      isFirstLogin: false
    });
    
  } catch (error) {
    console.error(`Error changing password for user ${req.user._id}:`, error.message);
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Failed to change password');
  }
});

// @desc    Create parent account for existing student(s)
// @route   POST /api/users/create-parent
// @access  Private/Admin
const createParentAccount = asyncHandler(async (req, res) => {
  console.log('createParentAccount endpoint called');
  
  const {
    studentIds, // Now accepts array of student IDs
    parentName,
    parentEmail,
    parentPassword,
    parentMobilePhone,
    parentPersonalEmail,
    emailCredentials
  } = req.body;
  
  // Validate required fields
  if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0 || !parentName || !parentEmail || !parentPassword) {
    res.status(400);
    throw new Error('Student IDs (array), parent name, email, and password are required');
  }
  
  try {
    // Verify all students exist and belong to admin's school
    const students = await User.find({
      _id: { $in: studentIds },
      role: 'student',
      schoolId: req.user.schoolId
    });
    
    if (students.length !== studentIds.length) {
      res.status(404);
      throw new Error('One or more students not found or not in your school');
    }
    
    // Check if parent email already exists in this school
    const emailExists = await User.findOne({
      email: parentEmail,
      schoolId: req.user.schoolId
    });
    
    if (emailExists) {
      // If parent already exists, link to additional students
      if (emailExists.role !== 'parent') {
        res.status(400);
        throw new Error('Email already exists for a non-parent account');
      }
      
      // Add new students to existing parent's linkedStudentIds
      const newStudentIds = studentIds.filter(id => !emailExists.linkedStudentIds.includes(id));
      
      if (newStudentIds.length === 0) {
        res.status(400);
        throw new Error('Parent is already linked to all specified students');
      }
      
      emailExists.linkedStudentIds.push(...newStudentIds);
      await emailExists.save();
      
      // Update students' parentIds arrays
      await User.updateMany(
        { _id: { $in: newStudentIds } },
        { $addToSet: { parentIds: emailExists._id } }
      );
      
      console.log(`Linked existing parent ${emailExists.name} to ${newStudentIds.length} additional students`);
      
      return res.status(200).json({
        _id: emailExists._id,
        name: emailExists.name,
        email: emailExists.email,
        role: emailExists.role,
        linkedStudentIds: emailExists.linkedStudentIds,
        linkedStudentNames: students.map(s => s.name),
        mobilePhone: emailExists.mobilePhone,
        personalEmail: emailExists.personalEmail,
        message: 'Parent linked to additional students'
      });
    }
    
    // Hash password for new parent
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(parentPassword, salt);
    
    // Create new parent account
    const parentData = {
      name: parentName,
      email: parentEmail,
      password: hashedPassword,
      role: 'parent',
      schoolId: req.user.schoolId,
      linkedStudentIds: studentIds,
      mobilePhone: parentMobilePhone || '',
      personalEmail: parentPersonalEmail || '',
      active: true,
      requirePasswordChange: true, // Force password change on first login
      isFirstLogin: true
    };
    
    const parent = await User.create(parentData);
    
    // Update all students' parentIds arrays
    await User.updateMany(
      { _id: { $in: studentIds } },
      { $addToSet: { parentIds: parent._id } }
    );
    
    console.log(`Parent account created: ${parent.name} (${parent.email}) linked to ${students.length} students`);
    
    // Send credentials email if requested
    if (emailCredentials && parentEmail) {
      try {
        await sendCredentialsEmail({
          name: parentName,
          email: parentEmail,
          loginEmail: parentEmail,
          password: parentPassword,
          role: 'parent',
          studentName: students.map(s => s.name).join(', ')
        });
        console.log(`Credentials email sent to parent: ${parentEmail}`);
      } catch (emailError) {
        console.error('Failed to send parent credentials email:', emailError);
        // Don't fail the entire operation if email fails
      }
    }
    
    // Return parent account info (without password)
    res.status(201).json({
      _id: parent._id,
      name: parent.name,
      email: parent.email,
      role: parent.role,
      linkedStudentIds: parent.linkedStudentIds,
      linkedStudentNames: students.map(s => s.name),
      mobilePhone: parent.mobilePhone,
      personalEmail: parent.personalEmail,
      createdAt: parent.createdAt
    });
    
  } catch (error) {
    console.error('Error creating parent account:', error.message);
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Failed to create parent account');
  }
});

// @desc    Get all parent accounts for student
// @route   GET /api/users/student/:studentId/parents
// @access  Private/Admin
const getParentsByStudent = asyncHandler(async (req, res) => {
  console.log(`getParentsByStudent called for student ID: ${req.params.studentId}`);
  
  try {
    // Verify student exists and belongs to admin's school
    const student = await User.findOne({
      _id: req.params.studentId,
      role: 'student',
      schoolId: req.user.schoolId
    });
    
    if (!student) {
      res.status(404);
      throw new Error('Student not found or not in your school');
    }
    
    // Find all parent accounts linked to this student
    const parents = await User.find({
      role: 'parent',
      linkedStudentIds: req.params.studentId
    }).select('-password');
    
    res.json({
      hasParents: parents.length > 0,
      parentCount: parents.length,
      parents: parents.map(parent => ({
        _id: parent._id,
        name: parent.name,
        email: parent.email,
        role: parent.role,
        linkedStudentIds: parent.linkedStudentIds,
        mobilePhone: parent.mobilePhone,
        personalEmail: parent.personalEmail,
        active: parent.active,
        createdAt: parent.createdAt
      }))
    });
    
  } catch (error) {
    console.error('Error getting parents by student:', error.message);
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Failed to get parent accounts');
  }
});

// @desc    Get all students data for parent dashboard
// @route   GET /api/users/parent/students-data
// @access  Private/Parent
const getStudentsDataForParent = asyncHandler(async (req, res) => {
  console.log(`getStudentsDataForParent called for parent: ${req.user.email}`);
  
  try {
    // Verify user is a parent
    if (req.user.role !== 'parent') {
      res.status(403);
      throw new Error('Access denied. Parent role required.');
    }
    
    // Get all parent's linked students
    const students = await User.find({
      _id: { $in: req.user.linkedStudentIds },
      role: 'student'
    }).select('-password');
    
    if (students.length === 0) {
      res.status(404);
      throw new Error('No linked students found');
    }
    
    const Grade = require('../models/gradeModel');
    const Notification = require('../models/notificationModel');
    
    // Get data for each student
    const studentsData = await Promise.all(students.map(async (student) => {
      // Get recent grades for this student
      const recentGrades = await Grade.find({
        studentId: student._id
      })
      .populate('subjectId', 'name')
      .populate('teacherId', 'name')
      .sort({ createdAt: -1 })
      .limit(5); // Limit per student to avoid too much data
      
      // Get recent notifications for this student
      const recentNotifications = await Notification.find({
        $or: [
          { recipientIds: student._id },
          { recipientRole: 'student' }
        ]
      })
      .populate('senderId', 'name')
      .sort({ createdAt: -1 })
      .limit(5); // Limit per student
      
      return {
        student: {
          _id: student._id,
          name: student.name,
          email: student.email,
          mobilePhone: student.mobilePhone,
          personalEmail: student.personalEmail,
          active: student.active,
          createdAt: student.createdAt
        },
        recentGrades: recentGrades.map(grade => ({
          _id: grade._id,
          value: grade.value,
          subject: grade.subjectId?.name || 'Unknown Subject',
          teacher: grade.teacherId?.name || 'Unknown Teacher',
          description: grade.description,
          createdAt: grade.createdAt
        })),
        recentNotifications: recentNotifications.map(notification => ({
          _id: notification._id,
          title: notification.title,
          message: notification.message,
          sender: notification.senderId?.name || 'System',
          priority: notification.priority,
          createdAt: notification.createdAt
        }))
      };
    }));
    
    // Also get combined recent activity across all students
    const allStudentIds = students.map(s => s._id);
    
    const allRecentGrades = await Grade.find({
      studentId: { $in: allStudentIds }
    })
    .populate('studentId', 'name')
    .populate('subjectId', 'name')
    .populate('teacherId', 'name')
    .sort({ createdAt: -1 })
    .limit(10);
    
    const allRecentNotifications = await Notification.find({
      $or: [
        { recipientIds: { $in: allStudentIds } },
        { recipientRole: 'student' }
      ]
    })
    .populate('senderId', 'name')
    .sort({ createdAt: -1 })
    .limit(10);
    
    res.json({
      studentsCount: students.length,
      studentsData,
      combinedRecentGrades: allRecentGrades.map(grade => ({
        _id: grade._id,
        value: grade.value,
        studentName: grade.studentId?.name || 'Unknown Student',
        subject: grade.subjectId?.name || 'Unknown Subject',
        teacher: grade.teacherId?.name || 'Unknown Teacher',
        description: grade.description,
        createdAt: grade.createdAt
      })),
      combinedRecentNotifications: allRecentNotifications.map(notification => ({
        _id: notification._id,
        title: notification.title,
        message: notification.message,
        sender: notification.senderId?.name || 'System',
        priority: notification.priority,
        createdAt: notification.createdAt
      }))
    });
    
  } catch (error) {
    console.error('Error getting students data for parent:', error.message);
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Failed to get students data');
  }
});

// @desc    Get all students linked to a parent
// @route   GET /api/users/parent/:parentId/students
// @access  Private/Admin
const getStudentsByParent = asyncHandler(async (req, res) => {
  console.log(`getStudentsByParent called for parent ID: ${req.params.parentId}`);
  
  try {
    // Verify parent exists and belongs to admin's school
    const parent = await User.findOne({
      _id: req.params.parentId,
      role: 'parent',
      schoolId: req.user.schoolId
    });
    
    if (!parent) {
      res.status(404);
      throw new Error('Parent not found or not in your school');
    }
    
    // Get all students linked to this parent
    const students = await User.find({
      _id: { $in: parent.linkedStudentIds },
      role: 'student'
    }).select('-password');
    
    res.json({
      parentId: parent._id,
      parentName: parent.name,
      studentsCount: students.length,
      students: students.map(student => ({
        _id: student._id,
        name: student.name,
        email: student.email,
        mobilePhone: student.mobilePhone,
        personalEmail: student.personalEmail,
        active: student.active,
        createdAt: student.createdAt
      }))
    });
    
  } catch (error) {
    console.error('Error getting students by parent:', error.message);
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Failed to get students');
  }
});

// @desc    Unlink parent from student(s)
// @route   DELETE /api/users/parent/:parentId/students
// @access  Private/Admin
const unlinkParentFromStudents = asyncHandler(async (req, res) => {
  console.log(`unlinkParentFromStudents called for parent ID: ${req.params.parentId}`);
  
  const { studentIds } = req.body; // Array of student IDs to unlink
  
  if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
    res.status(400);
    throw new Error('Student IDs array is required');
  }
  
  try {
    // Verify parent exists and belongs to admin's school
    const parent = await User.findOne({
      _id: req.params.parentId,
      role: 'parent',
      schoolId: req.user.schoolId
    });
    
    if (!parent) {
      res.status(404);
      throw new Error('Parent not found or not in your school');
    }
    
    // Remove students from parent's linkedStudentIds
    parent.linkedStudentIds = parent.linkedStudentIds.filter(
      id => !studentIds.includes(id.toString())
    );
    await parent.save();
    
    // Remove parent from students' parentIds arrays
    await User.updateMany(
      { _id: { $in: studentIds } },
      { $pull: { parentIds: parent._id } }
    );
    
    console.log(`Unlinked parent ${parent.name} from ${studentIds.length} students`);
    
    res.json({
      message: 'Parent-student links removed successfully',
      parentId: parent._id,
      unlinkedStudentIds: studentIds,
      remainingLinkedStudents: parent.linkedStudentIds.length
    });
    
  } catch (error) {
    console.error('Error unlinking parent from students:', error.message);
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Failed to unlink parent from students');
  }
});

// Export functions
module.exports = {
  registerUser,
  loginUser,
  refreshToken,
  getMe,
  updateProfile,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getStudents,
  getTeachers,
  changePassword,
  createParentAccount,
  getParentsByStudent,
  getStudentsDataForParent,
  getStudentsByParent,
  unlinkParentFromStudents,
  generateToken,
  generateRefreshToken
};
