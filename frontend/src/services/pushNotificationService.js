import axiosInstance from '../app/axios';
import { store } from '../app/store';
import { subscribeToPushNotifications, getVapidPublicKey } from '../features/notifications/notificationSlice';

/**
 * Enhanced Base64 to Uint8Array conversion for VAPID keys
 * Special handling for Android devices which are more sensitive to format
 * @param {string} base64String - The base64 encoded VAPID public key
 * @returns {Uint8Array} - The converted application server key
 */
const convertBase64ToUint8Array = (base64String) => {
  try {
    // Input validation
    if (!base64String) {
      console.error('Empty VAPID key provided');
      throw new Error('VAPID key cannot be empty');
    }

    // Normalize the base64 string
    const base64 = String(base64String).trim();
    
    // Add padding if needed (important for correct decoding)
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    
    // Convert web-safe base64 to standard base64
    const base64Standardized = (base64 + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    // Convert to raw binary data 
    const rawData = window.atob(base64Standardized);
    
    // Create the output Uint8Array with exact length
    const outputArray = new Uint8Array(rawData.length);

    // Fill the array with byte values
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    // Validate the output array (Android requires proper length)
    if (outputArray.length < 8) {
      console.error('VAPID key conversion produced too short result:', outputArray.length);
      throw new Error('VAPID key conversion failed: result too short');
    }
    
    console.log('Successfully converted VAPID key to Uint8Array of length:', outputArray.length);
    return outputArray;
  } catch (error) {
    console.error('Error converting base64 to Uint8Array:', error);
    throw new Error('Failed to process VAPID key: ' + error.message);
  }
};

/**
 * Sets up push notifications with enhanced Android support
 * @returns {Promise<PushSubscription>} The created subscription object
 */
export const setupPushNotifications = async () => {
  try {
    // 1. Check browser support
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Workers are not supported in this browser');
    }
    
    if (!('PushManager' in window)) {
      throw new Error('Push notifications are not supported in this browser');
    }
    
    console.log('Push notification prerequisites check passed');
    
    // 2. Ensure push service worker is registered and active
    let registration;
    try {
      // Specifically register the push notification service worker
      // This is separate from the main service worker to avoid conflicts
      registration = await navigator.serviceWorker.register('/push-service-worker.js', {
        scope: '/'
      });
      
      // Wait for the service worker to be activated
      if (registration.installing) {
        console.log('Push service worker installing...');
        const worker = registration.installing;
        
        // Wait for the worker to change state to installed or activated
        await new Promise((resolve) => {
          worker.addEventListener('statechange', (e) => {
            if (e.target.state === 'activated') {
              console.log('Push service worker has been activated');
              resolve();
            }
          });
        });
      } else if (registration.waiting) {
        console.log('Push service worker is waiting');
        // Force activation
        registration.waiting.postMessage({type: 'SKIP_WAITING'});
      } else {
        console.log('Push service worker is active');
      }
      
      // Force update the service worker to ensure we have the latest version
      await registration.update().catch(e => {
        console.log('Push service worker update failed, continuing with existing worker:', e);
      });
      
      console.log('Push service worker is ready for subscription');
    } catch (swError) {
      console.error('Error preparing push service worker:', swError);
      throw new Error('Failed to initialize push service worker: ' + swError.message);
    }
    
    // 3. Check for existing subscription
    try {
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        try {
          // Validate existing subscription
          const endpoint = existingSubscription.endpoint;
          const keys = existingSubscription.options?.applicationServerKey || 
                      existingSubscription.getKey?.('p256dh');
          
          if (endpoint && keys) {
            console.log('Valid push subscription exists, reusing it');
            
            // Verify the subscription is registered on the server
            try {
              await store.dispatch(subscribeToPushNotifications(existingSubscription));
              console.log('Existing subscription refreshed on server');
            } catch (refreshError) {
              console.warn('Could not refresh subscription on server, but will still use it:', refreshError);
            }
            
            return existingSubscription;
          }
        } catch (validationError) {
          console.warn('Existing subscription is invalid, will create new one:', validationError);
        }
        
        // Unsubscribe from invalid subscription
        try {
          await existingSubscription.unsubscribe();
          console.log('Successfully unsubscribed from invalid subscription');
        } catch (unsubError) {
          console.warn('Could not unsubscribe from existing subscription:', unsubError);
          // Continue anyway - we'll create a new one
        }
      }
    } catch (subCheckError) {
      console.warn('Error checking existing subscription:', subCheckError);
      // Continue to create new subscription
    }
    
    // 4. Get VAPID key from server
    let applicationServerKey;
    try {
      // Fetch the VAPID public key
      const vapidResponse = await store.dispatch(getVapidPublicKey());
      
      if (vapidResponse.error) {
        throw new Error(vapidResponse.error.message || 'Server returned an error');
      }
      
      if (!vapidResponse.payload?.vapidPublicKey) {
        throw new Error('Server returned empty VAPID key');
      }
      
      // Convert the key to the right format for browsers
      applicationServerKey = convertBase64ToUint8Array(vapidResponse.payload.vapidPublicKey);
      console.log('VAPID key successfully retrieved and converted');
    } catch (keyError) {
      console.error('Failed to get or process VAPID key:', keyError);
      throw new Error('Could not prepare push notification key: ' + keyError.message);
    }
    
    // 5. Create push subscription with focus on Android compatibility
    try {
      console.log('Requesting push notification permission...');
      
      // Use a 30-second timeout for Android which can be slow with permissions
      const subscription = await Promise.race([
        registration.pushManager.subscribe({
          userVisibleOnly: true,  // Required for Chrome/Android
          applicationServerKey  // The converted VAPID key
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Push subscription timed out after 30s')), 30000)
        )
      ]);
      
      if (!subscription) {
        throw new Error('Subscription creation failed - received empty subscription');
      }
      
      console.log('Push subscription successfully created:', 
        subscription.endpoint ? subscription.endpoint.substr(0, 50) + '...' : 'No endpoint');
      
      // 6. Register the subscription with the server
      try {
        await store.dispatch(subscribeToPushNotifications(subscription));
        console.log('Subscription saved on server');
      } catch (serverError) {
        console.error('Failed to save subscription on server:', serverError);
        // Don't throw - we'll still return the subscription since it might work for push
      }
      
      return subscription;
    } catch (subscribeError) {
      console.error('Failed to create push subscription:', subscribeError);
      
      // Provide user-friendly error messages
      if (subscribeError.name === 'NotAllowedError') {
        throw new Error('Push notification permission was denied by the user');
      } else if (subscribeError.name === 'AbortError') {
        throw new Error('Push notification request was aborted');
      } else {
        throw new Error('Failed to subscribe to push notifications: ' + subscribeError.message);
      }
    }
  } catch (error) {
    // Top-level error handler for better user feedback
    console.error('Push notification setup failed:', error);
    
    // Format a user-friendly error message
    let userMessage = 'Could not enable notifications';
    if (error.message) {
      userMessage += ': ' + error.message;
    }
    
    throw new Error(userMessage);
  }
};

export const unsubscribeFromPushNotifications = async () => {
  try {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Unsubscribe
        await subscription.unsubscribe();
        
        // Send request to server to delete subscription
        const endpoint = subscription.endpoint;
        // Use axiosInstance which automatically handles token inclusion
        console.log('Unsubscribing from push notifications');
        await axiosInstance.post('/api/subscriptions/delete', { endpoint });
        
        console.log('Successfully unsubscribed from push notifications');
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
};
