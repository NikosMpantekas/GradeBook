const express = require('express');
const router = express.Router();
const {
  getSchoolPermissions,
  updateSchoolPermissions,
  getCurrentSchoolPermissions,
  getAllSchoolPermissions,
  fixSchoolPermissions,
  getAvailableFeatures
} = require('../controllers/schoolPermissionsController');

// Import middleware
const { protect, superadmin } = require('../middleware/authMiddleware');

/**
 * New School Permissions Routes
 * Comprehensive routing for the new permission control system
 */

// @desc    Get permissions for the current user's school
// @route   GET /api/school-permissions/current
// @access  Private
router.get('/current', protect, getCurrentSchoolPermissions);

// @desc    Get all available features list
// @route   GET /api/school-permissions/features
// @access  Private/SuperAdmin
router.get('/features', protect, superadmin, getAvailableFeatures);

// @desc    Get all schools with their permissions (for superadmin)
// @route   GET /api/school-permissions/all
// @access  Private/SuperAdmin
router.get('/all', protect, superadmin, getAllSchoolPermissions);

// @desc    Fix school permissions (System Maintenance)
// @route   POST /api/school-permissions/fix
// @access  Private/SuperAdmin
router.post('/fix', protect, superadmin, fixSchoolPermissions);

// @desc    Get school permissions for a specific school
// @route   GET /api/school-permissions/:schoolId
// @access  Private/SuperAdmin
router.get('/:schoolId', protect, superadmin, getSchoolPermissions);

// @desc    Update school permissions for a specific school
// @route   PUT /api/school-permissions/:schoolId
// @access  Private/SuperAdmin
router.put('/:schoolId', protect, superadmin, updateSchoolPermissions);

module.exports = router;
