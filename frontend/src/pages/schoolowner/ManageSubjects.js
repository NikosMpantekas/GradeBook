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
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';

// Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import SubjectIcon from '@mui/icons-material/Subject';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CategoryIcon from '@mui/icons-material/Category';
import RefreshIcon from '@mui/icons-material/Refresh';

const ManageSubjects = () => {
  // const navigate = useNavigate(); // Commented out as it's not currently used
  const { user } = useSelector(state => state.auth);
  
  // State
  const [subjects, setSubjects] = useState([]);
  const [directions, setDirections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  
  // Dialog states
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentSubject, setCurrentSubject] = useState({ 
    name: '', 
    description: '', 
    direction: '',
    credits: 1
  });
  
  // Fetch subjects and directions on component mount
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates after unmount
    
    const fetchData = async () => {
      // Validate user authentication first
      if (!user?.token) {
        console.error('No authentication token found in ManageSubjects');
        if (isMounted) {
          setError('Authentication information missing');
          setLoading(false);
        }
        return;
      }

      try {
        if (isMounted) {
          setLoading(true);
          setError(null);
        }

        // Setup request configuration with timeout to prevent hanging
        const config = {
          headers: { Authorization: `Bearer ${user.token}` },
          timeout: 8000 // 8 second timeout to prevent hanging
        };

        // Use Promise.all for parallel requests to improve loading time
        console.log(`[${new Date().toISOString()}] Starting parallel fetch for subjects and directions`);
        
        const [subjectsResponse, directionsResponse] = await Promise.all([
          // Fetch subjects with error handling
          axios.get(`${API_URL}/subjects`, config).catch(error => {
            console.error(`[${new Date().toISOString()}] Subjects fetch failed:`, error.message);
            // Return empty array to prevent complete failure
            return { data: [] };
          }),
          
          // Fetch directions with error handling
          axios.get(`${API_URL}/directions`, config).catch(error => {
            console.error(`[${new Date().toISOString()}] Directions fetch failed:`, error.message);
            // Return empty array to prevent complete failure
            return { data: [] };
          })
        ]);

        console.log(`[${new Date().toISOString()}] Fetch completed:`, 
          `Subjects: ${subjectsResponse.data?.length || 0},`, 
          `Directions: ${directionsResponse.data?.length || 0}`);
        
        // Only update state if component is still mounted
        if (isMounted) {
          // Validate and set subjects data
          if (Array.isArray(subjectsResponse.data)) {
            setSubjects(subjectsResponse.data);
            setFilteredSubjects(subjectsResponse.data);
          } else {
            console.warn('Invalid subjects data format');
            setSubjects([]);
            setFilteredSubjects([]);
          }
          
          // Validate and set directions data
          if (Array.isArray(directionsResponse.data)) {
            setDirections(directionsResponse.data);
          } else {
            console.warn('Invalid directions data format');
            setDirections([]);
          }
        }
      } catch (err) {
        console.error(`[${new Date().toISOString()}] Error in ManageSubjects data fetch:`, err);
        
        // Only update error state if still mounted
        if (isMounted) {
          if (err.code === 'ECONNABORTED') {
            setError('Request timed out. Please try refreshing the page.');
          } else if (err.response) {
            const status = err.response.status;
            const message = err.response.data?.message || err.response.statusText || 'Unknown error';
            
            if (status === 401 || status === 403) {
              setError(`Access denied: ${message}. You may not have permission to view this content.`);
            } else {
              setError(`Server error (${status}): ${message}`);
            }
          } else if (err.request) {
            setError('Network error: Could not connect to server. Please check your connection and try again.');
          } else {
            setError(`Error: ${err.message || 'Unknown error'}`);
          }
        }
      } finally {
        // Only update loading state if component is still mounted
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
      console.log('Cleaning up ManageSubjects component');
    };
  }, [user]);

  // Apply filters when search query or direction filter changes
  useEffect(() => {
    applyFilters();
  }, [searchQuery, directionFilter, subjects, applyFilters]);

  // Filter function
  const applyFilters = () => {
    let filtered = [...subjects];

    // Apply direction filter
    if (directionFilter !== 'all') {
      filtered = filtered.filter(subject => 
        subject.direction && subject.direction._id === directionFilter
      );
    }

    // Apply search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(subject =>
        subject.name.toLowerCase().includes(query) ||
        (subject.description && subject.description.toLowerCase().includes(query))
      );
    }

    setFilteredSubjects(filtered);
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
    setCurrentSubject({ name: '', description: '', direction: '', credits: 1 });
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };

  const handleOpenEditDialog = (subject) => {
    setCurrentSubject({
      ...subject,
      direction: subject.direction ? subject.direction._id : ''
    });
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };

  const handleOpenDeleteDialog = (subjectId) => {
    const subjectToDelete = subjects.find(s => s._id === subjectId);
    setCurrentSubject(subjectToDelete);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  // Form handling
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle numeric values
    if (name === 'credits') {
      setCurrentSubject({
        ...currentSubject,
        [name]: Math.max(1, parseInt(value) || 1) // Ensure at least 1 credit
      });
    } else {
      setCurrentSubject({
        ...currentSubject,
        [name]: value
      });
    }
  };

  // CRUD operations
  const handleCreateSubject = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };

      const response = await axios.post(`${API_URL}/subjects`, currentSubject, config);
      
      // Add the new subject to state
      setSubjects([...subjects, response.data]);
      
      // Close dialog and show success message
      setOpenAddDialog(false);
      toast.success('Subject created successfully');
    } catch (err) {
      console.error('Error creating subject:', err);
      toast.error(err.response?.data?.message || 'Failed to create subject');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubject = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };

      const response = await axios.put(
        `${API_URL}/subjects/${currentSubject._id}`, 
        currentSubject, 
        config
      );
      
      // Update the subject in state
      setSubjects(subjects.map(subject => 
        subject._id === currentSubject._id ? response.data : subject
      ));
      
      // Close dialog and show success message
      setOpenEditDialog(false);
      toast.success('Subject updated successfully');
    } catch (err) {
      console.error('Error updating subject:', err);
      toast.error(err.response?.data?.message || 'Failed to update subject');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async () => {
    try {
      setLoading(true);
      
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };

      await axios.delete(`${API_URL}/subjects/${currentSubject._id}`, config);
      
      // Remove the subject from state
      setSubjects(subjects.filter(subject => subject._id !== currentSubject._id));
      
      // Close dialog and show success message
      setOpenDeleteDialog(false);
      toast.success('Subject deleted successfully');
    } catch (err) {
      console.error('Error deleting subject:', err);
      toast.error(err.response?.data?.message || 'Failed to delete subject');
    } finally {
      setLoading(false);
    }
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!currentSubject.name.trim()) {
      errors.name = 'Subject name is required';
    }
    
    // Set any validation errors
    if (Object.keys(errors).length > 0) {
      toast.error(Object.values(errors)[0]);
      return false;
    }
    
    return true;
  };

  // Helper function removed as it's not currently used
  
  // Loading and error states
  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading subjects...
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
            Error Loading Subjects
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
            Manage Subjects
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
          >
            Add Subject
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search subjects"
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
              <InputLabel id="direction-filter-label">Filter by Direction</InputLabel>
              <Select
                labelId="direction-filter-label"
                value={directionFilter}
                onChange={(e) => setDirectionFilter(e.target.value)}
                label="Filter by Direction"
              >
                <MenuItem value="all">All Directions</MenuItem>
                {directions.map((direction) => (
                  <MenuItem key={direction._id} value={direction._id}>
                    {direction.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Subjects Table */}
        <TableContainer component={Paper} sx={{ mb: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Direction</TableCell>
                <TableCell>Credits</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSubjects
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((subject) => (
                  <TableRow key={subject._id}>
                    <TableCell>{subject.name}</TableCell>
                    <TableCell>{subject.description || 'N/A'}</TableCell>
                    <TableCell>
                      {subject.direction ? (
                        <Chip 
                          icon={<CategoryIcon />} 
                          label={subject.direction.name} 
                          variant="outlined" 
                          size="small"
                        />
                      ) : 'None'}
                    </TableCell>
                    <TableCell>{subject.credits || 1}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => handleOpenEditDialog(subject)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleOpenDeleteDialog(subject._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredSubjects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    {subjects.length === 0 ? 'No subjects found. Add your first subject!' : 'No subjects match your search criteria'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredSubjects.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Add Subject Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Subject</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            name="name"
            label="Subject Name"
            type="text"
            fullWidth
            variant="outlined"
            value={currentSubject.name}
            onChange={handleInputChange}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SubjectIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            value={currentSubject.description || ''}
            onChange={handleInputChange}
            multiline
            rows={3}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MenuBookIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel id="direction-label">Academic Direction</InputLabel>
            <Select
              labelId="direction-label"
              name="direction"
              value={currentSubject.direction || ''}
              onChange={handleInputChange}
              label="Academic Direction"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {directions.map((direction) => (
                <MenuItem key={direction._id} value={direction._id}>
                  {direction.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            name="credits"
            label="Credits"
            type="number"
            fullWidth
            variant="outlined"
            value={currentSubject.credits || 1}
            onChange={handleInputChange}
            inputProps={{ min: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button onClick={handleCreateSubject} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Subject Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Subject</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            name="name"
            label="Subject Name"
            type="text"
            fullWidth
            variant="outlined"
            value={currentSubject.name}
            onChange={handleInputChange}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SubjectIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            value={currentSubject.description || ''}
            onChange={handleInputChange}
            multiline
            rows={3}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MenuBookIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
            <InputLabel id="edit-direction-label">Academic Direction</InputLabel>
            <Select
              labelId="edit-direction-label"
              name="direction"
              value={currentSubject.direction || ''}
              onChange={handleInputChange}
              label="Academic Direction"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {directions.map((direction) => (
                <MenuItem key={direction._id} value={direction._id}>
                  {direction.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            name="credits"
            label="Credits"
            type="number"
            fullWidth
            variant="outlined"
            value={currentSubject.credits || 1}
            onChange={handleInputChange}
            inputProps={{ min: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleUpdateSubject} variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the subject "{currentSubject?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteSubject} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManageSubjects;
