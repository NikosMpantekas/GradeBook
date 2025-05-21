const express = require('express');
const router = express.Router();
const {
  createNotification,
  getAllNotifications,
  getMyNotifications,
  getSentNotifications,
  updateNotification,
  deleteNotification,
  markNotificationRead,
  getNotificationById,
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

router.put('/:id', protect, (req, res, next) => {
  // Allow teachers, admins, and secretaries with notification permission
  if (req.user.role === 'teacher' || req.user.role === 'admin' || 
      (req.user.role === 'secretary' && req.user.secretaryPermissions?.canSendNotifications === true)) {
    return next();
  }
  res.status(403);
  throw new Error('Not authorized for this action');
}, updateNotification);

router.delete('/:id', protect, (req, res, next) => {
  // Only admins, teachers who created the notification, or secretaries with permission can delete
  if (req.user.role === 'admin' || req.user.role === 'teacher' || 
      (req.user.role === 'secretary' && req.user.secretaryPermissions?.canSendNotifications === true)) {
    return next();
  }
  res.status(403);
  throw new Error('Not authorized for this action');
}, deleteNotification);

// Admin routes (with secretary support where appropriate)
router.get('/', protect, canSendNotifications, getAllNotifications);

module.exports = router;
