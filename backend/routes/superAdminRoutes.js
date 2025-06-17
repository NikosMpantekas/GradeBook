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
  updateSchoolFeaturePermissions
} = require('../controllers/superAdminController');
const { protect, superadmin } = require('../middleware/authMiddleware');
const { migrateSchoolFeatures } = require('../utils/migrationUtils');
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

// School feature routes
router.put('/schools/:id/features', updateSchoolFeaturePermissions);

// Migration routes for updating school features
router.post('/migrate/school-features', asyncHandler(async (req, res) => {
  console.log('Running school features migration');
  const result = await migrateSchoolFeatures();
  res.status(200).json({
    message: 'School features migration completed',
    result
  });
}));

// Get all school features in the system
router.get('/schools/features', asyncHandler(async (req, res) => {
  const schools = await require('../models/schoolModel').find()
    .select('name featurePermissions _id');
  
  const schoolFeatures = schools.map(school => ({
    _id: school._id,
    name: school.name,
    featurePermissions: school.featurePermissions || {
      enableNotifications: true,
      enableGrades: true,
      enableRatingSystem: true,
      enableCalendar: true,
      enableStudentProgress: true
    }
  }));
  
  res.status(200).json({
    count: schoolFeatures.length,
    schools: schoolFeatures
  });
}));

module.exports = router;
