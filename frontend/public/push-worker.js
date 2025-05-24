/* eslint-disable no-restricted-globals */

/**
 * GradeBook Push Notification Service Worker
 * Dedicated worker for handling push notifications
 * This service worker focuses exclusively on push notifications to avoid conflicts
 * with the main service worker's caching and offline functionality
 */

self.addEventListener('install', (event) => {
  console.log('[Push Service Worker] Installing push notification worker');
  // Skip waiting to ensure the new service worker activates immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Push Service Worker] Push notification worker activated');
  // Claim clients to ensure the service worker controls all clients immediately
  event.waitUntil(self.clients.claim());
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[Push Service Worker] Push notification received:', event);

  try {
    let notificationData = {};
    
    // Try to parse the notification data from the push event
    if (event.data) {
      try {
        notificationData = event.data.json();
        console.log('[Push Service Worker] Parsed notification data:', notificationData);
      } catch (error) {
        console.error('[Push Service Worker] Error parsing notification data:', error);
        notificationData = {
          title: 'New Notification',
          body: event.data ? event.data.text() : 'You have a new notification',
          icon: '/logo192.png',
          badge: '/logo192.png',
          data: { url: '/' }
        };
      }
    } else {
      console.warn('[Push Service Worker] No data received with push notification');
      notificationData = {
        title: 'New Notification',
        body: 'You have a new notification',
        icon: '/logo192.png',
        badge: '/logo192.png',
        data: { url: '/' }
      };
    }

    // Ensure the required notification properties are set
    const title = notificationData.title || 'GradeBook Notification';
    const options = {
      body: notificationData.body || 'You have a new notification',
      icon: notificationData.icon || '/logo192.png',
      badge: notificationData.badge || '/logo192.png',
      vibrate: [100, 50, 100, 50, 100],
      timestamp: Date.now(),
      data: notificationData.data || { url: '/' },
      tag: notificationData.tag || 'gradebook-notification',
      actions: notificationData.actions || [
        { action: 'view', title: 'View' },
        { action: 'close', title: 'Close' }
      ],
      // Silent flag to prevent duplicate notifications when the app is in the foreground
      silent: notificationData.silent || false,
      // Require interaction to keep notification visible
      requireInteraction: notificationData.requireInteraction || true
    };

    // Display the notification
    console.log('[Push Service Worker] Showing notification:', { title, options });
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (error) {
    console.error('[Push Service Worker] Error displaying notification:', error);
    // Fallback notification in case of error
    event.waitUntil(
      self.registration.showNotification('GradeBook Notification', {
        body: 'You have a new notification',
        icon: '/logo192.png',
        badge: '/logo192.png'
      })
    );
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[Push Service Worker] Notification clicked:', event);
  
  // Close the notification
  event.notification.close();
  
  // Handle different action buttons
  let targetUrl = '/';
  
  // Extract the URL from the notification data
  if (event.notification.data && event.notification.data.url) {
    targetUrl = event.notification.data.url;
  }
  
  // Handle specific actions
  if (event.action === 'view' && event.notification.data && event.notification.data.url) {
    targetUrl = event.notification.data.url;
  } else if (event.action === 'close') {
    // Just close the notification, no navigation
    return;
  }
  
  console.log('[Push Service Worker] Opening URL:', targetUrl);
  
  // Focus on existing window or open a new one
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // Try to find an existing window/tab to focus
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no matching client, open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
      .catch((error) => {
        console.error('[Push Service Worker] Error handling notification click:', error);
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[Push Service Worker] Notification closed:', event);
  // Log or perform any cleanup needed when notification is dismissed
});

console.log('[Push Service Worker] Push worker registered and ready to receive notifications');
