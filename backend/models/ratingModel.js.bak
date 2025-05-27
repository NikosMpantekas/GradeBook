const mongoose = require('mongoose');

// Rating Period Schema - Defines when ratings are open
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Rating Question Schema - The questions students will answer
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
    },
    ratingPeriod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RatingPeriod',
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
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
        question: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'RatingQuestion',
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
const RatingQuestion = mongoose.model('RatingQuestion', RatingQuestionSchema);
const StudentRating = mongoose.model('StudentRating', StudentRatingSchema);

module.exports = {
  RatingPeriod,
  RatingQuestion,
  StudentRating
};
