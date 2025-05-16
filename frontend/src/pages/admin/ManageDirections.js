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
  TrendingUp as DirectionIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useSelector, useDispatch } from 'react-redux';
import {
  getDirections,
  createDirection,
  updateDirection,
  deleteDirection,
  reset
} from '../../features/directions/directionSlice';

const ManageDirections = () => {
  const dispatch = useDispatch();
  const { directions, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.directions
  );
  
  const [filteredDirections, setFilteredDirections] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentDirection, setCurrentDirection] = useState({ name: '', description: '' });
  const [directionIdToDelete, setDirectionIdToDelete] = useState(null);
  
  // Form validation
  const [formErrors, setFormErrors] = useState({});
  
  // Load directions on component mount
  useEffect(() => {
    dispatch(getDirections());
    
    return () => {
      dispatch(reset());
    };
  }, [dispatch]);
  
  // Update filtered directions when directions or search term changes
  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
    
    if (directions) {
      applyFilters();
    }
  }, [directions, searchTerm, isError, message]);
  
  const applyFilters = () => {
    if (searchTerm.trim() === '') {
      setFilteredDirections(directions);
    } else {
      const filtered = directions.filter(direction => 
        direction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        direction.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDirections(filtered);
    }
  };
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Dialog handlers
  const handleOpenAddDialog = () => {
    setCurrentDirection({ name: '', description: '' });
    setFormErrors({});
    setOpenAddDialog(true);
  };
  
  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };
  
  const handleOpenEditDialog = (direction) => {
    setCurrentDirection(direction);
    setFormErrors({});
    setOpenEditDialog(true);
  };
  
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };
  
  const handleOpenDeleteDialog = (id) => {
    setDirectionIdToDelete(id);
    setOpenDeleteDialog(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setDirectionIdToDelete(null);
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
    
    setCurrentDirection({
      ...currentDirection,
      [name]: value,
    });
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!currentDirection.name.trim()) {
      errors.name = 'Direction name is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // CRUD operations
  const handleAddDirection = () => {
    if (validateForm()) {
      dispatch(createDirection(currentDirection))
        .unwrap()
        .then(() => {
          setOpenAddDialog(false);
          toast.success('Direction added successfully');
        })
        .catch((error) => {
          toast.error(error);
        });
    }
  };
  
  const handleEditDirection = () => {
    if (validateForm()) {
      // Structure the update data correctly with id and directionData separately
      const directionId = currentDirection._id;
      const directionData = {
        name: currentDirection.name,
        description: currentDirection.description,
        // Include any other fields that are part of the direction model
      };
      
      dispatch(updateDirection({ id: directionId, directionData }))
        .unwrap()
        .then(() => {
          setOpenEditDialog(false);
          // Refresh the directions list after update
          dispatch(getDirections());
          toast.success('Direction updated successfully');
        })
        .catch((error) => {
          toast.error(`Failed to update direction: ${error}`);
        });
    }
  };
  
  const handleDeleteDirection = () => {
    dispatch(deleteDirection(directionIdToDelete))
      .unwrap()
      .then(() => {
        setOpenDeleteDialog(false);
        toast.success('Direction deleted successfully');
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
        Manage Directions
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
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
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenAddDialog}
                >
                  Add Direction
                </Button>
              </Grid>
            </Grid>
          </Paper>
          
          <Paper elevation={3} sx={{ borderRadius: 2 }}>
            <List>
              {filteredDirections.length > 0 ? (
                filteredDirections.map((direction, index) => (
                  <React.Fragment key={direction._id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <DirectionIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="subtitle1" fontWeight="bold">
                              {direction.name}
                            </Typography>
                          </Box>
                        }
                        secondary={direction.description || 'No description provided'}
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          aria-label="edit"
                          onClick={() => handleOpenEditDialog(direction)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          edge="end" 
                          aria-label="delete"
                          onClick={() => handleOpenDeleteDialog(direction._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < filteredDirections.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              ) : (
                <ListItem>
                  <ListItemText 
                    primary="No directions found" 
                    secondary={searchTerm ? "Try a different search term" : "Add a direction to get started"}
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Add Direction Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog}>
        <DialogTitle>Add New Direction</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              margin="dense"
              label="Direction Name *"
              name="name"
              fullWidth
              variant="outlined"
              value={currentDirection.name}
              onChange={handleInputChange}
              error={!!formErrors.name}
              helperText={formErrors.name}
              autoFocus
            />
            <TextField
              margin="dense"
              label="Description"
              name="description"
              fullWidth
              variant="outlined"
              value={currentDirection.description}
              onChange={handleInputChange}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button onClick={handleAddDirection} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Direction Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
        <DialogTitle>Edit Direction</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              margin="dense"
              label="Direction Name *"
              name="name"
              fullWidth
              variant="outlined"
              value={currentDirection.name}
              onChange={handleInputChange}
              error={!!formErrors.name}
              helperText={formErrors.name}
              autoFocus
            />
            <TextField
              margin="dense"
              label="Description"
              name="description"
              fullWidth
              variant="outlined"
              value={currentDirection.description}
              onChange={handleInputChange}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleEditDirection} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Direction Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this direction? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteDirection} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageDirections;
