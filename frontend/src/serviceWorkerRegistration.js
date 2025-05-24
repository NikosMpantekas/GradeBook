// This service worker registration has been completely rewritten
// All update notifications have been removed

// Set a global flag to prevent updates
window.UPDATES_DISABLED = true;

// Helper to clear update data
function clearUpdateData() {
  if (typeof localStorage !== 'undefined') {
    try {
      // Clear all storage keys related to updates
      const keysToRemove = [
        'app_version', 'app_version_updated_at', 'update_shown_for_version',
        'global_updates_shown', 'last_shown_update_version', 'update_notification_shown_session'
      ];
      keysToRemove.forEach(key => {
        try { localStorage.removeItem(key); } catch(e) {}
      });
      
      // Also clear any related items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key.includes('version') || key.includes('update')) {
          try { localStorage.removeItem(key); } catch(e) {}
        }
      }
    } catch(e) {
      console.error('Error clearing update data:', e);
    }
  }
}

// Clear update data on load
clearUpdateData();

// Remove any UI notifications
function removeUpdateNotifications() {
  if (typeof document !== 'undefined') {
    try {
      const elementsToRemove = [
        'sw-update-notification',
        'pwa-update-overlay',
        'app-update-notification'
      ];
      elementsToRemove.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });
    } catch(e) {
      console.error('Error removing notifications:', e);
    }
  }
}

// Remove notifications on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', removeUpdateNotifications);
}

// Detect localhost
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

// Mock implementation that does nothing
function registerValidSW(swUrl, config) {
  // Do nothing - service worker registration completely disabled
  console.log('Service worker registration disabled');
}

// Mock implementation that does nothing
function checkValidServiceWorker(swUrl, config) {
  // Do nothing - service worker checks completely disabled
  console.log('Service worker checks disabled');
}

// Empty register function
export function register(config) {
  console.log('Service worker updates permanently disabled');
  return false;
}

// Unregister function - the only one that does anything
export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
        console.log('Service worker unregistered');
      })
      .catch((error) => {
        console.error('Error unregistering service worker:', error);
      });
  }
}

// Immediately try to unregister any existing service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
      console.log('Existing service worker unregistered');
    });
  });
}