/* eslint-disable no-restricted-globals */

// This is a dedicated service worker for push notifications
// It handles push notifications separately from the main service worker

// Handle incoming push events
self.addEventListener('push', (event) => {
  console.log('[Push Service Worker] Push Received');
  
  // Ensure the event waits for our async operations
  event.waitUntil(
    (async () => {
      try {
        let data = { title: 'New Notification', body: 'You have a new notification' };
        
        // Try to parse the payload
        if (event.data) {
          try {
            data = event.data.json();
            console.log('[Push Service Worker] Push data:', data);
          } catch (e) {
            console.error('[Push Service Worker] Error parsing push data:', e);
            // Use the default if JSON parsing fails
          }
        }
        
        const title = data.title || 'GradeBook';
        const options = {
          body: data.body || 'New notification received',
          icon: '/logo192.png',
          badge: '/badge-icon.png',
          tag: data.notificationId || 'default-tag',
          data: {
            url: data.url || '/app/notifications',
            notificationId: data.notificationId
          },
          actions: [
            {
              action: 'view',
              title: 'View'
            }
          ],
          vibrate: data.urgent ? [100, 50, 100, 50, 100, 50, 100] : [100, 50, 100],
          renotify: !!data.urgent, // Only notify again if urgent
          requireInteraction: !!data.urgent // Keep notification visible if urgent
        };
        
        // Get all clients to check if any are visible
        const clientList = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true
        });
        
        const focusedClient = clientList.find(client => client.focused);
        
        // Always show notification on mobile
        const isMobile = /iPhone|iPad|iPod|Android/i.test(self.navigator.userAgent);
        
        // Only skip notification if app is in focus AND not on mobile
        if (focusedClient && !isMobile) {
          console.log('[Push Service Worker] Application is focused, posting message instead of notification');
          // Send the notification data to the focused client
          focusedClient.postMessage({
            type: 'PUSH_RECEIVED',
            notification: {
              ...data,
              title: title,
              options: options
            }
          });
        } else {
          // Show notification if app is not in focus or on mobile
          console.log('[Push Service Worker] Showing notification');
          return self.registration.showNotification(title, options);
        }
      } catch (error) {
        console.error('[Push Service Worker] Error handling push:', error);
        // Fallback to a basic notification if anything fails
        return self.registration.showNotification('GradeBook', {
          body: 'You have a new notification',
          icon: '/logo192.png'
        });
      }
    })()
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Push Service Worker] Notification click received:', event.notification.tag);
  
  // Close the notification
  event.notification.close();
  
  // Get the notification data
  const notificationData = event.notification.data || {};
  const url = notificationData.url || '/app/notifications';
  
  // This handles notification actions if present
  let targetUrl = url;
  if (event.action === 'view' && notificationData.notificationId) {
    targetUrl = `/app/notifications/${notificationData.notificationId}`;
  }
  
  // Focus or open a window when the user clicks the notification
  event.waitUntil(
    (async () => {
      try {
        const clientList = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true
        });
        
        // Try to find an open window and focus it
        for (const client of clientList) {
          // If we find a window with the same origin
          if (new URL(client.url).origin === self.location.origin) {
            await client.focus();
            // Navigate the focused client to the target URL
            return client.navigate(targetUrl);
          }
        }
        
        // If no window is open, open a new one
        return self.clients.openWindow(targetUrl);
      } catch (error) {
        console.error('[Push Service Worker] Error handling notification click:', error);
        // If anything fails, at least try to open a new window
        return self.clients.openWindow('/app/notifications');
      }
    })()
  );
});

// Handle subscription changes
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[Push Service Worker] Push subscription changed');
  
  // The subscription object has changed, we need to update the server
  event.waitUntil(
    (async () => {
      try {
        // Get the new subscription from the event if available
        const newSubscription = event.newSubscription;
        
        if (newSubscription) {
          // Get the base URL from the service worker scope
          const baseUrl = self.registration.scope;
          
          // Send the new subscription to the server using the correct base URL
          const response = await fetch(`${baseUrl}api/notifications/subscription`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // We don't have the auth token here, so we'll rely on cookies
            },
            body: JSON.stringify(newSubscription)
          });
          
          if (!response.ok) {
            throw new Error('Failed to update subscription on server');
          }
          
          console.log('[Push Service Worker] Push subscription updated on server');
        }
      } catch (error) {
        console.error('[Push Service Worker] Error updating subscription:', error);
      }
    })()
  );
});

// Listen for the install event to handle service worker installation
self.addEventListener('install', (event) => {
  console.log('[Push Service Worker] Installing...');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Listen for the activate event to handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('[Push Service Worker] Activating...');
  // Claim clients to control pages immediately
  event.waitUntil(self.clients.claim());
});
