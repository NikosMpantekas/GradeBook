const express = require('express');
const router = express.Router();
const {
  createTenant,
  getTenants,
  getTenantById,
  updateTenant,
  deleteTenant,
  getTenantStats,
  inviteUserToTenant,
  createSuperAdmin,
  getTenantByOwner
} = require('../controllers/tenantController');

const { protect } = require('../middleware/authMiddleware');
const { superadminOnly, schoolOwnerOrHigher } = require('../middleware/tenantMiddleware');

// Special route for initial superadmin creation (no auth)
router.post('/create-superadmin', createSuperAdmin);

// Protected tenant management routes with proper role-based access control

// Superadmin only routes - full tenant management
router.post('/', protect, superadminOnly, createTenant);
router.get('/', protect, superadminOnly, getTenants);
router.delete('/:id', protect, superadminOnly, deleteTenant);

// Special route for school owners to get their tenant information by owner status
router.get('/owner', protect, schoolOwnerOrHigher, getTenantByOwner);

// School owner can view their own tenant or superadmin can view any
router.get('/:id', protect, schoolOwnerOrHigher, getTenantById);

// Get tenant stats
router.get('/:id/stats', protect, schoolOwnerOrHigher, getTenantStats);

// Invite users to tenant
router.post('/:id/invite', protect, schoolOwnerOrHigher, inviteUserToTenant);
// School owner can update certain aspects of their tenant, superadmin all aspects
router.put('/:id', protect, schoolOwnerOrHigher, updateTenant);

module.exports = router;
