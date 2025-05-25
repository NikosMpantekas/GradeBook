const asyncHandler = require('express-async-handler');

// @desc    Get VAPID public key
// @route   GET /api/notifications/vapid-public-key
// @access  Private
const getVapidPublicKey = asyncHandler(async (req, res) => {
  try {
    // Return the VAPID public key from environment variable
    // This fixes the "Cast to ObjectId failed" error by separating 
    // this endpoint from the notification controller
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    
    if (!publicKey) {
      res.status(500);
      throw new Error('VAPID public key not configured on server');
    }

    console.log('Returning VAPID public key to client');
    res.status(200).json({ vapidPublicKey: publicKey });
  } catch (error) {
    console.error('Error returning VAPID public key:', error.message);
    res.status(500);
    throw new Error(`Failed to get VAPID public key: ${error.message}`);
  }
});

module.exports = {
  getVapidPublicKey,
};
