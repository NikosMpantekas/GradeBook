const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Import needed models
const User = require('../models/userModel');
const School = require('../models/schoolModel');
const logger = require('./logger');

/**
 * Check if MongoDB CLI tools are available
 * @returns {Promise<boolean>}
 */
const checkMongoCLIAvailability = async () => {
  try {
    await execPromise('mongodump --version');
    return true;
  } catch (error) {
    logger.warn('BACKUP', 'MongoDB CLI tools (mongodump/mongorestore) not available', { error: error.message });
    console.warn('MongoDB CLI tools not available, will use JavaScript-based backup method');
    return false;
  }
};

/**
 * Creates a backup of MongoDB collections using native JavaScript
 * This method doesn't require MongoDB CLI tools
 * @returns {Promise<string>} Path to the backup file
 */
const createJSBackup = async () => {
  // Create backups directory if it doesn't exist
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Generate a filename with timestamp
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const backupFilename = `js-backup-${timestamp}.json`;
  const backupPath = path.join(backupDir, backupFilename);
  
  // Collect data from critical collections
  const backup = {
    timestamp,
    collections: {}
  };

  // Get data from main collections
  try {
    // Fetch all users
    const users = await User.find({}).lean();
    backup.collections.users = users;
    
    // Fetch all schools
    const schools = await School.find({}).lean();
    backup.collections.schools = schools;

    // Add more collections as needed here
    // TODO: Consider backing up other critical collections

    // Write backup to file
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    logger.info('BACKUP', `JavaScript backup created at: ${backupPath}`, { collectionsBackedUp: Object.keys(backup.collections) });
    console.log(`JavaScript backup created at: ${backupPath}`);
    
    return backupPath;
  } catch (error) {
    logger.error('BACKUP', 'Failed to create JavaScript backup', { error: error.message });
    console.error('Failed to create JavaScript backup:', error);
    throw error;
  }
};

/**
 * Restore database from JavaScript backup
 * @param {string} backupPath - Path to the JS backup file
 * @returns {Promise<void>}
 */
const restoreJSBackup = async (backupPath) => {
  try {
    // Verify backup file exists
    if (!backupPath || !fs.existsSync(backupPath)) {
      throw new Error('Invalid backup path or backup file does not exist');
    }

    // Check if this is a JavaScript backup
    if (!backupPath.includes('js-backup')) {
      throw new Error('This is not a JavaScript backup file');
    }

    // Read backup file
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    // Restore users
    if (backupData.collections.users) {
      // Clear existing users first (except superadmins for safety)
      const superadmins = await User.find({ role: 'superadmin' }).lean();
      const superadminIds = superadmins.map(user => user._id.toString());
      
      // Delete non-superadmin users
      await User.deleteMany({ _id: { $nin: superadminIds } });
      
      // Restore users from backup (excluding superadmins)
      const usersToRestore = backupData.collections.users.filter(user => 
        user.role !== 'superadmin' || !superadminIds.includes(user._id.toString())
      );
      
      if (usersToRestore.length > 0) {
        await User.insertMany(usersToRestore);
      }
      
      logger.info('RESTORE', `Restored ${usersToRestore.length} users from backup`);
    }

    // Restore schools
    if (backupData.collections.schools) {
      // Clear existing schools
      await School.deleteMany({});
      
      // Restore schools from backup
      if (backupData.collections.schools.length > 0) {
        await School.insertMany(backupData.collections.schools);
      }
      
      logger.info('RESTORE', `Restored ${backupData.collections.schools.length} schools from backup`);
    }

    // Add additional collections to restore as needed

    logger.info('RESTORE', `Database successfully restored from JavaScript backup: ${backupPath}`);
    console.log('Database successfully restored from JavaScript backup');
  } catch (error) {
    logger.error('RESTORE', 'Failed to restore from JavaScript backup', { error: error.message });
    console.error('Failed to restore from JavaScript backup:', error);
    throw error;
  }
};

/**
 * Creates a backup of the MongoDB database before running migrations
 * @returns {Promise<string>} The path to the backup file
 */
const createDatabaseBackup = async () => {
  try {
    // Create backups directory if it doesn't exist
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Check if MongoDB CLI tools are available
    const hasMongoCLI = await checkMongoCLIAvailability();
    
    // If MongoDB CLI tools aren't available, use JavaScript backup
    if (!hasMongoCLI) {
      return await createJSBackup();
    }
    
    // Original CLI-based backup approach
    // Generate a filename with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupFilename = `backup-${timestamp}.archive`;
    const backupPath = path.join(backupDir, backupFilename);
    
    // Get database connection information from mongoose
    const dbConnection = mongoose.connection;
    const dbName = dbConnection.name;
    const dbHost = dbConnection.host || 'localhost';
    const dbPort = dbConnection.port || '27017';
    
    // Build the mongodump command
    const mongodumpCmd = `mongodump --host ${dbHost} --port ${dbPort} --db ${dbName} --archive="${backupPath}"`;
    
    console.log(`Creating database backup: ${backupPath}`);
    await execPromise(mongodumpCmd);
    
    console.log(`Database backup created successfully at: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error('Database backup failed:', error);
    throw new Error(`Database backup failed: ${error.message}`);
  }
};

/**
 * Restore database from backup in case of migration failure
 * @param {string} backupPath - Path to the backup file
 * @returns {Promise<void>}
 */
const restoreDatabaseFromBackup = async (backupPath) => {
  if (!backupPath || !fs.existsSync(backupPath)) {
    throw new Error('Invalid backup path or backup file does not exist');
  }
  
  try {
    // Check if this is a JavaScript backup
    if (backupPath.includes('js-backup')) {
      return await restoreJSBackup(backupPath);
    }
    
    // This is a CLI-based backup, check if tools are available
    const hasMongoCLI = await checkMongoCLIAvailability();
    if (!hasMongoCLI) {
      throw new Error('Cannot restore CLI backup as MongoDB CLI tools are not available');
    }
    
    // Get database connection information from mongoose
    const dbConnection = mongoose.connection;
    const dbName = dbConnection.name;
    const dbHost = dbConnection.host || 'localhost';
    const dbPort = dbConnection.port || '27017';
    
    // Build the mongorestore command
    const mongorestoreCmd = `mongorestore --host ${dbHost} --port ${dbPort} --db ${dbName} --archive="${backupPath}"`;
    
    console.log(`Restoring database from backup: ${backupPath}`);
    await execPromise(mongorestoreCmd);
    
    console.log('Database restored successfully from backup');
  } catch (error) {
    console.error('Database restore failed:', error);
    throw new Error(`Database restore failed: ${error.message}`);
  }
};

module.exports = {
  createDatabaseBackup,
  restoreDatabaseFromBackup
};
