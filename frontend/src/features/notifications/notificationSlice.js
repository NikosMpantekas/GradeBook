import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import notificationService from './notificationService';

const initialState = {
  notifications: [], // Always initialize as empty array
  notification: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
  lastFetched: null, // Track when notifications were last fetched
};

// Create new notification
export const createNotification = createAsyncThunk(
  'notifications/create',
  async (notificationData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await notificationService.createNotification(notificationData, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get all notifications (admin only)
export const getAllNotifications = createAsyncThunk(
  'notifications/getAll',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await notificationService.getAllNotifications(token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get my notifications
export const getMyNotifications = createAsyncThunk(
  'notifications/getMyNotifications',
  async (_, thunkAPI) => {
    try {
      console.log('Dispatching getMyNotifications action');
      const token = thunkAPI.getState().auth.user.token;
      const response = await notificationService.getMyNotifications(token);
      
      // The service now guarantees an array will be returned even on error
      console.log(`Successfully received ${response.length} notifications in action creator`);
      return response;
    } catch (error) {
      console.error('Error in getMyNotifications action creator:', error);
      // Return an empty array instead of rejecting
      // This ensures our UI will always have something to render
      return [];
    }
  }
);

// Get sent notifications
export const getSentNotifications = createAsyncThunk(
  'notifications/getSentNotifications',
  async (_, thunkAPI) => {
    try {
      console.log('Dispatching getSentNotifications action');
      const token = thunkAPI.getState().auth.user.token;
      const response = await notificationService.getSentNotifications(token);
      
      // The service now guarantees an array will be returned even on error
      console.log(`Successfully received ${response.length} notifications in action creator`);
      return response; 
    } catch (error) {
      console.error('Error in getSentNotifications action creator:', error);
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      // Return an empty array instead of rejecting
      // This ensures our UI will always have something to render
      return []; 
    }
  }
);

// Get a specific notification
export const getNotification = createAsyncThunk(
  'notifications/getNotification',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await notificationService.getNotification(id, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update notification
export const updateNotification = createAsyncThunk(
  'notifications/update',
  async ({ id, notificationData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await notificationService.updateNotification(id, notificationData, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete notification
export const deleteNotification = createAsyncThunk(
  'notifications/delete',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await notificationService.deleteNotification(id, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Mark notification as read
export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (id, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await notificationService.markNotificationAsRead(id, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Subscribe to push notifications
export const subscribeToPushNotifications = createAsyncThunk(
  'notifications/subscribeToPush',
  async (subscription, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.user.token;
      return await notificationService.subscribeToPushNotifications(subscription, token);
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get VAPID public key
export const getVapidPublicKey = createAsyncThunk(
  'notifications/getVapidPublicKey',
  async (_, thunkAPI) => {
    try {
      return await notificationService.getVapidPublicKey();
    } catch (error) {
      const message =
        (error.response &&
          error.response.data &&
          error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    reset: (state) => {
      // Modified reset: preserve notifications array but reset other state flags
      // This prevents the notifications from disappearing when navigating between pages
      return {
        ...initialState,
        notifications: state.notifications, // Keep existing notifications
        lastFetched: state.lastFetched,    // Keep track of when we last fetched
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createNotification.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createNotification.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(createNotification.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getAllNotifications.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.notifications = action.payload;
      })
      .addCase(getAllNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getMyNotifications.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMyNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.notifications = action.payload;
      })
      // We don't use rejected case for getMyNotifications anymore since we always return an array
      // This ensures the UI never crashes even on network errors
      .addCase(getMyNotifications.rejected, (state) => {
        state.isLoading = false;
        state.isError = false; // Don't set error state since we're handling errors gracefully
        state.notifications = []; // Ensure we have an empty array to render
      })
      .addCase(getSentNotifications.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSentNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.notifications = action.payload;
      })
      .addCase(getSentNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getNotification.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getNotification.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.notification = action.payload;
      })
      .addCase(getNotification.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateNotification.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateNotification.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.notifications = state.notifications.map((notification) =>
          notification._id === action.payload._id ? action.payload : notification
        );
      })
      .addCase(updateNotification.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteNotification.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.notifications = state.notifications.filter(
          (notification) => notification._id !== action.payload.id
        );
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(markNotificationAsRead.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(markNotificationAsRead.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(subscribeToPushNotifications.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(subscribeToPushNotifications.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(subscribeToPushNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getVapidPublicKey.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(getVapidPublicKey.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = notificationSlice.actions;
export default notificationSlice.reducer;
