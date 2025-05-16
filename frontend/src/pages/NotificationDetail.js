import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Typography, 
  Paper, 
  Box, 
  Button, 
  CircularProgress,
  Chip,
  Divider,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  NotificationsActive as NotificationsActiveIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { 
  getNotification, 
  markNotificationAsRead,
  deleteNotification,
  reset,
} from '../features/notifications/notificationSlice';

const NotificationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user } = useSelector((state) => state.auth);
  const { notification, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.notifications
  );

  useEffect(() => {
    if (id) {
      dispatch(getNotification(id));
    }
    
    return () => {
      dispatch(reset());
    };
  }, [id, dispatch]);

  useEffect(() => {
    if (isError) {
      toast.error(message);
      navigate('/app/notifications');
    }
    
    // If notification is not read, mark it as read
    if (notification && !notification.isRead) {
      dispatch(markNotificationAsRead(id));
    }
  }, [notification, isError, isSuccess, message, id, dispatch, navigate]);

  const handleDelete = () => {
    dispatch(deleteNotification(id)).then(() => {
      navigate('/app/notifications');
      toast.success('Notification deleted');
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'PPpp'); // Example: 'Apr 29, 2021, 5:34 PM'
  };

  const goBack = () => {
    navigate('/app/notifications');
  };

  // Check if user can delete this notification
  const canDelete = () => {
    if (!notification || !user) return false;
    return user.role === 'admin' || (notification.sender && notification.sender._id === user._id);
  };

  if (isLoading || !notification) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={goBack}
        sx={{ mb: 2 }}
      >
        Back to Notifications
      </Button>
      
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {notification.title}
            </Typography>
            {notification.isImportant && (
              <Chip 
                icon={<NotificationsActiveIcon />} 
                label="Important" 
                color="error" 
                size="small" 
              />
            )}
          </Box>
          
          {canDelete() && (
            <IconButton
              aria-label="delete"
              onClick={handleDelete}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar sx={{ mr: 2 }}>
            {notification.sender && notification.sender.name ? notification.sender.name.charAt(0).toUpperCase() : 'U'}
          </Avatar>
          <Box>
            <Typography variant="subtitle1">
              {notification.sender ? notification.sender.name : 'Unknown User'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDate(notification.createdAt)}
            </Typography>
          </Box>
        </Box>
        
        <Typography variant="body1" sx={{ mb: 4, whiteSpace: 'pre-line' }}>
          {notification.message}
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          {notification.school && (
            <Chip 
              label={`School: ${notification.school.name}`} 
              size="small" 
              sx={{ mr: 1, mb: 1 }} 
            />
          )}
          {notification.direction && (
            <Chip 
              label={`Direction: ${notification.direction.name}`} 
              size="small" 
              sx={{ mr: 1, mb: 1 }} 
            />
          )}
          {notification.subject && (
            <Chip 
              label={`Subject: ${notification.subject.name}`} 
              size="small" 
              sx={{ mr: 1, mb: 1 }} 
            />
          )}
          {/* Display recipients more accurately based on actual data */}
          {notification.sendToAll ? (
            <Chip 
              label={notification.targetRole === 'all' ? 'Recipients: All Users' : `Recipients: All ${notification.targetRole.charAt(0).toUpperCase() + notification.targetRole.slice(1)}s`}
              size="small" 
              sx={{ mr: 1, mb: 1 }}
              color="primary" 
            />
          ) : notification.recipients && notification.recipients.length > 0 ? (
            <Chip 
              label={`Recipients: ${notification.recipients.length} specific user${notification.recipients.length > 1 ? 's' : ''}`}
              size="small" 
              sx={{ mr: 1, mb: 1 }}
              color="success" 
            />
          ) : notification.schools || notification.directions || notification.subjects ? (
            <Chip 
              label="Recipients: Filtered group"
              size="small" 
              sx={{ mr: 1, mb: 1 }}
              color="info" 
            />
          ) : (
            <Chip 
              label="Recipients: Unknown"
              size="small" 
              sx={{ mr: 1, mb: 1 }} 
            />
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default NotificationDetail;
