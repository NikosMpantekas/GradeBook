import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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
  Switch,
  FormControlLabel,
  Chip,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

import { getUserById, updateUser, reset } from '../../features/users/userSlice';
import { getSchools } from '../../features/schools/schoolSlice';
import { getDirections } from '../../features/directions/directionSlice';
import { getSubjects } from '../../features/subjects/subjectSlice';

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get user state from Redux
  const { isLoading: userLoading, isError: userError, message: userMessage } = useSelector((state) => state.users);
  
  // Create refs to track component state
  const initialMount = React.useRef(true);
  const hasSubmitted = React.useRef(false);
  const dataLoaded = React.useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [userData, setUserData] = useState(null);
  
  // Add state for schools, directions, and subjects
  const [schools, setSchools] = useState([]);
  const [directions, setDirections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [directionsLoading, setDirectionsLoading] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    school: '',
    direction: '',
    subjects: [],
    changePassword: false,
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  
  // Fetch schools, directions, and subjects data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch schools
        setSchoolsLoading(true);
        const schoolsData = await dispatch(getSchools()).unwrap();
        setSchools(schoolsData);
        setSchoolsLoading(false);
        
        // Fetch directions
        setDirectionsLoading(true);
        const directionsData = await dispatch(getDirections()).unwrap();
        setDirections(directionsData);
        setDirectionsLoading(false);
        
        // Fetch subjects
        setSubjectsLoading(true);
        const subjectsData = await dispatch(getSubjects()).unwrap();
        setSubjects(subjectsData);
        setSubjectsLoading(false);
      } catch (error) {
        console.error('Failed to fetch reference data:', error);
        toast.error('Failed to load some reference data. Please refresh the page.');
      }
    };
    
    fetchData();
  }, [dispatch]);

  // Initialize filtered subjects when subjects change
  useEffect(() => {
    // Initialize with all subjects if no direction selected
    if (!formData.direction) {
      setFilteredSubjects(subjects);
      return;
    }
    
    // Filter based on selected direction
    const directionSubjects = subjects.filter(subject => 
      subject.directions && (
        (Array.isArray(subject.directions) && subject.directions.includes(formData.direction)) ||
        (Array.isArray(subject.directions) && subject.directions.some(d => 
          (typeof d === 'object' && d._id === formData.direction) || d === formData.direction
        ))
      )
    );
    setFilteredSubjects(directionSubjects);
  }, [subjects, formData.direction]);

  // Fetch user data on component mount
  useEffect(() => {
    console.log('EditUser: Fetching user data for ID:', id);
    setIsLoading(true);
    setIsError(false);
    
    // Reset any previous state
    dispatch(reset());
    
    // Get user data from API
    dispatch(getUserById(id))
      .unwrap()
      .then(response => {
        console.log('EditUser: User data retrieved successfully', response);
        if (response && response._id) {
          setUserData(response);
          setFormData({
            ...formData,
            name: response.name || '',
            email: response.email || '',
            role: response.role || '',
            school: response.school?._id || response.school || '',
            direction: response.direction?._id || response.direction || '',
            subjects: response.subjects?.map(subj => typeof subj === 'object' ? subj._id : subj) || [],
            changePassword: false,
            password: '',
            confirmPassword: '',
          });
          dataLoaded.current = true;
        } else {
          console.error('EditUser: Invalid user data received', response);
          setIsError(true);
          setErrorMessage('Invalid user data received');
        }
      })
      .catch(error => {
        console.error('EditUser: Failed to retrieve user data', error);
        setIsError(true);
        setErrorMessage(error?.message || 'User not found');
        toast.error('Failed to load user data: ' + (error?.message || 'User not found'));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id, dispatch]);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Reset errors when field is changed
    setFormErrors({
      ...formErrors,
      [name]: '',
    });

    if (name === 'changePassword') {
      setFormData({
        ...formData,
        changePassword: checked,
      });
    } else if (name === 'subjects') {
      // Handle multi-select for subjects
      setFormData({
        ...formData,
        subjects: value,
      });
    } else if (name === 'direction') {
      // When direction changes, filter subjects and reset subject selection
      setFormData({
        ...formData,
        direction: value,
        subjects: [], // Clear subject selection when direction changes
      });
      
      // Filter subjects based on the selected direction
      if (value) {
        // Filter subjects that belong to this direction
        const directionSubjects = subjects.filter(subject => 
          subject.directions && (
            (Array.isArray(subject.directions) && subject.directions.includes(value)) ||
            (Array.isArray(subject.directions) && subject.directions.some(d => 
              (typeof d === 'object' && d._id === value) || d === value
            ))
          )
        );
        setFilteredSubjects(directionSubjects);
      } else {
        // If no direction selected, show all subjects
        setFilteredSubjects(subjects);
      }
    } else if (name === 'role') {
      // When role changes, reset role-specific fields if needed
      const newState = {
        ...formData,
        role: value,
      };
      
      // If changing to admin, clear school/direction/subjects
      if (value === 'admin') {
        newState.school = '';
        newState.direction = '';
        newState.subjects = [];
      }
      
      setFormData(newState);
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };
  
  const handleChangePasswordToggle = (e) => {
    // Update the formData object directly with the changePassword field
    setFormData({
      ...formData,
      changePassword: e.target.checked,
      // Clear password fields when disabling password change
      password: e.target.checked ? formData.password : '',
      confirmPassword: e.target.checked ? formData.confirmPassword : '',
    });
    
    // Clear any password-related errors when disabling
    if (!e.target.checked) {
      const updatedErrors = { ...formErrors };
      delete updatedErrors.password;
      delete updatedErrors.confirmPassword;
      setFormErrors(updatedErrors);
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
  
  const handleSubmit = (e) => {
    e.preventDefault();
    hasSubmitted.current = true;
    setIsError(false);
    
    // Validate form
    const errors = {};
    if (!formData.name) errors.name = 'Name is required';
    if (!formData.email) errors.email = 'Email is required';
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.role) errors.role = 'Role is required';
    
    // Password validation if changing password
    if (formData.changePassword) {
      if (!formData.password) errors.password = 'Password is required';
      if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
      if (!formData.confirmPassword) errors.confirmPassword = 'Please confirm your password';
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Create user data object
    const userData = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
    };
    
    // Only include password if changing it
    if (formData.changePassword && formData.password) {
      userData.password = formData.password;
    }
    
    // Include school, direction, and subjects for teachers and students
    if (formData.role === 'teacher' || formData.role === 'student') {
      // Only include if there's a value to prevent sending empty strings
      if (formData.school) userData.school = formData.school;
      if (formData.direction) userData.direction = formData.direction;
      if (formData.subjects && formData.subjects.length > 0) {
        userData.subjects = formData.subjects;
      }
    }
    
    console.log('Submitting user data:', userData);
    
    // Update user
    setIsLoading(true);
    dispatch(updateUser({ userId: id, userData }))
      .unwrap()
      .then(() => {
        toast.success('User updated successfully');
        // Redirect back to user management
        navigate('/app/admin/users');
      })
      .catch(error => {
        setIsLoading(false);
        setIsError(true);
        const errorMsg = error?.message || 'Failed to update user';
        setErrorMessage(errorMsg);
        toast.error(errorMsg);
      });
  };
  
  const handleBack = () => {
    navigate('/app/admin/users');
  };
  
  // Show loading state
  if (isLoading || userLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading user data...
        </Typography>
      </Box>
    );
  }

  // Show error state
  if (isError || userError) {
    return (
      <Box sx={{ maxWidth: '800px', mx: 'auto', mt: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back to Users
        </Button>
        
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage || userMessage || 'Failed to load user data'}
        </Alert>
        
        <Button 
          variant="contained" 
          onClick={() => dispatch(getUserById(id))} 
          startIcon={<IconButton><VisibilityIcon /></IconButton>}
        >
          Retry
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ flexGrow: 1, maxWidth: '800px', mx: 'auto' }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleBack}
        sx={{ mb: 2 }}
      >
        Back to Users
      </Button>
      
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          Edit User
        </Typography>
        
        <Divider sx={{ mb: 3 }} />
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name *"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!formErrors.name}
                helperText={formErrors.name}
                disabled={isLoading}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email *"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!formErrors.email}
                helperText={formErrors.email}
                disabled={isLoading}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth error={!!formErrors.role}>
                <InputLabel id="role-label">Role</InputLabel>
                <Select
                  labelId="role-label"
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  label="Role"
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="teacher">Teacher</MenuItem>
                  <MenuItem value="student">Student</MenuItem>
                </Select>
                <FormHelperText>{formErrors.role}</FormHelperText>
              </FormControl>
            </Grid>

            {(formData.role === 'teacher' || formData.role === 'student') && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!formErrors.school}>
                  <InputLabel id="school-label">School</InputLabel>
                  <Select
                    labelId="school-label"
                    id="school"
                    name="school"
                    value={formData.school}
                    onChange={handleChange}
                    label="School"
                    disabled={schoolsLoading}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {schoolsLoading ? (
                      <MenuItem disabled>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Loading schools...
                        </Box>
                      </MenuItem>
                    ) : (
                      schools.map((school) => (
                        <MenuItem key={school._id} value={school._id}>
                          {school.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  <FormHelperText>{formErrors.school}</FormHelperText>
                </FormControl>
              </Grid>
            )}

            {(formData.role === 'teacher' || formData.role === 'student') && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!formErrors.direction}>
                  <InputLabel id="direction-label">Direction</InputLabel>
                  <Select
                    labelId="direction-label"
                    id="direction"
                    name="direction"
                    value={formData.direction}
                    onChange={handleChange}
                    label="Direction"
                    disabled={directionsLoading}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {directionsLoading ? (
                      <MenuItem disabled>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Loading directions...
                        </Box>
                      </MenuItem>
                    ) : (
                      directions.map((direction) => (
                        <MenuItem key={direction._id} value={direction._id}>
                          {direction.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  <FormHelperText>{formErrors.direction}</FormHelperText>
                </FormControl>
              </Grid>
            )}

            {(formData.role === 'teacher' || formData.role === 'student') && (
              <Grid item xs={12}>
                <FormControl fullWidth error={!!formErrors.subjects}>
                  <InputLabel id="subjects-label">Subjects</InputLabel>
                  <Select
                    labelId="subjects-label"
                    id="subjects"
                    name="subjects"
                    multiple
                    value={formData.subjects || []}
                    onChange={handleChange}
                    label="Subjects"
                    disabled={subjectsLoading}
                    renderValue={(selected) => {
                      const selectedSubjects = subjects.filter(subject => 
                        selected.includes(subject._id)
                      );
                      return (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selectedSubjects.map((subject) => (
                            <Chip key={subject._id} label={subject.name} />
                          ))}
                        </Box>
                      );
                    }}
                  >
                    {subjectsLoading ? (
                      <MenuItem disabled>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Loading subjects...
                        </Box>
                      </MenuItem>
                    ) : filteredSubjects.length > 0 ? (
                      filteredSubjects.map((subject) => (
                        <MenuItem key={subject._id} value={subject._id}>
                          {subject.name}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>
                        <em>No subjects available for this direction</em>
                      </MenuItem>
                    )}
                  </Select>
                  <FormHelperText>{formErrors.subjects}</FormHelperText>
                </FormControl>
              </Grid>
            )}
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.changePassword}
                    onChange={handleChangePasswordToggle}
                    name="changePassword"
                    color="primary"
                    disabled={isLoading}
                  />
                }
                label="Change Password"
              />
            </Grid>
            
            {formData.changePassword && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="New Password *"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    error={!!formErrors.password}
                    helperText={formErrors.password}
                    disabled={isLoading}
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
                      ),
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
                    helperText={formErrors.confirmPassword}
                    disabled={isLoading}
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
                      ),
                    }}
                  />
                </Grid>
              </>
            )}
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button 
                  type="button"
                  onClick={handleBack}
                  sx={{ mr: 2 }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  variant="contained" 
                  color="primary"
                  startIcon={<SaveIcon />}
                  disabled={isLoading}
                >
                  Save Changes
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default EditUser;
