const asyncHandler = require('express-async-handler');
const Subscription = require('../models/subscriptionModel');

// @desc    Register a push notification subscription
// @route   POST /api/subscriptions
// @access  Private
const registerSubscription = asyncHandler(async (req, res) => {
  const { endpoint, expirationTime, keys } = req.body;

  if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
    res.status(400);
    throw new Error('Invalid subscription data');
  }

  // Check if subscription already exists
  let subscription = await Subscription.findOne({
    user: req.user.id,
    endpoint: endpoint
  });

  if (subscription) {
    // Update existing subscription
    subscription.expirationTime = expirationTime;
    subscription.keys.p256dh = keys.p256dh;
    subscription.keys.auth = keys.auth;

    await subscription.save();
    res.status(200).json({ message: 'Subscription updated' });
  } else {
    // Create new subscription
    subscription = await Subscription.create({
      user: req.user.id,
      endpoint,
      expirationTime,
      keys: {
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    if (subscription) {
      res.status(201).json({ message: 'Subscription saved' });
    } else {
      res.status(400);
      throw new Error('Invalid subscription data');
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
