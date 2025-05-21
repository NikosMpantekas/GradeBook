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
  Grid,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  MarkEmailRead as MarkReadIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import {
  getSentNotifications,
  getAllNotifications,
  deleteNotification,
  markNotificationAsRead,
  updateNotification,
  reset,
} from '../../features/notifications/notificationSlice';
import { getDirections } from '../../features/directions/directionSlice';

const TeacherNotifications = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { notifications, isLoading, isSuccess, isError, message } = useSelector(
    (state) => state.notifications
  );
  const { directions, isLoading: isDirectionsLoading } = useSelector((state) => state.directions);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [senderFilter, setSenderFilter] = useState('all'); // Add sender filter state
  const [directionFilter, setDirectionFilter] = useState('all'); // Add direction filter state
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

  // Load notifications immediately on component mount
  useEffect(() => {
    console.log('TeacherNotifications component mounted - loading notifications');
    
    // Fetch directions for filtering
    dispatch(getDirections())
      .unwrap()
      .catch(error => {
        console.error('Failed to load directions:', error);
        toast.error(`Failed to load directions: ${error.message || 'Unknown error'}`);
      });
    
    // For admins, use different approach to get all notifications including teacher ones
    if (user && user.role === 'admin') {
      console.log('Admin user detected - loading ALL notifications');
      // Use the admin-specific getAllNotifications endpoint instead
      dispatch(getAllNotifications())
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
      // For teachers, just fetch their sent notifications
      dispatch(getSentNotifications());
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
      const uniqueSenders = notifications.reduce((acc, notification) => {
        if (notification.sender && notification.sender._id && notification.sender.name) {
          // Only add sender if not already in the list
          if (!acc.some(s => s.id === notification.sender._id)) {
            acc.push({
              id: notification.sender._id,
              name: notification.sender.name,
              role: notification.sender.role || 'Unknown'
            });
          }
        }
        return acc;
      }, []);
      
      console.log('Unique senders extracted:', uniqueSenders.length);
      setSenders(uniqueSenders);
      
      // Apply search, sender, and direction filters
      applyFilters(notifications);
    }
  }, [notifications, isError, isSuccess, message, searchTerm, senderFilter, directionFilter]);

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
      
      // Apply direction filter if selected
      if (directionFilter && directionFilter !== 'all') {
        filtered = filtered.filter(notification => {
          try {
            // Filter by notification.directions if available
            if (notification.directions && Array.isArray(notification.directions) && notification.directions.length > 0) {
              return notification.directions.some(dir => {
                // Make sure dir is defined
                if (!dir) return false;
                
                // Handle both string IDs and object references
                const dirId = typeof dir === 'object' ? dir._id : dir;
                return dirId === directionFilter;
              });
            }
            return false;
          } catch (error) {
            console.error('Error filtering by direction:', error);
            return false;
          }
        });
        console.log(`After direction filter (${directionFilter}): ${filtered.length} notifications`);
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
  }, [searchTerm, senderFilter, directionFilter]); // Added directionFilter to dependency array

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
  
  // Handle direction filter change
  const handleDirectionFilterChange = (event) => {
    setDirectionFilter(event.target.value);
    setPage(0);
  };

  const handleAddNotification = () => {
    // First verify permission
    if (user?.role === 'teacher' && user?.canSendNotifications === false) {
      toast.error('You do not have permission to create notifications');
      return;
    }
    navigate('/app/teacher/notifications/create');
  };

  const handleViewNotification = (id) => {
    navigate(`/app/notifications/${id}`);
  };

  // Edit Notification
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
          
          // Manually update the notifications in state to avoid refresh issues
          if (updatedNotification) {
            setFilteredNotifications(prevNotifications => 
              prevNotifications.map(notification => 
                notification._id === updatedNotification._id ? updatedNotification : notification
              )
            );
          }
          
          // Also refresh notifications list from the server based on user role
          if (user && user.role === 'admin') {
            dispatch(getAllNotifications());
          } else {
            dispatch(getSentNotifications());
          }
        })
        .catch((error) => {
          toast.error(`Failed to update: ${error}`);
        });
    }
  };

  // Delete Notification Dialog
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
          
          // Manually update local state to immediately reflect deletion
          setFilteredNotifications(prevNotifications => 
            prevNotifications.filter(notification => notification._id !== notificationToDelete._id)
          );
          
          // Refresh notifications list from server based on user role
          if (user && user.role === 'admin') {
            dispatch(getAllNotifications());
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
    dispatch(markNotificationAsRead(id))
      .unwrap()
      .then(() => {
        // Update the local state immediately to reflect the read status
        setFilteredNotifications(prevNotifications => 
          prevNotifications.map(notification => {
            if (notification._id === id) {
              return { ...notification, isRead: true };
            }
            return notification;
          })
        );
      })
      .catch(error => {
        toast.error('Failed to mark notification as read');
      });
  };

  // Helper function to get recipient display text
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

  // Enhanced loading and error state handling to prevent blank screens
  const renderContent = () => {
    // Always show loading indicator if we're loading and have no data yet
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
    
    // Always render the table, even if empty - prevents blank screen
    return (
      <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
        <TableContainer>
          <Table stickyHeader aria-label="notifications table">
            <TableHead>
              <TableRow>
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
                        <IconButton
                          color="primary"
                          onClick={() => handleViewNotification(notification._id)}
                          size="small"
                          title="View notification"
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton
                          color="primary"
                          onClick={() => handleEditClick(notification)}
                          size="small"
                          title="Edit notification"
                        >
                          <EditIcon />
                        </IconButton>
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
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteClick(notification)}
                          size="small"
                          title="Delete notification"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
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
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Teacher Notifications
        </Typography>
        {/* Only show the Create Notification button if the user has permission */}
        {(user?.role === 'admin' || user?.canSendNotifications !== false) && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleAddNotification}
          >
            Create Notification
          </Button>
        )}
      </Box>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          {/* Sender filter - only show if there are senders to filter by */}
          {senders.length > 0 && (
            <TextField
              select
              label="Filter by Sender"
              value={senderFilter}
              onChange={handleSenderFilterChange}
              variant="outlined"
              sx={{
                minWidth: 200,
                '& .MuiSelect-select': {
                  color: 'text.primary', // Adapts to theme colors
                },
                '& .MuiInputLabel-root': {
                  color: 'text.secondary', // Adapts to theme colors
                },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'divider', // Adapts to theme divider color
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main', // Uses theme primary color on hover
                  },
                },
                '& .MuiNativeSelect-select': {
                  bgcolor: 'background.paper', // Uses theme background color
                  color: 'text.primary', // Uses theme text color
                }
              }}
              SelectProps={{
                native: true,
                MenuProps: {
                  PaperProps: {
                    sx: {
                      bgcolor: 'background.paper', // Uses theme background for dropdown
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
          
          {/* Direction filter - only show if there are directions to filter by */}
          {directions && directions.length > 0 && (
            <TextField
              select
              label="Filter by Direction"
              value={directionFilter}
              onChange={handleDirectionFilterChange}
              variant="outlined"
              disabled={isDirectionsLoading}
              sx={{
                minWidth: 200,
                '& .MuiSelect-select': {
                  color: 'text.primary', // Adapts to theme colors
                },
                '& .MuiInputLabel-root': {
                  color: 'text.secondary', // Adapts to theme colors
                },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'divider', // Adapts to theme divider color
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main', // Uses theme primary color on hover
                  },
                },
                '& .MuiNativeSelect-select': {
                  bgcolor: 'background.paper', // Uses theme background color
                  color: 'text.primary', // Uses theme text color
                }
              }}
              SelectProps={{
                native: true,
                MenuProps: {
                  PaperProps: {
                    sx: {
                      bgcolor: 'background.paper', // Uses theme background for dropdown
                      '& option': {
                        padding: 1,
                      }
                    }
                  }
                }
              }}
            >
              <option value="all">All Directions</option>
              {isDirectionsLoading ? (
                <option disabled>Loading directions...</option>
              ) : (
                directions.map((direction) => (
                  <option key={direction._id} value={direction._id}>
                    {direction.name}
                  </option>
                ))
              )}
            </TextField>
          )}
        </Box>
      </Paper>

      {/* Render notifications table with enhanced error handling */}
      {renderContent()}

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
