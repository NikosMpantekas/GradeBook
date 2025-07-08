/* eslint-disable no-restricted-globals */
// This is a temporary service worker file to satisfy CRA build requirements
// The actual service worker will be copied from public/service-worker.js after build

// Required placeholder for Workbox - this allows the build to succeed
// DO NOT REMOVE THIS LINE - it's required for the build process
// ESLint requires this to be an assignment, not just an expression
const workboxManifest = self.__WB_MANIFEST || [];

// Export default function for module requirements
export default function noop() {
  console.log('[Temporary Service Worker] This is a placeholder service worker');
  return null;
}

// Export mock service worker functions to satisfy CRA
export function registerRoute() {
  return null;
}

export function precacheAndRoute(manifest) {
  console.log('[Temporary Service Worker] Pretending to precache:', manifest);
  return null;
}

export function createHandlerBoundToURL() {
  return null;
}

export function getCacheKeyForURL() {
  return null;
}

export function skipWaiting() {
  return null;
}

export function clientsClaim() {
  return null;
}