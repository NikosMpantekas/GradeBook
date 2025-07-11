const express = require('express');
const router = express.Router();
const {
  createSchool,
  getSchools,
  getSchoolById,
  updateSchool,
  deleteSchool
} = require('../controllers/schoolController');
const { protect, admin, superadmin, canManageSchools, adminCanManageSchools } = require('../middleware/authMiddleware');

// Protected routes for school branches
router.get('/', protect, getSchools); // Requires authentication to view schools
router.get('/:id', protect, getSchoolById); // Requires authentication to view school details

// Admin routes (with secretary support where appropriate)
router.post('/', protect, adminCanManageSchools, createSchool); // Only admins with school management permission can create schools
router.put('/:id', protect, adminCanManageSchools, updateSchool); // Only admins with school management permission can update schools
router.delete('/:id', protect, adminCanManageSchools, deleteSchool); // Only admins with school management permission can delete schools

// REMOVED: Legacy school permission routes
// - GET /features: Feature toggles are no longer controlled per school
// - GET /:id/permissions: School permission validation has been eliminated
// - PUT /:id/permissions: School permission management has been eliminated
// Features are now controlled by a new superadmin-only toggle system that will be implemented separately.

module.exports = router;
