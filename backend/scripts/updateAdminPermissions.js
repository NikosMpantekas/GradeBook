const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/userModel');

/**
 * Migration script to update all admin users with the correct admin permissions
 * Run this script with: node scripts/updateAdminPermissions.js
 */

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected... Updating admin permissions');
    
    try {
      // Find all admin users
      const admins = await User.find({ role: 'admin' });
      console.log(`Found ${admins.length} admin users to update`);
      
      // Default admin permissions - all enabled
      const defaultAdminPermissions = {
        canManageGrades: true,
        canSendNotifications: true,
        canManageUsers: true,
        canManageSchools: true,
        canManageDirections: true,
        canManageSubjects: true,
        canAccessReports: true,
        canManageEvents: true
      };
      
      // Update each admin with the default permissions
      let updatedCount = 0;
      for (const admin of admins) {
        // Check if the admin permissions object exists and has all required permissions
        let needsUpdate = false;
        
        if (!admin.adminPermissions) {
          console.log(`Admin ${admin.name} (${admin._id}) has no adminPermissions - adding default permissions`);
          admin.adminPermissions = defaultAdminPermissions;
          needsUpdate = true;
        } else {
          // Check each permission and add any missing ones
          Object.keys(defaultAdminPermissions).forEach(permission => {
            if (admin.adminPermissions[permission] === undefined) {
              console.log(`Admin ${admin.name} (${admin._id}) is missing ${permission} - setting to true`);
              admin.adminPermissions[permission] = true;
              needsUpdate = true;
            }
          });
        }
        
        if (needsUpdate) {
          await admin.save();
          updatedCount++;
          console.log(`Updated admin ${admin.name} (${admin._id}) with complete permissions`);
        }
      }
      
      console.log(`Successfully updated ${updatedCount} admin users with default permissions`);
      console.log('The following permissions are now enabled for all admins:');
      Object.keys(defaultAdminPermissions).forEach(permission => {
        console.log(`- ${permission}`);
      });
      
    } catch (error) {
      console.error('Error updating admin permissions:', error);
    } finally {
      mongoose.disconnect();
      console.log('MongoDB disconnected');
    }
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
  });
