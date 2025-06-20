const asyncHandler = require('express-async-handler');
const Class = require('../models/classModel');
const User = require('../models/userModel');
const mongoose = require('mongoose');

// @desc    Create a new class
// @route   POST /api/classes
// @access  Private (Admin only)
const createClass = asyncHandler(async (req, res) => {
  // Support both field naming conventions
  const { 
    name, 
    subject, subjectName,
    direction, directionName, 
    schoolBranch, schoolId,
    description, 
    students, 
    teachers,
    schedule 
  } = req.body;
  
  // Use the provided values with fallbacks
  const actualSubject = subject || subjectName;
  const actualDirection = direction || directionName;
  const actualSchoolBranch = schoolBranch || schoolId;

  // Basic validation
  if (!name || !actualSubject || !actualDirection || !actualSchoolBranch) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Verify schedule format if provided
  if (schedule) {
    if (!Array.isArray(schedule)) {
      res.status(400);
      throw new Error('Schedule must be an array of time slots');
    }
    
    // Validate each schedule item
    for (const slot of schedule) {
      if (!slot.day || !slot.startTime || !slot.endTime) {
        res.status(400);
        throw new Error('Each schedule item must have day, startTime and endTime');
      }
    }
  }

  // Check if a class with the same name already exists in this school
  const classExists = await Class.findOne({ 
    name, 
    schoolId: req.user.schoolId 
  });

  if (classExists) {
    res.status(400);
    throw new Error('A class with this name already exists');
  }

  // Create the class with the current school ID
  const newClass = await Class.create({
    name,
    schoolId: req.user.schoolId,
    subject: actualSubject,
    direction: actualDirection,
    schoolBranch: actualSchoolBranch,
    description: description || '',
    students: students || [],
    teachers: teachers || [],
    schedule: schedule || [],
  });

  if (newClass) {
    res.status(201).json(newClass);
  } else {
    res.status(400);
    throw new Error('Invalid class data');
  }
});

// @desc    Get all classes for a school
// @route   GET /api/classes
// @access  Private (Admin and Teachers)
const getClasses = asyncHandler(async (req, res) => {
  // Construct query based on user role
  let query = { schoolId: req.user.schoolId };
  
  // If teacher, only return classes where they are assigned
  if (req.user.role === 'teacher') {
    query = { 
      schoolId: req.user.schoolId,
      teachers: req.user._id
    };
  }

  // Optional filtering
  const { subject, direction, schoolBranch, teacher, student } = req.query;
  
  if (subject) {
    query.subject = { $regex: subject, $options: 'i' };
  }
  
  if (direction) {
    query.direction = { $regex: direction, $options: 'i' };
  }
  
  if (schoolBranch) {
    query.schoolBranch = { $regex: schoolBranch, $options: 'i' };
  }
  
  if (teacher) {
    query.teachers = mongoose.Types.ObjectId.isValid(teacher) ? mongoose.Types.ObjectId(teacher) : null;
  }
  
  if (student) {
    query.students = mongoose.Types.ObjectId.isValid(student) ? mongoose.Types.ObjectId(student) : null;
  }

  // Execute query
  const classes = await Class.find(query)
    .populate('students', 'name email')
    .populate('teachers', 'name email')
    .sort({ name: 1 });

  res.status(200).json(classes);
});

// @desc    Get a single class by ID
// @route   GET /api/classes/:id
// @access  Private
const getClassById = asyncHandler(async (req, res) => {
  const classItem = await Class.findOne({ 
    _id: req.params.id,
    schoolId: req.user.schoolId
  })
    .populate('students', 'name email')
    .populate('teachers', 'name email');

  if (!classItem) {
    res.status(404);
    throw new Error('Class not found');
  }

  // Teachers can only access classes they are assigned to
  if (req.user.role === 'teacher' && !classItem.teachers.some(t => t._id.equals(req.user._id))) {
    res.status(403);
    throw new Error('Not authorized to access this class');
  }

  // Students can only access classes they are enrolled in
  if (req.user.role === 'student' && !classItem.students.some(s => s._id.equals(req.user._id))) {
    res.status(403);
    throw new Error('Not authorized to access this class');
  }

  res.status(200).json(classItem);
});

// @desc    Update a class
// @route   PUT /api/classes/:id
// @access  Private (Admin only)
const updateClass = asyncHandler(async (req, res) => {
  const classItem = await Class.findOne({
    _id: req.params.id,
    schoolId: req.user.schoolId
  });

  if (!classItem) {
    res.status(404);
    throw new Error('Class not found');
  }

  // Update with new data
  const updatedClass = await Class.findByIdAndUpdate(
    req.params.id,
    { 
      ...req.body,
      schoolId: req.user.schoolId // Ensure schoolId can't be changed
    },
    { new: true, runValidators: true }
  )
    .populate('students', 'name email')
    .populate('teachers', 'name email');

  res.status(200).json(updatedClass);
});

// @desc    Delete a class
// @route   DELETE /api/classes/:id
// @access  Private (Admin only)
const deleteClass = asyncHandler(async (req, res) => {
  const classItem = await Class.findOne({
    _id: req.params.id,
    schoolId: req.user.schoolId
  });

  if (!classItem) {
    res.status(404);
    throw new Error('Class not found');
  }

  await Class.deleteOne({ _id: classItem._id });
  
  res.status(200).json({ message: 'Class removed successfully' });
});

// @desc    Get all unique subjects, directions, and school branches
// @route   GET /api/classes/categories
// @access  Private
const getClassCategories = asyncHandler(async (req, res) => {
  // Use aggregation to get all unique values
  const schoolId = req.user.schoolId;
  
  const subjects = await Class.aggregate([
    { $match: { schoolId: mongoose.Types.ObjectId(schoolId) } },
    { $group: { _id: '$subject' } },
    { $sort: { _id: 1 } }
  ]);
  
  const directions = await Class.aggregate([
    { $match: { schoolId: mongoose.Types.ObjectId(schoolId) } },
    { $group: { _id: '$direction' } },
    { $sort: { _id: 1 } }
  ]);
  
  const schoolBranches = await Class.aggregate([
    { $match: { schoolId: mongoose.Types.ObjectId(schoolId) } },
    { $group: { _id: '$schoolBranch' } },
    { $sort: { _id: 1 } }
  ]);
  
  res.status(200).json({
    subjects: subjects.map(s => s._id),
    directions: directions.map(d => d._id),
    schoolBranches: schoolBranches.map(b => b._id)
  });
});

// @desc    Add students to a class
// @route   PUT /api/classes/:id/students
// @access  Private (Admin only)
const addStudentsToClass = asyncHandler(async (req, res) => {
  const { students } = req.body;
  
  if (!students || !Array.isArray(students)) {
    res.status(400);
    throw new Error('Please provide a list of student IDs');
  }

  const classItem = await Class.findOne({
    _id: req.params.id,
    schoolId: req.user.schoolId
  });

  if (!classItem) {
    res.status(404);
    throw new Error('Class not found');
  }

  // Add students that aren't already in the class
  for (const studentId of students) {
    if (!classItem.students.includes(studentId)) {
      classItem.students.push(studentId);
    }
  }

  await classItem.save();
  
  // Return updated class with populated student data
  const updatedClass = await Class.findById(classItem._id)
    .populate('students', 'name email')
    .populate('teachers', 'name email');

  res.status(200).json(updatedClass);
});

// @desc    Remove students from a class
// @route   DELETE /api/classes/:id/students
// @access  Private (Admin only)
const removeStudentsFromClass = asyncHandler(async (req, res) => {
  const { students } = req.body;
  
  if (!students || !Array.isArray(students)) {
    res.status(400);
    throw new Error('Please provide a list of student IDs');
  }

  const classItem = await Class.findOne({
    _id: req.params.id,
    schoolId: req.user.schoolId
  });

  if (!classItem) {
    res.status(404);
    throw new Error('Class not found');
  }

  // Remove specified students
  classItem.students = classItem.students.filter(
    studentId => !students.includes(studentId.toString())
  );

  await classItem.save();
  
  // Return updated class with populated student data
  const updatedClass = await Class.findById(classItem._id)
    .populate('students', 'name email')
    .populate('teachers', 'name email');

  res.status(200).json(updatedClass);
});

// @desc    Add teachers to a class
// @route   PUT /api/classes/:id/teachers
// @access  Private (Admin only)
const addTeachersToClass = asyncHandler(async (req, res) => {
  const { teachers } = req.body;
  
  if (!teachers || !Array.isArray(teachers)) {
    res.status(400);
    throw new Error('Please provide a list of teacher IDs');
  }

  const classItem = await Class.findOne({
    _id: req.params.id,
    schoolId: req.user.schoolId
  });

  if (!classItem) {
    res.status(404);
    throw new Error('Class not found');
  }

  // Add teachers that aren't already in the class
  for (const teacherId of teachers) {
    if (!classItem.teachers.includes(teacherId)) {
      classItem.teachers.push(teacherId);
    }
  }

  await classItem.save();
  
  // Return updated class with populated teacher data
  const updatedClass = await Class.findById(classItem._id)
    .populate('students', 'name email')
    .populate('teachers', 'name email');

  res.status(200).json(updatedClass);
});

// @desc    Remove teachers from a class
// @route   DELETE /api/classes/:id/teachers
// @access  Private (Admin only)
const removeTeachersFromClass = asyncHandler(async (req, res) => {
  const { teachers } = req.body;
  
  if (!teachers || !Array.isArray(teachers)) {
    res.status(400);
    throw new Error('Please provide a list of teacher IDs');
  }

  const classItem = await Class.findOne({
    _id: req.params.id,
    schoolId: req.user.schoolId
  });

  if (!classItem) {
    res.status(404);
    throw new Error('Class not found');
  }

  // Remove specified teachers
  classItem.teachers = classItem.teachers.filter(
    teacherId => !teachers.includes(teacherId.toString())
  );

  await classItem.save();
  
  // Return updated class with populated teacher data
  const updatedClass = await Class.findById(classItem._id)
    .populate('students', 'name email')
    .populate('teachers', 'name email');

  res.status(200).json(updatedClass);
});

module.exports = {
  createClass,
  getClasses,
  getClassById,
  updateClass,
  deleteClass,
  getClassCategories,
  addStudentsToClass,
  removeStudentsFromClass,
  addTeachersToClass,
  removeTeachersFromClass
};
