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

  // Apply role-based restrictions for teachers (can only send to students)
  if (req.user.role === 'teacher') {
    userQuery.role = 'student'; // Restrict teachers to only send to students
    console.log('Teacher sending notification - restricted to student recipients only');
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
  
  console.log(`Getting notifications for user ${user.name} (${user._id}) with role: ${user.role}`);
  
  // COMPLETE REWRITE: This is a fundamental fix to the notification privacy issue
  // The previous approach was overly complex and had edge cases where notifications leaked
  // STUDENTS SHOULD ONLY SEE THEIR OWN NOTIFICATIONS, PERIOD.
  
  if (user.role === 'student') {
    // For students, we use a simple, direct, and foolproof approach:
    // A student can ONLY see notifications where either:
    // 1. They are explicitly listed as a recipient (their ID is in the recipients array) OR
    // 2. It's a true global notification (sendToAll: true)
    
    // We're not using any other conditions - this is the most restrictive and secure approach
    const strictPrivacyQuery = {
      $or: [
        // Direct recipient - their ID must be in the recipients array
        { recipients: user._id },
        // Global notifications only - must have sendToAll flag set to true
        { sendToAll: true }
      ]
    };
    
    // Add additional role restriction for extra security
    // A student should only see notifications targeted to students or all users
    strictPrivacyQuery.$and = [
      { targetRole: { $in: ['student', 'all'] } }
    ];
    
    console.log('STRICT PRIVACY: Student notification query:', JSON.stringify(strictPrivacyQuery, null, 2));
    
    const notifications = await Notification.find(strictPrivacyQuery)
      .populate('sender', 'name email role')
      .populate('schools', 'name')
      .populate('directions', 'name')
      .populate('subjects', 'name')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${notifications.length} notifications for student ${user._id}`);
    
    // Double-check that each notification has this student's ID in recipients or sendToAll=true
    const verifiedNotifications = notifications.filter(notification => {
      const isDirectRecipient = notification.recipients.some(r => 
        r.toString() === user._id.toString());
      const isGlobal = notification.sendToAll === true;
      
      if (!isDirectRecipient && !isGlobal) {
        console.error(`PRIVACY ERROR: Notification ${notification._id} leaked to student ${user._id} despite not being a recipient`);
        return false;
      }
      
      return true;
    });
    
    if (verifiedNotifications.length < notifications.length) {
      console.warn(`PRIVACY PROTECTION: Filtered out ${notifications.length - verifiedNotifications.length} notifications that weren't meant for student ${user._id}`);
    }
    
    return res.json(verifiedNotifications);
  } else if (user.role === 'teacher') {
    // Apply the same strict privacy approach for teachers
    // Teachers can only see notifications where either:
    // 1. They are explicitly listed as a recipient (their ID is in the recipients array) OR
    // 2. It's a true global notification (sendToAll: true)
    
    const strictPrivacyQuery = {
      $or: [
        // Direct recipient - their ID must be in the recipients array
        { recipients: user._id },
        // Global notifications only - must have sendToAll flag set to true
        { sendToAll: true }
      ]
    };
    
    // Add additional role restriction for extra security
    // A teacher should only see notifications targeted to teachers or all users
    strictPrivacyQuery.$and = [
      { targetRole: { $in: ['teacher', 'all'] } }
    ];
    
    console.log('STRICT PRIVACY: Teacher notification query:', JSON.stringify(strictPrivacyQuery, null, 2));
    
    const notifications = await Notification.find(strictPrivacyQuery)
      .populate('sender', 'name email role')
      .populate('schools', 'name')
      .populate('directions', 'name')
      .populate('subjects', 'name')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${notifications.length} notifications for teacher ${user._id}`);
    
    // Double-check that each notification has this teacher's ID in recipients or sendToAll=true
    const verifiedNotifications = notifications.filter(notification => {
      const isDirectRecipient = notification.recipients.some(r => 
        r.toString() === user._id.toString());
      const isGlobal = notification.sendToAll === true;
      
      if (!isDirectRecipient && !isGlobal) {
        console.error(`PRIVACY ERROR: Notification ${notification._id} leaked to teacher ${user._id} despite not being a recipient`);
        return false;
      }
      
      return true;
    });
    
    if (verifiedNotifications.length < notifications.length) {
      console.warn(`PRIVACY PROTECTION: Removed ${notifications.length - verifiedNotifications.length} notifications that weren't meant for teacher ${user._id}`);
    }
    
    return res.json(verifiedNotifications);
  } else if (user.role === 'admin') {
    // Enhanced admin view - admins can see all notifications, with special emphasis on teacher notifications
    console.log('Admin fetching all notifications with enhanced visibility');
    
    // Get all notifications, including ones from teachers - no filtering
    // This ensures admins have a complete view of system activity
    const notifications = await Notification.find({})
      .populate('sender', 'name email role')
      .populate('schools', 'name')
      .populate('directions', 'name')
      .populate('subjects', 'name')
      .populate('recipients', 'name email role')
      .sort({ createdAt: -1 });
    
    // Count teacher notifications for logging purposes
    const teacherNotifications = notifications.filter(n => 
      n.sender && n.sender.role === 'teacher'
    );
    
    console.log(`Found ${notifications.length} total notifications (${teacherNotifications.length} from teachers) for admin ${user._id}`);
    return res.json(notifications);
  }

  // If we reach this point, there's an unhandled user role
  console.error(`Unhandled user role: ${user.role} - No notifications will be returned`);
  return res.json([]);
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
