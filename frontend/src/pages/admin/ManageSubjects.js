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
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  MenuBook as SubjectIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useSelector, useDispatch } from 'react-redux';
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  reset as resetSubjects
} from '../../features/subjects/subjectSlice';
import {
  getDirections,
  reset as resetDirections
} from '../../features/directions/directionSlice';

const ManageSubjects = () => {
  const dispatch = useDispatch();
  const { subjects, isLoading: subjectsLoading, isError: subjectsError, message: subjectsMessage } = useSelector(
    (state) => state.subjects
  );
  
  const { directions, isLoading: directionsLoading, isError: directionsError, message: directionsMessage } = useSelector(
    (state) => state.directions
  );
  
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const isLoading = subjectsLoading || directionsLoading;
  const [directionFilter, setDirectionFilter] = useState('');
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentSubject, setCurrentSubject] = useState({ name: '', directions: [], description: '' });
  const [subjectIdToDelete, setSubjectIdToDelete] = useState(null);
  
  // Form validation
  const [formErrors, setFormErrors] = useState({});
  
  // Load subjects and directions on component mount
  useEffect(() => {
    dispatch(getSubjects());
    dispatch(getDirections());
    
    return () => {
      dispatch(resetSubjects());
      dispatch(resetDirections());
    };
  }, [dispatch]);
  
  // Update filtered subjects when subjects, search term, or direction filter changes
  const applyFilters = () => {
    if (subjects) {
      let filtered = [...subjects];
      
      // Apply direction filter
      if (directionFilter) {
        filtered = filtered.filter(subject => 
          subject.directions && (
            // Handle case where directions is an array of IDs
            (Array.isArray(subject.directions) && subject.directions.includes(directionFilter)) ||
            // Handle case where directions is an array of objects
            (Array.isArray(subject.directions) && subject.directions.some(d => d._id === directionFilter))
          )
        );
      }
      
      // Apply search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        filtered = filtered.filter(subject => 
          subject.name.toLowerCase().includes(search) ||
          subject.description.toLowerCase().includes(search)
        );
      }
      
      setFilteredSubjects(filtered);
    }
  };

  useEffect(() => {
    if (subjectsError) {
      toast.error(subjectsMessage);
    }
    
    if (directionsError) {
      toast.error(directionsMessage);
    }
    
    if (subjects && subjects.length > 0) {
      applyFilters();
    }
  }, [subjects, subjectsError, directionsError, subjectsMessage, directionsMessage]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, directionFilter]);

  
  const getDirectionName = (directionId) => {
    if (!directionId) return 'None assigned';
    const direction = directions.find(d => d._id === directionId);
    return direction ? direction.name : 'Unknown';
  };
  
  // Helper to get an array of direction names
  const getDirectionNames = (directionIds) => {
    if (!directionIds || directionIds.length === 0) return 'None assigned';
    return directionIds
      .map(id => {
        const direction = directions.find(d => d._id === id);
        return direction ? direction.name : 'Unknown';
      })
      .join(', ');
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleDirectionFilterChange = (e) => {
    setDirectionFilter(e.target.value);
  };
  
  // Dialog handlers
  const handleOpenAddDialog = () => {
    setCurrentSubject({ name: '', directions: [], description: '' });
    setFormErrors({});
    setOpenAddDialog(true);
  };
  
  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };
  
  const handleOpenEditDialog = (subject) => {
    setCurrentSubject({
      _id: subject._id,
      name: subject.name,
      directions: subject.directions || [],
      description: subject.description || '',
    });
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
    
    // Clear validation errors when input changes
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
    
    // Special handling for directions to prevent duplicates
    if (name === 'directions') {
      // Ensure no duplicates in the directions array
      // This converts any objects to their IDs for proper comparison
      let normalizedDirections = Array.isArray(value) ? value.map(dir => {
        return typeof dir === 'object' && dir._id ? dir._id : dir;
      }) : [];
      
      // Remove any duplicates by converting to Set and back to array
      normalizedDirections = [...new Set(normalizedDirections)];
      
      setCurrentSubject({
        ...currentSubject,
        [name]: normalizedDirections,
      });
    } else {
      // Normal handling for other fields
      setCurrentSubject({
        ...currentSubject,
        [name]: value,
      });
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!currentSubject.name.trim()) {
      errors.name = 'Subject name is required';
    }
    
    // Direction is now optional, removed validation
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // CRUD operations
  const handleAddSubject = () => {
    if (validateForm()) {
      dispatch(createSubject(currentSubject))
        .unwrap()
        .then(() => {
          setOpenAddDialog(false);
          toast.success('Subject added successfully');
        })
        .catch((error) => {
          toast.error(error);
        });
    }
  };
  
  const handleEditSubject = () => {
    if (validateForm()) {
      // Structure the update data correctly with id and subjectData separately
      const subjectId = currentSubject._id;
      const subjectData = {
        name: currentSubject.name,
        description: currentSubject.description,
        directions: currentSubject.directions, // Include directions array
      };
      
      dispatch(updateSubject({ id: subjectId, subjectData }))
        .unwrap()
        .then(() => {
          setOpenEditDialog(false);
          // Refresh the subjects list after update
          dispatch(getSubjects());
          toast.success('Subject updated successfully');
        })
        .catch((error) => {
          toast.error(`Failed to update subject: ${error}`);
        });
    }
  };
  
  const handleDeleteSubject = () => {
    dispatch(deleteSubject(subjectIdToDelete))
      .unwrap()
      .then(() => {
        setOpenDeleteDialog(false);
        toast.success('Subject deleted successfully');
      })
      .catch((error) => {
        toast.error(error);
      });
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
                              Directions: {subject.directions && subject.directions.length > 0 ? 
                                subject.directions.map(d => {
                                  if (typeof d === 'object' && d.name) return d.name;
                                  if (typeof d === 'object' && d._id) return getDirectionName(d._id);
                                  return getDirectionName(d);
                                }).join(', ') : 
                                'None assigned'}
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
              error={!!formErrors.directions}
            >
              <InputLabel id="directions-label">Directions</InputLabel>
              <Select
                labelId="directions-label"
                id="directions"
                name="directions"
                multiple
                value={Array.isArray(currentSubject.directions) ? currentSubject.directions : []}
                onChange={(e) => {
                  // Prevent duplicates by normalizing the array
                  let normalizedDirections = Array.isArray(e.target.value) ? e.target.value.map(dir => {
                    return typeof dir === 'object' && dir._id ? dir._id : dir;
                  }) : [];
                  
                  // Remove duplicates by converting to Set and back to array
                  normalizedDirections = [...new Set(normalizedDirections)];
                  
                  // Update subject with deduplicated directions
                  setCurrentSubject({
                    ...currentSubject,
                    directions: normalizedDirections
                  });
                  
                  // Clear any errors
                  if (formErrors.directions) {
                    setFormErrors({
                      ...formErrors,
                      directions: ''
                    });
                  }
                }}
                label="Directions"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      // Handle different direction formats
                      const directionId = typeof value === 'object' ? value._id : value;
                      const direction = directions.find(d => d._id === directionId);
                      return direction ? direction.name : (typeof value === 'object' ? 'Unknown' : value);
                    }).join(', ')}
                  </Box>
                )}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 224,
                      width: 250,
                    },
                  },
                }}
              >
                {directions.map((direction) => (
                  <MenuItem key={direction._id} value={direction._id}>
                    <Checkbox 
                      checked={
                        Array.isArray(currentSubject.directions) ? 
                        currentSubject.directions.some(selected => {
                          // Handle both object references and string IDs
                          return typeof selected === 'object' ? 
                            selected._id === direction._id : 
                            selected === direction._id;
                        }) : 
                        false
                      }
                    />
                    <ListItemText primary={direction.name} />
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
              error={!!formErrors.directions}
            >
              <InputLabel id="edit-directions-label">Directions</InputLabel>
              <Select
                labelId="edit-directions-label"
                id="directions"
                name="directions"
                multiple
                value={Array.isArray(currentSubject.directions) ? currentSubject.directions : []}
                onChange={(e) => {
                  // Prevent duplicates by normalizing the array
                  let normalizedDirections = Array.isArray(e.target.value) ? e.target.value.map(dir => {
                    return typeof dir === 'object' && dir._id ? dir._id : dir;
                  }) : [];
                  
                  // Remove duplicates by converting to Set and back to array
                  normalizedDirections = [...new Set(normalizedDirections)];
                  
                  // Update subject with deduplicated directions
                  setCurrentSubject({
                    ...currentSubject,
                    directions: normalizedDirections
                  });
                  
                  // Clear any errors
                  if (formErrors.directions) {
                    setFormErrors({
                      ...formErrors,
                      directions: ''
                    });
                  }
                }}
                label="Directions"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      // Handle different direction formats
                      const directionId = typeof value === 'object' ? value._id : value;
                      const direction = directions.find(d => d._id === directionId);
                      return direction ? direction.name : (typeof value === 'object' ? 'Unknown' : value);
                    }).join(', ')}
                  </Box>
                )}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 224,
                      width: 250,
                    },
                  },
                }}
              >
                {directions.map((direction) => (
                  <MenuItem key={direction._id} value={direction._id}>
                    <Checkbox 
                      checked={
                        Array.isArray(currentSubject.directions) ? 
                        currentSubject.directions.some(selected => {
                          // Handle both object references and string IDs
                          return typeof selected === 'object' ? 
                            selected._id === direction._id : 
                            selected === direction._id;
                        }) : 
                        false
                      }
                    />
                    <ListItemText primary={direction.name} />
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
