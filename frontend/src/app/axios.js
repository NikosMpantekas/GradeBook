import axios from 'axios';
import { store } from './store';

// Create axios instance with default config
const axiosInstance = axios.create();

// Add request interceptor to inject authentication token
axiosInstance.interceptors.request.use(
  (config) => {
    // Get the current state from Redux store
    const state = store.getState();
    
    // Check if user is logged in and has a token
    if (state?.auth?.user?.token) {
      // Add token to request headers
      config.headers['Authorization'] = `Bearer ${state.auth.user.token}`;
      
      // Debug log for token validation
      console.log('Adding auth token to request: ', 
        state.auth.user.token ? 'Valid token' : 'Invalid token');
    } else {
      // For debugging - log when no token is available
      console.log('No authentication token available for request:', config.url);
    }
    
    return config;
  },
  (error) => {
    // Handle request error
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle authentication errors
axiosInstance.interceptors.response.use(
  (response) => {
    // Return successful responses
    return response;
  },
  (error) => {
    // Handle authentication errors
    if (error.response && error.response.status === 401) {
      console.error('Authentication error:', error.response.data);
      
      // Clear user data from storage if unauthorized
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      
      // Redirect to login page if not already there
      if (!window.location.pathname.includes('/login')) {
        console.log('Redirecting to login due to auth error');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
