const mongoose = require('mongoose');

const subscriptionSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
    },
    expirationTime: {
      type: Number,
      required: false,
    },
    keys: {
      p256dh: {
        type: String,
        required: true,
      },
      auth: {
        type: String,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Creating an index to ensure unique subscriptions per user and endpoint
subscriptionSchema.index({ user: 1, endpoint: 1 }, { unique: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
