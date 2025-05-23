const mongoose = require('mongoose');

const gradeSchema = mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    value: {
      type: Number,
      required: [true, 'Please add a grade value'],
      min: 0,
      max: 100,
    },
    description: {
      type: String,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    // Added for multi-tenancy - required field for all documents
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true, // Index for performance
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index to ensure unique grades per student, subject, date, and schoolId
gradeSchema.index({ student: 1, subject: 1, date: 1, schoolId: 1 }, { unique: true });

module.exports = mongoose.model('Grade', gradeSchema);
