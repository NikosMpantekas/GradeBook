/**
 * Authentication configuration utility functions
 * Used to configure API requests with appropriate authentication headers
 */

/**
 * Returns the authentication configuration object for axios requests
 * Retrieves the authentication token from localStorage or sessionStorage
 * @returns {Object} Authentication configuration object with headers
 */
export const getAuthConfig = () => {
  // Try to get user data from localStorage first, then sessionStorage
  const user = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
  
  // If user exists and has token, return config with Authorization header
  if (user && user.token) {
    return {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    };
  }
  
  // Return empty config if no authentication is available
  return {
    headers: {},
  };
};
