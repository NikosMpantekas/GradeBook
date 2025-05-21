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
    // Database configuration for this school
    dbConfig: {
      // MongoDB connection string for this school's database
      uri: {
        type: String,
        default: '',
      },
      // Optional: custom database name if not using the full URI
      dbName: {
        type: String,
        default: '',
      },
    },
    // Email domain for this school (for user validation)
    emailDomain: {
      type: String,
      default: '',
    },
    // School status (active/disabled)
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('School', schoolSchema);
