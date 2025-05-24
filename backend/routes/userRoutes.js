const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  refreshToken,
  getMe,
  updateProfile,
  getUsers,
  createUserByAdmin,
  getUsersByRole
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.post('/', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshToken); 

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Admin routes - simplified for single-database architecture
router.get('/', protect, admin, getUsers); // Only admins can see all users
router.post('/admin/create', protect, admin, createUserByAdmin); // Admin route to create users

// Routes to get users filtered by role - accessible by admin, teachers and secretaries
router.get('/role/:role', protect, getUsersByRole); // Get users by role (student, teacher, etc.)

module.exports = router;
