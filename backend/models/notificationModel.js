const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a notification title'],
      trim: true,
      maxLength: [200, 'Title cannot exceed 200 characters']
    },
    message: {
      type: String,
      required: [true, 'Please add a notification message'],
      trim: true,
      maxLength: [2000, 'Message cannot exceed 2000 characters']
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true
    },
    senderRole: {
      type: String,
      required: true,
      enum: ['admin', 'teacher', 'secretary'],
    },
    // Added for multi-tenancy - required field for all documents
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true, // Index for performance
    },
    recipients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    // CLASS-BASED FILTERING SYSTEM - New approach using classes
    classes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
    }],
    // School branches for filtering
    schoolBranches: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
    }],
    // For targeting specific roles
    targetRole: {
      type: String,
      enum: ['student', 'teacher', 'admin', 'all'],
      default: 'all',
    },
    // Flag for sending to all users
    sendToAll: {
      type: Boolean,
      default: false
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isImportant: {
      type: Boolean,
      default: false,
    },
    urgent: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: null
    },
    // Notification status tracking
    status: {
      type: String,
      enum: ['draft', 'sent', 'expired', 'deleted'],
      default: 'sent'
    },
    // Read tracking for multiple recipients
    readBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      readAt: {
        type: Date,
        default: Date.now
      }
    }],
    // Delivery tracking
    deliveryStats: {
      totalRecipients: {
        type: Number,
        default: 0
      },
      delivered: {
        type: Number,
        default: 0
      },
      read: {
        type: Number,
        default: 0
      }
    }
  },
  {
    timestamps: true,
  }
);

// Index for improved query performance when filtering by schoolId
notificationSchema.index({ schoolId: 1, createdAt: -1 });
notificationSchema.index({ recipients: 1, createdAt: -1 });
notificationSchema.index({ sender: 1, createdAt: -1 });
notificationSchema.index({ classes: 1 });
notificationSchema.index({ schoolBranches: 1 });

// Virtual for checking if notification is expired
notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Pre-save middleware to ensure data integrity
notificationSchema.pre('save', function(next) {
  // Ensure senderName and senderRole are set if sender is populated
  if (this.isModified('sender') && this.populated('sender')) {
    this.senderName = this.sender.name;
    this.senderRole = this.sender.role;
  }
  
  // Set total recipients count
  if (this.isModified('recipients')) {
    this.deliveryStats.totalRecipients = this.recipients.length;
  }
  
  next();
});

// Method to mark notification as read by a user
notificationSchema.methods.markAsReadBy = function(userId) {
  const alreadyRead = this.readBy.some(r => r.user.toString() === userId.toString());
  if (!alreadyRead) {
    this.readBy.push({ user: userId, readAt: new Date() });
    this.deliveryStats.read = this.readBy.length;
  }
  return this.save();
};

// Method to check if user has read the notification
notificationSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(r => r.user.toString() === userId.toString());
};

module.exports = mongoose.model('Notification', notificationSchema);
