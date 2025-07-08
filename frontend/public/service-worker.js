/* eslint-disable no-restricted-globals */

// This is the GradeBook service worker
// It handles caching and offline functionality

// Simple service worker without Workbox manifest dependencies
// Using only native Cache API

// App version is updated from the main app
let APP_VERSION = '1.0.0';

// Cache names
const CACHE_NAME = 'gradebook-cache-v1';
const STATIC_CACHE_NAME = `gradebook-static-${APP_VERSION}`;
const DYNAMIC_CACHE_NAME = `gradebook-dynamic-${APP_VERSION}`;
const DATA_CACHE_NAME = `gradebook-api-${APP_VERSION}`;
const ICON_CACHE_NAME = 'gradebook-icons'; // Separate cache for icons to control updates
const OFFLINE_URL = '/offline.html';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/js/bundle.js',
  '/static/js/vendors~main.chunk.js',
  '/manifest.json',
  '/offline.html',
  // Add other static assets your app needs
];

// Icon files that should be handled separately to allow for automatic updates
const ICON_FILES = [
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/apple-touch-icon.png',
  '/shortcut_dashboard.png',
  '/shortcut_grades.png',
  '/shortcut_profile.png',
];

// API paths to cache using network-first strategy
const API_PATHS = [
  '/api/users',
  '/api/schools',
  '/api/directions',
  '/api/subjects',
  '/api/grades',
  // Add other API paths your app uses
];

// Listen for messages from the client
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'APP_VERSION') {
    APP_VERSION = event.data.version;
    console.log('[Service Worker] App version updated to:', APP_VERSION);
  }
  
  // Handle cache cleanup request (critical for iOS updates)
  if (event.data && event.data.type === 'CLEAN_CACHES') {
    console.log('[Service Worker] Cache cleanup requested for version:', event.data.version);
    
    // Force the service worker to take control immediately
    self.skipWaiting();
    
    // Force cache cleanup - critical for iOS
    self.caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('[Service Worker] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('[Service Worker] All caches deleted successfully');
      
      // Run any additional cleanup
      cleanupOldCaches();
      
      // Notify all clients about cache cleanup
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'CACHES_CLEANED',
            timestamp: Date.now(),
            version: event.data.version
          });
        });
      });
    });
  }
});

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing new service worker version');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME)
        .then(cache => {
          console.log('[Service Worker] Caching app shell and static assets');
          return cache.addAll(STATIC_ASSETS);
        }),
      
      // Cache icons separately with their own cache
      caches.open(ICON_CACHE_NAME)
        .then(cache => {
          console.log('[Service Worker] Caching icon files');
          return cache.addAll(ICON_FILES);
        })
    ])
    .then(() => {
      console.log('[Service Worker] All resources cached successfully');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating new service worker');
  
  event.waitUntil(
    cleanupOldCaches()
      .then(() => {
        console.log('[Service Worker] Service worker activated, claiming clients');
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// Helper function to clean up old caches
function cleanupOldCaches() {
  return caches.keys()
    .then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete any cache that isn't one of our current caches
          if (
            cacheName !== STATIC_CACHE_NAME &&
            cacheName !== DYNAMIC_CACHE_NAME &&
            cacheName !== DATA_CACHE_NAME &&
            cacheName !== ICON_CACHE_NAME &&
            cacheName.includes('gradebook-')
          ) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    });
}

// Fetch event - handle network requests with cache strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // ICON FILES - Special Network-First with Cache Update Strategy
  // This ensures icons are always fresh and updated without requiring app reinstall
  if (ICON_FILES.some(iconPath => url.pathname.endsWith(iconPath))) {
    console.log('[Service Worker] Fetching icon file:', url.pathname);
    event.respondWith(networkFirstWithCacheUpdateStrategy(event.request));
    return;
  }
  
  // Handle manifest.json with network-first too, to ensure app settings update
  if (url.pathname.endsWith('/manifest.json')) {
    console.log('[Service Worker] Fetching manifest.json');
    event.respondWith(networkFirstWithCacheUpdateStrategy(event.request));
    return;
  }
  
  // API requests - Network First strategy
  if (API_PATHS.some(path => url.pathname.includes(path))) {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }
  
  // HTML requests - Network First strategy (for app shell)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If offline, serve the offline page
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }
  
  // All other assets - Cache First strategy
  event.respondWith(cacheFirstStrategy(event.request));
});

// Network First strategy for API calls
function networkFirstStrategy(request) {
  return fetch(request)
    .then((response) => {
      // Cache a fresh copy for next time
      const clonedResponse = response.clone();
      caches.open(DATA_CACHE_NAME)
        .then((cache) => {
          cache.put(request, clonedResponse);
        });
      return response;
    })
    .catch(() => {
      // If network fails, try to get from cache
      return caches.match(request);
    });
}

// Network First with Cache Update strategy for icons and manifest
function networkFirstWithCacheUpdateStrategy(request) {
  return fetch(request)
    .then((response) => {
      // Cache a fresh copy for next time
      const clonedResponse = response.clone();
      caches.open(ICON_CACHE_NAME)
        .then((cache) => {
          cache.put(request, clonedResponse);
        });
      return response;
    })
    .catch(() => {
      // If network fails, try to get from cache
      return caches.match(request);
    });
}

// Cache First strategy for static assets
function cacheFirstStrategy(request) {
  return caches.match(request)
    .then((response) => {
      // Return from cache if found
      if (response) {
        return response;
      }
      // Otherwise fetch from network and cache
      return fetch(request).then((networkResponse) => {
        // Cache a copy of the response
        const clonedResponse = networkResponse.clone();
        caches.open(DYNAMIC_CACHE_NAME)
          .then((cache) => {
            cache.put(request, clonedResponse);
          });
        return networkResponse;
      });
    });
}
