const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentsBySubject,
  getStudentsByDirection
} = require('../controllers/studentController');
const { protect, admin, teacher, canManageStudents } = require('../middleware/authMiddleware');

// Route to get all students (admin and teachers)
router.get('/', protect, canManageStudents, getStudents);

// Route to get students by subject
router.get('/subject/:id', protect, canManageStudents, getStudentsBySubject);

// Route to get students by direction
router.get('/direction/:id', protect, canManageStudents, getStudentsByDirection);

module.exports = router;
