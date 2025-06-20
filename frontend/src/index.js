import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './app/store';
import App from './App';
import './index.css';
// Main service worker has been completely disabled to prevent update notifications
// But we still need the push service worker for notifications
import { registerPushServiceWorker } from './pushServiceWorkerRegistration';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

// Main SERVICE WORKER DISABLED but push service worker is enabled
console.log('⚠️ Main service worker disabled, but push notifications service worker is enabled');

// Register only the push service worker
registerPushServiceWorker()
  .then(registration => {
    if (registration) {
      console.log('Push service worker registered for notifications');
    } else {
      console.log('Push service worker registration failed or not supported');
    }
  })
  .catch(error => {
    console.error('Error during push service worker registration:', error);
  });

// EMERGENCY FIX: Remove any existing update notifications
setTimeout(() => {
  try {
    // Remove any update notification elements that might exist
    const elements = [
      'sw-update-notification',
      'pwa-update-overlay',
      'app-update-notification',
      'update-modal',
      'update-notification'
    ];
    
    elements.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
    
    // Also clear localStorage
    const keysToRemove = [
      'app_version', 'app_version_updated_at', 'update_shown_for_version', 'global_updates_shown',
      'last_shown_update_version', 'update_notification_shown_session'
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (e) {
    console.error('Error cleaning up notifications:', e);
  }
}, 100);
