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

// Dummy data for directions
const initialDirections = [
  { _id: '1', name: 'Science', description: 'Physics, Chemistry, Biology' },
  { _id: '2', name: 'Mathematics', description: 'Algebra, Geometry, Calculus' },
  { _id: '3', name: 'Humanities', description: 'History, Literature, Philosophy' },
  { _id: '4', name: 'Arts', description: 'Visual Arts, Music, Drama' },
  { _id: '5', name: 'Technology', description: 'Computer Science, Engineering' },
  { _id: '6', name: 'Languages', description: 'English, French, Spanish' },
];

const ManageDirections = () => {
  const [directions, setDirections] = useState([]);
  const [filteredDirections, setFilteredDirections] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog states
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentDirection, setCurrentDirection] = useState({ name: '', description: '' });
  const [directionIdToDelete, setDirectionIdToDelete] = useState(null);
  
  // Form validation
  const [formErrors, setFormErrors] = useState({});
  
  useEffect(() => {
    // Simulate API call to fetch directions
    setTimeout(() => {
      setDirections(initialDirections);
      setFilteredDirections(initialDirections);
      setIsLoading(false);
    }, 1000);
  }, []);
  
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredDirections(directions);
    } else {
      const filtered = directions.filter(direction => 
        direction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        direction.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDirections(filtered);
    }
  }, [searchTerm, directions]);
  
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
      // Generate a new ID (in a real app, this would be done by the backend)
      const newId = (Math.max(...directions.map(d => parseInt(d._id))) + 1).toString();
      
      const newDirection = {
        _id: newId,
        ...currentDirection,
      };
      
      const updatedDirections = [...directions, newDirection];
      setDirections(updatedDirections);
      setFilteredDirections(updatedDirections);
      
      toast.success('Direction added successfully');
      handleCloseAddDialog();
    }
  };
  
  const handleEditDirection = () => {
    if (validateForm()) {
      const updatedDirections = directions.map(direction => 
        direction._id === currentDirection._id ? currentDirection : direction
      );
      
      setDirections(updatedDirections);
      setFilteredDirections(updatedDirections);
      
      toast.success('Direction updated successfully');
      handleCloseEditDialog();
    }
  };
  
  const handleDeleteDirection = () => {
    const updatedDirections = directions.filter(direction => direction._id !== directionIdToDelete);
    
    setDirections(updatedDirections);
    setFilteredDirections(updatedDirections);
    
    toast.success('Direction deleted successfully');
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
