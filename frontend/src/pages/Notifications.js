import React, { useEffect, useState, useCallback } from 'react';
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
  ListItemSecondaryAction,
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
  Tooltip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsNone as NotificationsNoneIcon,
  Announcement as AnnouncementIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MarkEmailRead as MarkEmailReadIcon,
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

  const handleRefresh = () => {
    if (tabValue === 0) {
      dispatch(getMyNotifications());
    } else {
      dispatch(getSentNotifications());
    }
  };

  const handleEditNotification = (notification) => {
    console.log('Edit notification:', notification);
    setCurrentNotification(notification);
    setEditForm({
      title: notification.title,
      message: notification.message,
      isImportant: notification.isImportant || false
    });
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setCurrentNotification(null);
  };

  const handleEditFormChange = (e) => {
    const { name, value, checked } = e.target;
    setEditForm({
      ...editForm,
      [name]: name === 'isImportant' ? checked : value,
    });
  };

  const handleSaveEdit = () => {
    if (currentNotification && currentNotification._id) {
      const updatedData = {
        title: editForm.title,
        message: editForm.message,
        isImportant: editForm.isImportant
      };
      
      dispatch(updateNotification({
        id: currentNotification._id,
        notificationData: updatedData
      }))
        .unwrap()
        .then(() => {
          toast.success('Notification updated successfully');
          handleCloseEditDialog();
          handleRefresh(); // Refresh the list after update
        })
        .catch((error) => {
          toast.error(`Failed to update: ${error}`);
        });
    }
  };

  const handleMarkAsRead = (notificationId) => {
    dispatch(markNotificationAsRead(notificationId))
      .unwrap()
      .then(() => {
        // Immediately update the UI to show the notification as read
        setDisplayedNotifications(prev => 
          prev.map(notification => 
            notification._id === notificationId 
              ? { ...notification, isRead: true } 
              : notification
          )
        );
        console.log(`Notification ${notificationId} marked as read`);
      })
      .catch(error => {
        console.error('Failed to mark notification as read:', error);
        toast.error('Failed to mark as read. Please try again.');
      });
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
    
    // Fixed path to include /app prefix to match the application's routing structure
    navigate(`/app/notifications/${id}`);
  };

  // Function to check if current user can edit a notification
  const canEdit = (notification) => {
    if (!user || !notification) return false;
    // User can edit if they are the sender or an admin
    return user._id === notification.sender?._id || user.role === 'admin';
  };
  
  // Function to open edit dialog for a notification
  const handleEdit = (e, notification) => {
    e.stopPropagation(); // Prevent triggering the list item click
    console.log('Editing notification:', notification);
    setCurrentNotification(notification);
    setEditForm({
      title: notification.title,
      message: notification.message,
      isImportant: notification.isImportant || false
    });
    setEditDialogOpen(true);
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
    if (!dateString) return 'Unknown date';
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };
  
  // Helper to safely get school name
  const getSchoolName = (school) => {
    if (!school) return 'Not assigned';
    if (typeof school === 'object' && school.name) return school.name;
    if (typeof school === 'string') return school;
    return 'Assigned';
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
          <Tabs 
            value={tabValue} 
            onChange={handleChangeTab} 
            aria-label="notification tabs"
            variant="fullWidth"
            centered
            sx={{
              '& .MuiTabs-flexContainer': {
                justifyContent: 'center',
              },
              '& .MuiTab-root': {
                minWidth: { xs: '50%', sm: 'auto' },
                px: { xs: 1, sm: 2 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }
            }}
          >
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
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {tabValue === 0 && !notification.isRead && (
                        <Tooltip title="Mark as read">
                          <IconButton 
                            edge="end" 
                            aria-label="mark as read"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification._id);
                            }}
                          >
                            <MarkEmailReadIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canEdit(notification) && (
                        <Tooltip title="Edit notification">
                          <IconButton 
                            edge="end" 
                            aria-label="edit" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(e, notification);
                            }}
                            sx={{ ml: 1, color: 'primary.main' }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {(tabValue === 1 || user.role === 'admin') && (
                        <Tooltip title="Delete notification">
                          <IconButton 
                            edge="end" 
                            aria-label="delete" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(notification._id);
                            }}
                            sx={{ ml: 1 }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
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
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography 
                            variant="subtitle1" 
                            sx={{ 
                              fontWeight: !notification.isRead && tabValue === 0 ? 'bold' : 'normal' 
                            }}
                          >
                            {notification.title}
                            {notification.isImportant && (
                              <Chip 
                                label="Important" 
                                color="error" 
                                size="small"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Typography>
                        </Box>
                        {/* Display sender information more prominently for admins */}
                        {user && user.role === 'admin' && notification.sender && (
                          <Typography variant="body2" color="text.secondary">
                            Sent by: <span style={{ fontWeight: 'bold' }}>{notification.sender.name}</span> 
                            ({notification.sender.role})
                          </Typography>
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
                          {/* Show accurate recipient information */}
                          {tabValue === 1 && (
                            <>
                              {notification.sendToAll 
                                ? ` - To: All ${notification.targetRole === 'all' ? 'Users' : notification.targetRole.charAt(0).toUpperCase() + notification.targetRole.slice(1) + 's'}` 
                                : notification.recipients && Array.isArray(notification.recipients) && notification.recipients.length > 0
                                ? ` - To: ${notification.recipients.length} specific user${notification.recipients.length > 1 ? 's' : ''}` 
                                : ` - To: Filtered group`}
                            </>
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
                    <strong>School:</strong> {getSchoolName(user.school)}
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
