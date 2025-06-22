const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Subject = require('../models/subjectModel');
const Class = require('../models/classModel');

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

// @desc    Get students for teacher based on their classes (NEW CLASS-BASED LOGIC)
// @route   GET /api/students/teacher/classes
// @access  Private/Teacher
const getStudentsForTeacher = asyncHandler(async (req, res) => {
  console.log('getStudentsForTeacher endpoint called for teacher:', req.user._id);
  
  try {
    // Find all classes where this teacher is assigned
    const teacherClasses = await Class.find({
      schoolId: req.user.schoolId,
      teachers: req.user._id,
      active: true
    }).populate('students', 'name email');
    
    console.log(`Found ${teacherClasses.length} classes for teacher ${req.user._id}`);
    
    // Extract unique students from all the teacher's classes
    const studentIds = new Set();
    const studentsMap = new Map();
    
    teacherClasses.forEach(cls => {
      if (cls.students && Array.isArray(cls.students)) {
        cls.students.forEach(student => {
          if (student && student._id) {
            const studentId = student._id.toString();
            if (!studentIds.has(studentId)) {
              studentIds.add(studentId);
              studentsMap.set(studentId, {
                _id: student._id,
                name: student.name,
                email: student.email,
                // Add class context information
                classes: []
              });
            }
            // Add class information to student record
            studentsMap.get(studentId).classes.push({
              classId: cls._id,
              className: cls.name,
              subject: cls.subject,
              direction: cls.direction,
              schoolBranch: cls.schoolBranch
            });
          }
        });
      }
    });
    
    // Convert to array and add detailed student information
    const students = Array.from(studentsMap.values());
    
    console.log(`Found ${students.length} unique students across teacher's classes`);
    
    res.json(students);
  } catch (error) {
    console.error('Error in getStudentsForTeacher:', error.message);
    res.status(500);
    throw new Error('Error retrieving students for teacher: ' + error.message);
  }
});

// @desc    Get students by subject for a teacher (NEW CLASS-BASED LOGIC)
// @route   GET /api/students/teacher/subject/:id
// @access  Private/Teacher
const getStudentsBySubjectForTeacher = asyncHandler(async (req, res) => {
  const subjectId = req.params.id;
  console.log(`getStudentsBySubjectForTeacher called for teacher: ${req.user._id}, subject: ${subjectId}`);
  
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
    
    console.log(`Subject found: ${subject.name}`);
    
    // Find classes where:
    // 1. Teacher is assigned
    // 2. Subject matches
    // 3. Same school
    const teacherClasses = await Class.find({
      schoolId: req.user.schoolId,
      teachers: req.user._id,
      subject: subject.name, // Match by subject name
      active: true
    }).populate('students', 'name email');
    
    console.log(`Found ${teacherClasses.length} classes for teacher ${req.user._id} with subject ${subject.name}`);
    
    // Extract unique students from matching classes
    const studentIds = new Set();
    const studentsMap = new Map();
    
    teacherClasses.forEach(cls => {
      console.log(`Processing class: ${cls.name} (${cls.subject}) with ${cls.students?.length || 0} students`);
      
      if (cls.students && Array.isArray(cls.students)) {
        cls.students.forEach(student => {
          if (student && student._id) {
            const studentId = student._id.toString();
            if (!studentIds.has(studentId)) {
              studentIds.add(studentId);
              studentsMap.set(studentId, {
                _id: student._id,
                name: student.name,
                email: student.email,
                // Add class context information for this subject
                classes: []
              });
            }
            // Add class information to student record
            studentsMap.get(studentId).classes.push({
              classId: cls._id,
              className: cls.name,
              subject: cls.subject,
              direction: cls.direction,
              schoolBranch: cls.schoolBranch
            });
          }
        });
      }
    });
    
    // Convert to array
    const students = Array.from(studentsMap.values());
    
    console.log(`Found ${students.length} unique students for teacher ${req.user._id} and subject ${subject.name}`);
    
    res.json(students);
  } catch (error) {
    console.error('Error in getStudentsBySubjectForTeacher:', error.message);
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Error retrieving students for this subject');
  }
});

// @desc    Get filter options for teacher based on their classes (school branches, directions, subjects)
// @route   GET /api/students/teacher/filters
// @access  Private/Teacher/Admin
const getFilterOptionsForTeacher = asyncHandler(async (req, res) => {
  console.log('getFilterOptionsForTeacher endpoint called for user:', req.user._id, 'role:', req.user.role);
  
  try {
    let teacherClasses = [];
    
    if (req.user.role === 'admin') {
      // Admin can see all classes in their school
      teacherClasses = await Class.find({
        schoolId: req.user.schoolId,
        active: true
      });
      console.log(`Admin user - found ${teacherClasses.length} classes in school ${req.user.schoolId}`);
    } else {
      // Find all classes where this teacher is assigned
      teacherClasses = await Class.find({
        schoolId: req.user.schoolId,
        teachers: req.user._id,
        active: true
      });
      console.log(`Teacher user - found ${teacherClasses.length} classes for teacher ${req.user._id}`);
    }
    
    // Extract unique filter options
    const schoolBranches = new Set();
    const directions = new Set();
    const subjects = new Set();
    
    teacherClasses.forEach(cls => {
      if (cls.schoolBranch) schoolBranches.add(cls.schoolBranch);
      if (cls.direction) directions.add(cls.direction);
      if (cls.subject) subjects.add(cls.subject);
    });
    
    const filterOptions = {
      schoolBranches: Array.from(schoolBranches).map(branch => ({ value: branch, label: branch })),
      directions: Array.from(directions).map(direction => ({ value: direction, label: direction })),
      subjects: Array.from(subjects).map(subject => ({ value: subject, label: subject }))
    };
    
    console.log('Filter options for user:', filterOptions);
    
    res.json(filterOptions);
  } catch (error) {
    console.error('Error in getFilterOptionsForTeacher:', error);
    res.status(500);
    throw new Error('Failed to get filter options');
  }
});

// @desc    Get students for teacher with multiple filters (school branch, direction, subject)
// @route   GET /api/students/teacher/filtered
// @access  Private/Teacher/Admin
const getFilteredStudentsForTeacher = asyncHandler(async (req, res) => {
  const { schoolBranch, direction, subject } = req.query;
  console.log(`getFilteredStudentsForTeacher called for user: ${req.user._id} (${req.user.role})`, { schoolBranch, direction, subject });
  
  try {
    // Build the filter for classes
    const classFilter = {
      schoolId: req.user.schoolId,
      active: true
    };
    
    // Add teacher filter only if user is not admin
    if (req.user.role !== 'admin') {
      classFilter.teachers = req.user._id;
    }
    
    // Add optional filters
    if (schoolBranch) classFilter.schoolBranch = schoolBranch;
    if (direction) classFilter.direction = direction;
    if (subject) classFilter.subject = subject;
    
    console.log('Class filter:', classFilter);
    
    // Find classes matching the criteria
    const matchingClasses = await Class.find(classFilter).populate('students', 'name email');
    
    console.log(`Found ${matchingClasses.length} matching classes`);
    
    // Extract unique students from all matching classes
    const studentMap = new Map();
    
    matchingClasses.forEach(cls => {
      if (cls.students && cls.students.length > 0) {
        cls.students.forEach(student => {
          if (!studentMap.has(student._id.toString())) {
            studentMap.set(student._id.toString(), {
              _id: student._id,
              name: student.name,
              email: student.email,
              classes: []
            });
          }
          // Add class context to student
          studentMap.get(student._id.toString()).classes.push({
            _id: cls._id,
            name: cls.name,
            subject: cls.subject,
            direction: cls.direction,
            schoolBranch: cls.schoolBranch
          });
        });
      }
    });
    
    const students = Array.from(studentMap.values());
    
    console.log(`Returning ${students.length} unique students`);
    
    res.json(students);
  } catch (error) {
    console.error('Error in getFilteredStudentsForTeacher:', error);
    res.status(500);
    throw new Error('Failed to get filtered students');
  }
});

module.exports = {
  getStudents,
  getStudentsBySubject,
  getStudentsByDirection,
  getStudentsForTeacher,
  getStudentsBySubjectForTeacher,
  getFilterOptionsForTeacher,
  getFilteredStudentsForTeacher
};
