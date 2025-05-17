const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  getUsers,
  getUserById,
  updateUser,
  updateUserPermissions,
  deleteUser,
  createAdminAccount,
  createUserByAdmin,
  directDatabaseFix,
  getStudents,
  getStudentsBySubject,
  getUsersByRole,
  getUsersByTenant,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { adminOrHigher, superadminOnly, schoolOwnerOrHigher, teacherOrHigher } = require('../middleware/tenantMiddleware');

// Public routes
router.post('/', registerUser);
router.post('/login', loginUser);
router.post('/create-admin', createAdminAccount);
router.get('/direct-db-fix', directDatabaseFix); // EMERGENCY: Critical authentication system repair

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Student-related routes - ORDER IS CRITICAL - specific routes first
// Teacher or higher can access student lists for their authorized subjects
router.get('/students/subject/:subjectId', protect, teacherOrHigher, getStudentsBySubject);
router.get('/students', protect, teacherOrHigher, getStudents);

// Role-based user filtering - for admin functionality including notifications
router.get('/role/:role', protect, adminOrHigher, getUsersByRole);

// Get users for the current tenant - for school owner dashboard
router.get('/tenant', protect, schoolOwnerOrHigher, getUsersByTenant);

// Admin routes with proper role-based access control
// Get all users - admin or higher in their tenant context
router.get('/', protect, adminOrHigher, getUsers);

// Create users - admins can create regular users, school owners can create admins too
router.post('/admin/create', protect, adminOrHigher, createUserByAdmin);

// Get, update and delete users with appropriate access levels
router.route('/:id')
  .get(protect, adminOrHigher, getUserById)
  .put(protect, adminOrHigher, updateUser)
  .delete(protect, schoolOwnerOrHigher, deleteUser);

// Update user permissions - dedicated endpoint for better performance
router.patch('/:id/permissions', protect, adminOrHigher, updateUserPermissions);

module.exports = router;
