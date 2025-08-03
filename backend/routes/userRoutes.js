const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getMe,
  updateProfile,
  getUsers,
  getUserById,
  createUserByAdmin,
  updateUser,
  deleteUser,
  changePassword,
  createParentAccount,
  getParentsByStudent,
  getStudentsDataForParent,
  getStudentsByParent,
  unlinkParentFromStudents
} = require('../controllers/userController');
const { protect, admin, canManageUsers } = require('../middleware/authMiddleware');

// Public routes
router.post('/', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logoutUser); 

// Protected routes - accessible to authenticated users
router.get('/me', protect, getMe);
router.get('/profile', protect, getMe); // GET profile uses same logic as /me
router.put('/profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);

// Admin routes for user management
router.get('/', protect, admin, getUsers);
router.post('/admin/create', protect, admin, createUserByAdmin);

// Route to get students - must come before /:id to avoid conflict
router.get('/students', protect, async (req, res) => {
  try {
    const User = require('../models/userModel');
    const students = await User.find({
      role: 'student',
      schoolId: req.user.schoolId
    }).select('name email _id').sort({ name: 1 });
    
    res.status(200).json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students' });
  }
});

router.get('/:id', protect, getUserById);
router.put('/:id', protect, canManageUsers, updateUser);
router.delete('/:id', protect, admin, deleteUser);

// Routes to get users filtered by role - accessible to authenticated users
// router.get('/role/:role', protect, getUsersByRole); // DISABLED - function not implemented

// Route to get all teachers - accessible to authenticated users  
// router.get('/teachers', protect, getTeachers); // DISABLED - function not implemented

// Parent account management routes
router.post('/create-parent', protect, admin, createParentAccount);
router.get('/student/:studentId/parents', protect, admin, getParentsByStudent);
router.get('/parent/students-data', protect, getStudentsDataForParent);
router.get('/parent/:parentId/students', protect, admin, getStudentsByParent);
router.delete('/parent/:parentId/students', protect, admin, unlinkParentFromStudents);

module.exports = router;
