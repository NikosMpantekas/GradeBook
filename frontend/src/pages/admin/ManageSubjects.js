import React, { useEffect, useState } from 'react';
import {
  Typography,
  Paper,
  Box,
  Button,
  TextField,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Divider,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  MenuBook as SubjectIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

// Dummy data for subjects
const initialSubjects = [
  { _id: '1', name: 'Mathematics', direction: '2', description: 'Algebra, Geometry, Calculus' },
  { _id: '2', name: 'Physics', direction: '1', description: 'Mechanics, Thermodynamics, Electromagnetism' },
  { _id: '3', name: 'History', direction: '3', description: 'World History, Ancient Civilizations' },
  { _id: '4', name: 'Literature', direction: '3', description: 'Classic Literature, Modern Literature' },
  { _id: '5', name: 'Computer Science', direction: '5', description: 'Programming, Algorithms, Data Structures' },
  { _id: '6', name: 'Chemistry', direction: '1', description: 'Organic Chemistry, Inorganic Chemistry' },
];

// Dummy data for directions (referenced by subjects)
const directionsData = [
  { _id: '1', name: 'Science' },
  { _id: '2', name: 'Mathematics' },
  { _id: '3', name: 'Humanities' },
  { _id: '4', name: 'Arts' },
  { _id: '5', name: 'Technology' },
  { _id: '6', name: 'Languages' },
];

const ManageSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [directions, setDirections] = useState([]);
  
  // Dialog states
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentSubject, setCurrentSubject] = useState({ name: '', direction: '', description: '' });
  const [subjectIdToDelete, setSubjectIdToDelete] = useState(null);
  
  // Form validation
  const [formErrors, setFormErrors] = useState({});
  
  useEffect(() => {
    // Simulate API calls to fetch subjects and directions
    setIsLoading(true);
    setTimeout(() => {
      setSubjects(initialSubjects);
      setFilteredSubjects(initialSubjects);
      setDirections(directionsData);
      setIsLoading(false);
    }, 1000);
  }, []);
  
  useEffect(() => {
    let filtered = [...subjects];
    
    // Apply direction filter
    if (directionFilter) {
      filtered = filtered.filter(subject => subject.direction === directionFilter);
    }
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(subject =>
        subject.name.toLowerCase().includes(searchLower) ||
        subject.description.toLowerCase().includes(searchLower) ||
        getDirectionName(subject.direction).toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredSubjects(filtered);
  }, [searchTerm, directionFilter, subjects]);
  
  const getDirectionName = (directionId) => {
    const direction = directions.find(d => d._id === directionId);
    return direction ? direction.name : 'Unknown Direction';
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleDirectionFilterChange = (e) => {
    setDirectionFilter(e.target.value);
  };
  
  // Dialog handlers
  const handleOpenAddDialog = () => {
    setCurrentSubject({ name: '', direction: '', description: '' });
    setFormErrors({});
    setOpenAddDialog(true);
  };
  
  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };
  
  const handleOpenEditDialog = (subject) => {
    setCurrentSubject(subject);
    setFormErrors({});
    setOpenEditDialog(true);
  };
  
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };
  
  const handleOpenDeleteDialog = (id) => {
    setSubjectIdToDelete(id);
    setOpenDeleteDialog(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSubjectIdToDelete(null);
  };
  
  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error when field is modified
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
    
    setCurrentSubject({
      ...currentSubject,
      [name]: value,
    });
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!currentSubject.name.trim()) {
      errors.name = 'Subject name is required';
    }
    
    if (!currentSubject.direction) {
      errors.direction = 'Direction is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // CRUD operations
  const handleAddSubject = () => {
    if (validateForm()) {
      // Generate a new ID (in a real app, this would be done by the backend)
      const newId = (Math.max(...subjects.map(s => parseInt(s._id))) + 1).toString();
      
      const newSubject = {
        _id: newId,
        ...currentSubject,
      };
      
      const updatedSubjects = [...subjects, newSubject];
      setSubjects(updatedSubjects);
      setFilteredSubjects(updatedSubjects);
      
      toast.success('Subject added successfully');
      handleCloseAddDialog();
    }
  };
  
  const handleEditSubject = () => {
    if (validateForm()) {
      const updatedSubjects = subjects.map(subject => 
        subject._id === currentSubject._id ? currentSubject : subject
      );
      
      setSubjects(updatedSubjects);
      setFilteredSubjects(updatedSubjects);
      
      toast.success('Subject updated successfully');
      handleCloseEditDialog();
    }
  };
  
  const handleDeleteSubject = () => {
    const updatedSubjects = subjects.filter(subject => subject._id !== subjectIdToDelete);
    
    setSubjects(updatedSubjects);
    setFilteredSubjects(updatedSubjects);
    
    toast.success('Subject deleted successfully');
    handleCloseDeleteDialog();
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
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Manage Subjects
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  placeholder="Search by name or description"
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
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="direction-filter-label">Filter by Direction</InputLabel>
                  <Select
                    labelId="direction-filter-label"
                    id="direction-filter"
                    value={directionFilter}
                    onChange={handleDirectionFilterChange}
                    label="Filter by Direction"
                  >
                    <MenuItem value="">
                      <em>All Directions</em>
                    </MenuItem>
                    {directions.map((direction) => (
                      <MenuItem key={direction._id} value={direction._id}>
                        {direction.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenAddDialog}
                >
                  Add Subject
                </Button>
              </Grid>
            </Grid>
          </Paper>
          
          <Paper elevation={3} sx={{ borderRadius: 2 }}>
            <List>
              {filteredSubjects.length > 0 ? (
                filteredSubjects.map((subject, index) => (
                  <React.Fragment key={subject._id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <SubjectIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="subtitle1" fontWeight="bold">
                              {subject.name}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" component="span" color="text.secondary">
                              Direction: {getDirectionName(subject.direction)}
                            </Typography>
                            <br />
                            <Typography variant="body2" component="span">
                              {subject.description || 'No description provided'}
                            </Typography>
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          aria-label="edit"
                          onClick={() => handleOpenEditDialog(subject)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          edge="end" 
                          aria-label="delete"
                          onClick={() => handleOpenDeleteDialog(subject._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < filteredSubjects.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              ) : (
                <ListItem>
                  <ListItemText 
                    primary="No subjects found" 
                    secondary={
                      searchTerm || directionFilter 
                        ? "Try a different search term or filter" 
                        : "Add a subject to get started"
                    }
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Add Subject Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog}>
        <DialogTitle>Add New Subject</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              margin="dense"
              label="Subject Name *"
              name="name"
              fullWidth
              variant="outlined"
              value={currentSubject.name}
              onChange={handleInputChange}
              error={!!formErrors.name}
              helperText={formErrors.name}
              autoFocus
            />
            <FormControl 
              fullWidth 
              margin="dense"
              error={!!formErrors.direction}
            >
              <InputLabel id="direction-label">Direction *</InputLabel>
              <Select
                labelId="direction-label"
                id="direction"
                name="direction"
                value={currentSubject.direction}
                onChange={handleInputChange}
                label="Direction *"
              >
                <MenuItem value="">
                  <em>Select a direction</em>
                </MenuItem>
                {directions.map((direction) => (
                  <MenuItem key={direction._id} value={direction._id}>
                    {direction.name}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.direction && (
                <FormHelperText>{formErrors.direction}</FormHelperText>
              )}
            </FormControl>
            <TextField
              margin="dense"
              label="Description"
              name="description"
              fullWidth
              variant="outlined"
              value={currentSubject.description}
              onChange={handleInputChange}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button onClick={handleAddSubject} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Subject Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
        <DialogTitle>Edit Subject</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              margin="dense"
              label="Subject Name *"
              name="name"
              fullWidth
              variant="outlined"
              value={currentSubject.name}
              onChange={handleInputChange}
              error={!!formErrors.name}
              helperText={formErrors.name}
              autoFocus
            />
            <FormControl 
              fullWidth 
              margin="dense"
              error={!!formErrors.direction}
            >
              <InputLabel id="edit-direction-label">Direction *</InputLabel>
              <Select
                labelId="edit-direction-label"
                id="direction"
                name="direction"
                value={currentSubject.direction}
                onChange={handleInputChange}
                label="Direction *"
              >
                <MenuItem value="">
                  <em>Select a direction</em>
                </MenuItem>
                {directions.map((direction) => (
                  <MenuItem key={direction._id} value={direction._id}>
                    {direction.name}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.direction && (
                <FormHelperText>{formErrors.direction}</FormHelperText>
              )}
            </FormControl>
            <TextField
              margin="dense"
              label="Description"
              name="description"
              fullWidth
              variant="outlined"
              value={currentSubject.description}
              onChange={handleInputChange}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleEditSubject} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Subject Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this subject? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteSubject} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageSubjects;
