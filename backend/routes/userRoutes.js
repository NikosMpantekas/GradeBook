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

// Route to get students - ADMIN ONLY (all students in school)
router.get('/students', protect, admin, async (req, res) => {
  try {
    console.log('[STUDENTS ENDPOINT] GET /api/users/students called by:', req.user?.name, req.user?.role);
    const User = require('../models/userModel');
    
    // Admin can see all students in their school
    const query = { role: 'student', schoolId: req.user.schoolId };
    
    const students = await User.find(query)
      .select('name email _id role')
      .sort({ name: 1 });
    
    console.log(`[STUDENTS ENDPOINT] Found ${students.length} students for school:`, req.user.schoolId);
    res.status(200).json(students);
  } catch (error) {
    console.error('[STUDENTS ENDPOINT] Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
});

// Route to get teacher's students - TEACHER ONLY (students from their classes)
router.get('/teacher-students', protect, async (req, res) => {
  try {
    console.log('[TEACHER-STUDENTS ENDPOINT] GET /api/users/teacher-students called by:', req.user?.name, req.user?.role);
    
    // Only teachers can access this endpoint
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied. Teachers only.' });
    }

    const User = require('../models/userModel');
    const Class = require('../models/classModel');
    
    // Get classes where this teacher teaches
    const teacherClasses = await Class.find({ 
      teachers: req.user._id,
      schoolId: req.user.schoolId 
    }).select('students');
    
    console.log(`[TEACHER-STUDENTS] Found ${teacherClasses.length} classes for teacher:`, req.user.name);
    
    // Get unique student IDs from all teacher's classes
    const studentIds = new Set();
    teacherClasses.forEach(classObj => {
      if (classObj.students && Array.isArray(classObj.students)) {
        classObj.students.forEach(studentId => {
          studentIds.add(studentId.toString());
        });
      }
    });
    
    console.log(`[TEACHER-STUDENTS] Found ${studentIds.size} unique student IDs`);
    
    // If no students found, return empty array
    if (studentIds.size === 0) {
      console.log(`[TEACHER-STUDENTS] No students found for teacher ${req.user.name}`);
      return res.status(200).json([]);
    }
    
    // Get student details for the IDs
    const students = await User.find({ 
      _id: { $in: Array.from(studentIds) },
      role: 'student',
      schoolId: req.user.schoolId 
    })
    .select('name email _id role')
    .sort({ name: 1 });
    
    console.log(`[TEACHER-STUDENTS] Returning ${students.length} students for teacher ${req.user.name}`);
    res.status(200).json(students);
    
  } catch (error) {
    console.error('[TEACHER-STUDENTS ENDPOINT] Error fetching teacher students:', error);
    res.status(500).json({ message: 'Error fetching teacher students', error: error.message });
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
