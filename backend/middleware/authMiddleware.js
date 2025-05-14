const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET environment variable is not set');
        res.status(500);
        throw new Error('Server configuration error - contact administrator');
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token without password
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        res.status(401);
        throw new Error('User not found');
      }

      next();
    } catch (error) {
      console.error('JWT Error:', error.message);
      
      if (error.name === 'JsonWebTokenError') {
        res.status(401);
        throw new Error('Invalid token - please log in again');
      } else if (error.name === 'TokenExpiredError') {
        res.status(401);
        throw new Error('Token expired - please log in again');
      } else {
        res.status(401);
        throw new Error('Not authorized: ' + error.message);
      }
    }
  } else {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }
});

// Middleware to check if user is admin
const admin = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as an admin');
  }
});

// Middleware to check if user is teacher or admin
const teacher = asyncHandler(async (req, res, next) => {
  if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as a teacher');
  }
});

module.exports = { protect, admin, teacher };
