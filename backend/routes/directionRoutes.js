const express = require('express');
const router = express.Router();
const {
  createDirection,
  getDirections,
  getDirectionById,
  updateDirection,
  deleteDirection,
} = require('../controllers/directionController');
const { protect } = require('../middleware/authMiddleware');
const { adminOrHigher } = require('../middleware/tenantMiddleware');

// Public routes
router.get('/', getDirections);
router.get('/:id', getDirectionById);

// Admin routes
router.post('/', protect, adminOrHigher, createDirection);
router.put('/:id', protect, adminOrHigher, updateDirection);
router.delete('/:id', protect, adminOrHigher, deleteDirection);

module.exports = router;
