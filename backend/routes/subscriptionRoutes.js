const express = require('express');
const router = express.Router();
const {
  registerSubscription,
  getMySubscriptions,
  deleteSubscription,
  deleteSubscriptionByEndpoint,
  getVapidPublicKey,
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/vapidPublicKey', getVapidPublicKey);

// Protected routes
router.post('/', protect, registerSubscription);
router.get('/', protect, getMySubscriptions);
router.delete('/:id', protect, deleteSubscription);
router.delete('/', protect, deleteSubscriptionByEndpoint);

module.exports = router;
