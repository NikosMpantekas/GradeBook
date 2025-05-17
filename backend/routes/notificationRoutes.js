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
const { adminOrHigher, teacherOrHigher } = require('../middleware/tenantMiddleware');

// Protected routes
router.get('/me', protect, getMyNotifications);
router.get('/sent', protect, getSentNotifications);
router.get('/:id', protect, getNotificationById);
router.put('/:id/read', protect, markNotificationAsRead);

// Teacher & Admin routes
router.post('/', protect, teacherOrHigher, createNotification);
router.put('/:id', protect, teacherOrHigher, updateNotification);
router.delete('/:id', protect, teacherOrHigher, deleteNotification);

// Admin routes
router.get('/', protect, adminOrHigher, getAllNotifications);

module.exports = router;
