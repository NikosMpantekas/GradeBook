const express = require('express');
const router = express.Router();
const { 
  createClass, 
  getClasses, 
  getClassById, 
  updateClass, 
  deleteClass,
  getClassCategories,
  addStudentsToClass,
  removeStudentsFromClass,
  addTeachersToClass,
  removeTeachersFromClass,
  getMyTeachingClasses,
  getMyClasses
} = require('../controllers/classController');
const { protect, admin } = require('../middleware/authMiddleware');

// Routes for classes - viewing is accessible to all, management restricted to admin
router.route('/')
  .post(protect, admin, createClass)
  .get(protect, getClasses);

router.route('/categories')
  .get(protect, getClassCategories);

// Route for getting classes taught by authenticated teacher
router.route('/my-teaching-classes')
  .get(protect, getMyTeachingClasses);

// Route for getting classes where authenticated student is enrolled
router.route('/my-classes')
  .get(protect, getMyClasses);

router.route('/:id')
  .get(protect, getClassById)
  .put(protect, admin, updateClass)
  .delete(protect, admin, deleteClass);

// Routes for managing students in classes - admin only
router.route('/:id/students')
  .put(protect, admin, addStudentsToClass)
  .delete(protect, admin, removeStudentsFromClass);

// Routes for managing teachers in classes - admin only
router.route('/:id/teachers')
  .put(protect, admin, addTeachersToClass)
  .delete(protect, admin, removeTeachersFromClass);

module.exports = router;
