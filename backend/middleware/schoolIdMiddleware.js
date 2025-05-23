/**
 * Multi-Tenancy Middleware
 * Ensures that all routes have access to the user's schoolId
 * and helps enforce data isolation between schools
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
  // First check if user is authenticated at all
  if (!req.user) {
    logger.warn('AUTH', 'Access attempt without authentication', {
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    res.status(401);
    throw new Error('Not authorized to access this route');
  }
  
  // Log the authenticated request
  logger.info('MIDDLEWARE', 'User authenticated for request', {
    userId: req.user._id,
    role: req.user.role,
    path: req.path,
    method: req.method
  });
  
  // Skip for superadmin routes - they can access everything and don't need schoolId
  if (req.user.role === 'superadmin') {
    logger.info('MIDDLEWARE', 'Superadmin access - bypassing school context enforcement', {
      userId: req.user._id,
      path: req.path
    });
    next();
    return;
  }

  // Get schoolId from the user object
  const schoolId = req.user.schoolId;

  if (!schoolId) {
    logger.error('MIDDLEWARE', 'SchoolId missing from user object', {
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      path: req.path
    });
    res.status(500);
    throw new Error('Missing school context - please contact administrator');
  }

  // Verify that the school exists
  try {
    logger.debug('MIDDLEWARE', 'Verifying school exists', { schoolId });
    const school = await School.findById(schoolId);
    
    if (!school) {
      logger.error('MIDDLEWARE', `School not found with ID: ${schoolId}`, {
        userId: req.user._id,
        userRole: req.user.role,
        path: req.path
      });
      res.status(404);
      throw new Error('School not found');
    }

    if (!school.active) {
      logger.error('MIDDLEWARE', `School ${school.name} is inactive`, {
        schoolId: school._id,
        userId: req.user._id,
        userRole: req.user.role
      });
      res.status(403);
      throw new Error('School account is inactive');
    }

    // Set school in request for downstream middleware and controllers
    req.school = school;
    logger.info('MIDDLEWARE', 'School context set successfully', {
      schoolId: school._id,
      schoolName: school.name,
      userId: req.user._id,
      path: req.path
    });
    next();
  } catch (error) {
    if (error.kind === 'ObjectId') {
      logger.error('MIDDLEWARE', 'Invalid school ID format', {
        schoolId,
        userId: req.user._id,
        path: req.path
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
