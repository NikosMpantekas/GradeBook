const express = require('express');
const router = express.Router();
const {
  createDirection,
  getDirections,
  getDirectionById,
  updateDirection,
  deleteDirection,
} = require('../controllers/directionController');
const { protect, admin, canManageDirections } = require('../middleware/authMiddleware');

// Protected routes that require authentication
router.get('/', protect, getDirections);
router.get('/:id', protect, getDirectionById);

// Admin routes (with secretary support where appropriate)
router.post('/', protect, canManageDirections, createDirection);
router.put('/:id', protect, canManageDirections, updateDirection);
router.delete('/:id', protect, admin, deleteDirection); // Only admins can delete directions

module.exports = router;
