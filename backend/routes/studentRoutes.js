const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentsBySubject,
  getStudentsByDirection,
  getStudentsForTeacher,
  getStudentsBySubjectForTeacher
} = require('../controllers/studentController');
const { protect, admin, teacher, canManageStudents } = require('../middleware/authMiddleware');

// Route to get all students (admin and teachers)
router.get('/', protect, canManageStudents, getStudents);

// NEW CLASS-BASED ROUTES - Teachers get students from their assigned classes
router.get('/teacher/classes', protect, teacher, getStudentsForTeacher);
router.get('/teacher/subject/:id', protect, teacher, getStudentsBySubjectForTeacher);

// LEGACY ROUTES - Keep for backward compatibility during migration
router.get('/subject/:id', protect, canManageStudents, getStudentsBySubject);
router.get('/direction/:id', protect, canManageStudents, getStudentsByDirection);

module.exports = router;
