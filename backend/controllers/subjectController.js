const asyncHandler = require('express-async-handler');
const Subject = require('../models/subjectModel');

// @desc    Create a new subject
// @route   POST /api/subjects
// @access  Private/Admin
const createSubject = asyncHandler(async (req, res) => {
  const { name, description, teachers, directions } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Please provide a subject name');
  }

  try {
    // COMPLETELY REWRITTEN: Using the same multi-strategy approach as getSubjects
    const mongoose = require('mongoose');
    const jwt = require('jsonwebtoken');
    
    let subject;
    let isSuperAdmin = false;
    
    // STEP 1: Extract token data safely
    let tokenData = null;
    if (req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        tokenData = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Successfully decoded JWT token for subject creation');
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
    
    // Check if user is a superadmin with no school connections
    if (!school && req.user && req.user.role === 'superadmin') {
      isSuperAdmin = true;
      console.log('User is a superadmin with no school connection');
    }
    
    // STEP 3: If we found a school, create subject in school database
    if (school) {
      console.log(`Creating subject in school database: ${school.name}`);
      
      // Connect to the school-specific database
      const { connectToSchoolDb } = require('../config/multiDbConnect');
      const { connection } = await connectToSchoolDb(school);
      
      if (!connection) {
        throw new Error('Failed to connect to school database');
      }
      
      console.log(`Connected to school database: ${connection.db?.databaseName || 'unknown'}`);
      
      // Get or create the Subject model for this school
      let SchoolSubject;
      try {
        SchoolSubject = connection.model('Subject');
        console.log('Using existing Subject model');
      } catch (modelError) {
        // If model doesn't exist, create it
        console.log('Creating Subject model in school database');
        const subjectSchema = new mongoose.Schema({
          name: String,
          description: String,
          teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
          directions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Direction' }],
        }, { timestamps: true });
        
        SchoolSubject = connection.model('Subject', subjectSchema);
      }
      
      // Check if subject already exists in school database
      const subjectExists = await SchoolSubject.findOne({ name });
      if (subjectExists) {
        res.status(400);
        throw new Error('Subject already exists in this school');
      }
      
      // Create the subject in the school-specific database
      subject = await SchoolSubject.create({
        name,
        description,
        teachers,
        directions,
      });
      
      console.log(`SUCCESSFULLY created subject in SCHOOL database: ${subject.name} (${subject._id})`);
    } else if (isSuperAdmin) {
      // This is a superadmin request with no school connection - save to main database
      console.log('Creating subject in MAIN database (superadmin only)');
      
      // Check if subject already exists in main database
      const subjectExists = await Subject.findOne({ name });
      if (subjectExists) {
        res.status(400);
        throw new Error('Subject already exists');
      }
      
      // Create in main database
      subject = await Subject.create({
        name,
        description,
        teachers,
        directions,
      });
      
      console.log(`Created subject in main database: ${subject.name} (${subject._id})`);
    }
    
    if (subject) {
      res.status(201).json(subject);
    } else {
      res.status(400);
      throw new Error('Invalid subject data');
    }
  } catch (error) {
    console.error('Error creating subject:', error.message);
    res.status(500);
    throw new Error('Failed to create subject: ' + error.message);
  }
});

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Public
const getSubjects = asyncHandler(async (req, res) => {
  console.log('getSubjects endpoint called');
  
  try {
    // ULTRA SIMPLIFIED APPROACH - Complete rewrite to avoid race conditions
    const mongoose = require('mongoose');
    const jwt = require('jsonwebtoken');
    
    let subjects = [];
    let schoolFound = false;
    
    // STEP 1: Extract token data safely
    let tokenData = null;
    if (req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        tokenData = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Successfully decoded JWT token');
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
    
    // STEP 3: If we found a school, try to connect to its database
    if (school) {
      try {
        console.log(`Fetching subjects for school: ${school.name}`);
        
        // Connect to school database
        const { connectToSchoolDb } = require('../config/multiDbConnect');
        const { connection } = await connectToSchoolDb(school);
        
        if (!connection) {
          throw new Error('Failed to connect to school database');
        }
        
        console.log(`Connected to school database: ${connection.db?.databaseName || 'unknown'}`);
        
        // Check or create Subject model
        let SubjectModel;
        try {
          SubjectModel = connection.model('Subject');
          console.log('Found existing Subject model');
        } catch (err) {
          // Model doesn't exist, create it
          console.log('Creating new Subject model');
          const subjectSchema = new mongoose.Schema({
            name: String,
            description: String,
            teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
            directions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Direction' }],
          }, { timestamps: true });
          
          SubjectModel = connection.model('Subject', subjectSchema);
        }
        
        // Fetch subjects from school database
        subjects = await SubjectModel.find({}).sort({ name: 1 });
        schoolFound = true;
        
        console.log(`Found ${subjects.length} subjects in school database: ${school.name}`);
        if (subjects.length > 0) {
          subjects.forEach(s => console.log(`- ${s.name}`));
        }
      } catch (err) {
        console.error('Error connecting to school database:', err.message);
      }
    } else {
      console.log('No school found for this user, assuming superadmin');
    }
    
    // STEP 4: If no school was found or connection failed, fall back to main database ONLY for superadmins
    if (!schoolFound && req.user && req.user.role === 'superadmin') {
      console.log('User is superadmin, using main database');
      subjects = await Subject.find({}).sort({ name: 1 });
      console.log(`Found ${subjects.length} subjects in main database`);
      if (subjects.length > 0) {
        subjects.forEach(s => console.log(`- ${s.name}`));
      }
    }
    
    // Return results
    console.log(`Returning ${subjects.length} subjects to client`);
    return res.status(200).json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error.message);
    res.status(500);
    throw new Error('Server error: ' + error.message);
  }
});

// @desc    Get subject by ID
// @route   GET /api/subjects/:id
// @access  Public
const getSubjectById = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id)
    .populate('teachers', 'name email')
    .populate('directions', 'name');

  if (subject) {
    res.json(subject);
  } else {
    res.status(404);
    throw new Error('Subject not found');
  }
});

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private/Admin
const updateSubject = asyncHandler(async (req, res) => {
  const { name, description, teachers, directions } = req.body;

  const subject = await Subject.findById(req.params.id);

  if (subject) {
    subject.name = name || subject.name;
    subject.description = description || subject.description;
    
    if (teachers) {
      subject.teachers = teachers;
    }
    
    if (directions) {
      subject.directions = directions;
    }

    const updatedSubject = await subject.save();
    res.json(updatedSubject);
  } else {
    res.status(404);
    throw new Error('Subject not found');
  }
});

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private/Admin
const deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);

  if (subject) {
    await subject.deleteOne();
    res.json({ message: 'Subject removed' });
  } else {
    res.status(404);
    throw new Error('Subject not found');
  }
});

// @desc    Get subjects by teacher ID
// @route   GET /api/subjects/teacher/:id
// @access  Private
const getSubjectsByTeacher = asyncHandler(async (req, res) => {
  console.log(`Fetching subjects for teacher: ${req.params.id}`);
  
  try {
    // First try finding subjects where this teacher is directly assigned
    const subjects = await Subject.find({ teachers: req.params.id })
      .populate('directions', 'name');
    
    console.log(`Found ${subjects.length} subjects directly assigned to teacher ${req.params.id}`);
    
    // If no subjects found, return all subjects as a fallback to avoid empty dropdowns
    if (subjects.length === 0) {
      console.log('No subjects directly assigned to teacher, using fallback to all subjects');
      const allSubjects = await Subject.find({})
        .populate('directions', 'name');
      
      console.log(`Returning all ${allSubjects.length} subjects as fallback`);
      return res.json(allSubjects);
    }
    
    return res.json(subjects);
  } catch (error) {
    console.error(`Error getting subjects for teacher ${req.params.id}:`, error);
    res.status(500).json({
      message: 'Failed to fetch subjects for teacher',
      error: error.message
    });
  }
});

// @desc    Get subjects by direction ID
// @route   GET /api/subjects/direction/:id
// @access  Public
const getSubjectsByDirection = asyncHandler(async (req, res) => {
  const subjects = await Subject.find({ directions: req.params.id })
    .populate('teachers', 'name email');
    
  res.json(subjects);
});

module.exports = {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  getSubjectsByTeacher,
  getSubjectsByDirection,
};
