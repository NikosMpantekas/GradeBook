// This service worker file is completely empty to disable CRA's service worker generation
// Skip workbox precaching
self.__WB_DISABLE_DEV_LOGS = true;
self.__WB_MANIFEST = [];

// Export default function for module requirements
export default function noop() {
  return null;
}

// Prevent any service worker registration
if (typeof self !== 'undefined') {
  self.addEventListener = function() {};
}