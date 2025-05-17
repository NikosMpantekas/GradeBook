const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { getModel } = require('../config/multiDbManager');
const userSchema = require('../models/userModel');

/**
 * Authentication middleware - verifies JWT token and adds user to request
 * This is kept separate from tenantResolver to maintain separation of concerns
 * 
 * The authentication process has these steps:
 * 1. Validate the token exists and is formatted correctly
 * 2. Verify the token with the JWT secret
 * 3. Find the user in the main authentication database
 * 4. Add the user object to the request for downstream middleware/routes
 */
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

      // Get user from main database first - we use main DB for authentication
      // The tenantResolver middleware will then set up the correct tenant DB connection
      const MainUser = await getModel('main', 'User', userSchema);
      const user = await MainUser.findById(decoded.id).select('-password');

      if (!user) {
        res.status(401);
        throw new Error('User not found or account deactivated');
      }
      
      // Enhance the user object with a few helper properties
      const enhancedUser = user.toObject ? user.toObject() : { ...user };
      
      // Add helper methods for role checking
      enhancedUser.isSuperAdmin = () => enhancedUser.role === 'superadmin';
      enhancedUser.isSchoolOwner = () => enhancedUser.role === 'school_owner';
      enhancedUser.isAdmin = () => enhancedUser.role === 'admin';
      enhancedUser.isTeacher = () => enhancedUser.role === 'teacher';
      enhancedUser.isStudent = () => enhancedUser.role === 'student';
      
      // Add the enhanced user object to the request
      req.user = enhancedUser;
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

// Generate JWT token with user ID and tenant information if applicable
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET environment variable is not set');
    throw new Error('Server configuration error - contact administrator');
  }
  
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

// Export only the authentication middleware and token generator
// Role-based middlewares are now in tenantMiddleware.js
module.exports = { protect, generateToken };
