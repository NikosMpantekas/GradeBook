const asyncHandler = require('express-async-handler');
const webpush = require('web-push');
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');
const Subscription = require('../models/subscriptionModel');

// @desc    Create a new notification
// @route   POST /api/notifications
// @access  Private/Teacher Admin
const createNotification = asyncHandler(async (req, res) => {
  const { 
    title, 
    message, 
    recipients, 
    schools, 
    directions, 
    subjects, 
    targetRole, 
    isImportant,
    sendToAll
  } = req.body;

  if (!title || !message) {
    res.status(400);
    throw new Error('Please provide title and message');
  }

  // Create notification with basic info
  const notification = await Notification.create({
    title,
    message,
    sender: req.user.id,
    isImportant: isImportant || false,
    targetRole: targetRole || 'all',
  });

  if (!notification) {
    res.status(400);
    throw new Error('Invalid notification data');
  }

  console.log(`Creating notification: "${title}" from ${req.user.name} (${req.user.id})`);

  // Find all users that should receive this notification
  let userQuery = {};
  
  // Filter by specific recipients if provided
  if (recipients && recipients.length > 0) {
    console.log(`Filtering by ${recipients.length} specific recipients`);
    userQuery._id = { $in: recipients };
    // Update notification with specific recipients
    notification.recipients = recipients;
  } else if (sendToAll) {
    console.log(`Sending to all users (filtered by role: ${targetRole || 'all'})`);
    // When sending to all, only filter by role if specified
    if (targetRole && targetRole !== 'all') {
      userQuery.role = targetRole;
    }
  } else {
    // Advanced filtering by school, direction, subject
    console.log('Using advanced filtering');
    
    // Track which filters are being applied
    let appliedFilters = [];
    
    // Create arrays to store filter collections
    let schoolIds = [];
    let directionIds = [];
    let subjectIds = [];

    // Apply school filters
    if (schools && schools.length > 0) {
      schoolIds = schools;
      appliedFilters.push(`${schools.length} schools`);
      notification.schools = schools;
    }
    
    // Apply direction filters
    if (directions && directions.length > 0) {
      directionIds = directions;
      appliedFilters.push(`${directions.length} directions`);
      notification.directions = directions;
    }
    
    // Apply subject filters
    if (subjects && subjects.length > 0) {
      subjectIds = subjects;
      appliedFilters.push(`${subjects.length} subjects`);
      notification.subjects = subjects;
    }

    console.log(`Applied filters: ${appliedFilters.join(', ')}`);

    // Build the query with OR conditions for each filter type
    const filterConditions = [];
    
    if (schoolIds.length > 0) {
      filterConditions.push({ school: { $in: schoolIds } });
    }
    
    if (directionIds.length > 0) {
      filterConditions.push({ direction: { $in: directionIds } });
    }
    
    if (subjectIds.length > 0) {
      filterConditions.push({ subjects: { $in: subjectIds } });
    }
    
    // Only add the $or condition if we have filters
    if (filterConditions.length > 0) {
      userQuery.$or = filterConditions;
    }
    
    // Apply role filter if specified
    if (targetRole && targetRole !== 'all') {
      userQuery.role = targetRole;
    }
  }

  // Apply role-based restrictions for teachers (cannot send to admins)
  if (req.user.role === 'teacher') {
    userQuery.role = { $ne: 'admin' };
    console.log('Teacher sending notification - restricted from sending to admins');
  }

  // Find all matching users
  const users = await User.find(userQuery).select('_id name');
  console.log(`Found ${users.length} matching recipients`);
  
  // Get the user IDs
  const userIds = users.map(user => user._id);

  // Only find subscriptions with associated user accounts
  const subscriptions = await Subscription.find({
    user: { $in: userIds }
  });
  
  console.log(`Found ${subscriptions.length} push subscriptions for recipients`);

  // Create push notification payload
  const notificationPayload = JSON.stringify({
    title,
    message,
    url: '/app/notifications',
    senderId: req.user.id,
    senderName: req.user.name,
    timestamp: new Date(),
    isImportant: isImportant || false,
  });

  // Send push notifications to all subscriptions asynchronously
  if (subscriptions.length > 0) {
    const pushPromises = subscriptions.map(subscription => {
      // Verify the subscription has all required fields
      if (!subscription.endpoint || !subscription.keys || !subscription.keys.auth || !subscription.keys.p256dh) {
        console.error('Invalid subscription format:', subscription.endpoint);
        return Promise.resolve(); // Skip this invalid subscription
      }
      
      const pushConfig = {
        endpoint: subscription.endpoint,
        keys: {
          auth: subscription.keys.auth,
          p256dh: subscription.keys.p256dh,
        },
      };

      return webpush.sendNotification(pushConfig, notificationPayload)
        .catch(err => {
          console.error(`Error sending notification to ${subscription.endpoint}:`, err.message);
          // Don't throw to prevent Promise.all from failing
        });
    });

    // Don't wait for push results for the API response
    Promise.all(pushPromises).catch(err => {
      console.error('Error sending push notifications', err.message);
    });
  }

  // Update notification with actual recipients
  notification.recipients = userIds;
  await notification.save();

  res.status(201).json(notification);
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
  
  console.log(`Getting notifications for user ${user.name} (${user._id}), role: ${user.role}`);
  
  // Build query based on user role and attributes
  let query = {};
  
  if (user.role === 'student') {
    // Students see notifications where:
    // 1. They are specifically listed as a recipient, OR
    // 2. Their school is targeted (in the schools array), OR
    // 3. Their direction is targeted (in the directions array), OR
    // 4. One of their subjects is targeted (in the subjects array), OR
    // 5. The target role is 'student' or 'all'
    // 6. The notification is marked as sendToAll
    
    const orConditions = [
      { recipients: user._id },
      { sendToAll: true },
      { targetRole: { $in: ['student', 'all'] } }
    ];
    
    // Only add school condition if user has a school assigned
    if (user.school) {
      orConditions.push({ schools: user.school });
    }
    
    // Only add direction condition if user has a direction assigned
    if (user.direction) {
      orConditions.push({ directions: user.direction });
    }
    
    // Only add subjects condition if user has subjects assigned
    if (user.subjects && user.subjects.length > 0) {
      orConditions.push({ subjects: { $in: user.subjects } });
    }
    
    query = { $or: orConditions };
    
    console.log('Student notification query:', JSON.stringify(query, null, 2));
  } else if (user.role === 'teacher') {
    // Teachers see notifications where:
    // 1. They are specifically listed as a recipient, OR
    // 2. Their school is targeted, OR
    // 3. One of their subjects is targeted, OR
    // 4. The target role is 'teacher' or 'all'
    // 5. The notification is marked as sendToAll
    
    const orConditions = [
      { recipients: user._id },
      { sendToAll: true },
      { targetRole: { $in: ['teacher', 'all'] } }
    ];
    
    // Only add school condition if teacher has a school assigned
    if (user.school) {
      orConditions.push({ schools: user.school });
    }
    
    // Only add subjects condition if teacher has subjects assigned
    if (user.subjects && user.subjects.length > 0) {
      orConditions.push({ subjects: { $in: user.subjects } });
    }
    
    query = { $or: orConditions };
    
    console.log('Teacher notification query:', JSON.stringify(query, null, 2));
  } else if (user.role === 'admin') {
    // Admins see all notifications
    query = {};
    console.log('Admin sees all notifications');
  }

  const notifications = await Notification.find(query)
    .populate('sender', 'name email role')
    .populate('schools', 'name')
    .populate('directions', 'name')
    .populate('subjects', 'name')
    .sort({ createdAt: -1 });
  
  console.log(`Found ${notifications.length} notifications for user ${user._id}`);
  
  res.json(notifications);
});

// @desc    Get notifications sent by a user
// @route   GET /api/notifications/sent
// @access  Private/Teacher Admin
const getSentNotifications = asyncHandler(async (req, res) => {
  console.log(`Getting sent notifications for user ${req.user.name} (${req.user.id})`);
  
  const notifications = await Notification.find({ sender: req.user.id })
    .populate('sender', 'name email role')
    .populate('schools', 'name')
    .populate('directions', 'name')
    .populate('subjects', 'name')
    .populate('recipients', 'name email role')
    .sort({ createdAt: -1 });
  
  console.log(`Found ${notifications.length} notifications sent by user ${req.user.id}`);
  
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
