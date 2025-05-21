import axios from 'axios';
import { store } from './store';

/**
 * Configure axios with global interceptors for authentication and error handling
 * This will ensure tokens are properly attached to all requests
 */
const setupAxios = () => {
  // Request interceptor - add token to all requests automatically
  axios.interceptors.request.use(
    (config) => {
      // Get the authentication state from Redux store
      const state = store.getState();
      const user = state.auth?.user;

      if (user && user.token) {
        // Add token to headers
        config.headers.Authorization = `Bearer ${user.token}`;
        console.log('Token added to request:', config.url);
      } else {
        console.log('No token available for request:', config.url);
      }

      return config;
    },
    (error) => {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor - handle authentication errors
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      // Handle 401 Unauthorized errors
      if (error.response && error.response.status === 401) {
        console.error('Authentication error - will redirect to login');
        // Clear auth data from storage
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        
        // Redirect to login page if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );
};

export default setupAxios;
