const mongoose = require('mongoose');

const classSchema = mongoose.Schema(
  {
    // Basic class information
    name: {
      type: String,
      required: [true, 'Please add a class name'],
    },
    // School association
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true, // Index for performance
    },
    // Subject information (replaces separate subject model)
    subject: {
      type: String,
      required: [true, 'Please add a subject name'],
    },
    // Direction information (replaces separate direction model)
    direction: {
      type: String,
      required: [true, 'Please add a direction name'],
    },
    // School branch information
    schoolBranch: {
      type: String,
      required: [true, 'Please specify the school branch'],
    },
    // Class description
    description: {
      type: String,
      default: '',
    },
    // Multiple students
    students: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    // Multiple teachers
    teachers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    // Schedule information
    schedule: [{
      day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        required: true
      },
      startTime: {
        type: String, // Format: "HH:MM" (24-hour format)
        required: true
      },
      endTime: {
        type: String, // Format: "HH:MM" (24-hour format)
        required: true
      }
    }],
    // Active status
    active: {
      type: Boolean,
      default: true,
    }
  },
  {
    timestamps: true,
  }
);

// Create compound index for school-specific uniqueness of class names
classSchema.index({ name: 1, schoolId: 1 }, { unique: true });

// Create index for queries by schoolId
classSchema.index({ schoolId: 1 });

// Create indexes for common queries
classSchema.index({ subject: 1, schoolId: 1 });
classSchema.index({ direction: 1, schoolId: 1 });
classSchema.index({ schoolBranch: 1, schoolId: 1 });
classSchema.index({ 'teachers': 1, schoolId: 1 });
classSchema.index({ 'students': 1, schoolId: 1 });

module.exports = mongoose.model('Class', classSchema);
