const mongoose = require('mongoose');

const eventSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true
    },
    description: {
      type: String,
      required: false,
      default: '',
      trim: true
    },
    startDate: {
      type: Date,
      required: [true, 'Please specify the event date']
    },
    endDate: {
      type: Date,
      required: false, // Optional for single-day events
      default: function() {
        return this.startDate; // Default to same as start date
      }
    },
    allDay: {
      type: Boolean,
      default: true
    },
    // User who created the event
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // For multi-tenancy - required field to associate events with a school
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: function() {
        // Not required for superadmin users, required for all others
        return this.creatorRole !== 'superadmin';
      },
      index: true
    },
    // Role of the creator for quick reference without population
    creatorRole: {
      type: String,
      enum: ['superadmin', 'admin', 'secretary', 'teacher', 'student'],
      required: true
    },
    // Target audience for the event
    audience: {
      // Who can see this event
      targetType: {
        type: String,
        enum: ['all', 'admins', 'teachers', 'students', 'specific'],
        default: 'specific'
      },
      // Array of specific users (when targetType is 'specific')
      specificUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      // When filtering by school is needed
      schools: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School'
      }],
      // When filtering by direction is needed
      directions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Direction'
      }]
    },
    // UI display options
    color: {
      type: String,
      default: '#1976d2' // Default to primary blue
    },
    // Additional metadata for filtering and organization
    tags: [{
      type: String,
      trim: true
    }],
    // Whether the event is active (can be used for soft deletion)
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Create indexes for faster queries
eventSchema.index({ startDate: 1 });
eventSchema.index({ 'audience.targetType': 1 });
eventSchema.index({ 'audience.specificUsers': 1 });
eventSchema.index({ 'audience.schools': 1 });
eventSchema.index({ 'audience.directions': 1 });
eventSchema.index({ creator: 1 });
eventSchema.index({ schoolId: 1 });

module.exports = mongoose.model('Event', eventSchema);
