import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getUsers, deleteUser, reset } from '../../features/users/userSlice';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Avatar,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

// Import our custom components
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

// We already have these imports at the top

const ManageUsers = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const { users, isLoading, isSuccess, isError, message } = useSelector(state => state.users);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Add debug logs
  console.log('ManageUsers mounting - Initial state:', { 
    userState: user, 
    usersInStore: users, 
    isLoadingState: isLoading, 
    isErrorState: isError 
  });

  useEffect(() => {
    try {
      // Fetch users from the database with error handling
      console.log('Dispatching getUsers action');
      dispatch(getUsers())
        .unwrap()
        .then(response => {
          console.log('getUsers succeeded with response:', response);
        })
        .catch(error => {
          console.error('getUsers failed with error:', error);
          toast.error(`Error loading users: ${error}`);
        });
    } catch (error) {
      console.error('Exception during dispatch:', error);
      toast.error('An unexpected error occurred');
    }
    
    // Cleanup function to reset state when component unmounts
    return () => {
      console.log('ManageUsers unmounting - cleaning up');
      dispatch(reset());
    };
  }, [dispatch]);
  
  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
  }, [isError, message]);

  useEffect(() => {
    if (users) {
      applyFilters();
    }
  }, [users, searchTerm, roleFilter]);

  const applyFilters = () => {
    // Safety check - ensure users is an array before filtering
    if (!users || !Array.isArray(users)) {
      console.log('Users is not an array:', users);
      setFilteredUsers([]);
      return;
    }
    
    try {
      // Create a safe copy of the users array with null/undefined checks
      const safeUsers = users.filter(user => user !== null && user !== undefined);
      let filtered = [...safeUsers];
      
      // Apply search filter
      if (searchTerm && searchTerm.trim() !== '') {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(user => 
          (user.name && user.name.toLowerCase().includes(searchLower)) ||
          (user.email && user.email.toLowerCase().includes(searchLower))
        );
      }
      
      // Apply role filter
      if (roleFilter && roleFilter !== '') {
        filtered = filtered.filter(user => user.role === roleFilter);
      }
      
      setFilteredUsers(filtered);
    } catch (error) {
      console.error('Error applying filters:', error);
      // Fallback to empty array in case of any error
      setFilteredUsers([]);
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

  const handleRoleFilterChange = (event) => {
    setRoleFilter(event.target.value);
    setPage(0);
  };

  const handleAddUser = () => {
    navigate('/app/admin/users/create');
  };

  const handleEditUser = (id) => {
    navigate(`/app/admin/users/${id}`);
  };

  // Delete User Dialog
  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!userToDelete) return;
    
    // Prevent deleting yourself
    if (userToDelete._id === user._id) {
      toast.error('You cannot delete your own account');
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      return;
    }
    
    dispatch(deleteUser(userToDelete._id))
      .unwrap()
      .then(() => {
        toast.success('User deleted successfully');
        // The users list will be refreshed via the state update in the reducer
      })
      .catch((error) => {
        toast.error(`Failed to delete user: ${error.message || 'Unknown error'}`);
      })
      .finally(() => {
        setDeleteDialogOpen(false);
        setUserToDelete(null);
      });
  };
  
  // Handle success/error after delete operation
  useEffect(() => {
    if (isSuccess && message === 'user_deleted') {
      toast.success('User deleted successfully');
      dispatch(reset());
    }
  }, [isSuccess, message, dispatch]);

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'teacher':
        return 'primary';
      case 'student':
        return 'success';
      default:
        return 'default';
    }
  };

  const getAvatarLetter = (name) => {
    return name.charAt(0).toUpperCase();
  };

  // Add a wrapping try-catch for the entire rendering flow
  try {
    if (isLoading) {
      console.log('Rendering loading state');
      return <LoadingState message="Loading users..." fullPage={true} />;
    }
  
    if (isError) {
      console.log('Rendering error state:', message);
      return (
        <ErrorState 
          message={`Failed to load users: ${message || 'Unknown error'}`}
          fullPage={true}
          onRetry={() => dispatch(getUsers())}
          retryText="Retry Loading Users"
        />
      );
    }
  
    // Explicitly check if users is undefined, null, or not an array
    if (!users) {
      console.log('Users is undefined or null');
      return (
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Manage Users
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleAddUser}
            >
              Add User
            </Button>
          </Box>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" align="center" sx={{ py: 4 }}>
              User data not available. Please try refreshing the page.
            </Typography>
            <Box display="flex" justifyContent="center" mt={2}>
              <Button 
                variant="contained" 
                onClick={() => dispatch(getUsers())}
                startIcon={<RefreshIcon />}
              >
                Refresh Data
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }
  
    if (!Array.isArray(users)) {
      console.log('Users is not an array:', typeof users);
      return (
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Manage Users
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleAddUser}
            >
              Add User
            </Button>
          </Box>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" align="center" sx={{ py: 4 }}>
              Invalid user data format. Please try refreshing the page.
            </Typography>
            <Box display="flex" justifyContent="center" mt={2}>
              <Button 
                variant="contained" 
                onClick={() => dispatch(getUsers())}
                startIcon={<RefreshIcon />}
              >
                Refresh Data
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }
  
    if (users.length === 0) {
      console.log('Users array is empty');
      return (
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Manage Users
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleAddUser}
            >
              Add User
            </Button>
          </Box>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" align="center" sx={{ py: 4 }}>
              No users found. Click "Add User" to create one.
            </Typography>
          </Paper>
        </Box>
      );
    }
  } catch (error) {
    console.error('Caught error during render:', error);
    return (
      <Box sx={{ flexGrow: 1 }}>
        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h5" color="error" sx={{ mb: 2 }}>
            Something went wrong
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            An unexpected error occurred while displaying users. Please try refreshing the page.
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'text.secondary' }}>
            Error details: {error.message}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => window.location.reload()}
            startIcon={<RefreshIcon />}
          >
            Refresh Page
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Manage Users
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleAddUser}
        >
          Add User
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by name or email"
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
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="role-filter-label">Filter by Role</InputLabel>
              <Select
                labelId="role-filter-label"
                id="role-filter"
                value={roleFilter}
                onChange={handleRoleFilterChange}
                label="Filter by Role"
                startAdornment={
                  <InputAdornment position="start">
                    <FilterIcon />
                  </InputAdornment>
                }
              >
                <MenuItem value="">
                  <em>All Roles</em>
                </MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="teacher">Teacher</MenuItem>
                <MenuItem value="student">Student</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Users Table */}
      <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
        <TableContainer>
          <Table stickyHeader aria-label="users table">
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user) => (
                    <TableRow hover key={user._id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: getRoleColor(user.role) }}>
                            {getAvatarLetter(user.name)}
                          </Avatar>
                          <Typography variant="body1">{user.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          color={getRoleColor(user.role)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {format(new Date(user.createdAt), 'PP')}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          aria-label="edit user"
                          onClick={() => handleEditUser(user._id)}
                        >
                          <EditIcon />
                        </IconButton>
                        {/* Prevent deleting the current admin user or the only admin */}
                        {!(user.role === 'admin' && user._id === user._id) && (
                          <IconButton
                            color="error"
                            aria-label="delete user"
                            onClick={() => handleDeleteClick(user)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    {users && users.length > 0
                      ? 'No users match the filter criteria.'
                      : 'No users found.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredUsers.length}
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
            Are you sure you want to delete the user "{userToDelete?.name}"? This action cannot be undone.
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

export default ManageUsers;
