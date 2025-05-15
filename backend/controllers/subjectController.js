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

  // Check if subject already exists
  const subjectExists = await Subject.findOne({ name });

  if (subjectExists) {
    res.status(400);
    throw new Error('Subject already exists');
  }

  const subject = await Subject.create({
    name,
    description,
    teachers,
    directions,
  });

  if (subject) {
    res.status(201).json(subject);
  } else {
    res.status(400);
    throw new Error('Invalid subject data');
  }
});

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Public
const getSubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.find({})
    .populate('teachers', 'name email')
    .populate('directions', 'name');
  res.json(subjects);
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
