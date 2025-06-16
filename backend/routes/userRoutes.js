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
  createUserByAdmin,
  getUsersByRole,
  updateUser
} = require('../controllers/userController');
const { protect, admin, adminCanManageUsers } = require('../middleware/authMiddleware');

// Public routes
router.post('/', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshToken); 

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Admin routes - simplified for single-database architecture
router.get('/', protect, adminCanManageUsers, getUsers); // Only admins with user management permission can see all users
router.post('/admin/create', protect, adminCanManageUsers, createUserByAdmin); // Admin route to create users
router.get('/:id', protect, adminCanManageUsers, getUserById); // Get specific user by ID
router.put('/:id', protect, adminCanManageUsers, updateUser); // Update user by ID

// Routes to get users filtered by role - accessible by admin, teachers and secretaries
router.get('/role/:role', protect, getUsersByRole); // Get users by role (student, teacher, etc.)

module.exports = router;
