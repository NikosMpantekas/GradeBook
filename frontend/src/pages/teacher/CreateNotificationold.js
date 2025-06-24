import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createNotification, reset } from '../../features/notifications/notificationSlice';
import { getUsersByRole } from '../../features/users/userSlice';
// Removed unused imports for simplified filtering
import { toast } from 'react-toastify';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
  Paper,
  FormHelperText,
  FormControlLabel,
  Switch,
  CircularProgress,
  // Divider, // Unused import
  Chip,
  ListItemText,
  Checkbox,
  OutlinedInput
} from '@mui/material';
import { 
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Notifications as NotificationsIcon
  // FilterList as FilterIcon // Unused import
} from '@mui/icons-material';

// Import our custom components
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

const CreateNotification = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user } = useSelector((state) => state.auth);
  const { isLoading, isError, isSuccess, message } = useSelector((state) => state.notifications);
  
  // Check if teacher has permission to send notifications
  React.useEffect(() => {
    // Only applies to teachers, not admins
    if (user?.role === 'teacher' && user?.canSendNotifications === false) {
      // Teacher doesn't have permission to send notifications
      toast.error('You do not have permission to send notifications');
      navigate('/app/teacher/dashboard');
    }
  }, [user, navigate]);
  const { users, filteredUsers, isLoading: isUsersLoading } = useSelector((state) => state.users);
  
  const [availableUsers, setAvailableUsers] = useState([]);
  const [formData, setFormData] = useState({
    recipients: [],         // Array of recipient IDs (multiple selection)
    title: '',
    message: '',
    sendToAll: false,
    filterByRole: 'student', // Default to student role
    isImportant: false       // Whether this is an important notification
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Loading state for all reference data
  // eslint-disable-next-line no-unused-vars
  const isLoadingOptions = isUsersLoading;
  
  // Fetch data when component mounts - simplified to only users based on role
  useEffect(() => {
    console.log('Fetching data for notification creation...');
    
    // Load users based on user role - respecting class-based filtering
    dispatch(getUsersByRole(formData.filterByRole))
      .unwrap()
      .then(users => {
        console.log(`Loaded ${users?.length || 0} ${formData.filterByRole}s`);
        // Users will be filtered by class in backend for teachers
      })
      .catch(error => {
        console.error(`Failed to load ${formData.filterByRole}s:`, error);
        toast.error(`Failed to load users: ${error.message || 'Unknown error'}`);
      });
  }, [dispatch]);

  // Update available users when filteredUsers data changes or role filter changes
  useEffect(() => {
    if (filteredUsers && Array.isArray(filteredUsers)) {
      console.log(`Setting ${filteredUsers.length} users for role ${formData.filterByRole}:`, filteredUsers);
      // Only include users with valid data
      const validUsers = filteredUsers.filter(user => 
        user && user._id && user.name && typeof user.name === 'string'
      );
      setAvailableUsers(validUsers);
    } else {
      // If filteredUsers is not available or not an array, set an empty array
      console.warn('Filtered users data is invalid:', filteredUsers);
      setAvailableUsers([]);
    }
  }, [filteredUsers, formData.filterByRole]);

  // Handle the filter related change in role
  useEffect(() => {
    // Reset filters when role changes
    setFormData(prev => ({
      ...prev,
      recipients: [], // Reset recipients when role changes
    }));
    
    // Load new users - with class-based filtering applied in backend for teachers
    console.log(`Role changed to ${formData.filterByRole}, loading users...`);
    dispatch(getUsersByRole(formData.filterByRole));
  }, [formData.filterByRole, dispatch]);

  // Use refs to track component state
  const isInitialMount = React.useRef(true);
  const hasSubmitted = React.useRef(false);
  
  // Handle switch change - simplified just for sendToAll and isImportant
  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    
    // Update form data based on switch name
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
    
    // Clear errors if needed
    if (name === 'sendToAll' && checked && formErrors.recipients) {
      setFormErrors(prev => ({
        ...prev,
        recipients: ''
      }));
    }
  };
  
  const validate = () => {
    const errors = {};
    
    // Basic fields validation
    if (!formData.title.trim()) {
      errors.title = 'Please enter a title';
    } else if (formData.title.length > 100) {
      errors.title = 'Title must be less than 100 characters';
    }
    
    if (!formData.message.trim()) {
      errors.message = 'Please enter a message';
    } else if (formData.message.length > 1000) {
      errors.message = 'Message must be less than 1000 characters';
    }
    
    // Recipient selection validation - simplified
    if (!formData.sendToAll && formData.recipients.length === 0) {
      errors.recipients = 'Please select at least one recipient or send to all';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submission attempted');
    
    if (validate()) {
      console.log('Form validation passed, submitting notification');
      
      // Set our submission tracking flag
      hasSubmitted.current = true;
      
      // Show loading indicator or disable the submit button
      setIsSubmitting(true);
      
      // Make sure we're not in the initial mount state
      isInitialMount.current = false;
      
      // Create the notification data
      const notificationData = {
        sender: user._id,
        title: formData.title,
        message: formData.message,
        isImportant: formData.isImportant,
        targetRole: formData.filterByRole,
      };
      
      // Handle different recipient selection methods - simplified
      if (formData.sendToAll) {
        // Send to all users (possibly filtered by role)
        notificationData.sendToAll = true;
        // Class filtering will be applied in backend for teachers
      } else {
        // Send to specific recipients (multiple selection supported)
        notificationData.recipients = formData.recipients;
      }
      
      console.log('Dispatching createNotification with data:', notificationData);
      
      // First ensure any previous notification state is reset
      dispatch(reset());
      
      // Then dispatch the new notification
      dispatch(createNotification(notificationData))
        .unwrap()
        .then((result) => {
          console.log('Notification created successfully:', result);
          // Success handling is done in the useEffect
        })
        .catch((error) => {
          console.error('Failed to create notification:', error);
          toast.error(`Failed to send notification: ${error.message || 'Unknown error'}`);
          hasSubmitted.current = false;
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    } else {
      console.log('Form validation failed');
    }
  };
  
  const handleBack = () => {
    navigate('/app/teacher/notifications');
  };
  
  // Display loading state while fetching users data
  if (isUsersLoading) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back to Notifications
        </Button>
        <LoadingState message="Loading users data..." />
      </Box>
    );
  }

  // Display error state if there's an error loading users
  if (isError && !isSubmitting) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back to Notifications
        </Button>
        <ErrorState 
          message={`Failed to load data: ${message || 'Unknown error'}`}
          onRetry={() => dispatch(getUsersByRole(formData.filterByRole))}
          retryText="Retry Loading"
        />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleBack}
        sx={{ mb: 2 }}
      >
        Back to Notifications
      </Button>
      
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <NotificationsIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Create New Notification
          </Typography>
        </Box>
        
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Send To All Switch */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.sendToAll}
                    onChange={handleSwitchChange}
                    name="sendToAll"
                    color="primary"
                  />
                }
                label="Send to all recipients"
              />
            </Grid>
            
            {/* Important Notification Switch */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isImportant}
                    onChange={handleSwitchChange}
                    name="isImportant"
                    color="error"
                  />
                }
                label="Mark as important notification"
              />
            </Grid>
            
            {/* Role Filter - Always visible */}
            <Grid item xs={12} md={6}>
                {/* For teachers, restrict sending to students only */}
                {user.role === 'teacher' ? (
                  <Box sx={{ my: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                    <Typography variant="body2">
                      <strong>Note:</strong> As a teacher, you can only send notifications to students.
                    </Typography>
                  </Box>
                ) : (
                  <FormControl fullWidth>
                    <InputLabel>Target Role</InputLabel>
                    <Select
                      name="filterByRole"
                      value={formData.filterByRole}
                      label="Target Role"
                      onChange={handleChange}
                    >
                      <MenuItem value="all">All Users</MenuItem>
                      <MenuItem value="student">Students Only</MenuItem>
                      <MenuItem value="teacher">Teachers Only</MenuItem>
                      {user.role === 'admin' && (
                        <MenuItem value="admin">Admins Only</MenuItem>
                      )}
                    </Select>
                    <FormHelperText>Select which type of users should receive this notification</FormHelperText>
                  </FormControl>
                )}
            </Grid>
            
            {/* Use Advanced Filters Switch */}
            {!formData.sendToAll && (
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.useFilters}
                      onChange={handleSwitchChange}
                      name="useFilters"
                      color="primary"
                    />
                  }
                  label="Use advanced filtering"
                />
                <FormHelperText>Filter recipients by school, direction, and subject</FormHelperText>
              </Grid>
            )}
            
            {/* Multiple Recipients Selection - Only show if NOT sending to all AND NOT using filters */}
            {!formData.sendToAll && !formData.useFilters && (
              <Grid item xs={12}>
                <FormControl 
                  fullWidth 
                  error={!!formErrors.recipients}
                >
                  <InputLabel id="recipients-label">Recipients *</InputLabel>
                  <Select
                    labelId="recipients-label"
                    id="recipients"
                    multiple
                    value={formData.recipients}
                    label="Recipients *"
                    onChange={handleRecipientsChange}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const selectedUser = availableUsers.find(user => user._id === value);
                          return (
                            <Chip 
                              key={value} 
                              label={selectedUser?.name || value} 
                              size="small" 
                            />
                          );
                        })}
                      </Box>
                    )}
                    MenuProps={{
                      PaperProps: {
                        style: { maxHeight: 300 },
                      },
                    }}
                  >
                    {isUsersLoading ? (
                      <MenuItem disabled>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Loading users...
                        </Box>
                      </MenuItem>
                    ) : availableUsers.length > 0 ? (
                      availableUsers.map((user) => (
                        <MenuItem key={user._id} value={user._id}>
                          <Checkbox checked={formData.recipients.indexOf(user._id) > -1} />
                          <ListItemText primary={user.name} secondary={user.email} />
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No users available for this role</MenuItem>
                    )}
                  </Select>
                  <FormHelperText>
                    {formErrors.recipients || 
                    (isUsersLoading ? `Loading ${formData.filterByRole}s...` : 
                      availableUsers.length === 0 ? `No ${formData.filterByRole}s available` :
                      `Select one or more ${formData.filterByRole}s to send the notification to`)}
                  </FormHelperText>
                </FormControl>
              </Grid>
            )}
            
            {/* Advanced Filtering Options */}
            {!formData.sendToAll && formData.useFilters && (
              <>
                {/* Filter by Schools */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Filter by Schools
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={() => handleSelectAll('selectedSchools', schools)}
                      disabled={isSchoolsLoading || !schools || schools.length === 0}
                    >
                      Select All
                    </Button>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={() => handleClearSelection('selectedSchools')}
                      disabled={formData.selectedSchools.length === 0}
                    >
                      Clear
                    </Button>
                  </Box>
                  <FormControl 
                    fullWidth
                    error={!!formErrors.selectedSchools}
                  >
                    <InputLabel>Schools</InputLabel>
                    <Select
                      multiple
                      name="selectedSchools"
                      value={formData.selectedSchools}
                      onChange={handleMultiSelectChange}
                      input={<OutlinedInput label="Schools" />}
                      disabled={isSchoolsLoading}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => {
                            const school = schools?.find(s => s._id === value);
                            return (
                              <Chip key={value} label={school ? school.name : value} />
                            );
                          })}
                        </Box>
                      )}
                    >
                      {isSchoolsLoading ? (
                        <MenuItem disabled>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Loading schools...
                        </MenuItem>
                      ) : schools && schools.length > 0 ? (
                        schools.map((school) => (
                          <MenuItem key={school._id} value={school._id}>
                            <Checkbox checked={formData.selectedSchools.indexOf(school._id) > -1} />
                            <ListItemText primary={school.name} />
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>No schools available</MenuItem>
                      )}
                    </Select>
                    <FormHelperText>
                      {formErrors.selectedSchools || 'Select schools to filter recipients'}
                    </FormHelperText>
                  </FormControl>
                </Grid>
                
                {/* Filter by Directions */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Filter by Directions
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={() => handleSelectAll('selectedDirections', directions)}
                      disabled={isDirectionsLoading || !directions || directions.length === 0}
                    >
                      Select All
                    </Button>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={() => handleClearSelection('selectedDirections')}
                      disabled={formData.selectedDirections.length === 0}
                    >
                      Clear
                    </Button>
                  </Box>
                  <FormControl 
                    fullWidth
                    error={!!formErrors.selectedDirections}
                  >
                    <InputLabel>Directions</InputLabel>
                    <Select
                      multiple
                      name="selectedDirections"
                      value={formData.selectedDirections}
                      onChange={handleMultiSelectChange}
                      input={<OutlinedInput label="Directions" />}
                      disabled={isDirectionsLoading}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => {
                            const direction = directions?.find(d => d._id === value);
                            return (
                              <Chip key={value} label={direction ? direction.name : value} />
                            );
                          })}
                        </Box>
                      )}
                    >
                      {isDirectionsLoading ? (
                        <MenuItem disabled>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Loading directions...
                        </MenuItem>
                      ) : directions && directions.length > 0 ? (
                        directions.map((direction) => (
                          <MenuItem key={direction._id} value={direction._id}>
                            <Checkbox checked={formData.selectedDirections.indexOf(direction._id) > -1} />
                            <ListItemText primary={direction.name} />
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>No directions available</MenuItem>
                      )}
                    </Select>
                    <FormHelperText>
                      {formErrors.selectedDirections || 'Select directions to filter recipients'}
                    </FormHelperText>
                  </FormControl>
                </Grid>
                
                {/* Filter by Subjects */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Filter by Subjects
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={() => handleSelectAll('selectedSubjects', filteredSubjects)}
                      disabled={isSubjectsLoading || !filteredSubjects || filteredSubjects.length === 0}
                    >
                      Select All
                    </Button>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={() => handleClearSelection('selectedSubjects')}
                      disabled={formData.selectedSubjects.length === 0}
                    >
                      Clear
                    </Button>
                  </Box>
                  <FormControl 
                    fullWidth
                    error={!!formErrors.selectedSubjects}
                  >
                    <InputLabel>Subjects</InputLabel>
                    <Select
                      multiple
                      name="selectedSubjects"
                      value={formData.selectedSubjects}
                      onChange={handleMultiSelectChange}
                      input={<OutlinedInput label="Subjects" />}
                      disabled={isSubjectsLoading}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => {
                            const subject = subjects?.find(s => s._id === value);
                            return (
                              <Chip key={value} label={subject ? subject.name : value} />
                            );
                          })}
                        </Box>
                      )}
                    >
                      {isSubjectsLoading ? (
                        <MenuItem disabled>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Loading subjects...
                        </MenuItem>
                      ) : filteredSubjects && filteredSubjects.length > 0 ? (
                        filteredSubjects.map((subject) => (
                          <MenuItem key={subject._id} value={subject._id}>
                            <Checkbox checked={formData.selectedSubjects.indexOf(subject._id) > -1} />
                            <ListItemText 
                              primary={subject.name} 
                              secondary={
                                subject.directions && subject.directions.length > 0 ?
                                subject.directions.map(dir => {
                                  if (typeof dir === 'object' && dir.name) {
                                    return dir.name;
                                  } else {
                                    const dirObj = directions?.find(d => d._id === dir);
                                    return dirObj ? dirObj.name : '';
                                  }
                                }).filter(Boolean).join(', ') : ''
                              }
                            />
                          </MenuItem>
                        ))
                      ) : formData.selectedDirections && formData.selectedDirections.length > 0 ? (
                        <MenuItem disabled>No subjects found for selected directions</MenuItem>
                      ) : (
                        <MenuItem disabled>No subjects available</MenuItem>
                      )}
                    </Select>
                    <FormHelperText>
                      {formErrors.selectedSubjects || 'Select subjects to filter recipients'}
                    </FormHelperText>
                  </FormControl>
                </Grid>
                
                {/* Filter Error Message */}
                {formErrors.filters && (
                  <Grid item xs={12}>
                    <Typography color="error">{formErrors.filters}</Typography>
                  </Grid>
                )}
              </>
            )}

            {/* Title Field */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title *"
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={!!formErrors.title}
                helperText={formErrors.title || 'Enter a descriptive title for your notification'}
                inputProps={{ maxLength: 100 }}
              />
            </Grid>
            
            {/* Message Field */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Message *"
                name="message"
                value={formData.message}
                onChange={handleChange}
                multiline
                rows={6}
                error={!!formErrors.message}
                helperText={
                  formErrors.message || 
                  `${formData.message.length}/1000 characters. Enter your notification message.`
                }
                inputProps={{ maxLength: 1000 }}
              />
            </Grid>
            
            {/* Submit Button */}
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                startIcon={isSubmitting ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
                sx={{ mt: 3 }}
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? 'Sending...' : 'Send Notification'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default CreateNotification;
