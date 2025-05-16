import React, { useState, useEffect } from 'react';
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

const CreateUser = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isLoading, isError, isSuccess, message } = useSelector((state) => state.users);

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
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    school: '',
    direction: '',
    subjects: [],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
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
      
      setFormData(newState);
    } else if (name === 'subjects') {
      // Handle multi-select for subjects
      setFormData({
        ...formData,
        [name]: value,
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
    // Only load these options for teacher and student roles
    if (formData.role === 'teacher' || formData.role === 'student') {
      fetchSchools();
      fetchDirections();
      fetchSubjects();
    }
  }, [formData.role]);
  
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
  
  const fetchSubjects = async () => {
    try {
      setLoadingOptions(prev => ({ ...prev, subjects: true }));
      setOptionsError(prev => ({ ...prev, subjects: null }));
      
      const response = await axios.get('/api/subjects');
      setOptionsData(prev => ({ ...prev, subjects: response.data }));
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
  
  const validate = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.role) {
      errors.role = 'Role is required';
    }
    
    // Only validate school and direction fields if role is student or teacher
    if (formData.role === 'student' || formData.role === 'teacher') {
      // Schools and directions are optional, but if provided, should be valid
      if (formData.school && !optionsData.schools.some(school => school._id === formData.school)) {
        errors.school = 'Please select a valid school';
      }
      
      if (formData.direction && !optionsData.directions.some(direction => direction._id === formData.direction)) {
        errors.direction = 'Please select a valid direction';
      }
      
      // For subjects, just verify each selection is a valid subject ID if any are selected
      if (formData.subjects && formData.subjects.length > 0) {
        const validSubjectIds = optionsData.subjects.map(subject => subject._id);
        const hasInvalidSubject = formData.subjects.some(subjectId => !validSubjectIds.includes(subjectId));
        
        if (hasInvalidSubject) {
          errors.subjects = 'One or more selected subjects are invalid';
        }
      }
    }
    
    return errors;
  };
  
  // Main form submission function - called when form is submitted
  const validateAndSubmitForm = (e) => {
    e.preventDefault();
    
    const errors = validate();
    setFormErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      setSubmitting(true);
      // Mark that we've intentionally submitted the form
      hasSubmitted.current = true;
      console.log('CreateUser: Form submitted, setting hasSubmitted=true');
      
      // Base user data
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };
      
      // Add school, direction, and subjects for teachers and students
      if (formData.role === 'teacher' || formData.role === 'student') {
        // Only include non-empty values
        if (formData.school) userData.school = formData.school;
        if (formData.direction) userData.direction = formData.direction;
        if (formData.subjects && formData.subjects.length > 0) {
          userData.subjects = formData.subjects;
        }
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
    }
  };
  
  // Create a ref to track if this is the initial mount
  const initialMount = React.useRef(true);
  // Another ref to track if we've submitted the form
  const hasSubmitted = React.useRef(false);
  
  // Load schools, directions, and subjects data when component mounts
  useEffect(() => {
    const fetchSchools = async () => {
      setLoadingOptions(prev => ({ ...prev, schools: true }));
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
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
            Authorization: `Bearer ${user.token}`,
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
            Authorization: `Bearer ${user.token}`,
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
  }, [user]);

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

  // The handleSubmit function was removed to fix the duplicate function lint error
  // The functionality is now contained in validateAndSubmitForm defined earlier
  
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
        
        <Box component="form" onSubmit={validateAndSubmitForm}>
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
                label="Email Address *"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!formErrors.email}
                helperText={formErrors.email || 'Enter a valid email address'}
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
                  <MenuItem value="teacher">Teacher</MenuItem>
                  <MenuItem value="student">Student</MenuItem>
                </Select>
                {formErrors.role && (
                  <FormHelperText>{formErrors.role}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            {/* Conditional School Selection for Teachers & Students */}
            {(formData.role === 'teacher' || formData.role === 'student') && (
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
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const school = optionsData.schools.find(s => s._id === value);
                          return school ? school.name : value;
                        }).join(', ')}
                      </Box>
                    )}
                  >   
                    <MenuItem value="">Select a school</MenuItem>
                    {optionsData.schools && optionsData.schools.map((school) => (
                      <MenuItem key={school._id} value={school._id}>
                        {school.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {formErrors.school || loadingOptions.schools ? 'Loading schools...' : 'Select the user\'s school'}
                  </FormHelperText>
                </FormControl>
              </Grid>
            )}
            
            {/* Direction Selection for Students - Single Direction */}
            {formData.role === 'student' && (
              <Grid item xs={12}>
                <FormControl fullWidth error={!!formErrors.direction}>
                  <InputLabel>Direction *</InputLabel>
                  <Select
                    name="direction"
                    value={formData.direction}
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
            
            {/* Direction Selection for Teachers - Multiple Directions */}
            {formData.role === 'teacher' && (
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
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const direction = optionsData.directions.find(d => d._id === value);
                          return direction ? direction.name : value;
                        }).join(', ')}
                      </Box>
                    )}
                  >
                    <MenuItem value="">
                      <em>Select directions</em>
                    </MenuItem>
                    {optionsData.directions && optionsData.directions.map((direction) => (
                      <MenuItem key={direction._id} value={direction._id}>
                        <Checkbox checked={formData.directions && formData.directions.indexOf(direction._id) > -1} />
                        <ListItemText primary={direction.name} />
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {formErrors.directions || loadingOptions.directions ? 'Loading directions...' : 'Select the directions for this teacher'}
                  </FormHelperText>
                </FormControl>
              </Grid>
            )}
            
            {/* Multiple Subject Selection for Teachers Only */}
            {formData.role === 'teacher' && (
              <Grid item xs={12}>
                <FormControl fullWidth error={!!formErrors.subjects}>
                  <InputLabel>Subjects *</InputLabel>
                  <Select
                    name="subjects"
                    multiple
                    value={formData.subjects}
                    onChange={handleChange}
                    input={<OutlinedInput label="Subjects *" />}
                    disabled={loadingOptions.subjects}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const subject = optionsData.subjects.find(s => s._id === value);
                          return (
                            <Chip key={value} label={subject ? subject.name : value} />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {optionsData.subjects && optionsData.subjects.map((subject) => (
                      <MenuItem key={subject._id} value={subject._id}>
                        <Checkbox checked={formData.subjects.indexOf(subject._id) > -1} />
                        <ListItemText primary={subject.name} />
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>
                    {formErrors.subjects || loadingOptions.subjects ? 'Loading subjects...' : 'Select the subjects this teacher will teach'}
                  </FormHelperText>
                </FormControl>
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
