const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const School = require('../models/schoolModel');
const Notification = require('../models/notificationModel');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// @desc    Create a new school owner (admin)
// @route   POST /api/superadmin/create-school-owner
// @access  Private/SuperAdmin
const createSchoolOwner = asyncHandler(async (req, res) => {
  const { name, email, password, schoolName, schoolAddress, schoolEmail, emailDomain } = req.body;

  if (!name || !email || !password || !schoolName || !schoolAddress || !emailDomain) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Check if domain is valid format
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
  if (!domainRegex.test(emailDomain)) {
    res.status(400);
    throw new Error('Please provide a valid email domain (e.g., school.com)');
  }

  // Check if school with email domain already exists
  const schoolExists = await School.findOne({ emailDomain });
  if (schoolExists) {
    res.status(400);
    throw new Error('School with this email domain already exists');
  }

  // Check if user with email already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User with this email already exists');
  }

  try {
    // CRITICAL FIX: Extract database name from email domain (schoolclustername.com -> schoolclustername)
    // This ensures users with @schoolclustername.com emails connect to the correct database
    const domainParts = emailDomain.split('.');
    const dbName = domainParts[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    console.log(`Creating database with name derived from domain: ${emailDomain} -> ${dbName}`);
    
    // Create database configuration using the domain name as the database name
    const dbConfig = {
      // Use the domain prefix as the database name
      dbName: dbName
    };
    
    // Create school first
    const school = await School.create({
      name: schoolName,
      address: schoolAddress,
      email: schoolEmail || email, // Use provided school email or fallback to admin email
      emailDomain,
      dbConfig: dbConfig, // Store the database configuration
      active: true,
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin user for the school with schoolId for multi-tenancy
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin', // School owner is an admin
      schoolDomain: emailDomain,
      active: true,
      school: school._id, // Legacy field - keeping for compatibility
      schoolId: school._id, // New field for multi-tenancy
    });

    if (user) {
      // In single-database architecture, we don't need to set up a separate database
      // Just log that the school and user were created successfully
      console.log(`Created school ${schoolName} with ID ${school._id}`);
      console.log(`Created school admin user with email ${email} and schoolId ${school._id}`);
      
      // Note about the migration
      console.log(`IMPORTANT: No additional database setup required with new single-database architecture`)

      res.status(201).json({
        message: 'School owner created successfully',
        user: {
          _id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        school: {
          _id: school.id,
          name: school.name,
          emailDomain: school.emailDomain,
        },
      });
    } else {
      // If user creation failed, delete the school to maintain consistency
      await School.findByIdAndDelete(school._id);
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    res.status(400);
    throw new Error(`Failed to create school owner: ${error.message}`);
  }
});

// @desc    Get all school owners (admins)
// @route   GET /api/superadmin/school-owners
// @access  Private/SuperAdmin
const getSchoolOwners = asyncHandler(async (req, res) => {
  // Find all admin users with their associated schools
  const schoolOwners = await User.find({ role: 'admin' })
    .select('-password')
    .populate('school', 'name address email emailDomain active');

  res.status(200).json(schoolOwners);
});

// @desc    Get school owner by ID
// @route   GET /api/superadmin/school-owners/:id
// @access  Private/SuperAdmin
const getSchoolOwnerById = asyncHandler(async (req, res) => {
  const schoolOwner = await User.findById(req.params.id)
    .select('-password')
    .populate('school', 'name address email emailDomain active dbConfig');

  if (!schoolOwner) {
    res.status(404);
    throw new Error('School owner not found');
  }

  res.status(200).json(schoolOwner);
});

// @desc    Update school owner status (enable/disable)
// @route   PUT /api/superadmin/school-owners/:id/status
// @access  Private/SuperAdmin
const updateSchoolOwnerStatus = asyncHandler(async (req, res) => {
  const { active } = req.body;

  if (active === undefined) {
    res.status(400);
    throw new Error('Please provide active status');
  }

  const user = await User.findById(req.params.id);

  if (!user || user.role !== 'admin') {
    res.status(404);
    throw new Error('School owner not found');
  }

  // Update user active status
  user.active = active;
  await user.save();

  // Also update the school's active status
  if (user.school) {
    const school = await School.findById(user.school);
    if (school) {
      school.active = active;
      await school.save();
    }
  }

  res.status(200).json({
    message: `School owner ${active ? 'enabled' : 'disabled'} successfully`,
    _id: user.id,
    name: user.name,
    active: user.active,
  });
});

// @desc    Create a first superadmin account (temporary endpoint for setup)
// @route   POST /api/superadmin/create-first-superadmin
// @access  Public (but checks for existing superadmins)
const createFirstSuperAdmin = asyncHandler(async (req, res) => {
  // Check if any superadmin already exists
  const superAdminExists = await User.findOne({ role: 'superadmin' });

  if (superAdminExists) {
    res.status(400);
    throw new Error('A superadmin account already exists');
  }

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please add all fields');
  }

  // Check if user exists with this email
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
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
    active: true,
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

// @desc    Delete a school owner (admin)
// @route   DELETE /api/superadmin/school-owners/:id
// @access  Private/SuperAdmin
const deleteSchoolOwner = asyncHandler(async (req, res) => {
  try {
    // Find the school owner by ID
    const schoolOwner = await User.findById(req.params.id);

    if (!schoolOwner) {
      res.status(404);
      throw new Error('School owner not found');
    }

    // Verify that the user is an admin (school owner)
    if (schoolOwner.role !== 'admin') {
      res.status(400);
      throw new Error('User is not a school owner');
    }

    // Find the associated school
    const school = await School.findById(schoolOwner.school);
    
    if (!school) {
      console.log('Warning: School not found for this owner, proceeding with deletion anyway');
    } else {
      console.log(`Found associated school: ${school.name}`);
      
      // We could optionally disable the school here but we'll keep it 
      // in case there are other admins or it needs to be reassigned
      console.log(`School ${school.name} will remain in the system`);
    }

    // Delete the school owner
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({ 
      message: 'School owner deleted successfully',
      id: req.params.id
    });
  } catch (error) {
    console.error('Error deleting school owner:', error.message);
    res.status(500);
    throw new Error('Failed to delete school owner: ' + error.message);
  }
});

// @desc    Update school owner permissions
// @route   PUT /api/superadmin/school-owner/:id/permissions
// @access  Private/SuperAdmin
const updateSchoolOwnerPermissions = asyncHandler(async (req, res) => {
  const { permissions } = req.body;

  if (!permissions) {
    res.status(400);
    throw new Error('Please provide permissions to update');
  }

  const user = await User.findById(req.params.id);

  if (!user || user.role !== 'admin') {
    res.status(404);
    throw new Error('School owner not found');
  }

  console.log(`PERMISSIONS: Updating school owner ${user.name} (${user._id}) permissions:`, {
    current: user.adminPermissions || 'none',
    requested: permissions
  });

  // Initialize adminPermissions if it doesn't exist
  if (!user.adminPermissions) {
    user.adminPermissions = {
      canManageGrades: true,
      canSendNotifications: true,
      canManageUsers: true,
      canManageSchools: true,
      canManageDirections: true,
      canManageSubjects: true,
      canAccessReports: true,
      canManageEvents: true
    };
  }

  // Update admin permissions
  user.adminPermissions = {
    ...user.adminPermissions,
    ...permissions
  };

  await user.save();
  console.log(`PERMISSIONS: Updated school owner ${user.name} permissions:`, user.adminPermissions);

  // Update all other admin users with the same school to have matching permissions
  if (user.schoolId || user.school) {
    const schoolId = user.schoolId || user.school;
    
    try {
      // Find other admin users with the same school
      const otherAdmins = await User.find({
        _id: { $ne: user._id }, // Exclude the current user
        role: 'admin',
        $or: [
          { schoolId: schoolId },
          { school: schoolId }
        ]
      });
      
      if (otherAdmins.length > 0) {
        console.log(`PERMISSIONS: Found ${otherAdmins.length} other admins to sync permissions with`);
        
        // Update each admin's permissions
        for (const admin of otherAdmins) {
          // Initialize adminPermissions if it doesn't exist
          admin.adminPermissions = admin.adminPermissions || {};
          
          // Update only the permissions that were changed
          for (const [key, value] of Object.entries(permissions)) {
            admin.adminPermissions[key] = value;
          }
          
          await admin.save();
          console.log(`PERMISSIONS: Synced permissions for admin ${admin.name} (${admin._id})`);
        }
      }
    } catch (error) {
      console.error(`PERMISSIONS: Error syncing other admins' permissions:`, error.message);
    }
  }

  res.status(200).json({
    message: 'School owner permissions updated successfully. These permissions will apply to all users in the school.',
    _id: user.id,
    name: user.name,
    adminPermissions: user.adminPermissions,
  });
});

// @desc    Send superadmin notifications with filters
// @route   POST /api/superadmin/notifications
// @access  Private/SuperAdmin
const sendSuperAdminNotification = asyncHandler(async (req, res) => {
  const { title, message, recipientType, schoolId, userId } = req.body;

  if (!title || !message || !recipientType) {
    res.status(400);
    throw new Error('Please provide title, message, and recipient type');
  }

  console.log(`📢 SUPERADMIN NOTIFICATION: Sending notification titled "${title}" to ${recipientType}`);

  try {
    let recipients = [];
    
    // Get superadmin user details for notification metadata
    const superAdminUser = await User.findById(req.user._id).select('name email');
    if (!superAdminUser) {
      res.status(404);
      throw new Error('SuperAdmin user not found');
    }

    // Filter recipients based on type
    switch (recipientType) {
      case 'all_admins':
        recipients = await User.find({ role: 'admin', active: true })
          .select('_id name email schoolId school')
          .populate('schoolId', '_id name')
          .populate('school', '_id name');
        console.log(`📢 Found ${recipients.length} admin users to notify`);
        break;

      case 'all_users':
        recipients = await User.find({ active: true })
          .select('_id name email role schoolId school')
          .populate('schoolId', '_id name')
          .populate('school', '_id name');
        console.log(`📢 Found ${recipients.length} total users to notify`);
        break;

      case 'specific_school':
        if (!schoolId) {
          res.status(400);
          throw new Error('Please provide schoolId for specific school notifications');
        }
        recipients = await User.find({ 
          $or: [{ schoolId: schoolId }, { school: schoolId }],
          active: true 
        })
          .select('_id name email role schoolId school')
          .populate('schoolId', '_id name')
          .populate('school', '_id name');
        console.log(`📢 Found ${recipients.length} users in school ${schoolId} to notify`);
        break;

      case 'specific_user':
        if (!userId) {
          res.status(400);
          throw new Error('Please provide userId for specific user notifications');
        }
        const specificUser = await User.findById(userId)
          .select('_id name email role schoolId school')
          .populate('schoolId', '_id name')
          .populate('school', '_id name');
        if (!specificUser) {
          res.status(404);
          throw new Error('User not found');
        }
        recipients = [specificUser];
        console.log(`📢 Sending notification to specific user: ${specificUser.name} (${specificUser.email})`);
        break;

      default:
        res.status(400);
        throw new Error('Invalid recipient type. Use: all_admins, all_users, specific_school, or specific_user');
    }

    if (recipients.length === 0) {
      res.status(404);
      throw new Error('No recipients found for the specified filter');
    }

    // Create notifications for each recipient
    const notifications = [];
    for (const recipient of recipients) {
      // Determine the schoolId for this notification
      const recipientSchoolId = recipient.schoolId?._id || recipient.school?._id;
      
      if (!recipientSchoolId) {
        console.warn(`⚠️ Warning: Recipient ${recipient.name} has no associated school, skipping notification`);
        continue;
      }
      
      // Create notification data with all required fields
      const notificationData = {
        title,
        message,
        sender: req.user._id,
        senderName: superAdminUser.name,
        senderRole: 'admin', // Use 'admin' instead of 'superadmin' as it's not in enum
        schoolId: recipientSchoolId, // Required field
        recipients: [recipient._id], // Array of recipients
        targetRole: 'all', // Default target role
        sendToAll: false,
        status: 'sent',
        deliveryStats: {
          totalRecipients: 1,
          delivered: 1,
          read: 0
        }
      };
      
      console.log(`📢 Creating notification for ${recipient.name} in school ${recipientSchoolId}`);
      
      const notification = await Notification.create(notificationData);
      notifications.push(notification);
    }

    console.log(`📢 SUPERADMIN NOTIFICATION: Successfully created ${notifications.length} notifications`);

    res.status(201).json({
      message: `Notification sent successfully to ${recipients.length} recipient(s)`,
      recipientCount: recipients.length,
      recipientType,
      notificationId: notifications[0]?._id, // Return first notification ID for reference
      recipients: recipients.map(r => ({ id: r._id, name: r.name, email: r.email, role: r.role }))
    });

  } catch (error) {
    console.error('❌ SUPERADMIN NOTIFICATION ERROR:', error.message);
    res.status(500);
    throw new Error(`Failed to send notification: ${error.message}`);
  }
});

// @desc    Get schools for superadmin notification filtering
// @route   GET /api/superadmin/schools
// @access  Private/SuperAdmin
const getSchoolsForNotifications = asyncHandler(async (req, res) => {
  try {
    // Only fetch main schools (not branches) - parentCluster should be null
    const schools = await School.find({ 
      active: true,
      $or: [
        { parentCluster: null },
        { parentCluster: { $exists: false } }
      ]
    })
      .select('_id name emailDomain isClusterSchool')
      .sort({ name: 1 });

    console.log(`📚 SUPERADMIN: Found ${schools.length} main schools (excluding branches) for notifications`);
    
    // Log which schools are being returned for debugging
    schools.forEach(school => {
      console.log(`  - ${school.name} (${school.emailDomain}) - isCluster: ${school.isClusterSchool || false}`);
    });

    res.status(200).json(schools);
  } catch (error) {
    console.error('❌ SUPERADMIN SCHOOLS ERROR:', error.message);
    res.status(500);
    throw new Error(`Failed to fetch schools: ${error.message}`);
  }
});

// @desc    Search users for superadmin notification targeting
// @route   GET /api/superadmin/users/search
// @access  Private/SuperAdmin
const searchUsersForNotifications = asyncHandler(async (req, res) => {
  try {
    const { query, role, schoolId } = req.query;
    
    console.log(`🔍 SUPERADMIN USER SEARCH: Starting search with params:`, { query, role, schoolId });
    
    let searchFilter = { active: true };
    let andConditions = [];
    
    // Add text search if query provided
    if (query && query.trim()) {
      andConditions.push({
        $or: [
          { name: { $regex: query.trim(), $options: 'i' } },
          { email: { $regex: query.trim(), $options: 'i' } }
        ]
      });
      console.log(`  - Added text search for: "${query.trim()}"`);
    }
    
    // Filter by role if provided
    if (role && role !== 'all') {
      searchFilter.role = role;
      console.log(`  - Added role filter: ${role}`);
    }
    
    // Filter by school if provided (fixed - no longer overwrites $or)
    if (schoolId && schoolId.trim()) {
      andConditions.push({
        $or: [
          { schoolId: schoolId },
          { school: schoolId }
        ]
      });
      console.log(`  - Added school filter: ${schoolId}`);
    }
    
    // Combine all conditions properly
    if (andConditions.length > 0) {
      searchFilter.$and = andConditions;
    }
    
    console.log(`  - Final search filter:`, JSON.stringify(searchFilter, null, 2));
    
    const users = await User.find(searchFilter)
      .select('_id name email role schoolId school')
      .populate('schoolId', 'name emailDomain')
      .populate('school', 'name emailDomain') // Also populate legacy school field
      .sort({ name: 1 })
      .limit(50); // Limit results for performance

    console.log(`🔍 SUPERADMIN USER SEARCH: Found ${users.length} users matching criteria`);
    
    // Log sample results for debugging
    if (users.length > 0) {
      console.log(`  - Sample results:`);
      users.slice(0, 3).forEach(user => {
        const schoolName = user.schoolId?.name || user.school?.name || 'No school';
        console.log(`    * ${user.name} (${user.email}) - ${user.role} - ${schoolName}`);
      });
    } else {
      console.log(`  - No users found with current filters`);
    }

    res.status(200).json(users);
  } catch (error) {
    console.error('❌ SUPERADMIN USER SEARCH ERROR:', error.message);
    console.error('❌ Full error:', error);
    res.status(500);
    throw new Error(`Failed to search users: ${error.message}`);
  }
});

// REMOVED: Legacy school feature permission functions
// - updateSchoolFeaturePermissionsFromAdmin: Helper function that synced admin permissions with school.featurePermissions
// - updateSchoolFeaturePermissions: API endpoint that managed school.featurePermissions
// The broken school function permission toggle system has been completely removed.
// Features are now controlled by a new superadmin-only toggle system that will be implemented separately.

// @desc    Get system logs for superadmin
// @route   GET /api/superadmin/logs
// @access  Private (SuperAdmin only)
const getSystemLogs = asyncHandler(async (req, res) => {
  const { lines = 100, level = 'all', category = 'all' } = req.query;
  
  try {
    const logDir = path.resolve(process.cwd(), 'logs');
    const logFiles = [];
    
    // Get available log files
    if (fs.existsSync(logDir)) {
      const files = fs.readdirSync(logDir);
      files.forEach(file => {
        if (file.endsWith('.log')) {
          logFiles.push({
            name: file,
            path: path.join(logDir, file),
            size: fs.statSync(path.join(logDir, file)).size
          });
        }
      });
    }
    
    // Read log content from files
    const logs = [];
    for (const file of logFiles) {
      try {
        const content = fs.readFileSync(file.path, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        
        // Parse and format log entries
        const parsedLines = lines.map(line => {
          try {
            // Parse log format: [LEVEL] timestamp [CATEGORY]: message
            const match = line.match(/^\[(\w+)\]\s+([^\s]+)\s+\[([^\]]+)\]:\s+(.+)$/);
            if (match) {
              return {
                level: match[1],
                timestamp: match[2],
                category: match[3],
                message: match[4],
                source: file.name
              };
            }
            return { raw: line, source: file.name };
          } catch (err) {
            return { raw: line, source: file.name };
          }
        });
        
        logs.push(...parsedLines);
      } catch (err) {
        logger.error('SUPERADMIN', `Failed to read log file: ${file.name}`, err);
      }
    }
    
    // Filter by level and category if specified
    let filteredLogs = logs;
    if (level !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.level === level.toUpperCase());
    }
    if (category !== 'all') {
      filteredLogs = filteredLogs.filter(log => log.category === category);
    }
    
    // Limit number of lines
    const maxLines = Math.min(parseInt(lines) || 100, 1000); // Cap at 1000 lines
    filteredLogs = filteredLogs.slice(-maxLines);
    
    res.json({
      success: true,
      data: {
        logs: filteredLogs,
        totalFiles: logFiles.length,
        totalLines: logs.length,
        filteredLines: filteredLogs.length,
        availableLevels: ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'],
        availableCategories: [...new Set(logs.map(log => log.category).filter(Boolean))]
      }
    });
    
  } catch (error) {
    logger.error('SUPERADMIN', 'Failed to retrieve system logs', error);
    res.status(500);
    throw new Error('Failed to retrieve system logs');
  }
});

// @desc    Get PM2 process status and logs
// @route   GET /api/superadmin/pm2-status
// @access  Private (SuperAdmin only)
const getPM2Status = asyncHandler(async (req, res) => {
  const { exec } = require('child_process');
  const util = require('util');
  const execAsync = util.promisify(exec);
  
  try {
    // Get PM2 process list
    const { stdout: pm2List } = await execAsync('pm2 list --json');
    const processes = JSON.parse(pm2List);
    
    // Get PM2 logs for each process
    const processesWithLogs = [];
    for (const process of processes) {
      try {
        const { stdout: logs } = await execAsync(`pm2 logs ${process.name} --lines 50 --nostream`);
        processesWithLogs.push({
          ...process,
          logs: logs.split('\n').filter(line => line.trim())
        });
      } catch (err) {
        processesWithLogs.push({
          ...process,
          logs: [`Error reading logs: ${err.message}`]
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        processes: processesWithLogs,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('SUPERADMIN', 'Failed to retrieve PM2 status', error);
    res.status(500);
    throw new Error('Failed to retrieve PM2 status');
  }
});

module.exports = {
  createSchoolOwner,
  getSchoolOwners,
  getSchoolOwnerById,
  updateSchoolOwnerStatus,
  deleteSchoolOwner,
  createFirstSuperAdmin,
  updateSchoolOwnerPermissions,
  sendSuperAdminNotification,
  getSchoolsForNotifications,
  searchUsersForNotifications,
  getSystemLogs,
  getPM2Status
};
