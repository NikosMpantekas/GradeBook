const express = require('express');
const router = express.Router();
const {
  createSchool,
  getSchools,
  getSchoolById,
  updateSchool,
  deleteSchool,
} = require('../controllers/schoolController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getSchools);
router.get('/:id', getSchoolById);

// Admin routes
router.post('/', protect, admin, createSchool);
router.put('/:id', protect, admin, updateSchool);
router.delete('/:id', protect, admin, deleteSchool);

module.exports = router;
