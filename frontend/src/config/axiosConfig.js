import axios from 'axios';
import { API_URL } from './appConfig';

/**
 * Global Axios URL Normalizer
 * 
 * This interceptor fixes the double slash issue in API URLs by normalizing
 * all URLs that contain //api to use a single slash /api
 */

// Create a custom axios instance
const axiosInstance = axios.create();

// Request interceptor to fix double slashes in URLs
axiosInstance.interceptors.request.use(
  (config) => {
    // If the URL has a double slash after the domain, fix it
    if (config.url && config.url.includes('//api')) {
      console.log('[axiosConfig] Fixing double slash URL:', config.url);
      
      // Replace all instances of //api with /api
      config.url = config.url.replace(/\/\/api/g, '/api');
      
      console.log('[axiosConfig] Fixed URL:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a global interceptor to the default axios instance as well
axios.interceptors.request.use(
  (config) => {
    // If the URL has a double slash after the domain, fix it
    if (config.url && config.url.includes('//api')) {
      console.log('[axiosConfig] Fixing double slash URL:', config.url);
      
      // Replace all instances of //api with /api
      config.url = config.url.replace(/\/\/api/g, '/api');
      
      console.log('[axiosConfig] Fixed URL:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
