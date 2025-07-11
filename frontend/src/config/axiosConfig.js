import axios from 'axios';
import { API_URL } from './appConfig';

/**
 * Global Axios URL Normalizer
 * 
 * This interceptor fixes the double slash issue in API URLs by normalizing
 * all URLs that contain double slashes except for the protocol (http://)
 */

// Create a custom axios instance
const axiosInstance = axios.create();

// Enhanced URL normalizer function
const normalizeUrl = (url) => {
  if (!url) return url;
  
  // Skip the protocol part (http:// or https://)
  const protocolSplit = url.split('://');
  const protocol = protocolSplit.length > 1 ? protocolSplit[0] + '://' : '';
  const path = protocolSplit.length > 1 ? protocolSplit[1] : protocolSplit[0];
  
  // Replace multiple consecutive slashes with single slash
  const normalizedPath = path.replace(/([^:]\/)\/+/g, '$1');
  
  // Put it back together
  const normalizedUrl = protocol + normalizedPath;
  
  if (url !== normalizedUrl) {
    console.log('[axiosConfig] Fixed URL:', url, '→', normalizedUrl);
  }
  
  return normalizedUrl;
};

// Request interceptor for custom axios instance
axiosInstance.interceptors.request.use(
  (config) => {
    if (config.url) {
      config.url = normalizeUrl(config.url);
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
    if (config.url) {
      config.url = normalizeUrl(config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add request debug logging
axios.interceptors.request.use(
  (config) => {
    const maskedToken = config.headers?.Authorization 
      ? 'Bearer [REDACTED]' 
      : 'None';
      
    console.log(`[REQUEST ${config.method?.toUpperCase()} ${new Date().toISOString().slice(0, 19)}] ${config.url} | Auth: ${maskedToken}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response debug logging
axios.interceptors.response.use(
  (response) => {
    console.log(`[RESPONSE ${response.status}] ${response.config.method?.toUpperCase()} ${response.config.url} - Success`);
    return response;
  },
  (error) => {
    console.error(`[RESPONSE ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status || 'Network Error'}: ${error.message}`, 
      error.response?.data || {});
    return Promise.reject(error);
  }
);

export default axiosInstance;
