import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Typography, 
  Paper, 
  Box, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar,
  Avatar,
  IconButton,
  Divider,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  Badge,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsNone as NotificationsNoneIcon,
  Delete as DeleteIcon,
  MarkEmailRead as MarkAsReadIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { 
  getMyNotifications, 
  getSentNotifications,
  markNotificationAsRead,
  deleteNotification,
  updateNotification,
  reset,
} from '../features/notifications/notificationSlice';

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

  // On component mount, check if notifications already exist in the store
  useEffect(() => {
    console.log('Notifications component mounted');
    console.log('Initial notifications state:', {
      count: notifications?.length || 0,
      isLoading,
      isError,
      userRole: user?.role
    });

    // If notifications already exist in the store and we're showing received notifications,
    // use them right away instead of waiting for a new fetch
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
          console.error('Error loading my notifications:', error);
          toast.error('Failed to load notifications. Please try again.');
        });
    } else {
      console.log('Dispatching getSentNotifications for tab: Sent');
      dispatch(getSentNotifications())
        .unwrap()
        .then((result) => {
          console.log(`Successfully loaded ${result.length} sent notifications`);
        })
        .catch((error) => {
          console.error('Error loading sent notifications:', error);
          toast.error('Failed to load sent notifications. Please try again.');
        });
    }

    return () => {
      dispatch(reset());
    };
  }, [dispatch, tabValue]);

  useEffect(() => {
    if (isError) {
      toast.error(message);
      console.error('Notification error state triggered:', message);
    }

    if (notifications) {
      console.log(`Setting displayed notifications: ${notifications.length} items`, 
        notifications.map(n => ({ id: n._id, title: n.title })));
      setDisplayedNotifications(notifications);
    } else {
      console.warn('Notifications array is falsy:', notifications);
      // Ensure we at least have an empty array
      setDisplayedNotifications([]);
    }

    return () => {
      dispatch(reset());
    };
  }, [notifications, isError, isSuccess, message, dispatch]);

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleMarkAsRead = (id) => {
    dispatch(markNotificationAsRead(id));
  };

  const handleDeleteNotification = (id) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      dispatch(deleteNotification(id));
    }
  };

  const handleViewNotification = (id) => {
    // Mark as read if not already read
    const notification = displayedNotifications.find(n => n._id === id);
    if (notification && !notification.isRead && tabValue === 0) {
      dispatch(markNotificationAsRead(id));
    }
    
    // Navigate to notification detail view
    navigate(`/app/notifications/${id}`);
  };

  // Calculate unread count
  const unreadCount = displayedNotifications?.filter(n => !n.isRead).length || 0;

  // Get the appropriate icon for the notification
  const getNotificationIcon = (notification) => {
    if (notification.isImportant) {
      return <NotificationsActiveIcon color="error" />;
    }
    if (!notification.isRead && tabValue === 0) {
      return <NotificationsActiveIcon color="primary" />;
    }
    return <NotificationsIcon color="primary" />;
  };

  // Helper function to format date/time
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'PPp'); // Example: 'Apr 29, 2021, 5:34 PM'
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Paper elevation={3} sx={{ p: 2, borderRadius: 2, mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2 
        }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Notifications
          </Typography>
          
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
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
          <Tabs value={tabValue} onChange={handleChangeTab} aria-label="notification tabs">
            <Tab 
              label={
                <Badge color="error" badgeContent={unreadCount} max={99}>
                  Received
                </Badge>
              } 
              id="tab-0" 
            />
            {(user.role === 'teacher' || user.role === 'admin') && (
              <Tab label="Sent" id="tab-1" />
            )}
          </Tabs>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {Array.isArray(displayedNotifications) && displayedNotifications.length > 0 ? (
          <List>
            {displayedNotifications.map((notification) => (
              <Box key={notification._id}>
                <ListItem
                  alignItems="flex-start"
                  secondaryAction={
                    <>
                      {tabValue === 0 && !notification.isRead && (
                        <IconButton 
                          edge="end" 
                          aria-label="mark as read"
                          onClick={() => handleMarkAsRead(notification._id)}
                          title="Mark as read"
                        >
                          <MarkAsReadIcon />
                        </IconButton>
                      )}
                      {(tabValue === 1 || user.role === 'admin') && (
                        <IconButton 
                          edge="end" 
                          aria-label="delete" 
                          onClick={() => handleDeleteNotification(notification._id)}
                          title="Delete notification"
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                      {(tabValue === 1 || user.role === 'admin') && (
                        <IconButton 
                          edge="end" 
                          aria-label="edit" 
                          onClick={() => handleEditNotification(notification)}
                          title="Edit notification"
                          sx={{ ml: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                      )}
                    </>
                  }
                  sx={{ 
                    cursor: 'pointer', 
                    bgcolor: !notification.isRead && tabValue === 0 ? 'action.hover' : 'transparent',
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => handleViewNotification(notification._id)}
                >
                  <ListItemAvatar>
                    <Avatar>
                      {getNotificationIcon(notification)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            fontWeight: !notification.isRead && tabValue === 0 ? 'bold' : 'normal' 
                          }}
                        >
                          {notification.title}
                        </Typography>
                        {notification.isImportant && (
                          <Chip label="Important" color="error" size="small" />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                          sx={{ 
                            display: 'block',
                            fontWeight: !notification.isRead && tabValue === 0 ? 'medium' : 'normal',
                          }}
                        >
                          {notification.message.length > 100 
                            ? `${notification.message.substring(0, 100)}...` 
                            : notification.message}
                        </Typography>
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                        >
                          {formatDate(notification.createdAt)}
                          {tabValue === 0 && notification.sender && (
                            ` - From: ${notification.sender.name || 'Unknown'}`
                          )}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </Box>
            ))}
          </List>
        ) : (
          <Box textAlign="center" py={4}>
            <NotificationsNoneIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No notifications found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {tabValue === 0 
                ? "You don't have any notifications yet. New notifications will appear here." 
                : "You haven't sent any notifications yet."}
            </Typography>
            
            {tabValue === 0 && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, maxWidth: 500, mx: 'auto' }}>
                <Typography variant="caption" color="text.secondary" component="div" sx={{ textAlign: 'left', mb: 1 }}>
                  <strong>User role:</strong> {user?.role || 'Unknown'}
                </Typography>
                <Typography variant="caption" color="text.secondary" component="div" sx={{ textAlign: 'left', mb: 1 }}>
                  <strong>User ID:</strong> {user?._id ? user._id.substring(0, 8) + '...' : 'Not logged in'}
                </Typography>
                {user?.school && (
                  <Typography variant="caption" color="text.secondary" component="div" sx={{ textAlign: 'left', mb: 1 }}>
                    <strong>School:</strong> {typeof user.school === 'object' ? user.school.name : user.school}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" component="div" sx={{ textAlign: 'left' }}>
                  <strong>Last checked:</strong> {new Date().toLocaleTimeString()}
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => dispatch(getMyNotifications())}
                  sx={{ mt: 2 }}
                >
                  Refresh notifications
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Paper>
      
      {/* Edit Notification Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EditIcon sx={{ mr: 1 }} />
            Edit Notification
          </Box>
        </DialogTitle>
        <DialogContent>
          {currentNotification && (
            <Box component="form" sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={editForm.title}
                onChange={handleEditFormChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Message"
                name="message"
                value={editForm.message}
                onChange={handleEditFormChange}
                multiline
                rows={4}
                margin="normal"
                required
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={editForm.isImportant}
                    onChange={handleEditFormChange}
                    name="isImportant"
                    color="error"
                  />
                }
                label="Mark as important notification"
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveEdit} 
            variant="contained" 
            color="primary"
            disabled={!editForm.title || !editForm.message}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Notifications;
