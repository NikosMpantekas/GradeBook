/**
 * API Client configuration
 * Provides a centralized Axios client with error handling and timeouts
 */
import axios from 'axios';
import { API_URL } from './appConfig';
import { store } from '../store';
import { logout } from '../features/auth/authSlice';

// Create a configured Axios instance with defaults
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000, // Default 15 second timeout to prevent infinite loading
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    // Get auth state from Redux store
    const { auth } = store.getState();
    
    // If token exists, add to Authorization header
    if (auth?.user?.token) {
      config.headers.Authorization = `Bearer ${auth.user.token}`;
    }
    
    // Log outgoing requests for debugging
    console.log(`[${new Date().toISOString()}] API Request: ${config.method.toUpperCase()} ${config.url}`);
    
    return config;
  },
  (error) => {
    // Handle request errors
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses
    console.log(`[${new Date().toISOString()}] API Response: ${response.status} from ${response.config.url}`);
    return response;
  },
  (error) => {
    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout:', error.config.url);
      return Promise.reject({
        response: {
          status: 408,
          data: { message: 'Request timed out. Please try again.' }
        }
      });
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject({
        response: {
          status: 0,
          data: { message: 'Network error. Please check your connection and try again.' }
        }
      });
    }

    // Log detailed error information
    console.error(`API Error ${error.response.status}:`, error.response.data, 
      'URL:', error.config?.url, 
      'Method:', error.config?.method);

    // Handle 401 (Unauthorized) - Auto logout
    if (error.response.status === 401) {
      // Dispatch logout action only if not already in login/register page
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        console.log('Authentication expired, logging out...');
        store.dispatch(logout());
        // Don't navigate here - the authSlice will handle that
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
