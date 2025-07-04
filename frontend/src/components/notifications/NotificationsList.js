import React from 'react';
import {
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
  Tooltip,
  Typography,
} from '@mui/material';
import {
  NotificationsActive as NotificationsActiveIcon,
  NotificationsNone as NotificationsNoneIcon,
  Announcement as AnnouncementIcon,
  Person as PersonIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MarkEmailRead as MarkEmailReadIcon,
} from '@mui/icons-material';
import { format, isValid, parseISO } from 'date-fns';

const NotificationsList = ({ 
  notifications, 
  tabValue, 
  user,
  onMarkAsRead,
  onEdit,
  onDelete,
  onNavigate 
}) => {
  
  // Safely validate notification data
  const validateNotification = (notification) => {
    if (!notification || typeof notification !== 'object') {
      console.warn('Invalid notification object:', notification);
      return false;
    }
    
    // Ensure required fields exist
    if (!notification._id || !notification.title || !notification.message) {
      console.warn('Notification missing required fields:', notification);
      return false;
    }
    
    return true;
  };

  // Safe date formatting
  const formatNotificationDate = (dateString) => {
    try {
      if (!dateString) return 'Unknown date';
      
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
      
      if (!isValid(date)) {
        console.warn('Invalid date for notification:', dateString);
        return 'Invalid date';
      }
      
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch (error) {
      console.error('Error formatting notification date:', error);
      return 'Date error';
    }
  };

  // Safe navigation handler
  const handleNotificationClick = (notificationId) => {
    try {
      if (!notificationId || typeof notificationId !== 'string') {
        console.error('Invalid notification ID for navigation:', notificationId);
        return;
      }
      
      // Ensure onNavigate is a function before calling
      if (typeof onNavigate === 'function') {
        onNavigate(`/app/notifications/${notificationId}`);
      } else {
        console.error('onNavigate is not a function:', typeof onNavigate);
      }
    } catch (error) {
      console.error('Error navigating to notification:', error);
    }
  };
  
  const canEdit = (notification) => {
    if (!notification || !notification.sender || !user) return false;
    
    return (tabValue === 1 && notification.sender && notification.sender._id === user._id) ||
           user.role === 'admin';
  };

  // Validate notifications array
  if (!Array.isArray(notifications)) {
    console.error('Notifications is not an array:', typeof notifications, notifications);
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          py: 8, 
          textAlign: 'center' 
        }}
      >
        <NotificationsNoneIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
        <Typography variant="h6" color="error.main" gutterBottom>
          Error loading notifications
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Invalid notification data received. Please refresh the page.
        </Typography>
      </Box>
    );
  }

  if (notifications.length === 0) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          py: 8, 
          textAlign: 'center' 
        }}
      >
        <NotificationsNoneIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {tabValue === 0 ? 'No notifications received' : 'No notifications sent'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {tabValue === 0 
            ? 'You will see new notifications here when they arrive.' 
            : 'Notifications you send will appear here.'
          }
        </Typography>
      </Box>
    );
  }

  // Filter out invalid notifications
  const validNotifications = notifications.filter(validateNotification);

  if (validNotifications.length === 0) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          py: 8, 
          textAlign: 'center' 
        }}
      >
        <NotificationsNoneIcon sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
        <Typography variant="h6" color="warning.main" gutterBottom>
          Invalid notification data
        </Typography>
        <Typography variant="body2" color="text.secondary">
          All notifications contain invalid data. Please contact support.
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {validNotifications.map((notification) => {
        // Additional safety check for each notification
        const safeNotification = {
          _id: notification._id || 'unknown',
          title: notification.title || 'Untitled',
          message: notification.message || 'No message',
          isRead: Boolean(notification.isRead),
          isImportant: Boolean(notification.isImportant || notification.urgent),
          sender: notification.sender || { name: 'Unknown sender' },
          createdAt: notification.createdAt || new Date().toISOString()
        };

        return (
          <Box key={safeNotification._id}>
            <ListItem
              alignItems="flex-start"
              secondaryAction={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {tabValue === 0 && !safeNotification.isRead && (
                    <Tooltip title="Mark as read">
                      <IconButton 
                        edge="end" 
                        aria-label="mark as read"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (typeof onMarkAsRead === 'function') {
                            onMarkAsRead(safeNotification._id);
                          }
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
                          if (typeof onEdit === 'function') {
                            onEdit(e, notification);
                          }
                        }}
                        sx={{ ml: 1, color: 'primary.main' }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {(tabValue === 1 || user?.role === 'admin') && (
                    <Tooltip title="Delete notification">
                      <IconButton 
                        edge="end" 
                        aria-label="delete" 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (typeof onDelete === 'function') {
                            onDelete(safeNotification._id);
                          }
                        }}
                        sx={{ ml: 1, color: 'error.main' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              }
              sx={{
                cursor: 'pointer',
                bgcolor: safeNotification.isRead ? 'transparent' : 'action.hover',
                '&:hover': {
                  bgcolor: 'action.selected',
                },
                borderRadius: 1,
                mb: 1,
                border: safeNotification.isImportant ? '2px solid' : '1px solid',
                borderColor: safeNotification.isImportant ? 'warning.main' : 'divider',
              }}
              onClick={() => handleNotificationClick(safeNotification._id)}
            >
              <ListItemAvatar>
                <Avatar sx={{ 
                  bgcolor: safeNotification.isImportant ? 'warning.main' : 'primary.main',
                  width: 40,
                  height: 40
                }}>
                  {safeNotification.isImportant ? (
                    <AnnouncementIcon />
                  ) : safeNotification.isRead ? (
                    <NotificationsNoneIcon />
                  ) : (
                    <NotificationsActiveIcon />
                  )}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: safeNotification.isRead ? 'normal' : 'bold',
                        flex: 1
                      }}
                    >
                      {safeNotification.title}
                    </Typography>
                    {safeNotification.isImportant && (
                      <Chip 
                        label="Important" 
                        size="small" 
                        color="warning"
                        variant="outlined"
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        mb: 1
                      }}
                    >
                      {safeNotification.message}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PersonIcon sx={{ fontSize: 16 }} />
                        <Typography variant="caption" color="text.secondary">
                          {tabValue === 0 ? 
                            (safeNotification.sender?.name || 'Unknown sender') : 
                            'To recipients'
                          }
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {formatNotificationDate(safeNotification.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </ListItem>
            <Divider variant="inset" component="li" />
          </Box>
        );
      })}
    </List>
  );
};

export default NotificationsList;
