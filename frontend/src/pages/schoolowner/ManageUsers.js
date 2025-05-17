import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { API_URL } from '../../config/appConfig';

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
  
  // Fetch users on component mount
  useEffect(() => {
    // Define the fetch function
    const fetchUsers = async () => {
      if (!user?.token) {
        console.error('No authentication token found');
        setError('Authentication information missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Pre-fetch log to ensure the request is actually happening
        console.log(`[${new Date().toISOString()}] Initiating users fetch request with token`);
        
        const config = {
          headers: { Authorization: `Bearer ${user.token}` },
          // Add timeout to prevent infinite loading
          timeout: 15000
        };

        // Fetch users for this tenant
        const response = await axios.get(`${API_URL}/users/tenant`, config);
        console.log(`[${new Date().toISOString()}] Users fetched successfully:`, response.data.length);
        
        // Update state with fetched data
        setUsers(response.data || []);
        setFilteredUsers(response.data || []);
      } catch (err) {
        console.error(`[${new Date().toISOString()}] Error fetching users:`, err);
        
        // Specific error handling with user-friendly messages
        if (err.response) {
          // The request was made and the server responded with an error status code
          const status = err.response.status;
          const message = err.response.data?.message || err.response.statusText || 'Unknown server error';
          console.error(`Server responded with ${status}: ${message}`);
          
          if (status === 401 || status === 403) {
            setError(`Access denied: ${message}. Please check your permissions.`);
          } else {
            setError(`Server error (${status}): ${message}`);
          }
        } else if (err.request) {
          // The request was made but no response was received (network error)
          console.error('No response received from server');
          setError('Network error: Could not connect to server. Please check your internet connection and try again.');
        } else {
          // Something else happened while setting up the request
          console.error('Request setup error:', err.message);
          setError(`Error preparing request: ${err.message || 'Unknown error'}`);
        }
      } finally {
        setLoading(false);
      }
    };

    // Execute the fetch
    fetchUsers();
    
    // Cleanup function to handle component unmounting during fetch
    return () => {
      // This helps prevent state updates on unmounted components
      console.log('Cleaning up users fetch');
    };
  }, [user]);

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
      
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };

      await axios.delete(`${API_URL}/users/${userToDelete._id}`, config);

      // Remove the deleted user from state
      setUsers(prevUsers => prevUsers.filter(u => u._id !== userToDelete._id));
      
      // Close the dialog
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get role chip color
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'primary';
      case 'teacher': return 'secondary';
      case 'student': return 'success';
      default: return 'default';
    }
  };

  // Helper to get role icon
  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <AdminPanelSettingsIcon fontSize="small" />;
      case 'teacher': return <SchoolIcon fontSize="small" />;
      case 'student': return <PersonIcon fontSize="small" />;
      default: return null;
    }
  };

  if (loading && users.length === 0) {
    return (
      <Container sx={{ textAlign: 'center', mt: 4 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading users...
        </Typography>
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
