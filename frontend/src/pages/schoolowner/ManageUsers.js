import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import apiClient from '../../config/apiClient';
import { updateUser } from '../../features/auth/authSlice';

// Material UI imports
import {
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';

// Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import RefreshIcon from '@mui/icons-material/Refresh';

const ManageUsers = () => {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  
  // State
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  // Initialize dispatch for Redux actions
  const dispatch = useDispatch();
  
  // Fetch users on component mount
  useEffect(() => {
    // Track if component is mounted to prevent state updates after unmount
    let isMounted = true;
    // For tracking request timeouts
    let timeoutId = null;
    
    // Define the fetch function
    const fetchUsers = async () => {
      try {
        if (isMounted) {
          setLoading(true);
          setError(null);
        }

        console.log(`[${new Date().toISOString()}] Initiating users fetch request`);
        
        // Use our centralized apiClient which already handles auth tokens and timeout
        const response = await apiClient.get('/users/tenant');
        console.log(`[${new Date().toISOString()}] Users fetched successfully:`, response.data.length);
        
        // Only update state if component is still mounted
        if (isMounted) {
          setUsers(response.data || []);
          setFilteredUsers(response.data || []);
        }
      } catch (err) {
        console.error(`[${new Date().toISOString()}] Error fetching users:`, err);
        
        // Only update error state if component is still mounted
        if (isMounted) {
          // Get user-friendly message from error response
          const message = err.response?.data?.message || err.message || 'Failed to fetch users';
          setError(message);
          
          // Even on error, provide empty arrays to prevent rendering issues
          setUsers([]);
          setFilteredUsers([]);
        }
      } finally {
        // Only update loading state if component is still mounted
        if (isMounted) {
          setLoading(false);
          clearTimeout(timeoutId);
        }
      }
    };

    // Set a timeout to prevent infinite loading states
    timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        console.log('User fetch timeout triggered');
        setLoading(false);
        setError('Request timed out. Please try again.');
      }
    }, 20000); // 20 second timeout as a failsafe beyond the apiClient timeout

    // Execute the fetch if user is logged in
    if (user?.token) {
      fetchUsers();
    } else {
      console.error('No authentication token found');
      setError('Authentication information missing');
      setLoading(false);
    }
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      console.log('Cleaning up users fetch');
    };
  }, [user, loading]);

  // Apply filters when search query or role filter changes
  useEffect(() => {
    applyFilters();
  }, [searchQuery, roleFilter, users, applyFilters]);

  // Filter function
  const applyFilters = () => {
    let filtered = [...users];

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Apply search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
    setPage(0); // Reset to first page when filters change
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle delete dialog open
  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  // Handle delete dialog close
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setLoading(true);
      
      await apiClient.delete(`/users/${userToDelete._id}`);

      // Remove the deleted user from state
      setUsers(prevUsers => prevUsers.filter(u => u._id !== userToDelete._id));
      setFilteredUsers(prevUsers => prevUsers.filter(u => u._id !== userToDelete._id));
      
      // Close the dialog
      handleDeleteDialogClose();
      
      toast.success(`${userToDelete.name} has been removed`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
      console.error('Error deleting user:', err);
    } finally {
      setLoading(false);
    }
  };

  // Function to get role icon component
  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <AdminPanelSettingsIcon />;
      case 'teacher':
        return <PersonIcon />;
      case 'student':
        return <SchoolIcon />;
      default:
        return <PersonIcon />;
    }
  };

  // Function to get role color
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'secondary';
      case 'teacher':
        return 'primary';
      case 'student':
        return 'info';
      default:
        return 'default';
    }
  };

  // Function to update user permissions that immediately applies changes
  // This ensures that permission changes take effect without requiring logout/login
  const updateUserPermissions = useCallback(async (userId, permissions) => {
    try {
      setLoading(true);
      
      // Update the permissions via API
      const response = await apiClient.patch(`/users/${userId}/permissions`, permissions);
      
      // If successful, update the local user list
      if (response.status === 200) {
        // Update the user in the users array
        setUsers(prevUsers => prevUsers.map(u => 
          u._id === userId ? { ...u, ...permissions } : u
        ));
        
        // Also update filtered users to reflect changes immediately
        setFilteredUsers(prevUsers => prevUsers.map(u => 
          u._id === userId ? { ...u, ...permissions } : u
        ));
        
        // If the updated user is the current logged-in user, also update Redux store
        // This makes permission changes take effect immediately
        if (user._id === userId) {
          console.log('Updating current user permissions in Redux store');
          dispatch(updatePermissions({
            userId,
            permissions
          }));
        }
        
        toast.success('User permissions updated successfully');
      }
    } catch (err) {
      console.error('Error updating user permissions:', err);
      toast.error(err.response?.data?.message || 'Failed to update user permissions');
    } finally {
      setLoading(false);
    }
  }, [user, dispatch]);

  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading user data...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          This may take a few moments
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Paper sx={{ p: 3, borderRadius: 2, bgcolor: '#fff8f8', border: '1px solid #ffcdd2' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Error Loading Users
          </Typography>
          <Typography variant="body1" paragraph>
            {error}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Try refreshing the page or contact system administrator.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => window.location.reload()}
            startIcon={<RefreshIcon />}
          >
            Refresh Page
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1">
            Manage Users
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/app/school-owner/users/create')}
          >
            Add User
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search users"
              variant="outlined"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                label="Filter by Role"
                startAdornment={
                  <InputAdornment position="start">
                    <FilterListIcon />
                  </InputAdornment>
                }
              >
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="admin">Admins</MenuItem>
                <MenuItem value="teacher">Teachers</MenuItem>
                <MenuItem value="student">Students</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Users Table */}
        <TableContainer component={Paper} sx={{ mb: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((userData) => (
                  <TableRow key={userData._id}>
                    <TableCell>{userData.name}</TableCell>
                    <TableCell>{userData.email}</TableCell>
                    <TableCell>
                      <Chip
                        icon={getRoleIcon(userData.role)}
                        label={userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                        color={getRoleColor(userData.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => navigate(`/app/school-owner/users/${userData._id}`)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(userData)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No users found matching your criteria
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
        onClose={handleDeleteDialogClose}
      >
        <DialogTitle>Confirm User Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the user "{userToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManageUsers;
