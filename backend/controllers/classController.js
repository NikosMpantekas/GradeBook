const asyncHandler = require('express-async-handler');
const Class = require('../models/classModel');
const User = require('../models/userModel');
const mongoose = require('mongoose');

// @desc    Create a new class
// @route   POST /api/classes
// @access  Private (Admin only)
const createClass = asyncHandler(async (req, res) => {
  console.log('Create class request body:', JSON.stringify(req.body, null, 2));
  
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
  
  // Map frontend field names to backend expected names
  const classSubject = subject || subjectName;
  const classDirection = direction || directionName;
  const classSchoolBranch = schoolBranch || schoolId;
  // Use subject as name if name not provided
  const className = name || classSubject;

  console.log('Mapped class fields:', {
    name: className,
    subject: classSubject,
    direction: classDirection,
    schoolBranch: classSchoolBranch
  });
  
  // Basic validation with mapped field names
  if (!className || !classSubject || !classDirection || !classSchoolBranch) {
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

  // Process students and teachers arrays to ensure they are valid MongoDB IDs
  let processedStudents = [];
  let processedTeachers = [];
  
  // Process students array - ensure IDs are valid and handle object format from frontend
  if (students && Array.isArray(students)) {
    processedStudents = students.map(student => {
      if (typeof student === 'string') {
        return student;  // Already an ID string
      } else if (student && student._id) {
        return student._id;  // Extract ID from object
      }
      return null;
    }).filter(Boolean);  // Remove any null values
    
    console.log('Processed students:', processedStudents);
  }
  
  // Process teachers array - ensure IDs are valid and handle object format from frontend
  if (teachers && Array.isArray(teachers)) {
    processedTeachers = teachers.map(teacher => {
      if (typeof teacher === 'string') {
        return teacher;  // Already an ID string
      } else if (teacher && teacher._id) {
        return teacher._id;  // Extract ID from object
      }
      return null;
    }).filter(Boolean);  // Remove any null values
    
    console.log('Processed teachers:', processedTeachers);
  }

  console.log('Creating class with schoolId:', req.user.schoolId);
  console.log('Class creation data:', {
    name: className,
    schoolId: req.user.schoolId,
    subject: classSubject,
    direction: classDirection,
    schoolBranch: classSchoolBranch,
  });
  
  // Create the class with the current school ID and mapped field names
  const newClass = await Class.create({
    name: className,
    schoolId: req.user.schoolId,
    subject: classSubject,
    direction: classDirection,
    schoolBranch: classSchoolBranch,
    description: description || '',
    students: processedStudents,
    teachers: processedTeachers,
    schedule: schedule || [],
  });

  if (newClass) {
    console.log('Class created successfully:', newClass._id);
    console.log('Created class details:', JSON.stringify(newClass, null, 2));
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
  console.log('Getting classes for user with schoolId:', req.user.schoolId);
  
  // Construct query based on user role
  let query = { schoolId: req.user.schoolId };
  
  // If teacher, only return classes where they are assigned
  if (req.user.role === 'teacher') {
    query = { 
      schoolId: req.user.schoolId,
      teachers: req.user._id
    };
  }
  
  console.log('Class query filter:', JSON.stringify(query, null, 2));

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

  console.log(`Found ${classes.length} classes matching query`);
  if (classes.length > 0) {
    // Only log first class to avoid excessive logging
    console.log('Sample class data:', JSON.stringify(classes[0], null, 2));
  } else {
    console.log('No classes found - trying to get all classes to debug');
    const allClasses = await Class.find({});
    console.log(`Total classes in database: ${allClasses.length}`);
    if (allClasses.length > 0) {
      console.log('Sample class with potentially mismatched schoolId:', JSON.stringify(allClasses[0], null, 2));
    }
  }

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

// @desc    Get classes taught by the authenticated teacher
// @route   GET /api/classes/my-teaching-classes
// @access  Private (Teacher)
const getMyTeachingClasses = asyncHandler(async (req, res) => {
  try {
    console.log('[MY-TEACHING-CLASSES] Getting classes for teacher ID:', req.user._id);
    console.log('[MY-TEACHING-CLASSES] Teacher school ID:', req.user.schoolId);
    
    // Find all classes where the authenticated teacher is assigned
    const teachingClasses = await Class.find({
      schoolId: req.user.schoolId,
      teachers: { $in: [req.user._id] }
    })
    .populate('students', 'name email')
    .populate('teachers', 'name email')
    .populate('subject', 'name')
    .populate('direction', 'name')
    .populate('schoolBranch', 'name')
    .sort({ name: 1 });
    
    console.log('[MY-TEACHING-CLASSES] Found', teachingClasses.length, 'classes for teacher');
    console.log('[MY-TEACHING-CLASSES] Classes:', teachingClasses.map(c => ({ id: c._id, name: c.name, subject: c.subject?.name })));
    
    res.status(200).json(teachingClasses);
  } catch (error) {
    console.error('[MY-TEACHING-CLASSES] Error:', error.message);
    console.error('[MY-TEACHING-CLASSES] Stack:', error.stack);
    res.status(500);
    throw new Error('Error retrieving teaching classes');
  }
});

// @desc    Get classes for current student
// @route   GET /api/classes/my-classes
// @access  Private (Student)
const getMyClasses = asyncHandler(async (req, res) => {
  console.log('[CLASS CONTROLLER] Getting classes for student:', req.user._id);
  
  try {
    // Find all classes where the current user is a student
    const classes = await Class.find({
      students: req.user._id,
      schoolId: req.user.schoolId
    })
    .populate('teachers', 'name email')
    .lean();
    
    console.log(`[CLASS CONTROLLER] Found ${classes.length} classes for student ${req.user.name}`);
    
    res.json(classes);
  } catch (error) {
    console.error('[CLASS CONTROLLER] Error getting student classes:', error);
    res.status(500);
    throw new Error(`Failed to retrieve classes: ${error.message}`);
  }
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
  removeTeachersFromClass,
  getMyTeachingClasses,
  getMyClasses
};
