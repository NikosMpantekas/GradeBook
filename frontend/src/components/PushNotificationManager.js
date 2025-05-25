import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Snackbar, Alert, Box, Typography, CircularProgress } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import axios from 'axios';

/**
 * PushNotificationManager component
 * Handles push notification subscriptions and permissions
 * This component should be included in App.js or a layout component
 */
const PushNotificationManager = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState('default');
  const [pushSubscription, setPushSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  
  // Check if push notifications are supported and get current subscription status
  useEffect(() => {
    const checkPushSupport = async () => {
      if (!user) return;
      
      // Check if service worker and push manager are supported
      const swSupported = 'serviceWorker' in navigator;
      const pushSupported = 'PushManager' in window;
      
      if (swSupported && pushSupported) {
        setPushSupported(true);
        console.log('[Push] Push notifications are supported');
        
        try {
          // Get push permission status
          const permission = Notification.permission;
          setPushPermission(permission);
          console.log(`[Push] Current notification permission: ${permission}`);
          
          // Check if we have a push worker registered
          const pushWorkerRegistered = sessionStorage.getItem('pushWorkerRegistered') === 'true';
          if (!pushWorkerRegistered) {
            console.log('[Push] Push worker not yet registered');
            return;
          }
          
          // Get current subscription
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setPushSubscription(subscription);
          
          if (subscription) {
            console.log('[Push] User is already subscribed to push notifications');
          } else {
            console.log('[Push] User is not subscribed to push notifications');
          }
        } catch (err) {
          console.error('[Push] Error checking push status:', err);
          setError('Failed to check push notification status');
        }
      } else {
        console.log('[Push] Push notifications are not supported');
        setPushSupported(false);
      }
    };
    
    checkPushSupport();
  }, [user]);
  
  // Function to request notification permission and subscribe
  const subscribeToPushNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Request permission if not granted
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        setPushPermission(permission);
        
        if (permission !== 'granted') {
          setNotification({
            open: true,
            message: 'Notification permission denied. Please enable notifications in your browser settings.',
            severity: 'warning'
          });
          setLoading(false);
          return;
        }
      }
      
      // Get VAPID public key from backend - FIXED ENDPOINT URL
      console.log('Fetching VAPID public key from fixed endpoint');
      const vapidResponse = await axios.get('/api/notifications/vapid', {
        headers: { 
          'Authorization': `Bearer ${user.token}`,
          'Cache-Control': 'no-cache'
        }
      });
      
      const publicKey = vapidResponse.data.vapidPublicKey;
      
      if (!publicKey) {
        throw new Error('Failed to get VAPID public key');
      }
      
      // Convert base64 public key to Uint8Array
      const convertedPublicKey = urlBase64ToUint8Array(publicKey);
      
      // Get service worker registration and subscribe
      const registration = await navigator.serviceWorker.ready;
      
      // Unsubscribe from any existing subscription first to ensure a clean state
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        await existingSubscription.unsubscribe();
      }
      
      // Create new subscription
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedPublicKey
      });
      
      console.log('[Push] Successfully created subscription');
      setPushSubscription(newSubscription);
      
      // CRITICAL FIX: The server expects direct subscription properties, not a nested subscription object
      const subscriptionData = {
        endpoint: newSubscription.endpoint,
        expirationTime: newSubscription.expirationTime,
        keys: {
          p256dh: newSubscription.keys.p256dh,
          auth: newSubscription.keys.auth
        }
      };
      
      console.log('[Push] Sending properly formatted subscription data to server');
      await axios.post('/api/notifications/subscription', 
        subscriptionData,
        { 
          headers: { 
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          } 
        }
      );
      
      setNotification({
        open: true,
        message: 'Successfully subscribed to push notifications!',
        severity: 'success'
      });
      
      console.log('[Push] Push notification subscription successful');
    } catch (err) {
      console.error('[Push] Error subscribing to push notifications:', err);
      setError('Failed to subscribe to push notifications');
      setNotification({
        open: true,
        message: `Failed to subscribe to push notifications: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Function to unsubscribe from push notifications
  const unsubscribeFromPushNotifications = async () => {
    if (!user || !pushSubscription) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Unsubscribe from push
      await pushSubscription.unsubscribe();
      setPushSubscription(null);
      
      // Notify server about unsubscription
      await axios.delete('/api/notifications/push-subscription', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      
      setNotification({
        open: true,
        message: 'Successfully unsubscribed from push notifications',
        severity: 'success'
      });
      
      console.log('[Push] Successfully unsubscribed from push notifications');
    } catch (err) {
      console.error('[Push] Error unsubscribing from push notifications:', err);
      setError('Failed to unsubscribe from push notifications');
      setNotification({
        open: true,
        message: `Failed to unsubscribe: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Utility function to convert base64 to Uint8Array for VAPID keys
  const urlBase64ToUint8Array = (base64String) => {
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
  
  // Handle notification close
  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') return;
    setNotification({ ...notification, open: false });
  };
  
  // Don't render anything if push is not supported or user is not logged in
  if (!user || !pushSupported) {
    return null;
  }
  
  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'background.paper',
          borderRadius: '50%',
          boxShadow: 3,
          p: 0
        }}
      >
        <Button
          variant="contained"
          color={pushSubscription ? "secondary" : "primary"}
          onClick={pushSubscription ? unsubscribeFromPushNotifications : subscribeToPushNotifications}
          disabled={loading || pushPermission === 'denied'}
          sx={{
            minWidth: '56px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            p: 0
          }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : pushSubscription ? (
            <NotificationsIcon />
          ) : (
            <NotificationsOffIcon />
          )}
        </Button>
      </Box>
      
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default PushNotificationManager;
