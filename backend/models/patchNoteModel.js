const mongoose = require('mongoose');

const patchNoteSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true
    },
    content: {
      type: String,
      required: [true, 'Please add content'],
      trim: true
    },
    version: {
      type: String,
      required: [true, 'Please add a version number'],
      trim: true
    },
    type: {
      type: String,
      enum: ['release', 'bugfix', 'feature', 'improvement', 'critical'],
      default: 'release'
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('PatchNote', patchNoteSchema);
