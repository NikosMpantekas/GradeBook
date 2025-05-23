/**
 * Multi-Tenancy Middleware
 * Ensures that all routes have access to the user's schoolId
 * and helps enforce data isolation between schools
 */

const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const School = require('../models/schoolModel');

/**
 * Adds schoolId from authenticated user to all requests
 * This middleware should be added after the auth middleware
 */
const setSchoolContext = asyncHandler(async (req, res, next) => {
  // Skip for superadmin routes - they can access everything
  if (req.user && req.user.role === 'superadmin') {
    console.log('Superadmin access - skipping school context enforcement');
    next();
    return;
  }

  // If user is not authenticated, return error
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized to access this route');
  }

  // Get schoolId from the user object
  const schoolId = req.user.schoolId;

  if (!schoolId) {
    console.error('SchoolId missing from user object:', req.user);
    res.status(500);
    throw new Error('Missing school context - please contact administrator');
  }

  // Verify that the school exists
  try {
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

    // Set school context on the request object
    req.schoolId = schoolId;
    req.schoolName = school.name;
    
    console.log(`Request context set to school: ${school.name} (${schoolId})`);
    next();
  } catch (error) {
    console.error('Error in school context middleware:', error);
    res.status(500);
    throw new Error('Error determining school context');
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
