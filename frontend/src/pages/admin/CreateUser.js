import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  FormHelperText,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Chip,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { createUser, reset } from '../../features/users/userSlice';
import axios from 'axios';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

const CreateUser = (props) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((state) => state.auth);
  const { isLoading, isError, isSuccess, message } = useSelector((state) => state.users);
  
  // Check if secretary restriction is enabled from URL parameter
  const [restrictSecretary, setRestrictSecretary] = useState(false);
  
  useEffect(() => {
    // Check URL parameters to see if secretary role creation should be restricted
    const queryParams = new URLSearchParams(window.location.search);
    const restrictParam = queryParams.get('restrictSecretary');
    if (restrictParam === 'true' || currentUser?.role === 'secretary') {
      setRestrictSecretary(true);
    }
  }, [currentUser]);

  // Additional state for loading schools, directions, and subjects
  const [loadingOptions, setLoadingOptions] = useState({
    schools: false,
    directions: false,
    subjects: false,
  });
  const [optionsData, setOptionsData] = useState({
    schools: [],
    directions: [],
    subjects: [],
  });
  const [optionsError, setOptionsError] = useState({
    schools: null,
    directions: null,
    subjects: null,
  });

  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '', // This is now the User ID / login email
    mobilePhone: '', // Optional field for mobile phone
    personalEmail: '', // Optional field for personal email
    password: '',
    confirmPassword: '',
    role: '',
    school: '', // For students
    schools: [], // For teachers (multiple schools)
    direction: '', // For students
    directions: [], // For teachers (multiple directions)
    subjects: [],
    // Teacher permission flags - default to true for backward compatibility
    canSendNotifications: true,
    canAddGradeDescriptions: true,
    // Secretary permission flags - all default to false
    secretaryPermissions: {
      canManageGrades: false,
      canSendNotifications: false,
      canManageUsers: false,
      canManageSchools: false,
      canManageDirections: false,
      canManageSubjects: false,
      canAccessStudentProgress: false,
    },
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    mobilePhone: '',
    personalEmail: '',
    password: '',
    confirmPassword: '',
    role: '',
    school: '',
    schools: '',
    direction: '',
    directions: '',
    subjects: '',
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`[CreateUser] Field changed: ${name} = ${Array.isArray(value) ? `Array(${value.length})` : value}`);
    
    // Clear the error for this field when it's modified
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
    
    // Special handling for different fields
    if (name === 'role') {
      // Reset school, direction, and subjects when role changes
      const newState = {
        ...formData,
        [name]: value,
      };
      
      // If changing to admin, clear school/direction/subjects
      if (value === 'admin') {
        newState.school = '';
        newState.direction = '';
        newState.subjects = [];
      }
      
      // If changing to secretary, clear student-specific fields
      if (value === 'secretary') {
        newState.school = '';
        newState.direction = '';
      }
      
      setFormData(newState);
    } else if (name === 'direction') {
      console.log(`[CreateUser] Direction changed to: ${value}`);
      // When direction changes for a student, fetch subjects for that direction
      setFormData({
        ...formData,
        [name]: value,
        // Reset subjects when direction changes
        subjects: []
      });
      
      // Fetch subjects for this direction if a valid direction is selected
      if (value && value !== '') {
        console.log(`[CreateUser] Fetching subjects for direction: ${value}`);
        fetchSubjects(value);
      } else {
        // If no direction is selected, fetch all subjects
        console.log('[CreateUser] No direction selected, fetching all subjects');
        fetchSubjects();
      }
    } else if (name === 'directions') {
      console.log(`[CreateUser] Directions (multiple) changed to:`, value);
      // When directions change for a teacher, update the form and potentially fetch subjects
      setFormData({
        ...formData,
        [name]: value,
      });
      
      // If exactly one direction is selected, fetch subjects for that direction
      if (Array.isArray(value) && value.length === 1) {
        console.log(`[CreateUser] Single direction selected in multi-select, fetching subjects for: ${value[0]}`);
        fetchSubjects(value[0]);
      } else if (Array.isArray(value) && value.length > 1) {
        // If multiple directions are selected, fetch all subjects
        console.log(`[CreateUser] Multiple directions selected, fetching all subjects`);
        fetchSubjects();
      }
    } else if (name === 'subjects') {
      // Handle multi-select for subjects
      setFormData({
        ...formData,
        [name]: value,
      });
    } else if (name.startsWith('secretary_')) {
      // Handle secretary permission toggles
      const permissionKey = name.replace('secretary_', '');
      setFormData({
        ...formData,
        secretaryPermissions: {
          ...formData.secretaryPermissions,
          [permissionKey]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };
  
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  
  const handleMouseDownPassword = (e) => {
    e.preventDefault();
  };
  
  // Fetch schools, directions, and subjects when component mounts
  useEffect(() => {
    // Load options for teacher, student, and secretary roles
    if (formData.role === 'teacher' || formData.role === 'student' || formData.role === 'secretary') {
      fetchSchools();
      // Use pre-loaded directions data if available, otherwise fetch it
      if (props.safeDirectionsData && props.safeDirectionsData.length > 0) {
        console.log('[CreateUser] Using pre-loaded directions data from wrapper');
        setOptionsData(prev => ({ ...prev, directions: props.safeDirectionsData }));
      } else {
        fetchDirections();
      }
      fetchSubjects();
    }
  }, [formData.role, props.safeDirectionsData]);
  
  // Functions to fetch reference data
  const fetchSchools = async () => {
    try {
      setLoadingOptions(prev => ({ ...prev, schools: true }));
      setOptionsError(prev => ({ ...prev, schools: null }));
      
      const response = await axios.get('/api/schools');
      setOptionsData(prev => ({ ...prev, schools: response.data }));
    } catch (error) {
      console.error('Error fetching schools:', error);
      setOptionsError(prev => ({
        ...prev,
        schools: 'Failed to fetch schools. Please try again.'
      }));
    } finally {
      setLoadingOptions(prev => ({ ...prev, schools: false }));
    }
  };
  
  const fetchDirections = async () => {
    try {
      setLoadingOptions(prev => ({ ...prev, directions: true }));
      setOptionsError(prev => ({ ...prev, directions: null }));
      
      const response = await axios.get('/api/directions');
      setOptionsData(prev => ({ ...prev, directions: response.data }));
    } catch (error) {
      console.error('Error fetching directions:', error);
      setOptionsError(prev => ({
        ...prev,
        directions: 'Failed to fetch directions. Please try again.'
      }));
    } finally {
      setLoadingOptions(prev => ({ ...prev, directions: false }));
    }
  };
  
  const fetchSubjects = async (directionId = null) => {
    try {
      setLoadingOptions(prev => ({ ...prev, subjects: true }));
      setOptionsError(prev => ({ ...prev, subjects: null }));
      
      // CRITICAL FIX: Add proper authorization headers
      const config = {
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
        },
      };
      
      // If a direction is selected, fetch subjects for that direction
      let url = '/api/subjects';
      if (directionId) {
        url = `/api/subjects/direction/${directionId}`;
        console.log(`[CreateUser] Fetching subjects for direction: ${directionId}`);
      } else {
        console.log('[CreateUser] Fetching all subjects');
      }
      
      const response = await axios.get(url, config);
      console.log(`[CreateUser] Subjects loaded:`, response.data);
      setOptionsData(prev => ({ ...prev, subjects: response.data }));
      
      // If we had subjects selected but changed direction, reset the selection
      if (directionId && formData.subjects && formData.subjects.length > 0) {
        // Filter out subjects that are not in the new direction
        const validSubjectIds = response.data.map(subject => subject._id);
        const filteredSubjects = formData.subjects.filter(id => validSubjectIds.includes(id));
        
        // Update form data with only valid subjects for this direction
        if (filteredSubjects.length !== formData.subjects.length) {
          console.log('[CreateUser] Resetting subject selection due to direction change');
          setFormData(prev => ({
            ...prev,
            subjects: filteredSubjects
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setOptionsError(prev => ({
        ...prev,
        subjects: 'Failed to fetch subjects. Please try again.'
      }));
    } finally {
      setLoadingOptions(prev => ({ ...prev, subjects: false }));
    }
  };
  
  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    }

    if (!formData.email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
      isValid = false;
    }

    // Validate personal email if provided
    if (formData.personalEmail && !/\S+@\S+\.\S+/.test(formData.personalEmail)) {
      errors.personalEmail = 'Personal email is invalid';
      isValid = false;
    }

    // Validate mobile phone if provided
    if (formData.mobilePhone && !/^[\d\s\-+()]+$/.test(formData.mobilePhone)) {
      errors.mobilePhone = 'Invalid phone number format';
      isValid = false;
    }

    if (formData.role === 'student' && !formData.school) {
      errors.school = 'School is required for students';
      isValid = false;
    }

    if ((formData.role === 'teacher' || formData.role === 'secretary') && formData.schools.length === 0) {
      errors.schools = 'At least one school is required';
      isValid = false;
    }

    if (formData.role === 'student' && !formData.direction) {
      errors.direction = 'Direction is required for students';
      isValid = false;
    }

    if ((formData.role === 'teacher' || formData.role === 'secretary') && formData.directions.length === 0) {
      errors.directions = 'At least one direction is required';
      isValid = false;
    }

    if ((formData.role === 'teacher' || formData.role === 'secretary') && formData.subjects.length === 0) {
      errors.subjects = 'At least one subject is required';
      isValid = false;
    }

    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // Prepare user data based on role
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        mobilePhone: formData.mobilePhone?.trim() || '',
        personalEmail: formData.personalEmail?.trim().toLowerCase() || '',
        // Include saved versions for backup
        savedMobilePhone: formData.mobilePhone?.trim() || null,
        savedPersonalEmail: formData.personalEmail?.trim().toLowerCase() || null
      };
      
      console.log('Submitting user with contact info:', {
        mobilePhone: userData.mobilePhone,
        personalEmail: userData.personalEmail,
        savedMobilePhone: userData.savedMobilePhone,
        savedPersonalEmail: userData.savedPersonalEmail
      });

      if (formData.role === 'student') {
        // For students: Include single school and direction
        userData.school = formData.school || null;
        userData.direction = formData.direction || null;
        
        // Include subjects if any (though students don't usually have subjects directly assigned)
        userData.subjects = formData.subjects && formData.subjects.length > 0 
          ? formData.subjects 
          : [];
      } else if (formData.role === 'teacher') {
        // FOR COMPATIBILITY: Use both old and new field names to ensure backward compatibility
        // This is critical to ensure the data is properly saved in the backend
        
        // Process schools array
        const schoolsArray = formData.schools && formData.schools.length > 0 ? formData.schools : [];
        
        // Set both field names to the same values for maximum compatibility
        userData.schools = schoolsArray; // New field name for the updated backend model
        userData.school = schoolsArray;  // Old field name for backward compatibility
        
        console.log('Teacher schools array being submitted:', schoolsArray);
        
        // Process directions array
        const directionsArray = formData.directions && formData.directions.length > 0 ? formData.directions : [];
        
        // Set both field names to the same values for maximum compatibility
        userData.directions = directionsArray; // New field name for the updated backend model
        userData.direction = directionsArray;  // Old field name for backward compatibility
        
        console.log('Teacher directions array being submitted:', directionsArray);
        
        // Always include subjects array
        userData.subjects = formData.subjects && formData.subjects.length > 0 
          ? formData.subjects 
          : [];
        
        // Add teacher permission fields
        userData.canSendNotifications = formData.canSendNotifications;
        userData.canAddGradeDescriptions = formData.canAddGradeDescriptions;
      } else if (formData.role === 'secretary') {
        // For secretary accounts, include the permission flags
        userData.secretaryPermissions = formData.secretaryPermissions;
        
        // Set schools and directions
        const schoolsArray = formData.schools && formData.schools.length > 0 ? formData.schools : [];
        userData.schools = schoolsArray;
        userData.school = schoolsArray; // For compatibility
        
        const directionsArray = formData.directions && formData.directions.length > 0 ? formData.directions : [];
        userData.directions = directionsArray;
        userData.direction = directionsArray; // For compatibility
        
        userData.subjects = formData.subjects && formData.subjects.length > 0 
          ? formData.subjects 
          : [];
          
        console.log('Creating secretary account with permissions:', userData.secretaryPermissions);
        console.log('Secretary schools:', schoolsArray);
        console.log('Secretary directions:', directionsArray);
      } else {
        // For admins, ensure these fields are null/empty
        userData.school = null;
        userData.direction = null;
        userData.subjects = [];
      }
      
      console.log('Submitting user data:', userData);
      
      dispatch(createUser(userData))
        .unwrap()
        .then(() => {
          toast.success('User created successfully!');
          navigate('/app/admin/users');
        })
        .catch((error) => {
          toast.error(
            error?.message ||
              'Error creating user. Please check your information and try again.'
          );
          setSubmitting(false);
        });
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitting(false);
    }
  };

  // Create refs to track component state
  const initialMount = useRef(true);
  const hasSubmitted = useRef(false);
  
  // Load schools, directions, and subjects data when component mounts
  useEffect(() => {
    const fetchSchools = async () => {
      setLoadingOptions(prev => ({ ...prev, schools: true }));
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${currentUser.token}`,
          },
        };
        const { data } = await axios.get('/api/schools', config);
        setOptionsData(prev => ({ ...prev, schools: data }));
        console.log('Schools loaded:', data);
      } catch (error) {
        const message = error.response?.data?.message || error.message || 'Failed to load schools';
        setOptionsError(prev => ({ ...prev, schools: message }));
        toast.error(`Error loading schools: ${message}`);
      } finally {
        setLoadingOptions(prev => ({ ...prev, schools: false }));
      }
    };

    const fetchDirections = async () => {
      setLoadingOptions(prev => ({ ...prev, directions: true }));
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${currentUser.token}`,
          },
        };
        const { data } = await axios.get('/api/directions', config);
        setOptionsData(prev => ({ ...prev, directions: data }));
        console.log('Directions loaded:', data);
      } catch (error) {
        const message = error.response?.data?.message || error.message || 'Failed to load directions';
        setOptionsError(prev => ({ ...prev, directions: message }));
        toast.error(`Error loading directions: ${message}`);
      } finally {
        setLoadingOptions(prev => ({ ...prev, directions: false }));
      }
    };

    const fetchSubjects = async () => {
      setLoadingOptions(prev => ({ ...prev, subjects: true }));
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${currentUser.token}`,
          },
        };
        const { data } = await axios.get('/api/subjects', config);
        setOptionsData(prev => ({ ...prev, subjects: data }));
        console.log('Subjects loaded:', data);
      } catch (error) {
        const message = error.response?.data?.message || error.message || 'Failed to load subjects';
        setOptionsError(prev => ({ ...prev, subjects: message }));
        toast.error(`Error loading subjects: ${message}`);
      } finally {
        setLoadingOptions(prev => ({ ...prev, subjects: false }));
      }
    };

    // Load all data when component mounts
    fetchSchools();
    fetchDirections();
    fetchSubjects();
  }, [currentUser]);

  // Handle API response effects
  useEffect(() => {
    // Skip effects on initial component mount to prevent false success messages
    if (initialMount.current) {
      console.log('CreateUser: Initial mount, skipping effect');
      initialMount.current = false;
      // Make sure we reset any stale state on mount
      dispatch(reset());
      return;
    }

    if (isError) {
      console.log('CreateUser: Error occurred:', message);
      toast.error(message || 'Failed to create user');
      setSubmitting(false);
      hasSubmitted.current = false;
    }
    
    if (isSuccess && hasSubmitted.current) {
      console.log('CreateUser: Success after form submission');
      toast.success('User created successfully');
      navigate('/app/admin/users');
      dispatch(reset());
      hasSubmitted.current = false;
    }
    
    return () => {
      if (isSuccess || isError) {
        dispatch(reset());
      }
    };
  }, [isError, isSuccess, message, navigate, dispatch]);

  const handleBack = () => {
    navigate('/app/admin/users');
  };
  
  // Show a loading state when submitting the form
  if (submitting) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          disabled
          sx={{ mb: 2 }}
        >
          Back to Users
        </Button>
        <LoadingState message="Creating user..." />
      </Box>
    );
  }

  // Show an error state if there's an error
  if (isError && !submitting) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back to Users
        </Button>
        <ErrorState 
          message={`Failed to create user: ${message || 'Unknown error'}`}
          onRetry={() => setFormErrors({})}
          retryText="Try Again"
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
        Back to Users
      </Button>
      
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          Create New User
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name *"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!formErrors.name}
                helperText={formErrors.name || 'Enter the user\'s full name'}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="User ID (Login Email) *"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!formErrors.email}
                helperText={formErrors.email || 'This will be the username used to log in'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {formData.school && optionsData.schools && formData.role === 'student' ? 
                        (() => {
                          const school = optionsData.schools.find(s => s._id === formData.school);
                          return school?.emailDomain ? `@${school.emailDomain}` : '';
                        })() : 
                        formData.schools && formData.schools.length > 0 && optionsData.schools && (formData.role === 'teacher' || formData.role === 'secretary') ?
                        (() => {
                          const school = optionsData.schools.find(s => s._id === formData.schools[0]);
                          return school?.emailDomain ? `@${school.emailDomain}` : '';
                        })() : ''
                      }
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Mobile Phone"
                name="mobilePhone"
                value={formData.mobilePhone}
                onChange={handleChange}
                helperText="Optional"
                inputProps={{
                  maxLength: 20,
                  pattern: '[\d\s\-+()]+'
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Personal Email"
                name="personalEmail"
                type="email"
                value={formData.personalEmail}
                onChange={handleChange}
                helperText="Optional"
                inputProps={{
                  autoComplete: 'email',
                  inputMode: 'email'
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Password *"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                error={!!formErrors.password}
                helperText={formErrors.password || 'Password must be at least 6 characters'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Confirm Password *"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!formErrors.confirmPassword}
                helperText={formErrors.confirmPassword || 'Re-enter the password to confirm'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleClickShowConfirmPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth error={!!formErrors.role}>
                <InputLabel id="role-label">Role *</InputLabel>
                <Select
                  labelId="role-label"
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  label="Role *"
                >
                  <MenuItem value="">
                    <em>Select a role</em>
                  </MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="secretary" disabled={restrictSecretary}>
                    {restrictSecretary ? "Secretary (Only admin can create)" : "Secretary"}
                  </MenuItem>
                  <MenuItem value="teacher">Teacher</MenuItem>
                  <MenuItem value="student">Student</MenuItem>
                </Select>
                {formErrors.role && (
                  <FormHelperText>{formErrors.role}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            {/* School Selection for Students (Single) */}
            {formData.role === 'student' && (
              <Grid item xs={12}>
                <FormControl fullWidth error={!!formErrors.school}>
                  <InputLabel>School *</InputLabel>
                  <Select
                    name="school"
                    value={formData.school || ''}
                    label="School *"
                    onChange={handleChange}
                    disabled={loadingOptions.schools}
                  >
                    <MenuItem value="">Select a school</MenuItem>
                    {optionsData.schools && optionsData.schools.map((school) => (
                      <MenuItem key={school._id} value={school._id}>
                        {school.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {formErrors.school || loadingOptions.schools ? 'Loading schools...' : 'Select the student\'s school'}
                  </FormHelperText>
                </FormControl>
              </Grid>
            )}
            
            {/* School Selection for Teachers and Secretaries (Multiple) */}
            {(formData.role === 'teacher' || formData.role === 'secretary') && (
              <Grid item xs={12}>
                <FormControl fullWidth error={!!formErrors.schools}>
                  <InputLabel>Schools *</InputLabel>
                  <Select
                    name="schools"
                    value={formData.schools || []}
                    label="Schools *"
                    onChange={handleChange}
                    multiple
                    disabled={loadingOptions.schools}
                    renderValue={(selected) => {
                      // Safety check for selected being an array
                      if (!Array.isArray(selected)) {
                        console.warn('[CreateUser] selected is not an array in schools renderValue:', selected);
                        return 'Invalid selection';
                      }
                      
                      // Safety check for schools data
                      if (!Array.isArray(optionsData.schools)) {
                        console.warn('[CreateUser] schools data is not an array in renderValue');
                        return selected.join(', ');
                      }
                      
                      return (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => {
                            try {
                              const school = optionsData.schools.find(s => s && s._id === value);
                              return school ? school.name : value;
                            } catch (error) {
                              console.error('[CreateUser] Error in schools renderValue:', error);
                              return value;
                            }
                          }).join(', ')}
                        </Box>
                      );
                    }}
                  >
                    {/* Safety check to ensure schools exists and is an array */}
                    {Array.isArray(optionsData.schools) ? optionsData.schools.map((school) => {
                      // Skip rendering invalid school items
                      if (!school || !school._id || !school.name) {
                        console.warn('[CreateUser] Invalid school in list:', school);
                        return null;
                      }
                      
                      // Safe check for the formData.schools array
                      const isChecked = Array.isArray(formData.schools) && 
                        formData.schools.indexOf(school._id) > -1;
                        
                      return (
                        <MenuItem key={school._id} value={school._id}>
                          <Checkbox checked={isChecked} />
                          <ListItemText primary={school.name} />
                        </MenuItem>
                      );
                    }) : (
                      // If not an array, render an empty/disabled item
                      <MenuItem disabled>
                        <ListItemText primary="No schools available" />
                      </MenuItem>
                    )}
                  </Select>
                  <FormHelperText>
                    {formErrors.schools || loadingOptions.schools ? 'Loading schools...' : 'Select schools for this teacher'}
                  </FormHelperText>
                </FormControl>
              </Grid>
            )}
            
            {/* Direction Selection for Students (Single) */}
            {formData.role === 'student' && (
              <Grid item xs={12}>
                <FormControl fullWidth error={!!formErrors.direction}>
                  <InputLabel>Direction *</InputLabel>
                  <Select
                    name="direction"
                    value={formData.direction || ''}
                    label="Direction *"
                    onChange={handleChange}
                    disabled={loadingOptions.directions}
                  >
                    <MenuItem value="">Select a direction</MenuItem>
                    {optionsData.directions && optionsData.directions.map((direction) => (
                      <MenuItem key={direction._id} value={direction._id}>
                        {direction.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {formErrors.direction || loadingOptions.directions ? 'Loading directions...' : 'Select the student\'s direction'}
                  </FormHelperText>
                </FormControl>
              </Grid>
            )}
            
            {/* Direction Selection for Teachers and Secretaries (Multiple) */}
            {(formData.role === 'teacher' || formData.role === 'secretary') && (
              <Grid item xs={12}>
                <FormControl fullWidth error={!!formErrors.directions}>
                  <InputLabel>Directions *</InputLabel>
                  <Select
                    name="directions"
                    value={formData.directions || []}
                    label="Directions *"
                    onChange={handleChange}
                    multiple
                    disabled={loadingOptions.directions}
                    renderValue={(selected) => {
                      // Safety check for selected being an array
                      if (!Array.isArray(selected)) {
                        console.warn('[CreateUser] selected is not an array in directions renderValue:', selected);
                        return 'Invalid selection';
                      }
                      
                      // Safety check for directions data
                      if (!Array.isArray(optionsData.directions)) {
                        console.warn('[CreateUser] directions data is not an array in renderValue');
                        return selected.join(', ');
                      }
                      
                      return (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => {
                            try {
                              const direction = optionsData.directions.find(d => d && d._id === value);
                              return direction ? direction.name : value;
                            } catch (error) {
                              console.error('[CreateUser] Error in directions renderValue:', error);
                              return value;
                            }
                          }).join(', ')}
                        </Box>
                      );
                    }}
                  >
                    {/* Safety check to ensure directions exists and is an array */}
                    {Array.isArray(optionsData.directions) ? optionsData.directions.map((direction) => {
                      // Skip rendering invalid direction items
                      if (!direction || !direction._id || !direction.name) {
                        console.warn('[CreateUser] Invalid direction in list:', direction);
                        return null;
                      }
                      
                      // Safe check for the formData.directions array
                      const isChecked = Array.isArray(formData.directions) && 
                        formData.directions.indexOf(direction._id) > -1;
                        
                      return (
                        <MenuItem key={direction._id} value={direction._id}>
                          <Checkbox checked={isChecked} />
                          <ListItemText primary={direction.name} />
                        </MenuItem>
                      );
                    }) : (
                      // If not an array, render an empty/disabled item
                      <MenuItem disabled>
                        <ListItemText primary="No directions available" />
                      </MenuItem>
                    )}
                  </Select>
                  <FormHelperText>
                    {formErrors.directions || loadingOptions.directions ? 'Loading directions...' : 'Select directions for this teacher'}
                  </FormHelperText>
                </FormControl>
              </Grid>
            )}
            
            {/* Secretary Permissions Section */}
            {formData.role === 'secretary' && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.paper' }}>
                  <Typography variant="h6" gutterBottom>
                    Secretary Permissions
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Configure which administrative functions this secretary account can access.
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.secretaryPermissions.canManageGrades}
                            onChange={(e) => handleChange({ target: { name: 'secretary_canManageGrades', value: e.target.checked } })}
                            color="primary"
                          />
                        }
                        label="Can view and edit grades"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.secretaryPermissions.canSendNotifications}
                            onChange={(e) => handleChange({ target: { name: 'secretary_canSendNotifications', value: e.target.checked } })}
                            color="primary"
                          />
                        }
                        label="Can send notifications"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.secretaryPermissions.canManageUsers}
                            onChange={(e) => handleChange({ target: { name: 'secretary_canManageUsers', value: e.target.checked } })}
                            color="primary"
                          />
                        }
                        label="Can manage user accounts"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.secretaryPermissions.canManageSchools}
                            onChange={(e) => handleChange({ target: { name: 'secretary_canManageSchools', value: e.target.checked } })}
                            color="primary"
                          />
                        }
                        label="Can manage schools"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.secretaryPermissions.canManageDirections}
                            onChange={(e) => handleChange({ target: { name: 'secretary_canManageDirections', value: e.target.checked } })}
                            color="primary"
                          />
                        }
                        label="Can manage directions"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.secretaryPermissions.canManageSubjects}
                            onChange={(e) => handleChange({ target: { name: 'secretary_canManageSubjects', value: e.target.checked } })}
                            color="primary"
                          />
                        }
                        label="Can manage subjects"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.secretaryPermissions.canAccessStudentProgress}
                            onChange={(e) => handleChange({ target: { name: 'secretary_canAccessStudentProgress', value: e.target.checked } })}
                            color="primary"
                          />
                        }
                        label="Can access student progress tracking"
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            )}

            {/* Multiple Subject Selection for Teachers and Students */}
            {(formData.role === 'teacher' || formData.role === 'student') && (
              <Grid item xs={12}>
                <FormControl fullWidth error={!!formErrors.subjects}>
                  <InputLabel>Subjects *</InputLabel>
                  <Select
                    name="subjects"
                    value={formData.subjects || []}
                    label="Subjects *"
                    onChange={handleChange}
                    multiple
                    disabled={loadingOptions.subjects}
                    renderValue={(selected) => {
                      // Safety check for selected being an array
                      if (!Array.isArray(selected)) {
                        console.warn('[CreateUser] selected is not an array in subjects renderValue:', selected);
                        return 'Invalid selection';
                      }
                      
                      // Safety check for subjects data
                      if (!Array.isArray(optionsData.subjects)) {
                        console.warn('[CreateUser] subjects data is not an array in renderValue');
                        return selected.join(', ');
                      }
                      
                      return (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => {
                            try {
                              const subject = optionsData.subjects.find(s => s && s._id === value);
                              return subject ? subject.name : value;
                            } catch (error) {
                              console.error('[CreateUser] Error in subjects renderValue:', error);
                              return value;
                            }
                          }).join(', ')}
                        </Box>
                      );
                    }}
                  >
                    {/* Safety check to ensure subjects exists and is an array */}
                    {Array.isArray(optionsData.subjects) ? optionsData.subjects.map((subject) => {
                      // Skip rendering invalid subject items
                      if (!subject || !subject._id || !subject.name) {
                        console.warn('[CreateUser] Invalid subject in list:', subject);
                        return null;
                      }
                      
                      // Safe check for the formData.subjects array
                      const isChecked = Array.isArray(formData.subjects) && 
                        formData.subjects.indexOf(subject._id) > -1;
                        
                      return (
                        <MenuItem key={subject._id} value={subject._id}>
                          <Checkbox checked={isChecked} />
                          <ListItemText primary={subject.name} />
                        </MenuItem>
                      );
                    }) : (
                      // If not an array, render an empty/disabled item
                      <MenuItem disabled>
                        <ListItemText primary="No subjects available" />
                      </MenuItem>
                    )}
                  </Select>
                  <FormHelperText>
                    {formErrors.subjects ? formErrors.subjects : 
                     loadingOptions.subjects ? 'Loading subjects...' : 
                     formData.role === 'student' ? 'Select subjects for this student' : 
                     'Select subjects for this teacher'}
                  </FormHelperText>
                </FormControl>
              </Grid>
            )}
            
            {/* Teacher Permission Controls */}
            {formData.role === 'teacher' && (
              <Grid item xs={12}>
                <Paper elevation={1} sx={{ p: 2, mt: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Teacher Permissions
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <FormControl component="fieldset">
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.canSendNotifications}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  canSendNotifications: e.target.checked
                                });
                              }}
                              color="primary"
                            />
                          }
                          label="Can Send Notifications"
                        />
                        <FormHelperText>Allow this teacher to send notifications to students</FormHelperText>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <FormControl component="fieldset">
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.canAddGradeDescriptions}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  canAddGradeDescriptions: e.target.checked
                                });
                              }}
                              color="primary"
                            />
                          }
                          label="Can Add Grade Descriptions"
                        />
                        <FormHelperText>Allow this teacher to add descriptions to grades</FormHelperText>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <Box sx={{ mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                  disabled={isLoading}
                  sx={{ py: 1.5, px: 4 }}
                >
                  {isLoading ? 'Creating User...' : 'Create User'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default CreateUser;
