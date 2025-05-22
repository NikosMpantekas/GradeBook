/**
 * Application configuration
 * Contains global settings and version information
 */

// IMPORTANT: Update this version number whenever you deploy a new version
// This ensures proper update notification on all devices including iOS
const APP_VERSION = '1.3.59'; // Fixed critical MongoDB reference bug for school/direction data with improved data population mechanism

// Store version in localStorage to detect updates across refreshes
const storeAppVersion = () => {
  try {
    const previousVersion = localStorage.getItem('app_version');
    
    // First time the app is loaded, no need for update notifier
    if (!previousVersion) {
      localStorage.setItem('app_version', APP_VERSION);
      localStorage.setItem('app_version_updated_at', Date.now().toString());
      console.log(`[App] First run of version ${APP_VERSION}`);
      return { isNewVersion: false, previousVersion: null };
    }
    
    // Check if version has changed
    if (previousVersion !== APP_VERSION) {
      console.log(`[App] Version changed: ${previousVersion} → ${APP_VERSION}`);
      localStorage.setItem('app_version', APP_VERSION);
      localStorage.setItem('app_version_updated_at', Date.now().toString());
      return { isNewVersion: true, previousVersion };
    }
    
    return { isNewVersion: false, previousVersion };
  } catch (err) {
    console.error('[App] Error storing version:', err);
    return { isNewVersion: false, previousVersion: null, error: err };
  }
};

// Check version when this module loads
const versionStatus = storeAppVersion();
if (versionStatus.isNewVersion) {
  console.log(`[App] Running new version ${APP_VERSION}`);
}

// Send version info to service worker
const sendVersionToServiceWorker = () => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'APP_VERSION',
      version: APP_VERSION
    });
    console.log(`[App] Sent version ${APP_VERSION} to service worker`);
  }
};

// Call on module load
setTimeout(sendVersionToServiceWorker, 2000); // Delay to ensure SW is ready

// Export the app version for use throughout the application
export { APP_VERSION };

// Export other configuration settings
export const APP_CONFIG = {
  version: APP_VERSION,
  releaseDate: new Date('2025-05-18'),
  requireForceUpdate: true, // iOS devices will require updating
  updateCheckIntervalMinutes: 5, // Check for updates every 5 minutes on iOS
};