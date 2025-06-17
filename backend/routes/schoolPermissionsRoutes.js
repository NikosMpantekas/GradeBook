const express = require('express');
const router = express.Router();
const { 
  getSchoolPermissions, 
  updateSchoolPermissions, 
  checkFeatureEnabled,
  migrateSchoolPermissions
} = require('../controllers/schoolPermissionsController');

const { protect, superadmin } = require('../middleware/authMiddleware');

// All routes protected by authentication
router.use(protect);

// Get permissions for a school - restricted to admin of that school and superadmin
router.get('/:schoolId', getSchoolPermissions);

// Update permissions for a school - restricted to superadmin only
router.put('/:schoolId', superadmin, updateSchoolPermissions);

// Check if a specific feature is enabled for a school
router.get('/:schoolId/feature/:featureName', checkFeatureEnabled);

// Migration route - for superadmin only
router.post('/migrate', superadmin, migrateSchoolPermissions);

module.exports = router;
