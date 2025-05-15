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
  directDatabaseFix,
  getStudents,
  getStudentsBySubject,
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.post('/', registerUser);
router.post('/login', loginUser);
router.post('/create-admin', createAdminAccount);
router.get('/direct-db-fix', directDatabaseFix); // EMERGENCY: Critical authentication system repair

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Student-related routes - ORDER IS CRITICAL - specific routes first
router.get('/students/subject/:subjectId', protect, getStudentsBySubject);
router.get('/students', protect, getStudents);

// Admin routes
router.get('/', protect, admin, getUsers);
router.post('/admin/create', protect, admin, createUserByAdmin); // Admin user creation endpoint
router.get('/:id', protect, admin, getUserById);
router.put('/:id', protect, admin, updateUser);
router.delete('/:id', protect, admin, deleteUser);

module.exports = router;
