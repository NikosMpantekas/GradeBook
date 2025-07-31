import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Typography, 
  Paper, 
  Box, 
  CircularProgress,
  Tabs,
  Tab,
  Badge,
  Button,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { 
  getMyNotifications, 
  getSentNotifications,
  markNotificationAsRead,
  deleteNotification,
  updateNotification,
  reset,
} from '../features/notifications/notificationSlice';
import NotificationsList from '../components/notifications/NotificationsList';
import NotificationEditDialog from '../components/notifications/NotificationEditDialog';

const Notifications = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { notifications, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.notifications
  );

  const [tabValue, setTabValue] = useState(0);
  const [displayedNotifications, setDisplayedNotifications] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    message: '',
    isImportant: false
  });

  // Calculate unread notifications count
  const unreadCount = Array.isArray(displayedNotifications) 
    ? displayedNotifications.filter(n => !n.isRead && tabValue === 0).length 
    : 0;

  // Load notifications when component mounts
  useEffect(() => {
    console.log('Notifications component mounted');
    console.log('Initial notifications state:', {
      count: notifications?.length || 0,
      isLoading,
      isError,
      userRole: user?.role
    });

    if (tabValue === 0 && notifications && notifications.length > 0) {
      console.log('Using existing notifications from store:', notifications.length);
      setDisplayedNotifications(notifications);
    }
  }, []);

  // Load notifications when tab changes
  useEffect(() => {
    console.log(`Loading notifications, tab: ${tabValue === 0 ? 'Received' : 'Sent'}`);
    if (tabValue === 0) {
      console.log('Dispatching getMyNotifications for tab: Received');
      dispatch(getMyNotifications())
        .unwrap()
        .then((result) => {
          console.log(`Successfully loaded ${result.length} notifications for the current user`);
        })
        .catch((error) => {
          console.error('Failed to load notifications:', error);
          toast.error('Failed to load notifications');
        });
    } else {
      console.log('Dispatching getSentNotifications for tab: Sent');
      dispatch(getSentNotifications())
        .unwrap()
        .then((result) => {
          console.log(`Successfully loaded ${result.length} sent notifications`);
        })
        .catch((error) => {
          console.error('Failed to load sent notifications:', error);
          toast.error('Failed to load sent notifications');
        });
    }
  }, [tabValue, dispatch]);

  // Update displayed notifications when store changes
  useEffect(() => {
    if (notifications && Array.isArray(notifications)) {
      console.log(`Updating displayed notifications: ${notifications.length} total`);
      setDisplayedNotifications(notifications);
    }
  }, [notifications]);

  // Handle tab change
  const handleChangeTab = useCallback((event, newValue) => {
    console.log(`Switching to tab ${newValue === 0 ? 'Received' : 'Sent'}`);
    setTabValue(newValue);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    if (tabValue === 0) {
      dispatch(getMyNotifications());
    } else {
      dispatch(getSentNotifications());
    }
  }, [tabValue, dispatch]);

  // Handle mark as read
  const handleMarkAsRead = useCallback((notificationId) => {
    console.log(`Marking notification ${notificationId} as read`);
    dispatch(markNotificationAsRead(notificationId))
      .unwrap()
      .then(() => {
        toast.success('Notification marked as read');
        dispatch(getMyNotifications());
      })
      .catch((error) => {
        console.error('Failed to mark notification as read:', error);
        toast.error('Failed to mark notification as read');
      });
  }, [dispatch]);

  // Handle edit notification
  const handleEdit = useCallback((event, notification) => {
    event.preventDefault();
    console.log('Editing notification:', notification._id);
    setCurrentNotification(notification);
    setEditForm({
      title: notification.title,
      message: notification.message,
      isImportant: notification.isImportant || false
    });
    setEditDialogOpen(true);
  }, []);

  // Handle delete notification
  const handleDelete = useCallback((notificationId) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      console.log(`Deleting notification ${notificationId}`);
      dispatch(deleteNotification(notificationId))
        .unwrap()
        .then(() => {
          toast.success('Notification deleted successfully');
          handleRefresh();
        })
        .catch((error) => {
          console.error('Failed to delete notification:', error);
          toast.error('Failed to delete notification');
        });
    }
  }, [dispatch, handleRefresh]);

  // Handle save edit
  const handleSaveEdit = useCallback(() => {
    if (!currentNotification) return;

    console.log('Saving notification edit:', currentNotification._id);
    dispatch(updateNotification({
      id: currentNotification._id,
      notificationData: editForm
    }))
      .unwrap()
      .then(() => {
        toast.success('Notification updated successfully');
        setEditDialogOpen(false);
        setCurrentNotification(null);
        handleRefresh();
      })
      .catch((error) => {
        console.error('Failed to update notification:', error);
        toast.error('Failed to update notification');
      });
  }, [currentNotification, editForm, dispatch, handleRefresh]);

  // Handle form change
  const handleFormChange = useCallback((field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Handle navigate to notification detail
  const handleNavigate = useCallback((path) => {
    navigate(path);
  }, [navigate]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: { xs: 1, sm: 2 } }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: { xs: 1, sm: 2 },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 0 }
        }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Notifications
          </Typography>
          
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
            onClick={() => {
              console.log('Manually refreshing notifications');
              handleRefresh();
              toast.info('Refreshing notifications...');
            }}
          >
            Refresh
          </Button>
        </Box>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleChangeTab} 
            aria-label="notification tabs"
            variant="fullWidth"
            centered
          >
            <Tab 
              label={
                <Badge color="error" badgeContent={unreadCount} max={99}>
                  Received
                </Badge>
              } 
              id="tab-0" 
            />
            {(user?.role === 'teacher' || user?.role === 'admin') && (
              <Tab label="Sent" id="tab-1" />
            )}
          </Tabs>
        </Box>
        
        <NotificationsList
          notifications={displayedNotifications}
          tabValue={tabValue}
          user={user}
          onMarkAsRead={handleMarkAsRead}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onNavigate={handleNavigate}
        />
      </Paper>

      <NotificationEditDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        notification={currentNotification}
        editForm={editForm}
        onFormChange={handleFormChange}
        onSave={handleSaveEdit}
        isLoading={isLoading}
      />
    </Box>
  );
};

export default Notifications;
