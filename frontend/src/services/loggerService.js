/**
 * Logger Service
 * Provides consistent logging throughout the application with additional context
 * Can be configured to send logs to external services in production
 */

// Log levels with numeric values for filtering
export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1, 
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4
};

// Default configuration
const config = {
  minLevel: process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG,
  enableConsole: true,
  logToStorage: true,
  storageKey: 'app_logs',
  maxStoredLogs: 100,
  includeTimestamps: true
};

// In-memory log store
let inMemoryLogs = [];

/**
 * Format a log entry consistently
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
    entry.data = data;
  }
  
  return entry;
};

/**
 * Store log in memory and localStorage if configured
 */
const storeLog = (entry) => {
  // Add to in-memory logs
  inMemoryLogs.push(entry);
  
  // Trim in-memory logs if they get too large
  if (inMemoryLogs.length > config.maxStoredLogs * 2) {
    inMemoryLogs = inMemoryLogs.slice(-config.maxStoredLogs);
  }
  
  // Store in localStorage if enabled
  if (config.logToStorage) {
    try {
      // Get existing logs
      const storedLogs = JSON.parse(localStorage.getItem(config.storageKey) || '[]');
      
      // Add new log
      storedLogs.push(entry);
      
      // Trim if needed
      const trimmedLogs = storedLogs.slice(-config.maxStoredLogs);
      
      // Save back to storage
      localStorage.setItem(config.storageKey, JSON.stringify(trimmedLogs));
    } catch (error) {
      // If localStorage fails, just log to console
      console.error('Failed to store log in localStorage:', error);
    }
  }
};

/**
 * Output log to console with proper formatting
 */
const logToConsole = (entry) => {
  if (!config.enableConsole) return;
  
  const { levelName, timestamp, category, message, data } = entry;
  
  // Format the prefix for the log
  const prefix = `[${levelName}]${timestamp ? ` ${timestamp}` : ''}${category ? ` [${category}]` : ''}:`;
  
  // Use appropriate console method based on level
  switch (entry.level) {
    case LOG_LEVELS.DEBUG:
      console.debug(prefix, message, data || '');
      break;
    case LOG_LEVELS.INFO:
      console.info(prefix, message, data || '');
      break;
    case LOG_LEVELS.WARN:
      console.warn(prefix, message, data || '');
      break;
    case LOG_LEVELS.ERROR:
    case LOG_LEVELS.CRITICAL:
      console.error(prefix, message, data || '');
      
      // For critical errors, also output stack trace if available
      if (data && data.stack) {
        console.error('Stack Trace:', data.stack);
      }
      break;
    default:
      console.log(prefix, message, data || '');
  }
};

/**
 * Main logging function that handles all log levels
 */
const log = (level, category, message, data = null) => {
  // Skip logs below configured minimum level
  if (level < config.minLevel) return;
  
  // Format the log entry
  const entry = formatLogEntry(level, category, message, data);
  
  // Output to console
  logToConsole(entry);
  
  // Store the log
  storeLog(entry);
  
  // For critical errors in production, you could send to an error tracking service
  if (level >= LOG_LEVELS.ERROR && process.env.NODE_ENV === 'production') {
    // TODO: Send to error tracking service
    // Example: errorTrackingService.captureError(message, data);
  }
  
  return entry;
};

// Convenience methods for different log levels
const debug = (category, message, data) => log(LOG_LEVELS.DEBUG, category, message, data);
const info = (category, message, data) => log(LOG_LEVELS.INFO, category, message, data);
const warn = (category, message, data) => log(LOG_LEVELS.WARN, category, message, data);
const error = (category, message, data) => log(LOG_LEVELS.ERROR, category, message, data);
const critical = (category, message, data) => log(LOG_LEVELS.CRITICAL, category, message, data);

/**
 * Get all stored logs (for viewing in an admin panel)
 */
const getLogs = () => {
  return [...inMemoryLogs];
};

/**
 * Get logs from localStorage
 */
const getStoredLogs = () => {
  try {
    return JSON.parse(localStorage.getItem(config.storageKey) || '[]');
  } catch (error) {
    console.error('Failed to retrieve logs from localStorage:', error);
    return [];
  }
};

/**
 * Clear all stored logs
 */
const clearLogs = () => {
  inMemoryLogs = [];
  
  if (config.logToStorage) {
    try {
      localStorage.removeItem(config.storageKey);
    } catch (error) {
      console.error('Failed to clear logs from localStorage:', error);
    }
  }
};

/**
 * Update logger configuration
 */
const configure = (newConfig) => {
  Object.assign(config, newConfig);
};

/**
 * Log and format JS errors with stack traces
 */
const logError = (category, message, error) => {
  if (error instanceof Error) {
    return log(LOG_LEVELS.ERROR, category, message, {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  } else {
    return log(LOG_LEVELS.ERROR, category, message, error);
  }
};

// Export all logging functions
const loggerService = {
  debug,
  info,
  warn,
  error,
  critical,
  logError,
  getLogs,
  getStoredLogs,
  clearLogs,
  configure
};

export default loggerService;
