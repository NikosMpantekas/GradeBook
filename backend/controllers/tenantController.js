const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { getModel } = require('../config/multiDbManager');
const tenantSchema = require('../models/tenantModel').schema;
const userSchema = require('../models/userModel').schema;
const jwt = require('jsonwebtoken');

// @desc    Create a new tenant with an owner account
// @route   POST /api/tenants
// @access  Private/SuperAdmin
const createTenant = asyncHandler(async (req, res) => {
  const { 
    name, 
    databaseName, 
    contactEmail, 
    contactPhone, 
    ownerName, 
    ownerEmail, 
    ownerPassword,
    maxUsers,
    settings
  } = req.body;

  // Validate required fields
  if (!name || !databaseName || !contactEmail || !ownerName || !ownerEmail || !ownerPassword) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Enforce superadmin access only
  if (req.user.role !== 'superadmin') {
    res.status(403);
    throw new Error('Not authorized to create tenants');
  }

  // Get models from main database
  const Tenant = await getModel('main', 'Tenant', tenantSchema);
  const User = await getModel('main', 'User', userSchema);

  // Check if tenant name already exists
  const existingTenant = await Tenant.findOne({ 
    $or: [
      { name: name },
      { databaseName: databaseName }
    ]
  });

  if (existingTenant) {
    res.status(400);
    throw new Error('Tenant with this name or database name already exists');
  }

  // Check if owner email already exists
  const existingUser = await User.findOne({ email: ownerEmail });

  if (existingUser) {
    res.status(400);
    throw new Error('User with this email already exists');
  }

  try {
    // Hash the owner's password first
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ownerPassword, salt);
    
    // Create a temporary owner document to get an ID, but don't save it yet
    const ownerTemp = new User({
      name: ownerName,
      email: ownerEmail,
      password: hashedPassword,
      role: 'school_owner'
    });
    
    // Now create the tenant with the owner reference
    const tenant = await Tenant.create({
      name,
      databaseName,
      contactEmail,
      contactPhone: contactPhone || '',
      maxUsers: maxUsers || 100,
      settings: settings || {},
      createdBy: req.user._id,
      status: 'active',
      owner: ownerTemp._id  // Set the owner reference before saving the tenant
    });

    // Now finalize the owner account with the tenant reference
    ownerTemp.tenantId = tenant._id;
    const owner = await ownerTemp.save();

    // Initialize the tenant's database with basic collections
    // (This will be done automatically when accessing the tenant's database)

    res.status(201).json({
      tenant: {
        _id: tenant._id,
        name: tenant.name,
        databaseName: tenant.databaseName,
        status: tenant.status,
        contactEmail: tenant.contactEmail,
        maxUsers: tenant.maxUsers
      },
      owner: {
        _id: owner._id,
        name: owner.name,
        email: owner.email,
        role: owner.role
      }
    });
  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500);
    throw new Error('Failed to create tenant: ' + error.message);
  }
});

// @desc    Get all tenants
// @route   GET /api/tenants
// @access  Private/SuperAdmin
const getTenants = asyncHandler(async (req, res) => {
  // Enforce superadmin access only
  if (req.user.role !== 'superadmin') {
    res.status(403);
    throw new Error('Not authorized to view tenants');
  }

  const Tenant = await getModel('main', 'Tenant', tenantSchema);
  const User = await getModel('main', 'User', userSchema);

  const tenants = await Tenant.find().sort({ createdAt: -1 });

  // Get owner details for each tenant
  const tenantsWithOwners = await Promise.all(tenants.map(async (tenant) => {
    const owner = await User.findById(tenant.owner).select('-password');
    return {
      _id: tenant._id,
      name: tenant.name,
      databaseName: tenant.databaseName,
      status: tenant.status,
      contactEmail: tenant.contactEmail,
      contactPhone: tenant.contactPhone,
      maxUsers: tenant.maxUsers,
      createdAt: tenant.createdAt,
      owner: owner ? {
        _id: owner._id,
        name: owner.name,
        email: owner.email
      } : null
    };
  }));

  res.json(tenantsWithOwners);
});

// @desc    Get tenant by ID
// @route   GET /api/tenants/:id
// @access  Private/SuperAdmin
const getTenantById = asyncHandler(async (req, res) => {
  // Enforce superadmin access only
  if (req.user.role !== 'superadmin') {
    res.status(403);
    throw new Error('Not authorized to view tenant details');
  }

  const Tenant = await getModel('main', 'Tenant', tenantSchema);
  const User = await getModel('main', 'User', userSchema);

  const tenant = await Tenant.findById(req.params.id);

  if (!tenant) {
    res.status(404);
    throw new Error('Tenant not found');
  }

  // Get owner details
  const owner = await User.findById(tenant.owner).select('-password');

  res.json({
    _id: tenant._id,
    name: tenant.name,
    databaseName: tenant.databaseName,
    status: tenant.status,
    contactEmail: tenant.contactEmail,
    contactPhone: tenant.contactPhone,
    maxUsers: tenant.maxUsers,
    settings: tenant.settings,
    createdAt: tenant.createdAt,
    owner: owner ? {
      _id: owner._id,
      name: owner.name,
      email: owner.email
    } : null
  });
});

// @desc    Update tenant
// @route   PUT /api/tenants/:id
// @access  Private/SuperAdmin
const updateTenant = asyncHandler(async (req, res) => {
  // Enforce superadmin access only
  if (req.user.role !== 'superadmin') {
    res.status(403);
    throw new Error('Not authorized to update tenants');
  }

  const Tenant = await getModel('main', 'Tenant', tenantSchema);

  const tenant = await Tenant.findById(req.params.id);

  if (!tenant) {
    res.status(404);
    throw new Error('Tenant not found');
  }

  // Update the tenant
  const updatedTenant = await Tenant.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json(updatedTenant);
});

// @desc    Delete tenant (DANGEROUS - only soft delete is recommended)
// @route   DELETE /api/tenants/:id
// @access  Private/SuperAdmin
const deleteTenant = asyncHandler(async (req, res) => {
  // Enforce superadmin access only
  if (req.user.role !== 'superadmin') {
    res.status(403);
    throw new Error('Not authorized to delete tenants');
  }

  const Tenant = await getModel('main', 'Tenant', tenantSchema);

  const tenant = await Tenant.findById(req.params.id);

  if (!tenant) {
    res.status(404);
    throw new Error('Tenant not found');
  }

  // Soft delete by changing status to 'suspended'
  tenant.status = 'suspended';
  await tenant.save();

  res.json({ message: 'Tenant suspended', id: req.params.id });

  // NOTE: We don't actually delete the database or users because that would be dangerous
  // A real deletion would require careful planning and backup procedures
});

// @desc    Create first superadmin account (to be run once during initial setup)
// @route   POST /api/tenants/create-superadmin
// @access  Public (but requires environment variable authorization)
const createSuperAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, setupKey } = req.body;

  // Verify setup key against environment variable
  if (!setupKey || setupKey !== process.env.SUPERADMIN_SETUP_KEY) {
    res.status(401);
    throw new Error('Invalid setup key');
  }

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please add all fields');
  }

  const User = await getModel('main', 'User', userSchema);

  // Check if superadmin already exists
  const superAdminExists = await User.findOne({ role: 'superadmin' });

  if (superAdminExists) {
    res.status(400);
    throw new Error('Superadmin account already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create superadmin user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'superadmin',
  });

  if (user) {
    res.status(201).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid superadmin data');
  }
});

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Get a tenant by owner (for school_owner users)
// @route   GET /api/tenants/owner
// @access  Private/SchoolOwner
const getTenantByOwner = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] getTenantByOwner called by user ${req.user?.email}`);

  try {
    // Check if user is authenticated
    if (!req.user) {
      console.error('No authenticated user found');
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Allow both superadmin and school_owner to access this endpoint
    if (req.user.role !== 'superadmin' && req.user.role !== 'school_owner') {
      console.error(`User ${req.user.email} with role ${req.user.role} tried to access tenant owner endpoint`);
      return res.status(403).json({ message: 'Not authorized. Only school owners can access this endpoint' });
    }

    // For school owners, find tenant by owner ID
    if (req.user.role === 'school_owner') {
      console.log(`Looking up tenant for school owner: ${req.user._id}`);
      
      // Directly use tenantId from user object if available for better performance
      if (req.user.tenantId) {
        try {
          // Get the Tenant model from the main database
          const Tenant = await getModel('main', 'Tenant', tenantSchema);
          
          // Find the tenant directly by ID
          const tenant = await Tenant.findById(req.user.tenantId);
          
          if (tenant) {
            console.log(`Found tenant by ID: ${tenant.name}`);
            const elapsed = Date.now() - startTime;
            console.log(`Tenant retrieval completed in ${elapsed}ms`);
            return res.status(200).json(tenant);
          }
          
          // Fallback to finding by owner if ID lookup fails
          console.log('Tenant not found by ID, falling back to owner lookup');
        } catch (idLookupError) {
          console.error('Error looking up tenant by ID:', idLookupError);
          // Continue with owner lookup as fallback
        }
      }
      
      try {
        // Get the Tenant model from the main database
        const Tenant = await getModel('main', 'Tenant', tenantSchema);
        
        // Find a tenant where the owner is the current user
        const tenant = await Tenant.findOne({ owner: req.user._id });
        
        if (tenant) {
          console.log(`Found tenant by owner: ${tenant.name}`);
          const elapsed = Date.now() - startTime;
          console.log(`Tenant retrieval completed in ${elapsed}ms`);
          return res.status(200).json(tenant);
        } else {
          console.error(`No tenant found for owner ${req.user._id}`);
          
          // Return a default tenant object with basic info to prevent white screens
          return res.status(200).json({
            _id: req.user.tenantId || 'default',
            name: 'Your School',
            status: 'active',
            error: 'Tenant details not found',
            _notFound: true
          });
        }
      } catch (ownerLookupError) {
        console.error('Error looking up tenant by owner:', ownerLookupError);
        
        // Return a default tenant object with basic info to prevent white screens
        return res.status(200).json({
          _id: req.user.tenantId || 'default',
          name: 'Your School',
          status: 'active',
          error: 'Error retrieving tenant details',
          _notFound: true
        });
      }
    }
    
    // Superadmins can specify a tenant ID via query parameter
    if (req.user.role === 'superadmin') {
      const tenantId = req.query.tenantId;
      
      if (!tenantId) {
        console.log('Superadmin accessed without specifying tenant ID');
        return res.status(200).json({
          _id: 'main',
          name: 'Main System',
          status: 'active',
          isSuperadminView: true
        });
      }
      
      try {
        // Get the Tenant model from the main database
        const Tenant = await getModel('main', 'Tenant', tenantSchema);
        
        // Find the tenant by ID
        const tenant = await Tenant.findById(tenantId);
        
        if (tenant) {
          console.log(`Superadmin found tenant: ${tenant.name}`);
          return res.status(200).json(tenant);
        } else {
          console.error(`Superadmin: No tenant found with ID ${tenantId}`);
          return res.status(200).json({
            _id: tenantId,
            name: 'Unknown School',
            status: 'unknown',
            error: 'Tenant not found',
            _notFound: true
          });
        }
      } catch (lookupError) {
        console.error('Superadmin error looking up tenant:', lookupError);
        return res.status(200).json({
          _id: tenantId,
          name: 'Error',
          status: 'error',
          error: 'Error retrieving tenant details',
          _notFound: true
        });
      }
    }
  } catch (error) {
    console.error('Unexpected error in getTenantByOwner:', error);
    
    // Return a minimal tenant object to prevent white screens
    return res.status(200).json({
      _id: req.user?.tenantId || 'error',
      name: 'Error',
      status: 'error',
      error: 'An unexpected error occurred',
      _notFound: true
    });
  }
});

// @desc    Get statistics for a tenant
// @route   GET /api/tenants/:id/stats
// @access  Private/SchoolOwner or Admin
const getTenantStats = asyncHandler(async (req, res) => {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] getTenantStats called for tenant ${req.params.id} by user ${req.user?.email}`);
  
  try {
    // Ensure user has proper permissions
    if (!req.user) {
      console.error('No authenticated user found');
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (req.user.role !== 'superadmin' && 
        req.user.role !== 'school_owner' && 
        req.user.role !== 'admin') {
      console.error(`User ${req.user.email} with role ${req.user.role} tried to access tenant stats`);
      return res.status(403).json({ message: 'Not authorized to access tenant statistics' });
    }

    // Validate tenant ID
    const tenantId = req.params.id;
    if (!tenantId) {
      console.error('No tenant ID provided');
      return res.status(400).json({ message: 'Tenant ID is required' });
    }
    
    // Additional authorization check - only allow if it's the user's tenant 
    // or they are a superadmin
    if (req.user.role !== 'superadmin') {
      const userTenantId = req.user.tenantId?.toString();
      
      if (!userTenantId) {
        console.error(`User ${req.user.email} has no associated tenant`);
        return res.status(400).json({ message: 'User not associated with any tenant' });
      }
      
      if (userTenantId !== tenantId) {
        console.error(`User tenant mismatch: ${userTenantId} vs ${tenantId}`);
        return res.status(403).json({ message: 'Not authorized to access statistics for this tenant' });
      }
    }
    
    console.log(`Getting stats for tenant ${tenantId}`);
    
    // Define default stats in case of errors
    const defaultStats = {
      totalUsers: 0,
      totalStudents: 0,
      totalTeachers: 0,
      totalAdmins: 0
    };
    
    try {
      // Get the User model for this tenant
      const UserModel = await getModel(tenantId, 'User', userSchema);
      console.log(`Successfully got User model for tenant ${tenantId}`);
      
      // Get counts of users by role using Promise.all for better performance
      const [totalUsers, totalStudents, totalTeachers, totalAdmins] = await Promise.all([
        UserModel.countDocuments({}).exec(),
        UserModel.countDocuments({ role: 'student' }).exec(),
        UserModel.countDocuments({ role: 'teacher' }).exec(),
        UserModel.countDocuments({ role: 'admin' }).exec()
      ]);
      
      const stats = {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalAdmins
      };
      
      const elapsed = Date.now() - startTime;
      console.log(`Tenant stats retrieved in ${elapsed}ms:`, stats);
      
      return res.status(200).json(stats);
    } catch (modelError) {
      console.error(`Error getting user counts for tenant ${tenantId}:`, modelError);
      
      // Return default stats instead of error to prevent white screens
      console.log('Returning default stats due to error');
      return res.status(200).json(defaultStats);
    }
  } catch (error) {
    console.error('Unexpected error in getTenantStats:', error);
    
    // Return default stats even in case of unexpected errors to prevent white screens
    return res.status(200).json({
      totalUsers: 0,
      totalStudents: 0,
      totalTeachers: 0,
      totalAdmins: 0,
      error: 'Error retrieving statistics'
    });
  }
});

// @desc    Invite a user to join a tenant
// @route   POST /api/tenants/:id/invite
// @access  Private/SchoolOwner or Admin
const inviteUserToTenant = asyncHandler(async (req, res) => {
  try {
    const { email, role, name } = req.body;
    const tenantId = req.params.id;
    
    // Validate input
    if (!email || !role) {
      res.status(400);
      throw new Error('Please provide email and role for the invited user');
    }
    
    // Check if the requesting user has permission to invite users
    if (!req.user || (req.user.role !== 'superadmin' && 
        req.user.role !== 'school_owner' && 
        req.user.role !== 'admin')) {
      res.status(403);
      throw new Error('Not authorized to invite users');
    }
    
    // Check if the user is inviting to their own tenant (except for superadmin)
    if (req.user.role !== 'superadmin' && 
        (!req.user.tenantId || req.user.tenantId.toString() !== tenantId)) {
      res.status(403);
      throw new Error('You can only invite users to your own tenant');
    }
    
    // Get the Tenant model
    const Tenant = await getModel('main', 'Tenant', tenantSchema);
    
    // Verify tenant exists
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      res.status(404);
      throw new Error('Tenant not found');
    }
    
    // Generate a temporary invite token
    const inviteToken = crypto.randomBytes(20).toString('hex');
    
    // Store the invite in the database (this would need a separate model)
    // For now, we'll just send back success response
    
    // In a real implementation, you would:
    // 1. Create an entry in an Invites collection
    // 2. Send an email to the invitee with a signup link containing the token
    
    res.status(200).json({
      message: `Invitation sent to ${email}`,
      inviteToken: inviteToken, // in production, you wouldn't return this
      tenantId: tenantId,
      role: role
    });
  } catch (error) {
    console.error('Error inviting user to tenant:', error);
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Error inviting user');
  }
});

module.exports = {
  getTenants,
  createTenant,
  getTenantById,
  updateTenant,
  deleteTenant,
  getTenantStats,
  inviteUserToTenant,
  createSuperAdmin,
  getTenantByOwner,
  generateToken
};
