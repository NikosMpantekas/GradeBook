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
  // Get user domain for filtering
  const adminEmail = req.user.email;
  const adminEmailParts = adminEmail.split('@');
  
  // Only return periods that are for schools in the admin's domain
  const adminDomain = adminEmailParts[1];

  // Get schools in the admin's domain
  const schools = await School.find({
    $or: [
      { emailDomain: adminDomain },
      { schoolDomain: adminDomain.split('.')[0] }
    ]
  });
  
  const schoolIds = schools.map(school => school._id);
  
  // Find periods for these schools
  const ratingPeriods = await RatingPeriod.find({
    $or: [
      { schools: { $in: schoolIds } },
      { 'schools.0': { $exists: false } } // Include periods with no schools specified
    ]
  })
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email')
    .populate('schools', 'name')
    .populate('directions', 'name');

  res.status(200).json(ratingPeriods);
});

// @desc    Get single rating period
// @route   GET /api/ratings/periods/:id
// @access  Private
const getRatingPeriod = asyncHandler(async (req, res) => {
  const ratingPeriod = await RatingPeriod.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('schools', 'name')
    .populate('directions', 'name');

  if (!ratingPeriod) {
    res.status(404);
    throw new Error('Rating period not found');
  }

  // Check if user has access to this rating period
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    // For students and teachers, check if they belong to the specified schools/directions
    const userSchools = req.user.schools || [];
    const userDirections = req.user.directions || [];
    
    const periodSchools = ratingPeriod.schools.map(s => s._id.toString());
    const periodDirections = ratingPeriod.directions.map(d => d._id.toString());
    
    // Check if any of the user's schools/directions match the period's schools/directions
    const hasMatchingSchool = userSchools.some(s => periodSchools.includes(s.toString()));
    const hasMatchingDirection = userDirections.some(d => periodDirections.includes(d.toString()));
    
    // If no matching schools/directions, deny access
    if (!hasMatchingSchool && !hasMatchingDirection) {
      res.status(403);
      throw new Error('You do not have access to this rating period');
    }
  }

  res.status(200).json(ratingPeriod);
});

// @desc    Update a rating period
// @route   PUT /api/ratings/periods/:id
// @access  Private (Admin only)
const updateRatingPeriod = asyncHandler(async (req, res) => {
  const { title, description, startDate, endDate, isActive, targetType, schools, directions } = req.body;

  // Find rating period
  const ratingPeriod = await RatingPeriod.findById(req.params.id);

  if (!ratingPeriod) {
    res.status(404);
    throw new Error('Rating period not found');
  }

  // Convert dates from strings if needed
  let start = startDate ? new Date(startDate) : ratingPeriod.startDate;
  let end = endDate ? new Date(endDate) : ratingPeriod.endDate;

  // Validate date range
  if (start >= end) {
    res.status(400);
    throw new Error('End date must be after start date');
  }

  // Update rating period
  ratingPeriod.title = title || ratingPeriod.title;
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
  await ratingPeriod.remove();

  res.status(200).json({ message: 'Rating period removed' });
});

// @desc    Create a new rating question
// @route   POST /api/ratings/questions
// @access  Private (Admin only)
const createRatingQuestion = asyncHandler(async (req, res) => {
  const { text, questionType, targetType, ratingPeriod, order } = req.body;

  // Validation
  if (!text || !ratingPeriod) {
    res.status(400);
    throw new Error('Please provide question text and rating period');
  }

  // Check if rating period exists
  const periodExists = await RatingPeriod.findById(ratingPeriod);
  if (!periodExists) {
    res.status(404);
    throw new Error('Rating period not found');
  }

  // Create rating question
  const ratingQuestion = await RatingQuestion.create({
    text,
    questionType: questionType || 'rating',
    targetType: targetType || 'both',
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

// @desc    Get questions for a rating period
// @route   GET /api/ratings/questions/:periodId
// @access  Private
const getRatingQuestions = asyncHandler(async (req, res) => {
  const ratingQuestions = await RatingQuestion.find({ ratingPeriod: req.params.periodId })
    .sort({ order: 1, createdAt: 1 })
    .populate('createdBy', 'name');

  res.status(200).json(ratingQuestions);
});

// @desc    Update a rating question
// @route   PUT /api/ratings/questions/:id
// @access  Private (Admin only)
const updateRatingQuestion = asyncHandler(async (req, res) => {
  const { text, questionType, targetType, order } = req.body;

  // Find rating question
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
  await ratingQuestion.remove();

  res.status(200).json({ message: 'Rating question removed' });
});

// @desc    Submit student ratings
// @route   POST /api/ratings/submit
// @access  Private (Student only)
const submitRating = asyncHandler(async (req, res) => {
  const { ratingPeriod, targetType, targetId, answers, school, direction } = req.body;

  // Validation
  if (!ratingPeriod || !targetType || !targetId || !answers || answers.length === 0) {
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

  // Check if this target type is allowed for this rating period
  if (period.targetType !== 'both' && period.targetType !== targetType) {
    res.status(400);
    throw new Error(`This rating period does not accept ratings for ${targetType}s`);
  }

  // Check if target exists
  let targetModel;
  let target;
  
  if (targetType === 'teacher') {
    targetModel = 'User';
    target = await User.findById(targetId);
    if (!target || target.role !== 'teacher') {
      res.status(404);
      throw new Error('Teacher not found');
    }
  } else if (targetType === 'subject') {
    targetModel = 'Subject';
    target = await Subject.findById(targetId);
    if (!target) {
      res.status(404);
      throw new Error('Subject not found');
    }
  } else {
    res.status(400);
    throw new Error('Invalid target type');
  }

  // Check if student has already submitted a rating for this target and period
  const existingRating = await StudentRating.findOne({
    student: req.user._id,
    ratingPeriod,
    targetType,
    targetId
  });

  if (existingRating) {
    res.status(400);
    throw new Error('You have already submitted a rating for this item');
  }

  // Validate answers
  const questions = await RatingQuestion.find({ 
    ratingPeriod,
    $or: [
      { targetType: 'both' },
      { targetType: targetType }
    ]
  });
  
  const questionIds = questions.map(q => q._id.toString());
  
  // Process and validate each answer
  const processedAnswers = answers.map(answer => {
    // Check if question exists and is applicable for this target type
    if (!questionIds.includes(answer.question.toString())) {
      throw new Error('Invalid question ID provided');
    }
    
    // Find the question to get its type
    const question = questions.find(q => q._id.toString() === answer.question.toString());
    
    // Validate answer based on question type
    if (question.questionType === 'rating') {
      if (!answer.ratingValue || answer.ratingValue < 1 || answer.ratingValue > 10) {
        throw new Error('Rating value must be between 1 and 10');
      }
      return {
        question: answer.question,
        ratingValue: answer.ratingValue,
        textAnswer: null
      };
    } else {
      // Text question
      if (!answer.textAnswer) {
        throw new Error('Text answer is required for this question');
      }
      return {
        question: answer.question,
        ratingValue: null,
        textAnswer: answer.textAnswer
      };
    }
  });

  // Create student rating
  const studentRating = await StudentRating.create({
    student: req.user._id,
    ratingPeriod,
    targetType,
    targetId,
    targetModel,
    answers: processedAnswers,
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

  // Check access rights
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    // Teachers can only view their own stats
    if (targetType === 'teacher' && targetId !== req.user._id.toString()) {
      res.status(403);
      throw new Error('You can only view your own ratings');
    }
    
    // For subject ratings, teacher must be teaching that subject
    if (targetType === 'subject') {
      // Logic to check if teacher teaches this subject
      // This would depend on your data model
    }
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
  const ratings = await StudentRating.find(query)
    .populate({
      path: 'answers.question',
      select: 'text questionType targetType'
    })
    .populate({
      path: 'ratingPeriod',
      select: 'title startDate endDate'
    });

  // Process statistics
  const stats = {
    totalRatings: ratings.length,
    periods: {},
    questions: {},
    averageRating: 0,
    textResponses: []
  };

  // Group by period
  ratings.forEach(rating => {
    const periodId = rating.ratingPeriod._id.toString();
    
    // Initialize period stats if not exists
    if (!stats.periods[periodId]) {
      stats.periods[periodId] = {
        id: periodId,
        title: rating.ratingPeriod.title,
        startDate: rating.ratingPeriod.startDate,
        endDate: rating.ratingPeriod.endDate,
        count: 0,
        questions: {}
      };
    }
    
    // Increment period rating count
    stats.periods[periodId].count++;
    
    // Process each answer
    rating.answers.forEach(answer => {
      const questionId = answer.question._id.toString();
      const questionText = answer.question.text;
      const questionType = answer.question.questionType;
      
      // Initialize question stats if not exists
      if (!stats.questions[questionId]) {
        stats.questions[questionId] = {
          id: questionId,
          text: questionText,
          type: questionType,
          count: 0,
          sum: 0,
          average: 0,
          distribution: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0},
          textResponses: []
        };
      }
      
      // Initialize period-question stats if not exists
      if (!stats.periods[periodId].questions[questionId]) {
        stats.periods[periodId].questions[questionId] = {
          id: questionId,
          text: questionText,
          type: questionType,
          count: 0,
          sum: 0,
          average: 0,
          distribution: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0},
          textResponses: []
        };
      }
      
      // Process rating or text answer
      if (questionType === 'rating' && answer.ratingValue) {
        const value = answer.ratingValue;
        
        // Update overall question stats
        stats.questions[questionId].count++;
        stats.questions[questionId].sum += value;
        stats.questions[questionId].distribution[value]++;
        
        // Update period-question stats
        stats.periods[periodId].questions[questionId].count++;
        stats.periods[periodId].questions[questionId].sum += value;
        stats.periods[periodId].questions[questionId].distribution[value]++;
      } 
      else if (questionType === 'text' && answer.textAnswer) {
        // Add text response
        stats.questions[questionId].textResponses.push(answer.textAnswer);
        stats.periods[periodId].questions[questionId].textResponses.push(answer.textAnswer);
        
        // Add to overall text responses
        stats.textResponses.push({
          question: questionText,
          response: answer.textAnswer,
          periodId,
          periodTitle: rating.ratingPeriod.title
        });
      }
    });
  });
  
  // Calculate averages for each question
  Object.keys(stats.questions).forEach(questionId => {
    const question = stats.questions[questionId];
    if (question.type === 'rating' && question.count > 0) {
      question.average = question.sum / question.count;
    }
    
    // Calculate averages for each period-question
    Object.keys(stats.periods).forEach(periodId => {
      const periodQuestion = stats.periods[periodId].questions[questionId];
      if (periodQuestion && periodQuestion.type === 'rating' && periodQuestion.count > 0) {
        periodQuestion.average = periodQuestion.sum / periodQuestion.count;
      }
    });
  });
  
  // Calculate overall average rating (across all rating questions)
  let totalSum = 0;
  let totalCount = 0;
  
  Object.values(stats.questions).forEach(question => {
    if (question.type === 'rating') {
      totalSum += question.sum;
      totalCount += question.count;
    }
  });
  
  if (totalCount > 0) {
    stats.averageRating = totalSum / totalCount;
  }

  res.status(200).json(stats);
});

// @desc    Get active rating periods for a student
// @route   GET /api/ratings/active
// @access  Private (Student only)
const getActiveRatingPeriods = asyncHandler(async (req, res) => {
  // Only for students
  if (req.user.role !== 'student') {
    res.status(403);
    throw new Error('Only students can access this endpoint');
  }

  const now = new Date();
  
  // Get student's schools and directions
  const studentSchools = req.user.schools || [];
  const studentDirections = req.user.directions || [];
  
  // Find active rating periods for this student's schools and directions
  const activePeriods = await RatingPeriod.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { schools: { $in: studentSchools } },
      { directions: { $in: studentDirections } },
      { 'schools.0': { $exists: false }, 'directions.0': { $exists: false } } // No specific schools/directions = all
    ]
  })
    .sort({ endDate: 1 }) // Ending soonest first
    .populate('schools', 'name')
    .populate('directions', 'name');

  res.status(200).json(activePeriods);
});

// @desc    Get ratable teachers and subjects for a student
// @route   GET /api/ratings/targets
// @access  Private (Student only)
const getRatingTargets = asyncHandler(async (req, res) => {
  const { periodId } = req.query;
  
  // Validation
  if (!periodId) {
    res.status(400);
    throw new Error('Rating period ID is required');
  }
  
  // Only for students
  if (req.user.role !== 'student') {
    res.status(403);
    throw new Error('Only students can access this endpoint');
  }
  
  // Get the rating period
  const period = await RatingPeriod.findById(periodId);
  if (!period) {
    res.status(404);
    throw new Error('Rating period not found');
  }
  
  // Check if period is active
  if (!period.isActive) {
    res.status(400);
    throw new Error('Rating period is not active');
  }
  
  // Get student's schools and directions
  const studentSchools = req.user.schools || [];
  const studentDirections = req.user.directions || [];
  
  // Get targets that the student can rate based on their schools and directions
  const results = {
    teachers: [],
    subjects: []
  };
  
  // Get teachers this student can rate
  if (period.targetType === 'teacher' || period.targetType === 'both') {
    // Find teachers who teach in the student's schools and directions
    const teachers = await User.find({
      role: 'teacher',
      $or: [
        { schools: { $in: studentSchools } },
        { directions: { $in: studentDirections } }
      ]
    })
      .select('name email')
      .lean();
    
    // Check which teachers the student has already rated
    const ratedTeachers = await StudentRating.find({
      student: req.user._id,
      ratingPeriod: periodId,
      targetType: 'teacher'
    }).select('targetId');
    
    const ratedTeacherIds = ratedTeachers.map(r => r.targetId.toString());
    
    // Filter out already rated teachers
    results.teachers = teachers.filter(t => !ratedTeacherIds.includes(t._id.toString()));
  }
  
  // Get subjects this student can rate
  if (period.targetType === 'subject' || period.targetType === 'both') {
    // Find subjects for the student's directions
    const subjects = await Subject.find({
      direction: { $in: studentDirections }
    })
      .select('name direction')
      .populate('direction', 'name')
      .lean();
    
    // Check which subjects the student has already rated
    const ratedSubjects = await StudentRating.find({
      student: req.user._id,
      ratingPeriod: periodId,
      targetType: 'subject'
    }).select('targetId');
    
    const ratedSubjectIds = ratedSubjects.map(r => r.targetId.toString());
    
    // Filter out already rated subjects
    results.subjects = subjects.filter(s => !ratedSubjectIds.includes(s._id.toString()));
  }
  
  res.status(200).json(results);
});

// @desc    Check if student has rated a specific target
// @route   GET /api/ratings/check/:periodId/:targetType/:targetId
// @access  Private (Student only)
const checkStudentRating = asyncHandler(async (req, res) => {
  const { periodId, targetType, targetId } = req.params;
  
  // Only for students
  if (req.user.role !== 'student') {
    res.status(403);
    throw new Error('Only students can access this endpoint');
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
