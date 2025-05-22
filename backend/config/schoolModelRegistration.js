/**
 * School Database Model Registration
 * This file contains direct schema definitions for school-specific databases
 * These schemas are used to register models in school-specific database connections
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Pre-define all schemas that will be needed in school databases
const SchoolSchema = new mongoose.Schema({
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
  dbConfig: {
    uri: {
      type: String,
      default: '',
    },
    dbName: {
      type: String,
      default: '',
    },
  },
}, {
  timestamps: true,
});

const DirectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a direction name'],
  },
  description: {
    type: String,
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
  },
}, {
  timestamps: true,
});

const SubjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a subject name'],
  },
  description: {
    type: String,
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
  },
  direction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Direction',
  },
  color: {
    type: String,
    default: '#3f51b5',
  },
}, {
  timestamps: true,
});

const NotificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a notification title'],
  },
  message: {
    type: String,
    required: [true, 'Please add a notification message'],
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  schools: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
  }],
  directions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Direction',
  }],
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
  }],
  sendToAll: {
    type: Boolean,
    default: false
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
  },
  direction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Direction',
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
  },
  read: {
    type: Boolean,
    default: false
  },
  important: {
    type: Boolean,
    default: false
  },
  targetRole: {
    type: String,
    enum: ['student', 'teacher', 'admin', 'secretary', 'all'],
    default: 'all'
  },
}, {
  timestamps: true,
});

// Define User Schema for school-specific databases
const UserSchema = new mongoose.Schema(
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
    mobilePhone: {
      type: String,
      required: false,
    },
    personalEmail: {
      type: String,
      required: false,
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
    active: {
      type: Boolean,
      default: true,
    },
    schoolDomain: {
      type: String,
      default: '',
    },
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
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
    },
    direction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Direction',
    },
    schools: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
      },
    ],
    directions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Direction',
      },
    ],
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
    profilePhoto: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Define Grade schema for school-specific databases
const GradeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  grade: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  description: {
    type: String,
  },
  weight: {
    type: Number,
    default: 1,
  },
  term: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'final'],
    required: true,
  },
  schoolYear: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

// Add password hashing methods for User schema
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Register all schema models in a database connection
 * @param {mongoose.Connection} connection - Mongoose connection instance
 * @returns {Object} Object containing all registered models
 */
const registerSchoolModels = (connection) => {
  if (!connection) {
    console.error('Cannot register models: No connection provided');
    return {};
  }
  
  const registeredModels = {};
  
  // Check connection state
  console.log(`Registering models - connection state: ${connection.readyState}`);
  console.log(`Registering models for database: ${connection.db ? connection.db.databaseName : 'unknown'}`);
  
  try {
    // CRITICAL FIX: Enhanced model registration with better error handling and logging
    const registerModel = (modelName, schema) => {
      try {
        // First try to get the existing model
        registeredModels[modelName] = connection.model(modelName);
        console.log(`Retrieved existing ${modelName} model`);
      } catch (e) {
        // If it doesn't exist, create it with the schema
        try {
          registeredModels[modelName] = connection.model(modelName, schema);
          console.log(`Created new ${modelName} model`);
        } catch (createError) {
          console.error(`Failed to create ${modelName} model:`, createError.message);
          
          // Last resort: Try creating with a different name and then aliasing
          try {
            const tempName = `${modelName}_${Date.now()}`;
            const tempModel = connection.model(tempName, schema);
            connection.deleteModel(tempName);
            registeredModels[modelName] = connection.model(modelName, schema);
            console.log(`Created ${modelName} model using alternative method`);
          } catch (finalError) {
            console.error(`All attempts to create ${modelName} model failed:`, finalError.message);
          }
        }
      }
    };
    
    // Register all models
    registerModel('School', SchoolSchema);
    registerModel('Direction', DirectionSchema);
    registerModel('Subject', SubjectSchema);
    registerModel('User', UserSchema);
    registerModel('Grade', GradeSchema);
    registerModel('Notification', NotificationSchema);
    
    // Verify registration
    const modelCount = Object.keys(registeredModels).length;
    console.log(`Successfully registered ${modelCount} models:`, Object.keys(registeredModels).join(', '));
    
    // IMPORTANT: Check for existing data
    Promise.all([
      registeredModels.Direction?.countDocuments?.() || Promise.resolve(0),
      registeredModels.Subject?.countDocuments?.() || Promise.resolve(0),
      registeredModels.User?.countDocuments?.() || Promise.resolve(0)
    ])
    .then(([directionCount, subjectCount, userCount]) => {
      console.log(`Database contains: ${directionCount} directions, ${subjectCount} subjects, ${userCount} users`);
    })
    .catch(err => {
      console.error('Error counting existing documents:', err.message);
    });
    
  } catch (error) {
    console.error('Error registering models:', error.message);
  }
  
  return registeredModels;
};

module.exports = {
  registerSchoolModels,
  DirectionSchema,
  UserSchema,
  ClassSchema,
  SubjectSchema,
  GradeSchema,
  AttendanceSchema,
  ClassScheduleSchema,
  NotificationSchema
};
