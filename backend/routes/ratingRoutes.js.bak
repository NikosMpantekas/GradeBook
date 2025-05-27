const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect, admin, student } = require('../middleware/authMiddleware');

// Import models directly for database operations
const { RatingPeriod, RatingQuestion, StudentRating } = require('../models/ratingModel');
const User = require('../models/userModel');
const Subject = require('../models/subjectModel');

// Rating Period Routes - Implemented directly in this file to avoid controller issues
router.post('/periods', protect, admin, asyncHandler(async (req, res) => {
  try {
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

// Get a single rating period
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

// Update a rating period
router.put('/periods/:id', protect, admin, asyncHandler(async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error updating rating period:', error);
    res.status(400).json({ message: error.message || 'Failed to update rating period' });
  }
}));

// Delete a rating period
router.delete('/periods/:id', protect, admin, asyncHandler(async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error deleting rating period:', error);
    res.status(400).json({ message: error.message || 'Failed to delete rating period' });
  }
}));

// Simplified placeholders for other routes to ensure they don't crash
router.get('/active', (req, res) => {
  res.status(200).json([]);
});

router.get('/targets', (req, res) => {
  res.status(200).json({ teachers: [], subjects: [] });
});

router.get('/check/:periodId/:targetType/:targetId', (req, res) => {
  res.status(200).json({ hasRated: false, ratingId: null });
});

router.get('/stats/:targetType/:targetId', (req, res) => {
  res.status(200).json({ totalRatings: 0, ratings: [] });
});

router.get('/questions/:periodId', (req, res) => {
  res.status(200).json([]);
});

// Simple placeholders for POST routes
router.post('/questions', (req, res) => {
  res.status(200).json({ message: 'Rating question creation temporarily disabled' });
});

router.post('/submit', (req, res) => {
  res.status(200).json({ message: 'Rating submission temporarily disabled' });
});

// Simple placeholders for remaining PUT and DELETE routes
router.put('/questions/:id', (req, res) => {
  res.status(200).json({ message: 'Rating question update temporarily disabled' });
});

router.delete('/questions/:id', (req, res) => {
  res.status(200).json({ message: 'Rating question deletion temporarily disabled' });
});

module.exports = router;
