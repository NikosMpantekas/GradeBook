const mongoose = require('mongoose');

const directionSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a direction name'],
      // Remove global uniqueness as directions can have the same name in different schools
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
      // Description is now optional
    }
  },
  {
    timestamps: true,
  }
);

// Create compound index for school-specific uniqueness of direction names
directionSchema.index({ name: 1, schoolId: 1 }, { unique: true });

module.exports = mongoose.model('Direction', directionSchema);
