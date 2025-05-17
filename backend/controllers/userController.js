const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const { getModel } = require('../config/multiDbManager');
const userSchema = require('../models/userModel').schema;
const tenantSchema = require('../models/tenantModel').schema;

// @desc    Register new user (now protected and requires tenant context)
// @route   POST /api/users
// @access  Private/Admin or SchoolOwner
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, school, direction, subjects } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please add all required fields');
  }
  
  // This function now requires authentication and tenant context
  if (!req.user || !req.tenantId) {
    res.status(401);
    throw new Error('Not authorized - tenant context required');
  }
  
  // Only admin, school_owner, or superadmin can register users
  if (req.user.role !== 'admin' && req.user.role !== 'school_owner' && req.user.role !== 'superadmin') {
    res.status(403);
    throw new Error('Not authorized to register users');
  }

  try {
    // First check if user exists in the main database (email must be unique system-wide)
    const MainUser = await getModel('main', 'User', userSchema);
    const userExistsGlobally = await MainUser.findOne({ email });

    if (userExistsGlobally) {
      res.status(400);
      throw new Error('Email already in use by another account');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Determine which tenant database to use
    // For superadmin creating school_owner, use main database
    // For all others, use the tenant database
    let user;
    
    // Prepare base user object
    const userData = {
      name,
      email,
      password: hashedPassword,
      role: role || 'student', // Default role is student
    };
    
    if (req.user.role === 'superadmin' && role === 'school_owner') {
      // Superadmin creating school owner - use main database
      // This will be linked to a tenant later when creating the tenant
      user = await MainUser.create(userData);
    } else {
      // Regular user creation within a tenant
      // Include tenant reference
      userData.tenantId = req.tenantId;
      
      // Include school, direction, subjects if provided and appropriate
      if (role === 'student' || role === 'teacher') {
        if (school) userData.school = school;
        if (direction) userData.direction = direction;
        if (subjects) userData.subjects = subjects;
      }
      
      // Create user in main database for authentication
      user = await MainUser.create(userData);
      
      // Also create the user in the tenant's database for data operations
      if (req.tenantId !== 'main') {
        const TenantUser = await getModel(req.tenantId, 'User', userSchema);
        await TenantUser.create(userData);
      }
    }

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Failed to create user');
    }
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(400);
    throw new Error(error.message || 'Invalid user data');
  }
});

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  console.log(`Login attempt for email: ${email}`);

  try {
    // Get User model from the main database
    const MainUser = await getModel('main', 'User', userSchema);
    
    // Check for user email in the main database
    const user = await MainUser.findOne({ email }).select('+password');
    
    if (!user) {
      console.log(`User not found for email: ${email}`);
      res.status(401);
      throw new Error('Invalid credentials - user not found');
    }
    
    console.log(`User found: ${user.name}, role: ${user.role}, password length: ${user.password ? user.password.length : 'undefined'}`);
    
    // Check if the password matches
    if (!user.password) {
      console.error('User record has no password field');
      res.status(500);
      throw new Error('User account is misconfigured - contact support');
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`Password comparison for ${email}: ${isMatch}`);
    
    if (isMatch) {
      // Login successful
      console.log(`Login successful for ${email}`);
      
      // For school owners, add tenant information
      let tenantInfo = null;
      if (user.role === 'school_owner' && user.tenantId) {
        const TenantModel = await getModel('main', 'Tenant', tenantSchema);
        tenantInfo = await TenantModel.findById(user.tenantId).select('name status');
        
        // Check if the tenant is active
        if (!tenantInfo || tenantInfo.status !== 'active') {
          console.log(`Tenant not active for user ${email}`);
          res.status(403);
          throw new Error('Your school account is currently inactive. Please contact support.');
        }
      }
      
      // Prepare response
      const responseData = {
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        darkMode: user.darkMode || false,
        saveCredentials: user.saveCredentials || false,
        token: generateToken(user._id)
      };
      
      // Add tenantId for non-superadmin users
      if (user.role !== 'superadmin' && user.tenantId) {
        responseData.tenantId = user.tenantId;
      }
      
      res.json(responseData);
    } else {
      // If password doesn't match, log info for debugging
      console.log(`Password didn't match for ${email}`);
      res.status(401);
      throw new Error(`Invalid credentials - password mismatch`);
    }
  } catch (error) {
    console.log(`Login error for ${email}: ${error.message}`);
    res.status(401);
    throw new Error(`Invalid credentials - ${error.message}`);
  }
});

// @desc    Get current user data with populated fields from appropriate tenant
// @route   GET /api/users/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  try {
    // req.user comes from the authentication middleware
    // req.tenantId comes from the tenant resolver middleware
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized');
    }
    
    let user;
    const userId = req.user._id;
    
    if (req.user.role === 'superadmin') {
      // For superadmin, simply return the user from main database
      const MainUser = await getModel('main', 'User', userSchema);
      user = await MainUser.findById(userId).select('-password');
    } else if (req.user.role === 'school_owner') {
      // For school owners, get their tenant info too
      const MainUser = await getModel('main', 'User', userSchema);
      user = await MainUser.findById(userId).select('-password');
      
      // Add tenant information
      if (user.tenantId) {
        const TenantModel = await getModel('main', 'Tenant', tenantSchema);
        const tenantInfo = await TenantModel.findById(user.tenantId)
          .select('name status');
          
        if (tenantInfo) {
          user = user.toObject();
          user.tenantInfo = {
            name: tenantInfo.name,
            status: tenantInfo.status
          };
        }
      }
    } else {
      // For regular users, get from their tenant database with populated fields
      if (!req.tenantId) {
        res.status(400);
        throw new Error('Tenant ID not found for this user');
      }
      
      const TenantUser = await getModel(req.tenantId, 'User', userSchema);
      
      // Use the tenant's user database for data
      user = await TenantUser.findById(userId)
        .select('-password')
        .populate('school', 'name')
        .populate('direction', 'name')
        .populate('subjects', 'name');
        
      if (!user) {
        // Fall back to main database if not found in tenant DB
        // This could happen during initial setup or if tenant DB was reset
        const MainUser = await getModel('main', 'User', userSchema);
        user = await MainUser.findById(userId).select('-password');
      }
    }
    
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Error in getMe:', error);
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Error retrieving user data');
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

// @desc    Get all users based on role and tenant
// @route   GET /api/users
// @access  Private/Admin or SchoolOwner or SuperAdmin
const getUsers = asyncHandler(async (req, res) => {
  try {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized');
    }

    let users = [];

    // Handle different authorization scenarios
    if (req.user.role === 'superadmin') {
      // Superadmin can view all users or filter by tenant
      const MainUser = await getModel('main', 'User', userSchema);
      const query = {};
      
      // Allow filtering by tenant
      if (req.query.tenantId) {
        query.tenantId = req.query.tenantId;
      }

      // Allow filtering by role
      if (req.query.role) {
        query.role = req.query.role;
      }

      users = await MainUser.find(query)
        .select('-password')
        .populate('tenantId', 'name status');
      
      // For users with a tenant, add the tenant info to each user
      if (users.length > 0) {
        const TenantModel = await getModel('main', 'Tenant', tenantSchema);
        const tenantIds = users
          .filter(user => user.tenantId)
          .map(user => user.tenantId);
        
        if (tenantIds.length > 0) {
          const tenants = await TenantModel.find({ _id: { $in: tenantIds } })
            .select('name status');
          
          const tenantsMap = {};
          tenants.forEach(tenant => {
            tenantsMap[tenant._id.toString()] = {
              name: tenant.name,
              status: tenant.status
            };
          });
          
          users = users.map(user => {
            const userObj = user.toObject();
            if (user.tenantId && tenantsMap[user.tenantId.toString()]) {
              userObj.tenantInfo = tenantsMap[user.tenantId.toString()];
            }
            return userObj;
          });
        }
      }
    } else if (req.user.role === 'school_owner' || req.user.role === 'admin') {
      // School owners and admins can only see users in their tenant
      if (!req.tenantId) {
        res.status(400);
        throw new Error('Tenant ID not provided');
      }

      const TenantUser = await getModel(req.tenantId, 'User', userSchema);
      users = await TenantUser.find({})
        .select('-password')
        .populate('school', 'name')
        .populate('direction', 'name')
        .populate('subjects', 'name');
    } else {
      // Regular users (teacher/student) cannot access this endpoint
      res.status(403);
      throw new Error('Not authorized to access user list');
    }

    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Error retrieving users');
  }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin or SchoolOwner or SuperAdmin
const getUserById = asyncHandler(async (req, res) => {
  try {
    // Check authorization
    if (!req.user || !req.tenantId) {
      res.status(401);
      throw new Error('Not authorized');
    }
    
    const userId = req.params.id;
    let user = null;
    
    // Handle different authorization scenarios
    if (req.user.role === 'superadmin') {
      // Superadmin can get any user from any database
      const MainUser = await getModel('main', 'User', userSchema);
      user = await MainUser.findById(userId)
        .select('-password')
        .populate('tenantId', 'name');
        
      // If this is a tenant user, add tenant info
      if (user && user.tenantId) {
        const TenantModel = await getModel('main', 'Tenant', tenantSchema);
        const tenantInfo = await TenantModel.findById(user.tenantId);
        if (tenantInfo) {
          user = user.toObject();
          user.tenantInfo = {
            name: tenantInfo.name,
            status: tenantInfo.status
          };
        }
      }
    } else if (req.user.role === 'school_owner') {
      // School owners can only view users in their own tenant
      // First verify the user belongs to this tenant
      const MainUser = await getModel('main', 'User', userSchema);
      const checkUser = await MainUser.findById(userId).select('tenantId');
      
      if (!checkUser || !checkUser.tenantId || checkUser.tenantId.toString() !== req.user.tenantId.toString()) {
        res.status(403);
        throw new Error('Not authorized to access this user');
      }
      
      // Get user from tenant database with populated fields
      const TenantUser = await getModel(req.tenantId, 'User', userSchema);
      user = await TenantUser.findById(userId)
        .select('-password')
        .populate('school', 'name')
        .populate('direction', 'name')
        .populate('subjects', 'name');
    } else if (req.user.role === 'admin') {
      // Admin can only view users in their own tenant
      // This will always be the tenant context from req.tenantId
      const TenantUser = await getModel(req.tenantId, 'User', userSchema);
      user = await TenantUser.findById(userId)
        .select('-password')
        .populate('school', 'name')
        .populate('direction', 'name')
        .populate('subjects', 'name');
    } else {
      // Regular users cannot access other users' data
      res.status(403);
      throw new Error('Not authorized to view user details');
    }

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    res.json(user);
  } catch (error) {
    console.error('Error getting user by ID:', error);
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Error retrieving user data');
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin or SchoolOwner or SuperAdmin
const updateUser = asyncHandler(async (req, res) => {
  try {
    // Check authorization
    if (!req.user || !req.tenantId) {
      res.status(401);
      throw new Error('Not authorized');
    }
    
    const userId = req.params.id;
    let user = null;
    let mainDbUser = null; // Reference to the user in the main DB
    
    // Check authorization level and get the appropriate user
    if (req.user.role === 'superadmin') {
      // Superadmin can update any user
      const MainUser = await getModel('main', 'User', userSchema);
      mainDbUser = await MainUser.findById(userId);
      user = mainDbUser;
      
      // If updating a school_owner (but not changing role), special rules apply
      if (user && user.role === 'school_owner' && (!req.body.role || req.body.role === 'school_owner')) {
        // Only allow updating name, email, password (not tenant or role)
        if (req.body.tenantId) {
          delete req.body.tenantId; // Prevent changing tenant association
        }
      }
    } else if (req.user.role === 'school_owner') {
      // School owners can only update users in their own tenant
      // First verify the user belongs to this tenant
      const MainUser = await getModel('main', 'User', userSchema);
      mainDbUser = await MainUser.findById(userId);
      
      if (!mainDbUser || !mainDbUser.tenantId || 
          mainDbUser.tenantId.toString() !== req.user.tenantId.toString()) {
        res.status(403);
        throw new Error('Not authorized to modify this user');
      }
      
      // School owners cannot change user to another tenant
      if (req.body.tenantId) {
        delete req.body.tenantId;
      }
      
      // School owners cannot promote to school_owner or superadmin
      if (req.body.role === 'school_owner' || req.body.role === 'superadmin') {
        res.status(403);
        throw new Error('Not authorized to assign this role');
      }
      
      // Get user from tenant database
      const TenantUser = await getModel(req.tenantId, 'User', userSchema);
      user = await TenantUser.findById(userId);
      
      if (!user) {
        // If not found in tenant DB but exists in main DB, create it
        user = await TenantUser.create({
          _id: mainDbUser._id, // Keep the same ID
          name: mainDbUser.name,
          email: mainDbUser.email,
          password: mainDbUser.password,
          role: mainDbUser.role,
          tenantId: mainDbUser.tenantId
        });
      }
    } else if (req.user.role === 'admin') {
      // Admin can only update users in their own tenant
      const MainUser = await getModel('main', 'User', userSchema);
      mainDbUser = await MainUser.findById(userId);
      
      if (!mainDbUser || !mainDbUser.tenantId || 
          mainDbUser.tenantId.toString() !== req.user.tenantId.toString()) {
        res.status(403);
        throw new Error('Not authorized to modify this user');
      }
      
      // Admins cannot change user to another tenant
      if (req.body.tenantId) {
        delete req.body.tenantId;
      }
      
      // Admins cannot promote to admin, school_owner or superadmin
      if (req.body.role === 'admin' || req.body.role === 'school_owner' || req.body.role === 'superadmin') {
        res.status(403);
        throw new Error('Not authorized to assign this role');
      }
      
      // Get user from tenant database
      const TenantUser = await getModel(req.tenantId, 'User', userSchema);
      user = await TenantUser.findById(userId);
    } else {
      // Regular users cannot update other users
      res.status(403);
      throw new Error('Not authorized to update user data');
    }

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Update fields based on request body
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    
    // Update role only if provided and authorized
    if (req.body.role) {
      user.role = req.body.role;
    }
    
    // Handle password update if provided
    if (req.body.password) {
      user.password = req.body.password;
    }
    
    // Handle school, direction, and subjects fields
    if (req.body.school !== undefined) {
      // For teachers, school can be an array
      if (user.role === 'teacher' && Array.isArray(req.body.school)) {
        user.school = req.body.school;
      } else {
        // For students or if a single school ID is provided
        user.school = req.body.school;
      }
    }
    
    if (req.body.direction !== undefined) {
      // For teachers, direction can be an array
      if (user.role === 'teacher' && Array.isArray(req.body.direction)) {
        user.direction = req.body.direction;
      } else {
        // For students or if a single direction ID is provided
        user.direction = req.body.direction;
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

    // Save the user in the tenant database
    await user.save();
    
    // If there's a user in the main DB (for authentication), update it too
    if (mainDbUser && mainDbUser !== user) {
      // Only update authentication-relevant fields in main DB
      mainDbUser.name = user.name;
      mainDbUser.email = user.email;
      
      if (req.body.password) {
        mainDbUser.password = user.password;
      }
      
      if (req.body.role) {
        mainDbUser.role = user.role;
      }
      
      // Save to main database
      await mainDbUser.save();
    }
    
    // Then fetch the updated user with populated fields
    let updatedUser;
    if (req.tenantId === 'main') {
      // For superadmin working with main DB users
      const MainUser = await getModel('main', 'User', userSchema);
      updatedUser = await MainUser.findById(user._id).select('-password');
    } else {
      // For tenant users, populate all reference fields
      const TenantUser = await getModel(req.tenantId, 'User', userSchema);
      updatedUser = await TenantUser.findById(user._id)
        .select('-password')
        .populate('school', 'name')
        .populate('direction', 'name')
        .populate('subjects', 'name');
    }
    updatedUser = await updatedUser
      .populate('school', 'name')
      .populate('direction', 'name');
    
    // Always populate subjects
    updatedUser = await updatedUser.populate('subjects', 'name');
    
    console.log('Updated user after population:', JSON.stringify(updatedUser, null, 2));

    // Prepare response
    const response = {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role
    };
    
    // Add fields based on user type
    if (updatedUser.tenantId) {
      response.tenantId = updatedUser.tenantId;
    }
    
    if (updatedUser.school) {
      response.school = updatedUser.school;
    }
    
    if (updatedUser.direction) {
      response.direction = updatedUser.direction;
    }
    
    if (updatedUser.subjects) {
      response.subjects = updatedUser.subjects;
    }
    
    // Add teacher permission fields if applicable
    if (updatedUser.role === 'teacher') {
      response.canSendNotifications = updatedUser.canSendNotifications;
      response.canAddGradeDescriptions = updatedUser.canAddGradeDescriptions;
    }
    
    res.json(response);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Error updating user');
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
  const { name, email, password, role, school, direction, subjects, canSendNotifications, canAddGradeDescriptions } = req.body;
  
  // For teachers, school and direction could be arrays
  const schoolInfo = role === 'teacher' && Array.isArray(school) ? `Array with ${school.length} schools` : (school || null);
  const directionInfo = role === 'teacher' && Array.isArray(direction) ? `Array with ${direction.length} directions` : (direction || null);
  
  console.log('Admin creating user:', { 
    name, 
    email, 
    role, 
    passwordLength: password ? password.length : 0,
    school: schoolInfo,
    direction: directionInfo,
    subjects: subjects && subjects.length > 0 ? subjects.length : 0,
    ...(role === 'teacher' ? {
      canSendNotifications: typeof canSendNotifications === 'boolean' ? canSendNotifications : true,
      canAddGradeDescriptions: typeof canAddGradeDescriptions === 'boolean' ? canAddGradeDescriptions : true
    } : {})
  });

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
    // CRITICAL FIX: Generate bcrypt hash directly using same settings as bcrypt.online
    // This ensures compatibility with how you've been fixing accounts manually
    const salt = await bcrypt.genSalt(10); // Same cost factor as bcrypt.online
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Generated hashed password length:', hashedPassword.length);
    
    // Prepare user document with all fields from the request
    const userDocument = {
      name,
      email,
      password: hashedPassword, // Already properly hashed
      role,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add additional fields if they're provided (for teachers and students)
    if (role === 'teacher' || role === 'student') {
      // Handle school assignment
      if (school) {
        // For teachers, school can be an array
        if (role === 'teacher' && Array.isArray(school)) {
          userDocument.school = school;
        } else {
          // For students or if a single school ID is provided
          userDocument.school = school;
        }
      }
      
      // Handle direction assignment
      if (direction) {
        // For teachers, direction can be an array
        if (role === 'teacher' && Array.isArray(direction)) {
          userDocument.direction = direction;
        } else {
          // For students or if a single direction ID is provided
          userDocument.direction = direction;
        }
      }
      
      // Handle subjects assignment
      if (subjects && Array.isArray(subjects) && subjects.length > 0) {
        userDocument.subjects = subjects;
      }
      
      // Add teacher-specific permission fields
      if (role === 'teacher') {
        // Set permission flags with default true if not specified
        userDocument.canSendNotifications = typeof canSendNotifications === 'boolean' 
          ? canSendNotifications 
          : true;
        
        userDocument.canAddGradeDescriptions = typeof canAddGradeDescriptions === 'boolean' 
          ? canAddGradeDescriptions 
          : true;
      }
    }
    
    // Bypass the pre-save middleware entirely to avoid double-hashing
    // Create user document directly in the database with all fields
    const result = await User.collection.insertOne(userDocument);
    
    // Get the inserted user and populate all reference fields
    const savedUser = await User.findOne({ _id: result.insertedId })
      .populate('school', 'name')
      .populate('direction', 'name')
      .populate('subjects', 'name');
      
    console.log('User created successfully with ID:', savedUser._id);
    
    // IMPORTANT: Test verification using the same password comparison as login
    const testVerify = await bcrypt.compare(password, savedUser.password);
    console.log('Password verification test result:', testVerify);
    
    if (!testVerify) {
      console.error('WARNING: Password verification failed for newly created user!');
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
      role: savedUser.role,
      school: savedUser.school,
      direction: savedUser.direction,
      subjects: savedUser.subjects,
      token: generateToken(savedUser._id),
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
