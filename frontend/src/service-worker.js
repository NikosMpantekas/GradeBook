// This service worker file is completely empty to disable CRA's service worker generation

/* eslint-disable no-restricted-globals */
// The above comment disables ESLint warnings for this file only

// Export default function for module requirements
export default function noop() {
  return null;
}

// Export mock service worker functions to satisfy CRA
export function registerRoute() {
  return null;
}

export function precacheAndRoute() {
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