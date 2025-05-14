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
  ListItemIcon, 
  ListItemAvatar,
  Avatar,
  IconButton,
  Divider,
  Chip,
  CircularProgress,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  NotificationsNone as NotificationsNoneIcon,
  Delete as DeleteIcon,
  MarkEmailRead as MarkAsReadIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { 
  getMyNotifications, 
  getSentNotifications,
  markNotificationAsRead,
  deleteNotification,
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

  useEffect(() => {
    if (tabValue === 0) {
      dispatch(getMyNotifications());
    } else {
      dispatch(getSentNotifications());
    }

    return () => {
      dispatch(reset());
    };
  }, [dispatch, tabValue]);

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }

    if (notifications) {
      setDisplayedNotifications(notifications);
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
    dispatch(deleteNotification(id)).then(() => {
      setDisplayedNotifications(prevState => 
        prevState.filter(notification => notification._id !== id)
      );
    });
  };

  const handleViewNotification = (id) => {
    navigate(`/notifications/${id}`);
  };

  // Helper function to get notification icons
  const getNotificationIcon = (notification) => {
    if (notification.isImportant) {
      return <NotificationsActiveIcon color="error" />;
    }
    if (notification.isRead) {
      return <NotificationsNoneIcon color="disabled" />;
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
      <Paper 
        elevation={3} 
        sx={{ p: 2, borderRadius: 2, mb: 3 }}
      >
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
          Notifications
        </Typography>
        
        <Tabs 
          value={tabValue} 
          onChange={handleChangeTab} 
          centered
          sx={{ mb: 2 }}
        >
          <Tab 
            label={
              <Badge 
                badgeContent={displayedNotifications?.filter(n => !n.isRead && tabValue === 0).length || 0} 
                color="error"
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <NotificationsIcon sx={{ mr: 1 }} />
                  Received
                </Box>
              </Badge>
            } 
          />
          {(user?.role === 'teacher' || user?.role === 'admin') && (
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SendIcon sx={{ mr: 1 }} />
                  Sent
                </Box>
              } 
            />
          )}
        </Tabs>
        
        <Divider sx={{ mb: 2 }} />
        
        {displayedNotifications?.length > 0 ? (
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
                      {(tabValue === 1 || (user?.role === 'admin')) && (
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
              No notifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tabValue === 0 
                ? "You don't have any notifications yet." 
                : "You haven't sent any notifications yet."}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Notifications;
