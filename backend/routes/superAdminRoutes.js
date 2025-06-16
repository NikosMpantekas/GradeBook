const express = require('express');
const router = express.Router();
const {
  createSchoolOwner,
  getSchoolOwners,
  getSchoolOwnerById,
  updateSchoolOwnerStatus,
  deleteSchoolOwner,
  createFirstSuperAdmin,
  updateSchoolOwnerPermissions,
} = require('../controllers/superAdminController');
const { protect, superadmin } = require('../middleware/authMiddleware');

// Public route for creating the first superadmin (only works if no superadmin exists)
router.post('/create-first-superadmin', createFirstSuperAdmin);

// Protected routes
router.post('/create-school-owner', protect, superadmin, createSchoolOwner);
router.get('/school-owners', protect, superadmin, getSchoolOwners);
router.get('/school-owners/:id', protect, superadmin, getSchoolOwnerById);
router.put('/school-owners/:id/status', protect, superadmin, updateSchoolOwnerStatus);
router.put('/school-owners/:id/permissions', protect, superadmin, updateSchoolOwnerPermissions);
router.delete('/school-owners/:id', protect, superadmin, deleteSchoolOwner);

module.exports = router;
