const express = require('express');
const router = express.Router();
const {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject
} = require('../controllers/subjectController');
const { protect, admin, teacher, canManageSubjects } = require('../middleware/authMiddleware');

// Public routes that don't have parameters
router.get('/', getSubjects);

// CRITICAL: Routes for filtering subjects by direction - restored due to frontend dependency
router.get('/direction/:directionId', getSubjectsByDirection);
router.get('/teacher', protect, teacher, getSubjectsByTeacher);

// Generic parameter route should be LAST to avoid wrongly catching specific routes
router.get('/:id', getSubjectById);

// Admin routes (with secretary support where appropriate)
router.post('/', protect, canManageSubjects, createSubject);
router.put('/:id', protect, canManageSubjects, updateSubject);
router.delete('/:id', protect, admin, deleteSubject); // Only admins can delete subjects

module.exports = router;
