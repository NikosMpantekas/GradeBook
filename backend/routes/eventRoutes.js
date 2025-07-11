const express = require('express');
const router = express.Router();
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent
} = require('../controllers/eventController');
const { protect, admin } = require('../middleware/authMiddleware');

// Get all events (available to all authenticated users)
router.get('/', protect, getEvents);

// Get a specific event by ID (available to all authenticated users)
router.get('/:id', protect, getEventById);

// Create a new event (admin only)
router.post('/', protect, admin, createEvent);

// Update an existing event (admin only)
router.put('/:id', protect, admin, updateEvent);

// Delete an event (admin only)
router.delete('/:id', protect, admin, deleteEvent);

module.exports = router;
