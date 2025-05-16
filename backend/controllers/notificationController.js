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
  
  console.log(`Getting notifications for user ${user.name} (${user._id}) with role: ${user.role}`);
  console.log('User details:', {
    id: user._id,
    role: user.role,
    school: user.school,
    direction: user.direction,
    subjects: user.subjects ? user.subjects.length : 0
  });
  
  // Build query based on user role and attributes
  let query = {};
  
  if (user.role === 'student') {
    // FIXED PRIVACY ISSUE: Students should only see notifications that are specifically intended for them
    // Conditions that allow a student to see a notification:
    
    // 1. Core conditions - student must meet ONE of these to see a notification:
    //    - They are explicitly in the recipients list, OR
    //    - The notification is marked as sendToAll
    const coreConditions = [
      { recipients: user._id },
      { sendToAll: true }
    ];
    
    // 2. Targeting conditions - if a notification uses targeting (not specific recipients),
    //    then student must meet ALL relevant targeting criteria:
    //    - If targetRole specified, it must include 'student' or 'all'
    //    - If schools specified, student's school must be included
    //    - If directions specified, student's direction must be included
    //    - If subjects specified, at least one of student's subjects must be included
    
    // First prepare a targeting condition for notifications using role/attribute targeting
    const targetingCondition = {
      $and: [ 
        // Only include notifications that have targetRole set to student or all
        { targetRole: { $in: ['student', 'all'] } }
      ]
    };
    
    // If the notification specifies schools, student must belong to one of them
    if (user.school) {
      targetingCondition.$and.push({
        $or: [
          { schools: { $exists: false } },   // No schools specified (targets all schools)
          { schools: { $size: 0 } },         // Empty schools array (targets all schools)
          { schools: user.school }           // Student's school is targeted
        ]
      });
    }
    
    // If the notification specifies directions, student must belong to one of them
    if (user.direction) {
      targetingCondition.$and.push({
        $or: [
          { directions: { $exists: false } }, // No directions specified
          { directions: { $size: 0 } },        // Empty directions array
          { directions: user.direction }       // Student's direction is targeted
        ]
      });
    }
    
    // If the notification specifies subjects, student must be enrolled in at least one
    if (user.subjects && user.subjects.length > 0) {
      targetingCondition.$and.push({
        $or: [
          { subjects: { $exists: false } },   // No subjects specified
          { subjects: { $size: 0 } },          // Empty subjects array
          { subjects: { $in: user.subjects } } // At least one of student's subjects is targeted
        ]
      });
    }
    
    // Add the targeting condition as an alternative to the core conditions
    coreConditions.push(targetingCondition);
    
    // Final query uses the core conditions
    query = { $or: coreConditions };
    
    console.log('Student notification query (privacy fixed):', JSON.stringify(query, null, 2));
  } else if (user.role === 'teacher') {
    // FIXED PRIVACY ISSUE: Teachers should only see notifications that are specifically intended for them
    // Following the same privacy model as students
    
    // 1. Core conditions - teacher must meet ONE of these to see a notification:
    //    - They are explicitly in the recipients list, OR
    //    - The notification is marked as sendToAll
    const coreConditions = [
      { recipients: user._id },
      { sendToAll: true }
    ];
    
    // 2. Targeting conditions - if a notification uses targeting (not specific recipients),
    //    then teacher must meet ALL relevant targeting criteria:
    //    - If targetRole specified, it must include 'teacher' or 'all'
    //    - If schools specified, teacher's school must be included
    //    - If subjects specified, at least one of teacher's subjects must be included
    
    // First prepare a targeting condition for notifications using role/attribute targeting
    const targetingCondition = {
      $and: [ 
        // Only include notifications that have targetRole set to teacher or all
        { targetRole: { $in: ['teacher', 'all'] } }
      ]
    };
    
    // If the notification specifies schools, teacher must belong to one of them
    if (user.school) {
      targetingCondition.$and.push({
        $or: [
          { schools: { $exists: false } },   // No schools specified (targets all schools)
          { schools: { $size: 0 } },         // Empty schools array (targets all schools)
          { schools: user.school }           // Teacher's school is targeted
        ]
      });
    }
    
    // If the notification specifies subjects, teacher must teach at least one
    if (user.subjects && user.subjects.length > 0) {
      targetingCondition.$and.push({
        $or: [
          { subjects: { $exists: false } },   // No subjects specified
          { subjects: { $size: 0 } },          // Empty subjects array
          { subjects: { $in: user.subjects } } // At least one of teacher's subjects is targeted
        ]
      });
    }
    
    // Add the targeting condition as an alternative to the core conditions
    coreConditions.push(targetingCondition);
    
    // Final query uses the core conditions
    query = { $or: coreConditions };
    
    console.log('Teacher notification query (privacy fixed):', JSON.stringify(query, null, 2));
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
