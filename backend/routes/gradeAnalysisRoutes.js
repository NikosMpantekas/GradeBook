const express = require('express');
const router = express.Router();
const { getStudentPeriodAnalysis } = require('../controllers/gradeAnalysisController');
const { protect, canManageStudents } = require('../middleware/authMiddleware');

// @route   GET /api/grades/student-period-analysis
// @desc    Get student grade analysis for a specific period with class comparisons
// @access  Private (Admin: all students, Teacher: only shared students)
router.get('/student-period-analysis', protect, canManageStudents, getStudentPeriodAnalysis);

module.exports = router;
