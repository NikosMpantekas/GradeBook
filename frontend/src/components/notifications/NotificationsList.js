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
import { format } from 'date-fns';

const NotificationsList = ({ 
  notifications, 
  tabValue, 
  user,
  onMarkAsRead,
  onEdit,
  onDelete,
  onNavigate 
}) => {
  
  const canEdit = (notification) => {
    return (tabValue === 1 && notification.sender && notification.sender._id === user._id) ||
           user.role === 'admin';
  };

  if (!Array.isArray(notifications) || notifications.length === 0) {
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

  return (
    <List>
      {notifications.map((notification) => (
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
                        onMarkAsRead(notification._id);
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
                        onEdit(e, notification);
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
                        onDelete(notification._id);
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
              bgcolor: notification.isRead ? 'transparent' : 'action.hover',
              '&:hover': {
                bgcolor: 'action.selected',
              },
              borderRadius: 1,
              mb: 1,
              border: notification.isImportant ? '2px solid' : '1px solid',
              borderColor: notification.isImportant ? 'warning.main' : 'divider',
            }}
            onClick={() => onNavigate(`/app/notifications/${notification._id}`)}
          >
            <ListItemAvatar>
              <Avatar sx={{ 
                bgcolor: notification.isImportant ? 'warning.main' : 'primary.main',
                width: 40,
                height: 40
              }}>
                {notification.isImportant ? (
                  <AnnouncementIcon />
                ) : notification.isRead ? (
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
                      fontWeight: notification.isRead ? 'normal' : 'bold',
                      flex: 1
                    }}
                  >
                    {notification.title}
                  </Typography>
                  {notification.isImportant && (
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
                    {notification.message}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PersonIcon sx={{ fontSize: 16 }} />
                      <Typography variant="caption" color="text.secondary">
                        {tabValue === 0 ? 
                          (notification.sender?.name || 'Unknown sender') : 
                          'To recipients'
                        }
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm')}
                    </Typography>
                  </Box>
                </Box>
              }
            />
          </ListItem>
          <Divider variant="inset" component="li" />
        </Box>
      ))}
    </List>
  );
};

export default NotificationsList;
