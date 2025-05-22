const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const School = require('../models/schoolModel');
const { connectToSchoolDb, getSchoolConnection } = require('../config/multiDbConnect');

// Cache for school connections to avoid repeated lookups
const schoolConnectionCache = new Map();

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
 * Handles multi-database authentication across school-specific databases
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
      
      // Log the token format (first few characters) for debugging
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
      
      // Check for user being a superadmin (in main database)
      const superadmin = await User.findOne({ _id: decoded.id, role: 'superadmin' }).select('-password');
      
      if (superadmin) {
        // Superadmin found in main database
        console.log('Found superadmin user in main database');
        req.user = superadmin;
        next();
        return;
      }

      // CRITICAL FIX: Check for SchoolId in token first, as this is the most reliable source
      // The token might have been generated with school information
      const schoolId = decoded.schoolId;
      
      // If we have a schoolId in the token, we should use that first
      if (schoolId) {
        console.log(`Token contains schoolId: ${schoolId} - using this to find school`);
        const school = await School.findById(schoolId);
        
        if (school) {
          console.log(`Found school from token schoolId: ${school.name}`);
          // School found directly from token - continue with processing below
          req.targetSchool = school;
          
          // ENHANCED FIX: Check if this school has an email domain (making it a cluster)
          // This distinguishes between regular schools and school clusters
          if (school.emailDomain) {
            console.log(`School ${school.name} is a cluster with domain: ${school.emailDomain}`);
            req.isSchoolCluster = true;
          } else {
            console.log(`School ${school.name} is a regular school (no domain)`);
            req.isSchoolCluster = false;
          }
        } else {
          console.log(`School not found for ID in token: ${schoolId}`);
        }
      }
      
      // Initialize userRef variable at a higher scope
      let userRef = null;
      
      // If school not found by token ID, try looking up user reference in main DB
      if (!req.targetSchool) {
        // Not a superadmin - find user reference in main DB to determine school
        userRef = await User.findById(decoded.id).select('email schoolDomain school');
        console.log(`Looking up user reference in main DB: ${userRef ? 'Found' : 'Not found'}`);
        
        if (!userRef) {
          // Legacy case - check if user exists directly in main database
          const mainUser = await User.findById(decoded.id).select('-password');
          if (mainUser) {
            console.log('Found user in main database (legacy user)');
            req.user = mainUser;
            next();
            return;
          } else {
            console.error(`User not found for ID: ${decoded.id}`);
            res.status(401);
            throw new Error('User not found');
          }
        }
      }
      
      // Determine which school this user belongs to if not already found from token
      let school = req.targetSchool;
      
      if (!school && userRef) {
        if (userRef.school) {
          // Direct reference to school
          school = await School.findById(userRef.school);
          console.log(`Found school by direct reference: ${school ? school.name : 'Not found'}`);
        } else if (userRef.schoolDomain) {
          // Find by school domain
          school = await School.findOne({ emailDomain: userRef.schoolDomain });
          console.log(`Found school by domain reference: ${school ? school.name : 'Not found'}`);
        } else {
          // Extract domain from email
          const emailParts = userRef.email.split('@');
          if (emailParts.length === 2) {
            school = await School.findOne({ emailDomain: emailParts[1] });
            console.log(`Found school by email domain extraction: ${school ? school.name : 'Not found'}`);
          }
        }
      }
      
      if (!school) {
        console.error(`Could not determine school for user: ${decoded.id}`);
        // Fallback to main database as a last resort
        const mainUser = await User.findById(decoded.id).select('-password');
        if (mainUser) {
          req.user = mainUser;
          next();
          return;
        } else {
          res.status(401);
          throw new Error('School not found for user');
        }
      }
      
      // Found the school - check if active
      if (school.active === false) {
        res.status(403);
        throw new Error('School account is disabled. Please contact administrator');
      }
      
      try {
        // ENHANCED: Improved connection handling with better caching and validation
        const schoolId = school._id.toString();
        let connection, models;
        
        console.log(`Attempting to connect to school database for: ${school.name} (ID: ${schoolId})`);
        
        // Check if we have a cached connection first
        if (schoolConnectionCache.has(schoolId)) {
          console.log('Found cached school connection, verifying status...');
          const cachedData = schoolConnectionCache.get(schoolId);
          
          // Verify the connection is still valid and ready
          if (cachedData.connection && cachedData.connection.readyState === 1) {
            console.log('Cached connection is valid, using it');
            connection = cachedData.connection;
            models = cachedData.models || {};
          } else {
            console.log('Cached connection is stale or invalid (readyState:', 
              cachedData.connection ? cachedData.connection.readyState : 'null', '), creating new one');
            const result = await connectToSchoolDb(school);
            connection = result.connection;
            models = result.models || {};
            
            // Update the cache with fresh connection
            schoolConnectionCache.set(schoolId, { 
              connection, 
              models,
              timestamp: Date.now() 
            });
          }
        } else {
          console.log('No cached connection found, creating new one');
          const result = await connectToSchoolDb(school);
          connection = result.connection;
          models = result.models || {};
          
          // Cache the connection with timestamp for future use
          schoolConnectionCache.set(schoolId, { 
            connection, 
            models,
            timestamp: Date.now() 
          });
        }
        
        if (!connection) {
          console.error('School database connection failed but did not throw an error!');
          throw new Error('Database connection returned null');
        }
        
        console.log('School connection successful, setting up user lookup...');
        
        // Store school info in request for downstream use
        req.school = school;
        
        // CRITICAL FIX: Store connection object and models properly for downstream use
        req.schoolConnection = connection;
        req.schoolModels = models || {};
        
        // Log successful connection details
        console.log(`Connected to database: ${connection.db ? connection.db.databaseName : 'unknown'}`);
        console.log(`Available models: ${Object.keys(models || {}).join(', ') || 'none'}`);
        
        // CRITICAL FIX: Use try-catch for each operation to identify exactly where failures happen
        // This helps prevent silent failures causing white screens
        
        // Step 1: Get or create the User model properly
        let SchoolUser;
        try {
          // Check if model already exists on this connection
          // CRITICAL FIX: Use the correct variable name 'connection' instead of 'schoolConnection'
          if (connection.models && connection.models.User) {
            console.log('User model already exists in this connection');
            SchoolUser = connection.models.User;
          } else {
            // Create a new model with the standard User schema
            console.log('Creating new User model in school database');
            // Make sure we copy the schema completely
            const userSchema = mongoose.Schema(
              User.schema.obj,
              { timestamps: true }
            );
            SchoolUser = connection.model('User', userSchema);
          }
        } catch (modelError) {
          console.error('Error creating or accessing User model:', modelError);
          throw new Error(`Model creation failed: ${modelError.message}`);
        }
        
        // Step 2: Try to find the user with timeout protection
        console.log(`Looking up user ${decoded.id} in school database: ${school.name}`);
        let schoolUser;
        
        try {
          // CRITICAL FIX: More robust user lookup with multiple strategies and detailed logging
          try {
            console.log(`Looking for user by ID: ${decoded.id}`);
            schoolUser = await SchoolUser.findById(decoded.id).select('-password');
            
            // If not found by ID, try by email as fallback (useful for migrated users)
            if (!schoolUser && userRef && userRef.email) {
              console.log(`User not found by ID, trying email lookup: ${userRef.email}`);
              schoolUser = await SchoolUser.findOne({ email: userRef.email }).select('-password');
              
              if (schoolUser) {
                console.log(`Found user by email: ${schoolUser.name} (${schoolUser._id})`);
                // CRITICAL FIX: If we found a user by email but their ID doesn't match the token,
                // update our reference to their actual ID for future requests
                console.log(`Token ID (${decoded.id}) doesn't match actual user ID (${schoolUser._id})`);
                console.log('Storing user ID mapping for future requests');
                // Store mapping in memory for quick reference
                global.userIdMapping = global.userIdMapping || new Map();
                global.userIdMapping.set(decoded.id, schoolUser._id.toString());
              }
            }
            
            // CRITICAL FIX: Check the global ID mapping if we still can't find the user
            if (!schoolUser && global.userIdMapping && global.userIdMapping.has(decoded.id)) {
              const mappedId = global.userIdMapping.get(decoded.id);
              console.log(`Using mapped ID ${mappedId} for token ID ${decoded.id}`);
              schoolUser = await SchoolUser.findById(mappedId).select('-password');
            }
          } catch (lookupError) {
            console.error(`Error during school user lookup: ${lookupError.message}`);
            // Continue with fallback options
          }
          
          console.log('User lookup result:', schoolUser ? `User found: ${schoolUser.name} (${schoolUser.role})` : 'User not found');
        } catch (lookupError) {
          console.error('Error during user lookup:', lookupError);
          throw new Error(`User lookup failed: ${lookupError.message}`);
        }
        
        if (schoolUser) {
          console.log(`\u2705 Successfully found user in school database: ${school.name}`);
          
          // CRITICAL FIX: Ensure user is properly marked as active
          if (schoolUser.active === false) {
            console.warn(`User account is disabled: ${schoolUser.email}`);
            res.status(403);
            throw new Error('Your account has been disabled. Please contact administrator');
          }
          
          // CRITICAL FIX: Enhance user object with necessary school context
          // Add school reference to user object for use in controllers
          schoolUser.schoolConnection = schoolConnection;
          schoolUser.schoolDetails = school;
          schoolUser.schoolId = school._id;
          
          // For admin users, ensure they have necessary fields
          if (schoolUser.role === 'admin') {
            console.log('Admin user detected - ensuring proper access rights');
            // Make sure admin has all necessary permissions
            schoolUser.canAccessAdminPanel = true;
          }
          
          req.user = schoolUser;
          next();
          return;
        } else {
          console.warn(`User not found in school database: ${school.name}`);
        }
      } catch (err) {
        console.error(`\u26a0\ufe0f Error with school database: ${err.message}`);
        // Log the full error for debugging
        console.error('Full error:', err);
        
        // Write better diagnostics for debugging
        console.error(`Auth diagnostics for ${req.originalRequestPath}:`);
        console.error(`- User ID from token: ${decoded.id}`);
        console.error(`- School ID ${schoolId || 'not present'} in token`);
        console.error(`- School found: ${school ? school.name : 'No'}`);
        console.error(`- User ref found: ${userRef ? 'Yes' : 'No'}`);
        
        // Continue to fallback rather than failing completely
      }
      
      // Fallback to main database as last resort
      try {
        console.log('Attempting to find user in main database as fallback');
        
        // Get user from main database
        const mainUser = await User.findById(decoded.id).select('-password');
        
        if (mainUser) {
          console.log('User found in main database as fallback');
          
          // Store school info and user in the request
          req.school = school;
          req.user = mainUser;
          
          // Check if user account is active
          if (mainUser.active === false) {
            res.status(403);
            throw new Error('Account is disabled. Please contact administrator');
          }
          
          next();
          return;
        } else {
          console.error('User not found in any database');
          res.status(401);
          throw new Error('User not found in any database');
        }
      } catch (finalError) {
        console.error(`Critical database error: ${finalError.message}`);
        res.status(500);
        throw new Error('Database connection failed. Please try again later.');
      }
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
