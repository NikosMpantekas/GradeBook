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

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from main database for authentication
      const MainUser = await getModel('main', 'User', userSchema);
      const user = await MainUser.findById(decoded.id).select('-password');

      if (!user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      // Set the user in the request object
      req.user = user;

      // Set tenant context based on user role
      if (user.role === 'superadmin') {
        // Superadmin operates in the main database by default
        // But can override with query parameter ?tenantId=xxx for tenant-specific operations
        req.tenantId = req.query.tenantId || 'main';
        
        // If a tenant ID is specified, verify it exists
        if (req.tenantId !== 'main') {
          const TenantModel = await getModel('main', 'Tenant', tenantSchema);
          const tenant = await TenantModel.findById(req.tenantId);
          
          if (!tenant) {
            res.status(400);
            throw new Error('Tenant not found');
          }
          
          // Ensure the tenant database is connected
          await connectTenantDB(req.tenantId);
        }
      } else if (user.role === 'school_owner') {
        // School owner's own tenant
        if (!user.tenantId) {
          res.status(400);
          throw new Error('School owner without tenant assignment');
        }
        req.tenantId = user.tenantId.toString();
        
        // Ensure the tenant database is connected
        await connectTenantDB(req.tenantId);
        
        // Add tenant info to request for easy access
        const TenantModel = await getModel('main', 'Tenant', tenantSchema);
        req.tenantInfo = await TenantModel.findById(req.tenantId).select('name status');
        
        if (!req.tenantInfo) {
          res.status(400);
          throw new Error('Tenant information not found');
        }
      } else {
        // Regular users (student, teacher, admin)
        if (!user.tenantId) {
          res.status(400);
          throw new Error('User not associated with any school');
        }
        
        req.tenantId = user.tenantId.toString();
        
        // Ensure the tenant database is connected
        await connectTenantDB(req.tenantId);
        
        // Add tenant info to request for easy access
        const TenantModel = await getModel('main', 'Tenant', tenantSchema);
        req.tenantInfo = await TenantModel.findById(req.tenantId).select('name status');
      }

      next();
    } catch (error) {
      console.error('Tenant resolution error:', error);
      res.status(401);
      throw new Error(error.message || 'Not authorized, token failed');
    }
  } else {
    // For public routes, we'll assume the main database
    req.tenantId = 'main';
    next();
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
