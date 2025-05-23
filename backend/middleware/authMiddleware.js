const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const School = require('../models/schoolModel');

// Helper function to safely parse JSON without crashing
const safeJsonParse = (str) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error('Failed to parse JSON:', e.message);
    return null;
  }
};

/**
 * Authentication and authorization middleware for the GradeBook application
 * Updated to support multi-tenancy with a single database and schoolId field
 */

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Add detailed request logging for debugging
  console.log(`Request to ${req.method} ${req.originalUrl}`);
  
  // Store request info for debugging
  req.originalRequestPath = req.originalUrl;
  
  // Check for token in authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      
      // Validate token format more thoroughly
      if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
        console.error('Invalid token format received:', token);
        res.status(401);
        throw new Error('Invalid token format');
      }
      
      // Log the token format for debugging
      console.log(`Token validation - length: ${token.length}, format check: ${typeof token === 'string' && token.length > 20 ? 'Valid' : 'Invalid'}`);
      
      // Handle the common case where the token might be a string "undefined"
      if (token.toLowerCase() === 'undefined') {
        console.error('Token is the string "undefined"');
        res.status(401);
        throw new Error('Invalid token - received string "undefined"');
      }

      // Check JWT secret existence
      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET environment variable is not set');
        res.status(500);
        throw new Error('Server configuration error - contact administrator');
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('JWT Token successfully decoded for user ID:', decoded.id);
      
      // Check for superadmin (they bypass schoolId enforcement)
      const superadmin = await User.findOne({ _id: decoded.id, role: 'superadmin' }).select('-password');
      
      if (superadmin) {
        console.log('User is a superadmin - bypassing schoolId restrictions');
        req.user = superadmin;
        next();
        return;
      }

      // Multi-tenancy: Find user with their schoolId
      let schoolId = null;
      
      // STRATEGY 1: Try to get schoolId from token (most reliable source)
      if (decoded.schoolId) {
        schoolId = decoded.schoolId;
        console.log(`Found schoolId in token: ${schoolId}`);
      }
      
      // Find the user including their schoolId
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        console.error(`User not found with ID: ${decoded.id}`);
        res.status(401);
        throw new Error('User not found');
      }
      
      // STRATEGY 2: Get schoolId from user object if not in token
      if (!schoolId && user.schoolId) {
        schoolId = user.schoolId;
        console.log(`Found schoolId in user object: ${schoolId}`);
      }
      
      // STRATEGY 3: If we still don't have a schoolId, try to find it by email domain
      if (!schoolId && user.email) {
        const emailParts = user.email.split('@');
        if (emailParts.length === 2) {
          const domain = emailParts[1];
          const school = await School.findOne({ emailDomain: domain });
          if (school) {
            schoolId = school._id;
            console.log(`Found schoolId by email domain: ${schoolId}`);
            
            // Update the user with the schoolId for future requests
            await User.findByIdAndUpdate(user._id, { schoolId: schoolId });
            console.log(`Updated user ${user._id} with schoolId ${schoolId}`);
          }
        }
      }
      
      // STRATEGY 4: Try to find schoolId by school reference (legacy field)
      if (!schoolId && user.school) {
        schoolId = user.school;
        console.log(`Found schoolId from legacy school field: ${schoolId}`);
        
        // Update the user with the schoolId field for future requests
        await User.findByIdAndUpdate(user._id, { schoolId: schoolId });
        console.log(`Updated user ${user._id} with schoolId ${schoolId}`);
      }
      
      // If we still don't have a schoolId, reject the request
      if (!schoolId) {
        console.error(`Could not determine schoolId for user: ${user._id}`);
        res.status(403);
        throw new Error('No school associated with this account');
      }
      
      // Verify that the school exists and is active
      const school = await School.findById(schoolId);
      if (!school) {
        console.error(`School not found with ID: ${schoolId}`);
        res.status(404);
        throw new Error('School not found');
      }
      
      if (!school.active) {
        console.error(`School ${school.name} is inactive`);
        res.status(403);
        throw new Error('School account is inactive');
      }
      
      // Set school context in request object for downstream middleware and controllers
      req.schoolId = schoolId;
      req.schoolName = school.name;
      
      // Enhance user object with school information
      user.schoolId = schoolId; // Ensure the field is set
      user.schoolName = school.name;
      user.schoolDetails = school;
      
      // Check if user account is active
      if (user.active === false) {
        console.warn(`User account is disabled: ${user.email}`);
        res.status(403);
        throw new Error('Your account has been disabled. Please contact administrator');
      }
      
      // Set the enhanced user in the request
      req.user = user;
      console.log(`Multi-tenant auth successful: User ${user.name} (${user.role}) in school ${school.name}`);
      next();
    } catch (error) {
      console.error('Auth Error:', error.message);
      
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

// Middleware to check if user is superadmin
const superadmin = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as a superadmin');
  }
});

// Middleware to check if user is admin or secretary with specific permission
const adminOrSecretary = (permissionKey) => {
  return asyncHandler(async (req, res, next) => {
    if (
      req.user && (
        // CRITICAL FIX: Allow superadmins to access all functionality
        req.user.role === 'superadmin' ||
        req.user.role === 'admin' || 
        (req.user.role === 'secretary' && 
         req.user.secretaryPermissions && 
         req.user.secretaryPermissions[permissionKey] === true)
      )
    ) {
      next();
    } else {
      res.status(403);
      throw new Error('Not authorized for this action');
    }
  });
};

// REMOVED DUPLICATE canManageUsers MIDDLEWARE

// Middleware to check if user is teacher or admin
const teacher = asyncHandler(async (req, res, next) => {
  console.log('Teacher middleware check - user:', req.user ? { id: req.user.id, role: req.user.role } : 'No user');
  
  if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin' || req.user.role === 'secretary')) {
    console.log('Teacher middleware - authorization granted for:', req.user.role);
    next();
  } else {
    console.log('Teacher middleware - authorization DENIED');
    res.status(403);
    throw new Error('Not authorized as a teacher or admin');
  }
});

// Secretary-specific permission middlewares
const canManageGrades = adminOrSecretary('canManageGrades');
const canSendNotifications = adminOrSecretary('canSendNotifications');
const canManageUsers = adminOrSecretary('canManageUsers');
const canManageSchools = adminOrSecretary('canManageSchools');
const canManageDirections = adminOrSecretary('canManageDirections');
const canManageSubjects = adminOrSecretary('canManageSubjects');
const canAccessStudentProgress = adminOrSecretary('canAccessStudentProgress');

module.exports = { 
  protect, 
  admin, 
  superadmin,
  teacher, 
  adminOrSecretary,
  canManageGrades,
  canSendNotifications,
  canManageUsers,
  canManageSchools,
  canManageDirections,
  canManageSubjects,
  canAccessStudentProgress
};
