const asyncHandler = require('express-async-handler');
const webpush = require('web-push');
const mongoose = require('mongoose');
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');
const Subscription = require('../models/subscriptionModel');
const { connectToSchoolDb } = require('../config/multiDbConnect');
const { NotificationSchema } = require('../config/schoolModelRegistration');

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
    
    // If schools are specified, add them to both the notification and query
    if (schools && schools.length > 0) {
      userQuery.school = { $in: schools };
      notification.schools = schools;
    }
    
    // If directions are specified, add them to both the notification and query
    if (directions && directions.length > 0) {
      userQuery.direction = { $in: directions };
      notification.directions = directions;
    }
    
    // If subjects are specified, add them to both the notification and query
    if (subjects && subjects.length > 0) {
      userQuery.subjects = { $in: subjects };
      notification.subjects = subjects;
    }
    
    // If a specific role is specified, filter users by that role
    if (targetRole && targetRole !== 'all') {
      userQuery.role = targetRole;
    }
  }
  
  // Save the updated notification with all filtering criteria
  await notification.save();
  
  // Find matching subscriptions to send push notifications
  const subscriptions = await Subscription.find({});
  console.log(`Found ${subscriptions.length} push subscriptions`);
  
  if (subscriptions.length > 0) {
    const pushPromises = subscriptions.map(subscription => {
      // Verify the subscription has all required fields
      if (!subscription.endpoint || !subscription.keys || !subscription.keys.auth || !subscription.keys.p256dh) {
        console.error('Invalid subscription format:', subscription.endpoint);
        return Promise.resolve();
      }
      
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      };
      
      const pushPayload = JSON.stringify({
        title: notification.title,
        body: notification.message,
        tag: notification._id.toString(),
        data: {
          url: `/notifications/${notification._id}`
        }
      });
      
      const pushOptions = {
        vapidDetails: {
          subject: 'mailto:support@gradebook.edu',
          publicKey: process.env.VAPID_PUBLIC_KEY,
          privateKey: process.env.VAPID_PRIVATE_KEY
        },
        TTL: 60 * 60 // 1 hour
      };
      
      return webpush.sendNotification(pushSubscription, pushPayload, pushOptions)
        .catch(error => {
          if (error.statusCode === 410) {
            // Subscription has expired or is no longer valid
            console.log('Deleting invalid subscription:', subscription._id);
            return Subscription.findByIdAndDelete(subscription._id);
          } else {
            console.error('Push notification error:', error);
          }
        });
    });
    
    try {
      await Promise.all(pushPromises);
      console.log('Push notifications sent successfully');
    } catch (error) {
      console.error('Error sending push notifications:', error);
    }
  }
  
  res.status(201).json(notification);
});

// @desc    Get all notifications (admin only)
// @route   GET /api/notifications
// @access  Private/Admin
const getAllNotifications = asyncHandler(async (req, res) => {
  try {
    console.log('getAllNotifications endpoint called');
    
    // Check which database to fetch from
    let notifications = [];
    
    if (req.school) {
      console.log(`Fetching notifications for school: ${req.school.name}`);
      
      try {
        // Connect to school database using improved connection system
        const { connection, models } = await connectToSchoolDb(req.school);
        
        if (!connection) {
          throw new Error('Failed to connect to school database');
        }
        
        let NotificationModel;
        
        // Check if we have the models registered properly
        if (models && models.Notification) {
          console.log('Using registered Notification model from school database');
          NotificationModel = models.Notification;
        } else {
          console.log('Creating Notification model in school database');
          // Create the notification model manually if needed
          try {
            // Try to get existing model first
            if (connection.models.Notification) {
              NotificationModel = connection.models.Notification;
              console.log('Found existing Notification model in connection');
            } else {
              // Create new model if it doesn't exist
              NotificationModel = connection.model('Notification', NotificationSchema);
              console.log('✅ Successfully created Notification model in school database');
            }
          } catch (modelError) {
            console.error('Error creating/getting Notification model:', modelError.message);
            throw modelError; // Rethrow to be caught by the outer catch
          }
        }
        
        // Try to fetch notifications with populated fields
        try {
          notifications = await NotificationModel.find()
            .sort({ createdAt: -1 })
            .populate('sender', 'name');
            
          console.log(`Found ${notifications.length} notifications in school database`);
        } catch (queryError) {
          console.error('Error fetching notifications with populate:', queryError.message);
          // Try a simpler query without populate if that fails
          try {
            notifications = await NotificationModel.find().sort({ createdAt: -1 });
            console.log(`Found ${notifications.length} notifications (without populate)`);
          } catch (simpleQueryError) {
            console.error('Simple query also failed:', simpleQueryError.message);
            throw simpleQueryError; // Rethrow to be caught by the outer catch
          }
        }
      } catch (error) {
        console.error('Error with school database operations:', error.message);
        // Fallback to main database
        console.log('Falling back to main database for notifications');
        try {
          notifications = await Notification.find()
            .populate('sender', 'name email role')
            .sort({ createdAt: -1 });
          console.log(`Found ${notifications.length} notifications in main database`);
        } catch (mainDbError) {
          console.error('Error with main database fallback:', mainDbError.message);
          throw mainDbError;
        }
      }
    } else {
      // This is a superadmin or legacy request
      console.log('Fetching notifications from main database');
      notifications = await Notification.find({})
        .populate('sender', 'name email role')
        .populate('school', 'name')
        .populate('direction', 'name')
        .populate('subject', 'name')
        .sort({ createdAt: -1 });
      
      console.log(`Found ${notifications.length} notifications in main database`);
    }
    
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error.message);
    res.status(500);
    throw new Error('Server error: ' + error.message);
  }
});

// @desc    Get notifications for current user
// @route   GET /api/notifications/me
// @access  Private
const getMyNotifications = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    
    console.log(`Getting notifications for user ${user.name} (${user._id}) with role: ${user.role}`);
    
    let notifications = [];
    
    // Check if this is a school-specific user
    if (req.school) {
      console.log(`Fetching notifications for school user in: ${req.school.name}`);
      
      try {
        // Connect to the school-specific database with improved connection handler
        const { connection, models } = await connectToSchoolDb(req.school);
        
        if (!connection) {
          throw new Error('Failed to connect to school database');
        }
        
        let NotificationModel;
        
        // Check if we have the models registered properly
        if (models && models.Notification) {
          console.log('Using registered Notification model for user notifications');
          NotificationModel = models.Notification;
        } else {
          console.log('Creating Notification model in school database');
          try {
            // Try to get existing model first
            if (connection.models.Notification) {
              NotificationModel = connection.models.Notification;
              console.log('Found existing Notification model in connection');
            } else {
              // Create new model if it doesn't exist
              NotificationModel = connection.model('Notification', NotificationSchema);
              console.log('✅ Successfully created Notification model for user notifications');
            }
          } catch (modelError) {
            console.error('Error creating/getting Notification model:', modelError.message);
            throw modelError;
          }
        }
        
        // Based on user role, apply different filters to notifications
        if (user.role === 'student') {
          console.log('Student notifications - using strict privacy rules');
          // Students only see notifications that:
          // 1. Are sent to all users (global notifications)
          // 2. Match their school
          // 3. Match their direction
          // 4. Match their subjects
          // 5. Are specifically addressed to them
          
          const query = {
            $or: [
              // Global notifications for students or all users
              { sendToAll: true, $or: [{ targetRole: 'student' }, { targetRole: 'all' }] },
              // School-specific notifications
              { schools: { $in: [user.school] } },
              // Direction-specific notifications
              { directions: { $in: [user.direction] } },
              // Subject-specific notifications
              { subjects: { $in: user.subjects || [] } },
              // Specifically addressed to this student
              { recipients: { $in: [user._id] } }
            ]
          };
          
          notifications = await NotificationModel.find(query)
            .populate('sender', 'name email role')
            .sort({ createdAt: -1 });
            
          console.log(`Found ${notifications.length} notifications for student`);
        } else if (user.role === 'teacher') {
          console.log('Teacher notifications - using balanced privacy rules');
          // Teachers see:
          // 1. Global notifications
          // 2. Notifications for their schools
          // 3. Notifications for their directions
          // 4. Notifications for their subjects
          // 5. Notifications specifically addressed to them
          
          const query = {
            $or: [
              // Global notifications for teachers or all users
              { sendToAll: true, $or: [{ targetRole: 'teacher' }, { targetRole: 'all' }] },
              // School-specific notifications
              { schools: { $in: user.schools || [] } },
              // Direction-specific notifications 
              { directions: { $in: user.directions || [] } },
              // Subject-specific notifications
              { subjects: { $in: user.subjects || [] } },
              // Specifically addressed to this teacher
              { recipients: { $in: [user._id] } }
            ]
          };
          
          notifications = await NotificationModel.find(query)
            .populate('sender', 'name email role')
            .sort({ createdAt: -1 });
            
          console.log(`Found ${notifications.length} notifications for teacher`);
        } else if (user.role === 'admin') {
          console.log('Admin fetching all notifications with enhanced visibility');
          // Admins see all notifications for their school
          notifications = await NotificationModel.find({})
            .populate('sender', 'name email role')
            .sort({ createdAt: -1 });
            
          console.log(`Found ${notifications.length} notifications for admin`);
        } else if (user.role === 'superadmin') {
          console.log('Superadmin fetching all notifications');
          // Superadmins can see everything
          notifications = await Notification.find({})
            .populate('sender', 'name email role')
            .sort({ createdAt: -1 });
        }
      } catch (error) {
        console.error('Error fetching notifications from school database:', error.message);
        // Fall back to main database in case of any errors
        console.log('Falling back to main database for notifications');
        
        try {
          // Apply the same filters but on the main database
          if (user.role === 'student') {
            const query = {
              $or: [
                { sendToAll: true, $or: [{ targetRole: 'student' }, { targetRole: 'all' }] },
                { schools: { $in: [user.school] } },
                { directions: { $in: [user.direction] } },
                { subjects: { $in: user.subjects || [] } },
                { recipients: { $in: [user._id] } }
              ]
            };
            
            notifications = await Notification.find(query)
              .populate('sender', 'name email role')
              .sort({ createdAt: -1 });
          } else if (user.role === 'teacher') {
            const query = {
              $or: [
                { sendToAll: true, $or: [{ targetRole: 'teacher' }, { targetRole: 'all' }] },
                { schools: { $in: user.schools || [] } },
                { directions: { $in: user.directions || [] } },
                { subjects: { $in: user.subjects || [] } },
                { recipients: { $in: [user._id] } }
              ]
            };
            
            notifications = await Notification.find(query)
              .populate('sender', 'name email role')
              .sort({ createdAt: -1 });
          } else {
            // Admin or superadmin
            notifications = await Notification.find({})
              .populate('sender', 'name email role')
              .sort({ createdAt: -1 });
          }
          
          console.log(`Found ${notifications.length} notifications in main database`);
        } catch (fallbackError) {
          console.error('Error with fallback notification fetching:', fallbackError.message);
          throw fallbackError;
        }
      }
    } else {
      // This is a superadmin or user in the main database
      console.log('User in main database - fetching notifications');
      
      if (user.role === 'superadmin') {
        console.log('Superadmin fetching all notifications');
        // Superadmins can see everything
        notifications = await Notification.find({})
          .populate('sender', 'name email role')
          .sort({ createdAt: -1 });
      } else {
        // Apply standard filters for main database users
        const query = {
          $or: [
            { sendToAll: true },
            { recipients: { $in: [user._id] } }
          ]
        };
        
        if (user.role === 'student' && user.school) {
          query.$or.push({ schools: { $in: [user.school] } });
          query.$or.push({ directions: { $in: [user.direction] } });
          if (user.subjects && user.subjects.length > 0) {
            query.$or.push({ subjects: { $in: user.subjects } });
          }
        } else if ((user.role === 'teacher' || user.role === 'admin') && user.schools) {
          if (user.schools && user.schools.length > 0) {
            query.$or.push({ schools: { $in: user.schools } });
          }
          if (user.directions && user.directions.length > 0) {
            query.$or.push({ directions: { $in: user.directions } });
          }
          if (user.subjects && user.subjects.length > 0) {
            query.$or.push({ subjects: { $in: user.subjects } });
          }
        }
        
        notifications = await Notification.find(query)
          .populate('sender', 'name email role')
          .sort({ createdAt: -1 });
      }
      
      console.log(`Found ${notifications.length} notifications in main database`);
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
    const user = req.user;
    
    console.log(`Getting sent notifications for user ${user.name} (${user._id})`);
    
    let notifications = [];
    
    // Check if this is a school-specific user
    if (req.school) {
      try {
        // Connect to the school-specific database
        const { connection, models } = await connectToSchoolDb(req.school);
        
        if (!connection) {
          throw new Error('Failed to connect to school database');
        }
        
        let NotificationModel;
        
        // Use registered model or create one
        if (models && models.Notification) {
          NotificationModel = models.Notification;
        } else if (connection.models.Notification) {
          NotificationModel = connection.models.Notification;
        } else {
          NotificationModel = connection.model('Notification', NotificationSchema);
        }
        
        // Find notifications sent by this user
        notifications = await NotificationModel.find({ sender: user._id })
          .populate('sender', 'name email role')
          .sort({ createdAt: -1 });
          
        console.log(`Found ${notifications.length} sent notifications in school database`);
      } catch (error) {
        console.error('Error fetching sent notifications from school database:', error.message);
        // Fall back to main database
        notifications = await Notification.find({ sender: user._id })
          .populate('sender', 'name email role')
          .sort({ createdAt: -1 });
      }
    } else {
      // This is a superadmin or user in the main database
      notifications = await Notification.find({ sender: user._id })
        .populate('sender', 'name email role')
        .sort({ createdAt: -1 });
    }
    
    return res.status(200).json(notifications);
  } catch (error) {
    console.error('Error in getSentNotifications:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// @desc    Update notification
// @route   PUT /api/notifications/:id
// @access  Private/Teacher Admin
const updateNotification = asyncHandler(async (req, res) => {
  const { title, message, recipients, school, direction, subject, targetRole, isImportant } = req.body;
  
  // Find the notification
  let notification;
  
  if (req.school) {
    try {
      // Connect to the school-specific database
      const { connection, models } = await connectToSchoolDb(req.school);
      
      if (!connection) {
        throw new Error('Failed to connect to school database');
      }
      
      let NotificationModel;
      
      // Use registered model or create one
      if (models && models.Notification) {
        NotificationModel = models.Notification;
      } else if (connection.models.Notification) {
        NotificationModel = connection.models.Notification;
      } else {
        NotificationModel = connection.model('Notification', NotificationSchema);
      }
      
      notification = await NotificationModel.findById(req.params.id);
    } catch (error) {
      console.error('Error finding notification in school database:', error.message);
      // Fall back to main database
      notification = await Notification.findById(req.params.id);
    }
  } else {
    notification = await Notification.findById(req.params.id);
  }
  
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  
  // Check ownership - only the sender or an admin can update
  if (notification.sender.toString() !== req.user.id && 
      req.user.role !== 'admin' && 
      req.user.role !== 'superadmin') {
    res.status(401);
    throw new Error('Not authorized to update this notification');
  }
  
  // Update the notification
  notification.title = title || notification.title;
  notification.message = message || notification.message;
  notification.recipients = recipients || notification.recipients;
  
  if (school) notification.school = school;
  if (direction) notification.direction = direction;
  if (subject) notification.subject = subject;
  if (targetRole) notification.targetRole = targetRole;
  if (isImportant !== undefined) notification.isImportant = isImportant;
  
  const updatedNotification = await notification.save();
  
  res.status(200).json(updatedNotification);
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationRead = asyncHandler(async (req, res) => {
  // Find the notification
  let notification;
  
  if (req.school) {
    try {
      // Connect to the school-specific database
      const { connection, models } = await connectToSchoolDb(req.school);
      
      if (!connection) {
        throw new Error('Failed to connect to school database');
      }
      
      let NotificationModel;
      
      // Use registered model or create one
      if (models && models.Notification) {
        NotificationModel = models.Notification;
      } else if (connection.models.Notification) {
        NotificationModel = connection.models.Notification;
      } else {
        NotificationModel = connection.model('Notification', NotificationSchema);
      }
      
      notification = await NotificationModel.findById(req.params.id);
    } catch (error) {
      console.error('Error finding notification in school database:', error.message);
      // Fall back to main database
      notification = await Notification.findById(req.params.id);
    }
  } else {
    notification = await Notification.findById(req.params.id);
  }
  
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  
  // Mark as read
  notification.read = true;
  await notification.save();
  
  res.status(200).json({ success: true });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private/Teacher Admin
const deleteNotification = asyncHandler(async (req, res) => {
  // Find the notification
  let notification;
  let deleted = false;
  
  if (req.school) {
    try {
      // Connect to the school-specific database
      const { connection, models } = await connectToSchoolDb(req.school);
      
      if (!connection) {
        throw new Error('Failed to connect to school database');
      }
      
      let NotificationModel;
      
      // Use registered model or create one
      if (models && models.Notification) {
        NotificationModel = models.Notification;
      } else if (connection.models.Notification) {
        NotificationModel = connection.models.Notification;
      } else {
        NotificationModel = connection.model('Notification', NotificationSchema);
      }
      
      notification = await NotificationModel.findById(req.params.id);
      
      if (notification) {
        // Check ownership - only the sender or an admin can delete
        if (notification.sender.toString() !== req.user.id && 
            req.user.role !== 'admin' && 
            req.user.role !== 'superadmin') {
          res.status(401);
          throw new Error('Not authorized to delete this notification');
        }
        
        await NotificationModel.findByIdAndDelete(req.params.id);
        deleted = true;
      }
    } catch (error) {
      console.error('Error finding/deleting notification in school database:', error.message);
      // Fall back to main database only for finding
      notification = await Notification.findById(req.params.id);
    }
  } else {
    notification = await Notification.findById(req.params.id);
  }
  
  // If we didn't already delete and we found the notification
  if (!deleted && notification) {
    // Check ownership - only the sender or an admin can delete
    if (notification.sender.toString() !== req.user.id && 
        req.user.role !== 'admin' && 
        req.user.role !== 'superadmin') {
      res.status(401);
      throw new Error('Not authorized to delete this notification');
    }
    
    await Notification.findByIdAndDelete(req.params.id);
  } else if (!deleted && !notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  
  res.status(200).json({ success: true });
});

// @desc    Save a web push subscription
// @route   POST /api/subscriptions
// @access  Private
const saveSubscription = asyncHandler(async (req, res) => {
  const { endpoint, keys } = req.body;
  
  if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
    res.status(400);
    throw new Error('Invalid subscription data');
  }
  
  // Check if subscription already exists
  const existingSubscription = await Subscription.findOne({ 
    endpoint,
    'keys.p256dh': keys.p256dh,
    'keys.auth': keys.auth
  });
  
  if (existingSubscription) {
    // Update the user ID if it's a different user
    if (existingSubscription.user.toString() !== req.user.id) {
      existingSubscription.user = req.user.id;
      await existingSubscription.save();
    }
    return res.status(200).json(existingSubscription);
  }
  
  // Create new subscription
  const newSubscription = await Subscription.create({
    endpoint,
    keys,
    user: req.user.id
  });
  
  res.status(201).json(newSubscription);
});

module.exports = {
  createNotification,
  getAllNotifications,
  getMyNotifications,
  getSentNotifications,
  updateNotification,
  markNotificationRead,
  deleteNotification,
  saveSubscription
};
