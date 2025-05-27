/**
 * Application configuration
 */

// App version (NOTIFICATION SYSTEM COMPLETELY REMOVED)
const APP_VERSION = '1.5.27';

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

// Export bare minimum
export {
  APP_VERSION,
  initAppConfig,
  checkAppVersion,
  shouldShowUpdateNotification
};

// Export other configuration settings
export const APP_CONFIG = {
  version: APP_VERSION,
  releaseDate: new Date('2025-05-23'), // Updated to today's date
  requireForceUpdate: true, // iOS devices will require updating
  updateCheckIntervalMinutes: 5, // Check for updates every 5 minutes on iOS
};