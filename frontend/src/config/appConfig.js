/**
 * Application configuration
 * Contains global settings and version information
 * IMPORTANT: This module has been refactored to fix critical initialization errors
 */

// COMPLETELY DISABLED ALL VERSION CHECKS AND UPDATES
const APP_VERSION = '1.4.54';

/**
 * COMPLETELY REMOVED - All version checking and update notification functionality
 */
const storeAppVersion = () => {
  // EMERGENCY FIX: HARD-CODED RESULT - NEVER SHOW UPDATES
  // This function now does nothing except return a fixed result
  return { isNewVersion: false, previousVersion: null, alreadyNotified: true };
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
 * COMPLETELY REMOVED - All version checking functionality
 */
const checkAppVersion = () => {
  // EMERGENCY FIX: HARD-CODED RESULT - NEVER SHOW UPDATES
  return { isNewVersion: false, previousVersion: null, alreadyNotified: true };
};

/**
 * COMPLETELY REMOVED - All notification functionality
 */
const shouldShowUpdateNotification = () => {
  // Force return false to never show update notifications
  return false;
};

/**
 * Initialize app configuration
 * COMPLETELY DISABLED - Does nothing now
 */
const initAppConfig = () => {
  // EMERGENCY FIX: REMOVED ALL FUNCTIONALITY
  // Return fixed result, never trigger updates
  return { isNewVersion: false, previousVersion: null, alreadyNotified: true };
};

// EMERGENCY OVERRIDE: Add function to completely clear all app version records
const nukeAllVersionRecords = () => {
  try {
    // Clear all storage items related to versioning
    localStorage.removeItem('app_version');
    localStorage.removeItem('app_version_updated_at');
    localStorage.removeItem('update_notification_disabled');
    localStorage.removeItem('update_shown_for_version');
    localStorage.removeItem('global_updates_shown');
    sessionStorage.removeItem('last_shown_update_version');
    sessionStorage.removeItem('update_notification_shown_session');
    
    // Clear any mobile-specific flags
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('mobile_update_shown_')) {
        localStorage.removeItem(key);
      }
    }
    
    console.log(' EMERGENCY: All version records have been deleted');
    return true;
  } catch (e) {
    console.error('Failed to clear version records:', e);
    return false;
  }
};

// Run the nuke function immediately to clear everything
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    nukeAllVersionRecords();
    console.log(' Update notifications permanently disabled');
  });
}

export {
  APP_VERSION,
  initAppConfig,  // Now does nothing
  checkAppVersion, // Now does nothing
  shouldShowUpdateNotification, // Always returns false
  nukeAllVersionRecords // New emergency function
};

// Export other configuration settings
export const APP_CONFIG = {
  version: APP_VERSION,
  releaseDate: new Date('2025-05-23'), // Updated to today's date
  requireForceUpdate: true, // iOS devices will require updating
  updateCheckIntervalMinutes: 5, // Check for updates every 5 minutes on iOS
};