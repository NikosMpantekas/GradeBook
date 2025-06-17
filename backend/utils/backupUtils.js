const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

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
