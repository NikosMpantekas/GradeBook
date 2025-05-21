const mongoose = require('mongoose');

const subjectSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a subject name'],
      unique: true,
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

module.exports = mongoose.model('Subject', subjectSchema);
