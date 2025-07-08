import axios from 'axios';
import { store } from './store';

// Request deduplication cache to prevent duplicate requests
// Maps request signature (method + url + JSON.stringify(data)) to request promise
const requestCache = new Map();

// Set timeout for cache entries (300ms)
const DEDUPE_TIMEOUT = 300;

// Generate a unique client request ID
const generateRequestId = () => {
  return `req-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
};

// Create axios instance with default config
const axiosInstance = axios.create({
  headers: {
    'x-client-version': '1.6.0.196', // App version for debugging
    'x-client-platform': 'web' // Platform identifier
  }
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
    
    // For actual errors, clean up request cache
    if (error.config) {
      const method = error.config.method?.toUpperCase();
      const url = error.config.url;
      const signature = `${method}:${url}:${JSON.stringify(error.config.data || {})}`;
      requestCache.delete(signature);
      
      // Log error with request ID
      const requestId = error.config.headers['x-request-id'];
      console.error(`[ERROR ${requestId}] ${method} ${url} - ${error.message}`);
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
