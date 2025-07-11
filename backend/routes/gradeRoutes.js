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
const { protect, teacher, admin, canManageGrades } = require('../middleware/authMiddleware');

// Public routes for viewing grades (students can view their own)
router.get('/student', protect, (req, res) => {
  // Use the authenticated student's ID
  req.params.id = req.user._id.toString();
  return getStudentGrades(req, res);
});
router.get('/student/:id', protect, getStudentGrades);
router.get('/subject/:id', protect, getGradesBySubject);
router.get('/teacher', protect, (req, res) => {
  // Get grades for authenticated user - add their ID to params
  req.params.id = req.user._id.toString();
  return getGradesByTeacher(req, res);
});
router.get('/teacher/:id', protect, getGradesByTeacher);
router.get('/:id', protect, getGradeById);

// Admin/Teacher routes for grade management
router.post('/', protect, canManageGrades, createGrade);
router.put('/:id', protect, canManageGrades, updateGrade);
router.delete('/:id', protect, canManageGrades, deleteGrade);

// Get all grades - restricted to teachers and admins
router.get('/', protect, teacher, getAllGrades);

module.exports = router;
