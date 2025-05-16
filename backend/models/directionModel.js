const mongoose = require('mongoose');

const directionSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a direction name'],
      unique: true,
    },
    description: {
      type: String,
      // Description is now optional
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Direction', directionSchema);
