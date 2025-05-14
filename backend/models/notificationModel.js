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
    recipients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    // For filtering notifications
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

module.exports = mongoose.model('Notification', notificationSchema);
