import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { API_URL } from '../../config/appConfig';
import { toast } from 'react-toastify';

// Material UI imports
import {
  Container,
  Paper,
  Typography,
  Button,
  TextField,
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
  InputAdornment,
  CircularProgress,
  Alert
} from '@mui/material';

// Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import SchoolIcon from '@mui/icons-material/School';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';

const ManageSchools = () => {
  // const navigate = useNavigate(); // Commented out as it's not currently used
  const { user } = useSelector(state => state.auth);
  
  // State
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSchools, setFilteredSchools] = useState([]);
  
  // Dialog states
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentSchool, setCurrentSchool] = useState({ name: '', address: '', phone: '' });
  
  // Fetch schools on component mount
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user?.token) {
          setError('Authentication information missing');
          setLoading(false);
          return;
        }

        const config = {
          headers: { Authorization: `Bearer ${user.token}` }
        };

        // Fetch schools for this tenant
        console.log('Fetching schools...');
        const response = await axios.get(`${API_URL}/schools`, config);
        console.log('Schools fetched successfully:', response.data.length);
        setSchools(response.data);
        setFilteredSchools(response.data);
      } catch (err) {
        console.error('Error fetching schools:', err);
        // More detailed error handling
        if (err.response) {
          // Server responded with an error
          setError(`Server error: ${err.response.data?.message || err.response.statusText || 'Unknown error'}`);
        } else if (err.request) {
          // Request was made but no response
          setError('Network error: Could not connect to server. Please try again later.');
        } else {
          // Error in setting up the request
          setError(`Error: ${err.message || 'Unknown error'}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, [user]);

  // Apply filters when search query changes
  useEffect(() => {
    applyFilters();
  }, [searchQuery, schools, applyFilters]);

  // Filter function
  const applyFilters = () => {
    let filtered = [...schools];

    // Apply search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(school =>
        school.name.toLowerCase().includes(query) ||
        (school.address && school.address.toLowerCase().includes(query))
      );
    }

    setFilteredSchools(filtered);
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

  // Dialog handlers
  const handleOpenAddDialog = () => {
    setCurrentSchool({ name: '', address: '', phone: '' });
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };

  const handleOpenEditDialog = (school) => {
    setCurrentSchool(school);
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };

  const handleOpenDeleteDialog = (schoolId) => {
    const schoolToDelete = schools.find(s => s._id === schoolId);
    setCurrentSchool(schoolToDelete);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  // Form handling
  const handleInputChange = (e) => {
    setCurrentSchool({
      ...currentSchool,
      [e.target.name]: e.target.value
    });
  };

  // CRUD operations
  const handleCreateSchool = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };

      const response = await axios.post(`${API_URL}/schools`, currentSchool, config);
      
      // Add the new school to state
      setSchools([...schools, response.data]);
      
      // Close dialog and show success message
      setOpenAddDialog(false);
      toast.success('School created successfully');
    } catch (err) {
      console.error('Error creating school:', err);
      toast.error(err.response?.data?.message || 'Failed to create school');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSchool = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };

      const response = await axios.put(
        `${API_URL}/schools/${currentSchool._id}`, 
        currentSchool, 
        config
      );
      
      // Update the school in state
      setSchools(schools.map(school => 
        school._id === currentSchool._id ? response.data : school
      ));
      
      // Close dialog and show success message
      setOpenEditDialog(false);
      toast.success('School updated successfully');
    } catch (err) {
      console.error('Error updating school:', err);
      toast.error(err.response?.data?.message || 'Failed to update school');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchool = async () => {
    try {
      setLoading(true);
      
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };

      await axios.delete(`${API_URL}/schools/${currentSchool._id}`, config);
      
      // Remove the school from state
      setSchools(schools.filter(school => school._id !== currentSchool._id));
      
      // Close dialog and show success message
      setOpenDeleteDialog(false);
      toast.success('School deleted successfully');
    } catch (err) {
      console.error('Error deleting school:', err);
      toast.error(err.response?.data?.message || 'Failed to delete school');
    } finally {
      setLoading(false);
    }
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!currentSchool.name.trim()) {
      errors.name = 'School name is required';
    }
    
    // Set any validation errors
    if (Object.keys(errors).length > 0) {
      toast.error(Object.values(errors)[0]);
      return false;
    }
    
    return true;
  };

  if (loading && schools.length === 0) {
    return (
      <Container sx={{ textAlign: 'center', mt: 4 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading schools...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h1">
            Manage Schools
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
          >
            Add School
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* Search */}
        <TextField
          fullWidth
          label="Search schools"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        {/* Schools Table */}
        <TableContainer component={Paper} sx={{ mb: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSchools
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((school) => (
                  <TableRow key={school._id}>
                    <TableCell>{school.name}</TableCell>
                    <TableCell>{school.address || 'N/A'}</TableCell>
                    <TableCell>{school.phone || 'N/A'}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenEditDialog(school)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleOpenDeleteDialog(school._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredSchools.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    {schools.length === 0 ? 'No schools found. Add your first school!' : 'No schools match your search criteria'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredSchools.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Add School Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog}>
        <DialogTitle>Add New School</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            name="name"
            label="School Name"
            type="text"
            fullWidth
            variant="outlined"
            value={currentSchool.name}
            onChange={handleInputChange}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SchoolIcon />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            margin="dense"
            name="address"
            label="Address"
            type="text"
            fullWidth
            variant="outlined"
            value={currentSchool.address || ''}
            onChange={handleInputChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationOnIcon />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            margin="dense"
            name="phone"
            label="Phone Number"
            type="text"
            fullWidth
            variant="outlined"
            value={currentSchool.phone || ''}
            onChange={handleInputChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIcon />
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button onClick={handleCreateSchool} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit School Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
        <DialogTitle>Edit School</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            name="name"
            label="School Name"
            type="text"
            fullWidth
            variant="outlined"
            value={currentSchool.name}
            onChange={handleInputChange}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SchoolIcon />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            margin="dense"
            name="address"
            label="Address"
            type="text"
            fullWidth
            variant="outlined"
            value={currentSchool.address || ''}
            onChange={handleInputChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationOnIcon />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            margin="dense"
            name="phone"
            label="Phone Number"
            type="text"
            fullWidth
            variant="outlined"
            value={currentSchool.phone || ''}
            onChange={handleInputChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIcon />
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleUpdateSchool} variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the school "{currentSchool?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteSchool} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManageSchools;
