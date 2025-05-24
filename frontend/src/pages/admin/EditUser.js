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
import { getSchools } from '../../features/schools/schoolSlice';
import { getDirections } from '../../features/directions/directionSlice';
import { getSubjects } from '../../features/subjects/subjectSlice';

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
    mobilePhone: '',
    personalEmail: '',
    role: '',
    school: '', // For students
    schools: [], // For teachers (multiple schools)
    direction: '', // For students
    directions: [], // For teachers (multiple directions)
    subjects: [],
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
    school: '',
    schools: '',
    direction: '',
    directions: '',
    subjects: '',
    password: '',
    confirmPassword: '',
  });
  
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

  // Filter subjects based on selected directions
  useEffect(() => {
    // For student: filter based on single direction
    if (formData.role === 'student') {
      if (!formData.direction) {
        setFilteredSubjects(subjects); // Show all subjects if no direction selected
        return;
      }
      
      // Filter subjects that belong to the selected direction
      const directionSubjects = subjects.filter(subject => 
        subject.directions && (
          (Array.isArray(subject.directions) && subject.directions.includes(formData.direction)) ||
          (Array.isArray(subject.directions) && subject.directions.some(d => 
            (typeof d === 'object' && d._id === formData.direction) || d === formData.direction
          ))
        )
      );
      setFilteredSubjects(directionSubjects);
    } 
    // For teacher: filter based on multiple directions
    else if (formData.role === 'teacher') {
      if (!formData.directions || formData.directions.length === 0) {
        setFilteredSubjects(subjects); // Show all subjects if no directions selected
        return;
      }
      
      // Filter subjects that belong to any of the selected directions
      const directionSubjects = subjects.filter(subject => 
        subject.directions && Array.isArray(subject.directions) && (
          // Check if any of the subject's directions match any of the selected directions
          subject.directions.some(subjectDir => {
            const subjectDirId = typeof subjectDir === 'object' ? subjectDir._id : subjectDir;
            return formData.directions.includes(subjectDirId);
          })
        )
      );
      setFilteredSubjects(directionSubjects);
    } else {
      // For admin or when role is not set yet
      setFilteredSubjects(subjects);
    }
  }, [subjects, formData.direction, formData.directions, formData.role]);

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
            if (!schoolData) return [];
            if (Array.isArray(schoolData)) {
              return schoolData.map(s => (s && typeof s === 'object' ? s._id : s)).filter(Boolean);
            }
            return [schoolData && typeof schoolData === 'object' ? schoolData._id : schoolData].filter(Boolean);
          };
          
          // Process directions - handle both array and single value formats
          const processDirectionData = (directionData) => {
            if (!directionData) return [];
            if (Array.isArray(directionData)) {
              return directionData.map(d => (d && typeof d === 'object' ? d._id : d)).filter(Boolean);
            }
            return [directionData && typeof directionData === 'object' ? directionData._id : directionData].filter(Boolean);
          };
          
          // Process subjects
          const processSubjectData = (subjectData) => {
            if (!subjectData) return [];
            if (Array.isArray(subjectData)) {
              return subjectData.map(s => (s && typeof s === 'object' ? s._id : s)).filter(Boolean);
            }
            return [subjectData && typeof subjectData === 'object' ? subjectData._id : subjectData].filter(Boolean);
          };
          
          // Process based on role
          if (response.role === 'student') {
            // For students: handle both single and array formats, with fallbacks
            const schools = processSchoolData(response.schools || response.school);
            const directions = processDirectionData(response.directions || response.direction);
            
            // CRITICAL FIX: Ensure we have values for dropdown selects
            newFormData.school = schools[0] || ''; // Use first school if available
            newFormData.direction = directions[0] || ''; // Use first direction if available
            newFormData.schools = schools;
            newFormData.directions = directions;
            
            console.log('Student data processed:', {
              school: newFormData.school,
              direction: newFormData.direction,
              schools: newFormData.schools,
              directions: newFormData.directions
            });
          } else if (response.role === 'teacher' || response.role === 'secretary') {
            // For teachers/secretaries: always use arrays, with fallbacks
            
            // CRITICAL FIX: Ensure we always have arrays, process schools correctly
            const schools = processSchoolData(response.schools || response.school);
            newFormData.schools = schools;
            
            // Only set directions for teachers, not for secretaries
            if (response.role === 'teacher') {
              const directions = processDirectionData(response.directions || response.direction);
              newFormData.directions = directions;
            } else {
              // For secretary, set empty directions array
              newFormData.directions = [];
            }
            
            // For backward compatibility with single-value fields
            if (schools && schools.length > 0) {
              newFormData.school = schools[0];
            }
            
            if (response.role === 'teacher' && newFormData.directions && newFormData.directions.length > 0) {
              newFormData.direction = newFormData.directions[0];
            }
            
            console.log('Teacher/Secretary data processed:', {
              role: response.role,
              schools: newFormData.schools,
              directions: newFormData.directions,
              school: newFormData.school,
              direction: newFormData.direction
            });
          }
          
          // Process subjects for all roles
          newFormData.subjects = processSubjectData(response.subjects);
          console.log('Processed subjects:', newFormData.subjects);
          
          // Handle subjects (common for both roles)
          newFormData.subjects = response.subjects?.map(subj => typeof subj === 'object' ? subj._id : subj) || [];
          
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
      
      // Only validate school and direction fields if role is student or teacher
      if (formData.role === 'student') {
        if (!formData.school) {
          errors.school = 'School is required for students';
          isValid = false;
        }
        
        if (!formData.direction) {
          errors.direction = 'Direction is required for students';
          isValid = false;
        }
      } else if (formData.role === 'teacher' || formData.role === 'secretary') {
        if (!formData.schools || formData.schools.length === 0) {
          errors.schools = 'At least one school is required';
          isValid = false;
        }
        
        if (!formData.directions || formData.directions.length === 0) {
          errors.directions = 'At least one direction is required';
          isValid = false;
        }
      }
      
      setFormErrors(errors);
      return isValid;
    };
    
    if (!validateForm()) {
      return;
    }
    
    // Create user data object with all necessary properties
    let userData = {};
    
    // Always include these basic fields
    userData.name = formData.name;
    userData.email = formData.email;
    userData.mobilePhone = formData.mobilePhone || ''; // Added mobile phone
    userData.personalEmail = formData.personalEmail || ''; // Added personal email
    userData.role = formData.role;
    
    // Only include password if changing it
    if (formData.changePassword && formData.password) {
      userData.password = formData.password;
    }
    
    // Handle school, direction, and subjects based on user role
    if (formData.role === 'student') {
      // For students: single school and direction
      userData.school = formData.school || null;
      userData.direction = formData.direction || null;
      
      // Ensure subjects array is always included
      userData.subjects = formData.subjects && formData.subjects.length > 0 
        ? formData.subjects 
        : [];
    } else if (formData.role === 'secretary') {
      // For secretaries: add secretary permissions and school/direction assignments
      userData.secretaryPermissions = formData.secretaryPermissions;
      
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
      
      userData.schools = schoolsArray;
      userData.school = schoolsArray; // For compatibility

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
      
      userData.directions = directionsArray;
      userData.direction = directionsArray; // For compatibility
      
      // Ensure subjects array is always included
      userData.subjects = formData.subjects && formData.subjects.length > 0 
        ? formData.subjects.map(subject => 
            typeof subject === 'object' && subject._id ? subject._id : subject
          )
        : [];

      console.log('Secretary data being sent to backend:', userData);
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
      userData.schools = schoolsArray;
      userData.school = schoolsArray; // Also send using old field name for compatibility
      
      console.log('Schools data being sent to backend:');
      console.log('- userData.schools:', JSON.stringify(userData.schools));
      console.log('- userData.school:', JSON.stringify(userData.school));
      console.log('Number of schools:', userData.schools.length);
      
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
      userData.directions = directionsArray;
      userData.direction = directionsArray; // Also send using old field name for compatibility
      
      console.log('Directions data being sent to backend:');
      console.log('- userData.directions:', JSON.stringify(userData.directions));
      console.log('- userData.direction:', JSON.stringify(userData.direction));
      console.log('Number of directions:', userData.directions.length);
      
      // Ensure subjects array is always included
      userData.subjects = formData.subjects && formData.subjects.length > 0 
        ? formData.subjects.map(subject => 
            typeof subject === 'object' && subject._id ? subject._id : subject
          )
        : [];
      
      // Include teacher permission fields
      userData.canSendNotifications = formData.canSendNotifications || false;
      userData.canAddGradeDescriptions = formData.canAddGradeDescriptions || false;
    } else {
      // For admins, clear these fields
      userData.school = null;
      userData.direction = null;
      userData.subjects = [];
    }
    
    console.log('Submitting user data:', userData);
    
    // Update user
    setIsLoading(true);
    dispatch(updateUser({ id, userData }))
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
            
            {/* School selection for Students (Single) */}
            {formData.role === 'student' && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!formErrors.school}>
                  <InputLabel id="school-label">School</InputLabel>
                  <Select
                    labelId="school-label"
                    id="school"
                    name="school"
                    value={formData.school || ''}
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
            
            {/* School selection for Teachers and Secretaries (Multiple) */}
            {(formData.role === 'teacher' || formData.role === 'secretary') && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!formErrors.schools}>
                  <InputLabel id="schools-label">Schools</InputLabel>
                  <Select
                    labelId="schools-label"
                    id="schools"
                    name="schools"
                    multiple
                    value={formData.schools || []}
                    input={<OutlinedInput label="Schools" />}
                    onChange={handleChange}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                        },
                      },
                      // Make sure menu doesn't close on item select for multi-select
                      keepMounted: true,
                      disableAutoFocusItem: true,
                      disablePortal: true
                    }}
                    label="Schools"
                    disabled={schoolsLoading}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const school = schools.find(s => s._id === value);
                          return (
                            <Chip key={value} label={school ? school.name : value} />
                          );
                        })}
                      </Box>
                    )}
                  >
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
                          <Checkbox checked={formData.schools && formData.schools.indexOf(school._id) > -1} />
                          <ListItemText primary={school.name} />
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  <FormHelperText>{formErrors.schools}</FormHelperText>
                </FormControl>
              </Grid>
            )}
            
            {/* Direction selection for Students (Single) */}
            {formData.role === 'student' && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!formErrors.direction}>
                  <InputLabel id="direction-label">Direction</InputLabel>
                  <Select
                    labelId="direction-label"
                    id="direction"
                    name="direction"
                    value={formData.direction || ''}
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
            
            {/* Direction selection for Teachers (Multiple) */}
            {formData.role === 'teacher' && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!formErrors.directions}>
                  <InputLabel id="directions-label">Directions</InputLabel>
                  <Select
                    labelId="directions-label"
                    id="directions"
                    name="directions"
                    multiple
                    value={formData.directions || []}
                    input={<OutlinedInput label="Directions" />}
                    onChange={handleChange}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                        },
                      },
                      // Make sure menu doesn't close on item select for multi-select
                      keepMounted: true,
                      disableAutoFocusItem: true,
                      disablePortal: true
                    }}
                    label="Directions"
                    disabled={directionsLoading}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const direction = directions.find(d => d._id === value);
                          return (
                            <Chip key={value} label={direction ? direction.name : value} />
                          );
                        })}
                      </Box>
                    )}
                  >
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
                          <Checkbox checked={formData.directions && formData.directions.indexOf(direction._id) > -1} />
                          <ListItemText primary={direction.name} />
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  <FormHelperText>{formErrors.directions}</FormHelperText>
                </FormControl>
              </Grid>
            )}
            
            {/* Subjects selection for Teachers and Students */}
            {(formData.role === 'teacher' || formData.role === 'student') && (
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="subjects-label">Subjects</InputLabel>
                  <Select
                    labelId="subjects-label"
                    multiple
                    value={formData.subjects || []}
                    onChange={(e) => {
                      handleChange({
                        target: { name: 'subjects', value: e.target.value },
                      });
                    }}
                    input={<OutlinedInput label="Subjects" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                        {selected.map((subjectId) => {
                          const subject = subjects.find(s => {
                            return s._id === subjectId;
                          });
                          return subject ? (
                            <Chip 
                              key={subjectId} 
                              label={subject.name} 
                              sx={{ m: 0.5 }} 
                            />
                          ) : null;
                        })}
                      </Box>
                    )}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                          width: 250,
                        },
                      },
                    }}
                  >
                    {filteredSubjects.length > 0 ? (
                      filteredSubjects.map((subject) => (
                        <MenuItem key={subject._id} value={subject._id}>
                          <Checkbox 
                            checked={
                              Array.isArray(formData.subjects) && 
                              formData.subjects.indexOf(subject._id) > -1
                            }
                          />
                          <ListItemText 
                            primary={subject.name} 
                            secondary={
                              subject.directions && Array.isArray(subject.directions) && subject.directions.length > 0 ? 
                                subject.directions.map(dir => {
                                  const dirId = typeof dir === 'object' ? dir._id : dir;
                                  const direction = directions.find(d => d._id === dirId);
                                  return direction ? direction.name : ''; 
                                }).filter(Boolean).join(', ') : 
                                'No direction' 
                            }
                          />
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>
                        <Typography variant="body2" color="textSecondary">
                          {formData.role === 'teacher' && formData.directions && formData.directions.length > 0 ? 
                            'No subjects found for selected directions. Please select different directions.' : 
                            formData.role === 'student' && formData.direction ? 
                            'No subjects found for selected direction. Please select a different direction.' : 
                            'Please select a direction first to see available subjects.'}
                        </Typography>
                      </MenuItem>
                    )}
                  </Select>
                  <FormHelperText>{formErrors.subjects}</FormHelperText>
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