const mongoose = require('mongoose');
const User = require('../models/userModel');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env file
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Read MongoDB URI from .env or use default
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gradebook';

// Mask credentials in URI for logging
let maskedUri = MONGO_URI;
if (MONGO_URI.includes('@')) {
  maskedUri = MONGO_URI.replace(/\/\/(.*?):(.*?)@/, '//***:***@');
}
console.log('Using MongoDB URI:', maskedUri);

/**
 * Migration script to remove legacy fields from all user accounts
 * Removes: direction, directions, school, schools, subjects
 */
const removeLegacyFields = async () => {
  try {
    // Connect to database
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    console.log('Starting migration: Removing legacy fields from all user accounts');
    
    // Update all users to remove specified fields
    const result = await User.updateMany(
      {}, // Match all users
      {
        $unset: {
          direction: 1,     // Remove single direction reference
          directions: 1,    // Remove directions array
          school: 1,        // Remove single school reference
          schools: 1,       // Remove schools array
          subjects: 1,      // Remove subjects array
        }
      },
      { multi: true }
    );

    console.log(`Migration complete!`);
    console.log(`Updated ${result.modifiedCount} user records`);
    console.log(`Matched ${result.matchedCount} records total`);

    // Disconnect from database
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

// Run the migration
removeLegacyFields();
