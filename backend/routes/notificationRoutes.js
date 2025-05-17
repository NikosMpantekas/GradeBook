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
const { protect } = require('../middleware/authMiddleware');
const { admin, teacher } = require('../middleware/tenantMiddleware');

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
