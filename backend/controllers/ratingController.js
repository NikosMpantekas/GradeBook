const asyncHandler = require('express-async-handler');
const { RatingPeriod, RatingQuestion, StudentRating } = require('../models/ratingModel');
const User = require('../models/userModel');
const Subject = require('../models/subjectModel');
const School = require('../models/schoolModel');
const Direction = require('../models/directionModel');
const mongoose = require('mongoose');

// @desc    Create a new rating period
// @route   POST /api/ratings/periods
// @access  Private (Admin only)
const createRatingPeriod = asyncHandler(async (req, res) => {
  const { title, description, startDate, endDate, targetType, schools, directions } = req.body;

  // Validation
  if (!title || !startDate || !endDate) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }
  
  // Convert dates from strings if needed
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Validate date range
  if (start >= end) {
    res.status(400);
    throw new Error('End date must be after start date');
  }

  // Create rating period
  const ratingPeriod = await RatingPeriod.create({
    title,
    description,
    startDate: start,
    endDate: end,
    targetType: targetType || 'both',
    schools: schools || [],
    directions: directions || [],
    isActive: false, // Default to inactive until explicitly activated
    createdBy: req.user._id
  });

  if (ratingPeriod) {
    res.status(201).json(ratingPeriod);
  } else {
    res.status(400);
    throw new Error('Invalid rating period data');
  }
});

// @desc    Get all rating periods
// @route   GET /api/ratings/periods
// @access  Private (Admin only)
const getRatingPeriods = asyncHandler(async (req, res) => {
  // If admin, get all periods associated with their schools
  const schoolIds = req.user.schools?.map(s => typeof s === 'object' ? s._id : s) || [];
  
  // Find rating periods for this admin's schools or global periods
  const ratingPeriods = await RatingPeriod.find({
    $or: [
      { schools: { $in: schoolIds } },
      { 'schools.0': { $exists: false } }
    ]
  })
    .populate('schools', 'name')
    .populate('directions', 'name')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json(ratingPeriods);
});

// @desc    Get a single rating period
// @route   GET /api/ratings/periods/:id
// @access  Private
const getRatingPeriod = asyncHandler(async (req, res) => {
  const ratingPeriod = await RatingPeriod.findById(req.params.id)
    .populate('schools', 'name')
    .populate('directions', 'name')
    .populate('createdBy', 'name email');

  if (!ratingPeriod) {
    res.status(404);
    throw new Error('Rating period not found');
  }

  res.status(200).json(ratingPeriod);
});

// @desc    Update a rating period
// @route   PUT /api/ratings/periods/:id
// @access  Private (Admin only)
const updateRatingPeriod = asyncHandler(async (req, res) => {
  const { title, description, startDate, endDate, isActive, targetType, schools, directions } = req.body;

  const ratingPeriod = await RatingPeriod.findById(req.params.id);

  if (!ratingPeriod) {
    res.status(404);
    throw new Error('Rating period not found');
  }

  // Convert dates from strings if needed
  const start = startDate ? new Date(startDate) : ratingPeriod.startDate;
  const end = endDate ? new Date(endDate) : ratingPeriod.endDate;
  
  // Validate date range
  if (start >= end) {
    res.status(400);
    throw new Error('End date must be after start date');
  }

  // Update the rating period
  ratingPeriod.title = title !== undefined ? title : ratingPeriod.title;
  ratingPeriod.description = description !== undefined ? description : ratingPeriod.description;
  ratingPeriod.startDate = start;
  ratingPeriod.endDate = end;
  ratingPeriod.isActive = isActive !== undefined ? isActive : ratingPeriod.isActive;
  ratingPeriod.targetType = targetType || ratingPeriod.targetType;
  
  // Only update schools and directions if provided
  if (schools) ratingPeriod.schools = schools;
  if (directions) ratingPeriod.directions = directions;

  // Auto-close if end date is in the past
  const now = new Date();
  if (end < now && ratingPeriod.isActive) {
    ratingPeriod.isActive = false;
  }

  const updatedRatingPeriod = await ratingPeriod.save();

  res.status(200).json(updatedRatingPeriod);
});

// @desc    Delete a rating period
// @route   DELETE /api/ratings/periods/:id
// @access  Private (Admin only)
const deleteRatingPeriod = asyncHandler(async (req, res) => {
  const ratingPeriod = await RatingPeriod.findById(req.params.id);

  if (!ratingPeriod) {
    res.status(404);
    throw new Error('Rating period not found');
  }

  // Delete all related questions
  await RatingQuestion.deleteMany({ ratingPeriod: req.params.id });
  
  // Delete all related student ratings
  await StudentRating.deleteMany({ ratingPeriod: req.params.id });
  
  // Delete the rating period
  await RatingPeriod.deleteOne({ _id: ratingPeriod._id });

  res.status(200).json({ message: 'Rating period removed' });
});

// @desc    Create a new rating question
// @route   POST /api/ratings/questions
// @access  Private (Admin only)
const createRatingQuestion = asyncHandler(async (req, res) => {
  const { text, questionType, targetType, ratingPeriod, order } = req.body;

  // Validation
  if (!text || !questionType || !targetType || !ratingPeriod) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Validate questionType
  if (!['rating', 'text'].includes(questionType)) {
    res.status(400);
    throw new Error('Question type must be either "rating" or "text"');
  }

  // Validate targetType
  if (!['teacher', 'subject', 'both'].includes(targetType)) {
    res.status(400);
    throw new Error('Target type must be either "teacher", "subject", or "both"');
  }

  // Check if rating period exists
  const period = await RatingPeriod.findById(ratingPeriod);
  if (!period) {
    res.status(404);
    throw new Error('Rating period not found');
  }

  // Create rating question
  const ratingQuestion = await RatingQuestion.create({
    text,
    questionType,
    targetType,
    ratingPeriod,
    order: order || 0,
    createdBy: req.user._id
  });

  if (ratingQuestion) {
    res.status(201).json(ratingQuestion);
  } else {
    res.status(400);
    throw new Error('Invalid rating question data');
  }
});

// @desc    Get rating questions for a period
// @route   GET /api/ratings/questions/:periodId
// @access  Private
const getRatingQuestions = asyncHandler(async (req, res) => {
  const { periodId } = req.params;

  // Check if rating period exists
  const period = await RatingPeriod.findById(periodId);
  if (!period) {
    res.status(404);
    throw new Error('Rating period not found');
  }

  // Get questions for this period
  const questions = await RatingQuestion.find({ ratingPeriod: periodId })
    .sort({ order: 1, createdAt: 1 });

  res.status(200).json(questions);
});

// @desc    Update a rating question
// @route   PUT /api/ratings/questions/:id
// @access  Private (Admin only)
const updateRatingQuestion = asyncHandler(async (req, res) => {
  const { text, questionType, targetType, order } = req.body;

  const ratingQuestion = await RatingQuestion.findById(req.params.id);

  if (!ratingQuestion) {
    res.status(404);
    throw new Error('Rating question not found');
  }

  // Update rating question
  ratingQuestion.text = text || ratingQuestion.text;
  ratingQuestion.questionType = questionType || ratingQuestion.questionType;
  ratingQuestion.targetType = targetType || ratingQuestion.targetType;
  if (order !== undefined) ratingQuestion.order = order;

  const updatedRatingQuestion = await ratingQuestion.save();

  res.status(200).json(updatedRatingQuestion);
});

// @desc    Delete a rating question
// @route   DELETE /api/ratings/questions/:id
// @access  Private (Admin only)
const deleteRatingQuestion = asyncHandler(async (req, res) => {
  const ratingQuestion = await RatingQuestion.findById(req.params.id);

  if (!ratingQuestion) {
    res.status(404);
    throw new Error('Rating question not found');
  }

  // Delete the rating question
  await RatingQuestion.deleteOne({ _id: ratingQuestion._id });

  res.status(200).json({ message: 'Rating question removed' });
});

// @desc    Submit a rating for a teacher or subject
// @route   POST /api/ratings/submit
// @access  Private (Student only)
const submitRating = asyncHandler(async (req, res) => {
  const { ratingPeriod, targetType, targetId, answers, school, direction } = req.body;

  // Validation
  if (!ratingPeriod || !targetType || !targetId || !answers || !Array.isArray(answers)) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Check if rating period exists and is active
  const period = await RatingPeriod.findById(ratingPeriod);

  if (!period) {
    res.status(404);
    throw new Error('Rating period not found');
  }

  // Check if rating period is active
  if (!period.isActive) {
    res.status(400);
    throw new Error('Rating period is not currently active');
  }

  // Check if rating period has expired
  const now = new Date();
  if (period.endDate < now) {
    res.status(400);
    throw new Error('Rating period has ended');
  }

  // Create student rating
  const studentRating = await StudentRating.create({
    student: req.user._id,
    ratingPeriod,
    targetType,
    targetId,
    targetModel: targetType === 'teacher' ? 'User' : 'Subject',
    answers: answers,
    school: school || null,
    direction: direction || null
  });

  if (studentRating) {
    res.status(201).json({ 
      message: 'Rating submitted successfully',
      id: studentRating._id
    });
  } else {
    res.status(400);
    throw new Error('Failed to submit rating');
  }
});

// @desc    Get active rating periods for students
// @route   GET /api/ratings/active
// @access  Private (Student only)
const getActiveRatingPeriods = asyncHandler(async (req, res) => {
  const now = new Date();
  
  // Get student's school and direction
  const student = await User.findById(req.user._id)
    .populate('school')
    .populate('direction');
  
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }
  
  const schoolId = student.school ? student.school._id : null;
  const directionId = student.direction ? student.direction._id : null;
  
  // Find active rating periods for the student's school/direction
  const periods = await RatingPeriod.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now }
  });
  
  res.status(200).json(periods);
});

// @desc    Get available rating targets (teachers/subjects) for a student
// @route   GET /api/ratings/targets
// @access  Private (Student only)
const getRatingTargets = asyncHandler(async (req, res) => {
  const { periodId } = req.query;
  
  if (!periodId) {
    res.status(400);
    throw new Error('Rating period ID is required');
  }
  
  // Check if rating period exists and is active
  const period = await RatingPeriod.findById(periodId);
  
  if (!period) {
    res.status(404);
    throw new Error('Rating period not found');
  }
  
  // Get student's enrolled subjects and teachers
  const student = await User.findById(req.user._id)
    .populate('subjects')
    .populate({
      path: 'subjects',
      populate: {
        path: 'teacher',
        select: 'name lastName email'
      }
    });
  
  // Get available targets
  const teachers = [];
  const subjects = [];
  
  if (student && student.subjects) {
    student.subjects.forEach(subject => {
      if (subject) {
        subjects.push({
          _id: subject._id,
          name: subject.name,
          code: subject.code
        });
        
        if (subject.teacher) {
          teachers.push({
            _id: subject.teacher._id,
            name: subject.teacher.name,
            lastName: subject.teacher.lastName,
            email: subject.teacher.email
          });
        }
      }
    });
  }
  
  res.status(200).json({ teachers, subjects });
});

// @desc    Check if student has already rated a target
// @route   GET /api/ratings/check/:periodId/:targetType/:targetId
// @access  Private (Student only)
const checkStudentRating = asyncHandler(async (req, res) => {
  const { periodId, targetType, targetId } = req.params;
  
  // Validate parameters
  if (!periodId || !targetType || !targetId) {
    res.status(400);
    throw new Error('All parameters are required');
  }
  
  // Check if rating exists
  const rating = await StudentRating.findOne({
    student: req.user._id,
    ratingPeriod: periodId,
    targetType,
    targetId
  });
  
  res.status(200).json({
    hasRated: !!rating,
    ratingId: rating ? rating._id : null
  });
});

// @desc    Get rating statistics for a teacher or subject
// @route   GET /api/ratings/stats/:targetType/:targetId
// @access  Private (Admin and Teacher for their own stats)
const getRatingStats = asyncHandler(async (req, res) => {
  const { targetType, targetId } = req.params;
  const { periodId } = req.query;

  // Validate target type
  if (targetType !== 'teacher' && targetType !== 'subject') {
    res.status(400);
    throw new Error('Invalid target type');
  }

  // Build query
  const query = {
    targetType,
    targetId
  };

  // Add period filter if provided
  if (periodId) {
    query.ratingPeriod = periodId;
  }

  // Get all ratings for this target
  const ratings = await StudentRating.find(query);

  res.status(200).json({
    totalRatings: ratings.length,
    ratings
  });
});

// Make sure each function is properly exported
module.exports = {
  createRatingPeriod,
  getRatingPeriods,
  getRatingPeriod,
  updateRatingPeriod,
  deleteRatingPeriod,
  createRatingQuestion,
  getRatingQuestions,
  updateRatingQuestion,
  deleteRatingQuestion,
  submitRating,
  getRatingStats,
  getActiveRatingPeriods,
  getRatingTargets,
  checkStudentRating
};
