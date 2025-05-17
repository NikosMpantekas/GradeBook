const express = require('express');
const router = express.Router();
const {
  createSchool,
  getSchools,
  getSchoolById,
  updateSchool,
  deleteSchool,
} = require('../controllers/schoolController');
const { protect } = require('../middleware/authMiddleware');
const { adminOrHigher } = require('../middleware/tenantMiddleware');

// Public routes
router.get('/', getSchools);
router.get('/:id', getSchoolById);

// Admin routes
router.post('/', protect, adminOrHigher, createSchool);
router.put('/:id', protect, adminOrHigher, updateSchool);
router.delete('/:id', protect, adminOrHigher, deleteSchool);

module.exports = router;
