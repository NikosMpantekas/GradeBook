const express = require('express');
const router = express.Router();
const { 
  sendContactMessage,
  getContactMessages,
  updateContactMessage,
  getUserMessages,
  markReplyAsRead,
  sendPublicContactMessage
} = require('../controllers/contactController');
const { protect, admin, superadmin, adminOrSecretary } = require('../middleware/authMiddleware');

// Public contact message (no authentication required)
router.post('/public', sendPublicContactMessage);

// Send message - all authenticated users
router.post('/', protect, sendContactMessage);

// Get user's own messages (including those with admin replies)
router.get('/user', protect, getUserMessages);

// Mark a reply as read by the user
router.put('/user/:id/read', protect, markReplyAsRead);

// Create a custom middleware that allows both superadmins and authorized admins/secretaries
const superadminOrAuthorized = (req, res, next) => {
  // Check if user is a superadmin first
  if (req.user && req.user.role === 'superadmin') {
    return next(); // Superadmins always have access
  }
  
  // Otherwise, check if they are admin or secretary with permissions
  if (req.user && (
    req.user.role === 'admin' || 
    (req.user.role === 'secretary' && 
     req.user.secretaryPermissions && 
     req.user.secretaryPermissions.canSendNotifications === true)
  )) {
    return next();
  }
  
  // Not authorized
  res.status(403);
  throw new Error('Not authorized to view contact messages');
};

// Admin and superadmin routes - get all messages
router.get('/', protect, superadminOrAuthorized, getContactMessages);

// Admin and superadmin routes - update message status and send replies
router.put('/:id', protect, superadminOrAuthorized, updateContactMessage);

module.exports = router;
