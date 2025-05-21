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
    // Check if student exists and is actually a student
    const studentUser = await User.findById(student);
    if (!studentUser) {
      console.log('Student not found:', student);
      res.status(400);
      throw new Error('Student not found');
    }
    
    if (studentUser.role !== 'student') {
      console.log('Invalid student role:', studentUser.role);
      res.status(400);
      throw new Error('Invalid student - must have role "student"');
    }

    // First check if a grade already exists for this student, subject, and date
    const existingGrade = await Grade.findOne({
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
      teacher: req.user._id, // Fix: Use _id instead of id
      value: parseInt(value), // Ensure value is a number
      date: date || Date.now(),
    };
    
    // Only add description if provided
    if (description) {
      gradeData.description = description;
    }
    
    console.log('Creating grade with data:', gradeData);
    
    // Use try-catch specifically for duplicate key errors
    try {
      const grade = await Grade.create(gradeData);

      if (grade) {
        console.log('Grade created successfully:', grade._id);
        res.status(201).json(grade);
      } else {
        res.status(400);
        throw new Error('Failed to create grade');
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
  const grades = await Grade.find({})
    .populate('student', 'name email')
    .populate('subject', 'name')
    .populate('teacher', 'name email')
    .sort({ date: -1 });
  
  res.json(grades);
});

// @desc    Get grades for a specific student
// @route   GET /api/grades/student/:id
// @access  Private
const getStudentGrades = asyncHandler(async (req, res) => {
  // Students can only view their own grades, teachers and admins can view any student's grades
  if (req.user.role === 'student' && req.user.id !== req.params.id) {
    res.status(403);
    throw new Error('Not authorized to view these grades');
  }

  const grades = await Grade.find({ student: req.params.id })
    .populate('subject', 'name')
    .populate('teacher', 'name')
    .sort({ date: -1 });
  
  res.json(grades);
});

// @desc    Get grades by subject
// @route   GET /api/grades/subject/:id
// @access  Private
const getGradesBySubject = asyncHandler(async (req, res) => {
  // Students can only view their own grades in a subject
  let query = { subject: req.params.id };
  
  if (req.user.role === 'student') {
    query.student = req.user.id;
  }
  
  // Teachers can only view grades they assigned
  if (req.user.role === 'teacher') {
    query.teacher = req.user.id;
  }

  const grades = await Grade.find(query)
    .populate('student', 'name email')
    .populate('subject', 'name')
    .populate('teacher', 'name')
    .sort({ date: -1 });
  
  res.json(grades);
});

// @desc    Get grades assigned by a teacher
// @route   GET /api/grades/teacher/:id
// @access  Private/Teacher Admin
const getGradesByTeacher = asyncHandler(async (req, res) => {
  // Teachers can only view their own assigned grades
  if (req.user.role === 'teacher' && req.user.id !== req.params.id) {
    res.status(403);
    throw new Error('Not authorized to view these grades');
  }

  const grades = await Grade.find({ teacher: req.params.id })
    .populate('student', 'name email')
    .populate('subject', 'name')
    .sort({ date: -1 });
  
  res.json(grades);
});

// @desc    Get grade by ID
// @route   GET /api/grades/:id
// @access  Private
const getGradeById = asyncHandler(async (req, res) => {
  const grade = await Grade.findById(req.params.id)
    .populate('student', 'name email')
    .populate('subject', 'name')
    .populate('teacher', 'name email');

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

  res.json(grade);
});

// @desc    Update grade
// @route   PUT /api/grades/:id
// @access  Private/Teacher
const updateGrade = asyncHandler(async (req, res) => {
  const { value, description, date } = req.body;

  const grade = await Grade.findById(req.params.id);

  if (!grade) {
    res.status(404);
    throw new Error('Grade not found');
  }

  // Only the teacher who assigned the grade or an admin can update it
  if (req.user.role === 'teacher' && grade.teacher.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to update this grade');
  }

  grade.value = value || grade.value;
  grade.description = description || grade.description;
  
  if (date) {
    grade.date = date;
  }

  const updatedGrade = await grade.save();
  
  res.json(updatedGrade);
});

// @desc    Delete grade
// @route   DELETE /api/grades/:id
// @access  Private/Teacher
const deleteGrade = asyncHandler(async (req, res) => {
  const grade = await Grade.findById(req.params.id);

  if (!grade) {
    res.status(404);
    throw new Error('Grade not found');
  }

  // Only the teacher who assigned the grade or an admin can delete it
  if (req.user.role === 'teacher' && grade.teacher.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to delete this grade');
  }

  await grade.deleteOne();
  res.json({ message: 'Grade removed' });
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
