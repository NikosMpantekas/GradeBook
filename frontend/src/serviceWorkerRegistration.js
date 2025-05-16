// This optional code is used to register a service worker.
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
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
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
        navigator.serviceWorker.ready.then(() => {
          console.log(
            'This web app is being served cache-first by a service ' +
              'worker. To learn more, visit https://cra.link/PWA'
          );
        });
      } else {
        // Is not localhost. Just register service worker
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      // Check for updates every hour if the app remains open
      setInterval(() => {
        registration.update();
        console.log('Checking for service worker updates...');
      }, 60 * 60 * 1000);

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
              console.log(
                'New content is available!'
              );

              // iOS Safari requires different approach to show prompts
              // This is more reliable across all devices including iOS
              
              // Create and show custom banner for updates
              const updateBanner = document.createElement('div');
              updateBanner.style.position = 'fixed';
              updateBanner.style.bottom = '0';
              updateBanner.style.left = '0';
              updateBanner.style.right = '0';
              updateBanner.style.padding = '12px';
              updateBanner.style.background = '#4b6cb7';
              updateBanner.style.color = 'white';
              updateBanner.style.textAlign = 'center';
              updateBanner.style.zIndex = '9999';
              updateBanner.style.boxShadow = '0 -2px 10px rgba(0,0,0,0.2)';
              updateBanner.style.display = 'flex';
              updateBanner.style.flexDirection = 'column';
              updateBanner.style.gap = '8px';
              
              const message = document.createElement('div');
              message.textContent = 'A new version of GradeBook is available!';
              message.style.fontWeight = 'bold';
              
              const buttonContainer = document.createElement('div');
              buttonContainer.style.display = 'flex';
              buttonContainer.style.justifyContent = 'center';
              buttonContainer.style.gap = '8px';
              
              const updateButton = document.createElement('button');
              updateButton.textContent = 'Update Now';
              updateButton.style.padding = '8px 16px';
              updateButton.style.background = 'white';
              updateButton.style.color = '#4b6cb7';
              updateButton.style.border = 'none';
              updateButton.style.borderRadius = '4px';
              updateButton.style.fontWeight = 'bold';
              updateButton.style.cursor = 'pointer';
              
              const closeButton = document.createElement('button');
              closeButton.textContent = 'Later';
              closeButton.style.padding = '8px 16px';
              closeButton.style.background = 'transparent';
              closeButton.style.color = 'white';
              closeButton.style.border = '1px solid white';
              closeButton.style.borderRadius = '4px';
              closeButton.style.cursor = 'pointer';
              
              updateButton.addEventListener('click', () => {
                window.location.reload();
              });
              
              closeButton.addEventListener('click', () => {
                document.body.removeChild(updateBanner);
              });
              
              buttonContainer.appendChild(updateButton);
              buttonContainer.appendChild(closeButton);
              updateBanner.appendChild(message);
              updateBanner.appendChild(buttonContainer);
              
              // Add to body for iOS compatibility
              document.body.appendChild(updateBanner);

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
