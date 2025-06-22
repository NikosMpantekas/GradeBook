const express = require('express');
const router = express.Router();
const {
  getSchedule,
  getStudentSchedule,
  getTeacherSchedule
} = require('../controllers/scheduleController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/schedule
// @desc    Get schedule for current user (student, teacher, or admin)
// @access  Private
router.get('/', protect, getSchedule);

// @route   GET /api/schedule/student/:studentId
// @desc    Get schedule for a specific student (admin/teacher only)
// @access  Private/Admin/Teacher
router.get('/student/:studentId', protect, getStudentSchedule);

// @route   GET /api/schedule/teacher/:teacherId
// @desc    Get schedule for a specific teacher (admin only)
// @access  Private/Admin
router.get('/teacher/:teacherId', protect, getTeacherSchedule);

module.exports = router;
