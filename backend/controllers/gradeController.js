const asyncHandler = require('express-async-handler');
const Grade = require('../models/gradeModel');
const User = require('../models/userModel');

// @desc    Create a new grade
// @route   POST /api/grades
// @access  Private/Teacher
const createGrade = asyncHandler(async (req, res) => {
  const { student, subject, value, description, date } = req.body;
  
  console.log('Grade creation request received:', { body: req.body, user: req.user._id, userRole: req.user.role });

  if (!student || !subject || !value) {
    res.status(400);
    throw new Error('Please provide student, subject and grade value');
  }

  try {
    // COMPLETELY REWRITTEN: Using the same multi-strategy approach as other controllers
    const mongoose = require('mongoose');
    const jwt = require('jsonwebtoken');
    
    // STEP 1: Extract token data safely
    let tokenData = null;
    if (req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        tokenData = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Successfully decoded JWT token for grade creation');
      } catch (err) {
        console.log('Error decoding token:', err.message);
      }
    }
    
    // STEP 2: Try to identify the school using multiple strategies
    let school = null;
    
    // Strategy A: Check if school is already in request (from middleware)
    if (req.school) {
      school = req.school;
      console.log(`Strategy A: Found school in request: ${school.name}`);
    }
    
    // Strategy B: Check token for schoolId
    if (!school && tokenData && tokenData.schoolId) {
      try {
        const School = mongoose.model('School');
        school = await School.findById(tokenData.schoolId);
        if (school) {
          console.log(`Strategy B: Found school from token schoolId: ${school.name}`);
        }
      } catch (err) {
        console.log('Error finding school by token schoolId:', err.message);
      }
    }
    
    // Strategy C: Check user object for schoolId
    if (!school && req.user && req.user.schoolId) {
      try {
        const School = mongoose.model('School');
        school = await School.findById(req.user.schoolId);
        if (school) {
          console.log(`Strategy C: Found school from user.schoolId: ${school.name}`);
        }
      } catch (err) {
        console.log('Error finding school by user.schoolId:', err.message);
      }
    }
    
    // Strategy D: Check user email domain
    if (!school && req.user && req.user.email && req.user.email.includes('@')) {
      try {
        const emailDomain = req.user.email.split('@')[1];
        const School = mongoose.model('School');
        school = await School.findOne({ emailDomain });
        if (school) {
          console.log(`Strategy D: Found school from email domain: ${school.name}`);
        }
      } catch (err) {
        console.log('Error finding school by email domain:', err.message);
      }
    }
    
    if (!school) {
      res.status(400);
      throw new Error('No school found for this user - grades must be associated with a school');
    }
    
    console.log(`Using school database: ${school.name} for grade creation`);
    
    // STEP 3: Connect to the school database
    const { connectToSchoolDb } = require('../config/multiDbConnect');
    const { connection } = await connectToSchoolDb(school);
    
    if (!connection) {
      throw new Error('Failed to connect to school database');
    }
    
    console.log(`Connected to school database: ${connection.db?.databaseName || 'unknown'}`);
    
    // STEP 4: Get or create the necessary models
    let SchoolUser, SchoolGrade;
    try {
      SchoolUser = connection.model('User');
      console.log('Using existing User model');
    } catch (err) {
      console.error('Cannot access User model in school database - critical error');
      res.status(500);
      throw new Error('Database configuration error - User model not found');
    }
    
    try {
      SchoolGrade = connection.model('Grade');
      console.log('Using existing Grade model');
    } catch (err) {
      console.log('Creating new Grade model in school database');
      // Get the schema definition from the main Grade model
      const gradeSchemaObj = require('../models/gradeModel').schema.obj;
      const gradeSchema = new mongoose.Schema(gradeSchemaObj, { timestamps: true });
      SchoolGrade = connection.model('Grade', gradeSchema);
    }
    
    // STEP 5: Check if student exists and is actually a student
    const studentUser = await SchoolUser.findById(student);
    if (!studentUser) {
      console.log('Student not found in school database:', student);
      res.status(400);
      throw new Error('Student not found in this school');
    }
    
    if (studentUser.role !== 'student') {
      console.log('Invalid student role:', studentUser.role);
      res.status(400);
      throw new Error('Invalid student - must have role "student"');
    }
    
    // STEP 6: Check if a grade already exists for this student, subject, and date
    const existingGrade = await SchoolGrade.findOne({
      student,
      subject,
      date: date || Date.now()
    });
    
    if (existingGrade) {
      console.log('Found existing grade with same student, subject, and date:', existingGrade._id);
      res.status(400);
      throw new Error('A grade already exists for this student, subject, and date. Please use a different date or update the existing grade.');
    }

    // Create the grade with very specific handling
    const gradeData = {
      student,
      subject,
      teacher: req.user._id, // Use _id instead of id
      value: parseInt(value), // Ensure value is a number
      date: date || Date.now(),
      schoolId: school._id // Add reference to school
    };
    
    // Add description if provided
    if (description) {
      gradeData.description = description;
    }

    // Create the grade in the SCHOOL database with try-catch for duplicate handling
    try {
      const grade = await SchoolGrade.create(gradeData);
      
      if (grade) {
        console.log(`SUCCESSFULLY created grade in SCHOOL database: ${school.name}, Grade ID: ${grade._id}`);
        res.status(201).json(grade);
      } else {
        console.log('Failed to create grade');
        res.status(400);
        throw new Error('Invalid grade data');
      }
    } catch (duplicateError) {
      // Check if this is a duplicate key error
      if (duplicateError.code === 11000) {
        console.error('Duplicate key error:', duplicateError.message);
        res.status(400);
        throw new Error('A grade with this student, subject, and date combination already exists. Please use a different date.');
      } else {
        // Re-throw other errors
        throw duplicateError;
      }
    }
  } catch (error) {
    console.error('Error in createGrade controller:', error.message);
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Error creating grade');
  }
});

// @desc    Get all grades (admin only)
// @route   GET /api/grades
// @access  Private/Admin
const getAllGrades = asyncHandler(async (req, res) => {
  try {
    // COMPLETELY REWRITTEN: Using the same multi-strategy approach
    const mongoose = require('mongoose');
    const jwt = require('jsonwebtoken');
    
    // STEP 1: Extract token data safely
    let tokenData = null;
    if (req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        tokenData = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Successfully decoded JWT token for getting all grades');
      } catch (err) {
        console.log('Error decoding token:', err.message);
      }
    }
    
    // STEP 2: Try to identify the school using multiple strategies
    let school = null;
    
    // Strategy A: Check if school is already in request (from middleware)
    if (req.school) {
      school = req.school;
      console.log(`Strategy A: Found school in request: ${school.name}`);
    }
    
    // Strategy B: Check token for schoolId
    if (!school && tokenData && tokenData.schoolId) {
      try {
        const School = mongoose.model('School');
        school = await School.findById(tokenData.schoolId);
        if (school) {
          console.log(`Strategy B: Found school from token schoolId: ${school.name}`);
        }
      } catch (err) {
        console.log('Error finding school by token schoolId:', err.message);
      }
    }
    
    // Strategy C: Check user object for schoolId
    if (!school && req.user && req.user.schoolId) {
      try {
        const School = mongoose.model('School');
        school = await School.findById(req.user.schoolId);
        if (school) {
          console.log(`Strategy C: Found school from user.schoolId: ${school.name}`);
        }
      } catch (err) {
        console.log('Error finding school by user.schoolId:', err.message);
      }
    }
    
    // Strategy D: Check user email domain
    if (!school && req.user && req.user.email && req.user.email.includes('@')) {
      try {
        const emailDomain = req.user.email.split('@')[1];
        const School = mongoose.model('School');
        school = await School.findOne({ emailDomain });
        if (school) {
          console.log(`Strategy D: Found school from email domain: ${school.name}`);
        }
      } catch (err) {
        console.log('Error finding school by email domain:', err.message);
      }
    }
    
    // STEP 3: Handle database access based on user type
    let grades = [];
    
    if (school) {
      console.log(`Fetching grades from school database: ${school.name}`);
      
      // Connect to the school database
      const { connectToSchoolDb } = require('../config/multiDbConnect');
      const { connection } = await connectToSchoolDb(school);
      
      if (!connection) {
        throw new Error('Failed to connect to school database');
      }
      
      console.log(`Connected to school database: ${connection.db?.databaseName || 'unknown'}`);
      
      // Get the necessary models
      const SchoolGrade = connection.model('Grade');
      
      // Fetch grades from school database with proper population
      grades = await SchoolGrade.find({})
        .populate('student', 'name email')
        .populate('subject', 'name')
        .populate('teacher', 'name email')
        .sort({ date: -1 });
      
      console.log(`Found ${grades.length} grades in school database: ${school.name}`);
    } else if (req.user && req.user.role === 'superadmin') {
      // Only superadmins can access the main database
      console.log('Superadmin accessing grades from main database');
      grades = await Grade.find({})
        .populate('student', 'name email')
        .populate('subject', 'name')
        .populate('teacher', 'name email')
        .sort({ date: -1 });
      
      console.log(`Found ${grades.length} grades in main database`);
    } else {
      console.log('No school found and user is not superadmin');
      return res.status(400).json({ message: 'No school found for this user' });
    }
    
    return res.json(grades);
  } catch (error) {
    console.error('Error getting grades:', error.message);
    res.status(500);
    throw new Error(`Failed to retrieve grades: ${error.message}`);
  }
});

// @desc    Get grades for a specific student
// @route   GET /api/grades/student/:id
// @access  Private
const getStudentGrades = asyncHandler(async (req, res) => {
  try {
    // Students can only view their own grades, teachers and admins can view any student's grades
    if (req.user.role === 'student' && req.user.id !== req.params.id) {
      res.status(403);
      throw new Error('Not authorized to view these grades');
    }
    
    // COMPLETELY REWRITTEN: Using the same multi-strategy approach
    const mongoose = require('mongoose');
    const jwt = require('jsonwebtoken');
    
    // STEP 1: Extract token data safely
    let tokenData = null;
    if (req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        tokenData = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Successfully decoded JWT token for student grades');
      } catch (err) {
        console.log('Error decoding token:', err.message);
      }
    }
    
    // STEP 2: Try to identify the school using multiple strategies
    let school = null;
    
    // Strategy A: Check if school is already in request (from middleware)
    if (req.school) {
      school = req.school;
      console.log(`Strategy A: Found school in request: ${school.name}`);
    }
    
    // Strategy B: Check token for schoolId
    if (!school && tokenData && tokenData.schoolId) {
      try {
        const School = mongoose.model('School');
        school = await School.findById(tokenData.schoolId);
        if (school) {
          console.log(`Strategy B: Found school from token schoolId: ${school.name}`);
        }
      } catch (err) {
        console.log('Error finding school by token schoolId:', err.message);
      }
    }
    
    // Strategy C: Check user object for schoolId
    if (!school && req.user && req.user.schoolId) {
      try {
        const School = mongoose.model('School');
        school = await School.findById(req.user.schoolId);
        if (school) {
          console.log(`Strategy C: Found school from user.schoolId: ${school.name}`);
        }
      } catch (err) {
        console.log('Error finding school by user.schoolId:', err.message);
      }
    }
    
    // Strategy D: Check user email domain
    if (!school && req.user && req.user.email && req.user.email.includes('@')) {
      try {
        const emailDomain = req.user.email.split('@')[1];
        const School = mongoose.model('School');
        school = await School.findOne({ emailDomain });
        if (school) {
          console.log(`Strategy D: Found school from email domain: ${school.name}`);
        }
      } catch (err) {
        console.log('Error finding school by email domain:', err.message);
      }
    }
    
    // STEP 3: Handle database access based on school detection
    let grades = [];
    
    if (school) {
      console.log(`Fetching student grades from school database: ${school.name}`);
      
      // Connect to the school database
      const { connectToSchoolDb } = require('../config/multiDbConnect');
      const { connection } = await connectToSchoolDb(school);
      
      if (!connection) {
        throw new Error('Failed to connect to school database');
      }
      
      console.log(`Connected to school database: ${connection.db?.databaseName || 'unknown'}`);
      
      // Get the necessary models
      const SchoolGrade = connection.model('Grade');
      
      // Fetch grades from school database with proper population
      grades = await SchoolGrade.find({ student: req.params.id })
        .populate('subject', 'name')
        .populate('teacher', 'name')
        .sort({ date: -1 });
      
      console.log(`Found ${grades.length} grades for student in school database: ${school.name}`);
    } else if (req.user && req.user.role === 'superadmin') {
      // Only superadmins can access the main database
      console.log('Superadmin accessing student grades from main database');
      grades = await Grade.find({ student: req.params.id })
        .populate('subject', 'name')
        .populate('teacher', 'name')
        .sort({ date: -1 });
      
      console.log(`Found ${grades.length} student grades in main database`);
    } else {
      console.log('No school found and user is not superadmin');
      return res.status(400).json({ message: 'No school found for this user' });
    }
    
    return res.json(grades);
  } catch (error) {
    console.error('Error getting student grades:', error.message);
    res.status(error.statusCode || 500);
    throw new Error(`Failed to retrieve student grades: ${error.message}`);
  }
});

// @desc    Get grades by subject
// @route   GET /api/grades/subject/:id
// @access  Private
const getGradesBySubject = asyncHandler(async (req, res) => {
  try {
    // Set up query based on user role
    let query = { subject: req.params.id };
    
    // Students can only view their own grades in a subject
    if (req.user.role === 'student') {
      query.student = req.user.id;
    }
    
    // Teachers can only view grades they assigned
    if (req.user.role === 'teacher') {
      query.teacher = req.user.id;
    }
    
    // COMPLETELY REWRITTEN: Using the same multi-strategy approach
    const mongoose = require('mongoose');
    const jwt = require('jsonwebtoken');
    
    // STEP 1: Extract token data safely
    let tokenData = null;
    if (req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        tokenData = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Successfully decoded JWT token for subject grades');
      } catch (err) {
        console.log('Error decoding token:', err.message);
      }
    }
    
    // STEP 2: Try to identify the school using multiple strategies
    let school = null;
    
    // Strategy A: Check if school is already in request (from middleware)
    if (req.school) {
      school = req.school;
      console.log(`Strategy A: Found school in request: ${school.name}`);
    }
    
    // Strategy B: Check token for schoolId
    if (!school && tokenData && tokenData.schoolId) {
      try {
        const School = mongoose.model('School');
        school = await School.findById(tokenData.schoolId);
        if (school) {
          console.log(`Strategy B: Found school from token schoolId: ${school.name}`);
        }
      } catch (err) {
        console.log('Error finding school by token schoolId:', err.message);
      }
    }
    
    // Strategy C: Check user object for schoolId
    if (!school && req.user && req.user.schoolId) {
      try {
        const School = mongoose.model('School');
        school = await School.findById(req.user.schoolId);
        if (school) {
          console.log(`Strategy C: Found school from user.schoolId: ${school.name}`);
        }
      } catch (err) {
        console.log('Error finding school by user.schoolId:', err.message);
      }
    }
    
    // Strategy D: Check user email domain
    if (!school && req.user && req.user.email && req.user.email.includes('@')) {
      try {
        const emailDomain = req.user.email.split('@')[1];
        const School = mongoose.model('School');
        school = await School.findOne({ emailDomain });
        if (school) {
          console.log(`Strategy D: Found school from email domain: ${school.name}`);
        }
      } catch (err) {
        console.log('Error finding school by email domain:', err.message);
      }
    }
    
    // STEP 3: Handle database access based on school detection
    let grades = [];
    
    if (school) {
      console.log(`Fetching subject grades from school database: ${school.name}`);
      
      // Connect to the school database
      const { connectToSchoolDb } = require('../config/multiDbConnect');
      const { connection } = await connectToSchoolDb(school);
      
      if (!connection) {
        throw new Error('Failed to connect to school database');
      }
      
      console.log(`Connected to school database: ${connection.db?.databaseName || 'unknown'}`);
      
      // Get the necessary models
      const SchoolGrade = connection.model('Grade');
      
      // Fetch grades from school database with proper population
      grades = await SchoolGrade.find(query)
        .populate('student', 'name')
        .populate('teacher', 'name')
        .sort({ date: -1 });
      
      console.log(`Found ${grades.length} grades for subject in school database: ${school.name}`);
    } else if (req.user && req.user.role === 'superadmin') {
      // Only superadmins can access the main database
      console.log('Superadmin accessing subject grades from main database');
      grades = await Grade.find(query)
        .populate('student', 'name')
        .populate('teacher', 'name')
        .sort({ date: -1 });
      
      console.log(`Found ${grades.length} subject grades in main database`);
    } else {
      console.log('No school found and user is not superadmin');
      return res.status(400).json({ message: 'No school found for this user' });
    }
    
    return res.json(grades);
  } catch (error) {
    console.error('Error getting subject grades:', error.message);
    res.status(error.statusCode || 500);
    throw new Error(`Failed to retrieve subject grades: ${error.message}`);
  }
});

// @desc    Get grades assigned by a teacher
// @route   GET /api/grades/teacher/:id
// @access  Private/Teacher Admin
const getGradesByTeacher = asyncHandler(async (req, res) => {
  try {
    // Teachers can only view their own assigned grades
    if (req.user.role === 'teacher' && req.user.id !== req.params.id) {
      res.status(403);
      throw new Error('Not authorized to view these grades');
    }
    
    // COMPLETELY REWRITTEN: Using the same multi-strategy approach
    const mongoose = require('mongoose');
    const jwt = require('jsonwebtoken');
    
    // STEP 1: Extract token data safely
    let tokenData = null;
    if (req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        tokenData = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Successfully decoded JWT token for teacher grades');
      } catch (err) {
        console.log('Error decoding token:', err.message);
      }
    }
    
    // STEP 2: Try to identify the school using multiple strategies
    let school = null;
    
    // Strategy A: Check if school is already in request (from middleware)
    if (req.school) {
      school = req.school;
      console.log(`Strategy A: Found school in request: ${school.name}`);
    }
    
    // Strategy B: Check token for schoolId
    if (!school && tokenData && tokenData.schoolId) {
      try {
        const School = mongoose.model('School');
        school = await School.findById(tokenData.schoolId);
        if (school) {
          console.log(`Strategy B: Found school from token schoolId: ${school.name}`);
        }
      } catch (err) {
        console.log('Error finding school by token schoolId:', err.message);
      }
    }
    
    // Strategy C: Check user object for schoolId
    if (!school && req.user && req.user.schoolId) {
      try {
        const School = mongoose.model('School');
        school = await School.findById(req.user.schoolId);
        if (school) {
          console.log(`Strategy C: Found school from user.schoolId: ${school.name}`);
        }
      } catch (err) {
        console.log('Error finding school by user.schoolId:', err.message);
      }
    }
    
    // Strategy D: Check user email domain
    if (!school && req.user && req.user.email && req.user.email.includes('@')) {
      try {
        const emailDomain = req.user.email.split('@')[1];
        const School = mongoose.model('School');
        school = await School.findOne({ emailDomain });
        if (school) {
          console.log(`Strategy D: Found school from email domain: ${school.name}`);
        }
      } catch (err) {
        console.log('Error finding school by email domain:', err.message);
      }
    }
    
    // STEP 3: Handle database access based on school detection
    let grades = [];
    
    if (school) {
      console.log(`Fetching teacher grades from school database: ${school.name}`);
      
      // Connect to the school database
      const { connectToSchoolDb } = require('../config/multiDbConnect');
      const { connection } = await connectToSchoolDb(school);
      
      if (!connection) {
        throw new Error('Failed to connect to school database');
      }
      
      console.log(`Connected to school database: ${connection.db?.databaseName || 'unknown'}`);
      
      // Get the necessary models
      const SchoolGrade = connection.model('Grade');
      
      // Fetch grades from school database with proper population
      grades = await SchoolGrade.find({ teacher: req.params.id })
        .populate('student', 'name email')
        .populate('subject', 'name')
        .sort({ date: -1 });
      
      console.log(`Found ${grades.length} grades for teacher in school database: ${school.name}`);
    } else if (req.user && req.user.role === 'superadmin') {
      // Only superadmins can access the main database
      console.log('Superadmin accessing teacher grades from main database');
      grades = await Grade.find({ teacher: req.params.id })
        .populate('student', 'name email')
        .populate('subject', 'name')
        .sort({ date: -1 });
      
      console.log(`Found ${grades.length} teacher grades in main database`);
    } else {
      console.log('No school found and user is not superadmin');
      return res.status(400).json({ message: 'No school found for this user' });
    }
    
    return res.json(grades);
  } catch (error) {
    console.error('Error getting teacher grades:', error.message);
    res.status(error.statusCode || 500);
    throw new Error(`Failed to retrieve teacher grades: ${error.message}`);
  }
});

// @desc    Get grade by ID
// @route   GET /api/grades/:id
// @access  Private
const getGradeById = asyncHandler(async (req, res) => {
  try {
    // COMPLETELY REWRITTEN: Using the same multi-strategy approach
    const mongoose = require('mongoose');
    const jwt = require('jsonwebtoken');
    
    // STEP 1: Extract token data safely
    let tokenData = null;
    if (req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        tokenData = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Successfully decoded JWT token for grade by ID');
      } catch (err) {
        console.log('Error decoding token:', err.message);
      }
    }
    
    // STEP 2: Try to identify the school using multiple strategies
    let school = null;
    
    // Strategy A: Check if school is already in request (from middleware)
    if (req.school) {
      school = req.school;
      console.log(`Strategy A: Found school in request: ${school.name}`);
    }
    
    // Strategy B: Check token for schoolId
    if (!school && tokenData && tokenData.schoolId) {
      try {
        const School = mongoose.model('School');
        school = await School.findById(tokenData.schoolId);
        if (school) {
          console.log(`Strategy B: Found school from token schoolId: ${school.name}`);
        }
      } catch (err) {
        console.log('Error finding school by token schoolId:', err.message);
      }
    }
    
    // Strategy C: Check user object for schoolId
    if (!school && req.user && req.user.schoolId) {
      try {
        const School = mongoose.model('School');
        school = await School.findById(req.user.schoolId);
        if (school) {
          console.log(`Strategy C: Found school from user.schoolId: ${school.name}`);
        }
      } catch (err) {
        console.log('Error finding school by user.schoolId:', err.message);
      }
    }
    
    // Strategy D: Check user email domain
    if (!school && req.user && req.user.email && req.user.email.includes('@')) {
      try {
        const emailDomain = req.user.email.split('@')[1];
        const School = mongoose.model('School');
        school = await School.findOne({ emailDomain });
        if (school) {
          console.log(`Strategy D: Found school from email domain: ${school.name}`);
        }
      } catch (err) {
        console.log('Error finding school by email domain:', err.message);
      }
    }
    
    // STEP 3: Handle database access based on school detection
    let grade = null;
    
    if (school) {
      console.log(`Fetching grade by ID from school database: ${school.name}`);
      
      // Connect to the school database
      const { connectToSchoolDb } = require('../config/multiDbConnect');
      const { connection } = await connectToSchoolDb(school);
      
      if (!connection) {
        throw new Error('Failed to connect to school database');
      }
      
      console.log(`Connected to school database: ${connection.db?.databaseName || 'unknown'}`);
      
      // Get the necessary models
      const SchoolGrade = connection.model('Grade');
      
      // Fetch grade from school database with proper population
      grade = await SchoolGrade.findById(req.params.id)
        .populate('student', 'name email')
        .populate('subject', 'name')
        .populate('teacher', 'name email');
      
      console.log(`Grade lookup in school database: ${grade ? 'found' : 'not found'}`);
    } else if (req.user && req.user.role === 'superadmin') {
      // Only superadmins can access the main database
      console.log('Superadmin accessing grade by ID from main database');
      grade = await Grade.findById(req.params.id)
        .populate('student', 'name email')
        .populate('subject', 'name')
        .populate('teacher', 'name email');
      
      console.log(`Grade lookup in main database: ${grade ? 'found' : 'not found'}`);
    } else {
      console.log('No school found and user is not superadmin');
      return res.status(400).json({ message: 'No school found for this user' });
    }
    
    if (!grade) {
      res.status(404);
      throw new Error('Grade not found');
    }
    
    // Students can only view their own grades
    if (req.user.role === 'student' && grade.student._id.toString() !== req.user.id) {
      res.status(403);
      throw new Error('Not authorized to view this grade');
    }
    
    // Teachers can only view grades they assigned
    if (req.user.role === 'teacher' && grade.teacher._id.toString() !== req.user.id) {
      res.status(403);
      throw new Error('Not authorized to view this grade');
    }
    
    return res.json(grade);
  } catch (error) {
    console.error('Error getting grade by ID:', error.message);
    res.status(error.statusCode || 500);
    throw new Error(`Failed to retrieve grade: ${error.message}`);
  }
});

// @desc    Update grade
// @route   PUT /api/grades/:id
// @access  Private/Teacher
const updateGrade = asyncHandler(async (req, res) => {
  try {
    const { value, description, date } = req.body;
  
    // COMPLETELY REWRITTEN: Using the same multi-strategy approach
    const mongoose = require('mongoose');
    const jwt = require('jsonwebtoken');
    
    // STEP 1: Extract token data safely
    let tokenData = null;
    if (req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        tokenData = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Successfully decoded JWT token for updating grade');
      } catch (err) {
        console.log('Error decoding token:', err.message);
      }
    }
    
    // STEP 2: Try to identify the school using multiple strategies
    let school = null;
    
    // Strategy A: Check if school is already in request (from middleware)
    if (req.school) {
      school = req.school;
      console.log(`Strategy A: Found school in request: ${school.name}`);
    }
    
    // Strategy B: Check token for schoolId
    if (!school && tokenData && tokenData.schoolId) {
      try {
        const School = mongoose.model('School');
        school = await School.findById(tokenData.schoolId);
        if (school) {
          console.log(`Strategy B: Found school from token schoolId: ${school.name}`);
        }
      } catch (err) {
        console.log('Error finding school by token schoolId:', err.message);
      }
    }
    
    // Strategy C: Check user object for schoolId
    if (!school && req.user && req.user.schoolId) {
      try {
        const School = mongoose.model('School');
        school = await School.findById(req.user.schoolId);
        if (school) {
          console.log(`Strategy C: Found school from user.schoolId: ${school.name}`);
        }
      } catch (err) {
        console.log('Error finding school by user.schoolId:', err.message);
      }
    }
    
    // Strategy D: Check user email domain
    if (!school && req.user && req.user.email && req.user.email.includes('@')) {
      try {
        const emailDomain = req.user.email.split('@')[1];
        const School = mongoose.model('School');
        school = await School.findOne({ emailDomain });
        if (school) {
          console.log(`Strategy D: Found school from email domain: ${school.name}`);
        }
      } catch (err) {
        console.log('Error finding school by email domain:', err.message);
      }
    }
    
    // STEP 3: Handle database access based on school detection
    let grade = null;
    let updatedGrade = null;
    
    if (school) {
      console.log(`Updating grade in school database: ${school.name}`);
      
      // Connect to the school database
      const { connectToSchoolDb } = require('../config/multiDbConnect');
      const { connection } = await connectToSchoolDb(school);
      
      if (!connection) {
        throw new Error('Failed to connect to school database');
      }
      
      console.log(`Connected to school database: ${connection.db?.databaseName || 'unknown'}`);
      
      // Get the necessary models
      const SchoolGrade = connection.model('Grade');
      
      // Find the grade in the school database
      grade = await SchoolGrade.findById(req.params.id);
      
      if (!grade) {
        res.status(404);
        throw new Error('Grade not found in school database');
      }
      
      // Only the teacher who assigned the grade or an admin can update it
      if (req.user.role === 'teacher' && grade.teacher.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to update this grade');
      }
      
      // Update the grade
      grade.value = value || grade.value;
      grade.description = description || grade.description;
      
      if (date) {
        grade.date = date;
      }
      
      updatedGrade = await grade.save();
      console.log(`Grade updated successfully in school database: ${school.name}`);
    } else if (req.user && req.user.role === 'superadmin') {
      // Only superadmins can access the main database
      console.log('Superadmin updating grade in main database');
      
      grade = await Grade.findById(req.params.id);
      
      if (!grade) {
        res.status(404);
        throw new Error('Grade not found in main database');
      }
      
      // Update the grade
      grade.value = value || grade.value;
      grade.description = description || grade.description;
      
      if (date) {
        grade.date = date;
      }
      
      updatedGrade = await grade.save();
      console.log('Grade updated successfully in main database');
    } else {
      console.log('No school found and user is not superadmin');
      return res.status(400).json({ message: 'No school found for this user' });
    }
    
    return res.json(updatedGrade);
  } catch (error) {
    console.error('Error updating grade:', error.message);
    res.status(error.statusCode || 500);
    throw new Error(`Failed to update grade: ${error.message}`);
  }
});

// @desc    Delete grade
// @route   DELETE /api/grades/:id
// @access  Private/Teacher
const deleteGrade = asyncHandler(async (req, res) => {
  try {
    // COMPLETELY REWRITTEN: Using the same multi-strategy approach
    const mongoose = require('mongoose');
    const jwt = require('jsonwebtoken');
    
    // STEP 1: Extract token data safely
    let tokenData = null;
    if (req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        tokenData = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Successfully decoded JWT token for deleting grade');
      } catch (err) {
        console.log('Error decoding token:', err.message);
      }
    }
    
    // STEP 2: Try to identify the school using multiple strategies
    let school = null;
    
    // Strategy A: Check if school is already in request (from middleware)
    if (req.school) {
      school = req.school;
      console.log(`Strategy A: Found school in request: ${school.name}`);
    }
    
    // Strategy B: Check token for schoolId
    if (!school && tokenData && tokenData.schoolId) {
      try {
        const School = mongoose.model('School');
        school = await School.findById(tokenData.schoolId);
        if (school) {
          console.log(`Strategy B: Found school from token schoolId: ${school.name}`);
        }
      } catch (err) {
        console.log('Error finding school by token schoolId:', err.message);
      }
    }
    
    // Strategy C: Check user object for schoolId
    if (!school && req.user && req.user.schoolId) {
      try {
        const School = mongoose.model('School');
        school = await School.findById(req.user.schoolId);
        if (school) {
          console.log(`Strategy C: Found school from user.schoolId: ${school.name}`);
        }
      } catch (err) {
        console.log('Error finding school by user.schoolId:', err.message);
      }
    }
    
    // Strategy D: Check user email domain
    if (!school && req.user && req.user.email && req.user.email.includes('@')) {
      try {
        const emailDomain = req.user.email.split('@')[1];
        const School = mongoose.model('School');
        school = await School.findOne({ emailDomain });
        if (school) {
          console.log(`Strategy D: Found school from email domain: ${school.name}`);
        }
      } catch (err) {
        console.log('Error finding school by email domain:', err.message);
      }
    }
    
    // STEP 3: Handle database access based on school detection
    let grade = null;
    
    if (school) {
      console.log(`Deleting grade from school database: ${school.name}`);
      
      // Connect to the school database
      const { connectToSchoolDb } = require('../config/multiDbConnect');
      const { connection } = await connectToSchoolDb(school);
      
      if (!connection) {
        throw new Error('Failed to connect to school database');
      }
      
      console.log(`Connected to school database: ${connection.db?.databaseName || 'unknown'}`);
      
      // Get the necessary models
      const SchoolGrade = connection.model('Grade');
      
      // Find the grade in the school database
      grade = await SchoolGrade.findById(req.params.id);
      
      if (!grade) {
        res.status(404);
        throw new Error('Grade not found in school database');
      }
      
      // Only the teacher who assigned the grade or an admin can delete it
      if (req.user.role === 'teacher' && grade.teacher.toString() !== req.user.id) {
        res.status(403);
        throw new Error('Not authorized to delete this grade');
      }
      
      await grade.deleteOne();
      console.log(`Grade deleted successfully from school database: ${school.name}`);
    } else if (req.user && req.user.role === 'superadmin') {
      // Only superadmins can access the main database
      console.log('Superadmin deleting grade from main database');
      
      grade = await Grade.findById(req.params.id);
      
      if (!grade) {
        res.status(404);
        throw new Error('Grade not found in main database');
      }
      
      await grade.deleteOne();
      console.log('Grade deleted successfully from main database');
    } else {
      console.log('No school found and user is not superadmin');
      return res.status(400).json({ message: 'No school found for this user' });
    }
    
    return res.json({ message: 'Grade removed' });
  } catch (error) {
    console.error('Error deleting grade:', error.message);
    res.status(error.statusCode || 500);
    throw new Error(`Failed to delete grade: ${error.message}`);
  }
});

module.exports = {
  createGrade,
  getAllGrades,
  getStudentGrades,
  getGradesBySubject,
  getGradesByTeacher,
  getGradeById,
  updateGrade,
  deleteGrade,
};
