/**
 * Database Migration Script
 * 
 * This script migrates data from multiple school-specific databases
 * to a single database with multi-tenancy using the schoolId field.
 * 
 * Usage: node migrateToSingleDb.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const colors = require('colors');
const fs = require('fs');
const path = require('path');

// Import models
const School = require('../models/schoolModel');
const User = require('../models/userModel');
const Grade = require('../models/gradeModel');
const Notification = require('../models/notificationModel');
const Subject = require('../models/subjectModel');
const Direction = require('../models/directionModel');
const Subscription = require('../models/subscriptionModel');
const Contact = require('../models/contactModel');

// Import the multi-database connection utilities
const { connectToSchoolDb } = require('../config/multiDbConnect');

// Connect to the main database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 50
}).then(() => {
  console.log('Connected to main database'.cyan.bold);
  startMigration();
}).catch(err => {
  console.error(`Error connecting to main database: ${err.message}`.red.bold);
  process.exit(1);
});

// Migration stats
const stats = {
  totalSchools: 0,
  schoolsProcessed: 0,
  totalDocuments: 0,
  migratedDocuments: 0,
  errors: []
};

// Create a log file for the migration
const logStream = fs.createWriteStream(path.join(__dirname, 'migration_log.txt'), { flags: 'a' });
const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  logStream.write(logMessage + '\n');
};

// Main migration function
async function startMigration() {
  try {
    log('Starting database migration to single-database architecture'.green.bold);
    
    // Get all schools from the main database
    const schools = await School.find({});
    stats.totalSchools = schools.length;
    
    log(`Found ${schools.length} schools to migrate`);
    
    // Process each school
    for (const school of schools) {
      try {
        await migrateSchoolData(school);
        stats.schoolsProcessed++;
        log(`Completed migration for school: ${school.name} [${stats.schoolsProcessed}/${stats.totalSchools}]`.green);
      } catch (error) {
        log(`Error migrating school ${school.name}: ${error.message}`.red);
        stats.errors.push({ school: school.name, error: error.message });
      }
    }
    
    // Print migration summary
    log('\n' + '='.repeat(50));
    log('MIGRATION SUMMARY'.yellow.bold);
    log('='.repeat(50));
    log(`Total schools: ${stats.totalSchools}`);
    log(`Schools processed: ${stats.schoolsProcessed}`);
    log(`Total documents: ${stats.totalDocuments}`);
    log(`Migrated documents: ${stats.migratedDocuments}`);
    log(`Errors: ${stats.errors.length}`);
    if (stats.errors.length > 0) {
      log('\nERRORS:');
      stats.errors.forEach((err, index) => {
        log(`${index + 1}. School: ${err.school} - ${err.error}`);
      });
    }
    log('='.repeat(50) + '\n');
    
    log('Migration complete!'.green.bold);
    process.exit(0);
  } catch (error) {
    log(`Fatal error during migration: ${error.message}`.red.bold);
    console.error(error);
    process.exit(1);
  } finally {
    logStream.end();
  }
}

// Migrate data for a specific school
async function migrateSchoolData(school) {
  log(`\nMigrating data for school: ${school.name} (ID: ${school._id})`.cyan);
  
  try {
    // Connect to the school-specific database
    log(`Connecting to school database...`);
    const { connection, models } = await connectToSchoolDb(school);
    
    if (!connection) {
      throw new Error('Failed to connect to school database');
    }
    
    log(`Connected to school database: ${connection.db?.databaseName || 'unknown'}`);
    
    // Get models for this school
    const SchoolUser = connection.models.User || connection.model('User');
    const SchoolGrade = connection.models.Grade || connection.model('Grade');
    const SchoolNotification = connection.models.Notification || connection.model('Notification');
    const SchoolSubject = connection.models.Subject || connection.model('Subject');
    const SchoolDirection = connection.models.Direction || connection.model('Direction');
    const SchoolSubscription = connection.models.Subscription || connection.model('Subscription');
    const SchoolContact = connection.models.Contact || connection.model('Contact');
    
    // Migrate each collection
    await migrateCollection(SchoolUser, User, school, 'users');
    await migrateCollection(SchoolGrade, Grade, school, 'grades');
    await migrateCollection(SchoolNotification, Notification, school, 'notifications');
    await migrateCollection(SchoolSubject, Subject, school, 'subjects');
    await migrateCollection(SchoolDirection, Direction, school, 'directions');
    await migrateCollection(SchoolSubscription, Subscription, school, 'subscriptions');
    await migrateCollection(SchoolContact, Contact, school, 'contacts');
    
    // Close the connection to free resources
    log(`Closing connection to ${school.name} database`);
    await connection.close();
    
    return true;
  } catch (error) {
    log(`Error during migration for school ${school.name}: ${error.message}`.red);
    throw error;
  }
}

// Migrate a collection from school db to main db
async function migrateCollection(sourceModel, targetModel, school, collectionName) {
  try {
    log(`Migrating ${collectionName}...`);
    
    // Get all documents from the source collection
    const documents = await sourceModel.find({}).lean();
    
    if (!documents || documents.length === 0) {
      log(`No ${collectionName} found for school ${school.name}`.yellow);
      return;
    }
    
    log(`Found ${documents.length} ${collectionName} to migrate`);
    stats.totalDocuments += documents.length;
    
    // Add schoolId to each document
    const schoolId = school._id;
    const enhancedDocuments = documents.map(doc => ({
      ...doc,
      schoolId
    }));
    
    // Insert the documents into the target collection
    // Using insertMany with ordered: false to continue even if some documents fail
    try {
      const result = await targetModel.insertMany(enhancedDocuments, { 
        ordered: false,
        // Skip duplicate key errors
        skipDuplicates: true 
      });
      
      const migratedCount = result.length;
      stats.migratedDocuments += migratedCount;
      
      log(`Successfully migrated ${migratedCount}/${documents.length} ${collectionName}`.green);
    } catch (bulkError) {
      // Handle partial success case
      if (bulkError.insertedDocs && bulkError.insertedDocs.length > 0) {
        const migratedCount = bulkError.insertedDocs.length;
        stats.migratedDocuments += migratedCount;
        
        log(`Partially migrated ${migratedCount}/${documents.length} ${collectionName}`.yellow);
        log(`Some documents failed to migrate: ${bulkError.message}`.yellow);
      } else {
        throw bulkError;
      }
    }
  } catch (error) {
    log(`Error migrating ${collectionName} for school ${school.name}: ${error.message}`.red);
    stats.errors.push({ school: school.name, collection: collectionName, error: error.message });
  }
}
