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
  const response = await axios.post(API_URL + 'login', userData);

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

// Logout user
const logout = () => {
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
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
};

export default authService;
