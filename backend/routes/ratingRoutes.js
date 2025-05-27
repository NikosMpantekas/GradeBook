const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect, admin, student } = require('../middleware/authMiddleware');

// Import models directly for database operations
// Note: RatingQuestion is now embedded within RatingPeriod
const { RatingPeriod, StudentRating } = require('../models/ratingModel');
const User = require('../models/userModel');
const Subject = require('../models/subjectModel');

// RATING PERIOD ROUTES WITH EMBEDDED QUESTIONS
// Create a rating period with embedded questions
router.post('/periods', protect, admin, asyncHandler(async (req, res) => {
  try {
    const { title, description, startDate, endDate, targetType, schools, directions, questions } = req.body;

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

    // Create rating period with embedded questions
    const ratingPeriod = await RatingPeriod.create({
      title,
      description,
      startDate: start,
      endDate: end,
      targetType: targetType || 'both',
      schools: schools || [],
      directions: directions || [],
      isActive: false, // Default to inactive until explicitly activated
      questions: questions || [], // Include embedded questions from the request
      createdBy: req.user._id
    });

    if (ratingPeriod) {
      res.status(201).json(ratingPeriod);
    } else {
      res.status(400);
      throw new Error('Invalid rating period data');
    }
  } catch (error) {
    console.error('Error creating rating period:', error);
    res.status(400).json({ message: error.message || 'Failed to create rating period' });
  }
}));

// Get all rating periods
router.get('/periods', protect, admin, asyncHandler(async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error fetching rating periods:', error);
    res.status(400).json({ message: error.message || 'Failed to fetch rating periods' });
  }
}));

// Get a single rating period with its embedded questions
router.get('/periods/:id', protect, asyncHandler(async (req, res) => {
  try {
    const ratingPeriod = await RatingPeriod.findById(req.params.id)
      .populate('schools', 'name')
      .populate('directions', 'name')
      .populate('createdBy', 'name email');

    if (!ratingPeriod) {
      res.status(404);
      throw new Error('Rating period not found');
    }

    res.status(200).json(ratingPeriod);
  } catch (error) {
    console.error('Error fetching rating period:', error);
    res.status(400).json({ message: error.message || 'Failed to fetch rating period' });
  }
}));

// Update a rating period including its questions
router.put('/periods/:id', protect, admin, asyncHandler(async (req, res) => {
  try {
    const { title, description, startDate, endDate, isActive, targetType, schools, directions, questions } = req.body;

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

    // Update the rating period with all fields including questions
    ratingPeriod.title = title !== undefined ? title : ratingPeriod.title;
    ratingPeriod.description = description !== undefined ? description : ratingPeriod.description;
    ratingPeriod.startDate = start;
    ratingPeriod.endDate = end;
    ratingPeriod.isActive = isActive !== undefined ? isActive : ratingPeriod.isActive;
    ratingPeriod.targetType = targetType || ratingPeriod.targetType;
    
    // Only update schools and directions if provided
    if (schools) ratingPeriod.schools = schools;
    if (directions) ratingPeriod.directions = directions;
    
    // Update questions if provided
    if (questions) ratingPeriod.questions = questions;

    // Auto-close if end date is in the past
    const now = new Date();
    if (end < now && ratingPeriod.isActive) {
      ratingPeriod.isActive = false;
    }

    const updatedRatingPeriod = await ratingPeriod.save();

    res.status(200).json(updatedRatingPeriod);
  } catch (error) {
    console.error('Error updating rating period:', error);
    res.status(400).json({ message: error.message || 'Failed to update rating period' });
  }
}));

// Add a question to an existing rating period
router.post('/periods/:id/questions', protect, admin, asyncHandler(async (req, res) => {
  try {
    const { text, questionType, targetType, order } = req.body;
    
    // Validation
    if (!text) {
      res.status(400);
      throw new Error('Question text is required');
    }
    
    const ratingPeriod = await RatingPeriod.findById(req.params.id);
    
    if (!ratingPeriod) {
      res.status(404);
      throw new Error('Rating period not found');
    }
    
    // Create the new question
    const newQuestion = {
      text,
      questionType: questionType || 'rating',
      targetType: targetType || 'both',
      order: order || ratingPeriod.questions.length
    };
    
    // Add to the questions array
    ratingPeriod.questions.push(newQuestion);
    
    // Save the updated rating period
    await ratingPeriod.save();
    
    res.status(201).json(ratingPeriod);
  } catch (error) {
    console.error('Error adding question to rating period:', error);
    res.status(400).json({ message: error.message || 'Failed to add question' });
  }
}));

// Update a specific question within a rating period
router.put('/periods/:periodId/questions/:questionId', protect, admin, asyncHandler(async (req, res) => {
  try {
    const { text, questionType, targetType, order } = req.body;
    
    const ratingPeriod = await RatingPeriod.findById(req.params.periodId);
    
    if (!ratingPeriod) {
      res.status(404);
      throw new Error('Rating period not found');
    }
    
    // Find the question by its ID
    const questionIndex = ratingPeriod.questions.findIndex(
      q => q._id.toString() === req.params.questionId
    );
    
    if (questionIndex === -1) {
      res.status(404);
      throw new Error('Question not found in this rating period');
    }
    
    // Update the question
    if (text) ratingPeriod.questions[questionIndex].text = text;
    if (questionType) ratingPeriod.questions[questionIndex].questionType = questionType;
    if (targetType) ratingPeriod.questions[questionIndex].targetType = targetType;
    if (order !== undefined) ratingPeriod.questions[questionIndex].order = order;
    
    // Save the updated rating period
    await ratingPeriod.save();
    
    res.status(200).json(ratingPeriod);
  } catch (error) {
    console.error('Error updating question in rating period:', error);
    res.status(400).json({ message: error.message || 'Failed to update question' });
  }
}));

// Remove a question from a rating period
router.delete('/periods/:periodId/questions/:questionId', protect, admin, asyncHandler(async (req, res) => {
  try {
    const ratingPeriod = await RatingPeriod.findById(req.params.periodId);
    
    if (!ratingPeriod) {
      res.status(404);
      throw new Error('Rating period not found');
    }
    
    // Filter out the question to be removed
    ratingPeriod.questions = ratingPeriod.questions.filter(
      q => q._id.toString() !== req.params.questionId
    );
    
    // Save the updated rating period
    await ratingPeriod.save();
    
    res.status(200).json({ message: 'Question removed from rating period' });
  } catch (error) {
    console.error('Error removing question from rating period:', error);
    res.status(400).json({ message: error.message || 'Failed to remove question' });
  }
}));

// Delete a rating period and all its embedded questions
router.delete('/periods/:id', protect, admin, asyncHandler(async (req, res) => {
  try {
    const ratingPeriod = await RatingPeriod.findById(req.params.id);

    if (!ratingPeriod) {
      res.status(404);
      throw new Error('Rating period not found');
    }
    
    // Delete all related student ratings
    await StudentRating.deleteMany({ ratingPeriod: req.params.id });
    
    // Delete the rating period (questions are embedded, so they're deleted automatically)
    await RatingPeriod.deleteOne({ _id: ratingPeriod._id });

    res.status(200).json({ message: 'Rating period removed' });
  } catch (error) {
    console.error('Error deleting rating period:', error);
    res.status(400).json({ message: error.message || 'Failed to delete rating period' });
  }
}));

// Get active rating periods for students
router.get('/active', protect, student, asyncHandler(async (req, res) => {
  try {
    const now = new Date();
    
    // Get student's school and direction
    const studentSchool = req.user.school ? req.user.school._id || req.user.school : null;
    const studentDirection = req.user.direction ? req.user.direction._id || req.user.direction : null;
    
    // Find active rating periods applicable to this student
    const activePeriods = await RatingPeriod.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { schools: { $in: [studentSchool] } },
        { schools: { $size: 0 } },
        { 'schools.0': { $exists: false } }
      ],
      $or: [
        { directions: { $in: [studentDirection] } },
        { directions: { $size: 0 } },
        { 'directions.0': { $exists: false } }
      ]
    }).sort({ createdAt: -1 });
    
    res.status(200).json(activePeriods);
  } catch (error) {
    console.error('Error fetching active rating periods:', error);
    res.status(400).json({ message: error.message || 'Failed to fetch active rating periods' });
  }
}));

// Get rating targets (teachers/subjects) for a student
router.get('/targets', protect, student, asyncHandler(async (req, res) => {
  try {
    // Placeholder for now - will implement with actual teacher/subject fetching
    res.status(200).json({ teachers: [], subjects: [] });
  } catch (error) {
    console.error('Error fetching rating targets:', error);
    res.status(400).json({ message: error.message || 'Failed to fetch rating targets' });
  }
}));

// Check if student has already rated a target
router.get('/check/:periodId/:targetType/:targetId', protect, student, asyncHandler(async (req, res) => {
  try {
    const { periodId, targetType, targetId } = req.params;
    
    const existingRating = await StudentRating.findOne({
      student: req.user._id,
      ratingPeriod: periodId,
      targetType,
      targetId
    });
    
    res.status(200).json({
      hasRated: !!existingRating,
      ratingId: existingRating ? existingRating._id : null
    });
  } catch (error) {
    console.error('Error checking student rating:', error);
    res.status(400).json({ message: error.message || 'Failed to check rating status' });
  }
}));

// Submit a student rating
router.post('/submit', protect, student, asyncHandler(async (req, res) => {
  try {
    const { ratingPeriodId, targetType, targetId, answers } = req.body;
    
    // Validation
    if (!ratingPeriodId || !targetType || !targetId || !answers) {
      res.status(400);
      throw new Error('Missing required fields');
    }
    
    // Check if rating period exists and is active
    const ratingPeriod = await RatingPeriod.findById(ratingPeriodId);
    
    if (!ratingPeriod) {
      res.status(404);
      throw new Error('Rating period not found');
    }
    
    const now = new Date();
    if (!ratingPeriod.isActive || now < ratingPeriod.startDate || now > ratingPeriod.endDate) {
      res.status(400);
      throw new Error('Rating period is not active');
    }
    
    // Check if target exists
    let targetModel;
    if (targetType === 'teacher') {
      targetModel = 'User';
      const teacher = await User.findById(targetId);
      if (!teacher) {
        res.status(404);
        throw new Error('Teacher not found');
      }
    } else if (targetType === 'subject') {
      targetModel = 'Subject';
      const subject = await Subject.findById(targetId);
      if (!subject) {
        res.status(404);
        throw new Error('Subject not found');
      }
    } else {
      res.status(400);
      throw new Error('Invalid target type');
    }
    
    // Check if student has already submitted a rating for this target in this period
    const existingRating = await StudentRating.findOne({
      student: req.user._id,
      ratingPeriod: ratingPeriodId,
      targetType,
      targetId
    });
    
    if (existingRating) {
      res.status(400);
      throw new Error('You have already rated this target for this period');
    }
    
    // Process and validate answers
    const processedAnswers = answers.map(answer => {
      // Find the question in the rating period to get its text
      const question = ratingPeriod.questions.id(answer.questionId);
      
      if (!question) {
        throw new Error(`Question with ID ${answer.questionId} not found`);
      }
      
      return {
        questionId: answer.questionId,
        questionText: question.text,
        ratingValue: answer.ratingValue,
        textAnswer: answer.textAnswer
      };
    });
    
    // Create the student rating
    const studentRating = await StudentRating.create({
      student: req.user._id,
      ratingPeriod: ratingPeriodId,
      targetType,
      targetId,
      targetModel,
      answers: processedAnswers,
      school: req.user.school || null,
      direction: req.user.direction || null
    });
    
    res.status(201).json(studentRating);
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(400).json({ message: error.message || 'Failed to submit rating' });
  }
}));

// Get rating statistics for a target
router.get('/stats/:targetType/:targetId', protect, admin, asyncHandler(async (req, res) => {
  try {
    // Placeholder for now - will implement statistics calculation
    res.status(200).json({ totalRatings: 0, ratings: [] });
  } catch (error) {
    console.error('Error fetching rating statistics:', error);
    res.status(400).json({ message: error.message || 'Failed to fetch rating statistics' });
  }
}));

// Get questions for a rating period (endpoint matching frontend API call pattern)
router.get('/questions/:periodId', protect, admin, asyncHandler(async (req, res) => {
  try {
    const ratingPeriod = await RatingPeriod.findById(req.params.periodId);
    
    if (!ratingPeriod) {
      res.status(404);
      throw new Error('Rating period not found');
    }
    
    // Return the questions array from the rating period
    res.status(200).json(ratingPeriod.questions);
  } catch (error) {
    console.error('Error fetching questions for rating period:', error);
    res.status(400).json({ message: error.message || 'Failed to fetch questions' });
  }
}));

// Update a question (endpoint matching frontend API call pattern)
router.put('/questions/:questionId', protect, admin, asyncHandler(async (req, res) => {
  try {
    const { text, questionType, targetType, order, ratingPeriod: periodId } = req.body;
    
    if (!periodId) {
      res.status(400);
      throw new Error('Rating period ID is required');
    }
    
    const ratingPeriod = await RatingPeriod.findById(periodId);
    
    if (!ratingPeriod) {
      res.status(404);
      throw new Error('Rating period not found');
    }
    
    // Find the question by its ID
    const questionIndex = ratingPeriod.questions.findIndex(
      q => q._id.toString() === req.params.questionId
    );
    
    if (questionIndex === -1) {
      res.status(404);
      throw new Error('Question not found in this rating period');
    }
    
    // Update the question
    if (text) ratingPeriod.questions[questionIndex].text = text;
    if (questionType) ratingPeriod.questions[questionIndex].questionType = questionType;
    if (targetType) ratingPeriod.questions[questionIndex].targetType = targetType;
    if (order !== undefined) ratingPeriod.questions[questionIndex].order = order;
    
    // Save the updated rating period
    await ratingPeriod.save();
    
    // Return the updated question
    res.status(200).json(ratingPeriod.questions[questionIndex]);
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(400).json({ message: error.message || 'Failed to update question' });
  }
}));

// Delete a question (endpoint matching frontend API call pattern)
router.delete('/questions/:questionId', protect, admin, asyncHandler(async (req, res) => {
  try {
    // We need to find which rating period contains this question
    const ratingPeriods = await RatingPeriod.find({
      'questions._id': req.params.questionId
    });
    
    if (ratingPeriods.length === 0) {
      res.status(404);
      throw new Error('Question not found');
    }
    
    const ratingPeriod = ratingPeriods[0];
    
    // Filter out the question to be removed
    ratingPeriod.questions = ratingPeriod.questions.filter(
      q => q._id.toString() !== req.params.questionId
    );
    
    // Save the updated rating period
    await ratingPeriod.save();
    
    res.status(200).json({ message: 'Question removed successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(400).json({ message: error.message || 'Failed to delete question' });
  }
}));

// Create a new rating question (endpoint matching frontend API call pattern)
router.post('/questions', protect, admin, asyncHandler(async (req, res) => {
  try {
    console.log('POST /questions request received with body:', req.body);
    const { text, questionType, targetType, order, ratingPeriod: periodId } = req.body;
    
    // Validation
    if (!text) {
      console.log('Question text is missing');
      res.status(400);
      throw new Error('Question text is required');
    }
    
    if (!periodId) {
      console.log('Rating period ID is missing');
      res.status(400);
      throw new Error('Rating period ID is required');
    }
    
    console.log(`Looking for rating period with ID: ${periodId}`);
    const ratingPeriod = await RatingPeriod.findById(periodId);
    
    if (!ratingPeriod) {
      console.log(`Rating period not found with ID: ${periodId}`);
      res.status(404);
      throw new Error('Rating period not found');
    }
    
    console.log('Found rating period:', ratingPeriod.title);
    
    // Create the new question
    const newQuestion = {
      text,
      questionType: questionType || 'rating',
      targetType: targetType || 'both',
      order: order !== undefined ? order : ratingPeriod.questions.length
    };
    
    console.log('Adding new question:', newQuestion);
    
    // Add to the questions array
    ratingPeriod.questions.push(newQuestion);
    
    // Save the updated rating period
    const updatedPeriod = await ratingPeriod.save();
    
    // Return the newly created question (the last one in the array)
    const createdQuestion = updatedPeriod.questions[updatedPeriod.questions.length - 1];
    
    console.log('Successfully created question:', createdQuestion);
    res.status(201).json(createdQuestion);
  } catch (error) {
    console.error('Error adding question to rating period:', error);
    res.status(400).json({ message: error.message || 'Failed to add question' });
  }
}));

module.exports = router;
// End of file
