const mongoose = require('mongoose');

const contactSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: function() {
        // Only required if not a public contact message
        return !this.isPublicContact;
      },
    },
    // Added for multi-tenancy - required field for all documents
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: function() {
        // Only required if not a public contact message
        return !this.isPublicContact;
      },
      index: true, // Index for performance
    },
    subject: {
      type: String,
      required: [true, 'Please add a subject'],
    },
    message: {
      type: String,
      required: [true, 'Please add a message'],
    },
    status: {
      type: String,
      enum: ['new', 'read', 'replied', 'closed'],
      default: 'new',
    },
    read: {
      type: Boolean,
      default: false,
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      required: function() {
        // Only required if not a public contact message
        return !this.isPublicContact;
      },
    },
    // Add fields for admin replies
    adminReply: {
      type: String,
      default: '',
    },
    adminReplyDate: {
      type: Date,
      default: null,
    },
    replyRead: {
      type: Boolean,
      default: false,
    },
    isBugReport: {
      type: Boolean,
      default: false,
    },
    // Add field for public contact messages
    isPublicContact: {
      type: Boolean,
      default: false,
    },
    // Additional security fields for public messages
    clientIP: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    referrer: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for improved query performance when filtering by schoolId
contactSchema.index({ schoolId: 1, createdAt: -1 });

module.exports = mongoose.model('Contact', contactSchema);
