const asyncHandler = require('express-async-handler');
const webpush = require('web-push');
const mongoose = require('mongoose');
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');
const Subscription = require('../models/subscriptionModel');
// Single database architecture - remove reference to multiDbConnect
// const { connectToSchoolDb } = require('../config/multiDbConnect');
// Single database - schema is defined in model directly
// const { NotificationSchema } = require('../config/schoolModelRegistration');

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
    urgent,
    expiresAt 
  } = req.body;

  if (!title || !message) {
    res.status(400);
    throw new Error('Please provide both title and message');
  }

  if ((!recipients || recipients.length === 0) && 
      (!schools || schools.length === 0) && 
      (!directions || directions.length === 0) && 
      (!subjects || subjects.length === 0) && 
      !targetRole) {
    res.status(400);
    throw new Error('Please specify at least one recipient type');
  }

  try {
    console.log('Creating new notification');
    console.log('Sender:', req.user._id, req.user.name);
    
    // In single database architecture, create notification with schoolId
    const newNotification = await Notification.create({
      title,
      message,
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      recipients: recipients || [],
      schools: schools || [],
      directions: directions || [],
      subjects: subjects || [],
      targetRole: targetRole || null,
      schoolId: req.user.schoolId, // Add schoolId for multi-tenancy
      urgent: urgent || false,
      expiresAt: expiresAt || null
    });

    console.log(`Notification created with ID: ${newNotification._id}`);

    // Find all web push subscriptions for potential recipients
    // In single database architecture, we need to find users with matching schoolId
    let potentialRecipients = [];
    
    // Get direct recipients if specified
    if (recipients && recipients.length > 0) {
      potentialRecipients = recipients;
    } else {
      // Build a query to find matching users based on provided criteria
      const userQuery = { schoolId: req.user.schoolId };
      
      // Add role filtering if specified
      if (targetRole) {
        userQuery.role = targetRole;
      }
      
      // Add other filters
      if (schools && schools.length > 0) {
        // For students with single school
        userQuery.$or = [
          { 'school': { $in: schools } },
          // For teachers with multiple schools
          { 'schools': { $in: schools } }
        ];
      }
      
      if (directions && directions.length > 0) {
        if (!userQuery.$or) userQuery.$or = [];
        // Add direction filters for both single and multiple directions
        userQuery.$or.push(
          { 'direction': { $in: directions } },
          { 'directions': { $in: directions } }
        );
      }
      
      if (subjects && subjects.length > 0) {
        userQuery.subjects = { $in: subjects };
      }
      
      // Find matching users in the main database
      console.log('Finding users with query:', JSON.stringify(userQuery));
      const matchingUsers = await User.find(userQuery).select('_id');
      potentialRecipients = matchingUsers.map(user => user._id);
    }
    
    console.log(`Found ${potentialRecipients.length} potential recipients`);
    
    // Get web push subscriptions for these users
    if (potentialRecipients.length > 0) {
      const subscriptions = await Subscription.find({
        user: { $in: potentialRecipients }
      });
      
      console.log(`Found ${subscriptions.length} push subscriptions`);
      
      // Send push notifications
      const pushPromises = subscriptions.map(async (subscription) => {
        try {
          // Validate subscription has the required keys before trying to send
          if (!subscription.endpoint || !subscription.p256dh || !subscription.auth) {
            console.warn(`Incomplete subscription for user ${subscription.user}. Missing:`, {
              endpoint: !subscription.endpoint,
              p256dh: !subscription.p256dh,
              auth: !subscription.auth
            });
            // Remove invalid subscription
            await Subscription.findByIdAndDelete(subscription._id);
            return null;
          }
          
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          };
          
          const pushPayload = JSON.stringify({
            title: title,
            body: message,
            notificationId: newNotification._id.toString(),
            urgent: urgent || false,
            sender: req.user.name,
            timestamp: new Date().toISOString()
          });
          
          const pushOptions = {
            TTL: 86400 // 24 hours in seconds
          };
          
          return await webpush.sendNotification(
            pushSubscription,
            pushPayload,
            pushOptions
          );
        } catch (error) {
          console.error('Error sending push notification:', error.message);
          // If subscription is invalid, remove it
          if (error.statusCode === 410) {
            console.log(`Removing invalid subscription for user ${subscription.user}`);
            await subscription.remove();
          }
          return null;
        }
      });
      
      await Promise.all(pushPromises);
    }
    
    res.status(201).json(newNotification);
  } catch (error) {
    console.error('Error creating notification:', error.message);
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
      .populate('schools', 'name')
      .populate('directions', 'name')
      .populate('subjects', 'name');
    
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
      .populate('schools', 'name')
      .populate('directions', 'name')
      .populate('subjects', 'name');
    
    console.log(`Found ${notifications.length} notifications for user`);
    
    // Special handling for superadmin users - they see all notifications
    // unless they belong to a specific school
    if (user.role === 'superadmin' && !user.schoolId) {
      console.log('Superadmin user - fetching all notifications');
      
      const allNotifications = await Notification.find({})
        .sort({ createdAt: -1 })
        .populate('sender', 'name')
        .populate('schools', 'name')
        .populate('directions', 'name')
        .populate('subjects', 'name');
      
      console.log(`Found ${allNotifications.length} total notifications for superadmin`);
      return res.status(200).json(allNotifications);
    }
    
    return res.status(200).json(notifications);
  } catch (error) {
    console.error('Unexpected error in getMyNotifications:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Get notifications sent by a user
// @route   GET /api/notifications/sent
// @access  Private/Teacher Admin
const getSentNotifications = asyncHandler(async (req, res) => {
  try {
    console.log(`Getting sent notifications for user ${req.user._id}`);
    
    // In single database architecture, use schoolId filtering
    const query = {
      sender: req.user._id,
      schoolId: req.user.schoolId
    };
    
    // Find sent notifications
    const sentNotifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .populate('recipients', 'name')
      .populate('schools', 'name')
      .populate('directions', 'name')
      .populate('subjects', 'name');
    
    console.log(`Found ${sentNotifications.length} sent notifications`);
    res.status(200).json(sentNotifications);
  } catch (error) {
    console.error('Error fetching sent notifications:', error.message);
    res.status(500);
    throw new Error(`Failed to fetch sent notifications: ${error.message}`);
  }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationRead = asyncHandler(async (req, res) => {
  // Find the notification with schoolId filtering
  const notification = await Notification.findOne({
    _id: req.params.id,
    schoolId: req.user.schoolId
  });
  
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  
  // Check if this user is a recipient
  const isDirectRecipient = notification.recipients.includes(req.user._id);
  const isRoleRecipient = notification.targetRole === req.user.role;
  const isSchoolRecipient = req.user.school && notification.schools.includes(req.user.school._id);
  const isDirectionRecipient = req.user.direction && notification.directions.includes(req.user.direction._id);
  const isSubjectRecipient = req.user.subjects && req.user.subjects.some(subj => 
    notification.subjects.includes(subj._id)
  );
  
  // Only allow marking as read if the user is a recipient or admin/superadmin
  if (!isDirectRecipient && !isRoleRecipient && !isSchoolRecipient && 
      !isDirectionRecipient && !isSubjectRecipient && 
      req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    res.status(403);
    throw new Error('Not authorized to mark this notification as read');
  }
  
  // If readBy doesn't exist, initialize it
  if (!notification.readBy) {
    notification.readBy = [];
  }
  
  // Check if user already marked it as read
  if (!notification.readBy.includes(req.user._id)) {
    notification.readBy.push(req.user._id);
    await notification.save();
  }
  
  res.status(200).json({ success: true });
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
    .populate('schools', 'name')
    .populate('directions', 'name')
    .populate('subjects', 'name');
    
    if (!notification) {
      // Special case for superadmin - can see any notification
      if (req.user.role === 'superadmin') {
        const adminNotification = await Notification.findById(notificationId)
          .populate('sender', 'name')
          .populate('recipients', 'name')
          .populate('schools', 'name')
          .populate('directions', 'name')
          .populate('subjects', 'name');
        
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
