const express = require('express');
const router = express.Router();
const {
  createSchool,
  getSchools,
  getSchoolById,
  updateSchool,
  deleteSchool,
  getSchoolFeatures,
  getSchoolPermissions,
  updateSchoolPermissions,
} = require('../controllers/schoolController');
const { protect, admin, superadmin, canManageSchools, adminCanManageSchools } = require('../middleware/authMiddleware');

// Protected routes for school branches
router.get('/', protect, getSchools); // Requires authentication to view schools
router.get('/features', protect, getSchoolFeatures); // Get feature toggles for current school
router.get('/:id', protect, getSchoolById); // Requires authentication to view school details

// Admin routes (with secretary support where appropriate)
router.post('/', protect, adminCanManageSchools, createSchool); // Only admins with school management permission can create schools
router.put('/:id', protect, adminCanManageSchools, updateSchool); // Only admins with school management permission can update schools
router.delete('/:id', protect, adminCanManageSchools, deleteSchool); // Only admins with school management permission can delete schools

// School permissions routes
router.get('/:id/permissions', protect, getSchoolPermissions); // Both superadmin and school admin can view permissions
router.put('/:id/permissions', protect, superadmin, updateSchoolPermissions); // Only superadmin can update permissions

module.exports = router;
