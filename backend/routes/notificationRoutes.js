const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Notification = require('../models/notificationModel');
const {
  createNotification,
  getAllNotifications,
  getMyNotifications,
  getSentNotifications,
  markNotificationRead,
  getNotificationById,
  deleteNotification,
  createPushSubscription
} = require('../controllers/notificationController');

// Import the separate VAPID controller
const {
  getVapidPublicKey
} = require('../controllers/vapidController');
const { protect, admin, teacher, canSendNotifications } = require('../middleware/authMiddleware');

// Protected routes - all authenticated users can access their own notifications
// VAPID endpoint before /:id route to prevent conflicts
router.get('/vapid', protect, getVapidPublicKey);
router.get('/me', protect, getMyNotifications);
router.get('/sent', protect, canSendNotifications, getSentNotifications);
router.get('/:id', protect, getNotificationById);
router.put('/:id/read', protect, markNotificationRead);

// Create notification - teachers and admins only
router.post('/', protect, canSendNotifications, createNotification);

// Update notification route - teachers and admins only
router.put('/:id', protect, canSendNotifications, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const { title, message, isImportant } = req.body;
    
    // Find the notification
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      res.status(404);
      throw new Error('Notification not found');
    }
    
    // Update the notification
    notification.title = title || notification.title;
    notification.message = message || notification.message;
    notification.isImportant = isImportant !== undefined ? isImportant : notification.isImportant;
    
    const updatedNotification = await notification.save();
    
    res.status(200).json(updatedNotification);
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Error updating notification');
  }
});

// Delete notification route - teachers and admins only
router.delete('/:id', protect, canSendNotifications, deleteNotification);

// Push notification subscription endpoints - all authenticated users
router.post('/subscription', protect, createPushSubscription);

// Add proper DELETE route for unsubscribing - all authenticated users
router.delete('/subscription', protect, async (req, res) => {
  try {
    console.log(`Deleting push subscription for user ${req.user._id}`);
    
    // Find and remove subscriptions for this user
    const Subscription = mongoose.model('Subscription');
    const result = await Subscription.deleteMany({ user: req.user._id });
    
    console.log(`Deleted ${result.deletedCount} subscriptions for user ${req.user._id}`);
    
    res.status(200).json({
      success: true,
      message: `Successfully unsubscribed from push notifications`
    });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    res.status(500);
    throw new Error('Failed to remove push subscription: ' + error.message);
  }
});

// Get all notifications - all authenticated users can view
router.get('/', protect, getAllNotifications);

module.exports = router;
