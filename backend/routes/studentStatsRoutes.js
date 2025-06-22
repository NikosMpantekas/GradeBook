const express = require('express');
const router = express.Router();
const {
  getStudentStats,
  getStudentDetailedStats
} = require('../controllers/studentStatsController');

const { protect, adminOrTeacher } = require('../middleware/authMiddleware');

// @route   GET /api/stats/students
// @desc    Get student statistics with grade averages and counts
// @access  Private (Admin: all students, Teacher: only shared students)
router.get('/students', protect, adminOrTeacher, getStudentStats);

// @route   GET /api/stats/students/:id
// @desc    Get detailed statistics for a specific student
// @access  Private (Admin: any student, Teacher: only shared students)
router.get('/students/:id', protect, adminOrTeacher, getStudentDetailedStats);

module.exports = router;
