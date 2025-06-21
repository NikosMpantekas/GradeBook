/**
 * Application configuration
 */

// App version (NOTIFICATION SYSTEM COMPLETELY REMOVED)
// Updated to fix TypeError in grade creation component
const APP_VERSION = '1.6.0.63';

// API URL from environment variables - proper way without hardcoding
let API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Production deployment on render.com - auto-detect and handle the correct API URL
if (process.env.NODE_ENV === 'production') {
  // Check if we're on render.com by looking at the hostname
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  
  // If we're on the render.com domain, use the same origin for API
  if (currentHostname.includes('render.com')) {
    API_URL = window.location.origin;
    console.log('[appConfig] Production environment detected on render.com, setting API_URL to:', API_URL);
  }
}

// Debug logging
console.log('[appConfig] Environment:', process.env.NODE_ENV);
console.log('[appConfig] Using API_URL:', API_URL);

// Add warning if API_URL is localhost in production
if (process.env.NODE_ENV === 'production' && API_URL.includes('localhost')) {
  console.warn('[appConfig] WARNING: Using localhost in production environment!');
  console.warn('[appConfig] Set REACT_APP_API_URL in your production environment');
}

// Helper function to construct API endpoint URLs properly, avoiding double slashes
const buildApiUrl = (baseUrl, endpoint) => {
  // Remove trailing slash from base URL if it exists
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  // Ensure endpoint starts with a slash
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${normalizedBaseUrl}${normalizedEndpoint}`;
};

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
  APP_VERSION,
  buildApiUrl,
  initAppConfig,
  checkAppVersion,
  shouldShowUpdateNotification
};

// Export other configuration settings
export const APP_CONFIG = {
  version: APP_VERSION,
  releaseDate: new Date('2025-06-17'), // Updated to today's date
  requireForceUpdate: true, // iOS devices will require updating
  updateCheckIntervalMinutes: 5, // Check for updates every 5 minutes on iOS
};