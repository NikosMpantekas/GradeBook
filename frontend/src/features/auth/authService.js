import axios from 'axios';
import { API_URL } from '../../config/appConfig';

// API endpoints
const USERS_API = `${API_URL}/users/`;

// Register user
const register = async (userData) => {
  const response = await axios.post(USERS_API, userData);

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
    // Extract tenant from email domain if it exists
    let tenantContext = null;
    if (userData.email && userData.email.includes('@')) {
      const domain = userData.email.split('@')[1];
      // If this is a specific domain format we use for tenant identification
      if (domain.includes('.tenant.')) {
        tenantContext = domain.split('.tenant.')[0];
        console.log('Detected tenant context from email:', tenantContext);
      }
    }
    
    // Add tenant context to the login request if detected
    const loginData = {
      ...userData,
      tenantContext
    };
    
    const response = await axios.post(`${USERS_API}login`, loginData);
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

  const response = await axios.get(`${USERS_API}me`, config);
  
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
  // We use PATCH instead of PUT to only update the provided fields
  const response = await axios.patch(`${USERS_API}profile`, userData, config);
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
