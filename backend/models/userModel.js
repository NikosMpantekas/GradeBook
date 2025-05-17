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
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
    },
    role: {
      type: String,
      enum: ['superadmin', 'school_owner', 'admin', 'teacher', 'student'],
      default: 'student',
    },
    
    // Reference to tenant (organization/school group)
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      // Not required for superadmin
    },

    // For students: single school reference
    // For teachers: can be an array of schools or a single school
    school: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'School',
      validate: {
        validator: function(value) {
          // Allow null/undefined, a single ObjectId, or an array of ObjectIds
          return value === null || value === undefined || 
                 mongoose.Types.ObjectId.isValid(value) ||
                 (Array.isArray(value) && value.every(id => mongoose.Types.ObjectId.isValid(id)));
        },
        message: 'School must be a valid ObjectId or array of ObjectIds'
      }
    },

    // For students: single direction reference
    // For teachers: can be an array of directions or a single direction
    direction: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Direction',
      validate: {
        validator: function(value) {
          // Allow null/undefined, a single ObjectId, or an array of ObjectIds
          return value === null || value === undefined || 
                 mongoose.Types.ObjectId.isValid(value) ||
                 (Array.isArray(value) && value.every(id => mongoose.Types.ObjectId.isValid(id)));
        },
        message: 'Direction must be a valid ObjectId or array of ObjectIds'
      }
    },
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