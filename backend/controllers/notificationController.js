const asyncHandler = require('express-async-handler');
const webpush = require('web-push');
const mongoose = require('mongoose');
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
    classes,
    schoolBranches,
    targetRole, 
    urgent,
    expiresAt,
    sendToAll
  } = req.body;

  console.log('NOTIFICATION_CREATE', `Creating notification for user ${req.user._id} (${req.user.role}) in school ${req.user.schoolId}`);
  console.log('NOTIFICATION_CREATE', 'Request payload:', {
    title: title?.substring(0, 50) + '...',
    messageLength: message?.length,
    recipientsCount: recipients?.length || 0,
    classesCount: classes?.length || 0,
    schoolBranchesCount: schoolBranches?.length || 0,
    targetRole,
    sendToAll,
    urgent
  });

  if (!title || !message) {
    console.log('NOTIFICATION_CREATE', 'Validation failed: Missing title or message');
    res.status(400);
    throw new Error('Please provide both title and message');
  }

  if (!sendToAll && (!recipients || recipients.length === 0) && 
      (!classes || classes.length === 0) && 
      (!schoolBranches || schoolBranches.length === 0) && 
      !targetRole) {
    console.log('NOTIFICATION_CREATE', 'Validation failed: No recipients specified');
    res.status(400);
    throw new Error('Please specify at least one recipient, class, school branch, or target role');
  }

  try {
    // Create notification with new class-based structure
    const notificationData = {
      title,
      message,
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      recipients: recipients || [],
      classes: classes || [],
      schoolBranches: schoolBranches || [],
      targetRole: targetRole || 'all',
      schoolId: req.user.schoolId,
      urgent: urgent || false,
      expiresAt: expiresAt || null,
      sendToAll: sendToAll || false,
      status: 'sent'
    };

    console.log('NOTIFICATION_CREATE', 'Creating notification with data:', {
      ...notificationData,
      message: message.substring(0, 100) + '...'
    });

    const newNotification = await Notification.create(notificationData);
    console.log(`NOTIFICATION_CREATE', 'Notification created with ID: ${newNotification._id}`);

    // Find all potential recipients based on the new class-based system
    let potentialRecipients = [];
    
    if (sendToAll) {
      console.log('NOTIFICATION_CREATE', 'Notification set to send to all users in school');
      // Get all users in the school
      const allUsers = await User.find({ 
        schoolId: req.user.schoolId,
        role: { $in: ['student', 'teacher', 'admin'] }
      }).select('_id');
      potentialRecipients = allUsers.map(user => user._id);
    } else {
      // Get direct recipients if specified
      if (recipients && recipients.length > 0) {
        console.log('NOTIFICATION_CREATE', `Adding ${recipients.length} direct recipients`);
        potentialRecipients = [...potentialRecipients, ...recipients];
      }

      // Get recipients based on classes
      if (classes && classes.length > 0) {
        console.log('NOTIFICATION_CREATE', `Finding recipients from ${classes.length} classes`);
        const Class = mongoose.model('Class');
        const classData = await Class.find({ 
          _id: { $in: classes },
          schoolId: req.user.schoolId
        }).populate('students teachers');
        
        classData.forEach(cls => {
          if (cls.students) {
            potentialRecipients = [...potentialRecipients, ...cls.students.map(s => s._id)];
          }
          if (cls.teachers && (targetRole === 'teacher' || targetRole === 'all')) {
            potentialRecipients = [...potentialRecipients, ...cls.teachers.map(t => t._id)];
          }
        });
      }

      // Get recipients based on school branches
      if (schoolBranches && schoolBranches.length > 0) {
        console.log('NOTIFICATION_CREATE', `Finding recipients from ${schoolBranches.length} school branches`);
        const usersInBranches = await User.find({
          schoolId: req.user.schoolId,
          schoolBranch: { $in: schoolBranches },
          ...(targetRole && targetRole !== 'all' ? { role: targetRole } : {})
        }).select('_id');
        
        potentialRecipients = [...potentialRecipients, ...usersInBranches.map(u => u._id)];
      }

      // Get recipients based on role only
      if (targetRole && targetRole !== 'all' && (!classes || classes.length === 0) && (!schoolBranches || schoolBranches.length === 0)) {
        console.log('NOTIFICATION_CREATE', `Finding recipients with role: ${targetRole}`);
        const usersWithRole = await User.find({
          schoolId: req.user.schoolId,
          role: targetRole
        }).select('_id');
        
        potentialRecipients = [...potentialRecipients, ...usersWithRole.map(u => u._id)];
      }
    }

    // Remove duplicates and exclude sender
    const uniqueRecipients = [...new Set(potentialRecipients.map(id => id.toString()))]
      .filter(id => id !== req.user._id.toString())
      .map(id => new mongoose.Types.ObjectId(id));

    console.log('NOTIFICATION_CREATE', `Found ${uniqueRecipients.length} unique recipients`);

    // Update notification with final recipient list
    newNotification.recipients = uniqueRecipients;
    newNotification.deliveryStats.totalRecipients = uniqueRecipients.length;
    await newNotification.save();

    // Find web push subscriptions for recipients
    const subscriptions = await Subscription.find({
      user: { $in: uniqueRecipients }
    });

    console.log('NOTIFICATION_CREATE', `Found ${subscriptions.length} push subscriptions`);

    // Send push notifications (if web push is enabled)
    if (subscriptions.length > 0) {
      const pushPromises = subscriptions.map(subscription => {
        const payload = JSON.stringify({
          title: newNotification.title,
          body: newNotification.message.substring(0, 100),
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          data: {
            notificationId: newNotification._id.toString(),
            url: `/notifications/${newNotification._id}`
          }
        });

        return webpush.sendNotification(subscription, payload)
          .catch(error => {
            console.error('NOTIFICATION_CREATE', `Push notification failed for subscription ${subscription._id}:`, error.message);
          });
      });

      await Promise.allSettled(pushPromises);
      console.log('NOTIFICATION_CREATE', 'Push notifications sent');
    }

    // Populate the response
    const populatedNotification = await Notification.findById(newNotification._id)
      .populate('recipients', 'name email role')
      .populate('classes', 'name schoolBranch direction subject')
      .populate('schoolBranches', 'name location');

    console.log('NOTIFICATION_CREATE', `Notification created successfully with ${uniqueRecipients.length} recipients`);
    res.status(201).json(populatedNotification);

  } catch (error) {
    console.error('NOTIFICATION_CREATE', `Error creating notification: ${error.message}`, {
      userId: req.user._id,
      schoolId: req.user.schoolId,
      stack: error.stack
    });
    res.status(500);
    throw new Error(`Failed to create notification: ${error.message}`);
  }
});

// @desc    Get all notifications (admin/teacher)
// @route   GET /api/notifications
// @access  Private/Admin Teacher
const getAllNotifications = asyncHandler(async (req, res) => {
  try {
    console.log('getAllNotifications endpoint called');
    
    // In single database architecture, filter by schoolId
    const query = { schoolId: req.user.schoolId };
    
    // Apply role-based restrictions
    if (req.user.role === 'teacher') {
      // Teachers can only see notifications they sent or that are targeted to them
      query.$or = [
        { sender: req.user._id }, // Notifications they sent
        { recipients: req.user._id }, // Directly to them
        { targetRole: req.user.role }, // To their role
      ];
      
      // If teacher has schools, add those
      if (req.user.schools && req.user.schools.length > 0) {
        query.$or.push({ schools: { $in: req.user.schools } });
      }
      
      // If teacher has directions, add those
      if (req.user.directions && req.user.directions.length > 0) {
        query.$or.push({ directions: { $in: req.user.directions } });
      }
      
      // If teacher has subjects, add those
      if (req.user.subjects && req.user.subjects.length > 0) {
        query.$or.push({ subjects: { $in: req.user.subjects } });
      }
    }
    
    // Find notifications with appropriate filters
    console.log('Notification query:', JSON.stringify(query));
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .populate('sender', 'name')
      .populate('recipients', 'name')
      .populate('schoolId', 'name')
      .populate('classes', 'name');
    
    console.log(`Found ${notifications.length} notifications`);
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error.message);
    res.status(500);
    throw new Error(`Failed to fetch notifications: ${error.message}`);
  }
});

// @desc    Get notifications for current user
// @route   GET /api/notifications/me
// @access  Private
const getMyNotifications = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    
    console.log(`Getting notifications for user ${user.name} (${user._id}) with role: ${user.role}`);
    
    // In single database architecture, use direct querying with schoolId filter
    console.log(`Fetching notifications for user in school with ID: ${user.schoolId}`);
    
    // Build a query to find relevant notifications
    const query = {
      schoolId: user.schoolId, // Multi-tenancy filter
      $or: [
        { recipients: user._id }, // Directly to this user
        { targetRole: user.role } // To user's role
      ]
    };
    
    // Add school criteria if the user has a school or schools
    if (user.school) {
      query.$or.push({ schools: user.school });
    }
    if (user.schools && user.schools.length > 0) {
      query.$or.push({ schools: { $in: user.schools } });
    }
    
    // Add direction criteria if the user has a direction or directions
    if (user.direction) {
      query.$or.push({ directions: user.direction });
    }
    if (user.directions && user.directions.length > 0) {
      query.$or.push({ directions: { $in: user.directions } });
    }
    
    // Add subject criteria if the user has subjects
    if (user.subjects && user.subjects.length > 0) {
      query.$or.push({ subjects: { $in: user.subjects } });
    }
    
    console.log('Notification query:', JSON.stringify(query));
    
    // Find the notifications with populated references
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .populate('sender', 'name')
      .populate('schoolId', 'name')
      .populate('classes', 'name');
    
    console.log(`Found ${notifications.length} notifications for user`);
    
    // Special handling for superadmin users - they see all notifications
    // unless they belong to a specific school
    if (user.role === 'superadmin' && !user.schoolId) {
      console.log('Superadmin user - fetching all notifications');
      
      const allNotifications = await Notification.find({})
        .sort({ createdAt: -1 })
        .populate('sender', 'name')
        .populate('schoolId', 'name')
        .populate('classes', 'name');
      
      console.log(`Found ${allNotifications.length} total notifications for superadmin`);
      return res.status(200).json(allNotifications);
    }
    
    return res.status(200).json(notifications);
  } catch (error) {
    console.error('Unexpected error in getMyNotifications:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Get sent notifications
// @route   GET /api/notifications/sent
// @access  Private/Teacher Admin
const getSentNotifications = asyncHandler(async (req, res) => {
  try {
    console.log('NOTIFICATION_SENT', `Getting sent notifications for user ${req.user._id} (${req.user.role}) in school ${req.user.schoolId}`);
    
    // In single database architecture, use schoolId filtering
    const query = {
      sender: req.user._id,
      schoolId: req.user.schoolId
    };
    
    console.log('NOTIFICATION_SENT', 'Query:', query);
    
    // Find sent notifications with new class-based populate
    const sentNotifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .populate('recipients', 'name email role')
      .populate('classes', 'name schoolBranch direction subject')
      .populate('schoolBranches', 'name location')
      .populate('sender', 'name role')
      .lean(); // Use lean for better performance
    
    console.log('NOTIFICATION_SENT', `Found ${sentNotifications.length} sent notifications`);
    
    // Add computed fields for frontend compatibility
    const enrichedNotifications = sentNotifications.map(notification => ({
      ...notification,
      isRead: notification.readBy?.length > 0,
      totalRecipients: notification.deliveryStats?.totalRecipients || notification.recipients?.length || 0,
      readCount: notification.deliveryStats?.read || 0
    }));
    
    res.status(200).json(enrichedNotifications);
  } catch (error) {
    console.error('NOTIFICATION_SENT', `Error fetching sent notifications: ${error.message}`, {
      userId: req.user._id,
      schoolId: req.user.schoolId,
      stack: error.stack
    });
    res.status(500);
    throw new Error(`Failed to fetch sent notifications: ${error.message}`);
  }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationRead = asyncHandler(async (req, res) => {
  try {
    console.log('NOTIFICATION_READ', `Marking notification ${req.params.id} as read by user ${req.user._id} (${req.user.role})`);
    
    // Find the notification with schoolId filtering
    const notification = await Notification.findOne({
      _id: req.params.id,
      schoolId: req.user.schoolId
    }).populate('classes', 'students teachers')
      .populate('schoolBranches', 'name');
    
    if (!notification) {
      console.log('NOTIFICATION_READ', `Notification ${req.params.id} not found`);
      res.status(404);
      throw new Error('Notification not found');
    }
    
    console.log('NOTIFICATION_READ', `Found notification: ${notification.title}`);
    
    // Check if this user is a recipient using the new class-based system
    let isAuthorizedRecipient = false;
    
    // Direct recipient check
    const isDirectRecipient = notification.recipients.some(r => r.toString() === req.user._id.toString());
    if (isDirectRecipient) {
      isAuthorizedRecipient = true;
      console.log('NOTIFICATION_READ', 'User is direct recipient');
    }
    
    // Role-based recipient check
    if (!isAuthorizedRecipient && notification.targetRole && 
        (notification.targetRole === req.user.role || notification.targetRole === 'all')) {
      isAuthorizedRecipient = true;
      console.log('NOTIFICATION_READ', `User matches target role: ${notification.targetRole}`);
    }
    
    // Send to all check
    if (!isAuthorizedRecipient && notification.sendToAll) {
      isAuthorizedRecipient = true;
      console.log('NOTIFICATION_READ', 'Notification is sent to all users');
    }
    
    // Class-based recipient check
    if (!isAuthorizedRecipient && notification.classes && notification.classes.length > 0) {
      for (const classObj of notification.classes) {
        const classStudents = classObj.students || [];
        const classTeachers = classObj.teachers || [];
        
        if (classStudents.some(s => s.toString() === req.user._id.toString()) ||
            classTeachers.some(t => t.toString() === req.user._id.toString())) {
          isAuthorizedRecipient = true;
          console.log('NOTIFICATION_READ', `User found in class: ${classObj.name || classObj._id}`);
          break;
        }
      }
    }
    
    // School branch based recipient check
    if (!isAuthorizedRecipient && notification.schoolBranches && notification.schoolBranches.length > 0 && req.user.schoolBranch) {
      const userSchoolBranch = req.user.schoolBranch.toString();
      const hasMatchingBranch = notification.schoolBranches.some(branch => 
        branch._id.toString() === userSchoolBranch
      );
      if (hasMatchingBranch) {
        isAuthorizedRecipient = true;
        console.log('NOTIFICATION_READ', 'User matches school branch criteria');
      }
    }
    
    // Admin/superadmin can always mark as read
    if (!isAuthorizedRecipient && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
      isAuthorizedRecipient = true;
      console.log('NOTIFICATION_READ', 'Admin/superadmin access granted');
    }
    
    if (!isAuthorizedRecipient) {
      console.log('NOTIFICATION_READ', `User ${req.user._id} not authorized to mark notification ${req.params.id} as read`);
      res.status(403);
      throw new Error('Not authorized to mark this notification as read');
    }
    
    // Use the new markAsReadBy method
    const wasAlreadyRead = notification.isReadBy(req.user._id);
    if (!wasAlreadyRead) {
      await notification.markAsReadBy(req.user._id);
      console.log('NOTIFICATION_READ', `Notification ${req.params.id} marked as read by user ${req.user._id}`);
    } else {
      console.log('NOTIFICATION_READ', `Notification ${req.params.id} already marked as read by user ${req.user._id}`);
    }
    
    res.status(200).json({ 
      success: true, 
      message: wasAlreadyRead ? 'Already marked as read' : 'Marked as read'
    });
  } catch (error) {
    console.error('NOTIFICATION_READ', `Error marking notification as read: ${error.message}`, {
      notificationId: req.params.id,
      userId: req.user._id,
      stack: error.stack
    });
    res.status(error.status || 500);
    throw new Error(error.message || 'Failed to mark notification as read');
  }
});

// @desc    Get a specific notification
// @route   GET /api/notifications/:id
// @access  Private
const getNotificationById = asyncHandler(async (req, res) => {
  try {
    const notificationId = req.params.id;
    console.log(`Fetching notification by ID: ${notificationId}`);
    
    // In single database architecture, use schoolId filtering
    const notification = await Notification.findOne({
      _id: notificationId,
      schoolId: req.user.schoolId
    })
    .populate('sender', 'name')
    .populate('recipients', 'name')
    .populate('schoolId', 'name')
    .populate('classes', 'name');
    
    if (!notification) {
      // Special case for superadmin - can see any notification
      if (req.user.role === 'superadmin') {
        const adminNotification = await Notification.findById(notificationId)
          .populate('sender', 'name')
          .populate('recipients', 'name')
          .populate('schoolId', 'name')
          .populate('classes', 'name');
        
        if (adminNotification) {
          return res.status(200).json(adminNotification);
        }
      }
      
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.status(200).json(notification);
  } catch (error) {
    console.error('Error fetching notification by ID:', error.message);
    res.status(500);
    throw new Error(`Failed to fetch notification: ${error.message}`);
  }
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private/Teacher Admin
const deleteNotification = asyncHandler(async (req, res) => {
  console.log(`Attempting to delete notification ${req.params.id}`);

  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      console.log(`Notification not found: ${req.params.id}`);
      res.status(404);
      throw new Error('Notification not found');
    }

    // Verify the notification belongs to the user's school (multi-tenancy security)
    if (notification.schoolId && notification.schoolId.toString() !== req.user.schoolId.toString()) {
      console.log(`School mismatch: notification school ${notification.schoolId}, user school ${req.user.schoolId}`);
      res.status(404); // Use 404 instead of 403 to prevent school ID enumeration
      throw new Error('Notification not found');
    }

    // Check if user is allowed to delete this notification
    const isOwner = notification.sender.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      console.log(`Not authorized: user ${req.user._id} attempted to delete notification ${notification._id} created by ${notification.sender}`);
      res.status(403);
      throw new Error('Not authorized to delete this notification');
    }

    console.log(`Deleting notification ${notification._id}`);
    await Notification.findByIdAndDelete(req.params.id);
    
    console.log(`Notification ${notification._id} successfully deleted`);
    res.status(200).json({ 
      success: true,
      message: 'Notification successfully removed' 
    });
  } catch (error) {
    console.error(`Error deleting notification:`, error);
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw error;
  }
});

// @desc    Get VAPID public key for push notifications
// @route   GET /api/notifications/vapid-public-key
// @access  Private
const getVapidPublicKey = asyncHandler(async (req, res) => {
  // In a production app, these would be stored securely in environment variables
  // For this app, we'll use a default public key that works for development
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 
    'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
  
  console.log('Providing VAPID public key for push notifications');
  
  res.json({ vapidPublicKey });
});

// @desc    Create or update push subscription
// @route   POST /api/notifications/subscription
// @access  Private
const createPushSubscription = asyncHandler(async (req, res) => {
  const { endpoint, keys, expirationTime } = req.body;
  
  if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
    res.status(400);
    throw new Error('Invalid subscription data - missing required fields');
  }
  
  try {
    console.log(`Creating/updating push subscription for user ${req.user._id}`);
    
    // Find existing subscription for this user and endpoint
    let subscription = await Subscription.findOne({
      user: req.user._id,
      endpoint
    });
    
    if (subscription) {
      // Update existing subscription
      subscription.keys.p256dh = keys.p256dh;
      subscription.keys.auth = keys.auth;
      if (expirationTime) {
        subscription.expirationTime = expirationTime;
      }
      await subscription.save();
      console.log(`Updated existing subscription for user ${req.user._id}`);
    } else {
      // Create new subscription
      const subscriptionData = {
        user: req.user._id,
        endpoint,
        keys: {
          p256dh: keys.p256dh,
          auth: keys.auth
        },
        schoolId: req.user.schoolId, // Add schoolId for multi-tenancy
        isSuperadmin: req.user.role === 'superadmin'
      };
      
      if (expirationTime) {
        subscriptionData.expirationTime = expirationTime;
      }
      
      subscription = await Subscription.create(subscriptionData);
      console.log(`Created new subscription for user ${req.user._id}`);
    }
    
    res.status(201).json({
      success: true,
      message: 'Push subscription saved successfully'
    });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    res.status(500);
    throw new Error('Failed to save push subscription: ' + error.message);
  }
});

module.exports = {
  createNotification,
  getAllNotifications,
  getMyNotifications,
  getSentNotifications,
  markNotificationRead,
  getNotificationById,
  deleteNotification,
  getVapidPublicKey,
  createPushSubscription
};
