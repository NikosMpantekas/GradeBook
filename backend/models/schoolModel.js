const mongoose = require('mongoose');

const schoolSchema = mongoose.Schema(
  {
    // School Branch Information (physical location)
    name: {
      type: String,
      required: [true, 'Please add a school branch name'],
      unique: true,
    },
    address: {
      type: String,
      required: [true, 'Please add a school branch address'],
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
    
    // School Cluster/Brand Information
    // The domain identifies which brand/cluster this branch belongs to
    schoolDomain: {
      type: String,
      required: [true, 'Please add a school domain/brand name'],
      default: function() {
        // By default, use the school name if no domain specified
        return this.name ? this.name.toLowerCase().replace(/\s+/g, '') : '';
      }
    },
    
    // Email domain for this school (for user validation)
    emailDomain: {
      type: String,
      default: function() {
        // By default, generate from the school domain
        return this.schoolDomain ? `${this.schoolDomain}.edu` : '';
      }
    },
    
    // Reference to parent cluster/brand (if this is a branch)
    parentCluster: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      default: null
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
    
    // School status (active/disabled)
    active: {
      type: Boolean,
      default: true,
    },
    
    // Flag to identify if this is a cluster school (parent school that branches belong to)
    isClusterSchool: {
      type: Boolean,
      default: false,
    },
    
    // REMOVED: featurePermissions field (legacy school function permission toggle system)
    // Features are now controlled by a new superadmin-only toggle system that will be implemented separately.
    
    // Description of this branch's role in the cluster
    branchDescription: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('School', schoolSchema);
