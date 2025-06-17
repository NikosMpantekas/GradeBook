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

  try {
    // Prepare subscription data
    const subscriptionData = {
      expirationTime,
      keys: {
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      isSuperadmin, // Set flag for superadmin users
      lastUpdated: new Date()
    };
    
    // Only set schoolId for non-superadmin users
    if (!isSuperadmin && req.user.schoolId) {
      subscriptionData.schoolId = req.user.schoolId;
    }
    
    // Use updateOne with upsert: true to create or update subscription
    // This avoids duplicate key errors by using MongoDB's atomic operations
    const result = await Subscription.updateOne(
      { user: req.user._id, endpoint }, // Query conditions
      { $set: subscriptionData }, // Update data
      { upsert: true } // Create if not exists
    );
    
    if (result.upsertedCount > 0) {
      logger.info('SUBSCRIPTION', 'New subscription created successfully', {
        userId: req.user._id,
        matchedCount: result.matchedCount,
        upsertedCount: result.upsertedCount
      });
      res.status(201).json({ message: 'Subscription created' });
    } else if (result.modifiedCount > 0) {
      logger.info('SUBSCRIPTION', 'Subscription updated successfully', {
        userId: req.user._id,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      });
      res.status(200).json({ message: 'Subscription updated' });
    } else {
      logger.info('SUBSCRIPTION', 'Subscription unchanged', {
        userId: req.user._id,
        matchedCount: result.matchedCount
      });
      res.status(200).json({ message: 'Subscription unchanged' });
    }
  } catch (error) {
    logger.error('SUBSCRIPTION', 'Failed to save subscription', {
      error: error.message,
      stack: error.stack,
      userData: {
        id: req.user._id,
        role: req.user.role
      }
    });
    
    // Handle the error more gracefully
    if (error.code === 11000) {
      // This is a duplicate key error - we can safely ignore it
      logger.warn('SUBSCRIPTION', 'Duplicate subscription detected - this is usually harmless', {
        userId: req.user._id
      });
      res.status(200).json({ message: 'Subscription already exists' });
    } else {
      // For other errors, return 400 status
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
