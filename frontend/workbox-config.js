module.exports = {
  // Tell Workbox to only inject the manifest into this service worker
  swSrc: 'public/service-worker.js',
  swDest: 'build/service-worker.js',
  // These are the default injection points that Create React App uses
  globDirectory: 'build',
  globPatterns: [
    '**/*.{html,json,js,css,png,jpg,gif,svg}'
  ],
  // Add more verbose options to help with debugging
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB - increase limit for larger files
  dontCacheBustURLsMatching: /\.(js|css)$/, // Skip cache busting for JS and CSS
  verbose: true // Enable verbose logging
};
