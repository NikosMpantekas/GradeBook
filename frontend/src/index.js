import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './app/store';
import App from './App';
import './index.css';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

// CRITICAL: Ensure service worker is properly registered for PWA support
// This is essential for Android PWA installation to work correctly
console.log('[PWA] Registering service worker for Android support');

// Force immediate registration with explicit options
serviceWorkerRegistration.register({
  onSuccess: (registration) => {
    console.log('[PWA] Service worker registration successful with scope:', registration.scope);
  },
  onUpdate: (registration) => {
    console.log('[PWA] Service worker updated');
  }
});
