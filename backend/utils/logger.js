/**
 * Backend Logger Utility
 * Provides consistent logging throughout the backend with timestamps and formatting
 * Can be configured to write to console, file, or external services
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

// Log levels with numeric values for filtering
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4
};

// Default configuration - can be overridden in environment
const config = {
  minLevel: process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG,
  enableConsole: true,
  enableFileLogging: process.env.NODE_ENV === 'production',
  logDirectory: process.env.LOG_DIR || 'logs',
  logFileName: process.env.LOG_FILE || 'gradebook-app.log',
  errorLogFileName: process.env.ERROR_LOG_FILE || 'gradebook-error.log',
  maxLogSize: 10 * 1024 * 1024, // 10MB
  includeTimestamps: true,
  includeContext: true
};

// Ensure log directory exists
if (config.enableFileLogging) {
  const logDir = path.resolve(process.cwd(), config.logDirectory);
  if (!fs.existsSync(logDir)) {
    try {
      fs.mkdirSync(logDir, { recursive: true });
    } catch (err) {
      console.error(`Failed to create log directory: ${err.message}`);
      config.enableFileLogging = false; // Disable file logging if directory creation fails
    }
  }
}

/**
 * Format a log entry with consistent structure
 * @param {number} level - Log level from LOG_LEVELS
 * @param {string} category - Category/module of the log
 * @param {string} message - Log message
 * @param {Object} [data] - Additional data to log
 * @returns {Object} Formatted log entry
 */
const formatLogEntry = (level, category, message, data = null) => {
  const timestamp = config.includeTimestamps ? new Date().toISOString() : null;
  
  const entry = {
    level,
    levelName: Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === level),
    timestamp,
    category,
    message
  };
  
  if (data) {
    // Handle Error objects specially
    if (data instanceof Error) {
      entry.error = {
        name: data.name,
        message: data.message,
        stack: data.stack
      };
    } else {
      entry.data = data;
    }
  }
  
  return entry;
};

/**
 * Format an entry for text output (console/file)
 * @param {Object} entry - Log entry object 
 * @returns {string} Formatted log string
 */
const formatEntryForOutput = (entry) => {
  const { levelName, timestamp, category, message, error, data } = entry;
  
  let output = `[${levelName}]`;
  if (timestamp) output += ` ${timestamp}`;
  if (category) output += ` [${category}]`;
  output += `: ${message}`;
  
  if (error) {
    output += `\nError: ${error.name}: ${error.message}`;
    if (error.stack) {
      output += `\nStack: ${error.stack}`;
    }
  } else if (data) {
    // For objects, format them nicely with indentation
    const formattedData = typeof data === 'object' 
      ? util.inspect(data, { depth: 4, colors: false }) 
      : data;
    output += `\nData: ${formattedData}`;
  }
  
  return output;
};

/**
 * Clean up old backup log files (older than 30 days)
 * @param {string} logDir - Log directory path
 */
const cleanupOldBackups = (logDir) => {
  try {
    if (fs.existsSync(logDir)) {
      const files = fs.readdirSync(logDir);
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      files.forEach(file => {
        if (file.includes('.log.') && file.match(/\.log\.\d{4}-\d{2}-\d{2}$/)) {
          const filePath = path.join(logDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime.getTime() < thirtyDaysAgo) {
            fs.unlinkSync(filePath);
            console.log(`Cleaned up old backup log: ${file}`);
          }
        }
      });
    }
  } catch (err) {
    console.error(`Failed to cleanup old backup logs: ${err.message}`);
  }
};

/**
 * Rotate log files based on age (7 days)
 * @param {string} logPath - Path to log file
 */
const rotateLogFile = (logPath) => {
  try {
    if (fs.existsSync(logPath)) {
      const stats = fs.statSync(logPath);
      const fileAge = Date.now() - stats.mtime.getTime();
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      
      if (fileAge > sevenDaysInMs) {
        // Create backup with timestamp
        const backupPath = logPath + '.' + new Date().toISOString().split('T')[0];
        fs.renameSync(logPath, backupPath);
        
        // Create new empty log file
        fs.writeFileSync(logPath, '');
        console.log(`Log file rotated: ${logPath} -> ${backupPath}`);
        
        // Clean up old backups
        const logDir = path.dirname(logPath);
        cleanupOldBackups(logDir);
      }
    }
  } catch (err) {
    console.error(`Failed to rotate log file: ${err.message}`);
  }
};

// Log buffer for batching writes
let logBuffer = [];
let bufferFlushTimeout = null;
const BUFFER_SIZE = 10;
const BUFFER_FLUSH_INTERVAL = 1000; // 1 second

/**
 * Flush log buffer to file
 * @param {string} logPath - Path to log file
 */
const flushLogBuffer = async (logPath) => {
  if (logBuffer.length === 0) return;
  
  try {
    const logsToWrite = [...logBuffer];
    logBuffer = []; // Clear buffer
    
    const logString = logsToWrite.join('');
    
    // Use async file write
    await fs.promises.appendFile(logPath, logString);
  } catch (err) {
    console.error(`Failed to flush log buffer: ${err.message}`);
    // Put logs back in buffer if write failed
    logBuffer = [...logBuffer, ...logsToWrite];
  }
};

/**
 * Write log to file (optimized with buffering)
 * @param {Object} entry - Log entry
 */
const writeToFile = (entry) => {
  if (!config.enableFileLogging) return;
  
  try {
    const logPath = path.resolve(
      process.cwd(), 
      config.logDirectory, 
      entry.level >= LOG_LEVELS.ERROR ? config.errorLogFileName : config.logFileName
    );
    
    // Check file rotation periodically (not on every log)
    if (Math.random() < 0.1) { // 10% chance to check rotation
      rotateLogFile(logPath);
    }
    
    const logString = formatEntryForOutput(entry) + '\n';
    
    // Add to buffer
    logBuffer.push(logString);
    
    // Flush buffer if full or set timeout for periodic flush
    if (logBuffer.length >= BUFFER_SIZE) {
      flushLogBuffer(logPath);
    } else if (!bufferFlushTimeout) {
      bufferFlushTimeout = setTimeout(() => {
        flushLogBuffer(logPath);
        bufferFlushTimeout = null;
      }, BUFFER_FLUSH_INTERVAL);
    }
  } catch (err) {
    console.error(`Failed to buffer log: ${err.message}`);
  }
};

/**
 * Format data object with IP addresses highlighted in blue
 * @param {Object} data - Data object to format
 * @returns {Object} Formatted data with colored IP addresses
 */
const formatDataWithColors = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const BLUE = '\x1b[34m';  // ANSI blue color
  const RESET = '\x1b[0m';  // ANSI reset color
  
  const formatted = { ...data };
  
  // Color IP addresses blue
  if (formatted.ip) {
    formatted.ip = `${BLUE}${formatted.ip}${RESET}`;
  }
  
  return formatted;
};

/**
 * Log to console with appropriate formatting and colors
 * @param {Object} entry - Log entry
 */
const logToConsole = (entry) => {
  if (!config.enableConsole) return;
  
  const { level, levelName, timestamp, category, message, error, data } = entry;
  
  // Format the prefix with colors
  const prefix = `[${levelName}]${timestamp ? ` ${timestamp}` : ''}${category ? ` [${category}]` : ''}:`;
  
  // Format data with colored IP addresses
  const coloredData = data ? formatDataWithColors(data) : null;
  
  // Use appropriate console method based on level
  switch (level) {
    case LOG_LEVELS.DEBUG:
      console.debug(prefix, message);
      if (error || coloredData) console.debug(error || coloredData);
      break;
    case LOG_LEVELS.INFO:
      console.info(prefix, message);
      if (error || coloredData) console.info(error || coloredData);
      break;
    case LOG_LEVELS.WARN:
      console.warn(prefix, message);
      if (error || coloredData) console.warn(error || coloredData);
      break;
    case LOG_LEVELS.ERROR:
    case LOG_LEVELS.CRITICAL:
      console.error(prefix, message);
      if (error) {
        console.error('Error:', error.name, error.message);
        if (error.stack) console.error('Stack:', error.stack);
      } else if (coloredData) {
        console.error('Data:', coloredData);
      }
      break;
    default:
      console.log(prefix, message);
      if (error || coloredData) console.log(error || coloredData);
  }
};

/**
 * Main logging function
 * @param {number} level - Log level from LOG_LEVELS
 * @param {string} category - Category/module of the log
 * @param {string} message - Log message
 * @param {Object|Error} [data] - Additional data or Error object
 * @returns {Object} The log entry
 */
const log = (level, category, message, data = null) => {
  // Skip logs below configured minimum level
  if (level < config.minLevel) return null;
  
  // Format the log entry
  const entry = formatLogEntry(level, category, message, data);
  
  // Log to console
  logToConsole(entry);
  
  // Write to file if enabled
  writeToFile(entry);
  
  return entry;
};

// Convenience methods for different log levels
const debug = (category, message, data) => log(LOG_LEVELS.DEBUG, category, message, data);
const info = (category, message, data) => log(LOG_LEVELS.INFO, category, message, data);
const warn = (category, message, data) => log(LOG_LEVELS.WARN, category, message, data);
const error = (category, message, data) => log(LOG_LEVELS.ERROR, category, message, data);
const critical = (category, message, data) => log(LOG_LEVELS.CRITICAL, category, message, data);

/**
 * Update logger configuration
 * @param {Object} newConfig - New configuration options
 */
const configure = (newConfig) => {
  Object.assign(config, newConfig);
};

/**
 * Format and log an error with stack trace
 * @param {string} category - Error category
 * @param {string} message - Error message
 * @param {Error} err - Error object
 */
const logError = (category, message, err) => {
  return log(LOG_LEVELS.ERROR, category, message, err);
};

module.exports = {
  debug,
  info,
  warn,
  error,
  critical,
  logError,
  configure,
  LOG_LEVELS
};
