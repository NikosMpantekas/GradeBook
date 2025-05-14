import React, { useEffect, useState } from 'react';
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
  getNotificationsByTeacher,
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
    dispatch(getNotificationsByTeacher(user._id));

    return () => {
      dispatch(reset());
    };
  }, [dispatch, user._id]);

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }

    if (notifications) {
      applyFilters();
    }
  }, [notifications, isError, isSuccess, message, searchTerm]);

  const applyFilters = () => {
    if (!notifications) return;

    let filtered = [...notifications];

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (notification) =>
          (notification.title && notification.title.toLowerCase().includes(search)) ||
          (notification.message && notification.message.toLowerCase().includes(search)) ||
          (notification.recipient &&
            notification.recipient.name &&
            notification.recipient.name.toLowerCase().includes(search))
      );
    }

    setFilteredNotifications(filtered);
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
    navigate('/teacher/notifications/create');
  };

  const handleViewNotification = (id) => {
    navigate(`/notifications/${id}`);
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

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
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

      {/* Notifications Table */}
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
              {filteredNotifications.length > 0 ? (
                filteredNotifications
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((notification) => (
                    <TableRow hover key={notification._id}>
                      <TableCell>
                        {notification.recipient ? notification.recipient.name : 'All Students'}
                      </TableCell>
                      <TableCell>{notification.title}</TableCell>
                      <TableCell>
                        {notification.message.length > 50
                          ? `${notification.message.substring(0, 50)}...`
                          : notification.message}
                      </TableCell>
                      <TableCell>
                        {format(new Date(notification.date), 'PP')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={notification.read ? 'Read' : 'Unread'}
                          color={notification.read ? 'default' : 'primary'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          aria-label="view notification"
                          onClick={() => handleViewNotification(notification._id)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                        {!notification.read && (
                          <IconButton
                            color="success"
                            aria-label="mark as read"
                            onClick={() => handleMarkAsRead(notification._id)}
                          >
                            <MarkReadIcon />
                          </IconButton>
                        )}
                        <IconButton
                          color="error"
                          aria-label="delete notification"
                          onClick={() => handleDeleteClick(notification)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    {notifications && notifications.length > 0
                      ? 'No notifications match the search criteria.'
                      : 'No notifications found. Create a notification to get started.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredNotifications.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

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
