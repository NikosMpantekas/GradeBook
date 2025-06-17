const mongoose = require('mongoose');

const schoolPermissionsSchema = mongoose.Schema(
  {
    // The school this permissions set belongs to
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      unique: true, // Only one permissions document per school
      index: true,
    },
    
    // Feature toggles - each represents a specific function in the application
    features: {
      enableNotifications: {
        type: Boolean,
        default: true,
        description: 'Enables the notifications module for this school'
      },
      enableGrades: {
        type: Boolean,
        default: true,
        description: 'Enables the grades management module for this school'
      },
      enableRatingSystem: {
        type: Boolean,
        default: true,
        description: 'Enables the student rating system for this school'
      },
      enableCalendar: {
        type: Boolean,
        default: true,
        description: 'Enables the calendar and events module for this school'
      },
      enableStudentProgress: {
        type: Boolean,
        default: true,
        description: 'Enables the student progress tracking module for this school'
      }
    },
    
    // Audit fields - track who last modified these permissions
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lastModifiedDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
  }
);

// Add compound index for faster lookups
schoolPermissionsSchema.index({ 'schoolId': 1 });

module.exports = mongoose.model('SchoolPermissions', schoolPermissionsSchema);
