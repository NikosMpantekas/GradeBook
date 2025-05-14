const express = require('express');
const router = express.Router();
const {
  createDirection,
  getDirections,
  getDirectionById,
  updateDirection,
  deleteDirection,
} = require('../controllers/directionController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getDirections);
router.get('/:id', getDirectionById);

// Admin routes
router.post('/', protect, admin, createDirection);
router.put('/:id', protect, admin, updateDirection);
router.delete('/:id', protect, admin, deleteDirection);

module.exports = router;
