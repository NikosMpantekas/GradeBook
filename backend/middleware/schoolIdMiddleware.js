/**
 * Multi-Tenancy Middleware
 * Ensures that all routes have access to the user's schoolId
 * and helps enforce data isolation between schools
 * 
 * CRITICAL: This middleware MUST be used AFTER the 'protect' auth middleware
 * Because it expects req.user to be populated by the auth middleware
 */

const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const School = require('../models/schoolModel');
const logger = require('../utils/logger');

/**
 * Adds schoolId from authenticated user to all requests
 * This middleware should be added after the auth middleware
 */
const setSchoolContext = asyncHandler(async (req, res, next) => {
  // IMPORTANT: This middleware assumes req.user has already been set by auth middleware
  // The 'protect' middleware should run BEFORE this middleware
  
  // First check if user exists on the request
  if (!req.user) {
    logger.error('AUTH', 'No user object found in request - auth middleware should have run first', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      hasAuthHeader: !!req.headers.authorization
    });
    res.status(401);
    throw new Error('Authentication error - user context missing');
  }
  
  // Special handling for superadmin users - they don't need schoolId context
  if (req.user.role === 'superadmin') {
    logger.info('MIDDLEWARE', 'Superadmin user detected - bypassing school context checks', {
      userId: req.user._id,
      path: req.path
    });
    
    // For superadmins, set empty school context to avoid errors
    req.schoolId = null;
    req.schoolName = 'System-wide Access';
    req.school = null;
    next();
    return;
  }

  // Log the regular user access attempt
  logger.info('MIDDLEWARE', 'Processing regular user school context', {
    userId: req.user._id,
    role: req.user.role,
    path: req.path,
    hasSchoolId: !!req.user.schoolId
  });

  // Get schoolId from the user object
  const schoolId = req.user.schoolId;

  // CRITICAL FIX: Try to recover schoolId if missing
  if (!schoolId) {
    logger.warn('MIDDLEWARE', 'SchoolId missing from user object - attempting recovery', {
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role
    });
    
    // Recovery method 1: Try to find schoolId from email domain
    try {
      if (req.user.email && req.user.email.includes('@')) {
        const emailDomain = req.user.email.split('@')[1];
        const school = await School.findOne({ emailDomain });
        
        if (school) {
          // Found a school with matching email domain
          logger.info('MIDDLEWARE', 'Recovered schoolId from email domain', {
            userId: req.user._id,
            email: req.user.email,
            schoolId: school._id
          });
          
          // Update user with schoolId for future requests
          await mongoose.model('User').findByIdAndUpdate(
            req.user._id, 
            { schoolId: school._id },
            { new: true }
          );
          
          // Set context for this request
          req.user.schoolId = school._id;
          req.schoolId = school._id;
          req.schoolName = school.name;
          req.school = school;
          
          // Continue with the request
          return next();
        }
      }
      
      // If we get here, recovery failed
      logger.error('MIDDLEWARE', 'SchoolId recovery failed - no matching school found', {
        userId: req.user._id,
        email: req.user.email
      });
      res.status(400);
      throw new Error('Unable to determine your school context - please contact administrator');
    } catch (error) {
      logger.error('MIDDLEWARE', 'Error during schoolId recovery', {
        error: error.message,
        userId: req.user._id
      });
      res.status(500);
      throw new Error('Error determining school context');
    }
  }

  // Verify that the school exists and is active
  try {
    logger.debug('MIDDLEWARE', 'Verifying school exists', { schoolId });
    const school = await School.findById(schoolId);
    
    if (!school) {
      logger.error('MIDDLEWARE', `School not found with ID: ${schoolId}`, {
        userId: req.user._id,
        role: req.user.role
      });
      res.status(404);
      throw new Error('School not found');
    }

    if (!school.active) {
      logger.error('MIDDLEWARE', `School ${school.name} is inactive`, {
        schoolId: school._id,
        userId: req.user._id
      });
      res.status(403);
      throw new Error('School account is inactive');
    }

    // Set school in request for downstream middleware and controllers
    req.schoolId = schoolId;
    req.schoolName = school.name;
    req.school = school;
    
    logger.info('MIDDLEWARE', 'School context set successfully', {
      schoolId: school._id,
      schoolName: school.name,
      path: req.path
    });
    next();
  } catch (error) {
    if (error.name === 'CastError' || error.kind === 'ObjectId') {
      logger.error('MIDDLEWARE', 'Invalid school ID format', {
        schoolId,
        userId: req.user._id
      });
      res.status(400);
      throw new Error('Invalid school ID format');
    }
    // Pass other errors to the error handler
    throw error;
  }
});

/**
 * Force adds schoolId filter to database query
 * Use this in controllers to ensure data isolation
 * @param {Object} query - Mongoose query object or filter object
 * @param {String} schoolId - The schoolId to filter by
 * @returns {Object} Modified query with schoolId filter
 */
const enforceSchoolFilter = (query, schoolId) => {
  if (!schoolId) {
    throw new Error('SchoolId is required for data isolation');
  }
  
  // For simple object filters, add schoolId
  if (typeof query === 'object' && !query.schoolId) {
    return { ...query, schoolId };
  }
  
  // For Mongoose Query objects
  if (query instanceof mongoose.Query && !query._conditions.schoolId) {
    query._conditions.schoolId = schoolId;
  }
  
  return query;
};

module.exports = {
  setSchoolContext,
  enforceSchoolFilter
};
