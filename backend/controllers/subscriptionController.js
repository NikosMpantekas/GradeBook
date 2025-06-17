const asyncHandler = require('express-async-handler');
const Subscription = require('../models/subscriptionModel');
const logger = require('../utils/logger');

// @desc    Register a push notification subscription
// @route   POST /api/subscriptions
// @access  Private
const registerSubscription = asyncHandler(async (req, res) => {
  const { endpoint, expirationTime, keys } = req.body;

  logger.info('SUBSCRIPTION', 'Registration attempt', {
    userId: req.user._id,
    userRole: req.user.role,
    endpoint: endpoint?.substring(0, 30) + '...' // Log partial endpoint for privacy
  });

  if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
    logger.warn('SUBSCRIPTION', 'Invalid subscription data', { userId: req.user._id });
    res.status(400);
    throw new Error('Invalid subscription data');
  }

  // Check if the user is a superadmin - special handling needed
  const isSuperadmin = req.user.role === 'superadmin';
  logger.info('SUBSCRIPTION', `Processing ${isSuperadmin ? 'superadmin' : 'regular user'} subscription`);
  
  // Check if subscription already exists
  let subscription = await Subscription.findOne({
    user: req.user.id,
    endpoint: endpoint
  });

  if (subscription) {
    logger.info('SUBSCRIPTION', 'Updating existing subscription', {
      subscriptionId: subscription._id,
      userId: req.user._id
    });
    
    // Update existing subscription
    subscription.expirationTime = expirationTime;
    subscription.keys.p256dh = keys.p256dh;
    subscription.keys.auth = keys.auth;
    
    // Make sure isSuperadmin flag is set correctly
    subscription.isSuperadmin = isSuperadmin;
    
    // Use updateOne to bypass validation issues
    await Subscription.updateOne(
      { _id: subscription._id },
      {
        expirationTime,
        'keys.p256dh': keys.p256dh,
        'keys.auth': keys.auth,
        isSuperadmin
      }
    );
    
    logger.info('SUBSCRIPTION', 'Subscription updated successfully');
    res.status(200).json({ message: 'Subscription updated' });
  } else {
    logger.info('SUBSCRIPTION', 'Creating new subscription', { userId: req.user._id });
    
    // Prepare subscription data
    const subscriptionData = {
      user: req.user._id, // Use _id instead of id to ensure proper ObjectId reference
      endpoint,
      expirationTime,
      keys: {
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      isSuperadmin // Set flag for superadmin users
    };
    
    // Only set schoolId for non-superadmin users
    if (!isSuperadmin && req.user.schoolId) {
      subscriptionData.schoolId = req.user.schoolId;
    }
    
    try {
      // Create new subscription
      subscription = await Subscription.create(subscriptionData);
      
      logger.info('SUBSCRIPTION', 'New subscription created successfully', {
        subscriptionId: subscription._id,
        userId: req.user._id
      });
      
      res.status(201).json({ message: 'Subscription saved' });
    } catch (error) {
      logger.error('SUBSCRIPTION', 'Failed to create subscription', {
        error: error.message,
        stack: error.stack,
        userData: {
          id: req.user._id,
          role: req.user.role
        }
      });
      res.status(400);
      throw new Error(`Failed to save subscription: ${error.message}`);
    }
  }
});

// @desc    Get all subscriptions for a user
// @route   GET /api/subscriptions
// @access  Private
const getMySubscriptions = asyncHandler(async (req, res) => {
  const subscriptions = await Subscription.find({ user: req.user.id });
  res.json(subscriptions);
});

// @desc    Delete a subscription
// @route   DELETE /api/subscriptions/:id
// @access  Private
const deleteSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findById(req.params.id);

  if (!subscription) {
    res.status(404);
    throw new Error('Subscription not found');
  }

  // Ensure user can only delete their own subscriptions
  if (subscription.user.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }

  await subscription.deleteOne();
  res.json({ message: 'Subscription removed' });
});

// @desc    Delete subscription by endpoint
// @route   DELETE /api/subscriptions/endpoint
// @access  Private
const deleteSubscriptionByEndpoint = asyncHandler(async (req, res) => {
  const { endpoint } = req.body;

  if (!endpoint) {
    res.status(400);
    throw new Error('Endpoint is required');
  }

  const subscription = await Subscription.findOne({
    user: req.user.id,
    endpoint: endpoint
  });

  if (!subscription) {
    res.status(404);
    throw new Error('Subscription not found');
  }

  await subscription.deleteOne();
  res.json({ message: 'Subscription removed' });
});

// @desc    Get VAPID public key
// @route   GET /api/subscriptions/vapidPublicKey
// @access  Public
const getVapidPublicKey = asyncHandler(async (req, res) => {
  if (!process.env.VAPID_PUBLIC_KEY) {
    res.status(500);
    throw new Error('VAPID public key not configured');
  }
  
  res.json({ vapidPublicKey: process.env.VAPID_PUBLIC_KEY });
});

module.exports = {
  registerSubscription,
  getMySubscriptions,
  deleteSubscription,
  deleteSubscriptionByEndpoint,
  getVapidPublicKey,
};
