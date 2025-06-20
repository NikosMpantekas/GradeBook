/**
 * Push Notification Service Worker Registration
 * This file handles registration of the push notification service worker
 */

// Check for service worker support
const isPushSupported = 'serviceWorker' in navigator && 'PushManager' in window;

// Register the push service worker
export function registerPushServiceWorker() {
  if (!isPushSupported) {
    console.log('[Push] Push notifications are not supported in this browser');
    return Promise.resolve(false);
  }
  
  const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
  
  // Don't register if on different origin
  if (publicUrl.origin !== window.location.origin) {
    console.warn('[Push] PUBLIC_URL on different origin, skipping push service worker registration');
    return Promise.resolve(false);
  }
  
  return navigator.serviceWorker.register('/push-service-worker.js')
    .then(registration => {
      console.log('[Push] Push service worker registered successfully:', registration.scope);
      return registration;
    })
    .catch(error => {
      console.error('[Push] Error registering push service worker:', error);
      return null;
    });
}

// Unregister the push service worker
export function unregisterPushServiceWorker() {
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker.getRegistration('/push-service-worker.js')
      .then(registration => {
        if (registration) {
          return registration.unregister().then(success => {
            if (success) {
              console.log('[Push] Push service worker unregistered successfully');
            }
            return success;
          });
        }
        return false;
      })
      .catch(error => {
        console.error('[Push] Error unregistering push service worker:', error);
        return false;
      });
  }
  return Promise.resolve(false);
}
