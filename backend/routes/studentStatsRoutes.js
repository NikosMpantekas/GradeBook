const express = require('express');
const router = express.Router();

// Debug output to help diagnose the issue
console.log('Loading studentStatsRoutes...');

// Import controller directly without destructuring
const studentStatsController = require('../controllers/studentStatsController');

// Verify the controller was loaded correctly
console.log('Controller loaded:', {
  controllerExists: !!studentStatsController,
  getStudentStats: !!studentStatsController.getStudentStats,
  getStudentDetailedStats: !!studentStatsController.getStudentDetailedStats
});

const { protect, adminOrTeacher } = require('../middleware/authMiddleware');

// @route   GET /api/stats/students
// @desc    Get student statistics with grade averages and counts
// @access  Private (Admin: all students, Teacher: only shared students)
router.get('/students', protect, adminOrTeacher, studentStatsController.getStudentStats);

// @route   GET /api/stats/students/:id
// @desc    Get detailed statistics for a specific student
// @access  Private (Admin: any student, Teacher: only shared students)
router.get('/students/:id', protect, adminOrTeacher, studentStatsController.getStudentDetailedStats);

module.exports = router;
