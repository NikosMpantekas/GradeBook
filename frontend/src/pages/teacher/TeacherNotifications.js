import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Typography,
  Paper,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  Grid,
  useTheme,
  useMediaQuery,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  MarkEmailRead as MarkReadIcon,
  Edit as EditIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import {
  getSentNotifications,
  getMyNotifications,
  deleteNotification,
  markNotificationAsRead,
  updateNotification,
} from '../../features/notifications/notificationSlice';
// Removed directions import as we're no longer using direction filters

const TeacherNotifications = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { user } = useSelector((state) => state.auth);
  const { notifications, isLoading, isSuccess, isError, message } = useSelector(
    (state) => state.notifications
  );
  // Removed directions selector to fix TypeError

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [senderFilter, setSenderFilter] = useState('all'); // Add sender filter state
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    message: '',
    isImportant: false
  });
  const [senders, setSenders] = useState([]); // Track available senders for filter

  // Define fetchTeacherNotifications at component level so it's accessible by other functions
  const fetchTeacherNotifications = async () => {
    try {
      const [receivedData, sentData] = await Promise.all([
        dispatch(getMyNotifications()).unwrap(),
        dispatch(getSentNotifications()).unwrap()
      ]);
      
      console.log(`Teacher: Successfully fetched ${receivedData?.length || 0} received and ${sentData?.length || 0} sent notifications`);
      
      // Combine received and sent notifications, mark them for UI purposes
      const receivedNotifications = Array.isArray(receivedData) ? receivedData.map(notif => ({ ...notif, notificationType: 'received' })) : [];
      const sentNotifications = Array.isArray(sentData) ? sentData.map(notif => ({ ...notif, notificationType: 'sent' })) : [];
      
      const allNotifications = [...receivedNotifications, ...sentNotifications];
      console.log(`Teacher: Combined ${allNotifications.length} total notifications`);
      
      setFilteredNotifications(allNotifications);
    } catch (error) {
      console.error('Error fetching teacher notifications:', error);
      toast.error('Failed to load notifications');
    }
  };

  // Load notifications immediately on component mount
  useEffect(() => {
    console.log('TeacherNotifications component mounted - loading notifications');
    
    // For admins, use the unified endpoint which now handles role-based filtering
    if (user && user.role === 'admin') {
      console.log('Admin user detected - loading notifications via unified endpoint');
      dispatch(getMyNotifications())
        .unwrap()
        .then(data => {
          console.log(`Admin: Successfully fetched ${data?.length || 0} notifications`);
          if (Array.isArray(data) && data.length > 0) {
            setFilteredNotifications(data);
          }
        })
        .catch(error => {
          console.error('Error fetching admin notifications:', error);
          toast.error('Failed to load notifications');
        });
    } else {
      // For teachers, fetch BOTH received and sent notifications
      console.log('Teacher user detected - loading BOTH received and sent notifications');
      
      fetchTeacherNotifications();
    }
    
    // Don't reset on unmount to avoid data flashing
    return () => {};
  }, [dispatch, user]);

  // When notifications data changes, update our filtered list and extract senders
  useEffect(() => {
    if (isError) {
      console.error('Error in notifications:', message);
      toast.error(message || 'Failed to load notifications');
    }

    // Make sure we have data to show
    if (notifications && Array.isArray(notifications)) {
      console.log(`Setting up ${notifications.length} notifications`);
      
      // Extract unique senders for the filter dropdown
      const uniqueSenders = new Set();
      notifications.forEach(notification => {
        if (notification.sender && notification.sender.name) {
          uniqueSenders.add(notification.sender.name);
        }
      });
      setSenders(uniqueSenders);
      
      // Apply search and sender filters
      applyFilters(notifications);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications, isError, isSuccess, message, searchTerm, senderFilter]);

  const applyFilters = useCallback((teacherNotifications) => {
    // Defensive coding - ensure teacherNotifications is valid
    if (!teacherNotifications || !Array.isArray(teacherNotifications)) {
      console.warn('Invalid notifications data in applyFilters');
      return;
    }

    try {
      console.log(`Applying filters to ${teacherNotifications.length} notifications`);
      let filtered = [...teacherNotifications];

      // First apply sender filter if selected
      if (senderFilter && senderFilter !== 'all') {
        filtered = filtered.filter(notification => 
          notification.sender && notification.sender._id === senderFilter
        );
        console.log(`After sender filter (${senderFilter}): ${filtered.length} notifications`);
      }

      // Then apply search term filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        filtered = filtered.filter(notification => {
          // Ensure properties exist before accessing them
          const hasTitle = notification?.title && typeof notification.title === 'string';
          const hasMessage = notification?.message && typeof notification.message === 'string';
          
          // Handle different recipient formats
          let hasMatchingRecipient = false;
          if (notification.recipient && notification.recipient.name) {
            // Single recipient case
            hasMatchingRecipient = notification.recipient.name.toLowerCase().includes(search);
          }
          
          // Also search in sender name for more comprehensive results
          let hasMatchingSender = false;
          if (notification.sender && notification.sender.name) {
            hasMatchingSender = notification.sender.name.toLowerCase().includes(search);
          }
          
          return (
            (hasTitle && notification.title.toLowerCase().includes(search)) ||
            (hasMessage && notification.message.toLowerCase().includes(search)) ||
            hasMatchingRecipient ||
            hasMatchingSender
          );
        });
      }

      console.log(`After filtering: ${filtered.length} notifications`);
      setFilteredNotifications(filtered);
    } catch (error) {
      console.error('Error in applyFilters:', error);
      // Don't overwrite existing data on error
    }
  }, [searchTerm, senderFilter]); // Removed directionFilter dependency to fix TypeError

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };
  
  // Handle sender filter change
  const handleSenderFilterChange = (event) => {
    setSenderFilter(event.target.value);
    setPage(0);
  };

  const handleAddNotification = () => {
    if (user?.role === 'teacher' && user?.canSendNotifications === false) {
      toast.error('You do not have permission to create notifications');
      return;
    }
    navigate('/app/teacher/notifications/create');
  };

  const handleViewNotification = (id) => {
    navigate(`/app/notifications/${id}`);
  };

  const handleEditClick = (notification) => {
    console.log('Editing notification:', notification);
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
        .then((updatedNotification) => {
          toast.success('Notification updated successfully');
          handleCloseEditDialog();
          
          setFilteredNotifications(prevNotifications => 
            prevNotifications.map(notification => 
              notification._id === updatedNotification._id ? updatedNotification : notification
            )
          );
          
          if (user && user.role === 'admin') {
            dispatch(getMyNotifications());
          } else {
            dispatch(getSentNotifications());
          }
        })
        .catch((error) => {
          toast.error(`Failed to update: ${error}`);
        });
    }
  };

  const handleDeleteClick = (notification) => {
    setNotificationToDelete(notification);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (notificationToDelete) {
      dispatch(deleteNotification(notificationToDelete._id))
        .unwrap()
        .then((response) => {
          toast.success('Notification deleted successfully');
          
          setFilteredNotifications(prevNotifications => 
            prevNotifications.filter(notification => notification._id !== notificationToDelete._id)
          );
          
          if (user && user.role === 'admin') {
            dispatch(getMyNotifications());
          } else {
            dispatch(getSentNotifications());
          }
        })
        .catch((error) => {
          toast.error(`Failed to delete: ${error}`);
        });
    }
    setDeleteDialogOpen(false);
    setNotificationToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setNotificationToDelete(null);
  };

  const handleMarkAsRead = (id) => {
    // Optimistically update UI immediately
    setFilteredNotifications(prevNotifications => 
      prevNotifications.map(notification => {
        if (notification._id === id) {
          return { ...notification, isRead: true };
        }
        return notification;
      })
    );
    
    // Send request to backend
    dispatch(markNotificationAsRead(id))
      .unwrap()
      .then(() => {
        console.log(`Notification ${id} marked as read successfully`);
        toast.success('Notification marked as read');
        
        // Refresh notifications to ensure consistency
        if (user?.role === 'teacher') {
          // Re-fetch both received and sent notifications for teachers
          fetchTeacherNotifications();
        } else if (user?.role === 'admin') {
          dispatch(getMyNotifications());
        } else {
          dispatch(getMyNotifications());
        }
      })
      .catch(error => {
        console.error('Failed to mark notification as read:', error);
        toast.error('Failed to mark notification as read');
        
        // Revert optimistic update on error
        setFilteredNotifications(prevNotifications => 
          prevNotifications.map(notification => {
            if (notification._id === id) {
              return { ...notification, isRead: false };
            }
            return notification;
          })
        );
      });
  };

  const getRecipientDisplayText = (notification) => {
    if (!notification) return 'Unknown';
    
    if (notification.sendToAll) {
      return `All ${notification.targetRole === 'all' ? 'Users' : notification.targetRole.charAt(0).toUpperCase() + notification.targetRole.slice(1) + 's'}`;
    }
    
    if (notification.recipients && Array.isArray(notification.recipients) && notification.recipients.length > 0) {
      return `${notification.recipients.length} selected ${notification.recipients.length === 1 ? 'user' : 'users'}`;
    }
    
    if (notification.recipient && notification.recipient.name) {
      return notification.recipient.name;
    }
    
    return 'Filtered group';
  };

  // Mobile card layout for notifications
  const renderMobileContent = () => {
    if (isLoading && (!filteredNotifications || filteredNotifications.length === 0)) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Loading notifications...
          </Typography>
        </Box>
      );
    }

    if (!filteredNotifications || filteredNotifications.length === 0) {
      return (
        <Box py={4} textAlign="center">
          <Typography variant="subtitle1" color="text.secondary">
            {isError 
              ? 'Error loading notifications. Please try again.' 
              : 'No notifications found.'}
          </Typography>
          {isError && (
            <Button 
              variant="contained" 
              sx={{ mt: 2 }} 
              onClick={() => dispatch(getSentNotifications())}
            >
              Retry
            </Button>
          )}
          {!isError && !isLoading && (
            <Button 
              variant="contained" 
              sx={{ mt: 2 }} 
              startIcon={<AddIcon />}
              onClick={handleAddNotification}
            >
              Create Your First Notification
            </Button>
          )}
        </Box>
      );
    }

    return (
      <Box sx={{ px: { xs: 1, sm: 2 } }}>
        {filteredNotifications
          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
          .map((notification) => (
            <Card
              key={notification._id || 'no-id-' + Math.random()}
              sx={{
                mb: 2,
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 2,
                  transform: 'translateY(-1px)',
                  transition: 'all 0.2s ease'
                }
              }}
              onClick={() => handleViewNotification(notification._id)}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Avatar sx={{ 
                    bgcolor: notification.notificationType === 'received' ? 'info.main' : 'primary.main',
                    width: 40,
                    height: 40,
                    flexShrink: 0
                  }}>
                    <NotificationsIcon />
                  </Avatar>
                  
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Chip
                        size="small"
                        label={notification.notificationType === 'received' ? 'Received' : 'Sent'}
                        color={notification.notificationType === 'received' ? 'info' : 'primary'}
                        variant="outlined"
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {notification.createdAt 
                          ? format(new Date(notification.createdAt), 'MMM dd, yyyy')
                          : 'Unknown date'}
                      </Typography>
                    </Box>
                    
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 'bold',
                        mb: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {notification.title || 'No title'}
                    </Typography>
                    
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.4
                      }}
                    >
                      {notification.message 
                        ? (notification.message.length > 100
                           ? `${notification.message.substring(0, 100)}...`
                           : notification.message)
                        : 'No message'}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PersonIcon sx={{ fontSize: 16 }} />
                        <Typography variant="caption" color="text.secondary">
                          {getRecipientDisplayText(notification)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Chip
                          size="small"
                          label={notification.isRead ? 'Read' : 'Unread'}
                          color={notification.isRead ? 'success' : 'warning'}
                        />
                        {notification.isImportant && (
                          <Chip 
                            label="Important" 
                            color="error" 
                            size="small"
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Box>
                
                {/* Action buttons */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
                  <IconButton
                    color="primary"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewNotification(notification._id);
                    }}
                    title="View notification"
                  >
                    <VisibilityIcon />
                  </IconButton>
                  
                  {notification.notificationType === 'received' ? (
                    !notification.isRead && (
                      <IconButton
                        color="success"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification._id);
                        }}
                        title="Mark as read"
                      >
                        <MarkReadIcon />
                      </IconButton>
                    )
                  ) : (
                    <>
                      {(user?.role === 'admin' || 
                        (notification.sender && notification.sender._id === user?._id) ||
                        (notification.createdBy && notification.createdBy._id === user?._id)) && (
                        <>
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(notification);
                            }}
                            title="Edit notification"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(notification);
                            }}
                            title="Delete notification"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </>
                      )}
                      {!notification.isRead && (
                        <IconButton
                          color="success"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification._id);
                          }}
                          title="Mark as read"
                        >
                          <MarkReadIcon />
                        </IconButton>
                      )}
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
      </Box>
    );
  };

  // Desktop table layout
  const renderDesktopContent = () => {
    if (isLoading && (!filteredNotifications || filteredNotifications.length === 0)) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Loading notifications...
          </Typography>
        </Box>
      );
    }
    
    return (
      <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
        <TableContainer>
          <Table stickyHeader aria-label="notifications table">
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Recipient</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredNotifications && filteredNotifications.length > 0 ? (
                filteredNotifications
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((notification) => (
                    <TableRow hover key={notification._id || 'no-id-' + Math.random()}>
                      <TableCell>
                        <Chip
                          size="small"
                          label={notification.notificationType === 'received' ? 'Received' : 'Sent'}
                          color={notification.notificationType === 'received' ? 'info' : 'primary'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {getRecipientDisplayText(notification)}
                      </TableCell>
                      <TableCell>{notification.title || 'No title'}</TableCell>
                      <TableCell>
                        {notification.message 
                          ? (notification.message.length > 50
                             ? `${notification.message.substring(0, 50)}...`
                             : notification.message)
                          : 'No message'}
                      </TableCell>
                      <TableCell>
                        {notification.createdAt 
                          ? format(new Date(notification.createdAt), 'MMM dd, yyyy')
                          : 'Unknown date'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={notification.isRead ? 'Read' : 'Unread'}
                          color={notification.isRead ? 'success' : 'warning'}
                        />
                        {notification.isImportant && (
                          <Chip 
                            label="Important" 
                            color="error" 
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {/* Always show View action */}
                        <IconButton
                          color="primary"
                          onClick={() => handleViewNotification(notification._id)}
                          size="small"
                          title="View notification"
                        >
                          <VisibilityIcon />
                        </IconButton>
                        
                        {/* For RECEIVED notifications: only show Mark as Read */}
                        {notification.notificationType === 'received' ? (
                          !notification.isRead && (
                            <IconButton
                              color="success"
                              onClick={() => handleMarkAsRead(notification._id)}
                              size="small"
                              title="Mark as read"
                            >
                              <MarkReadIcon />
                            </IconButton>
                          )
                        ) : (
                          /* For SENT notifications: check if created by current teacher */
                          <>
                            {/* Only show edit/delete if notification was created by current teacher */}
                            {(user?.role === 'admin' || 
                              (notification.sender && notification.sender._id === user?._id) ||
                              (notification.createdBy && notification.createdBy._id === user?._id)) && (
                              <>
                                <IconButton
                                  color="primary"
                                  onClick={() => handleEditClick(notification)}
                                  size="small"
                                  title="Edit notification"
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  color="error"
                                  onClick={() => handleDeleteClick(notification)}
                                  size="small"
                                  title="Delete notification"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </>
                            )}
                            {/* Mark as read is available for all sent notifications if unread */}
                            {!notification.isRead && (
                              <IconButton
                                color="success"
                                onClick={() => handleMarkAsRead(notification._id)}
                                size="small"
                                title="Mark as read"
                              >
                                <MarkReadIcon />
                              </IconButton>
                            )}
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box py={2}>
                      <Typography variant="subtitle1" color="text.secondary">
                        {isError 
                          ? 'Error loading notifications. Please try again.' 
                          : 'No notifications found.'}
                      </Typography>
                      {isError && (
                        <Button 
                          variant="contained" 
                          sx={{ mt: 2 }} 
                          onClick={() => dispatch(getSentNotifications())}
                        >
                          Retry
                        </Button>
                      )}
                      {!isError && !isLoading && (
                        <Button 
                          variant="contained" 
                          sx={{ mt: 2 }} 
                          startIcon={<AddIcon />}
                          onClick={handleAddNotification}
                        >
                          Create Your First Notification
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredNotifications ? filteredNotifications.length : 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    );
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2, sm: 3 }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 0 } }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          {user?.role === 'admin' ? 'Manage Notifications' : 'Received Notifications'}
        </Typography>
        {(user?.role === 'admin' || user?.canSendNotifications !== false) && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
            onClick={handleAddNotification}
          >
            Create Notification
          </Button>
        )}
      </Box>

      <Paper sx={{ p: { xs: 1, sm: 2 }, mb: { xs: 2, sm: 3 }, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 1, sm: 2 } }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          {senders.length > 0 && (
            <TextField
              select
              label="Filter by Sender"
              value={senderFilter}
              onChange={handleSenderFilterChange}
              variant="outlined"
              sx={{
                minWidth: { xs: '100%', md: 200 },
                fontSize: { xs: '0.875rem', sm: '1rem' },
                '& .MuiSelect-select': {
                  color: 'text.primary', 
                },
                '& .MuiInputLabel-root': {
                  color: 'text.secondary', 
                },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'divider', 
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main', 
                  },
                },
                '& .MuiNativeSelect-select': {
                  bgcolor: 'background.paper', 
                  color: 'text.primary', 
                }
              }}
              SelectProps={{
                native: true,
                MenuProps: {
                  PaperProps: {
                    sx: {
                      bgcolor: 'background.paper', 
                      '& option': {
                        padding: 1,
                      }
                    }
                  }
                }
              }}
            >
              <option value="all">All Senders</option>
              {senders.map((sender) => (
                <option key={sender.id} value={sender.id}>
                  {sender.name} ({sender.role})
                </option>
              ))}
            </TextField>
          )}
        </Box>
      </Paper>

      {isMobile ? renderMobileContent() : renderDesktopContent()}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this notification? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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

export default TeacherNotifications;
