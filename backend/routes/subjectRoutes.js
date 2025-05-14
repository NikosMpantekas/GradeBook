const express = require('express');
const router = express.Router();
const {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  getSubjectsByTeacher,
  getSubjectsByDirection,
} = require('../controllers/subjectController');
const { protect, admin, teacher } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getSubjects);
router.get('/:id', getSubjectById);
router.get('/direction/:id', getSubjectsByDirection);

// Protected routes
router.get('/teacher/:id', protect, getSubjectsByTeacher);

// Admin routes
router.post('/', protect, admin, createSubject);
router.put('/:id', protect, admin, updateSubject);
router.delete('/:id', protect, admin, deleteSubject);

module.exports = router;
