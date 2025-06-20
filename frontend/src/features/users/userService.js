import axios from 'axios';
import { API_URL } from '../../config/appConfig';

// API URL with base URL from config - normalize path to avoid double slashes
const API_USERS = API_URL.endsWith('/') ? `${API_URL}api/users/` : `${API_URL}/api/users/`;

// Get all users (admin only)
const getUsers = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(API_USERS, config);
  return response.data;
};

// Get user by ID
const getUserById = async (userId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(API_USERS + userId, config);
  return response.data;
};

// Create new user (admin only)
const createUser = async (userData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // Use the admin-specific endpoint that properly handles password hashing
  const response = await axios.post(API_USERS + 'admin/create', userData, config);
  return response.data;
};



// Update user (admin only)
const updateUser = async (userId, userData, token) => {
  try {
    // Create detailed debug information for the request
    console.log('%c [userService] DETAILED UPDATE USER REQUEST INFO ', 'background: #3498db; color: #ffffff; font-size: 14px');
    console.log('User ID:', userId);
    console.log('Request URL:', API_USERS + userId);
    
    // Log the entire userData object with formatting for better visibility
    console.group('Request Data:');
    Object.entries(userData).forEach(([key, value]) => {
      console.log(`${key}:`, value);
    });
    console.groupEnd();
    
    // Check for any null, undefined, or empty values in the userData
    const problematicFields = Object.entries(userData)
      .filter(([key, value]) => {
        return value === null || value === undefined || 
               (Array.isArray(value) && value.length === 0 && 
                ['school', 'direction', 'subjects'].includes(key));
      })
      .map(([key]) => key);
    
    if (problematicFields.length > 0) {
      console.warn('Potentially problematic fields:', problematicFields);
    }
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const response = await axios.put(API_USERS + userId, userData, config);
    console.log('[userService] Update successful, response:', response.data);
    
    // Validate response.data to ensure it's a proper object
    if (!response.data || typeof response.data !== 'object') {
      console.warn('[userService] Received invalid response data format:', response.data);
      // Create a minimal valid response object with the user ID to prevent errors
      return { 
        _id: userId,
        ...userData, // Include the data we sent as fallback
        _responseWarning: 'Server returned invalid data format but operation may have succeeded'
      };
    }
    
    return response.data;
  } catch (error) {
    console.error('[userService] Update user error:', error);
    
    // Extract and log all error details
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('[userService] Response status:', error.response.status);
      console.error('[userService] Response headers:', error.response.headers);
      console.error('[userService] Response data:', error.response.data);
      
      // Create a more detailed error object to propagate up
      const enhancedError = new Error(
        `Server Error (${error.response.status}): ${
          typeof error.response.data === 'object' 
            ? JSON.stringify(error.response.data) 
            : error.response.data
        }`
      );
      enhancedError.serverResponse = error.response.data;
      enhancedError.status = error.response.status;
      throw enhancedError;
    } else if (error.request) {
      // The request was made but no response was received
      console.error('[userService] No response received:', error.request);
      throw new Error(`No response from server: ${error.message}`);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('[userService] Request setup error:', error.message);
      throw new Error(`Request failed: ${error.message}`);
    }
  }
};

// Delete user (admin only)
const deleteUser = async (userId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  console.log('[userService] Deleting user with ID:', userId);
  
  try {
    const response = await axios.delete(API_USERS + userId, config);
    // Ensure we return the userId so Redux can update the state properly
    return { ...response.data, id: userId };
  } catch (error) {
    console.error('[userService] Delete user error:', error);
    throw error;
  }
};

// Get users by role (for notification recipient selection)
const getUsersByRole = async (role, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(API_USERS + 'role/' + role, config);
  return response.data;
};

const userService = {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  getUsersByRole,
};

export default userService;
