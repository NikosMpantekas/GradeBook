const mongoose = require('mongoose');

const subjectSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a subject name'],
      // Remove the global uniqueness constraint as subjects can have the same name in different schools
      // uniqueness will be enforced per school with a compound index
    },
    // Added for multi-tenancy - required field for all documents
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true, // Index for performance
    },
    description: {
      type: String,
      required: false,
    },
    teachers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    directions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Direction',
    }],
  },
  {
    timestamps: true,
  }
);

// Create compound index for school-specific uniqueness of subject names
subjectSchema.index({ name: 1, schoolId: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);
