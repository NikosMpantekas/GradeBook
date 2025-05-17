const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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
  try {
    // Check if user is a school owner
    if (!req.user || req.user.role !== 'school_owner') {
      res.status(403);
      throw new Error('Not authorized. Only school owners can access this endpoint');
    }

    // Get the Tenant model from the main database
    const Tenant = await getModel('main', 'Tenant', tenantSchema);
    
    // Find a tenant where the owner is the current user
    const tenant = await Tenant.findOne({ owner: req.user._id });
    
    if (!tenant) {
      res.status(404);
      throw new Error('No tenant found linked to your account');
    }
    
    res.json(tenant);
  } catch (error) {
    console.error('Error fetching tenant by owner:', error);
    res.status(error.statusCode || 500);
    throw new Error(error.message || 'Error retrieving tenant');
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
