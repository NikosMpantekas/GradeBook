const asyncHandler = require('express-async-handler');
const Grade = require('../models/gradeModel');
const User = require('../models/userModel');
const Subject = require('../models/subjectModel');
const Class = require('../models/classModel');
const { enforceSchoolFilter } = require('../middleware/schoolIdMiddleware');

// @desc    Create a new grade
// @route   POST /api/grades
// @access  Private/Teacher
const createGrade = asyncHandler(async (req, res) => {
  const { student, subject, value, description, date } = req.body;
  
  console.log('Grade creation request received:', { 
    body: req.body, 
    user: req.user._id, 
    userRole: req.user.role,
    schoolId: req.user.schoolId 
  });

  // Validate required fields
  if (!student || !subject || value === undefined || value === null) {
    res.status(400);
    throw new Error('Please provide student, subject and grade value');
  }

  // Validate value is a number between 0 and 100
  const numValue = Number(value);
  if (isNaN(numValue) || numValue < 0 || numValue > 100) {
    res.status(400);
    throw new Error('Grade value must be a number between 0 and 100');
  }

  try {
    // Verify the student exists and belongs to the same school
    const studentUser = await User.findOne({ 
      _id: student, 
      role: 'student',
      schoolId: req.user.schoolId // Multi-tenancy: Only find students in the same school
    });
    
    if (!studentUser) {
      console.log('Student not found or not in the same school:', student);
      res.status(400);
      throw new Error('Student not found in this school');
    }
    
    // Verify the subject exists and belongs to the same school
    const subjectDoc = await Subject.findOne({
      _id: subject,
      schoolId: req.user.schoolId // Multi-tenancy: Only find subjects in the same school
    });
    
    if (!subjectDoc) {
      console.log('Subject not found or not in the same school:', subject);
      res.status(400);
      throw new Error('Subject not found in this school');
    }

    // Class-based validation: Check if teacher can add grades to this student
    // Find classes where both teacher and student are present and the subject matches
    console.log('Checking class-based authorization for teacher:', req.user._id, 'student:', student, 'subject:', subject);
    
    const classes = await Class.find({
      schoolId: req.user.schoolId,
      teachers: req.user._id,
      students: student,
      subject: subjectDoc.name // Use subject name to match class subject
    });
    
    console.log(`Found ${classes.length} classes where teacher and student are both assigned with matching subject`);
    
    if (classes.length === 0) {
      console.log('No shared classes found with matching criteria');
      res.status(403);
      throw new Error('You are not authorized to add grades for this student with this subject. The student must be in one of your classes with the matching subject.');
    }
    
    // Log the found classes for debugging
    console.log('Matching classes:', classes.map(c => ({
      id: c._id,
      name: c.name,
      subject: c.subject,
      direction: c.direction,
      schoolBranch: c.schoolBranch
    })));
    
    // Convert value to number and ensure it's within valid range (0-100)
    const numericValue = Number(value);
    if (isNaN(numericValue) || numericValue < 0 || numericValue > 100) {
      console.log('Invalid grade value:', value);
      res.status(400);
      throw new Error('Grade value must be a number between 0 and 100');
    }
    
    // Format the date or use current date
    const gradeDate = date ? new Date(date) : new Date();
    if (isNaN(gradeDate.getTime())) {
      console.log('Invalid date format:', date);
      res.status(400);
      throw new Error('Invalid date format');
    }

    // Check if a grade already exists for this student, subject, and date in this school
    const existingGrade = await Grade.findOne({
      student,
      subject,
      date: { $eq: gradeDate },
      schoolId: req.user.schoolId // Multi-tenancy: Only check grades in the same school
    });
    
    if (existingGrade) {
      console.log('Found existing grade with same student, subject, and date:', existingGrade._id);
      res.status(400);
      throw new Error('A grade already exists for this student, subject, and date. Please use a different date or update the existing grade.');
    }

    // Create the grade with schoolId for multi-tenancy
    const gradeData = {
      student,
      subject,
      teacher: req.user._id,
      value: numericValue,
      date: gradeDate,
      schoolId: req.user.schoolId, // Multi-tenancy: Associate grade with the school
      createdAt: new Date() // Explicit creation timestamp
    };
    
    // Add description if provided
    if (description) {
      gradeData.description = description;
    }

    console.log('Creating grade with data:', { ...gradeData, teacher: req.user._id.toString() });

    // Create the grade in the database
    const grade = await Grade.create(gradeData);
    
    if (grade) {
      console.log(`Successfully created grade. ID: ${grade._id}, Student: ${student}, Subject: ${subject}, Value: ${numericValue}, School: ${req.user.schoolId}`);
      res.status(201).json({
        _id: grade._id,
        student: grade.student,
        subject: grade.subject,
        value: grade.value,
        date: grade.date,
        description: grade.description,
        message: 'Grade successfully created'
      });
    } else {
      console.log('Failed to create grade');
      res.status(400);
      throw new Error('Invalid grade data');
    }
  } catch (error) {
    // Handle duplicate key errors
    if (error.code === 11000) {
      console.error('Duplicate key error:', error.message);
      res.status(400);
      throw new Error('A grade with this student, subject, and date combination already exists. Please use a different date.');
    }
    
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
    // Apply filters
    let filter = {};
    
    // Multi-tenancy: Filter by schoolId unless superadmin
    if (req.user.role !== 'superadmin') {
      filter.schoolId = req.user.schoolId;
    }
    
    // Support query parameters for filtering
    if (req.query.student) filter.student = req.query.student;
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.teacher) filter.teacher = req.query.teacher;
    
    // Date range filtering
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
    }
    
    // Get all grades with the filter
    const grades = await Grade.find(filter)
      .populate('student', 'name email')
      .populate('subject', 'name')
      .populate('teacher', 'name')
      .sort({ date: -1 });
    
    res.status(200).json(grades);
  } catch (error) {
    console.error('Error in getAllGrades controller:', error.message);
    res.status(500);
    throw new Error('Error retrieving grades');
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
      throw new Error('Not authorized to view other students\' grades');
    }
    
    // First, verify the student exists and belongs to the same school
    const student = await User.findOne({ 
      _id: req.params.id, 
      role: 'student',
      schoolId: req.user.schoolId // Multi-tenancy: Only find students in the same school
    });
    
    if (!student) {
      res.status(404);
      throw new Error('Student not found in this school');
    }
    
    // Find all grades for this student in this school
    const grades = await Grade.find({
      student: req.params.id,
      schoolId: req.user.schoolId // Multi-tenancy: Only find grades in the same school
    })
      .populate('subject', 'name')
      .populate('teacher', 'name')
      .sort({ date: -1 });
    
    res.status(200).json(grades);
  } catch (error) {
    console.error('Error in getStudentGrades controller:', error.message);
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Error retrieving student grades');
  }
});

// @desc    Get grades for a specific subject
// @route   GET /api/grades/subject/:id
// @access  Private
const getGradesBySubject = asyncHandler(async (req, res) => {
  try {
    // Set up query based on user role
    let query = { 
      subject: req.params.id,
      schoolId: req.user.schoolId // Multi-tenancy: Only find grades in the same school
    };
    
    // Students can only view their own grades
    if (req.user.role === 'student') {
      query.student = req.user._id;
    }
    
    // Find all grades for this subject with proper filtering
    const grades = await Grade.find(query)
      .populate('student', 'name')
      .populate('teacher', 'name')
      .sort({ date: -1 });
    
    res.status(200).json(grades);
  } catch (error) {
    console.error('Error in getGradesBySubject controller:', error.message);
    res.status(500);
    throw new Error('Error retrieving subject grades');
  }
});

// @desc    Get grades assigned by a specific teacher
// @route   GET /api/grades/teacher/:id
// @access  Private
const getGradesByTeacher = asyncHandler(async (req, res) => {
  try {
    // Teachers can only view their own assigned grades
    if (req.user.role === 'teacher' && req.user.id !== req.params.id) {
      res.status(403);
      throw new Error('Not authorized to view grades assigned by other teachers');
    }
    
    // Find all grades assigned by this teacher in this school
    const grades = await Grade.find({
      teacher: req.params.id,
      schoolId: req.user.schoolId // Multi-tenancy: Only find grades in the same school
    })
      .populate('student', 'name')
      .populate('subject', 'name')
      .sort({ date: -1 });
    
    res.status(200).json(grades);
  } catch (error) {
    console.error('Error in getGradesByTeacher controller:', error.message);
    res.status(500);
    throw new Error('Error retrieving teacher grades');
  }
});

// @desc    Get a single grade by ID
// @route   GET /api/grades/:id
// @access  Private
const getGradeById = asyncHandler(async (req, res) => {
  try {
    // Find the grade in the current school
    const grade = await Grade.findOne({
      _id: req.params.id,
      schoolId: req.user.schoolId // Multi-tenancy: Only find grades in the same school
    })
      .populate('student', 'name email')
      .populate('subject', 'name')
      .populate('teacher', 'name');
    
    if (!grade) {
      res.status(404);
      throw new Error('Grade not found');
    }
    
    // Students can only view their own grades
    if (req.user.role === 'student' && grade.student._id.toString() !== req.user.id) {
      res.status(403);
      throw new Error('Not authorized to view this grade');
    }
    
    // Teachers can only view grades they assigned or grades for students they teach
    if (req.user.role === 'teacher') {
      const isTeacherOfGrade = grade.teacher._id.toString() === req.user.id;
      if (!isTeacherOfGrade) {
        res.status(403);
        throw new Error('Not authorized to view this grade');
      }
    }
    
    res.status(200).json(grade);
  } catch (error) {
    console.error('Error in getGradeById controller:', error.message);
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Error retrieving grade');
  }
});

// @desc    Update a grade
// @route   PUT /api/grades/:id
// @access  Private/Teacher
const updateGrade = asyncHandler(async (req, res) => {
  try {
    const { value, description, date, student, subject } = req.body;
    
    console.log('Grade update request received:', { 
      id: req.params.id,
      body: req.body, 
      user: req.user._id, 
      userRole: req.user.role,
      schoolId: req.user.schoolId 
    });
  
    // Find the grade to update
    const grade = await Grade.findOne({
      _id: req.params.id,
      schoolId: req.user.schoolId // Multi-tenancy: Only find grades in the same school
    });
    
    if (!grade) {
      res.status(404);
      throw new Error('Grade not found');
    }
    
    // Only the teacher who created the grade can update it, or an admin
    if (req.user.role === 'teacher' && grade.teacher.toString() !== req.user.id) {
      res.status(403);
      throw new Error('Not authorized to update this grade');
    }
    
    // Update the grade fields if provided
    // Handle null, empty string, or undefined values correctly
    if (value !== undefined) {
      console.log(`[UPDATE GRADE] Processing grade value update: ${JSON.stringify(value)}`);
      // Allow null values to be set (to represent no grade/deleted grade)
      grade.value = value;
    }
    
    if (description !== undefined) grade.description = description;
    if (date !== undefined) grade.date = date;
    
    // Update student if provided (FIX: This was missing before)
    if (student !== undefined) {
      // Verify the student exists and belongs to the same school
      const studentUser = await User.findOne({ 
        _id: student, 
        role: 'student',
        schoolId: req.user.schoolId // Multi-tenancy: Only find students in the same school
      });
      
      if (!studentUser) {
        console.log('Student not found or not in the same school:', student);
        res.status(400);
        throw new Error('Student not found in this school');
      }
      
      grade.student = student;
    }
    
    // Update subject if provided
    if (subject !== undefined) {
      // Verify the subject exists and belongs to the same school
      const subjectDoc = await Subject.findOne({
        _id: subject,
        schoolId: req.user.schoolId // Multi-tenancy: Only find subjects in the same school
      });
      
      if (!subjectDoc) {
        console.log('Subject not found or not in the same school:', subject);
        res.status(400);
        throw new Error('Subject not found in this school');
      }
      
      grade.subject = subject;
    }
    
    // Check if updating the date would create a duplicate
    if (date || student || subject) {
      const duplicateCheck = await Grade.findOne({
        student: grade.student,
        subject: grade.subject,
        date: date || grade.date,
        schoolId: req.user.schoolId, // Multi-tenancy: Only check grades in the same school
        _id: { $ne: grade._id } // Exclude current grade from check
      });
      
      if (duplicateCheck) {
        res.status(400);
        throw new Error('A grade already exists for this student, subject, and date. Please use a different date.');
      }
    }
    
    const updatedGrade = await grade.save();
    
    // Return the populated grade for immediate UI update
    const populatedGrade = await Grade.findById(updatedGrade._id)
      .populate('student', 'name email')
      .populate('subject', 'name')
      .populate('teacher', 'name');
      
    res.status(200).json(populatedGrade);
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
    // Find the grade to delete
    const grade = await Grade.findOne({
      _id: req.params.id,
      schoolId: req.user.schoolId // Multi-tenancy: Only find grades in the same school
    });
    
    if (!grade) {
      res.status(404);
      throw new Error('Grade not found');
    }
    
    // Only the teacher who created the grade can delete it, or an admin
    if (req.user.role === 'teacher' && grade.teacher.toString() !== req.user.id) {
      res.status(403);
      throw new Error('Not authorized to delete this grade');
    }
    
    // Delete the grade - using modern Mongoose method instead of deprecated remove()
    console.log(`[DELETE GRADE] Attempting to delete grade with ID: ${req.params.id}`);
    
    // Use findByIdAndDelete instead of the deprecated remove() method
    const deletedGrade = await Grade.findByIdAndDelete(req.params.id);
    
    if (!deletedGrade) {
      res.status(404);
      throw new Error('Grade could not be deleted or was already removed');
    }
    
    console.log(`[DELETE GRADE] Successfully deleted grade with ID: ${req.params.id}`);
    res.status(200).json({ message: 'Grade deleted successfully' });
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
