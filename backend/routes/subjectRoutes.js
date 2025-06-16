const express = require('express');
const router = express.Router();
const {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  deleteSubject,
  getSubjectsByDirection,
  getSubjectsByTeacher
} = require('../controllers/subjectController');
const { protect, admin, teacher, canManageSubjects, adminCanManageSubjects } = require('../middleware/authMiddleware');

// Public routes that don't have parameters
router.get('/', getSubjects);

// CRITICAL: Routes for filtering subjects by direction - restored due to frontend dependency
router.get('/direction/:directionId', getSubjectsByDirection);
router.get('/teacher', protect, teacher, getSubjectsByTeacher);

// Generic parameter route should be LAST to avoid wrongly catching specific routes
router.get('/:id', getSubjectById);

// Admin routes (with secretary support where appropriate)
router.post('/', protect, adminCanManageSubjects, createSubject); // Only admins with subject management permission can create subjects
router.put('/:id', protect, adminCanManageSubjects, updateSubject); // Only admins with subject management permission can update subjects
router.delete('/:id', protect, adminCanManageSubjects, deleteSubject); // Only admins with subject management permission can delete subjects

module.exports = router;
