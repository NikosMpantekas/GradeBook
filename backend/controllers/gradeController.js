const asyncHandler = require('express-async-handler');
const Grade = require('../models/gradeModel');
const User = require('../models/userModel');

// @desc    Create a new grade
// @route   POST /api/grades
// @access  Private/Teacher
const createGrade = asyncHandler(async (req, res) => {
  const { student, subject, value, description, date } = req.body;

  if (!student || !subject || !value) {
    res.status(400);
    throw new Error('Please provide student, subject and grade value');
  }

  // Check if student exists and is actually a student
  const studentUser = await User.findById(student);
  if (!studentUser || studentUser.role !== 'student') {
    res.status(400);
    throw new Error('Invalid student');
  }

  const grade = await Grade.create({
    student,
    subject,
    teacher: req.user.id, // Current authenticated teacher
    value,
    description,
    date: date || Date.now(),
  });

  if (grade) {
    res.status(201).json(grade);
  } else {
    res.status(400);
    throw new Error('Invalid grade data');
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
