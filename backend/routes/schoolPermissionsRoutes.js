const express = require('express');
const router = express.Router();

// DISABLED: School permissions system completely removed per user requirements
// All school permission/feature restriction logic has been disabled to allow unrestricted access
// const { 
//   getSchoolPermissions, 
//   updateSchoolPermissions, 
//   checkFeatureEnabled,
//   migrateSchoolPermissions
// } = require('../controllers/schoolPermissionsController');

// const { protect, superadmin } = require('../middleware/authMiddleware');

// DISABLED: All school permissions routes are now disabled
// This removes the superadmin enable/disable features functionality
router.use('*', (req, res) => {
  res.status(200).json({
    message: 'School permissions system has been disabled. All features are now enabled by default.',
    disabled: true,
    timestamp: new Date().toISOString()
  });
});

// DISABLED ROUTES - All functionality removed:
// router.use(protect);
// router.get('/:schoolId', getSchoolPermissions);
// router.put('/:schoolId', superadmin, updateSchoolPermissions);
// router.get('/:schoolId/feature/:featureName', checkFeatureEnabled);
// router.post('/migrate', superadmin, migrateSchoolPermissions);

module.exports = router;
