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
      enum: ['admin', 'teacher', 'student'],
      default: 'student',
    },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
    },
    direction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Direction',
    },
    subjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
      },
    ],
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
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) {
    return next();
  }

  // Generate salt
  const salt = await bcrypt.genSalt(10);
  
  // Hash the password with the salt
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('User', userSchema);
