import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './app/store';
import App from './App';
import './index.css';
// Service worker has been completely disabled to prevent update notifications

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

// SERVICE WORKER COMPLETELY DISABLED
console.log('⚠️ Service worker has been completely disabled to prevent update notifications');

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
