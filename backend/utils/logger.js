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
 * Write log to file
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
    
    const logString = formatEntryForOutput(entry) + '\n';
    
    // Append to log file
    fs.appendFileSync(logPath, logString);
    
    // TODO: Implement log rotation based on file size
  } catch (err) {
    console.error(`Failed to write to log file: ${err.message}`);
  }
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
  
  // Use appropriate console method based on level
  switch (level) {
    case LOG_LEVELS.DEBUG:
      console.debug(prefix, message);
      if (error || data) console.debug(error || data);
      break;
    case LOG_LEVELS.INFO:
      console.info(prefix, message);
      if (error || data) console.info(error || data);
      break;
    case LOG_LEVELS.WARN:
      console.warn(prefix, message);
      if (error || data) console.warn(error || data);
      break;
    case LOG_LEVELS.ERROR:
    case LOG_LEVELS.CRITICAL:
      console.error(prefix, message);
      if (error) {
        console.error('Error:', error.name, error.message);
        if (error.stack) console.error('Stack:', error.stack);
      } else if (data) {
        console.error('Data:', data);
      }
      break;
    default:
      console.log(prefix, message);
      if (error || data) console.log(error || data);
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
