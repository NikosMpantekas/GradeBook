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
      required: [true, 'Please add a direction description'],
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Direction', directionSchema);
