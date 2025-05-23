const mongoose = require('mongoose');

const subscriptionSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Added for multi-tenancy - conditionally required based on user role
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: function() {
        // If this is related to a superadmin user, don't require schoolId
        return this.isSuperadmin !== true;
      },
      index: true, // Index for performance
    },
    // Flag to indicate if this subscription belongs to a superadmin
    isSuperadmin: {
      type: Boolean,
      default: false
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

// Creating an index to ensure unique subscriptions per user, endpoint, and schoolId
subscriptionSchema.index({ user: 1, endpoint: 1, schoolId: 1 }, { unique: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
