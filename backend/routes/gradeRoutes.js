const express = require('express');
const router = express.Router();
const {
  createGrade,
  getAllGrades,
  getStudentGrades,
  getGradesBySubject,
  getGradesByTeacher,
  getGradeById,
  updateGrade,
  deleteGrade,
} = require('../controllers/gradeController');
const { protect } = require('../middleware/authMiddleware');
const { adminOrHigher, teacherOrHigher } = require('../middleware/tenantMiddleware');

// Protected routes
router.get('/student/:id', protect, getStudentGrades);
router.get('/subject/:id', protect, getGradesBySubject);
router.get('/teacher/:id', protect, getGradesByTeacher);
router.get('/:id', protect, getGradeById);

// Teacher routes
router.post('/', protect, teacherOrHigher, createGrade);
router.put('/:id', protect, teacherOrHigher, updateGrade);
router.delete('/:id', protect, teacherOrHigher, deleteGrade);

// Admin routes
router.get('/', protect, adminOrHigher, getAllGrades);

module.exports = router;
