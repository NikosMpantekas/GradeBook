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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  School as SchoolIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Link as LinkIcon,
  LocationOn as LocationIcon,
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

const SchoolBranchManager = () => {
  const dispatch = useDispatch();
  const { schools, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.schools
  );
  
  // Filter states
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showClusterSchools, setShowClusterSchools] = useState(false);
  
  // Dialog states
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  
  // School branch being edited or added
  const [schoolBranch, setSchoolBranch] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logo: '',
    schoolDomain: '', // Brand/cluster name
    emailDomain: '',
    parentCluster: null,
    isClusterSchool: false,
    branchDescription: '',
  });
  
  // ID of school to delete
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
  }, [schools, searchTerm, showClusterSchools, isError, message]);
  
  // Apply all filters to schools data
  const applyFilters = () => {
    try {
      // Safety check for schools array
      if (!Array.isArray(schools)) {
        console.error('UI Filter: Schools is not an array:', schools);
        setFilteredSchools([]);
        return;
      }

      // Filter by cluster type if needed
      let filteredByType = showClusterSchools 
        ? schools 
        : schools.filter(school => !school.isClusterSchool);
      
      // Then apply the search filter
      if (searchTerm.trim() === '') {
        setFilteredSchools(filteredByType);
      } else {
        // Apply search with safety checks
        const filtered = filteredByType.filter(school => {
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
  
  const toggleShowClusterSchools = () => {
    setShowClusterSchools(!showClusterSchools);
  };
  
  // Dialog handlers
  const handleOpenAddDialog = () => {
    setSchoolBranch({
      name: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      logo: '',
      schoolDomain: '',
      emailDomain: '',
      parentCluster: null,
      isClusterSchool: false,
      branchDescription: '',
    });
    setFormErrors({});
    setOpenAddDialog(true);
  };
  
  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };
  
  const handleOpenEditDialog = (school) => {
    setSchoolBranch({
      ...school,
      // Convert undefined values to empty strings for controlled inputs
      schoolDomain: school.schoolDomain || '',
      emailDomain: school.emailDomain || '',
      email: school.email || '',
      website: school.website || '',
      branchDescription: school.branchDescription || '',
      isClusterSchool: Boolean(school.isClusterSchool),
    });
    setFormErrors({});
    setOpenEditDialog(true);
  };
  
  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };
  
  const handleOpenDeleteDialog = (schoolId) => {
    setSchoolIdToDelete(schoolId);
    setOpenDeleteDialog(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSchoolIdToDelete(null);
  };
  
  // Form handling
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSchoolBranch(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error if field is filled
    if (value.trim() !== '' && formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!schoolBranch.name.trim()) {
      errors.name = 'School branch name is required';
    }
    
    if (!schoolBranch.address.trim()) {
      errors.address = 'Address is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // CRUD operations
  const handleAddSchool = () => {
    if (!validateForm()) return;
    
    // Generate default domain values if not provided
    const sanitizedName = schoolBranch.name.toLowerCase().replace(/\s+/g, '');
    const schoolData = {
      ...schoolBranch,
      schoolDomain: schoolBranch.schoolDomain || sanitizedName,
      emailDomain: schoolBranch.emailDomain || `${sanitizedName}.edu`
    };
    
    dispatch(createSchool(schoolData))
      .unwrap()
      .then(() => {
        toast.success('School branch added successfully');
        setOpenAddDialog(false);
        dispatch(getSchools()); // Refresh schools list
      })
      .catch((error) => {
        if (error.message) {
          toast.error(error.message);
        } else {
          toast.error('Failed to add school branch');
        }
      });
  };
  
  const handleEditSchool = () => {
    if (!validateForm()) return;
    
    // Generate default domain values if not provided
    const sanitizedName = schoolBranch.name.toLowerCase().replace(/\s+/g, '');
    const schoolData = {
      ...schoolBranch,
      schoolDomain: schoolBranch.schoolDomain || sanitizedName,
      emailDomain: schoolBranch.emailDomain || `${sanitizedName}.edu`
    };
    
    dispatch(updateSchool(schoolData))
      .unwrap()
      .then(() => {
        toast.success('School branch updated successfully');
        setOpenEditDialog(false);
        dispatch(getSchools()); // Refresh schools list
      })
      .catch((error) => {
        if (error.message) {
          toast.error(error.message);
        } else {
          toast.error('Failed to update school branch');
        }
      });
  };
  
  const handleDeleteSchool = () => {
    if (!schoolIdToDelete) return;
    
    dispatch(deleteSchool(schoolIdToDelete))
      .unwrap()
      .then(() => {
        toast.success('School branch deleted successfully');
        setOpenDeleteDialog(false);
        setSchoolIdToDelete(null);
        dispatch(getSchools()); // Refresh schools list
      })
      .catch((error) => {
        if (error.message) {
          toast.error(error.message);
        } else {
          toast.error('Failed to delete school branch');
        }
      });
  };
  
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }
  
  // Get list of cluster schools for parent selection
  const clusterSchools = schools ? schools.filter(school => school.isClusterSchool) : [];
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Manage School Branches
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={7}>
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
              <Grid item xs={12} sm={2}>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={showClusterSchools} 
                      onChange={toggleShowClusterSchools}
                      color="primary"
                    />
                  }
                  label="Show Clusters"
                />
              </Grid>
              <Grid item xs={12} sm={3}>
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
                    <ListItem sx={{ py: 2 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <SchoolIcon sx={{ mr: 1, color: school.isClusterSchool ? 'secondary.main' : 'primary.main' }} />
                            <Typography variant="subtitle1" fontWeight="bold">
                              {school.name}
                              {school.isClusterSchool && (
                                <Chip 
                                  label="Cluster" 
                                  size="small" 
                                  color="secondary" 
                                  sx={{ ml: 1, fontSize: '0.7rem' }} 
                                />
                              )}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Grid container spacing={1} sx={{ mt: 0.5 }}>
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <LocationIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                <Typography variant="body2" component="span">
                                  {school.address}
                                </Typography>
                              </Box>
                              {school.phone && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                  <PhoneIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                  <Typography variant="body2" component="span">
                                    {school.phone}
                                  </Typography>
                                </Box>
                              )}
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              {school.email && (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <EmailIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                  <Typography variant="body2" component="span">
                                    {school.email}
                                  </Typography>
                                </Box>
                              )}
                              {school.website && (
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                  <LinkIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                  <Typography variant="body2" component="span">
                                    {school.website}
                                  </Typography>
                                </Box>
                              )}
                              {school.emailDomain && (
                                <Box sx={{ mt: 0.5 }}>
                                  <Chip 
                                    label={`Domain: ${school.emailDomain}`} 
                                    size="small" 
                                    variant="outlined"
                                    sx={{ fontSize: '0.7rem' }} 
                                  />
                                </Box>
                              )}
                            </Grid>
                          </Grid>
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
                    primary="No school branches found" 
                    secondary={searchTerm ? "Try a different search term" : "Add a new school branch to get started"} 
                  />
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
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="dense"
                  label="School Branch Name *"
                  name="name"
                  fullWidth
                  variant="outlined"
                  value={schoolBranch.name}
                  onChange={handleInputChange}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  autoFocus
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="dense"
                  label="Address *"
                  name="address"
                  fullWidth
                  variant="outlined"
                  value={schoolBranch.address}
                  onChange={handleInputChange}
                  error={!!formErrors.address}
                  helperText={formErrors.address}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="dense"
                  label="Phone Number"
                  name="phone"
                  fullWidth
                  variant="outlined"
                  value={schoolBranch.phone}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="dense"
                  label="Email"
                  name="email"
                  fullWidth
                  variant="outlined"
                  value={schoolBranch.email}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="Website"
                  name="website"
                  fullWidth
                  variant="outlined"
                  value={schoolBranch.website}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="subtitle1" color="primary" gutterBottom>
              School Domain/Brand Information
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="dense"
                  label="School Domain/Brand Name"
                  name="schoolDomain"
                  fullWidth
                  variant="outlined"
                  value={schoolBranch.schoolDomain}
                  onChange={handleInputChange}
                  helperText="The brand name this branch belongs to. If left empty, will be generated from the branch name."
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="dense"
                  label="Email Domain"
                  name="emailDomain"
                  fullWidth
                  variant="outlined"
                  value={schoolBranch.emailDomain}
                  onChange={handleInputChange}
                  helperText="Domain used for validating user emails. If left empty, will be generated from school domain."
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="dense">
                  <InputLabel id="parent-cluster-label">Parent Cluster</InputLabel>
                  <Select
                    labelId="parent-cluster-label"
                    name="parentCluster"
                    value={schoolBranch.parentCluster || ''}
                    onChange={handleInputChange}
                    label="Parent Cluster"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {clusterSchools.map((cluster) => (
                      <MenuItem key={cluster._id} value={cluster._id}>
                        {cluster.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={schoolBranch.isClusterSchool}
                      onChange={(e) => {
                        setSchoolBranch({
                          ...schoolBranch,
                          isClusterSchool: e.target.checked,
                          // If this is a cluster, it can't have a parent cluster
                          parentCluster: e.target.checked ? null : schoolBranch.parentCluster
                        });
                      }}
                      name="isClusterSchool"
                    />
                  }
                  label="This is a main cluster school (not a branch)"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="Branch Description"
                  name="branchDescription"
                  fullWidth
                  multiline
                  rows={2}
                  variant="outlined"
                  value={schoolBranch.branchDescription}
                  onChange={handleInputChange}
                  helperText="Description of this branch's role in the cluster"
                />
              </Grid>
            </Grid>
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
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="dense"
                  label="School Branch Name *"
                  name="name"
                  fullWidth
                  variant="outlined"
                  value={schoolBranch.name}
                  onChange={handleInputChange}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  autoFocus
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="dense"
                  label="Address *"
                  name="address"
                  fullWidth
                  variant="outlined"
                  value={schoolBranch.address}
                  onChange={handleInputChange}
                  error={!!formErrors.address}
                  helperText={formErrors.address}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="dense"
                  label="Phone Number"
                  name="phone"
                  fullWidth
                  variant="outlined"
                  value={schoolBranch.phone}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="dense"
                  label="Email"
                  name="email"
                  fullWidth
                  variant="outlined"
                  value={schoolBranch.email}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="Website"
                  name="website"
                  fullWidth
                  variant="outlined"
                  value={schoolBranch.website}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="subtitle1" color="primary" gutterBottom>
              School Domain/Brand Information
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="dense"
                  label="School Domain/Brand Name"
                  name="schoolDomain"
                  fullWidth
                  variant="outlined"
                  value={schoolBranch.schoolDomain}
                  onChange={handleInputChange}
                  helperText="The brand name this branch belongs to. If left empty, will be generated from the branch name."
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="dense"
                  label="Email Domain"
                  name="emailDomain"
                  fullWidth
                  variant="outlined"
                  value={schoolBranch.emailDomain}
                  onChange={handleInputChange}
                  helperText="Domain used for validating user emails. If left empty, will be generated from school domain."
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="dense">
                  <InputLabel id="edit-parent-cluster-label">Parent Cluster</InputLabel>
                  <Select
                    labelId="edit-parent-cluster-label"
                    name="parentCluster"
                    value={schoolBranch.parentCluster || ''}
                    onChange={handleInputChange}
                    label="Parent Cluster"
                    disabled={schoolBranch.isClusterSchool}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {clusterSchools
                      .filter(cluster => cluster._id !== schoolBranch._id) // Can't be its own parent
                      .map((cluster) => (
                        <MenuItem key={cluster._id} value={cluster._id}>
                          {cluster.name}
                        </MenuItem>
                      ))
                    }
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={schoolBranch.isClusterSchool}
                      onChange={(e) => {
                        setSchoolBranch({
                          ...schoolBranch,
                          isClusterSchool: e.target.checked,
                          // If this is a cluster, it can't have a parent cluster
                          parentCluster: e.target.checked ? null : schoolBranch.parentCluster
                        });
                      }}
                      name="isClusterSchool"
                    />
                  }
                  label="This is a main cluster school (not a branch)"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="Branch Description"
                  name="branchDescription"
                  fullWidth
                  multiline
                  rows={2}
                  variant="outlined"
                  value={schoolBranch.branchDescription}
                  onChange={handleInputChange}
                  helperText="Description of this branch's role in the cluster"
                />
              </Grid>
            </Grid>
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

export default SchoolBranchManager;
