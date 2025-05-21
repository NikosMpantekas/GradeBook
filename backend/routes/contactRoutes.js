const express = require('express');
const router = express.Router();
const { 
  sendContactMessage,
  getContactMessages,
  updateContactMessage,
  getUserMessages,
  markReplyAsRead
} = require('../controllers/contactController');
const { protect, admin } = require('../middleware/authMiddleware');

// Send message - all authenticated users
router.post('/', protect, sendContactMessage);

// Get user's own messages (including those with admin replies)
router.get('/user', protect, getUserMessages);

// Mark a reply as read by the user
router.put('/user/:id/read', protect, markReplyAsRead);

// Admin-only routes - get all messages
router.get('/', protect, admin, getContactMessages);

// Admin-only routes - update message status and send replies
router.put('/:id', protect, admin, updateContactMessage);

module.exports = router;
