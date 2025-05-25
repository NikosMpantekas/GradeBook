const express = require('express');
const router = express.Router();
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent
} = require('../controllers/eventController');
const { protect, admin, teacher, canSendNotifications } = require('../middleware/authMiddleware');

// Get all events (filtered by user role/permissions)
router.get('/', protect, getEvents);

// Get a specific event by ID
router.get('/:id', protect, getEventById);

// Create a new event (only superadmin, admin, secretary, or teacher)
router.post('/', protect, (req, res, next) => {
  // Allow superadmins, admins, secretaries, and teachers to create events
  if (req.user.role === 'superadmin' || 
      req.user.role === 'admin' || 
      req.user.role === 'teacher' || 
      (req.user.role === 'secretary' && req.user.secretaryPermissions?.canSendNotifications === true)) {
    return next();
  }
  res.status(403);
  throw new Error('Not authorized to create events');
}, createEvent);

// Update an existing event (creator, admin, or superadmin)
router.put('/:id', protect, updateEvent);

// Delete an event (creator, admin, or superadmin)
router.delete('/:id', protect, deleteEvent);

module.exports = router;
