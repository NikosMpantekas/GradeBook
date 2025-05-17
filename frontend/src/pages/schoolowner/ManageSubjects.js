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
    const fetchData = async () => {
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

        // Fetch subjects
        console.log('Fetching subjects...');
        const subjectsResponse = await axios.get(`${API_URL}/subjects`, config);
        console.log('Subjects fetched successfully:', subjectsResponse.data.length);
        setSubjects(subjectsResponse.data);
        setFilteredSubjects(subjectsResponse.data);
        
        // Fetch directions
        console.log('Fetching directions...');
        const directionsResponse = await axios.get(`${API_URL}/directions`, config);
        console.log('Directions fetched successfully:', directionsResponse.data.length);
        setDirections(directionsResponse.data);
      } catch (err) {
        console.error('Error fetching data:', err);
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

    fetchData();
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
  // const getDirectionName = (directionId) => {
  //   const direction = directions.find(d => d._id === directionId);
  //   return direction ? direction.name : 'N/A';
  // };

  if (loading && subjects.length === 0) {
    return (
      <Container sx={{ textAlign: 'center', mt: 4 }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading subjects...
        </Typography>
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
