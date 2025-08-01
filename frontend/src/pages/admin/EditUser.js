import React, { useState, useEffect, useRef } from 'react';
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
  OutlinedInput,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

import { getUserById, updateUser, reset } from '../../features/users/userSlice';
import { updateCurrentUserPermissions } from '../../features/auth/authSlice';
import { API_URL } from '../../config/appConfig';

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user: currentUser } = useSelector((state) => state.auth);
  const { isLoading: userLoading, isError: userError, message: userMessage } = useSelector((state) => state.users);
  
  // Create refs to track component state
  const initialMount = useRef(true);
  const hasSubmitted = useRef(false);
  const dataLoaded = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [userData, setUserData] = useState(null);
  
  // State for schools data
  const [schools, setSchools] = useState([]);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobilePhone: '',
    personalEmail: '',
    role: '',
    changePassword: false,
    password: '',
    confirmPassword: '',
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
    role: '',
    password: '',
    confirmPassword: '',
  });
  
  // Fetch schools data
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setSchoolsLoading(true);
        // Fetch schools from API
        const response = await fetch(`${API_URL}/api/schools`, {
          headers: {
            Authorization: `Bearer ${currentUser.token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch schools');
        }
        
        const data = await response.json();
        setSchools(data);
      } catch (error) {
        console.error('Error fetching schools:', error);
        toast.error('Failed to load schools data');
      } finally {
        setSchoolsLoading(false);
      }
    };
    
    fetchSchools();
  }, [currentUser.token]);

  // Define empty arrays for legacy fields to prevent undefined errors
  const directions = [];
  const subjects = [];
  const filteredSubjects = [];
  const directionsLoading = false;

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
          // Prepare the form data based on user role
          const newFormData = {
            ...formData,
            name: response.name || '',
            email: response.email || '',
            mobilePhone: response.mobilePhone || response.savedMobilePhone || '',
            personalEmail: response.personalEmail || response.savedPersonalEmail || '',
            role: response.role || '',
            changePassword: false,
            password: '',
            confirmPassword: '',
            // Set teacher permission fields if they exist, otherwise use defaults
            canSendNotifications: response.canSendNotifications !== undefined ? response.canSendNotifications : true,
            canAddGradeDescriptions: response.canAddGradeDescriptions !== undefined ? response.canAddGradeDescriptions : true,
            // Set secretary permissions if they exist, otherwise use defaults
            secretaryPermissions: response.secretaryPermissions || {
              canManageGrades: false,
              canSendNotifications: false,
              canManageUsers: false,
              canManageSchools: false,
              canManageDirections: false,
              canManageSubjects: false,
              canAccessStudentProgress: false,
            },
          };
          
          // Enhanced user data processing for all roles
          console.log('Processing user data for role:', response.role);
          console.log('Raw user data from server:', JSON.stringify(response, null, 2));
          
          // Process schools - handle both array and single value formats
          const processSchoolData = (schoolData) => {
            if (Array.isArray(schoolData)) {
              return schoolData.map(school => typeof school === 'object' ? school._id : school);
            }
            return schoolData ? (typeof schoolData === 'object' ? [schoolData._id] : [schoolData]) : [];
          };
          
          // Process directions - handle both array and single value formats
          const processDirectionData = (directionData) => {
            if (Array.isArray(directionData)) {
              return directionData.map(direction => typeof direction === 'object' ? direction._id : direction);
            }
            return directionData ? (typeof directionData === 'object' ? [directionData._id] : [directionData]) : [];
          };
          
          // Process subjects
          const processSubjectData = (subjectData) => {
            if (!subjectData) return [];
            if (Array.isArray(subjectData)) {
              return subjectData.map(subject => typeof subject === 'object' ? subject._id : subject);
            }
            return typeof subjectData === 'object' ? [subjectData._id] : [subjectData];
          };
          
          // Process based on role
          if (response.role === 'student') {
            // CRITICAL FIX: Properly handle both single object and array of objects or ids
            console.log('Raw student data:', {
              school: response.school,
              schools: response.schools,
              direction: response.direction,
              directions: response.directions
            });
            
            // Process schools with better fallback handling
            let schools = [];
            // First try schools array
            if (response.schools && Array.isArray(response.schools) && response.schools.length > 0) {
              schools = processSchoolData(response.schools);
            }
            // Then try single school
            else if (response.school) {
              schools = processSchoolData([response.school]);
            }
            
            // Process directions with better fallback handling
            let directions = [];
            // First try directions array
            if (response.directions && Array.isArray(response.directions) && response.directions.length > 0) {
              directions = processDirectionData(response.directions);
            }
            // Then try single direction
            else if (response.direction) {
              directions = processDirectionData([response.direction]);
            }
            
            // CRITICAL FIX: Make sure we have values for the dropdowns
            newFormData.schools = schools;
            newFormData.directions = directions;
            newFormData.school = schools.length > 0 ? schools[0] : '';
            newFormData.direction = directions.length > 0 ? directions[0] : '';
            
            console.log('FIXED: Student data processed:', {
              school: newFormData.school,
              direction: newFormData.direction,
              schools: newFormData.schools,
              directions: newFormData.directions
            });
          } else if (response.role === 'teacher' || response.role === 'secretary') {
            // CRITICAL FIX: Better handling for teacher/secretary data
            console.log('Raw teacher/secretary data:', {
              role: response.role,
              school: response.school,
              schools: response.schools,
              direction: response.direction,
              directions: response.directions
            });
            
            // Process schools with better fallback handling
            let schools = [];
            // First try schools array
            if (response.schools && Array.isArray(response.schools) && response.schools.length > 0) {
              schools = processSchoolData(response.schools);
            }
            // Then try single school
            else if (response.school) {
              schools = Array.isArray(response.school)
                ? processSchoolData(response.school)
                : processSchoolData([response.school]);
            }
            
            // Set schools array and single school value
            newFormData.schools = schools;
            newFormData.school = schools.length > 0 ? schools[0] : '';
            
            // Only set directions for teachers, not for secretaries
            if (response.role === 'teacher') {
              // Process directions with better fallback handling
              let directions = [];
              // First try directions array
              if (response.directions && Array.isArray(response.directions) && response.directions.length > 0) {
                directions = processDirectionData(response.directions);
              }
              // Then try single direction
              else if (response.direction) {
                directions = Array.isArray(response.direction)
                  ? processDirectionData(response.direction)
                  : processDirectionData([response.direction]);
              }
              
              newFormData.directions = directions;
              newFormData.direction = directions.length > 0 ? directions[0] : '';
            } else {
              // For secretary, set empty directions
              newFormData.directions = [];
              newFormData.direction = '';
            }
            
            console.log('FIXED: Teacher/Secretary data processed:', {
              role: response.role,
              school: newFormData.school,
              direction: newFormData.direction,
              schools: newFormData.schools,
              directions: newFormData.directions
            });
          }
          
          // Process subjects for all roles
          newFormData.subjects = processSubjectData(response.subjects);
          console.log('Processed subjects:', newFormData.subjects);
          
          setFormData(newFormData);
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
    const { name, value } = e.target;
    
    // Enhanced debug logging for multi-select fields
    if (name === 'schools' || name === 'directions') {
      console.log(`${name} selection changed:`, value);
      console.log('Selection type:', Array.isArray(value) ? 'Array' : typeof value);
      console.log('Selection length:', Array.isArray(value) ? value.length : 'N/A');
    }
    
    // Clear errors for this field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
    
    // Create a clone of the current form data to work with
    let updatedFormData = { ...formData };
    
    // 1. MULTI-SELECT HANDLING - Teacher specific fields
    if (formData.role === 'teacher' && (name === 'schools' || name === 'directions')) {
      // CRITICAL FIX: Ensure multi-selects are always handled as arrays
      if (!Array.isArray(value)) {
        // Convert single value to array or use empty array if no value
        updatedFormData[name] = value ? [value] : [];
        console.log(`FIXED: Converted non-array ${name} to:`, updatedFormData[name]);
      } else {
        // Use the array as provided
        updatedFormData[name] = [...value];
      }

      // Log detailed information about the updated selection
      console.log(`Teacher ${name} updated to:`, updatedFormData[name]);
      console.log(`Number of selected ${name}:`, updatedFormData[name].length);
      
      // Handle the subjects filtering based on directions selection
      if (name === 'directions' && Array.isArray(value)) {
        const dirSubjects = subjects.filter(subject => 
          subject.directions && Array.isArray(subject.directions) && (
            subject.directions.some(subjectDir => {
              const subjectDirId = typeof subjectDir === 'object' ? subjectDir._id : subjectDir;
              return value.includes(subjectDirId);
            })
          )
        );
        
        // Keep only subjects that belong to at least one of the selected directions
        const dirSubjectIds = dirSubjects.map(s => s._id);
        updatedFormData.subjects = updatedFormData.subjects.filter(id => dirSubjectIds.includes(id));
      }
      
      // Update with our modified data
      setFormData(updatedFormData);
    }
    // 2. STUDENT DIRECTION HANDLING - filter subjects based on direction
    else if (name === 'direction' && formData.role === 'student') {
      // When direction changes for a student, reset subjects that don't belong to this direction
      const dirSubjects = subjects.filter(subject => 
        subject.directions && (
          (Array.isArray(subject.directions) && subject.directions.includes(value)) ||
          (Array.isArray(subject.directions) && subject.directions.some(d => 
            (typeof d === 'object' && d._id === value) || d === value
          ))
        )
      );
      
      // Keep only subjects that belong to the new direction
      const dirSubjectIds = dirSubjects.map(s => s._id);
      updatedFormData[name] = value;
      updatedFormData.subjects = updatedFormData.subjects.filter(id => dirSubjectIds.includes(id));
      
      // Update with our modified data
      setFormData(updatedFormData);
    } 
    // 3. DEFAULT HANDLING for all other fields
    else {
      // Standard field handling
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
    
    const validateForm = () => {
      const errors = {};
      let isValid = true;
      
      if (!formData.name.trim()) {
        errors.name = 'Name is required';
        isValid = false;
      }
      
      if (!formData.email.trim()) {
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
      
      if (formData.changePassword) {
        if (formData.password && formData.password.length < 6) {
          errors.password = 'Password must be at least 6 characters';
          isValid = false;
        }
        
        if (formData.password !== formData.confirmPassword) {
          errors.confirmPassword = 'Passwords do not match';
          isValid = false;
        }
      }
      
      if (!formData.role) {
        errors.role = 'Role is required';
        isValid = false;
      }
      
      // Legacy field validation has been removed
      
      setFormErrors(errors);
      return isValid;
    };
    
    if (!validateForm()) {
      return;
    }
    
    // Create user data object with all necessary properties
    const userUpdateData = {};
    
    // Always include these basic fields
    userUpdateData.name = formData.name;
    userUpdateData.email = formData.email;
    userUpdateData.mobilePhone = formData.mobilePhone || ''; // Added mobile phone
    userUpdateData.personalEmail = formData.personalEmail || ''; // Added personal email
    userUpdateData.role = formData.role;
    
    // Only include password if changing it
    if (formData.changePassword && formData.password) {
      userUpdateData.password = formData.password;
    }
    
    // Handle school, direction, and subjects based on user role
    if (formData.role === 'student') {
      // For students: single school and direction
      userUpdateData.school = formData.school || null;
      userUpdateData.direction = formData.direction || null;
      
      // Ensure subjects array is always included
      userUpdateData.subjects = formData.subjects && formData.subjects.length > 0 
        ? formData.subjects 
        : [];
    } else if (formData.role === 'secretary') {
      // For secretaries: add secretary permissions and school/direction assignments
      userUpdateData.secretaryPermissions = formData.secretaryPermissions;
      
      // Process schools array with clean field naming to match the backend model
      console.log('Original secretary schools:', formData.schools);
      
      // Extract school IDs from the form data
      let schoolsArray = [];
      
      if (Array.isArray(formData.schools) && formData.schools.length > 0) {
        // Process schools array
        schoolsArray = formData.schools.map(school => 
          typeof school === 'object' && school._id ? school._id : school
        );
      } else if (formData.schools && !Array.isArray(formData.schools)) {
        // Handle single value if not an array
        const schoolId = typeof formData.schools === 'object' && formData.schools._id ? 
          formData.schools._id : formData.schools;
        schoolsArray = [schoolId];
      }
      
      userUpdateData.schools = schoolsArray;
      userUpdateData.school = schoolsArray; // For compatibility

      // Process directions array with clean field naming
      console.log('Original secretary directions:', formData.directions);
      
      // Extract direction IDs from the form data
      let directionsArray = [];
      
      if (Array.isArray(formData.directions) && formData.directions.length > 0) {
        // Process directions array
        directionsArray = formData.directions.map(direction => 
          typeof direction === 'object' && direction._id ? direction._id : direction
        );
      } else if (formData.directions && !Array.isArray(formData.directions)) {
        // Handle single value if not an array
        const directionId = typeof formData.directions === 'object' && formData.directions._id ? 
          formData.directions._id : formData.directions;
        directionsArray = [directionId];
      }
      
      userUpdateData.directions = directionsArray;
      userUpdateData.direction = directionsArray; // For compatibility
      
      // Ensure subjects array is always included
      userUpdateData.subjects = formData.subjects && formData.subjects.length > 0 
        ? formData.subjects.map(subject => 
            typeof subject === 'object' && subject._id ? subject._id : subject
          )
        : [];

      console.log('Secretary data being sent to backend:', userUpdateData);
    } else if (formData.role === 'teacher') {
      // For teachers: use the dedicated array fields (schools/directions)
      // The backend now uses separate fields for teachers vs students
      console.log('Processing teacher multi-select fields');
      
      // Process schools array with clean field naming to match the backend model
      console.log('Original formData.schools:', formData.schools);
      
      // Extract school IDs from the form data
      let schoolsArray = [];
      
      if (Array.isArray(formData.schools) && formData.schools.length > 0) {
        // Process schools array
        schoolsArray = formData.schools.map(school => 
          typeof school === 'object' && school._id ? school._id : school
        );
      } else if (formData.schools && !Array.isArray(formData.schools)) {
        // Handle single value if not an array
        const schoolId = typeof formData.schools === 'object' && formData.schools._id ? 
          formData.schools._id : formData.schools;
        schoolsArray = [schoolId];
      }
      
      // FIXED FOR COMPATIBILITY: Use both old and new field names to ensure it works
      // This is because some API endpoints might still be using school/direction
      userUpdateData.schools = schoolsArray;
      userUpdateData.school = schoolsArray; // Also send using old field name for compatibility
      
      console.log('Schools data being sent to backend:');
      console.log('- userUpdateData.schools:', JSON.stringify(userUpdateData.schools));
      console.log('- userUpdateData.school:', JSON.stringify(userUpdateData.school));
      console.log('Number of schools:', userUpdateData.schools.length);
      
      // Process directions array with clean field naming
      console.log('Original formData.directions:', formData.directions);
      
      // Extract direction IDs from the form data
      let directionsArray = [];
      
      if (Array.isArray(formData.directions) && formData.directions.length > 0) {
        // Process directions array
        directionsArray = formData.directions.map(direction => 
          typeof direction === 'object' && direction._id ? direction._id : direction
        );
      } else if (formData.directions && !Array.isArray(formData.directions)) {
        // Handle single value if not an array
        const directionId = typeof formData.directions === 'object' && formData.directions._id ? 
          formData.directions._id : formData.directions;
        directionsArray = [directionId];
      }
      
      // FIXED FOR COMPATIBILITY: Use both old and new field names
      userUpdateData.directions = directionsArray;
      userUpdateData.direction = directionsArray; // Also send using old field name for compatibility
      
      console.log('Directions data being sent to backend:');
      console.log('- userUpdateData.directions:', JSON.stringify(userUpdateData.directions));
      console.log('- userUpdateData.direction:', JSON.stringify(userUpdateData.direction));
      console.log('Number of directions:', userUpdateData.directions.length);
      
      // Ensure subjects array is always included
      userUpdateData.subjects = formData.subjects && formData.subjects.length > 0 
        ? formData.subjects.map(subject => 
            typeof subject === 'object' && subject._id ? subject._id : subject
          )
        : [];
      
      // Include teacher permission fields
      userUpdateData.canSendNotifications = formData.canSendNotifications || false;
      userUpdateData.canAddGradeDescriptions = formData.canAddGradeDescriptions || false;
    } else {
      // For admins, clear these fields
      userUpdateData.school = null;
      userUpdateData.direction = null;
      userUpdateData.subjects = [];
    }
    
    console.log('Submitting user data:', userUpdateData);
    
    // Update user
    setIsLoading(true);
    dispatch(updateUser({ id, userData: userUpdateData }))
      .unwrap()
      .then((updatedUser) => {
        toast.success('User updated successfully');
        
        // If the user's permissions were updated, also update them in the auth state
        // to make the changes take effect without needing to log out
        if (currentUser && currentUser._id === id) {
          // This is the current logged-in user updating their own account
          toast.info('Refreshing your session with the new permissions...', { autoClose: 2000 });
          
          // Remove the current user data to force a fresh fetch
          if (localStorage.getItem('user')) {
            localStorage.removeItem('user');
          }
          if (sessionStorage.getItem('user')) {
            sessionStorage.removeItem('user');
          }
          
          // Force a full page reload which will redirect to login
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
        } else {
          // For other users, just update permissions and refresh the data
          if (formData.role === 'teacher') {
            // Create a permissions object with just the permission flags
            const permissionUpdates = {
              canSendNotifications: formData.canSendNotifications,
              canAddGradeDescriptions: formData.canAddGradeDescriptions
            };
            dispatch(updateCurrentUserPermissions(permissionUpdates));
          } else if (formData.role === 'secretary') {
            // Secretary permissions update
            const permissionUpdates = {
              secretaryPermissions: formData.secretaryPermissions
            };
            dispatch(updateCurrentUserPermissions(permissionUpdates));
          }
          
          // After saving, refresh user data to see changes immediately
          setTimeout(() => {
            // Reload the user data to show updated values without refresh
            dispatch(getUserById(id));
          }, 500);
          
          // Navigate back to users list after a delay
          setTimeout(() => {
            // Redirect back to user management
            navigate('/app/admin/users');
          }, 1000);
        }
      })
      .catch(error => {
        setIsLoading(false);
        setIsError(true);
        
        // Log detailed error information for debugging
        console.error('Update user error details:', error);
        
        // Extract the actual error message from the thunk rejection
        const errorDetail = typeof error === 'string' ? error : error.message || 'Unknown error';
        console.log('Error detail for debugging:', errorDetail);
        
        // Create a comprehensive error message
        const errorMsg = `Failed to update user: ${errorDetail}`;
        
        // Add an alert in the browser console with the full error details
        console.warn('%c DETAILED ERROR INFORMATION FOR UPDATE USER ', 'background: #ff0000; color: #ffffff; font-size: 16px');
        console.dir(error);
        
        // Save the error message in component state and show toast
        setErrorMessage(errorMsg);
        toast.error(errorMsg, {
          autoClose: 10000, // Keep this error visible longer (10 seconds)
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
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
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Mobile Phone"
                name="mobilePhone"
                value={formData.mobilePhone}
                onChange={handleChange}
                placeholder="e.g., +30 69 1234 5678"
                error={!!formErrors.mobilePhone}
                helperText={formErrors.mobilePhone || 'Optional'}
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
                placeholder="student@example.com"
                error={!!formErrors.personalEmail}
                helperText={formErrors.personalEmail || 'Optional'}
                inputProps={{
                  autoComplete: 'email',
                  inputMode: 'email'
                }}
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
                  <MenuItem value="secretary">Secretary</MenuItem>
                  <MenuItem value="teacher">Teacher</MenuItem>
                  <MenuItem value="student">Student</MenuItem>
                </Select>
                <FormHelperText>{formErrors.role}</FormHelperText>
              </FormControl>
            </Grid>
            
            {/* Legacy field selection components (school, direction, subjects) have been removed */}
            
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
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                secretaryPermissions: {
                                  ...formData.secretaryPermissions,
                                  canManageGrades: e.target.checked
                                }
                              });
                            }}
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
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                secretaryPermissions: {
                                  ...formData.secretaryPermissions,
                                  canSendNotifications: e.target.checked
                                }
                              });
                            }}
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
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                secretaryPermissions: {
                                  ...formData.secretaryPermissions,
                                  canManageUsers: e.target.checked
                                }
                              });
                            }}
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
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                secretaryPermissions: {
                                  ...formData.secretaryPermissions,
                                  canManageSchools: e.target.checked
                                }
                              });
                            }}
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
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                secretaryPermissions: {
                                  ...formData.secretaryPermissions,
                                  canManageDirections: e.target.checked
                                }
                              });
                            }}
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
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                secretaryPermissions: {
                                  ...formData.secretaryPermissions,
                                  canManageSubjects: e.target.checked
                                }
                              });
                            }}
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
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                secretaryPermissions: {
                                  ...formData.secretaryPermissions,
                                  canAccessStudentProgress: e.target.checked
                                }
                              });
                            }}
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
            
            {/* Teacher permissions */}
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
            
            {/* Parent Account Management Section */}
            {formData.role === 'student' && (
              <Grid item xs={12}>
                <Paper elevation={1} sx={{ p: 2, mt: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                    👨‍👩‍👧‍👦 Parent Account Management
                  </Typography>
                  
                  {/* Existing Parent Accounts Display */}
                  {userData && userData.parentIds && userData.parentIds.length > 0 ? (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Current parent accounts linked to this student:
                      </Typography>
                      {userData.parentIds.map((parent, index) => (
                        <Alert key={index} severity="info" sx={{ mb: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="body2">
                                <strong>{parent.name || 'Parent Name'}</strong> - {parent.email || 'parent@school.com'}
                              </Typography>
                              {parent.mobilePhone && (
                                <Typography variant="caption" color="text.secondary">
                                  📱 {parent.mobilePhone}
                                </Typography>
                              )}
                            </Box>
                            <Button
                              size="small"
                              color="error"
                              onClick={() => {
                                // TODO: Implement unlink parent functionality
                                toast.info('Unlink parent functionality coming soon');
                              }}
                            >
                              Unlink
                            </Button>
                          </Box>
                        </Alert>
                      ))}
                    </Box>
                  ) : (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      No parent accounts are currently linked to this student.
                    </Alert>
                  )}
                  
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => {
                      // TODO: Implement add parent functionality  
                      toast.info('Add parent functionality coming soon - will redirect to ManageParents or open modal');
                    }}
                    sx={{ mr: 2 }}
                  >
                    Add Parent Account
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => {
                      // TODO: Navigate to ManageParents filtered for this student
                      navigate(`/app/admin/parents?studentId=${id}`);
                    }}
                  >
                    Manage All Parents
                  </Button>
                </Paper>
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