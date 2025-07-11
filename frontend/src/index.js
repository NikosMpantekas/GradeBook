import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './app/store';
import App from './App';
import './index.css';

// Import axios configuration to fix double slash API URLs globally
import './config/axiosConfig';

// DISABLE ALL SERVICE WORKERS
// This will prevent CRA from generating service workers during build

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

// COMPLETELY DISABLE ALL SERVICE WORKERS
console.log('⚠️ All service workers disabled to prevent Netlify build issues');

// Unregister any existing service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(registrations => {
      for (const registration of registrations) {
        registration.unregister();
        console.log('Service worker unregistered:', registration);
      }
    })
    .catch(error => {
      console.error('Error unregistering service workers:', error);
    });
}

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
