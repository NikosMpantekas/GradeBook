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
    let subject;
    
    // CRITICAL FIX: Check if this is a request from a school-specific user
    if (req.school) {
      console.log(`Creating subject in school database: ${req.school.name}`);
      
      // Connect to the school-specific database
      const { connectToSchoolDb } = require('../config/multiDbConnect');
      const { connection } = await connectToSchoolDb(req.school);
      
      // Get or create the Subject model for this school
      let SchoolSubject;
      try {
        SchoolSubject = connection.model('Subject');
      } catch (modelError) {
        // If model doesn't exist, create it
        console.log('Creating Subject model in school database');
        const subjectSchema = new connection.Schema({
          name: String,
          description: String,
          teachers: [{ type: connection.Schema.Types.ObjectId, ref: 'User' }],
          directions: [{ type: connection.Schema.Types.ObjectId, ref: 'Direction' }],
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
      
      console.log(`Created subject in school database: ${subject.name} (${subject._id})`);
    } else {
      // This is a superadmin request - save to main database
      console.log('Creating subject in main database');
      
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
  const jwt = require('jsonwebtoken');
  const mongoose = require('mongoose');
  
  try {
    let subjects = [];
    let schoolId = null;
    
    // CRITICAL FIX: Default to assuming this is a school user like we did in directionController
    let isSuperAdmin = false;
    
    // Only check for superadmin if user role is explicitly 'superadmin'
    if (req.user && req.user.role === 'superadmin') {
      // Even then, only consider them superadmin if they have NO school references
      if (!req.user.schoolId && !req.user.schoolConnection && !req.school && 
          (!req.user.email || !req.user.email.includes('@'))) {
        isSuperAdmin = true;
        console.log('User is a true superadmin with no school references');
      }
    }
    
    // Try to extract schoolId from token directly first - most reliable source
    if (req.headers?.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded && decoded.schoolId) {
          const extractedSchoolId = decoded.schoolId;
          console.log(`Token contains schoolId ${extractedSchoolId} - using school database`);
          schoolId = extractedSchoolId;
        } else {
          console.log('Token decoded successfully but does not contain schoolId');
        }
      } catch (err) {
        console.error('Error extracting schoolId from token:', err.message);
      }
    }
    
    // If we have a schoolId from token, use that to find the school
    let school = req.school;
    if (!school && schoolId) {
      try {
        const School = mongoose.model('School');
        school = await School.findById(schoolId);
        if (school) {
          console.log(`Found school from token schoolId: ${school.name}`);
        }
      } catch (err) {
        console.error(`Error looking up school by ID: ${err.message}`);
      }
    }
    
    // If we have a school (either from req.school or from token), use it
    if (school) {
      console.log(`Fetching subjects for school: ${req.school.name}`);
      
      try {
        // IMPROVED: Use existing connection from middleware if available
        let connection;
        if (req.schoolConnection) {
          console.log('Using existing school connection from middleware');
          connection = req.schoolConnection;
        } else {
          // Fallback to creating a new connection
          console.log('Creating new school connection');
          const { connectToSchoolDb } = require('../config/multiDbConnect');
          const result = await connectToSchoolDb(req.school);
          connection = result.connection;
        }
        
        if (!connection) {
          throw new Error('Failed to get valid database connection');
        }
        
        // ENHANCED LOGGING: Examine connection state
        console.log(`Database connection state: ${connection.readyState}`);
        console.log(`Connected to database: ${connection.db ? connection.db.databaseName : 'unknown'}`);
        
        // Check if Subject model exists in this school's database
        try {
          const SchoolSubject = connection.model('Subject');
          
          // Try to fetch subjects with populated fields if models exist
          try {
            // First try simple query to check if we have any subjects
            const basicSubjects = await SchoolSubject.find({}).sort({ name: 1 });
            console.log(`Basic query found ${basicSubjects.length} subjects in school database`);
            
            // ENHANCED DEBUGGING: List all collections in the database
            const collections = await connection.db.listCollections().toArray();
            console.log(`Database has ${collections.length} collections:`, 
              collections.map(c => c.name).join(', '));
            
            // Check if we can populate related fields
            try {
              const SchoolUser = connection.model('User');
              const SchoolDirection = connection.model('Direction');
              
              // Both models exist, use populated query
              subjects = await SchoolSubject.find({}).sort({ name: 1 })
                .populate('teachers', 'name email')
                .populate('directions', 'name');
                
              console.log(`Found ${subjects.length} subjects with populated fields`);
            } catch (modelError) {
              // Some related models don't exist yet, use the basic query result
              console.log('Cannot populate all fields, using basic subject data:', modelError.message);
              subjects = basicSubjects;
            }
            
            // Log subject details for debugging
            if (subjects.length > 0) {
              subjects.forEach(subject => {
                console.log(`- School DB Subject: ${subject.name} (ID: ${subject._id})`);
              });
            } else {
              console.log('WARNING: No subjects found in school database');
            }
          } catch (queryError) {
            console.error('Error fetching subjects with populate:', queryError.message);
            // Fallback to simple query without populate
            subjects = await SchoolSubject.find({}).sort({ name: 1 });
            console.log(`Fallback query found ${subjects.length} subjects`);
          }
        } catch (modelError) {
          // If model doesn't exist, create a basic one
          console.log('Subject model not found in school database, creating model:', modelError.message);
          const subjectSchema = new connection.Schema({
            name: String,
            description: String,
            teachers: [{ type: connection.Schema.Types.ObjectId, ref: 'User' }],
            directions: [{ type: connection.Schema.Types.ObjectId, ref: 'Direction' }],
          }, { timestamps: true });
          
          const SchoolSubject = connection.model('Subject', subjectSchema);
          subjects = await SchoolSubject.find({}).sort({ name: 1 });
          console.log(`Found ${subjects.length} subjects after creating model`);
        }
      } catch (error) {
        console.error('Error accessing school database:', error.message);
        
        // Enhanced error logging for better debugging
        if (error.stack) {
          console.error('Error stack:', error.stack);
        }
        
        // CRITICAL FIX: Don't fall back to main database for school users
        // This ensures we don't mix data from different databases
        res.status(500);
        throw new Error(`Failed to fetch subjects from school database: ${error.message}`);
      }
    } else {
      // CRITICAL OVERRIDE: Check once more if the user has a schoolId in their token
      // This is our last chance to avoid using the main database incorrectly
      let finalCheck = false;
      
      if (req.user && req.headers?.authorization) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          
          if (decoded && decoded.schoolId) {
            const extractedSchoolId = decoded.schoolId;
            console.log(`EMERGENCY OVERRIDE: Token has schoolId ${extractedSchoolId}! Using school database!`);
            
            // Fetch school and redirect to school database
            const School = mongoose.model('School');
            const school = await School.findById(decoded.schoolId);
            
            if (school) {
              console.log(`REDIRECTING TO SCHOOL DATABASE: ${school.name}`);
              
              // Try to find subjects in the school database
              try {
                const { connectToSchoolDb } = require('../config/multiDbConnect');
                const { connection } = await connectToSchoolDb(school);
                
                if (!connection) {
                  throw new Error('Failed to connect to school database');
                }
                
                // Get or create Subject model
                let SchoolSubject;
                try {
                  SchoolSubject = connection.model('Subject');
                } catch (modelError) {
                  // Create the model if it doesn't exist
                  const subjectSchema = new mongoose.Schema({
                    name: String,
                    description: String,
                    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
                    directions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Direction' }],
                  }, { timestamps: true });
                  
                  SchoolSubject = connection.model('Subject', subjectSchema);
                }
                
                // Query for subjects
                subjects = await SchoolSubject.find({}).sort({ name: 1 });
                console.log(`EMERGENCY OVERRIDE SUCCESSFUL: Found ${subjects.length} subjects in school database`);
                
                finalCheck = true;
              } catch (error) {
                console.error(`EMERGENCY OVERRIDE FAILED: ${error.message}`);
              }
            }
          }
        } catch (err) {
          console.error('Error in emergency check:', err.message);
        }
      }
      
      // Only use main database if all our emergency checks failed
      if (!finalCheck) {
        console.log('Last resort: fetching subjects from main database');
        subjects = await Subject.find({}).sort({ name: 1 });
        console.log(`Found ${subjects.length} subjects in main database:`);
        subjects.forEach(subject => {
          console.log(`- ${subject.name}`);
          // Log direction associations
          if (subject.directions && subject.directions.length > 0) {
            const directionInfo = subject.directions.map(dir => 
              typeof dir === 'object' ? `${dir.name} (${dir._id})` : `ID: ${dir}`
            ).join(', ');
            console.log(`  Directions: ${directionInfo}`);
          } else {
            console.log('  No directions associated');
          }
        });
      }
    }
    
    console.log('Returning subjects to client');
    res.status(200).json(subjects);
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
