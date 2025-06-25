import axiosInstance from '../../app/axios';
import { API_URL } from '../../config/appConfig';

const API_NOTIFICATIONS = `${API_URL}/api/notifications/`;
const API_SUBSCRIPTIONS = `${API_URL}/api/subscriptions/`;

// Create new notification
const createNotification = async (notificationData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axiosInstance.post(API_NOTIFICATIONS, notificationData, config);

  return response.data;
};

// Get all notifications (admin only)
const getAllNotifications = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axiosInstance.get(API_NOTIFICATIONS, config);

  return response.data;
};

// Get my notifications
const getMyNotifications = async (token) => {
  try {
    const endpoint = `${API_NOTIFICATIONS}/me`;
    console.log('Fetching my notifications from:', endpoint);
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    console.log('Request config:', { headers: { Authorization: 'Bearer [REDACTED]' } });
    const response = await axiosInstance.get(endpoint, config);
    
    if (response.status === 200) {
      console.log(`Received ${response.data?.length || 0} notifications for me with status ${response.status}`);
      if (response.data?.length === 0) {
        console.log('Received empty array from server - this is normal if user has no notifications');
      }
      
      // Log the first few notifications to help with debugging
      if (response.data && response.data.length > 0) {
        console.log('Sample notifications:', response.data.slice(0, 2).map(n => ({
          id: n._id,
          title: n.title,
          sender: n.sender?.name || 'Unknown'
        })));
      }
    } else {
      console.warn(`Unexpected response status: ${response.status}`);
    }
    
    // Ensure we always return an array, even if the API returns null/undefined
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error getting my notifications:', error?.response?.status || 'No status', 
      error?.response?.data?.message || error.message);
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

    const response = await axiosInstance.get(`${API_NOTIFICATIONS}/sent`, config);
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

  const response = await axiosInstance.get(`${API_NOTIFICATIONS}/${notificationId}`, config);

  return response.data;
};

// Update notification
const updateNotification = async (notificationId, notificationData, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axiosInstance.put(
    `${API_NOTIFICATIONS}/${notificationId}`,
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

  const response = await axiosInstance.delete(`${API_NOTIFICATIONS}/${notificationId}`, config);

  return response.data;
};

// Mark notification as read
const markNotificationAsRead = async (notificationId, token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axiosInstance.put(
    `${API_NOTIFICATIONS}/${notificationId}/read`,
    {},
    config
  );

  return response.data;
};

// Subscribe to push notifications
const subscribeToPushNotifications = async (subscription, token) => {
  // Validate token before making the request
  if (!token) {
    console.error('Token is undefined or null in subscribeToPushNotifications');
    throw new Error('Authentication token is missing');
  }
  
  console.log('Push subscription request with token:', token ? 'Valid token' : 'Missing token');
  
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  const response = await axiosInstance.post(API_SUBSCRIPTIONS, subscription, config);

  return response.data;
};

// Get VAPID public key
const getVapidPublicKey = async () => {
  const response = await axiosInstance.get(API_SUBSCRIPTIONS + 'vapidPublicKey');

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
