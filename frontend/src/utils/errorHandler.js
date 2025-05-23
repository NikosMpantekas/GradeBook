/**
 * Global Error Handler
 * Provides comprehensive error tracking and logging throughout the application
 */

// Track all active error listeners
const errorListeners = [];

/**
 * Initialize global error handlers to catch unhandled errors
 * This will catch errors that happen outside of React's error boundaries
 */
export const initGlobalErrorHandlers = () => {
  // Remove any existing handlers first to prevent duplicates
  window.removeEventListener('error', handleGlobalError);
  window.removeEventListener('unhandledrejection', handlePromiseRejection);
  
  // Add global error handlers
  window.addEventListener('error', handleGlobalError);
  window.addEventListener('unhandledrejection', handlePromiseRejection);
  
  console.log('[ErrorHandler] Global error handlers initialized');
};

/**
 * Handle global errors (synchronous)
 */
const handleGlobalError = (event) => {
  const { message, filename, lineno, colno, error } = event;
  
  // Create error info object
  const errorInfo = {
    type: 'GlobalError',
    message,
    source: filename,
    line: lineno,
    column: colno,
    stack: error?.stack || 'No stack trace available',
    timestamp: new Date().toISOString(),
    errorId: `ERR_${Date.now().toString(36)}_${Math.floor(Math.random() * 1000)}`
  };
  
  // Log the error with a distinctive pattern
  logError(errorInfo);
  
  // Notify all listeners
  notifyListeners(errorInfo);
  
  // Store in localStorage for debugging
  storeErrorInLocalStorage(errorInfo);
};

/**
 * Handle unhandled promise rejections
 */
const handlePromiseRejection = (event) => {
  const { reason } = event;
  
  // Create error info object
  const errorInfo = {
    type: 'UnhandledPromiseRejection',
    message: reason?.message || String(reason),
    stack: reason?.stack || 'No stack trace available',
    timestamp: new Date().toISOString(),
    errorId: `ERR_${Date.now().toString(36)}_${Math.floor(Math.random() * 1000)}`
  };
  
  // Log the error with a distinctive pattern
  logError(errorInfo);
  
  // Notify all listeners
  notifyListeners(errorInfo);
  
  // Store in localStorage for debugging
  storeErrorInLocalStorage(errorInfo);
};

/**
 * Logs an error with a consistent, distinctive format for easier identification in logs
 */
export const logError = (errorInfo) => {
  console.error(`\n🔴 ====== GLOBAL ERROR CAUGHT (${errorInfo.errorId}) ====== 🔴`);
  console.error(`⏰ Time: ${errorInfo.timestamp}`);
  console.error(`🏷️ Type: ${errorInfo.type}`);
  
  if (errorInfo.message) {
    console.error(`📝 Message: ${errorInfo.message}`);
  }
  
  if (errorInfo.source) {
    console.error(`📂 Source: ${errorInfo.source}:${errorInfo.line}:${errorInfo.column}`);
  }
  
  // Check for common Redux errors
  if (
    (errorInfo.message && errorInfo.message.includes('undefined')) ||
    (errorInfo.stack && errorInfo.stack.includes('dispatch'))
  ) {
    console.error(`🔄 Possible Redux Error Detected`);
    
    // Look for Redux-related patterns in the stack trace
    const stack = errorInfo.stack || '';
    if (stack.includes('slice') || stack.includes('reducer') || stack.includes('action')) {
      console.error(`💡 Redux Pattern Detected in Stack Trace`);
      
      // Try to extract Redux slice name from stack trace
      const sliceMatch = stack.match(/([a-zA-Z]+)Slice/);
      if (sliceMatch && sliceMatch[1]) {
        console.error(`🧩 Possible Redux Slice Involved: ${sliceMatch[1]}Slice`);
      }
    }
    
    // Suggest common fixes for Redux errors
    console.error('\n🔧 Potential Redux Fixes:');
    console.error('1. Check if all actions are properly exported from their slice files');
    console.error('2. Ensure all reducers in createSlice have matching exports');
    console.error('3. Verify no direct imports from slice.actions are being used in component body');
    console.error('4. Look for dynamic imports or requires that might fail in production');
  }
  
  console.error('\n📋 Stack Trace:');
  console.error(errorInfo.stack);
  
  console.error(`🔴 ====== END OF ERROR ${errorInfo.errorId} ====== 🔴\n`);
};

/**
 * Store error in localStorage for debugging across refreshes
 */
const storeErrorInLocalStorage = (errorInfo) => {
  try {
    const existingErrors = JSON.parse(localStorage.getItem('gradebook_global_errors') || '[]');
    existingErrors.push(errorInfo);
    
    // Keep only the last 10 errors
    if (existingErrors.length > 10) {
      existingErrors.shift();
    }
    
    localStorage.setItem('gradebook_global_errors', JSON.stringify(existingErrors));
  } catch (e) {
    console.error('Failed to store error in localStorage:', e);
  }
};

/**
 * Add a listener to be notified when errors occur
 * @param {Function} listener Function to call with error info when an error occurs
 * @returns {Function} Function to remove the listener
 */
export const addErrorListener = (listener) => {
  if (typeof listener !== 'function') {
    console.warn('[ErrorHandler] Listener must be a function');
    return () => {};
  }
  
  errorListeners.push(listener);
  
  // Return a function to remove this listener
  return () => {
    const index = errorListeners.indexOf(listener);
    if (index !== -1) {
      errorListeners.splice(index, 1);
    }
  };
};

/**
 * Notify all listeners of an error
 */
const notifyListeners = (errorInfo) => {
  errorListeners.forEach(listener => {
    try {
      listener(errorInfo);
    } catch (e) {
      console.error('[ErrorHandler] Error in error listener:', e);
    }
  });
};

/**
 * Manually track an error from anywhere in the application
 * @param {Error|string} error Error object or error message
 * @param {string} source Source of the error (e.g., component name)
 */
export const trackError = (error, source = 'Unknown') => {
  const errorInfo = {
    type: 'TrackedError',
    message: error?.message || String(error),
    source,
    stack: error?.stack || 'No stack trace available',
    timestamp: new Date().toISOString(),
    errorId: `ERR_${Date.now().toString(36)}_${Math.floor(Math.random() * 1000)}`
  };
  
  logError(errorInfo);
  notifyListeners(errorInfo);
  storeErrorInLocalStorage(errorInfo);
  
  return errorInfo.errorId;
};

/**
 * Create a safe wrapper around a function to catch and log errors
 * @param {Function} fn Function to wrap
 * @param {string} source Source identifier for error tracking
 * @returns {Function} Wrapped function that catches errors
 */
export const createSafeFunction = (fn, source = 'Unknown') => {
  if (typeof fn !== 'function') {
    console.warn(`[ErrorHandler] Cannot create safe function from non-function: ${typeof fn}`);
    return () => null;
  }
  
  return (...args) => {
    try {
      return fn(...args);
    } catch (error) {
      trackError(error, `SafeFunction(${source})`);
      return null;
    }
  };
};
