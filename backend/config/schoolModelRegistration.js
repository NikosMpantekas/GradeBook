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

// Add password hashing methods for User schema
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Register all schema models in a database connection
 * @param {mongoose.Connection} connection - Mongoose connection instance
 * @returns {Object} Object containing all registered models
 */
const registerSchoolModels = (connection) => {
  console.log('Registering all schema models in school database connection...');
  
  if (!connection) {
    console.error('❌ Invalid connection provided to registerSchoolModels');
    return null;
  }
  
  try {
    // Register models in the correct dependency order
    // Only register if they don't already exist
    
    // 1. Register School model
    const SchoolModel = connection.models.School || 
      connection.model('School', SchoolSchema);
    console.log('✅ School model registered or already exists');
    
    // 2. Register Direction model
    const DirectionModel = connection.models.Direction || 
      connection.model('Direction', DirectionSchema);
    console.log('✅ Direction model registered or already exists');
    
    // 3. Register Subject model
    const SubjectModel = connection.models.Subject || 
      connection.model('Subject', SubjectSchema);
    console.log('✅ Subject model registered or already exists');
    
    // 4. Register Notification model
    const NotificationModel = connection.models.Notification || 
      connection.model('Notification', NotificationSchema);
    console.log('✅ Notification model registered or already exists');
    
    // 5. Register User model
    const UserModel = connection.models.User || 
      connection.model('User', UserSchema);
    console.log('✅ User model registered or already exists');
    
    console.log('✅ All models registered successfully');
    
    return {
      School: SchoolModel,
      Direction: DirectionModel,
      Subject: SubjectModel,
      Notification: NotificationModel,
      User: UserModel,
    };
  } catch (error) {
    console.error('❌ Error registering schema models:', error);
    return null;
  }
};

module.exports = {
  registerSchoolModels,
  SchoolSchema,
  DirectionSchema,
  SubjectSchema,
  NotificationSchema,
  UserSchema,
};
