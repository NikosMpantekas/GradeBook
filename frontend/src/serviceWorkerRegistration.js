// This optional code is used to register a service worker.
// Import the app version from the central config file - but ONLY the version number
// This prevents any execution of module-level code that might cause errors
import { APP_VERSION } from './config/appConfig';

// Safely access the APP_VERSION with error handling
const getAppVersion = () => {
  try {
    return APP_VERSION || '1.0.0';
  } catch (error) {
    console.error('Error accessing APP_VERSION:', error);
    return '1.0.0'; // Fallback version if there's an error
  }
};

// register() is not called by default.

// This lets the app load faster on subsequent visits in production, and gives
// it offline capabilities. However, it also means that developers (and users)
// will only see deployed updates on subsequent visits to a page, after all the
// existing tabs open on the page have been closed, since previously cached
// resources are updated in the background.

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]' ||
    // 127.0.0.0/8 are considered localhost for IPv4.
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function register(config) {
  // CRITICAL FIX: Always register the service worker regardless of environment
  // This ensures it works on both development and production for Android PWA support
  if ('serviceWorker' in navigator) {
    console.log('[PWA] Service Worker is supported by this browser');
    
    // Detect Android devices
    const isAndroid = /Android/.test(navigator.userAgent);
    if (isAndroid) {
      console.log('[PWA] Android device detected, optimizing for Android installation');
      // Store this info in sessionStorage for other components
      sessionStorage.setItem('isAndroidDevice', 'true');
    }
    // The URL constructor is available in all browsers that support SW.
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      // Our service worker won't work if PUBLIC_URL is on a different origin
      // from what our page is served on. This might happen if a CDN is used to
      // serve assets; see https://github.com/facebook/create-react-app/issues/2374
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      if (isLocalhost) {
        // This is running on localhost. Let's check if a service worker still exists or not.
        checkValidServiceWorker(swUrl, config);

        // Add some additional logging to localhost, pointing developers to the
        // service worker/PWA documentation.
        navigator.serviceWorker.ready.then((registration) => {
          console.log(
            'This web app is being served cache-first by a service ' +
              'worker. To learn more, visit https://cra.link/PWA'
          );
          
          // Send the APP_VERSION to the service worker - safely
          if (registration.active) {
            const safeVersion = getAppVersion();
            console.log('Sending app version to service worker:', safeVersion);
            registration.active.postMessage({
              type: 'APP_VERSION',
              version: safeVersion
            });
          }
        });
      } else {
        // Is not localhost. Just register service worker
        registerValidSW(swUrl, config);
      }
      
      // For both localhost and production, send the APP_VERSION when the worker is ready
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          try {
            const safeVersion = getAppVersion();
            console.log('Sending app version to service worker:', safeVersion);
            registration.active.postMessage({
              type: 'APP_VERSION',
              version: safeVersion
            });
          } catch (error) {
            console.error('Error sending version to service worker:', error);
          }
        }
      });
    });
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      // CRITICAL FIX: Check for updates more frequently for iOS devices
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      console.log(`[PWA] Running on iOS device: ${isIOS}`);
      
      // Store this info in sessionStorage to persist during page refreshes
      sessionStorage.setItem('isIOSDevice', String(isIOS));
      
      // More frequent checks for iOS devices (5 minutes), less frequent for others (15 minutes)
      const checkInterval = isIOS ? 5 * 60 * 1000 : 15 * 60 * 1000;
      
      console.log(`[PWA] Setting update check interval to ${checkInterval/1000} seconds`);
      
      // Set an interval to check for updates
      const updateCheckInterval = setInterval(() => {
        console.log('[PWA] Checking for service worker updates...');
        try {
          registration.update()
            .then(() => console.log('[PWA] Update check completed'))
            .catch(err => console.error('[PWA] Update check failed:', err));
        } catch (error) {
          console.error('[PWA] Error checking for updates:', error);
        }
      }, checkInterval);
      
      // Also store the registration in window for easy access
      window.pwaRegistration = registration;
      
      // Add the interval ID to window so we can clear it if needed
      window.pwaUpdateCheckInterval = updateCheckInterval;

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // At this point, the updated precached content has been fetched,
              // but the previous service worker will still serve the older
              // content until all client tabs are closed.
              console.log('[PWA] New content is available and will be used when all tabs are closed');
              
              // Notify service worker to clean up old caches
              try {
                registration.active.postMessage({
                  type: 'CLEAN_CACHES',
                  version: APP_VERSION
                });
                console.log('[PWA] Sent cache cleanup message to service worker');
              } catch (err) {
                console.error('[PWA] Failed to send message to service worker:', err);
              }
              
              // Check if we're on iOS
              const isIOS = sessionStorage.getItem('isIOSDevice') === 'true' || 
                            (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream);
              
              console.log(`[PWA] Showing update notification (iOS: ${isIOS})`);
              
              // CRITICAL FIX FOR iOS: Use a more aggressive update approach for iOS
              // Create and show custom modal for updates that's impossible to ignore on iOS
              const updateOverlay = document.createElement('div');
              updateOverlay.id = 'pwa-update-overlay';
              updateOverlay.style.position = 'fixed';
              updateOverlay.style.top = '0';
              updateOverlay.style.left = '0';
              updateOverlay.style.width = '100%';
              updateOverlay.style.height = '100%';
              updateOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
              updateOverlay.style.zIndex = '99999';
              updateOverlay.style.display = 'flex';
              updateOverlay.style.justifyContent = 'center';
              updateOverlay.style.alignItems = 'center';
              
              const updateCard = document.createElement('div');
              updateCard.style.backgroundColor = 'white';
              updateCard.style.borderRadius = '8px';
              updateCard.style.padding = '20px';
              updateCard.style.maxWidth = '90%';
              updateCard.style.width = '350px';
              updateCard.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              updateCard.style.textAlign = 'center';
              
              const logoContainer = document.createElement('div');
              logoContainer.style.marginBottom = '15px';
              
              const logo = document.createElement('img');
              logo.src = '/logo192.png';
              logo.alt = 'GradeBook Logo';
              logo.style.width = '60px';
              logo.style.height = '60px';
              
              const title = document.createElement('h2');
              title.textContent = 'App Update Available';
              title.style.margin = '10px 0';
              title.style.color = '#333';
              title.style.fontSize = '1.5rem';
              
              const message = document.createElement('p');
              message.textContent = isIOS ? 
                'A new version of GradeBook is ready. You must update to continue using the app.' : 
                'A new version of GradeBook is available!';
              message.style.marginBottom = '20px';
              message.style.color = '#666';
              message.style.fontSize = '0.9rem';
              message.style.lineHeight = '1.4';
              
              const buttonContainer = document.createElement('div');
              buttonContainer.style.display = 'flex';
              buttonContainer.style.flexDirection = isIOS ? 'column' : 'row';
              buttonContainer.style.justifyContent = 'center';
              buttonContainer.style.gap = '10px';
              
              const updateButton = document.createElement('button');
              updateButton.textContent = 'Update Now';
              updateButton.style.padding = '12px 20px';
              updateButton.style.backgroundColor = '#3f51b5';
              updateButton.style.color = 'white';
              updateButton.style.border = 'none';
              updateButton.style.borderRadius = '4px';
              updateButton.style.fontWeight = 'bold';
              updateButton.style.fontSize = '1rem';
              updateButton.style.cursor = 'pointer';
              updateButton.style.width = isIOS ? '100%' : 'auto';
              
              // For iOS, we need to force refresh more aggressively
              updateButton.addEventListener('click', () => {
                console.log('[PWA] Update requested by user');
                
                // Store flag that we're updating deliberately
                localStorage.setItem('pwa_updating', 'true');
                localStorage.setItem('pwa_update_time', Date.now().toString());
                
                // Force clear cache for iOS
                if (isIOS) {
                  try {
                    if ('caches' in window) {
                      caches.keys().then(cacheNames => {
                        cacheNames.forEach(cacheName => {
                          console.log('[PWA] Deleting cache:', cacheName);
                          caches.delete(cacheName);
                        });
                        console.log('[PWA] All caches deleted, reloading page...');
                        setTimeout(() => window.location.reload(true), 200);
                      });
                    } else {
                      console.log('[PWA] Cache API not available, performing normal reload');
                      window.location.reload(true);
                    }
                  } catch (err) {
                    console.error('[PWA] Error clearing caches:', err);
                    window.location.reload(true);
                  }
                } else {
                  // For non-iOS, a simple reload is usually sufficient
                  window.location.reload(true);
                }
              });
              
              // Only show Later button for non-iOS devices
              if (!isIOS) {
                const laterButton = document.createElement('button');
                laterButton.textContent = 'Later';
                laterButton.style.padding = '12px 20px';
                laterButton.style.backgroundColor = 'transparent';
                laterButton.style.color = '#3f51b5';
                laterButton.style.border = '1px solid #3f51b5';
                laterButton.style.borderRadius = '4px';
                laterButton.style.cursor = 'pointer';
                
                laterButton.addEventListener('click', () => {
                  console.log('[PWA] Update postponed by user');
                  if (updateOverlay.parentNode) {
                    document.body.removeChild(updateOverlay);
                  }
                  
                  // Schedule a reminder for later
                  setTimeout(() => {
                    // If we haven't updated yet, show notification again
                    if (document.getElementById('pwa-update-overlay') === null) {
                      document.body.appendChild(updateOverlay);
                    }
                  }, 3600000); // Remind again in 1 hour
                });
                
                buttonContainer.appendChild(laterButton);
              }
              
              logoContainer.appendChild(logo);
              updateCard.appendChild(logoContainer);
              updateCard.appendChild(title);
              updateCard.appendChild(message);
              buttonContainer.appendChild(updateButton);
              updateCard.appendChild(buttonContainer);
              updateOverlay.appendChild(updateCard);
              
              // Add to DOM when it's ready
              if (document.body) {
                document.body.appendChild(updateOverlay);
              } else {
                // If body isn't ready yet, wait for it
                window.addEventListener('DOMContentLoaded', () => {
                  document.body.appendChild(updateOverlay);
                });
              }

              // Execute callback
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // At this point, everything has been precached.
              // It's the perfect time to display a
              // "Content is cached for offline use." message.
              console.log('Content is cached for offline use.');

              // Execute callback
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('Error during service worker registration:', error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  // Check if the service worker can be found. If it can't reload the page.
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      // Ensure service worker exists, and that we really are getting a JS file.
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No service worker found. Probably a different app. Reload the page.
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
            // If you want your app to work offline and load faster, you can change
            // unregister() to register() below. Note this comes with some pitfalls.
            // Learn more about service workers: https://cra.link/PWA
            serviceWorker.register(swUrl)
              .then(registration => {
                console.log('ServiceWorker registration successful.');
                // Log the current app version for debugging
                try {
                  console.log(`App version from registration: ${getAppVersion()}`);
                } catch (error) {
                  console.error('Error logging app version:', error);
                }
              })
              .catch(error => {
                console.error('ServiceWorker registration failed:', error);
              });
          });
        });
      } else {
        // Service worker found. Proceed as normal.
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('No internet connection found. App is running in offline mode.');
    });
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}
