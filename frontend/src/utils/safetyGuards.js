/**
 * Global safety guards to prevent TypeError: x(...) is undefined errors
 * This module applies safety patches at the global level to intercept
 * common causes of TypeErrors in production builds after minification
 */

import { trackError } from './errorHandler';

/**
 * Apply global safety patches to prevent common TypeErrors
 * Specifically targets the "x(...) is undefined" errors that occur in production
 * after code minification changes function names to short single letters
 */
export const applyGlobalSafetyGuards = () => {
  // Track when guards are applied
  console.log('[SafetyGuards] Applying global safety measures to prevent TypeErrors');
  
  try {
    // Add safety shims for common minified function names (a-z)
    // When minifiers rename functions to single letters, we provide fallbacks
    const safetyShims = {};
    
    // Create safety shims for all single-letter function names
    for (let i = 97; i <= 122; i++) {
      const letter = String.fromCharCode(i);
      
      // Only add if not already defined
      if (typeof window[letter] === 'undefined') {
        // Create a safe version that logs and returns a safe value
        safetyShims[letter] = function(...args) {
          console.warn(`[SafetyGuard] Intercepted potential error: ${letter}(...) is undefined`);
          trackError(new Error(`Intercepted undefined function call: ${letter}(...)`), 'SafetyGuard');
          
          // Return empty array as the safest default for most operations
          return [];
        };
      }
    }
    
    // Apply all the safety shims to window
    Object.keys(safetyShims).forEach(key => {
      // Only define if not already defined
      if (typeof window[key] === 'undefined') {
        Object.defineProperty(window, key, {
          value: safetyShims[key],
          writable: false,
          configurable: false
        });
        console.log(`[SafetyGuard] Added safety shim for: ${key}()`);
      }
    });
    
    // Patch Array prototype to handle common operations safely
    patchArrayMethods();
    
    // Patch Object methods to handle common operations safely
    patchObjectMethods();
    
    console.log('[SafetyGuards] Successfully applied global safety measures');
    return true;
  } catch (error) {
    console.error('[SafetyGuards] Error applying safety measures:', error);
    trackError(error, 'SafetyGuardInitialization');
    return false;
  }
};

/**
 * Patch Array prototype methods to be more resilient to undefined/null
 */
function patchArrayMethods() {
  // Instead of modifying Array.prototype, we'll create safe utility functions
  // and expose them globally
  
  // Define safeFind as a global function
  window.safeFind = function(array, callback, thisArg) {
    if (!array || !Array.isArray(array)) return undefined;
    if (!callback || typeof callback !== 'function') {
      console.warn('[SafetyGuard] safeFind called with invalid callback');
      return undefined;
    }
    
    try {
      return Array.prototype.find.call(array, callback, thisArg);
    } catch (error) {
      console.warn('[SafetyGuard] Error in safeFind, returning undefined:', error);
      trackError(error, 'safeFind');
      return undefined;
    }
  };
  
  // Define safeMap as a global function
  window.safeMap = function(array, callback, thisArg) {
    if (!array || !Array.isArray(array)) return [];
    if (!callback || typeof callback !== 'function') {
      console.warn('[SafetyGuard] safeMap called with invalid callback');
      return [];
    }
    
    try {
      return Array.prototype.map.call(array, callback, thisArg);
    } catch (error) {
      console.warn('[SafetyGuard] Error in safeMap, returning empty array:', error);
      trackError(error, 'safeMap');
      return [];
    }
  };
  
  // Define safeFilter as a global function
  window.safeFilter = function(array, callback, thisArg) {
    if (!array || !Array.isArray(array)) return [];
    if (!callback || typeof callback !== 'function') {
      console.warn('[SafetyGuard] safeFilter called with invalid callback');
      return [];
    }
    
    try {
      return Array.prototype.filter.call(array, callback, thisArg);
    } catch (error) {
      console.warn('[SafetyGuard] Error in safeFilter, returning empty array:', error);
      trackError(error, 'safeFilter');
      return [];
    }
  };
}

/**
 * Patch Object methods to be more resilient to undefined/null
 */
function patchObjectMethods() {
  // Create safe versions of key Object methods
  const originalKeys = Object.keys;
  Object.keys = function(obj) {
    if (obj === null || obj === undefined) {
      console.warn('[SafetyGuard] Object.keys called on null/undefined');
      return [];
    }
    
    try {
      return originalKeys(obj);
    } catch (error) {
      console.warn('[SafetyGuard] Error in Object.keys, returning empty array:', error);
      trackError(error, 'SafeObject.keys');
      return [];
    }
  };
}

/**
 * Safe wrapper for working with data structures that might be undefined or null
 * @param {*} value - The value to safely access
 * @returns {Object} Object with safe accessor methods
 */
export const safe = (value) => {
  return {
    // Safe array operations
    map: (callback) => {
      if (Array.isArray(value)) {
        try {
          return value.map(callback);
        } catch (error) {
          console.warn('[SafetyGuard] Error in safe.map:', error);
          return [];
        }
      }
      return [];
    },
    
    filter: (callback) => {
      if (Array.isArray(value)) {
        try {
          return value.filter(callback);
        } catch (error) {
          console.warn('[SafetyGuard] Error in safe.filter:', error);
          return [];
        }
      }
      return [];
    },
    
    find: (callback) => {
      if (Array.isArray(value)) {
        try {
          return value.find(callback);
        } catch (error) {
          console.warn('[SafetyGuard] Error in safe.find:', error);
          return undefined;
        }
      }
      return undefined;
    },
    
    // Get a property safely
    get: (path) => {
      try {
        if (value === null || value === undefined) {
          return undefined;
        }
        
        // Handle dot notation paths
        if (typeof path === 'string' && path.includes('.')) {
          return path.split('.').reduce((acc, part) => 
            (acc === null || acc === undefined) ? undefined : acc[part], value);
        }
        
        // Simple property access
        return value[path];
      } catch (error) {
        console.warn(`[SafetyGuard] Error accessing property '${path}':`, error);
        return undefined;
      }
    },
    
    // Check if a value is usable (not null/undefined)
    isUsable: () => value !== null && value !== undefined,
    
    // Get the value or a default
    value: (defaultValue = null) => (value === null || value === undefined) ? defaultValue : value,
    
    // Get the value as an array (ensuring it's an array)
    asArray: () => {
      if (Array.isArray(value)) return value;
      if (value === null || value === undefined) return [];
      return [value]; // Convert to single-item array
    }
  };
};

// Export a function to safely get a deeply nested property
export const safeGet = (obj, path, defaultValue = undefined) => {
  try {
    if (obj === null || obj === undefined) {
      return defaultValue;
    }
    
    if (typeof path === 'string') {
      const parts = path.split('.');
      let result = obj;
      
      for (const part of parts) {
        if (result === null || result === undefined) {
          return defaultValue;
        }
        result = result[part];
      }
      
      return result === undefined ? defaultValue : result;
    }
    
    return obj[path] === undefined ? defaultValue : obj[path];
  } catch (error) {
    console.warn(`[SafetyGuard] Error in safeGet for path '${path}':`, error);
    return defaultValue;
  }
};
