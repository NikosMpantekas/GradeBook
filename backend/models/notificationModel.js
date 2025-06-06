const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a notification title'],
    },
    message: {
      type: String,
      required: [true, 'Please add a notification message'],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
    // For filtering notifications - plural fields to support multiple selections
    schools: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
    }],
    directions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Direction',
    }],
    subjects: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
    }],
    // Flag for sending to all users
    sendToAll: {
      type: Boolean,
      default: false
    },
    // Legacy fields for backward compatibility - to be deprecated
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
    },
    direction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Direction',
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
    },
    // For targeting specific roles
    targetRole: {
      type: String,
      enum: ['student', 'teacher', 'admin', 'all'],
      default: 'all',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isImportant: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for improved query performance when filtering by schoolId
notificationSchema.index({ schoolId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
