const express = require('express');
const router = express.Router();
const {
  createNotification,
  getAllNotifications,
  getMyNotifications,
  getSentNotifications,
  markNotificationRead,
  getNotificationById,
  deleteNotification,
} = require('../controllers/notificationController');
const { protect, admin, teacher, canSendNotifications } = require('../middleware/authMiddleware');

// Protected routes
router.get('/me', protect, getMyNotifications);
router.get('/sent', protect, getSentNotifications);
router.get('/:id', protect, getNotificationById);
router.put('/:id/read', protect, markNotificationRead);

// Teacher & Admin routes (with secretary support where appropriate)
router.post('/', protect, (req, res, next) => {
  // Allow teachers, admins, and secretaries with notification permission
  if (req.user.role === 'teacher' || req.user.role === 'admin' || 
      (req.user.role === 'secretary' && req.user.secretaryPermissions?.canSendNotifications === true)) {
    return next();
  }
  res.status(403);
  throw new Error('Not authorized for this action');
}, createNotification);

// Update notification route removed - not supported in current version
// Implementation can be added in future if needed

// Delete notification route
router.delete('/:id', protect, deleteNotification);

// Admin routes (with secretary support where appropriate)
router.get('/', protect, canSendNotifications, getAllNotifications);

module.exports = router;
