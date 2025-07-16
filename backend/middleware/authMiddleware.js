const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const School = require('../models/schoolModel');
const logger = require('../utils/logger');

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

  // Enhanced request logging with proper categorization
  logger.info('AUTH', `Authorization request for ${req.method} ${req.originalUrl}`, {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    hasAuthHeader: !!req.headers.authorization
  });
  
  // Store request info for debugging
  req.originalRequestPath = req.originalUrl;
  
  // Check for token in authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      
      // Validate token format more thoroughly
      if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
        logger.warn('AUTH', 'Invalid token format received', {
          token: token || 'EMPTY',
          path: req.originalUrl
        });
        res.status(401);
        throw new Error('Invalid token format');
      }
      
      // Log the token format for debugging
      logger.info('AUTH', 'Token validation check', {
        tokenLength: token.length,
        formatCheck: typeof token === 'string' && token.length > 20 ? 'Valid' : 'Invalid'
      });
      
      // Handle the common case where the token might be a string "undefined"
      if (token.toLowerCase() === 'undefined') {
        logger.warn('AUTH', 'Token is the string "undefined"', {
          path: req.originalUrl
        });
        res.status(401);
        throw new Error('Invalid token - received string "undefined"');
      }

      // Check JWT secret existence
      if (!process.env.JWT_SECRET) {
        logger.error('AUTH', 'JWT_SECRET environment variable is not set');
        res.status(500);
        throw new Error('Server configuration error - contact administrator');
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      logger.info('AUTH', `JWT Token decoded successfully for user ID: ${decoded.id}`);
      
      // CRITICAL FIX: First check if this is a superadmin user
      // Superadmin users need special handling and bypass schoolId requirements
      const superadmin = await User.findOne({ _id: decoded.id, role: 'superadmin' })
        .select('-password')
        .lean(); // Use lean() for better performance with plain objects
      
      if (superadmin) {
        logger.info('AUTH', 'Superadmin user authenticated successfully', {
          userId: superadmin._id,
          email: superadmin.email,
          path: req.originalUrl
        });
        
        // Make sure all required fields are present for the frontend
        const enhancedSuperadmin = {
          ...superadmin,
          // Ensure these fields exist even if null to prevent white screen issues
          schoolId: null,
          schoolName: null,
          school: null
        };
        
        // Set the enhanced user in the request
        req.user = enhancedSuperadmin;
        
        // For superadmin, add a flag to bypass schoolId checks
        req.isSuperadmin = true;
        
        logger.debug('AUTH', 'Superadmin context set - bypassing schoolId restrictions');
        next();
        return;
      }

      // Multi-tenancy: For regular users, we need to find and validate their schoolId
      let schoolId = null;
      
      // STRATEGY 1: Try to get schoolId from token (most reliable source)
      if (decoded.schoolId) {
        schoolId = decoded.schoolId;
        logger.info('AUTH', `Found schoolId in token: ${schoolId}`);
      }
      
      // Find the user with all their details
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        logger.error('AUTH', `User not found with ID: ${decoded.id}`);
        res.status(401);
        throw new Error('User not found');
      }
      
      logger.info('AUTH', `Found user ${user.name} (${user.email}) with role ${user.role}`);
      
      // Second check for superadmin (safety net - in case user role was updated)
      if (user.role === 'superadmin') {
        logger.info('AUTH', 'User is superadmin (second check) - bypassing school context', {
          userId: user._id,
          email: user.email
        });
        
        // Make sure all required fields are present for the frontend
        user.schoolId = null;
        user.schoolName = 'System-wide Access';
        user.school = null;
        
        // Set the enhanced user in the request
        req.user = user;
        req.isSuperadmin = true;
        
        next();
        return;
      }
      
      // Regular user processing continues here
      
      // STRATEGY 2: Get schoolId from user object if not in token
      if (!schoolId && user.schoolId) {
        schoolId = user.schoolId;
        logger.info('AUTH', `Found schoolId in user object: ${schoolId}`);
      }
      
      // STRATEGY 3: If we still don't have a schoolId, try to find it by email domain
      if (!schoolId && user.email) {
        const emailParts = user.email.split('@');
        if (emailParts.length === 2) {
          const domain = emailParts[1];
          const school = await School.findOne({ emailDomain: domain });
          if (school) {
            schoolId = school._id;
            logger.info('AUTH', `Found schoolId by email domain: ${schoolId}`);
            
            // Update the user with the schoolId for future requests
            await User.findByIdAndUpdate(user._id, { schoolId: schoolId });
            logger.info('AUTH', `Updated user ${user._id} with schoolId ${schoolId}`);
          }
        }
      }
      
      // STRATEGY 4: Try to find schoolId by school reference (legacy field)
      if (!schoolId && user.school) {
        schoolId = user.school;
        logger.info('AUTH', `Found schoolId from legacy school field: ${schoolId}`);
        
        // Update the user with the schoolId field for future requests
        await User.findByIdAndUpdate(user._id, { schoolId: schoolId });
        logger.info('AUTH', `Updated user ${user._id} with schoolId ${schoolId}`);
      }
      
      // For non-superadmin users who aren't students or parents, schoolId is required
      if (!schoolId && !['student', 'parent'].includes(user.role)) {
        logger.error('AUTH', `Could not determine schoolId for user with role ${user.role}`, {
          userId: user._id,
          email: user.email
        });
        res.status(403);
        throw new Error('No school associated with this account - please contact administrator');
      }
      
      // If we have a schoolId, verify the school exists and is active
      if (schoolId) {
        // Convert string to ObjectId if needed
        if (typeof schoolId === 'string') {
          try {
            // CRITICAL FIX: Must use 'new' with the ObjectId constructor
            schoolId = new mongoose.Types.ObjectId(schoolId);
          } catch (error) {
            logger.error('AUTH', `Invalid schoolId format: ${schoolId}`, { error: error.message });
            res.status(400);
            throw new Error('Invalid school ID format');
          }
        }
        
        const school = await School.findById(schoolId);
        if (!school) {
          logger.error('AUTH', `School not found with ID: ${schoolId}`);
          res.status(404);
          throw new Error('School not found');
        }
        
        if (!school.active) {
          logger.error('AUTH', `School ${school.name} is inactive`);
          res.status(403);
          throw new Error('School account is inactive');
        }
        
        // Set school context in request object for downstream middleware and controllers
        req.schoolId = schoolId;
        req.schoolName = school.name;
        req.school = school;
        
        // Enhance user object with school information
        user.schoolId = schoolId; // Ensure the field is set
        user.schoolName = school.name;
        user.schoolDetails = school;
      } else {
        // For students/parents without schoolId, we'll proceed but log a warning
        logger.warn('AUTH', `User ${user.role} proceeding without school context`, {
          userId: user._id,
          email: user.email
        });
      }
      
      // Check if user account is active
      if (user.active === false) {
        logger.warn('AUTH', `User account is disabled: ${user.email}`);
        res.status(403);
        throw new Error('Your account has been disabled. Please contact administrator');
      }
      
      // Set the enhanced user in the request
      req.user = user;
      logger.info('AUTH', `Authentication successful for ${user.name} (${user.role})`, {
        userId: user._id,
        schoolId: user.schoolId || 'None'
      });
      next();
    } catch (error) {
      logger.error('AUTH', 'Authentication error', {
        error: error.message,
        name: error.name,
        path: req.originalUrl,
        stack: error.stack?.substring(0, 300) // Just capture the top of the stack
      });
      
      if (error.name === 'JsonWebTokenError') {
        res.status(401);
        throw new Error('Invalid token - please log in again');
      } else if (error.name === 'TokenExpiredError') {
        res.status(401);
        throw new Error('Token expired - please log in again');
      } else if (error.name === 'CastError' || error.message.includes('ObjectId')) {
        res.status(400);
        throw new Error('Invalid ID format in token - please log in again');
      } else {
        res.status(401);
        throw new Error('Authentication failed: ' + error.message);
      }
    }
  } else {
    logger.warn('AUTH', 'No authorization token provided', {
      path: req.originalUrl,
      method: req.method,
      ip: req.ip
    });
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }
});

// School admin middleware
// Checks if user is an admin
const admin = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    logger.error('AUTH', 'Admin check - No user object found in request', {
      path: req.originalUrl,
      method: req.method,
      ip: req.ip
    });
    res.status(401);
    throw new Error('Authentication required - please log in');
  }
  
  if (req.user.role === 'admin') {
    logger.info('AUTH', 'Admin access granted', {
      userId: req.user._id,
      path: req.originalUrl
    });
    next();
  } else if (req.user.role === 'superadmin') {
    // Superadmins can access admin routes too
    logger.info('AUTH', 'Superadmin accessing admin route', {
      userId: req.user._id,
      path: req.originalUrl
    });
    next();
  } else {
    logger.warn('AUTH', 'Unauthorized admin access attempt', {
      userId: req.user._id,
      role: req.user.role,
      path: req.originalUrl
    });
    res.status(403);
    throw new Error('Not authorized as an admin');
  }
});

// Middleware to check if user is superadmin
const superadmin = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    logger.error('AUTH', 'Superadmin check - No user object found in request', {
      path: req.originalUrl,
      method: req.method,
      ip: req.ip
    });
    res.status(401);
    throw new Error('Authentication required - please log in');
  }
  
  if (req.user.role === 'superadmin') {
    logger.info('AUTH', 'Superadmin access granted', {
      userId: req.user._id,
      path: req.originalUrl
    });
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

// Middleware to check if user is a student
const student = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    logger.error('AUTH', 'Student role check - No user object found in request', {
      path: req.originalUrl,
      method: req.method,
      ip: req.ip
    });
    res.status(401);
    throw new Error('Authentication required - please log in');
  }
  
  // Check if user has student role
  if (req.user.role === 'student' || req.user.role === 'admin' || req.user.role === 'superadmin') {
    logger.info('AUTH', `Student access granted to ${req.user.role}`, {
      userId: req.user._id,
      role: req.user.role,
      path: req.originalUrl
    });
    next();
  } else {
    logger.warn('AUTH', 'Unauthorized student access attempt', {
      userId: req.user._id,
      role: req.user.role,
      path: req.originalUrl
    });
    res.status(403);
    throw new Error('Not authorized to access student features');
  }
});

// Middleware to check if user can manage students (admin, teacher, secretary)
const canManageStudents = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    logger.error('AUTH', 'Student management check - No user object found in request', {
      path: req.originalUrl,
      method: req.method
    });
    res.status(401);
    throw new Error('Authentication required - please log in');
  }
  
  // Check if user has permissions to manage students
  if (['admin', 'teacher', 'secretary', 'superadmin'].includes(req.user.role)) {
    logger.info('AUTH', `Student management access granted to ${req.user.role}`, {
      userId: req.user._id,
      role: req.user.role,
      path: req.originalUrl
    });
    next();
  } else {
    logger.warn('AUTH', 'Unauthorized student management access attempt', {
      userId: req.user._id,
      role: req.user.role,
      path: req.originalUrl
    });
    res.status(403);
    throw new Error('Not authorized to access student information');
  }
});

const adminCanManageSubjects = canManageSubjects;

module.exports = { 
  protect, 
  admin, 
  superadmin,
  teacher, 
  student,
  adminOrSecretary,
  canManageGrades,
  canSendNotifications,
  canManageUsers,
  canManageSchools,
  canManageDirections,
  canManageSubjects,
  adminCanManageSubjects,
  canAccessStudentProgress,
  canManageStudents
};
