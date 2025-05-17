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
const { admin, teacher } = require('../middleware/tenantMiddleware');

// Protected routes
router.get('/student/:id', protect, getStudentGrades);
router.get('/subject/:id', protect, getGradesBySubject);
router.get('/teacher/:id', protect, getGradesByTeacher);
router.get('/:id', protect, getGradeById);

// Teacher routes
router.post('/', protect, teacher, createGrade);
router.put('/:id', protect, teacher, updateGrade);
router.delete('/:id', protect, teacher, deleteGrade);

// Admin routes
router.get('/', protect, admin, getAllGrades);

module.exports = router;
