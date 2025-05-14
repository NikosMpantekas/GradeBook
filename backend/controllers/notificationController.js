const asyncHandler = require('express-async-handler');
const webpush = require('web-push');
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');
const Subscription = require('../models/subscriptionModel');

// @desc    Create a new notification
// @route   POST /api/notifications
// @access  Private/Teacher Admin
const createNotification = asyncHandler(async (req, res) => {
  const { title, message, recipients, school, direction, subject, targetRole, isImportant } = req.body;

  if (!title || !message) {
    res.status(400);
    throw new Error('Please provide title and message');
  }

  // Create notification
  const notification = await Notification.create({
    title,
    message,
    sender: req.user.id,
    recipients,
    school,
    direction,
    subject,
    targetRole: targetRole || 'all',
    isImportant: isImportant || false,
  });

  if (!notification) {
    res.status(400);
    throw new Error('Invalid notification data');
  }

  // Send push notifications to recipients
  if (notification) {
    // Find all users that should receive this notification
    let userQuery = {};
    
    // Filter by specific recipients if provided
    if (recipients && recipients.length > 0) {
      userQuery._id = { $in: recipients };
    } else {
      // Otherwise filter by other criteria
      if (school) {
        userQuery.school = school;
      }
      
      if (direction) {
        userQuery.direction = direction;
      }
      
      if (subject) {
        userQuery.subjects = subject;
      }
      
      if (targetRole && targetRole !== 'all') {
        userQuery.role = targetRole;
      }
    }

    // Apply role-based restrictions for teachers (cannot send to admins)
    if (req.user.role === 'teacher') {
      userQuery.role = { $ne: 'admin' };
    }

    const users = await User.find(userQuery).select('_id');
    const userIds = users.map(user => user._id);

    // Find all subscriptions for these users
    const subscriptions = await Subscription.find({
      user: { $in: userIds }
    });

    // Send push notifications
    const notificationPayload = JSON.stringify({
      title,
      message,
      url: '/notifications',
      senderId: req.user.id,
      timestamp: new Date(),
    });

    // Send push notifications to all subscriptions asynchronously
    const pushPromises = subscriptions.map(subscription => {
      const pushConfig = {
        endpoint: subscription.endpoint,
        keys: {
          auth: subscription.keys.auth,
          p256dh: subscription.keys.p256dh,
        },
      };

      return webpush.sendNotification(pushConfig, notificationPayload)
        .catch(err => console.error('Error sending notification', err));
    });

    // Don't wait for push results for the API response
    Promise.all(pushPromises).catch(err => {
      console.error('Error sending push notifications', err);
    });

    // Update notification with actual recipients
    notification.recipients = userIds;
    await notification.save();

    res.status(201).json(notification);
  }
});

// @desc    Get all notifications (admin only)
// @route   GET /api/notifications
// @access  Private/Admin
const getAllNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({})
    .populate('sender', 'name email role')
    .populate('school', 'name')
    .populate('direction', 'name')
    .populate('subject', 'name')
    .sort({ createdAt: -1 });
  
  res.json(notifications);
});

// @desc    Get notifications for current user
// @route   GET /api/notifications/me
// @access  Private
const getMyNotifications = asyncHandler(async (req, res) => {
  const user = req.user;
  
  // Build query based on user role and attributes
  let query = {};
  
  if (user.role === 'student') {
    // Students see notifications where:
    // 1. They are specifically listed as a recipient, OR
    // 2. Their school is targeted, OR
    // 3. Their direction is targeted, OR
    // 4. One of their subjects is targeted, OR
    // 5. The target role is 'student' or 'all'
    
    query = {
      $or: [
        { recipients: user._id },
        { school: user.school },
        { direction: user.direction },
        { subject: { $in: user.subjects } },
        { targetRole: { $in: ['student', 'all'] } },
      ],
    };
  } else if (user.role === 'teacher') {
    // Teachers see notifications where:
    // 1. They are specifically listed as a recipient, OR
    // 2. The target role is 'teacher' or 'all'
    query = {
      $or: [
        { recipients: user._id },
        { targetRole: { $in: ['teacher', 'all'] } },
      ],
    };
  } else if (user.role === 'admin') {
    // Admins see all notifications
    query = {};
  }

  const notifications = await Notification.find(query)
    .populate('sender', 'name email role')
    .populate('school', 'name')
    .populate('direction', 'name')
    .populate('subject', 'name')
    .sort({ createdAt: -1 });
  
  res.json(notifications);
});

// @desc    Get notifications sent by a user
// @route   GET /api/notifications/sent
// @access  Private/Teacher Admin
const getSentNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ sender: req.user.id })
    .populate('school', 'name')
    .populate('direction', 'name')
    .populate('subject', 'name')
    .sort({ createdAt: -1 });
  
  res.json(notifications);
});

// @desc    Get notification by ID
// @route   GET /api/notifications/:id
// @access  Private
const getNotificationById = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id)
    .populate('sender', 'name email role')
    .populate('recipients', 'name email')
    .populate('school', 'name')
    .populate('direction', 'name')
    .populate('subject', 'name');

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  // Check if user is allowed to view this notification
  const user = req.user;
  
  const isRecipient = notification.recipients.some(
    recipient => recipient._id.toString() === user.id
  );
  
  const isTargetedByRole = notification.targetRole === 'all' || notification.targetRole === user.role;
  const isTargetedBySchool = user.school && notification.school && user.school.toString() === notification.school._id.toString();
  const isTargetedByDirection = user.direction && notification.direction && user.direction.toString() === notification.direction._id.toString();
  const isTargetedBySubject = user.subjects && notification.subject && user.subjects.includes(notification.subject._id);
  
  const isSender = notification.sender._id.toString() === user.id;
  const isAdmin = user.role === 'admin';

  if (!isRecipient && !isTargetedByRole && !isTargetedBySchool && !isTargetedByDirection && !isTargetedBySubject && !isSender && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to view this notification');
  }

  res.json(notification);
});

// @desc    Update notification
// @route   PUT /api/notifications/:id
// @access  Private/Teacher Admin
const updateNotification = asyncHandler(async (req, res) => {
  const { title, message, recipients, school, direction, subject, targetRole, isImportant } = req.body;

  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  // Check if user is allowed to update this notification
  if (notification.sender.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update this notification');
  }

  notification.title = title || notification.title;
  notification.message = message || notification.message;
  
  if (recipients) {
    notification.recipients = recipients;
  }
  
  if (school !== undefined) {
    notification.school = school;
  }
  
  if (direction !== undefined) {
    notification.direction = direction;
  }
  
  if (subject !== undefined) {
    notification.subject = subject;
  }
  
  if (targetRole) {
    notification.targetRole = targetRole;
  }
  
  if (isImportant !== undefined) {
    notification.isImportant = isImportant;
  }

  const updatedNotification = await notification.save();
  res.json(updatedNotification);
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private/Teacher Admin
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  // Check if user is allowed to delete this notification
  if (notification.sender.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this notification');
  }

  await notification.deleteOne();
  res.json({ message: 'Notification removed' });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  notification.isRead = true;
  await notification.save();
  
  res.json({ message: 'Notification marked as read' });
});

module.exports = {
  createNotification,
  getAllNotifications,
  getMyNotifications,
  getSentNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  markNotificationAsRead,
};
