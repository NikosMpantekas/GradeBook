module.exports = {
  // Tell Workbox to only inject the manifest into this service worker
  swSrc: 'public/service-worker.js',
  swDest: 'build/service-worker.js',
  // These are the default injection points that Create React App uses
  globDirectory: 'build',
  globPatterns: [
    '**/*.{html,json,js,css,png,jpg,gif,svg}'
  ]
};
