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

// Protected routes
// CRITICAL FIX: Add /vapid endpoint BEFORE the /:id route to prevent conflicts
router.get('/vapid', protect, getVapidPublicKey);
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

// Update notification route
router.put('/:id', protect, (req, res, next) => {
  // Only the sender can update their own notification
  if (req.user.role === 'teacher' || req.user.role === 'admin' || 
      (req.user.role === 'secretary' && req.user.secretaryPermissions?.canSendNotifications === true)) {
    return next();
  }
  res.status(403);
  throw new Error('Not authorized to update notifications');
}, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const { title, message, isImportant } = req.body;
    
    // Find the notification
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      res.status(404);
      throw new Error('Notification not found');
    }
    
    // Check ownership - only sender or admin can update
    if (notification.sender.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      res.status(403);
      throw new Error('Not authorized to update this notification');
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

// Delete notification route
router.delete('/:id', protect, deleteNotification);

// Push notification subscription endpoints
router.post('/subscription', protect, createPushSubscription);

// Add proper DELETE route for unsubscribing
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

// Admin routes (with secretary support where appropriate)
router.get('/', protect, canSendNotifications, getAllNotifications);

module.exports = router;
