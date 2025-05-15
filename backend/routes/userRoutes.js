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
  deleteUser,
  createAdminAccount,
  createUserByAdmin,
  emergencyFixUsers,
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.post('/', registerUser);
router.post('/login', loginUser);
router.post('/create-admin', createAdminAccount);
router.get('/emergency-fix', emergencyFixUsers); // TEMPORARY: emergency password fix

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Admin routes
router.get('/', protect, admin, getUsers);
router.post('/admin/create', protect, admin, createUserByAdmin); // Admin user creation endpoint
router.get('/:id', protect, admin, getUserById);
router.put('/:id', protect, admin, updateUser);
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;
