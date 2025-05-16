import axios from 'axios';

const API_URL = '/api/notifications/';
const SUBSCRIPTION_API_URL = '/api/subscriptions/';

// Create new notification
const createNotification = async (notificationData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.post(API_URL, notificationData, config);

  return response.data;
};

// Get all notifications (admin only)
const getAllNotifications = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(API_URL, config);

  return response.data;
};

// Get my notifications
const getMyNotifications = async (token) => {
  try {
    console.log('Fetching my notifications');
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const response = await axios.get(API_URL + 'me', config);
    console.log(`Received ${response.data?.length || 0} notifications for me`);
    
    // Ensure we always return an array, even if the API returns null/undefined
    if (!response.data || !Array.isArray(response.data)) {
      console.warn('API returned invalid notifications data, defaulting to empty array');
      return [];
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching my notifications:', error);
    // Instead of throwing, return an empty array with error logging
    // This prevents the UI from crashing
    return [];
  }
};

// Get sent notifications
const getSentNotifications = async (token) => {
  try {
    console.log('Fetching sent notifications');
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const response = await axios.get(API_URL + 'sent', config);
    console.log(`Received ${response.data.length} sent notifications`);
    
    // Ensure we always return an array, even if the API returns null/undefined
    if (!response.data || !Array.isArray(response.data)) {
      console.warn('API returned invalid notifications data, defaulting to empty array');
      return [];
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching sent notifications:', error);
    // Instead of throwing, return an empty array with error logging
    // This prevents the UI from crashing
    return [];
  }
};

// Get a specific notification
const getNotification = async (notificationId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.get(API_URL + notificationId, config);

  return response.data;
};

// Update notification
const updateNotification = async (notificationId, notificationData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.put(
    API_URL + notificationId,
    notificationData,
    config
  );

  return response.data;
};

// Delete notification
const deleteNotification = async (notificationId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.delete(API_URL + notificationId, config);

  return response.data;
};

// Mark notification as read
const markNotificationAsRead = async (notificationId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.put(
    API_URL + notificationId + '/read',
    {},
    config
  );

  return response.data;
};

// Subscribe to push notifications
const subscribeToPushNotifications = async (subscription, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.post(SUBSCRIPTION_API_URL, subscription, config);

  return response.data;
};

// Get VAPID public key
const getVapidPublicKey = async () => {
  const response = await axios.get(SUBSCRIPTION_API_URL + 'vapidPublicKey');

  return response.data;
};

const notificationService = {
  createNotification,
  getAllNotifications,
  getMyNotifications,
  getSentNotifications,
  getNotification,
  updateNotification,
  deleteNotification,
  markNotificationAsRead,
  subscribeToPushNotifications,
  getVapidPublicKey,
};

export default notificationService;
