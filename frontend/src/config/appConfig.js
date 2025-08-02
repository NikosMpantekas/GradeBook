/**
 * Application configuration
 */

// App version 
export const appConfig = {
  name: 'GradeBook',
  version: '1.6.1.96',
  author: 'GradeBook Team'
};

// API URL from environment variables - proper way without hardcoding
let API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Production configuration - enforce HTTPS to prevent mixed content errors
if (process.env.NODE_ENV === 'production') {
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  
  // Case 1: Render.com deployment - use same origin
  if (currentHostname.includes('render.com')) {
    API_URL = window.location.origin;
    console.log('[appConfig] Render.com detected, using same origin:', API_URL);
  }
  // Case 2: Netlify deployment - enforce HTTPS for backend
  else if (currentHostname.includes('netlify.app') || currentHostname.includes('netlify.com')) {
    if (process.env.REACT_APP_API_URL) {
      API_URL = process.env.REACT_APP_API_URL;
      
      // Check if this is an IP-based backend with potential SSL issues
      const isIPAddress = /^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(API_URL);
      
      if (isIPAddress && API_URL.startsWith('https://')) {
        console.log('[appConfig] WARNING: IP-based HTTPS backend detected - browser may show "not secure"');
        console.log('[appConfig] This is normal for self-signed certificates. App will work after accepting risk.');
        
        // Option: Uncomment next 3 lines to force HTTP for IP backends (less secure but no warnings)
        // API_URL = API_URL.replace('https://', 'http://');
        // console.log('[appConfig] FALLBACK: Converted HTTPS to HTTP for IP backend:', API_URL);
      } else if (API_URL.startsWith('http://') && !isIPAddress) {
        // Force HTTPS for domain names only
        API_URL = API_URL.replace('http://', 'https://');
        console.log('[appConfig] SECURITY: Converted HTTP to HTTPS for domain backend:', API_URL);
      }
      
      console.log('[appConfig] Netlify detected, using API_URL:', API_URL);
    }
  }
  
  // Fallback: Ensure any HTTP URLs are converted to HTTPS in production
  if (API_URL.startsWith('http://')) {
    API_URL = API_URL.replace('http://', 'https://');
    console.log('[appConfig] FALLBACK: Converted HTTP to HTTPS in production:', API_URL);
  }
}

// Debug logging
console.log('[appConfig] Environment:', process.env.NODE_ENV);
console.log('[appConfig] Using API_URL:', API_URL);

// Special handling for Cloudflare Tunnels
if (API_URL.includes('.trycloudflare.com') || API_URL.includes('tunnel.')) {
  console.log('[appConfig] 🔥 Cloudflare Tunnel detected - using trusted SSL:', API_URL);
}

// Add warnings for insecure or problematic configurations
if (process.env.NODE_ENV === 'production') {
  // Warning for localhost in production
  if (API_URL.includes('localhost')) {
    console.warn('[appConfig] WARNING: Using localhost in production environment!');
    console.warn('[appConfig] Set REACT_APP_API_URL in your production environment');
  }
  
  // Warning for HTTP in production (security risk)
  if (API_URL.startsWith('http://') && !API_URL.includes('localhost')) {
    console.warn('[appConfig] SECURITY WARNING: Using insecure HTTP in production!');
    console.warn('[appConfig] Consider using HTTPS for your API endpoint');
  }
}

// Utility function to safely concatenate API URL with path
// Prevents double slash issue (//api) by normalizing both base URL and path
// @param {string} path - API endpoint path (with or without leading slash)
// @returns {string} - Properly concatenated URL
export function getApiUrl(path) {
  if (!path) return API_URL;
  
  // Remove trailing slash from API_URL if it exists
  const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  
  // Ensure path starts with a slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Return properly concatenated URL
  return `${baseUrl}${normalizedPath}`;
}

// Helper function to construct API endpoint URLs properly, avoiding double slashes
// We declare this as a regular const and export it in the main export section below
const buildApiUrl = (endpoint) => {
  // Ensure API_URL doesn't have a trailing slash
  const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  
  // Ensure endpoint has a leading slash but no trailing slash
  const normalizedEndpoint = endpoint.startsWith('/') 
    ? endpoint 
    : `/${endpoint}`;
  
  // Remove any trailing slash from the endpoint
  const cleanEndpoint = normalizedEndpoint.endsWith('/') 
    ? normalizedEndpoint.slice(0, -1) 
    : normalizedEndpoint;
    
  return `${baseUrl}${cleanEndpoint}`;
};

// We export API_URL in the main export section below
// Don't export it here to avoid duplicate exports

// IMMEDIATE SELF-EXECUTING FUNCTION TO NUKE ALL VERSION DATA
(function() {
  if (typeof window !== 'undefined') {
    try {
      // NUCLEAR OPTION: Clear absolutely EVERYTHING that could trigger an update
      console.log(' NUCLEAR OPTION: Removing ALL version data');
      
      // Clear every possible storage key related to versioning
      const keysToNuke = [
        'app_version',
        'app_version_updated_at',
        'update_notification_disabled',
        'update_shown_for_version',
        'global_updates_shown',
        'last_shown_update_version',
        'update_notification_shown_session',
        'pwa_installed',
        'sw_registered',
        'sw_version',
        'version_history',
        'update_available',
        'update_ready'
      ];
      
      // Nuke from localStorage
      keysToNuke.forEach(key => {
        try { localStorage.removeItem(key); } catch (e) {}
      });
      
      // Nuke from sessionStorage
      keysToNuke.forEach(key => {
        try { sessionStorage.removeItem(key); } catch (e) {}
      });
      
      // Also clear any key that might be related to updates
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        if (key.includes('version') || key.includes('update') || 
            key.includes('notif') || key.includes('app_') || 
            key.includes('mobile_update')) {
          try { localStorage.removeItem(key); } catch (e) {}
        }
      }
      
      console.log(' ALL version data has been completely removed');
    } catch (e) {
      console.error('Error during nuclear cleanup:', e);
    }
  }
})();

// EMPTY FUNCTIONS TO REPLACE ALL VERSION HANDLING
const initAppConfig = () => ({});
const checkAppVersion = () => ({});
const shouldShowUpdateNotification = () => false;

// Export configuration
export {
  API_URL,
  buildApiUrl,
  initAppConfig,
  checkAppVersion,
  shouldShowUpdateNotification
};

// Export other configuration settings
export const APP_CONFIG = {
  version: appConfig.version,
  releaseDate: new Date('2025-06-17'), // Updated to today's date
  requireForceUpdate: true, // iOS devices will require updating
  updateCheckIntervalMinutes: 5, // Check for updates every 5 minutes on iOS
};