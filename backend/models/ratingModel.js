const mongoose = require('mongoose');

// Rating Question Schema - Embedded directly within Rating Period
const RatingQuestionSchema = mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Please provide the question text'],
      trim: true
    },
    questionType: {
      type: String,
      enum: ['rating', 'text'],
      default: 'rating'
    },
    targetType: {
      type: String,
      enum: ['teacher', 'subject', 'both'],
      default: 'both'
    },
    order: {
      type: Number,
      default: 0
    }
  },
  { _id: true }
);

// Rating Period Schema - Now includes questions directly
const RatingPeriodSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title for this rating period'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    startDate: {
      type: Date,
      required: [true, 'Please provide a start date']
    },
    endDate: {
      type: Date,
      required: [true, 'Please provide an end date']
    },
    isActive: {
      type: Boolean,
      default: false
    },
    targetType: {
      type: String,
      enum: ['teacher', 'subject', 'both'],
      default: 'both'
    },
    schools: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School'
    }],
    directions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Direction'
    }],
    // Questions embedded directly in the period
    questions: [RatingQuestionSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // CRITICAL SECURITY: Track the creating school for strict domain isolation
    creatingSchool: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School'
    },
    // SECURITY: Flag to indicate if this is a global period (available to all schools)
    isGlobal: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Student Rating Schema - The actual ratings submitted by students
const StudentRatingSchema = mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    ratingPeriod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RatingPeriod',
      required: true
    },
    targetType: {
      type: String,
      enum: ['teacher', 'subject'],
      required: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'targetModel'
    },
    targetModel: {
      type: String,
      required: true,
      enum: ['User', 'Subject']
    },
    answers: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true
        },
        questionText: {
          type: String,
          required: true
        },
        ratingValue: {
          type: Number,
          min: 1,
          max: 10,
          default: null
        },
        textAnswer: {
          type: String,
          trim: true,
          default: null
        }
      }
    ],
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School'
    },
    direction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Direction'
    }
  },
  {
    timestamps: true
  }
);

// Create a compound index to ensure a student can only rate a target once per period
StudentRatingSchema.index(
  { student: 1, ratingPeriod: 1, targetType: 1, targetId: 1 },
  { unique: true }
);

// Auto-close rating periods when endDate is reached
RatingPeriodSchema.pre('save', function(next) {
  const now = new Date();
  if (this.endDate < now && this.isActive) {
    this.isActive = false;
  }
  next();
});

const RatingPeriod = mongoose.model('RatingPeriod', RatingPeriodSchema);
const StudentRating = mongoose.model('StudentRating', StudentRatingSchema);

// Export only what we need - removed RatingQuestion as a separate model
module.exports = {
  RatingPeriod,
  StudentRating
};
