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
  sendSuperAdminNotification,
  getSchoolsForNotifications,
  searchUsersForNotifications
} = require('../controllers/superAdminController');
const { protect, superadmin } = require('../middleware/authMiddleware');
const asyncHandler = require('express-async-handler');

// Public route for creating the first superadmin (only works if no superadmin exists)
router.post('/create-first-superadmin', createFirstSuperAdmin);

// Protected routes
router.use(protect);
router.use(superadmin);

router.post('/create-school-owner', createSchoolOwner);
router.get('/school-owners', getSchoolOwners);
router.get('/school-owners/:id', getSchoolOwnerById);
router.put('/school-owners/:id/status', updateSchoolOwnerStatus);
router.put('/school-owners/:id/permissions', updateSchoolOwnerPermissions);
router.delete('/school-owners/:id', deleteSchoolOwner);

// Superadmin notification routes
router.post('/notifications', sendSuperAdminNotification);
router.get('/schools', getSchoolsForNotifications);
router.get('/users/search', searchUsersForNotifications);

// REMOVED: Legacy school function permission toggle routes
// - PUT /schools/:id/features: updateSchoolFeaturePermissions endpoint
// - POST /migrate/school-features: Legacy migration for school.featurePermissions
// - GET /schools/features: Endpoint that returned school.featurePermissions
// The broken school function permission toggle system has been completely removed.
// Features will be controlled by a new superadmin-only toggle system to be implemented separately.

module.exports = router;
