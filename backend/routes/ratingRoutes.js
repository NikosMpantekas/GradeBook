const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect, admin, student, teacher } = require('../middleware/authMiddleware');

// Import models directly for database operations
const { RatingPeriod, RatingQuestion, StudentRating } = require('../models/ratingModel');

// Simple GET wildcard for routes we haven't fully implemented yet
router.get('/active', (req, res) => {
  res.status(200).json([]);
});

router.get('/targets', (req, res) => {
  res.status(200).json({ teachers: [], subjects: [] });
});

router.get('/check/*', (req, res) => {
  res.status(200).json({ hasRated: false, ratingId: null });
});

router.get('/stats/*', (req, res) => {
  res.status(200).json({ totalRatings: 0, ratings: [] });
});

// Rating Period Routes - Fully Implemented
router.post('/periods', protect, admin, asyncHandler(async (req, res) => {
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
}));

router.get('/periods', protect, admin, asyncHandler(async (req, res) => {
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
}));

router.get('/periods/:id', protect, asyncHandler(async (req, res) => {
  const ratingPeriod = await RatingPeriod.findById(req.params.id)
    .populate('schools', 'name')
    .populate('directions', 'name')
    .populate('createdBy', 'name email');

  if (!ratingPeriod) {
    res.status(404);
    throw new Error('Rating period not found');
  }

  res.status(200).json(ratingPeriod);
}));

router.put('/periods/:id', protect, admin, asyncHandler(async (req, res) => {
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
}));

router.delete('/periods/:id', protect, admin, asyncHandler(async (req, res) => {
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
}));

// Rating Question Routes - Minimal Implementation
router.post('/questions', protect, admin, (req, res) => {
  res.status(200).json({ message: 'Rating question creation temporarily disabled for maintenance' });
});

router.get('/questions/:periodId', protect, (req, res) => {
  res.status(200).json([]);
});

router.put('/questions/:id', protect, admin, (req, res) => {
  res.status(200).json({ message: 'Rating question update temporarily disabled for maintenance' });
});

router.delete('/questions/:id', protect, admin, (req, res) => {
  res.status(200).json({ message: 'Rating question deletion temporarily disabled for maintenance' });
});

// Student Rating Routes - Minimal Implementation
router.post('/submit', protect, student, (req, res) => {
  res.status(200).json({ message: 'Rating submission temporarily disabled for maintenance' });
});

module.exports = router;
