const express = require('express');
const router = express.Router();
const {
  createTenant,
  getTenants,
  getTenantById,
  updateTenant,
  deleteTenant,
  createSuperAdmin
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

// School owner can view their own tenant or superadmin can view any
router.get('/:id', protect, schoolOwnerOrHigher, getTenantById);
// School owner can update certain aspects of their tenant, superadmin all aspects
router.put('/:id', protect, schoolOwnerOrHigher, updateTenant);

module.exports = router;
