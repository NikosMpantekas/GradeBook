import axios from 'axios';
import { store } from '../app/store';
import { subscribeToPushNotifications, getVapidPublicKey } from '../features/notifications/notificationSlice';

const convertBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const setupPushNotifications = async () => {
  try {
    // Check if service workers are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      // Register service worker if not already registered
      const registration = await navigator.serviceWorker.ready;
      
      // Get existing subscription
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        // Subscription already exists
        console.log('Push notification subscription already exists');
        return existingSubscription;
      }
      
      // Get VAPID public key from server
      const vapidPublicKeyResponse = await store.dispatch(getVapidPublicKey());
      
      if (vapidPublicKeyResponse.error) {
        throw new Error('Failed to get VAPID public key');
      }
      
      const vapidPublicKey = vapidPublicKeyResponse.payload.vapidPublicKey;
      
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not available');
      }
      
      // Convert VAPID public key to Uint8Array
      const applicationServerKey = convertBase64ToUint8Array(vapidPublicKey);
      
      // Request push notification permission
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
      
      // Send subscription to server
      await store.dispatch(subscribeToPushNotifications(subscription));
      
      console.log('Push notification subscription successful');
      return subscription;
    }
  } catch (error) {
    console.error('Error setting up push notifications:', error);
    return null;
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
        await axios.delete('/api/subscriptions', {
          data: { endpoint },
          headers: {
            Authorization: `Bearer ${store.getState().auth.user.token}`,
          },
        });
        
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
