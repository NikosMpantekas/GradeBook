import axios from 'axios';
import { store } from './store';
import { API_URL } from '../config/appConfig';

// Request deduplication cache to prevent duplicate requests
// Maps request signature (method + url + JSON.stringify(data)) to request promise
const requestCache = new Map();

// Set timeout for cache entries (300ms)
const DEDUPE_TIMEOUT = 300;

// Generate a unique client request ID
const generateRequestId = () => {
  return `req-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
};

// Debug logging helper for API calls
const logApiCall = (message, data) => {
  console.log(`[API] ${message}`, data);
};

// Extract domain or IP from URL for logging
const getHostFromUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch (e) {
    return 'unknown-host';
  }
};

// Check if URL uses HTTPS
const isHttpsUrl = (url) => {
  try {
    return url.startsWith('https://');
  } catch (e) {
    return false;
  }
};

// Log current API configuration
logApiCall('Base API URL', API_URL);
logApiCall('Using HTTPS', isHttpsUrl(API_URL));
logApiCall('Target host', getHostFromUrl(API_URL));

// Create axios instance with default config
const axiosInstance = axios.create({
  // Base configuration
  timeout: 30000, // 30 second timeout
  headers: {
    'x-client-version': '1.6.0.198', // App version for debugging
    'x-client-platform': 'web', // Platform identifier
    'x-client-origin': typeof window !== 'undefined' ? window.location.origin : 'unknown', // Origin tracking
    // Add custom header to help with CORS
    'x-frontend-url': typeof window !== 'undefined' ? window.location.origin : 'unknown'
  },
  // Accept all 2xx and 3xx responses, reject 5xx
  validateStatus: function (status) {
    return status >= 200 && status < 500;
  },
  // IMPORTANT: For production environments, we need proper CORS handling
  withCredentials: true // Send cookies and authentication headers cross-origin
});

// Additional security headers for better CORS handling
axiosInstance.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
axiosInstance.defaults.headers.common['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
axiosInstance.defaults.headers.common['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization';

// Log axios configuration
logApiCall('Axios instance created with custom configuration', {
  timeout: axiosInstance.defaults.timeout,
  baseHeaders: axiosInstance.defaults.headers,
  validateStatus: 'Custom validator installed'
});

// Add request interceptor for authentication and deduplication
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
    
    // Generate a unique request ID for tracing
    const requestId = generateRequestId();
    config.headers['x-request-id'] = requestId;
    
    // Only deduplicate GET, POST, PUT, DELETE requests
    // Skip OPTIONS and other special requests
    const method = config.method?.toUpperCase();
    if (['GET', 'POST', 'PUT', 'DELETE'].includes(method)) {
      // Create a request signature based on method, URL and data
      const signature = `${method}:${config.url}:${JSON.stringify(config.data || {})}`;
      
      // Check if an identical request is already in flight
      if (requestCache.has(signature)) {
        console.log(`[DUPLICATE REQUEST PREVENTED] ${method} ${config.url}`);
        
        // Return the existing request promise to prevent duplicate
        const source = axios.CancelToken.source();
        config.cancelToken = source.token;
        source.cancel(`Duplicate request prevented: ${signature}`);
      } else {
        // Add this request to the cache
        requestCache.set(signature, true);
        
        // Remove from cache after timeout
        setTimeout(() => {
          requestCache.delete(signature);
        }, DEDUPE_TIMEOUT);
        
        console.log(`[REQUEST ${requestId}] ${method} ${config.url} (unique)`);
      }
    }
    
    return config;
  },
  (error) => {
    // Handle request error
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle authentication errors and cleanup request cache
axiosInstance.interceptors.response.use(
  (response) => {
    // Get request signature for cache cleanup
    const method = response.config.method?.toUpperCase();
    const url = response.config.url;
    const signature = `${method}:${url}:${JSON.stringify(response.config.data || {})}`;
    
    // Clean up the request cache
    requestCache.delete(signature);
    
    // Log successful response with request ID for tracing
    const requestId = response.config.headers['x-request-id'];
    console.log(`[RESPONSE ${requestId}] ${method} ${url} - Status: ${response.status}`);
    
    // Return successful responses
    return response;
  },
  (error) => {
    // Don't handle axios cancellation errors (from our deduplication)
    if (axios.isCancel(error)) {
      console.log('Request cancelled:', error.message);
      return Promise.reject(error);
    }
    
    // Enhanced error logging with detailed information
    if (error.config) {
      const method = error.config.method?.toUpperCase();
      const url = error.config.url;
      const signature = `${method}:${url}:${JSON.stringify(error.config.data || {})}`;
      requestCache.delete(signature);
      
      // Extract the host for better diagnostics
      const host = getHostFromUrl(url);
      const isHttps = isHttpsUrl(url);
      
      // Log error with request ID and enhanced details
      const requestId = error.config.headers['x-request-id'] || 'unknown';
      console.error(`[ERROR ${requestId}] ${method} ${url} - ${error.message}`);
      
      // Add specific logging for network/HTTPS errors
      if (error.message === 'Network Error' && isHttps) {
        console.error(`[SSL ERROR] Connection to ${host} failed - this is likely due to an untrusted SSL certificate`);
        console.error('[SSL SOLUTION] Try using HTTP instead of HTTPS for IP-based backends, or install a trusted certificate');
      }
    }
    
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
