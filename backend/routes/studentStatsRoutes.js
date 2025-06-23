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

const { protect, canManageStudents } = require('../middleware/authMiddleware');

// Debug all function types before using them
console.log('Function type debugging:', {
  protect: typeof protect,
  canManageStudents: typeof canManageStudents,
  getStudentStats: typeof studentStatsController.getStudentStats,
  getStudentStatsValue: studentStatsController.getStudentStats,
  getStudentDetailedStats: typeof studentStatsController.getStudentDetailedStats,
  getStudentDetailedStatsValue: studentStatsController.getStudentDetailedStats
});

// Extract functions to variables for easier debugging
const getStudentStatsFunc = studentStatsController.getStudentStats;
const getStudentDetailedStatsFunc = studentStatsController.getStudentDetailedStats;

console.log('Extracted functions:', {
  getStudentStatsFunc: typeof getStudentStatsFunc,
  getStudentDetailedStatsFunc: typeof getStudentDetailedStatsFunc
});

// @route   GET /api/stats/students
// @desc    Get student statistics with grade averages and counts
// @access  Private (Admin: all students, Teacher: only shared students)
router.get('/students', protect, canManageStudents, getStudentStatsFunc);

// @route   GET /api/stats/students/:id
// @desc    Get detailed statistics for a specific student
// @access  Private (Admin: any student, Teacher: only shared students)
router.get('/students/:id', protect, canManageStudents, getStudentDetailedStatsFunc);

module.exports = router;
