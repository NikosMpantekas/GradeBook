// New School Permissions Model
// This file has been completely rewritten as part of replacing the legacy school function permission toggle system.
// The SchoolPermissions collection is now used to store all app features as toggleable booleans for each school.
// Features are now controlled by a new superadmin-only toggle system that will be implemented separately.

const mongoose = require('mongoose');

/**
 * New School Permissions Model
 * - One record per school with all app features as boolean toggles
 * - Superadmin can control which features are enabled/disabled per school
 * - All features default to true for new schools
 */
const schoolPermissionsSchema = mongoose.Schema(
  {
    school_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      unique: true,
      index: true
    },
    
    // Core Features
    features: {
      // Academic Features
      enableGrades: {
        type: Boolean,
        default: true,
        description: 'Allow teachers to manage student grades'
      },
      enableClasses: {
        type: Boolean,
        default: true,
        description: 'Allow class management and organization'
      },
      enableSubjects: {
        type: Boolean,
        default: true,
        description: 'Allow subject/course management'
      },
      enableStudents: {
        type: Boolean,
        default: true,
        description: 'Allow student management and enrollment'
      },
      enableTeachers: {
        type: Boolean,
        default: true,
        description: 'Allow teacher management and assignment'
      },
      
      // Communication Features
      enableNotifications: {
        type: Boolean,
        default: true,
        description: 'Allow push notifications and messaging'
      },
      enableContactDeveloper: {
        type: Boolean,
        default: true,
        description: 'Allow users to contact developers'
      },
      
      // Advanced Features
      enableCalendar: {
        type: Boolean,
        default: true,
        description: 'Allow calendar and event management'
      },
      enableSchedule: {
        type: Boolean,
        default: true,
        description: 'Allow schedule management'
      },
      enableRatingSystem: {
        type: Boolean,
        default: true,
        description: 'Allow student rating and feedback system'
      },
      enableAnalytics: {
        type: Boolean,
        default: true,
        description: 'Allow analytics and statistics'
      },
      
      // Administrative Features
      enableUserManagement: {
        type: Boolean,
        default: true,
        description: 'Allow user creation and management'
      },
      enableSchoolSettings: {
        type: Boolean,
        default: true,
        description: 'Allow school configuration management'
      },
      
      // System Features
      enableSystemMaintenance: {
        type: Boolean,
        default: true,
        description: 'Allow access to system maintenance tools'
      },
      enableBugReports: {
        type: Boolean,
        default: true,
        description: 'Allow bug reporting functionality'
      },
      
      // Future-proofing: Additional features can be added here
      enableDirections: {
        type: Boolean,
        default: true,
        description: 'Allow direction/department management'
      },
      enablePatchNotes: {
        type: Boolean,
        default: true,
        description: 'Allow viewing system patch notes'
      },
      enableStudentProgress: {
        type: Boolean,
        default: true,
        description: 'Allow student progress tracking'
      }
    },
    
    // Metadata
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    
    // Version tracking for future migrations
    version: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true,
    collection: 'schoolpermissions' // Ensure consistent collection name
  }
);

// Index for efficient querying
schoolPermissionsSchema.index({ school_id: 1 });

// Pre-save middleware to update lastUpdated
schoolPermissionsSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Static method to get all available features
schoolPermissionsSchema.statics.getAvailableFeatures = function() {
  return {
    enableGrades: 'Grade Management',
    enableClasses: 'Class Management',
    enableSubjects: 'Subject Management',
    enableStudents: 'Student Management',
    enableTeachers: 'Teacher Management',
    enableNotifications: 'Notifications',
    enableContactDeveloper: 'Contact Developer',
    enableCalendar: 'Calendar',
    enableSchedule: 'Schedule',
    enableRatingSystem: 'Rating System',
    enableAnalytics: 'Analytics',
    enableUserManagement: 'User Management',
    enableSchoolSettings: 'School Settings',
    enableSystemMaintenance: 'System Maintenance',
    enableBugReports: 'Bug Reports',
    enableDirections: 'Direction Management',
    enablePatchNotes: 'Patch Notes',
    enableStudentProgress: 'Student Progress'
  };
};

// Static method to create default permissions for a school
schoolPermissionsSchema.statics.createDefaultPermissions = async function(schoolId, updatedBy = null) {
  try {
    // CRITICAL VALIDATION: Prevent null/undefined schoolId
    if (!schoolId) {
      throw new Error('School ID is required and cannot be null/undefined');
    }
    
    // Validate schoolId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      throw new Error(`Invalid school ID format: ${schoolId}`);
    }
    
    console.log(`🔍 Creating permissions for schoolId: ${schoolId}`);
    
    const existingPermissions = await this.findOne({ school_id: schoolId });
    
    if (existingPermissions) {
      console.log(`✅ School permissions already exist for school ${schoolId}`);
      return existingPermissions;
    }
    
    const defaultPermissions = new this({
      school_id: schoolId,
      updatedBy: updatedBy,
      features: {
        enableGrades: true,
        enableClasses: true,
        enableSubjects: true,
        enableStudents: true,
        enableTeachers: true,
        enableNotifications: true,
        enableContactDeveloper: true,
        enableCalendar: true,
        enableSchedule: true,
        enableRatingSystem: true,
        enableAnalytics: true,
        enableUserManagement: true,
        enableSchoolSettings: true,
        enableSystemMaintenance: true,
        enableBugReports: true,
        enableDirections: true,
        enablePatchNotes: true,
        enableStudentProgress: true
      }
    });
    
    await defaultPermissions.save();
    console.log(`Created default permissions for school ${schoolId}`);
    return defaultPermissions;
    
  } catch (error) {
    console.error(`Error creating default permissions for school ${schoolId}:`, error);
    throw error;
  }
};

// Static method to get permissions for a school
schoolPermissionsSchema.statics.getSchoolPermissions = async function(schoolId) {
  try {
    let permissions = await this.findOne({ school_id: schoolId });
    
    if (!permissions) {
      console.log(`No permissions found for school ${schoolId}, creating default permissions`);
      permissions = await this.createDefaultPermissions(schoolId);
    }
    
    return permissions;
    
  } catch (error) {
    console.error(`Error getting permissions for school ${schoolId}:`, error);
    throw error;
  }
};

module.exports = mongoose.model('SchoolPermissions', schoolPermissionsSchema);
