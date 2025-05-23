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

// Routes for filtering subjects by teacher or direction have been removed
// in the single-database architecture migration
// These can be reimplemented in the future if needed

// Generic parameter route should be LAST to avoid wrongly catching specific routes
router.get('/:id', getSubjectById);

// Admin routes (with secretary support where appropriate)
router.post('/', protect, canManageSubjects, createSubject);
router.put('/:id', protect, canManageSubjects, updateSubject);
router.delete('/:id', protect, admin, deleteSubject); // Only admins can delete subjects

module.exports = router;
