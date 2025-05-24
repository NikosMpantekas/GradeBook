/**
 * Application configuration
 * Contains global settings and version information
 * IMPORTANT: This module has been refactored to fix critical initialization errors
 */

// IMPORTANT: Update this version number whenever you deploy a new version
// This ensures proper update notification on all devices including iOS
const APP_VERSION = '1.4.53'; // CRITICAL FIX: Completely disabled update notifications

/**
 * Safely store app version in localStorage with error handling
 * @returns {Object} Version status information
 */
const storeAppVersion = () => {
  try {
    // Safety check for localStorage availability
    if (typeof localStorage === 'undefined') {
      console.warn('[App] localStorage is not available');
      return { isNewVersion: false, previousVersion: null, error: 'localStorage not available' };
    }
    
    const previousVersion = localStorage.getItem('app_version');
    
    // First time the app is loaded, no need for update notifier
    if (!previousVersion) {
      localStorage.setItem('app_version', APP_VERSION);
      localStorage.setItem('app_version_updated_at', Date.now().toString());
      console.log(`[App] First run of version ${APP_VERSION}`);
      return { isNewVersion: false, previousVersion: null };
    }
    
    // CRITICAL FIX: COMPLETELY DISABLED UPDATE NOTIFICATIONS
    // Always update localStorage with the current version silently
    if (previousVersion !== APP_VERSION) {
      console.log(`[App] Version changed: ${previousVersion} → ${APP_VERSION} (notifications disabled)`);
      localStorage.setItem('app_version', APP_VERSION);
      localStorage.setItem('app_version_updated_at', Date.now().toString());
      
      // Hard kill all update notifications by setting all possible flags
      localStorage.setItem('update_notification_disabled', 'true');
      localStorage.setItem('update_shown_for_version', APP_VERSION);
      sessionStorage.setItem('last_shown_update_version', APP_VERSION);
      localStorage.setItem('mobile_update_shown_' + APP_VERSION, 'true');
      
      try {
        // Clear any existing update records and set the new one as already shown
        const updatesShown = { [APP_VERSION]: true };
        localStorage.setItem('global_updates_shown', JSON.stringify(updatesShown));
      } catch (e) {
        console.error('Error updating records, but notifications still disabled:', e);
      }
    }
    
    // ALWAYS return false to never show updates
    return { isNewVersion: false, previousVersion, alreadyNotified: true };
    
    return { isNewVersion: false, previousVersion };
  } catch (err) {
    console.error('[App] Error storing version:', err);
    return { isNewVersion: false, previousVersion: null, error: err };
  }
};

/**
 * Safely send version info to service worker with error handling
 * This fixes the "y(...) is undefined" error by adding proper safety checks
 */
const sendVersionToServiceWorker = () => {
  try {
    // Only execute if both serviceWorker and controller exist
    if (typeof navigator !== 'undefined' && 
        navigator.serviceWorker && 
        navigator.serviceWorker.controller) {
      
      navigator.serviceWorker.controller.postMessage({
        type: 'APP_VERSION',
        version: APP_VERSION
      });
      console.log(`[App] Sent version ${APP_VERSION} to service worker`);
    } else {
      console.log('[App] Service worker not available, skipping version notification');
    }
  } catch (error) {
    // Catch any errors to prevent app crashes
    console.error('[App] Error sending version to service worker:', error);
  }
};

/**
 * Initialize the app configuration module
 * This function should be called explicitly instead of relying on module-level execution
 */
const initAppConfig = () => {
  try {
    // COMPLETELY DISABLED - Never show update notification
    const shouldShowUpdateNotification = () => {
      // Force return false to never show update notifications
      return false;
    };

    // Check version when explicitly initialized
    const versionStatus = storeAppVersion();
    if (versionStatus.isNewVersion) {
      console.log(`[App] Running new version ${APP_VERSION}`);
    }
    
    // Schedule sending version to service worker with safety delay
    // This ensures the service worker is registered before we try to communicate
    setTimeout(() => {
      try {
        sendVersionToServiceWorker();
      } catch (error) {
        console.error('[App] Error in delayed sendVersionToServiceWorker:', error);
      }
    }, 3000);
    
    return true;
  } catch (error) {
    console.error('[App] Error initializing app config:', error);
    return false;
  }
};

// Export everything as named exports - no default export to ensure proper tree-shaking
export { 
  APP_VERSION,
  storeAppVersion,
  sendVersionToServiceWorker,
  initAppConfig
};

// Export other configuration settings
export const APP_CONFIG = {
  version: APP_VERSION,
  releaseDate: new Date('2025-05-23'), // Updated to today's date
  requireForceUpdate: true, // iOS devices will require updating
  updateCheckIntervalMinutes: 5, // Check for updates every 5 minutes on iOS
};