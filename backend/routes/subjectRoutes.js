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
const { protect } = require('../middleware/authMiddleware');
const { adminOrHigher, teacherOrHigher } = require('../middleware/tenantMiddleware');

// Public routes that don't have parameters
router.get('/', getSubjects);

// IMPORTANT: Order matters! Specific routes must come before generic routes
// Otherwise Express will match /teacher/123 as /:id = 'teacher/123' instead of /teacher/:id
router.get('/direction/:id', getSubjectsByDirection);
router.get('/teacher/:id', protect, getSubjectsByTeacher);

// Generic parameter route should be LAST to avoid wrongly catching specific routes
router.get('/:id', getSubjectById);

// Admin routes
router.post('/', protect, adminOrHigher, createSubject);
router.put('/:id', protect, adminOrHigher, updateSubject);
router.delete('/:id', protect, adminOrHigher, deleteSubject);

module.exports = router;
