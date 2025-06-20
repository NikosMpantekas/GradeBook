import axios from 'axios';
import { API_URL } from '../../config/appConfig';

// API base URL
console.log('[authService] Using API_URL from environment:', API_URL);

// Helper function for consistent API endpoint handling
const buildEndpointUrl = (path) => {
  const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

// Common API endpoint paths
const API_USERS = buildEndpointUrl('/api/users');

// Register user
const register = async (userData) => {
  const url = `${API_USERS}/`;
  console.log(`[authService] Registering at: ${url}`);
  const response = await axios.post(url, userData);

  if (response.data) {
    // If the user wants to save credentials, store in localStorage
    if (userData.saveCredentials) {
      localStorage.setItem('user', JSON.stringify(response.data));
    } else {
      // Store in sessionStorage if they don't want to save credentials
      sessionStorage.setItem('user', JSON.stringify(response.data));
    }
  }

  return response.data;
};

// Login user
const login = async (userData) => {
  console.log('Login attempt with:', { email: userData.email, saveCredentials: userData.saveCredentials });
  
  try {
    // Build proper URL using our utility function
    const loginUrl = `${API_USERS}/login`;
    console.log(`[authService] Login attempting at: ${loginUrl}`);
    
    // Make request with proper headers
    const response = await axios({
      method: 'post',
      url: loginUrl,
      data: userData,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`[authService] Login successful`);
    console.log('Login successful - received data:', JSON.stringify(response.data));

    // Validate token and refresh token
    if (response.data && response.data.token) {
      console.log('Token received - first 10 chars:', response.data.token.substring(0, 10) + '...');
      if (response.data.refreshToken) {
        console.log('Refresh token received. Session will persist longer.');
      }
    } else {
      console.error('No token received in login response!');
    }

    if (response.data) {
      // Make sure the saveCredentials flag is included in the stored data
      const dataToStore = {
        ...response.data,
        saveCredentials: userData.saveCredentials // Ensure this preference is stored with user data
      };
      
      // If the user wants to save credentials, store in localStorage (persists after browser close)
      if (userData.saveCredentials) {
        console.log('Remember me enabled: Storing user data in localStorage for persistent login');
        localStorage.setItem('user', JSON.stringify(dataToStore));
        // Clean up any session storage to avoid conflicts
        sessionStorage.removeItem('user');
      } else {
        // Store in sessionStorage if they don't want to save credentials (cleared after browser close)
        console.log('Remember me disabled: Storing user data in sessionStorage for temporary login');
        sessionStorage.setItem('user', JSON.stringify(dataToStore));
        // Clean up any local storage to avoid conflicts
        localStorage.removeItem('user');
      }
      
      // Double-check that storage worked
      const storedData = userData.saveCredentials 
        ? localStorage.getItem('user') 
        : sessionStorage.getItem('user');
      
      if (!storedData) {
        console.error('Storage verification failed - user data was not properly saved!');
      }
    } else {
      console.error('Failed to store user data!');
    }

    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error details:', error.response ? error.response.data : 'No response data');
    throw error;
  }
};

// Logout user - completely clears ALL application state
const logout = () => {
  console.log('PERFORMING COMPLETE LOGOUT AND CACHE PURGE');
  
  // Clear auth data
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
  
  // Clear sidebar state
  localStorage.removeItem('sidebarOpen');
  localStorage.removeItem('currentSection');
  
  // Clear app version data
  localStorage.removeItem('app_version');
  localStorage.removeItem('app_version_updated_at');
  
  // Thorough clearing of ALL localStorage items except critical system settings
  const keysToKeep = ['installPromptDismissed']; // Keep minimal PWA settings for UX
  
  // Clear all localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!keysToKeep.includes(key)) {
      localStorage.removeItem(key);
    }
  }
  
  // Clear all sessionStorage
  sessionStorage.clear();
  
  // Clear any cookies that might be used by the app
  document.cookie.split(';').forEach(cookie => {
    const [name] = cookie.trim().split('=');
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  });
  
  // Force reload to clear React component state and Redux store
  // Using location.replace prevents back-button navigation to the post-login state
  // Use a random cache busting parameter to prevent browser cache issues
  console.log('Redirecting to login page and forcing a complete page reload');
  const cacheBuster = new Date().getTime();
  window.location.replace(`/login?cache=${cacheBuster}`);
};

// Get user data for current user (to refresh user details)
const getUserData = async (token) => {
  if (!token) {
    console.error('No token provided to getUserData');
    throw new Error('Authentication token is required');
  }

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    timeout: 10000
  };

  // Use proper API path
  const meUrl = `${API_USERS}/me`;
  console.log(`[authService] Getting user profile from: ${meUrl}`);
  const response = await axios.get(meUrl, config);
  
  if (response.data) {
    // Update the stored user data but preserve the token
    const updatedUser = {
      ...response.data,
      token: token // Keep the original token
    };
    
    // Update in both storage locations to ensure it's available
    if (localStorage.getItem('user')) {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    
    if (sessionStorage.getItem('user')) {
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
    }
    
    return updatedUser;
  }
  
  return response.data;
};

// Update profile
const updateProfile = async (userData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  console.log('Updating profile with data:', userData);
  const profileUrl = `${API_USERS}/profile`;
  console.log(`[authService] Updating profile at: ${profileUrl}`);
  const response = await axios.put(profileUrl, userData, config);
  console.log('Profile update response:', response.data);

  if (response.data) {
    // Make sure we update both storage locations to ensure avatar persists
    // Check if data is in localStorage
    const localData = localStorage.getItem('user');
    if (localData) {
      console.log('Updating user data in localStorage with new profile');
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    
    // Check if data is in sessionStorage
    const sessionData = sessionStorage.getItem('user');
    if (sessionData) {
      console.log('Updating user data in sessionStorage with new profile');
      sessionStorage.setItem('user', JSON.stringify(response.data));
    }
    
    // If no existing storage, use preference from userData
    if (!localData && !sessionData) {
      if (userData.saveCredentials) {
        localStorage.setItem('user', JSON.stringify(response.data));
      } else {
        sessionStorage.setItem('user', JSON.stringify(response.data));
      }
    }
  }

  return response.data;
};

const authService = {
  register,
  login,
  logout,
  updateProfile,
  getUserData,
};

export default authService;
