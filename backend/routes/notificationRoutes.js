const express = require('express');
const router = express.Router();
const {
  createNotification,
  getAllNotifications,
  getMyNotifications,
  getSentNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  markNotificationAsRead,
} = require('../controllers/notificationController');
const { protect, admin, teacher } = require('../middleware/authMiddleware');

// Protected routes
router.get('/me', protect, getMyNotifications);
router.get('/sent', protect, getSentNotifications);
router.get('/:id', protect, getNotificationById);
router.put('/:id/read', protect, markNotificationAsRead);

// Teacher & Admin routes
router.post('/', protect, teacher, createNotification);
router.put('/:id', protect, teacher, updateNotification);
router.delete('/:id', protect, teacher, deleteNotification);

// Admin routes
router.get('/', protect, admin, getAllNotifications);

module.exports = router;
