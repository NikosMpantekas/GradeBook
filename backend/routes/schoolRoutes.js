const express = require('express');
const router = express.Router();
const {
  createSchool,
  getSchools,
  getSchoolById,
  updateSchool,
  deleteSchool,
} = require('../controllers/schoolController');
const { protect, admin, canManageSchools } = require('../middleware/authMiddleware');

// Protected routes for school branches
router.get('/', protect, getSchools); // Requires authentication to view schools
router.get('/:id', protect, getSchoolById); // Requires authentication to view school details

// Admin routes (with secretary support where appropriate)
router.post('/', protect, canManageSchools, createSchool);
router.put('/:id', protect, canManageSchools, updateSchool);
router.delete('/:id', protect, admin, deleteSchool); // Only admins can delete schools

module.exports = router;
