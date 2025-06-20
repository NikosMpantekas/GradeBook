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
  Checkbox,
  FormControlLabel,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useSelector, useDispatch } from 'react-redux';
import {
  getSchools,
  createSchool,
  updateSchool,
  deleteSchool,
  reset
} from '../../features/schools/schoolSlice';

const ManageSchools = () => {
  const dispatch = useDispatch();
  const { schools, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.schools
  );
  
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  // State for the school branch being edited or added
  const [schoolBranch, setSchoolBranch] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logo: '',
    schoolDomain: '', // Brand/cluster name
    emailDomain: '',
    parentCluster: '',
    isClusterSchool: false,
    branchDescription: '',
  });
  const [schoolIdToDelete, setSchoolIdToDelete] = useState(null);
  
  // Form validation
  const [formErrors, setFormErrors] = useState({});
  
  // Load schools on component mount
  useEffect(() => {
    dispatch(getSchools());
    
    return () => {
      dispatch(reset());
    };
  }, [dispatch]);
  
  // Update filtered schools when schools or search term changes
  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
    
    if (schools) {
      applyFilters();
    }
  }, [schools, searchTerm, isError, message]);
  
  /**
   * School branch detection - MINIMAL filtering to show existing schools
   * This is a FIXED version that won't filter out your legitimate schools
   */
  const isClusterSchool = (school) => {
    try {
      // Handle null/undefined schools
      if (!school) {
        console.log('UI Filter: Excluding null/undefined school');
        return true;
      }
      
      // Log which school we're checking
      console.log(`UI Filter checking school: ${school.name || 'unnamed'}, ID: ${school._id || 'no ID'}`);
      
      // MINIMAL filtering that only excludes schools explicitly marked as clusters
      
      // 1. If it's explicitly flagged as NOT a cluster, ALWAYS keep it
      if (school.isClusterSchool === false || school.isBranchSchool === true) {
        console.log(`UI Filter: KEEPING explicitly marked branch: ${school.name}`);
        return false;
      }
      
      // 2. Only filter out schools EXPLICITLY marked as clusters
      if (school.isClusterSchool === true) {
        console.log(`UI Filter: Excluding explicit cluster school: ${school.name}`);
        return true;
      }
      
      // 3. Extremely minimal pattern matching - only exact matches
      if (school.name) {
        const exactClusterNames = ['cluster', 'main', 'district', 'central'];
        const nameLower = school.name.toLowerCase();
        if (exactClusterNames.includes(nameLower)) {
          console.log(`UI Filter: Excluding obvious cluster by exact name: ${school.name}`);
          return true;
        }
      }
      
      // By default, KEEP all schools to avoid filtering out legitimate branches
      console.log(`UI Filter: KEEPING school: ${school.name}`);
      return false;
    } catch (error) {
      // Log the error but KEEP the school anyway to avoid losing legitimate branches
      console.error('UI Filter: Error in school filtering, keeping school for safety:', error);
      return false;
    }
  };
  
  // Apply all filters to schools data
  const applyFilters = () => {
    try {
      // Safety check for schools array
      if (!Array.isArray(schools)) {
        console.error('UI Filter: Schools is not an array:', schools);
        setFilteredSchools([]);
        return;
      }

      // First apply cluster school filtering as a UI-level safeguard
      const nonClusterSchools = schools.filter(school => !isClusterSchool(school));
      
      console.log(`UI Filter: Excluded ${schools.length - nonClusterSchools.length} cluster schools, showing ${nonClusterSchools.length} school branches`);
      
      // Then apply the search filter to the non-cluster schools
      if (searchTerm.trim() === '') {
        setFilteredSchools(nonClusterSchools);
      } else {
        // Apply search with safety checks
        const filtered = nonClusterSchools.filter(school => {
          try {
            const nameMatch = school.name && typeof school.name === 'string' ? 
              school.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
              
            const addressMatch = school.address && typeof school.address === 'string' ? 
              school.address.toLowerCase().includes(searchTerm.toLowerCase()) : false;
              
            const phoneMatch = school.phone && typeof school.phone === 'string' ? 
              school.phone.includes(searchTerm) : false;
              
            return nameMatch || addressMatch || phoneMatch;
          } catch (error) {
            console.error('UI Filter: Error filtering school by search term:', error);
            return false; // Safety: exclude on error
          }
        });
        
        setFilteredSchools(filtered);
      }
    } catch (error) {
      console.error('UI Filter: Critical error in applyFilters, showing no schools:', error);
      setFilteredSchools([]); // Safety: show no schools on error
    }
  };
  
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
    setCurrentSchool({ name: '', address: '', phone: '' });
    setFormErrors({});
  };
  
  const handleOpenEditDialog = (school) => {
    setCurrentSchool(school);
    setFormErrors({});
    setOpenEditDialog(true);
  };
  
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setCurrentSchool({ name: '', address: '', phone: '' });
    setFormErrors({});
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
      errors.phone = 'Phone number should have 10 digits ';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // CRUD operations
  const handleAddSchool = () => {
    if (validateForm()) {
      dispatch(createSchool(currentSchool))
        .unwrap()
        .then(() => {
          setOpenAddDialog(false);
          toast.success('School added successfully');
        })
        .catch((error) => {
          toast.error(error);
        });
    }
  };
  
  const handleEditSchool = () => {
    if (validateForm()) {
      // Structure the update data correctly with id and schoolData separately
      const schoolId = currentSchool._id; 
      const schoolData = {
        name: currentSchool.name,
        address: currentSchool.address,
        phone: currentSchool.phone,
        email: currentSchool.email,
        website: currentSchool.website,
        logo: currentSchool.logo
      };
      
      dispatch(updateSchool({ id: schoolId, schoolData }))
        .unwrap()
        .then(() => {
          setOpenEditDialog(false);
          // Refresh the schools list after update
          dispatch(getSchools());
          toast.success('School updated successfully');
        })
        .catch((error) => {
          toast.error(`Failed to update school: ${error}`);
        });
    }
  };
  
  const handleDeleteSchool = () => {
    dispatch(deleteSchool(schoolIdToDelete))
      .unwrap()
      .then(() => {
        setOpenDeleteDialog(false);
        toast.success('School deleted successfully');
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
        Manage School Branches
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
                  Add School Branch
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
                  <ListItemText primary="No school branches found" secondary={searchTerm ? "Try a different search term" : "Add a new school branch to get started"} />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Add School Branch Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth="md" fullWidth>
        <DialogTitle>Add New School Branch</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              margin="dense"
              label="School Branch Name *"
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
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button onClick={handleAddSchool} variant="contained">Add School Branch</Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit School Branch Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="md" fullWidth>
        <DialogTitle>Edit School Branch</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              margin="dense"
              label="School Branch Name *"
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
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleEditSchool} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete School Branch Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete School Branch</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this school branch? This action cannot be undone.
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
