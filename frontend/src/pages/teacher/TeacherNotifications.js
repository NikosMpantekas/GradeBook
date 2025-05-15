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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  MarkEmailRead as MarkReadIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import {
  getSentNotifications,
  deleteNotification,
  markNotificationAsRead,
  reset,
} from '../../features/notifications/notificationSlice';

const TeacherNotifications = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { notifications, isLoading, isSuccess, isError, message } = useSelector(
    (state) => state.notifications
  );

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);

  useEffect(() => {
    console.log('TeacherNotifications component mounted');
    // Initialize an empty array to prevent initial render issues
    setFilteredNotifications([]);
    
    // Get notifications sent by this teacher
    try {
      dispatch(getSentNotifications())
        .unwrap()
        .then(data => {
          console.log('getSentNotifications success:', data);
          // If we get here, we've already been successful, so we can set the data directly
          if (Array.isArray(data)) {
            setFilteredNotifications(data);
          } else {
            console.warn('Received non-array data:', data);
            setFilteredNotifications([]);
          }
        })
        .catch(error => {
          console.error('getSentNotifications failure:', error);
          toast.error('Failed to load notifications. Please try again.');
          setFilteredNotifications([]);
        });
    } catch (error) {
      console.error('Error dispatching getSentNotifications:', error);
      setFilteredNotifications([]);
    }
    
    return () => {
      dispatch(reset());
    };
  }, [dispatch]);

  // Use a ref to track initial mount
  const initialMount = React.useRef(true);

  useEffect(() => {
    // Initialize the filtered notifications array safely
    if (initialMount.current) {
      console.log('Initial mount of TeacherNotifications component');
      setFilteredNotifications([]);
      initialMount.current = false;
    }

    if (isError) {
      console.error('Error loading notifications:', message);
      toast.error(message || 'Failed to load notifications');
      // Ensure we have an empty array even on error to prevent white screen
      setFilteredNotifications([]);
    }

    // Safely apply filters to notifications with defensive coding
    if (notifications && Array.isArray(notifications)) {
      console.log(`Filtering ${notifications.length} notifications`);
      applyFilters(notifications);
    } else {
      console.warn('Notifications is not an array or is undefined:', notifications);
      // Ensure we always have an array to prevent rendering issues
      setFilteredNotifications([]);
    }
  }, [notifications, isError, isSuccess, message, searchTerm]);

  const applyFilters = (teacherNotifications) => {
    // Defensive coding - ensure teacherNotifications is valid before continuing
    if (!teacherNotifications || !Array.isArray(teacherNotifications)) {
      console.warn('Invalid notifications data received in applyFilters:', teacherNotifications);
      setFilteredNotifications([]);
      return;
    }

    try {
      console.log(`Applying filters to ${teacherNotifications.length} notifications`);
      let filtered = [...teacherNotifications];

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        filtered = filtered.filter(notification => {
          // Ensure properties exist before accessing them
          const hasTitle = notification && notification.title && typeof notification.title === 'string';
          const hasMessage = notification && notification.message && typeof notification.message === 'string';
          const hasRecipientName = notification && notification.recipient && 
                                  notification.recipient.name && 
                                  typeof notification.recipient.name === 'string';
          
          return (
            (hasTitle && notification.title.toLowerCase().includes(search)) ||
            (hasMessage && notification.message.toLowerCase().includes(search)) ||
            (hasRecipientName && notification.recipient.name.toLowerCase().includes(search))
          );
        });
      }

      console.log(`After filtering: ${filtered.length} notifications match criteria`);
      setFilteredNotifications(filtered);
    } catch (error) {
      console.error('Error in applyFilters:', error);
      // Prevent white screen by setting an empty array as fallback
      setFilteredNotifications([]);
    }
  };

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

  const handleAddNotification = () => {
    navigate('/app/teacher/notifications/create');
  };

  const handleViewNotification = (id) => {
    navigate(`/app/notifications/${id}`);
  };

  // Delete Notification Dialog
  const handleDeleteClick = (notification) => {
    setNotificationToDelete(notification);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (notificationToDelete) {
      dispatch(deleteNotification(notificationToDelete._id));
    }
    setDeleteDialogOpen(false);
    setNotificationToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setNotificationToDelete(null);
  };

  const handleMarkAsRead = (id) => {
    dispatch(markNotificationAsRead(id));
  };

  // Enhanced loading and error state handling to prevent blank screens
  const renderContent = () => {
    // Show loading indicator only if we're loading AND we don't have any notifications to show
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
                        {notification.recipient ? notification.recipient.name : 'All Students'}
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
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          onClick={() => handleViewNotification(notification._id)}
                          size="small"
                        >
                          <VisibilityIcon />
                        </IconButton>
                        {!notification.isRead && (
                          <IconButton
                            color="success"
                            onClick={() => handleMarkAsRead(notification._id)}
                            size="small"
                          >
                            <MarkReadIcon />
                          </IconButton>
                        )}
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteClick(notification)}
                          size="small"
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
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleAddNotification}
        >
          Create Notification
        </Button>
      </Box>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
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
    </Box>
  );
};

export default TeacherNotifications;
