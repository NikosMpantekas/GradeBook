const mongoose = require('mongoose');

const schoolSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a school name'],
      unique: true,
    },
    address: {
      type: String,
      required: [true, 'Please add a school address'],
    },
    phone: {
      type: String,
    },
    email: {
      type: String,
    },
    website: {
      type: String,
    },
    logo: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('School', schoolSchema);
