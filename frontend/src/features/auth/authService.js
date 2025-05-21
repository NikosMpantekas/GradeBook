import axios from 'axios';

// API URL from environment or default for development
const API_URL = '/api/users/';

// Register user
const register = async (userData) => {
  const response = await axios.post(API_URL, userData);

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
    // Send saveCredentials preference to the backend
    const response = await axios.post(API_URL + 'login', userData);
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

// Logout user
const logout = () => {
  // Clear auth data
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
  
  // Clear sidebar state
  localStorage.removeItem('sidebarOpen');
  localStorage.removeItem('currentSection');
  
  // Clear any other app state that might persist between sessions
  sessionStorage.clear();
  
  // Force a reload to ensure all React components are freshly mounted
  // This is commented out because it will disrupt navigation in some cases
  // window.location.reload();
};

// Get current user data with populated fields
const getUserData = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(API_URL + 'me', config);
  
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
  const response = await axios.put(API_URL + 'profile', userData, config);
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
