const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Subject = require('../models/subjectModel');

// @desc    Get all students
// @route   GET /api/students
// @access  Private/Admin/Teacher
const getStudents = asyncHandler(async (req, res) => {
  console.log('getStudents endpoint called');
  try {
    // Find all students (users with role='student') in the current school context
    const students = await User.find({ 
      role: 'student',
      schoolId: req.user.schoolId
    })
    .select('-password')
    .populate('direction', 'name')
    .populate('school', 'name')
    .lean();
    
    console.log(`Found ${students.length} students in school ID: ${req.user.schoolId}`);
    res.json(students);
  } catch (error) {
    console.error('Error in getStudents:', error.message);
    res.status(500);
    throw new Error('Error retrieving students: ' + error.message);
  }
});

// @desc    Get students by subject
// @route   GET /api/students/subject/:id
// @access  Private/Admin/Teacher
const getStudentsBySubject = asyncHandler(async (req, res) => {
  const subjectId = req.params.id;
  console.log(`getStudentsBySubject called for subject: ${subjectId}`);
  
  try {
    // First verify the subject exists in this school
    const subject = await Subject.findOne({
      _id: subjectId,
      schoolId: req.user.schoolId
    });
    
    if (!subject) {
      console.log(`Subject not found or not in this school: ${subjectId}`);
      res.status(404);
      throw new Error('Subject not found in this school');
    }
    
    // Get the direction IDs this subject belongs to
    const subjectDirections = subject.directions || [];
    console.log(`Subject belongs to directions: ${subjectDirections}`);
    
    // Find students who are in these directions and this school
    const students = await User.find({
      role: 'student',
      schoolId: req.user.schoolId,
      direction: { $in: subjectDirections }
    })
    .select('-password')
    .populate('direction', 'name')
    .populate('school', 'name')
    .lean();
    
    console.log(`Found ${students.length} students for subject ${subjectId}`);
    res.json(students);
  } catch (error) {
    console.error('Error in getStudentsBySubject:', error.message);
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Error retrieving students for this subject');
  }
});

// @desc    Get students by direction
// @route   GET /api/students/direction/:id
// @access  Private/Admin/Teacher
const getStudentsByDirection = asyncHandler(async (req, res) => {
  const directionId = req.params.id;
  console.log(`getStudentsByDirection called for direction: ${directionId}`);
  
  try {
    // Find students in this direction and school
    const students = await User.find({
      role: 'student',
      schoolId: req.user.schoolId,
      direction: directionId
    })
    .select('-password')
    .populate('direction', 'name')
    .populate('school', 'name')
    .lean();
    
    console.log(`Found ${students.length} students for direction ${directionId}`);
    res.json(students);
  } catch (error) {
    console.error('Error in getStudentsByDirection:', error.message);
    res.status(500);
    throw new Error('Error retrieving students for this direction: ' + error.message);
  }
});

module.exports = {
  getStudents,
  getStudentsBySubject,
  getStudentsByDirection
};
