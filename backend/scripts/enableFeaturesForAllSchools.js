/**
 * Script to enable grades and notifications features for all schools
 * Run with: node scripts/enableFeaturesForAllSchools.js
 */
const mongoose = require('mongoose');
require('dotenv').config();
const School = require('../models/schoolModel');
const User = require('../models/userModel');

const enableFeaturesForAllSchools = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected!');
    
    // Find all schools
    const schools = await School.find({});
    console.log(`Found ${schools.length} schools to update`);
    
    // Update each school's feature permissions
    let updatedCount = 0;
    
    for (const school of schools) {
      // Initialize featurePermissions if it doesn't exist
      if (!school.featurePermissions) {
        school.featurePermissions = {};
      }
      
      // Enable grades and notifications
      school.featurePermissions.enableGrades = true;
      school.featurePermissions.enableNotifications = true;
      
      await school.save();
      updatedCount++;
      console.log(`Updated school: ${school.name}`);
    }
    
    console.log(`✅ Successfully updated ${updatedCount} schools!`);
    
    // Update admin user permissions as well
    console.log('\nUpdating admin permissions...');
    const adminUsers = await User.find({ role: 'admin' });
    
    let adminCount = 0;
    for (const admin of adminUsers) {
      if (!admin.adminPermissions) {
        admin.adminPermissions = {};
      }
      
      // Enable grades and notifications management
      admin.adminPermissions.canManageGrades = true;
      admin.adminPermissions.canManageNotifications = true;
      
      await admin.save();
      adminCount++;
      console.log(`Updated admin: ${admin.name}`);
    }
    
    console.log(`✅ Successfully updated ${adminCount} admin users!`);
    
    console.log('\nScript completed successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the MongoDB connection
    mongoose.disconnect();
    console.log('MongoDB connection closed');
  }
};

// Run the migration function
enableFeaturesForAllSchools();
