import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  FormHelperText, 
  Grid, 
  Switch, 
  FormControlLabel, 
  Typography, 
  IconButton,
  Chip,
  Box,
  Autocomplete,
  CircularProgress,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  EventNote as EventNoteIcon
} from '@mui/icons-material';
import { createEvent, updateEvent, deleteEvent, reset } from '../../features/events/eventSlice';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { getUsers } from '../../features/users/userSlice';
import { getSchools } from '../../features/schools/schoolSlice';
import { getDirections } from '../../features/directions/directionSlice';

const CalendarEventDialog = ({ open, onClose, event, date, canEdit }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useDispatch();
  
  const { user } = useSelector((state) => state.auth);
  const { users } = useSelector((state) => state.users);
  const { schools } = useSelector((state) => state.schools);
  const { directions } = useSelector((state) => state.directions);
  const { isLoading, isSuccess, isError, message } = useSelector((state) => state.events);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    allDay: true,
    color: '#1976d2',
    audience: {
      targetType: 'specific',
      specificUsers: [],
      schools: [],
      directions: []
    },
    tags: []
  });
  
  const [errors, setErrors] = useState({});
  const [tag, setTag] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  
  // Reset form when dialog opens or when event changes
  useEffect(() => {
    if (open) {
      if (event) {
        // Editing existing event
        setFormData({
          title: event.title || '',
          description: event.description || '',
          startDate: event.startDate ? format(new Date(event.startDate), "yyyy-MM-dd'T'HH:mm") : '',
          endDate: event.endDate ? format(new Date(event.endDate), "yyyy-MM-dd'T'HH:mm") : '',
          allDay: event.allDay !== undefined ? event.allDay : true,
          color: event.color || '#1976d2',
          audience: {
            targetType: event.audience?.targetType || 'specific',
            specificUsers: event.audience?.specificUsers || [],
            schools: event.audience?.schools || [],
            directions: event.audience?.directions || []
          },
          tags: event.tags || []
        });
      } else if (date) {
        // Creating new event with pre-selected date
        setFormData({
          ...formData,
          startDate: format(date, "yyyy-MM-dd'T'HH:mm"),
          endDate: format(date, "yyyy-MM-dd'T'HH:mm")
        });
      }
      
      // Load users, schools, and directions for audience selection
      dispatch(getUsers());
      dispatch(getSchools());
      dispatch(getDirections());
    }
    
    // Reset form errors
    setErrors({});
    setDeleteConfirm(false);
    
    // eslint-disable-next-line
  }, [open, event, date, dispatch]);
  
  // Handle successful event creation/update
  useEffect(() => {
    if (isSuccess) {
      // Reset state and close dialog
      dispatch(reset());
      onClose();
      
      // Only show success message if the user has edit permissions
      if (userCanEdit()) {
        const action = event ? 'updated' : 'created';
        toast.success(`Event ${action} successfully`);
      }
    }
    
    // Handle errors
    if (isError) {
      // Only show error messages to users who can edit
      if (userCanEdit()) {
        toast.error(message);
      }
      dispatch(reset());
    }
  }, [isSuccess, isError, message, dispatch, onClose, event]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else if (name.startsWith('audience.')) {
      // Handle audience fields
      const field = name.split('.')[1];
      setFormData({ 
        ...formData, 
        audience: { 
          ...formData.audience, 
          [field]: value 
        } 
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };
  
  // Handle audience selection changes for multi-select fields
  const handleAudienceChange = (field, value) => {
    setFormData({
      ...formData,
      audience: {
        ...formData.audience,
        [field]: value
      }
    });
  };
  
  // Add a new tag
  const handleAddTag = () => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag]
      });
      setTag('');
    }
  };
  
  // Remove a tag
  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tagToRemove)
    });
  };
  
  // Validate the form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    
    if (!formData.audience.targetType) {
      newErrors['audience.targetType'] = 'Target audience is required';
    }
    
    // If audience is specific, require at least one selection
    if (formData.audience.targetType === 'specific' &&
        formData.audience.specificUsers.length === 0 &&
        formData.audience.schools.length === 0 &&
        formData.audience.directions.length === 0) {
      newErrors.specificAudience = 'Please select at least one user, school, or direction';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }
    
    if (event) {
      // Update existing event
      dispatch(updateEvent({
        id: event._id,
        eventData: formData
      }));
    } else {
      // Create new event
      dispatch(createEvent(formData));
    }
  };
  
  // Handle event deletion
  const handleDelete = () => {
    if (deleteConfirm && event) {
      dispatch(deleteEvent(event._id));
      onClose();
      toast.success('Event deleted successfully');
    } else {
      setDeleteConfirm(true);
    }
  };
  
  // Get valid audience options based on user role
  const getValidAudienceOptions = () => {
    if (user.role === 'superadmin') {
      return ['all', 'admins', 'teachers', 'students', 'specific'];
    } else if (user.role === 'admin' || user.role === 'secretary') {
      return ['teachers', 'students', 'specific'];
    } else if (user.role === 'teacher') {
      return ['students', 'specific'];
    } else {
      return ['specific'];
    }
  };
  
  // Determine if user can edit this event
  const userCanEdit = () => {
    if (!canEdit) return false;
    
    if (!event) return true; // New event
    
    // Check if user is creator or admin/superadmin
    return (
      user.role === 'superadmin' ||
      (event.creator && event.creator._id === user._id) ||
      (user.role === 'admin' && event.schoolId === user.schoolId)
    );
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <EventNoteIcon sx={{ mr: 1 }} />
          {event ? 'Edit Event' : 'Create New Event'}
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* Basic event details */}
          <Grid item xs={12}>
            <TextField
              name="title"
              label="Event Title *"
              value={formData.title}
              onChange={handleChange}
              fullWidth
              error={!!errors.title}
              helperText={errors.title}
              disabled={isLoading || !userCanEdit()}
              autoFocus
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
              disabled={isLoading || !userCanEdit()}
            />
          </Grid>
          
          {/* Date and time selection */}
          <Grid item xs={12} sm={6}>
            <TextField
              name="startDate"
              label="Start Date and Time *"
              type="datetime-local"
              value={formData.startDate}
              onChange={handleChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
              error={!!errors.startDate}
              helperText={errors.startDate}
              disabled={isLoading || !userCanEdit()}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              name="endDate"
              label="End Date and Time"
              type="datetime-local"
              value={formData.endDate}
              onChange={handleChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
              disabled={isLoading || !userCanEdit() || formData.allDay}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  name="allDay"
                  checked={formData.allDay}
                  onChange={handleChange}
                  disabled={isLoading || !userCanEdit()}
                />
              }
              label="All Day Event"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" gutterBottom>
              Event Color
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: formData.color,
                  border: '2px solid #ccc',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  display: 'inline-block',
                  mr: 2
                }}
              />
              <TextField
                name="color"
                type="color"
                value={formData.color}
                onChange={handleChange}
                disabled={isLoading || !userCanEdit()}
                sx={{
                  width: 150,
                  '& input': { cursor: 'pointer', height: 40 },
                  '& .MuiOutlinedInput-root': {
                    paddingLeft: 1
                  }
                }}
                variant="outlined"
                size="small"
              />
            </Box>
          </Grid>
          
          {/* Audience selection */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Target Audience *
            </Typography>
            
            <FormControl 
              fullWidth 
              error={!!errors['audience.targetType']}
              sx={{ mb: 2 }}
            >
              <InputLabel id="audience-type-label">Audience Type</InputLabel>
              <Select
                labelId="audience-type-label"
                name="audience.targetType"
                value={formData.audience.targetType}
                onChange={handleChange}
                disabled={isLoading || !userCanEdit()}
              >
                {getValidAudienceOptions().map(option => (
                  <MenuItem key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </MenuItem>
                ))}
              </Select>
              {errors['audience.targetType'] && (
                <FormHelperText>{errors['audience.targetType']}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          
          {/* Specific audience selection (when targetType is 'specific') */}
          {formData.audience.targetType === 'specific' && (
            <>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  multiple
                  options={schools || []}
                  getOptionLabel={(option) => option.name}
                  value={(schools || []).filter(s => 
                    formData.audience.schools.includes(s._id)
                  )}
                  onChange={(e, newValue) => {
                    // When schools change, update the schools array and reset users
                    handleAudienceChange('schools', newValue.map(v => v._id));
                    
                    // If changing schools, you might want to reset selected users
                    if (formData.audience.specificUsers.length > 0) {
                      handleAudienceChange('specificUsers', []);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Step 1: Select Schools"
                      placeholder="Select schools first"
                    />
                  )}
                  disabled={isLoading || !userCanEdit()}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Autocomplete
                  multiple
                  options={directions || []}
                  getOptionLabel={(option) => option.name}
                  value={(directions || []).filter(d => 
                    formData.audience.directions.includes(d._id)
                  )}
                  onChange={(e, newValue) => {
                    // When directions change, update the directions array and reset users
                    handleAudienceChange('directions', newValue.map(v => v._id));
                    
                    // If changing directions, you might want to reset selected users
                    if (formData.audience.specificUsers.length > 0) {
                      handleAudienceChange('specificUsers', []);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Step 2: Select Directions"
                      placeholder="Select directions"
                    />
                  )}
                  disabled={isLoading || !userCanEdit()}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  options={(users || []).filter(user => {
                    // If no schools or directions selected, show all users
                    if (formData.audience.schools.length === 0 && formData.audience.directions.length === 0) {
                      return true;
                    }
                    
                    // Filter users based on selected schools
                    const matchesSchool = formData.audience.schools.length === 0 || 
                      (user.schools && user.schools.some(schoolId => 
                        formData.audience.schools.includes(schoolId)));
                    
                    // Filter users based on selected directions
                    const matchesDirection = formData.audience.directions.length === 0 || 
                      (user.directions && user.directions.some(directionId => 
                        formData.audience.directions.includes(directionId)));
                    
                    return matchesSchool && matchesDirection;
                  })}
                  getOptionLabel={(option) => `${option.name} (${option.role})`}
                  value={(users || []).filter(u => 
                    formData.audience.specificUsers.includes(u._id)
                  )}
                  onChange={(e, newValue) => {
                    handleAudienceChange('specificUsers', newValue.map(v => v._id));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Step 3: Select Users"
                      placeholder="Select specific users"
                      helperText={formData.audience.schools.length > 0 || formData.audience.directions.length > 0 ? 
                        "Showing users filtered by selected schools/directions" : 
                        "Select schools/directions first to filter users"}
                    />
                  )}
                  disabled={isLoading || !userCanEdit()}
                  renderOption={(props, option) => (
                    <li {...props}>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body1">{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.role.charAt(0).toUpperCase() + option.role.slice(1)}
                          {option.schools && option.schools.length > 0 && 
                            ` • ${(schools || []).filter(s => option.schools.includes(s._id)).map(s => s.name).join(', ')}`}
                        </Typography>
                      </Box>
                    </li>
                  )}
                />
              </Grid>
              
              {errors.specificAudience && (
                <Grid item xs={12}>
                  <FormHelperText error>{errors.specificAudience}</FormHelperText>
                </Grid>
              )}
            </>
          )}
          
          {/* Tags */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Tags
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TextField
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                label="Add Tag"
                variant="outlined"
                size="small"
                disabled={isLoading || !userCanEdit()}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                sx={{ mr: 1 }}
              />
              <Button 
                onClick={handleAddTag}
                variant="outlined"
                disabled={!tag || isLoading || !userCanEdit()}
              >
                Add
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formData.tags.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  onDelete={userCanEdit() ? () => handleRemoveTag(t) : undefined}
                  disabled={isLoading || !userCanEdit()}
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        {event && userCanEdit() ? (
          <Button
            onClick={handleDelete}
            color="error"
            startIcon={<DeleteIcon />}
            disabled={isLoading}
          >
            {deleteConfirm ? 'Confirm Delete' : 'Delete'}
          </Button>
        ) : (
          <Box /> // Empty box for spacing
        )}
        
        <Box>
          <Button onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          
          {userCanEdit() && (
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
              disabled={isLoading}
              sx={{ ml: 1 }}
            >
              {event ? 'Update' : 'Create'}
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default CalendarEventDialog;
