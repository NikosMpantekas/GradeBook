const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  refreshToken,
  getMe,
  updateProfile,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  createAdminAccount,
  createUserByAdmin,
  directDatabaseFix,
  getStudents,
  getStudentsBySubject,
  getUsersByRole,
} = require('../controllers/userController');
const { protect, admin, canManageUsers } = require('../middleware/authMiddleware');

// Public routes
router.post('/', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshToken); // New endpoint for token refresh
router.post('/create-admin', createAdminAccount);
router.get('/direct-db-fix', directDatabaseFix); // EMERGENCY: Critical authentication system repair

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Student-related routes - ORDER IS CRITICAL - specific routes first
router.get('/students/subject/:subjectId', protect, getStudentsBySubject);
router.get('/students', protect, getStudents);

// Role-based user filtering - for notification functionality
router.get('/role/:role', protect, getUsersByRole);

// Admin routes (with secretary support where appropriate)
router.get('/', protect, canManageUsers, getUsers);
router.post('/admin/create', protect, canManageUsers, createUserByAdmin); // Admin/Secretary user creation endpoint
router.get('/:id', protect, canManageUsers, getUserById);
router.put('/:id', protect, canManageUsers, updateUser);
router.delete('/:id', protect, admin, deleteUser); // Only admins can delete users

module.exports = router;
