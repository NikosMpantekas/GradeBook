const mongoose = require('mongoose');

const tenantSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a tenant name'],
      unique: true,
    },
    databaseName: {
      type: String,
      required: [true, 'Please add a database name'],
      unique: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'pending'],
      default: 'active',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    contactEmail: {
      type: String,
      required: [true, 'Please add a contact email'],
    },
    contactPhone: {
      type: String,
    },
    maxUsers: {
      type: Number,
      default: 100, // Default limit
    },
    settings: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Tenant', tenantSchema);
