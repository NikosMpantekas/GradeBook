/**
 * Redux Helper Functions
 * 
 * This utility provides helper functions for common Redux patterns
 * to ensure consistent error handling and state management.
 */

/**
 * Handle API call lifecycle with loading, success, and error states
 * @param {Object} state - The current state object
 * @param {Object} action - The action object
 * @param {string} actionType - The base action type ('fulfilled', 'pending', 'rejected')
 */
export const handleApiCallStatus = (state, action, actionType) => {
  if (actionType === 'pending') {
    state.isLoading = true;
    state.isError = false;
    state.isSuccess = false;
    state.message = '';
  } else if (actionType === 'fulfilled') {
    state.isLoading = false;
    state.isSuccess = true;
  } else if (actionType === 'rejected') {
    state.isLoading = false;
    state.isError = true;
    state.message = action.payload || 'Something went wrong';
  }
};

/**
 * Reset state to initial values
 * @param {Object} state - The state to reset
 * @param {Object} initialValues - Optional values to override defaults
 */
export const resetState = (state, initialValues = {}) => {
  state.isLoading = false;
  state.isSuccess = false;
  state.isError = false;
  state.message = '';
  
  // Apply any custom initial values
  Object.keys(initialValues).forEach(key => {
    if (state[key] !== undefined) {
      state[key] = initialValues[key];
    }
  });
};

/**
 * Safely access nested object properties
 * @param {Object} obj - The object to access
 * @param {string} path - The path to the property (e.g., 'user.profile.name')
 * @param {*} defaultValue - Default value if path doesn't exist
 */
export const safeGet = (obj, path, defaultValue = null) => {
  if (!obj || !path) return defaultValue;
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === undefined || result === null) {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result !== undefined ? result : defaultValue;
};

/**
 * Ensure an array is valid, returning empty array if not
 * @param {Array} arr - The array to check
 */
export const safeArray = (arr) => {
  return Array.isArray(arr) ? arr : [];
};
