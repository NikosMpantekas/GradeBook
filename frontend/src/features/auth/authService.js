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
    const response = await axios.post(API_URL + 'login', userData);
    console.log('Login successful - received data:', JSON.stringify(response.data));

    // Add a console log to check JWT token format
    if (response.data && response.data.token) {
      console.log('Token received - first 10 chars:', response.data.token.substring(0, 10) + '...');
    } else {
      console.error('No token received in login response!');
    }

    if (response.data) {
      // If the user wants to save credentials, store in localStorage
      if (userData.saveCredentials) {
        console.log('Storing user data in localStorage');
        localStorage.setItem('user', JSON.stringify(response.data));
      } else {
        // Store in sessionStorage if they don't want to save credentials
        console.log('Storing user data in sessionStorage');
        sessionStorage.setItem('user', JSON.stringify(response.data));
      }
      
      // Double-check that storage worked
      const storedData = userData.saveCredentials 
        ? localStorage.getItem('user') 
        : sessionStorage.getItem('user');
      
      if (storedData) {
        console.log('Storage verification - data was stored successfully');
      } else {
        console.error('Failed to store user data!');
      }
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
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
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

  const response = await axios.put(API_URL + 'profile', userData, config);

  if (response.data) {
    // Update stored user data
    if (userData.saveCredentials) {
      localStorage.setItem('user', JSON.stringify(response.data));
    } else {
      sessionStorage.setItem('user', JSON.stringify(response.data));
      localStorage.removeItem('user');
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
