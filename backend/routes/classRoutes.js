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
  getMyTeachingClasses
} = require('../controllers/classController');
const { protect, admin, teacher } = require('../middleware/authMiddleware');

// Routes for classes
router.route('/')
  .post(protect, admin, createClass)
  .get(protect, getClasses);

router.route('/categories')
  .get(protect, getClassCategories);

// Route for getting classes taught by authenticated teacher
router.route('/my-teaching-classes')
  .get(protect, teacher, getMyTeachingClasses);

router.route('/:id')
  .get(protect, getClassById)
  .put(protect, admin, updateClass)
  .delete(protect, admin, deleteClass);

// Routes for managing students in classes
router.route('/:id/students')
  .put(protect, admin, addStudentsToClass)
  .delete(protect, admin, removeStudentsFromClass);

// Routes for managing teachers in classes
router.route('/:id/teachers')
  .put(protect, admin, addTeachersToClass)
  .delete(protect, admin, removeTeachersFromClass);

module.exports = router;
