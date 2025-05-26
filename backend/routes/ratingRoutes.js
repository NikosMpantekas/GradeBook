const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/ratingController');

const { protect, admin, student, teacher } = require('../middleware/authMiddleware');

// Rating Period Routes
router.post('/periods', protect, admin, createRatingPeriod);
router.get('/periods', protect, admin, getRatingPeriods);
router.get('/periods/:id', protect, getRatingPeriod);
router.put('/periods/:id', protect, admin, updateRatingPeriod);
router.delete('/periods/:id', protect, admin, deleteRatingPeriod);

// Rating Question Routes
router.post('/questions', protect, admin, createRatingQuestion);
router.get('/questions/:periodId', protect, getRatingQuestions);
router.put('/questions/:id', protect, admin, updateRatingQuestion);
router.delete('/questions/:id', protect, admin, deleteRatingQuestion);

// Student Rating Routes
router.post('/submit', protect, student, submitRating);
router.get('/active', protect, student, getActiveRatingPeriods);
router.get('/targets', protect, student, getRatingTargets);
router.get('/check/:periodId/:targetType/:targetId', protect, student, checkStudentRating);

// Stats Routes
router.get('/stats/:targetType/:targetId', protect, getRatingStats);

module.exports = router;
