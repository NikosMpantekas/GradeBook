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
const { protect, admin, teacher, canManageGrades } = require('../middleware/authMiddleware');

// Protected routes
router.get('/student/:id', protect, getStudentGrades);
router.get('/subject/:id', protect, getGradesBySubject);
router.get('/teacher/:id', protect, getGradesByTeacher);
router.get('/:id', protect, getGradeById);

// Grade creation route
router.post('/', protect, teacher, createGrade);

router.put('/:id', protect, teacher, updateGrade);

router.delete('/:id', protect, teacher, deleteGrade);

// Admin routes (with secretary support where appropriate)
router.get('/', protect, canManageGrades, getAllGrades);

module.exports = router;
