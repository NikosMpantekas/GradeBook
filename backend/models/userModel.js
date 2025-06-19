const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      // Remove global uniqueness as users can have the same email in different schools
      // uniqueness will be enforced per school with a compound index
    },
    // Added for multi-tenancy - required field for regular users but not for superadmins
    // This is the primary school association for the user in the single-database model
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: function() {
        // Not required for superadmin users, required for all others
        return this.role !== 'superadmin';
      },
      index: true, // Index for performance
    },
    // Mobile phone for contact purposes
    mobilePhone: {
      type: String,
      required: false,
      default: '',
      trim: true,
      validate: {
        validator: function(v) {
          // Basic phone number validation (optional)
          if (!v) return true;
          return /^[\d\s\-+()]+$/.test(v);
        },
        message: props => `${props.value} is not a valid phone number!`
      }
    },
    // Personal email (different from login email)
    personalEmail: {
      type: String,
      required: false,
      default: '',
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v) {
          // Basic email validation (optional)
          if (!v) return true;
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: props => `${props.value} is not a valid email address!`
      }
    },
    // Saved contact info for backup/reference
    savedMobilePhone: {
      type: String,
      required: false,
      default: null
    },
    savedPersonalEmail: {
      type: String,
      required: false,
      default: null
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
    },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'secretary', 'teacher', 'student'],
      default: 'student',
    },
    // Account status (can be disabled by superadmin)
    active: {
      type: Boolean,
      default: true,
    },
    // Store school domain for email validation
    schoolDomain: {
      type: String,
      default: '',
    },
    
    // Secretary permission flags
    secretaryPermissions: {
      canManageGrades: {
        type: Boolean,
        default: false,
      },
      canSendNotifications: {
        type: Boolean,
        default: false,
      },
      canManageUsers: {
        type: Boolean,
        default: false,
      },
      canManageSchools: {
        type: Boolean,
        default: false,
      },
      canManageDirections: {
        type: Boolean,
        default: false,
      },
      canManageSubjects: {
        type: Boolean,
        default: false,
      },
      canAccessStudentProgress: {
        type: Boolean,
        default: false,
      },
    },

    // School Owner (admin) permission flags - controlled by superadmin
    adminPermissions: {
      canManageGrades: {
        type: Boolean,
        default: true,
      },
      canSendNotifications: {
        type: Boolean,
        default: true,
      },
      canManageUsers: {
        type: Boolean,
        default: true,
      },
      canManageSchools: {
        type: Boolean,
        default: true,
      },
      canManageDirections: {
        type: Boolean,
        default: true,
      },
      canManageSubjects: {
        type: Boolean,
        default: true,
      },
      canAccessReports: {
        type: Boolean,
        default: true,
      },
      canManageEvents: {
        type: Boolean,
        default: true,
      },
    },

    // For students: single school reference
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
    },

    // For students: single class reference (replacing old direction reference)
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
    },
    
    // Legacy: kept for backward compatibility during migration
    direction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class', // Updated to use Class model instead of Direction
    },

    // For teachers: multiple schools
    schools: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
      },
    ],

    // For teachers: multiple classes (replacing old directions)
    classes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
      },
    ],
    
    // Legacy: kept for backward compatibility during migration
    directions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class', // Updated to use Class model instead of Direction
      },
    ],
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
    
    // Teacher permission flags
    canSendNotifications: {
      type: Boolean,
      default: true, // Default to true for backward compatibility
    },
    canAddGradeDescriptions: {
      type: Boolean,
      default: true, // Default to true for backward compatibility
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for school-specific uniqueness of email addresses
// This ensures emails are unique within a school but can be reused across different schools
userSchema.index({ email: 1, schoolId: 1 }, { unique: true });

// Index for faster queries by schoolId and role (common query pattern)
userSchema.index({ schoolId: 1, role: 1 });

// Method to compare entered password with hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Middleware to hash password before saving user
userSchema.pre('save', async function (next) {
  // CRITICAL FIX: Check if the password is already hashed properly
  // This prevents double-hashing and ensures compatibility with manually created bcrypt hashes
  
  // Only proceed if the password field has been modified
  if (!this.isModified('password')) {
    return next();
  }
  
  // Check if this looks like a bcrypt hash already (starts with $2a$, $2b$ or $2y$ and is 60 chars)
  const BCRYPT_REGEX = /^\$2[aby]\$\d{1,2}\$[./0-9A-Za-z]{53}$/;
  
  if (BCRYPT_REGEX.test(this.password)) {
    // Already looks like a proper bcrypt hash, leave it as is
    console.log('Password already appears to be hashed, skipping hashing step');
    return next();
  }

  try {
    // Generate salt - same settings as bcrypt.online with cost factor 10
    const salt = await bcrypt.genSalt(10);
    
    // Hash the password with the salt
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Password hashed successfully in pre-save middleware');
    next();
  } catch (error) {
    console.error('Error hashing password in pre-save middleware:', error);
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema);