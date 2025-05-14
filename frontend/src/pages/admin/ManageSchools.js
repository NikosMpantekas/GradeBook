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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

// Dummy data for schools
const initialSchools = [
  { _id: '1', name: 'Central High School', address: '123 Main St, City', phone: '555-1234' },
  { _id: '2', name: 'Westside Academy', address: '456 Elm St, City', phone: '555-5678' },
  { _id: '3', name: 'Northview School', address: '789 Oak St, City', phone: '555-9012' },
];

const ManageSchools = () => {
  const [schools, setSchools] = useState([]);
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog states
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentSchool, setCurrentSchool] = useState({ name: '', address: '', phone: '' });
  const [schoolIdToDelete, setSchoolIdToDelete] = useState(null);
  
  // Form validation
  const [formErrors, setFormErrors] = useState({});
  
  useEffect(() => {
    // Simulate API call to fetch schools
    setTimeout(() => {
      setSchools(initialSchools);
      setFilteredSchools(initialSchools);
      setIsLoading(false);
    }, 1000);
  }, []);
  
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredSchools(schools);
    } else {
      const filtered = schools.filter(school => 
        school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.phone.includes(searchTerm)
      );
      setFilteredSchools(filtered);
    }
  }, [searchTerm, schools]);
  
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Dialog handlers
  const handleOpenAddDialog = () => {
    setCurrentSchool({ name: '', address: '', phone: '' });
    setFormErrors({});
    setOpenAddDialog(true);
  };
  
  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };
  
  const handleOpenEditDialog = (school) => {
    setCurrentSchool(school);
    setFormErrors({});
    setOpenEditDialog(true);
  };
  
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };
  
  const handleOpenDeleteDialog = (id) => {
    setSchoolIdToDelete(id);
    setOpenDeleteDialog(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSchoolIdToDelete(null);
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
    
    setCurrentSchool({
      ...currentSchool,
      [name]: value,
    });
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!currentSchool.name.trim()) {
      errors.name = 'School name is required';
    }
    
    if (!currentSchool.address.trim()) {
      errors.address = 'Address is required';
    }
    
    if (!currentSchool.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{3}-\d{4}$/.test(currentSchool.phone) && !/^\d{10}$/.test(currentSchool.phone)) {
      errors.phone = 'Phone number format should be 555-1234 or 5551234';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // CRUD operations
  const handleAddSchool = () => {
    if (validateForm()) {
      // Generate a new ID (in a real app, this would be done by the backend)
      const newId = (Math.max(...schools.map(s => parseInt(s._id))) + 1).toString();
      
      const newSchool = {
        _id: newId,
        ...currentSchool,
      };
      
      const updatedSchools = [...schools, newSchool];
      setSchools(updatedSchools);
      setFilteredSchools(updatedSchools);
      
      toast.success('School added successfully');
      handleCloseAddDialog();
    }
  };
  
  const handleEditSchool = () => {
    if (validateForm()) {
      const updatedSchools = schools.map(school => 
        school._id === currentSchool._id ? currentSchool : school
      );
      
      setSchools(updatedSchools);
      setFilteredSchools(updatedSchools);
      
      toast.success('School updated successfully');
      handleCloseEditDialog();
    }
  };
  
  const handleDeleteSchool = () => {
    const updatedSchools = schools.filter(school => school._id !== schoolIdToDelete);
    
    setSchools(updatedSchools);
    setFilteredSchools(updatedSchools);
    
    toast.success('School deleted successfully');
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
        Manage Schools
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  placeholder="Search by name, address, or phone"
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
                  Add School
                </Button>
              </Grid>
            </Grid>
          </Paper>
          
          <Paper elevation={3} sx={{ borderRadius: 2 }}>
            <List>
              {filteredSchools.length > 0 ? (
                filteredSchools.map((school, index) => (
                  <React.Fragment key={school._id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <SchoolIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography variant="subtitle1" fontWeight="bold">
                              {school.name}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              {school.address}
                            </Typography>
                            <br />
                            <Typography variant="body2" component="span">
                              Phone: {school.phone}
                            </Typography>
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          aria-label="edit"
                          onClick={() => handleOpenEditDialog(school)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          edge="end" 
                          aria-label="delete"
                          onClick={() => handleOpenDeleteDialog(school._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    {index < filteredSchools.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              ) : (
                <ListItem>
                  <ListItemText 
                    primary="No schools found" 
                    secondary={searchTerm ? "Try a different search term" : "Add a school to get started"}
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Add School Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog}>
        <DialogTitle>Add New School</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              margin="dense"
              label="School Name *"
              name="name"
              fullWidth
              variant="outlined"
              value={currentSchool.name}
              onChange={handleInputChange}
              error={!!formErrors.name}
              helperText={formErrors.name}
              autoFocus
            />
            <TextField
              margin="dense"
              label="Address *"
              name="address"
              fullWidth
              variant="outlined"
              value={currentSchool.address}
              onChange={handleInputChange}
              error={!!formErrors.address}
              helperText={formErrors.address}
            />
            <TextField
              margin="dense"
              label="Phone Number *"
              name="phone"
              fullWidth
              variant="outlined"
              value={currentSchool.phone}
              onChange={handleInputChange}
              error={!!formErrors.phone}
              helperText={formErrors.phone || 'Format: 555-1234 or 5551234'}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button onClick={handleAddSchool} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit School Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
        <DialogTitle>Edit School</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              margin="dense"
              label="School Name *"
              name="name"
              fullWidth
              variant="outlined"
              value={currentSchool.name}
              onChange={handleInputChange}
              error={!!formErrors.name}
              helperText={formErrors.name}
              autoFocus
            />
            <TextField
              margin="dense"
              label="Address *"
              name="address"
              fullWidth
              variant="outlined"
              value={currentSchool.address}
              onChange={handleInputChange}
              error={!!formErrors.address}
              helperText={formErrors.address}
            />
            <TextField
              margin="dense"
              label="Phone Number *"
              name="phone"
              fullWidth
              variant="outlined"
              value={currentSchool.phone}
              onChange={handleInputChange}
              error={!!formErrors.phone}
              helperText={formErrors.phone || 'Format: 555-1234 or 5551234'}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleEditSchool} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete School Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this school? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteSchool} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageSchools;
