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
  Checkbox,
  ListItemText,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

import { getUserById, updateUser, reset, getUsers } from '../../features/users/userSlice';
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
  
  // Add state for schools, directions, subjects, and available users
  const [schools, setSchools] = useState([]);
  const [directions, setDirections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [directionsLoading, setDirectionsLoading] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    school: '',         // For backward compatibility
    schools: [],        // Multiple schools for teachers and students
    direction: '',      // For backward compatibility
    directions: [],     // Multiple directions for teachers
    subjects: [],
    assignedTeachers: [], // For students - which teachers they're assigned to
    assignedStudents: [], // For teachers - which students they're assigned to
    changePassword: false,
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  
  // Fetch schools, directions, subjects, and available users data
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
        
        // Fetch teachers for student assignment
        setTeachersLoading(true);
        const teachersData = await dispatch(getUsers({ role: 'teacher' })).unwrap();
        setAvailableTeachers(teachersData);
        setTeachersLoading(false);
        
        // Fetch students for teacher assignment
        setStudentsLoading(true);
        const studentsData = await dispatch(getUsers({ role: 'student' })).unwrap();
        setAvailableStudents(studentsData);
        setStudentsLoading(false);
      } catch (error) {
        console.error('Failed to fetch reference data:', error);
        toast.error('Failed to load some reference data. Please refresh the page.');
      }
    };
    
    fetchData();
  }, [dispatch]);

  // Initialize filtered subjects when subjects change
  useEffect(() => {
    // Initialize with all subjects if no directions selected
    if (!formData.directions || formData.directions.length === 0) {
      // Fallback to the legacy direction field if available
      if (formData.direction) {
        const directionSubjects = subjects.filter(subject => 
          subject.directions && (
            (Array.isArray(subject.directions) && subject.directions.includes(formData.direction)) ||
            (Array.isArray(subject.directions) && subject.directions.some(d => 
              (typeof d === 'object' && d._id === formData.direction) || d === formData.direction
            ))
          )
        );
        setFilteredSubjects(directionSubjects);
      } else {
        setFilteredSubjects(subjects);
      }
      return;
    }
    
    // Filter based on selected directions (multiple)
    const directionSubjects = subjects.filter(subject => 
      subject.directions && (
        Array.isArray(subject.directions) && subject.directions.some(d => {
          const dirId = typeof d === 'object' ? d._id : d;
          return formData.directions.includes(dirId);
        })
      )
    );
    setFilteredSubjects(directionSubjects);
  }, [subjects, formData.direction, formData.directions]);

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
          
          // Process arrays of ids properly
          const processObjectIds = (items) => {
            if (!items) return [];
            return Array.isArray(items) 
              ? items.map(item => typeof item === 'object' ? item._id : item)
              : [];
          };
          
          setFormData({
            ...formData,
            name: response.name || '',
            email: response.email || '',
            role: response.role || '',
            // Support both legacy and new fields
            school: response.school?._id || response.school || '',
            schools: processObjectIds(response.schools) || 
                     (response.school ? [response.school?._id || response.school] : []),
            direction: response.direction?._id || response.direction || '',
            directions: processObjectIds(response.directions) || 
                        (response.direction ? [response.direction?._id || response.direction] : []),
            subjects: processObjectIds(response.subjects),
            assignedTeachers: processObjectIds(response.assignedTeachers),
            assignedStudents: processObjectIds(response.assignedStudents),
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
    } else if (['subjects', 'schools', 'directions', 'assignedTeachers', 'assignedStudents'].includes(name)) {
      // Handle multi-select fields
      setFormData({
        ...formData,
        [name]: value,
      });
      
      // Update legacy single fields for backward compatibility
      if (name === 'schools' && value.length > 0) {
        setFormData(prevState => ({
          ...prevState,
          [name]: value,
          school: value[0], // Update the single school field with the first selected school
        }));
      } else if (name === 'directions' && value.length > 0) {
        setFormData(prevState => ({
          ...prevState,
          [name]: value,
          direction: value[0], // Update the single direction field with the first selected direction
          subjects: [], // Clear subject selection when directions change
        }));
      }
    } else if (name === 'direction') {
      // When direction changes, filter subjects and reset subject selection
      setFormData({
        ...formData,
        direction: value,
        // Also update the directions array for backward compatibility
        directions: value ? [value] : [],
        subjects: [], // Clear subject selection when direction changes
      });
    } else if (name === 'school') {
      setFormData({
        ...formData,
        school: value,
        // Also update the schools array for backward compatibility
        schools: value ? [value] : [],
      });
    } else if (name === 'role') {
      // Reset role-specific fields when role changes
      const newData = {
        ...formData,
        [name]: value,
      };
      
      // Clear student-specific fields if changing to teacher or admin
      if (value === 'teacher' || value === 'admin') {
        newData.assignedTeachers = [];
      }
      
      // Clear teacher-specific fields if changing to student or admin
      if (value === 'student' || value === 'admin') {
        newData.assignedStudents = [];
      }
      
      // If changing to admin, clear school/direction/subjects
      if (value === 'admin') {
        newData.school = '';
        newData.schools = [];
        newData.direction = '';
        newData.directions = [];
        newData.subjects = [];
      }
      
      setFormData(newData);
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
    
    // Reset form errors
    setFormErrors({});
    
    // Validate form
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.role) {
      errors.role = 'Role is required';
    }
    
    // Role-specific validations
    if (formData.role === 'teacher' || formData.role === 'student') {
      if (formData.schools.length === 0) {
        errors.schools = `${formData.role === 'teacher' ? 'Teacher' : 'Student'} must be assigned to at least one school`;
      }
      
      if (formData.role === 'teacher' && formData.directions.length === 0) {
        errors.directions = 'Teacher must be assigned to at least one direction';
      }
      
      if (formData.role === 'student' && !formData.direction) {
        errors.direction = 'Student must be assigned to a direction';
      }
    }
    
    // Password validation if changing password
    if (formData.changePassword) {
      if (!formData.password) {
        errors.password = 'Password is required when changing password';
      } else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
      
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    // Set form errors and return if validation fails
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Create updated user data object
    const updatedUserData = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
    };
    
    // Multi-select fields
    if (formData.schools && formData.schools.length > 0) {
      updatedUserData.schools = formData.schools;
      // Keep legacy field for backward compatibility
      updatedUserData.school = formData.schools[0];
    }
    
    // For teachers, update directions and subjects
    if (formData.role === 'teacher') {
      if (formData.directions && formData.directions.length > 0) {
        updatedUserData.directions = formData.directions;
        // Keep legacy field for backward compatibility
        updatedUserData.direction = formData.directions[0];
      }
      
      if (formData.assignedStudents && formData.assignedStudents.length > 0) {
        updatedUserData.assignedStudents = formData.assignedStudents;
      } else {
        updatedUserData.assignedStudents = [];
      }
    }
    
    // For students, update direction and assigned teachers
    if (formData.role === 'student') {
      if (formData.direction) {
        updatedUserData.direction = formData.direction;
        // For backwards compatibility with multiple directions field
        updatedUserData.directions = [formData.direction];
      }
      
      if (formData.assignedTeachers && formData.assignedTeachers.length > 0) {
        updatedUserData.assignedTeachers = formData.assignedTeachers;
      } else {
        updatedUserData.assignedTeachers = [];
      }
    }
    
    // Subjects for both teachers and students
    if (formData.subjects && formData.subjects.length > 0) {
      updatedUserData.subjects = formData.subjects;
    } else {
      updatedUserData.subjects = [];
    }
    
    // Include password only if password change is enabled
    if (formData.changePassword && formData.password) {
      updatedUserData.password = formData.password;
    }
    
    console.log('Submitting user data:', updatedUserData);
    
    // Update user
    setIsLoading(true);
    dispatch(updateUser({ userId: id, userData: updatedUserData }))
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
        startIcon={<VisibilityIcon />}
      >
        Retry
      </Button>
    </Box>
  );
}

return (
  <Box sx={{ maxWidth: '800px', mx: 'auto', mt: 3 }}>
    <Paper sx={{ p: 3 }}>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
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
              value={formData.email}
              onChange={handleChange}
              error={!!formErrors.email}
              helperText={formErrors.email}
              disabled={isLoading}
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth error={!!formErrors.role}>
              <InputLabel id="role-label">Role *</InputLabel>
              <Select
                labelId="role-label"
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={isLoading}
              >
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="teacher">Teacher</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
              <FormHelperText>{formErrors.role}</FormHelperText>
            </FormControl>
          </Grid>
          
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
                  {schools.map((school) => (
                    <MenuItem key={school._id} value={school._id}>
                      {school.name}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>{formErrors.schools}</FormHelperText>
              </FormControl>
            </Grid>
          )}
            
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


export default EditUser;
