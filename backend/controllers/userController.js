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
    // CRITICAL FIX: Use bcrypt.compare directly to verify password
    // This matches what bcrypt.online uses and how you're fixing passwords manually
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`Direct bcrypt comparison for ${email}: ${isMatch}`);
    
    if (isMatch) {
      // Login successful
      console.log(`Login successful for ${email}`);
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
      // If password doesn't match with bcrypt.compare, log detailed info for debugging
      console.log(`Password didn't match for ${email}`);
      console.log(`User password hash: ${user.password.substring(0, 10)}...`);
      res.status(401);
      throw new Error(`Invalid credentials - password mismatch`);
    }
  } catch (error) {
    console.log(`Login error for ${email}: ${error.message}`);
    res.status(401);
    throw new Error(`Invalid credentials - ${error.message}`);
  }
});

// @desc    Get user data
// @route   GET /api/users/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  // Find user and populate all reference fields
  const user = await User.findById(req.user.id)
    .select('-password')
    .populate('school', 'name') // Populate school with name field
    .populate('direction', 'name') // Populate direction with name field
    .populate('subjects', 'name'); // Populate subjects with name field

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
  const users = await User.find({}).select('-password')
    .populate('school', 'name')
    .populate('direction', 'name')
    .populate('subjects', 'name');
  res.json(users);
});

// @desc    Get user by ID (admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('school', 'name')
    .populate('direction', 'name')
    .populate('subjects', 'name');

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
    
    // Handle password update if provided
    if (req.body.password) {
      user.password = req.body.password;
    }
    
    // Handle school, direction, and subjects fields
    if (req.body.school !== undefined) {
      user.school = req.body.school;
    }
    
    if (req.body.direction !== undefined) {
      user.direction = req.body.direction;
    }
    
    if (req.body.subjects !== undefined) {
      user.subjects = req.body.subjects;
    }

    // Save the user first
    await user.save();
    
    // Then fetch the updated user with populated fields
    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('school', 'name')
      .populate('direction', 'name')
      .populate('subjects', 'name');

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
  const { name, email, password, role, school, direction, subjects } = req.body;
  console.log('Admin creating user:', { 
    name, 
    email, 
    role, 
    passwordLength: password ? password.length : 0,
    school: school || null,
    direction: direction || null,
    subjects: subjects && subjects.length > 0 ? subjects.length : 0
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
      if (school) {
        userDocument.school = school;
      }
      
      if (direction) {
        userDocument.direction = direction;
      }
      
      if (subjects && Array.isArray(subjects) && subjects.length > 0) {
        userDocument.subjects = subjects;
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
