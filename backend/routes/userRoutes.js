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
  updateUser,
  deleteUser,
  getTeachers,
  changePassword
} = require('../controllers/userController');
const { protect, admin, canManageUsers } = require('../middleware/authMiddleware');

// Public routes
router.post('/', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshToken); 

// Protected routes - accessible to authenticated users
router.get('/me', protect, getMe);
router.get('/profile', protect, getMe); // GET profile uses same logic as /me
router.put('/profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);

// Admin routes for user management
router.get('/', protect, admin, getUsers);
router.post('/admin/create', protect, admin, createUserByAdmin);
router.get('/:id', protect, getUserById);
router.put('/:id', protect, canManageUsers, updateUser);
router.delete('/:id', protect, admin, deleteUser);

// Routes to get users filtered by role - accessible to authenticated users
router.get('/role/:role', protect, getUsersByRole);

// Route to get all teachers - accessible to authenticated users  
router.get('/teachers', protect, getTeachers);

module.exports = router;
