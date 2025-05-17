const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const { getModel, connectTenantDB } = require('../config/multiDbManager');
const userSchema = require('../models/userModel');
const tenantSchema = require('../models/tenantModel');

/**
 * Middleware to determine tenant context from token
 * This resolves which database to use based on the authenticated user
 */
const resolveTenant = asyncHandler(async (req, res, next) => {
  let token;
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Tenant resolution started: ${req.originalUrl}`);

  // For public routes without authorization, use main database
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
    console.log(`Public route - using main database for ${req.originalUrl}`);
    req.tenantId = 'main';
    return next();
  }

  try {
    // Extract token
    token = req.headers.authorization.split(' ')[1];
    if (!token) {
      console.error('Token extraction failed - no token part found');
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(`Token verified successfully for user ID: ${decoded.id}`);
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError.message);
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }

    // Get user from main database for authentication
    try {
      const MainUser = await getModel('main', 'User', userSchema);
      const user = await MainUser.findById(decoded.id).select('-password');

      if (!user) {
        console.error(`User not found with ID: ${decoded.id}`);
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // Set the user in the request object
      req.user = user;
      console.log(`User found: ${user.email}, role: ${user.role}`);

      // Set tenant context based on user role
      if (user.role === 'superadmin') {
        // Superadmin operates in the main database by default
        // But can override with query parameter ?tenantId=xxx for tenant-specific operations
        req.tenantId = req.query.tenantId || 'main';
        console.log(`Superadmin access - using ${req.tenantId} database`);
        
        // If a tenant ID is specified, verify it exists
        if (req.tenantId !== 'main') {
          try {
            const TenantModel = await getModel('main', 'Tenant', tenantSchema);
            const tenant = await TenantModel.findById(req.tenantId);
            
            if (!tenant) {
              console.error(`Tenant not found: ${req.tenantId}`);
              return res.status(400).json({ message: 'Tenant not found' });
            }
            
            // Ensure the tenant database is connected
            await connectTenantDB(req.tenantId);
            console.log(`Connected to tenant database: ${req.tenantId}`);
          } catch (tenantError) {
            console.error(`Error accessing tenant: ${tenantError.message}`);
            return res.status(500).json({ message: 'Error accessing tenant database' });
          }
        }
      } else if (user.role === 'school_owner') {
        // School owner's own tenant
        if (!user.tenantId) {
          console.error(`School owner without tenant: ${user.email}`);
          return res.status(400).json({ message: 'School owner without tenant assignment' });
        }
        
        req.tenantId = user.tenantId.toString();
        console.log(`School owner access - using tenant: ${req.tenantId}`);
        
        // Ensure the tenant database is connected
        try {
          await connectTenantDB(req.tenantId);
          console.log(`Connected to school owner's tenant database: ${req.tenantId}`);
          
          // Add tenant info to request for easy access
          const TenantModel = await getModel('main', 'Tenant', tenantSchema);
          req.tenantInfo = await TenantModel.findById(req.tenantId).select('name status');
          
          if (!req.tenantInfo) {
            console.error(`Tenant info not found for: ${req.tenantId}`);
            return res.status(400).json({ message: 'Tenant information not found' });
          }
        } catch (tenantError) {
          console.error(`Error connecting to tenant database: ${tenantError.message}`);
          return res.status(500).json({ message: 'Error connecting to tenant database' });
        }
      } else {
        // Regular users (student, teacher, admin)
        if (!user.tenantId) {
          console.error(`User without tenant: ${user.email}, role: ${user.role}`);
          return res.status(400).json({ message: 'User not associated with any school' });
        }
        
        req.tenantId = user.tenantId.toString();
        console.log(`Regular user access - using tenant: ${req.tenantId}`);
        
        // Ensure the tenant database is connected
        try {
          await connectTenantDB(req.tenantId);
          console.log(`Connected to user's tenant database: ${req.tenantId}`);
          
          // Add tenant info to request for easy access
          const TenantModel = await getModel('main', 'Tenant', tenantSchema);
          req.tenantInfo = await TenantModel.findById(req.tenantId).select('name status');
          
          if (!req.tenantInfo) {
            console.log(`Warning: Tenant info not found for ${req.tenantId}, but continuing`);
          }
        } catch (tenantError) {
          console.error(`Error connecting to tenant database: ${tenantError.message}`);
          return res.status(500).json({ message: 'Error connecting to tenant database' });
        }
      }
      
      const elapsed = Date.now() - startTime;
      console.log(`Tenant resolution completed in ${elapsed}ms for ${req.originalUrl}`);
      next();
    } catch (userError) {
      console.error(`Error finding user: ${userError.message}`);
      return res.status(500).json({ message: 'Error retrieving user information' });
    }
  } catch (error) {
    console.error('Critical tenant resolution error:', error);
    return res.status(500).json({ message: 'Server error during tenant resolution' });
  }
});

/**
 * Middleware to restrict access to superadmin only
 */
const superadminOnly = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized, superadmin access required');
  }
});

/**
 * Middleware to restrict access to school owners and superadmins
 */
const schoolOwnerOrHigher = asyncHandler(async (req, res, next) => {
  if (req.user && (req.user.role === 'superadmin' || req.user.role === 'school_owner')) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized, school owner access required');
  }
});

/**
 * Middleware to restrict access to admins, school owners and superadmins
 */
const adminOrHigher = asyncHandler(async (req, res, next) => {
  if (req.user && (req.user.role === 'superadmin' || req.user.role === 'school_owner' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized, admin access required');
  }
});

/**
 * Middleware to restrict access to teachers and higher roles
 */
const teacherOrHigher = asyncHandler(async (req, res, next) => {
  if (req.user && (req.user.role === 'superadmin' || req.user.role === 'school_owner' || 
      req.user.role === 'admin' || req.user.role === 'teacher')) {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized, teacher access required');
  }
});

module.exports = {
  resolveTenant,
  superadminOnly,
  schoolOwnerOrHigher,
  adminOrHigher,
  teacherOrHigher
};
