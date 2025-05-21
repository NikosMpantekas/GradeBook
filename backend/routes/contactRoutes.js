const express = require('express');
const router = express.Router();
const { 
  sendContactMessage,
  getContactMessages,
  updateContactMessage 
} = require('../controllers/contactController');
const { protect, admin } = require('../middleware/authMiddleware');

// Send message - all authenticated users
router.post('/', protect, sendContactMessage);

// Admin-only routes - get all messages
router.get('/', protect, admin, getContactMessages);

// Admin-only routes - update message status
router.put('/:id', protect, admin, updateContactMessage);

module.exports = router;
