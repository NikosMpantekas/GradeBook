import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { API_URL } from '../../config/appConfig';
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
  Tooltip,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Refresh as RefreshIcon,
  Email as EmailIcon,
  ContentCopy as CopyIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  Phone as PhoneIcon,
  AlternateEmail as AlternateEmailIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { createUser, reset } from '../../features/users/userSlice';
import axios from 'axios';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';

const CreateUser = (props) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isLoading, isError, isSuccess, message } = useSelector((state) => state.users);
  const { schools } = useSelector((state) => state.schools);

  // Get admin's school for automatic email generation
  const [adminSchoolInfo, setAdminSchoolInfo] = useState({
    id: "",
    name: "",
    domain: ""
  });
  
  // Username part of the email (before the @)
  const [usernamePrefix, setUsernamePrefix] = useState("");
  
  // ENHANCED FIX: Extract domain from admin/secretary email address
  useEffect(() => {
    if (user) {
      // First try to extract domain from admin's email
      let extractedDomain = "";
      
      if (user.email && user.email.includes('@')) {
        extractedDomain = user.email.split('@')[1];
        console.log(`Extracted domain from admin's email: ${extractedDomain}`);
      }
      
      // If we have an extracted domain, use it directly
      if (extractedDomain) {
        let adminSchoolName = "School";
        let adminSchoolId = "";
        
        // Try to find matching school for the domain
        if (schools && schools.length > 0) {
          // First try to get school from schoolId
          let adminSchool;
          
          if (user.schoolId) {
            adminSchool = schools.find(school => school._id === user.schoolId);
          }
          
          // If that fails, check if user has schools array and take the first one
          if (!adminSchool && user.schools && user.schools.length > 0) {
            const schoolId = typeof user.schools[0] === 'object' ? user.schools[0]._id : user.schools[0];
            adminSchool = schools.find(school => school._id === schoolId);
          }
          
          // Get the school name and ID if we found a school
          if (adminSchool) {
            adminSchoolName = adminSchool.name || "School";
            adminSchoolId = adminSchool._id || "";
            
            // Set the school for students automatically
            setFormData(prev => ({
              ...prev,
              school: adminSchoolId
            }));
          }
        }
        
        // Set admin school info with extracted domain
        setAdminSchoolInfo({
          id: adminSchoolId,
          name: adminSchoolName,
          domain: extractedDomain
        });
        
        console.log(`Using admin's email domain: ${extractedDomain} for new users`);
      } else {
        // Fallback to original behavior if domain extraction fails
        if (schools && schools.length > 0) {
          let adminSchool;
          
          // First try to get school from schoolId
          if (user.schoolId) {
            adminSchool = schools.find(school => school._id === user.schoolId);
          }
          
          // If that fails, check if user has schools array and take the first one
          if (!adminSchool && user.schools && user.schools.length > 0) {
            const schoolId = typeof user.schools[0] === 'object' ? user.schools[0]._id : user.schools[0];
            adminSchool = schools.find(school => school._id === schoolId);
          }
          
          if (adminSchool) {
            // Get the actual school name, not empty or undefined
            const schoolName = adminSchool.name ? adminSchool.name.trim() : "";
            
            // Make sure we have a valid school name before creating domain
            if (schoolName) {
              // Create derived domain from school name if none exists
              // First ensure we have a valid domain - no spaces, lowercase, with .com
              const derivedDomain = adminSchool.domain || 
                schoolName.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";
              
              console.log(`Setting admin school: ${schoolName} with domain: ${derivedDomain}`);
              
              setAdminSchoolInfo({
                id: adminSchool._id,
                name: schoolName,
                domain: derivedDomain
              });
              
              // Set the school for students automatically
              setFormData(prev => ({
                ...prev,
                school: adminSchool._id
              }));
            } else {
              // Fallback to a default domain if school name is empty
              setAdminSchoolInfo({
                id: adminSchool._id,
                name: "School",
                domain: "school.com"
              });
              console.warn('School name is empty, using default domain');
            }
          } else {
            // Fallback to a default domain if no school found
            setAdminSchoolInfo({
              id: "",
              name: "School",
              domain: "school.com"
            });
            console.warn('Could not determine admin school, using default domain');
          }
        }
      }
    }
  }, [user, schools]);

  // Check if secretary restriction is enabled from URL parameter
  const [restrictSecretary, setRestrictSecretary] = useState(false);

  useEffect(() => {
    // Check URL parameters to see if secretary role creation should be restricted
    const queryParams = new URLSearchParams(window.location.search);
    const restrictParam = queryParams.get('restrictSecretary');
    if (restrictParam === 'true' || user?.role === 'secretary') {
      setRestrictSecretary(true);
    }
  }, [user]);

  // Additional state for loading options
  const [loadingOptions, setLoadingOptions] = useState({
    schools: false
  });
  const [optionsData, setOptionsData] = useState({
    schools: []
  });
  const [optionsError, setOptionsError] = useState({
    schools: null
  });

  const [submitting, setSubmitting] = useState(false);
  
  // Password generation and email credentials state
  const [passwordGenerated, setPasswordGenerated] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [emailCredentials, setEmailCredentials] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  
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
    canSendNotifications: true,
    canAddGradeDescriptions: true,
    secretaryPermissions: {
      canManageGrades: false,
      canSendNotifications: false,
      canManageUsers: false,
      canManageSchools: false,
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
  });
  
  // Update email when name changes - automatically generate email address
  useEffect(() => {
    if (formData.name && adminSchoolInfo.domain) {
      // Generate username from name (lowercase, no spaces)
      const username = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      
      // Set the username prefix for the email
      setUsernamePrefix(username);
      
      // Set the full email address with school domain
      const autoEmail = `${username}@${adminSchoolInfo.domain}`;
      
      console.log(`Auto-generating email: ${autoEmail}`);
      
      // Update the email field in the form
      setFormData(prev => ({
        ...prev,
        email: autoEmail
      }));
    }
  }, [formData.name, adminSchoolInfo.domain]);
  
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
      // Reset school when role changes
      const newState = {
        ...formData,
        [name]: value,
      };
      
      // If changing to admin, clear school
      if (value === 'admin') {
        newState.school = '';
      }
      
      // If changing to secretary, clear student-specific fields
      if (value === 'secretary') {
        newState.school = '';
      }
      
      setFormData(newState);
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

  // Password generation functions
  const generateEasyPassword = () => {
    // Generate an easy-to-remember password with format: Word1234!
    const words = [
      'Apple', 'Beach', 'Cloud', 'Dance', 'Eagle', 'Flame', 'Grace', 'Happy',
      'Island', 'Jungle', 'Knight', 'Light', 'Magic', 'Night', 'Ocean', 'Peace',
      'Quick', 'River', 'Smile', 'Trust', 'Unity', 'Voice', 'Water', 'Youth'
    ];
    
    const word = words[Math.floor(Math.random() * words.length)];
    const numbers = Math.floor(1000 + Math.random() * 9000); // 4-digit number
    const symbols = ['!', '@', '#', '$', '%'];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    
    return `${word}${numbers}${symbol}`;
  };

  const handleGeneratePassword = () => {
    const newPassword = generateEasyPassword();
    setGeneratedPassword(newPassword);
    setFormData({
      ...formData,
      password: newPassword,
      confirmPassword: newPassword
    });
    setPasswordGenerated(true);
    toast.success('Password generated successfully!');
  };

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
      toast.success('Password copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy password');
    }
  };

  const handleToggleShowCredentials = () => {
    setShowCredentials(!showCredentials);
  };

  const handleToggleEmailCredentials = () => {
    setEmailCredentials(!emailCredentials);
  };
  
  // Fetch schools when component mounts
  useEffect(() => {
    // Load options for teacher, student, and secretary roles
    if (formData.role === 'teacher' || formData.role === 'student' || formData.role === 'secretary') {
      fetchSchools();
    }
  }, [formData.role]);
  
  // Functions to fetch reference data
  const fetchSchools = async () => {
    try {
      setLoadingOptions(prev => ({ ...prev, schools: true }));
      setOptionsError(prev => ({ ...prev, schools: null }));
      
      console.log('[CreateUser] Using API_URL for secure schools API call:', API_URL);
      const response = await axios.get(`${API_URL}/api/schools`);
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

    // Validate required fields based on role
    if (!formData.role) {
      errors.role = 'Role is required';
    } else if (formData.role === 'student') {
      if (!formData.school) errors.school = 'School is required';
    } else if (formData.role === 'teacher') {
      if (!formData.schools || formData.schools.length === 0) errors.schools = 'At least one school is required';
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
      let userEmail = formData.email.trim().toLowerCase();
      
      // Check if we need to append the school domain to the email
      if (adminSchoolInfo.domain && !userEmail.includes('@')) {
        userEmail = `${userEmail}@${adminSchoolInfo.domain}`;
        console.log(`Appended school domain to email: ${userEmail}`);
      }
      
      const userData = {
        name: formData.name.trim(),
        email: userEmail,
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
        // For students: Include single school
        userData.school = formData.school || null;
      } else if (formData.role === 'teacher') {
        // Process schools array for teachers
        const schoolsArray = formData.schools && formData.schools.length > 0 ? formData.schools : [];
        
        // Set schools
        userData.schools = schoolsArray;
        userData.school = schoolsArray; // For compatibility
        
        console.log('Teacher schools array being submitted:', schoolsArray);
        
        // Add teacher permission fields
        userData.canSendNotifications = formData.canSendNotifications;
        userData.canAddGradeDescriptions = formData.canAddGradeDescriptions;
      } else if (formData.role === 'secretary') {
        // For secretary accounts, include the permission flags
        userData.secretaryPermissions = formData.secretaryPermissions;
        
        // Set schools only 
        const schoolsArray = formData.schools && formData.schools.length > 0 ? formData.schools : [];
        userData.schools = schoolsArray;
        userData.school = schoolsArray; // For compatibility
          
        console.log('Creating secretary account with permissions:', userData.secretaryPermissions);
        console.log('Secretary schools:', schoolsArray);
      } else {
        // For admins, ensure these fields are null/empty
        userData.school = null;
      }
      
      // Add email credentials data if password was generated
      if (passwordGenerated) {
        userData.emailCredentials = emailCredentials;
        userData.generatedPassword = generatedPassword;
      }
      
      // Add parent account creation data if enabled
      if (formData.createParentAccount && formData.role === 'student') {
        userData.createParentAccount = true;
        userData.parentName = formData.parentName || '';
        userData.parentEmail = formData.parentEmail || (formData.email ? `parent.${formData.email}` : '');
        userData.parentPassword = formData.parentPassword || '';
        userData.parentMobilePhone = formData.parentMobilePhone || '';
        userData.parentPersonalEmail = formData.parentPersonalEmail || '';
        userData.parentEmailCredentials = formData.parentEmailCredentials || false;
        
        // Include parent generated password if available
        if (formData.parentGeneratedPassword) {
          userData.parentGeneratedPassword = formData.parentGeneratedPassword;
        }
        
        console.log('Parent account data added to submission:', {
          createParentAccount: userData.createParentAccount,
          parentName: userData.parentName,
          parentEmail: userData.parentEmail,
          parentEmailCredentials: userData.parentEmailCredentials,
          hasParentPassword: !!userData.parentPassword
        });
      }
      
      console.log('Submitting user data:', {
        ...userData,
        generatedPassword: userData.generatedPassword ? '[HIDDEN]' : undefined
      });
      
      // Set the submission flag to true
      hasSubmitted.current = true;
      
      // Use the Redux action without manual toast/navigation here
      // The useEffect will handle success/error states consistently
      dispatch(createUser(userData));
      
      // Don't handle success/error here - let the useEffect do it
      // to ensure consistent behavior
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitting(false);
    }
  };

  // Create refs to track component state
  const initialMount = useRef(true);
  const hasSubmitted = useRef(false);
  
  // Load schools data when component mounts
  useEffect(() => {
    const fetchSchools = async () => {
      setLoadingOptions(prev => ({ ...prev, schools: true }));
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };
        console.log('[CreateUser] Using API_URL for secure schools API call:', API_URL);
        const { data } = await axios.get(`${API_URL}/api/schools`, config);
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

    // If the user is admin or secretary, load data
    if (user && (user.role === 'admin' || user.role === 'secretary')) {
      fetchSchools();
    }
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

    // Log state for debugging
    console.log('CreateUser effect triggered with state:', { 
      isError, 
      isSuccess, 
      isLoading, 
      hasSubmitted: hasSubmitted.current,
      submitting
    });

    if (isError) {
      console.log('CreateUser: Error occurred:', message);
      toast.error(message || 'Failed to create user');
      setSubmitting(false);
      hasSubmitted.current = false;
    }
    
    if (isSuccess && hasSubmitted.current) {
      console.log('CreateUser: Success after form submission');
      toast.success('User created successfully');
      
      // Important: Reset state and navigate
      setSubmitting(false);
      hasSubmitted.current = false;
      
      // Use a short timeout to ensure state updates before navigation
      setTimeout(() => {
        dispatch(reset());
        navigate('/app/admin/users');
      }, 50);
    }
    
    // If we've been in loading state too long (10 seconds), assume something went wrong
    const loadingTimeout = setTimeout(() => {
      if (submitting && hasSubmitted.current) {
        console.warn('CreateUser: Form submission timeout - resetting state');
        setSubmitting(false);
        toast.error('Request is taking too long. Please try again.');
        dispatch(reset());
        hasSubmitted.current = false;
      }
    }, 10000); // 10 second timeout
    
    return () => {
      clearTimeout(loadingTimeout);
      
      // Reset redux state if needed
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
                variant="outlined"
                type="email"
                label="Login Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={!!formErrors.email}
                helperText={formErrors.email || 'Email is auto-generated but can be edited if needed'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Email is suggested based on name but can be edited">
                        <Chip 
                          size="small" 
                          color="primary" 
                          label="Editable" 
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </Tooltip>
                    </InputAdornment>
                  ),
                }}
                required
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
            
            {/* Password Generation Controls */}
            <Grid item xs={12}>
              <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Password Generation
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      startIcon={<RefreshIcon />}
                      onClick={handleGeneratePassword}
                      sx={{ minWidth: 'auto' }}
                    >
                      Generate Easy Password
                    </Button>
                    
                    {passwordGenerated && (
                      <Button
                        variant="outlined"
                        startIcon={<CopyIcon />}
                        onClick={handleCopyPassword}
                        size="small"
                      >
                        Copy Password
                      </Button>
                    )}
                  </Box>
                  
                  {passwordGenerated && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Generated Password Options:
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={showCredentials}
                              onChange={handleToggleShowCredentials}
                              color="primary"
                            />
                          }
                          label="Show Credentials to Admin"
                        />
                        
                        <FormControlLabel
                          control={
                            <Switch
                              checked={emailCredentials}
                              onChange={handleToggleEmailCredentials}
                              color="primary"
                            />
                          }
                          label="Email Credentials to User"
                        />
                      </Box>
                      
                      {showCredentials && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          <Typography variant="body2">
                            <strong>Login Credentials:</strong><br/>
                            Email: {formData.email}<br/>
                            Password: {generatedPassword}
                          </Typography>
                        </Alert>
                      )}
                      
                      {emailCredentials && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                          <Typography variant="body2">
                            📧 Credentials will be sent to: <strong>{formData.personalEmail || formData.email}</strong><br/>
                            Make sure the email address is correct before creating the user.
                          </Typography>
                        </Alert>
                      )}
                    </Box>
                  )}
                </Box>
              </Paper>
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
            
            {/* School selection components have been removed */}
            
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
                  </Grid>
                </Paper>
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
            
            {/* Parent Account Creation Section */}
            {formData.role === 'student' && (
              <Grid item xs={12}>
                <Paper elevation={1} sx={{ p: 2, mt: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                    👨‍👩‍👧‍👦 Parent Account Creation
                  </Typography>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.createParentAccount || false}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            createParentAccount: e.target.checked,
                            // Reset parent fields if unchecked
                            ...(!e.target.checked && {
                              parentName: '',
                              parentEmail: '',
                              parentPassword: '',
                              parentMobilePhone: '',
                              parentPersonalEmail: '',
                              emailParentCredentials: false
                            })
                          });
                        }}
                        color="primary"
                      />
                    }
                    label="Create parent account for this student"
                  />
                  <FormHelperText sx={{ mb: 2 }}>Enable this to create a parent account that can monitor this student's academic progress</FormHelperText>
                  
                  {formData.createParentAccount && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
                        👤 Parent Account Information
                      </Typography>
                      
                      <Grid container spacing={3}>
                        {/* Full Name * - EXACT MATCH */}
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Full Name *"
                            name="parentName"
                            value={formData.parentName || ''}
                            onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                            error={formData.createParentAccount && !formData.parentName}
                            helperText={formData.createParentAccount && !formData.parentName ? 'Parent name is required' : 'Enter the user\'s full name'}
                            required
                          />
                        </Grid>
                        
                        {/* Login Email * - EXACT MATCH with auto-fill */}
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            variant="outlined"
                            type="email"
                            label="Login Email"
                            name="parentEmail"
                            value={formData.parentEmail || (formData.email ? `parent.${formData.email}` : '')}
                            onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                            error={formData.createParentAccount && !formData.parentEmail}
                            helperText={formData.createParentAccount && !formData.parentEmail ? 'Parent login email is required' : 'Email is auto-generated but can be edited if needed'}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <Tooltip title="Email is suggested based on student email but can be edited">
                                    <Chip 
                                      size="small" 
                                      color="primary" 
                                      label="Editable" 
                                      sx={{ fontSize: '0.7rem' }}
                                    />
                                  </Tooltip>
                                </InputAdornment>
                              ),
                            }}
                            required
                          />
                        </Grid>
                        
                        {/* Mobile Phone - EXACT MATCH */}
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Mobile Phone"
                            name="parentMobilePhone"
                            value={formData.parentMobilePhone || ''}
                            onChange={(e) => setFormData({ ...formData, parentMobilePhone: e.target.value })}
                            helperText="Optional"
                            inputProps={{
                              maxLength: 20,
                              pattern: '[\d\s\-+()]+'
                            }}
                          />
                        </Grid>
                        
                        {/* Personal Email - EXACT MATCH */}
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Personal Email"
                            name="parentPersonalEmail"
                            type="email"
                            value={formData.parentPersonalEmail || ''}
                            onChange={(e) => setFormData({ ...formData, parentPersonalEmail: e.target.value })}
                            helperText="Optional"
                            inputProps={{
                              autoComplete: 'email',
                              inputMode: 'email'
                            }}
                          />
                        </Grid>
                        
                        {/* Password * - EXACT MATCH */}
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Password *"
                            name="parentPassword"
                            type={formData.showParentPassword ? 'text' : 'password'}
                            value={formData.parentPassword || ''}
                            onChange={(e) => setFormData({ ...formData, parentPassword: e.target.value })}
                            error={formData.createParentAccount && !formData.parentPassword}
                            helperText={formData.createParentAccount && !formData.parentPassword ? 'Password is required' : 'Password must be at least 6 characters'}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    onClick={() => setFormData({ ...formData, showParentPassword: !formData.showParentPassword })}
                                    onMouseDown={(e) => e.preventDefault()}
                                    edge="end"
                                  >
                                    {formData.showParentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                  </IconButton>
                                </InputAdornment>
                              )
                            }}
                            required
                          />
                        </Grid>
                        
                        {/* Confirm Password * - EXACT MATCH */}
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Confirm Password *"
                            name="parentConfirmPassword"
                            type={formData.showParentConfirmPassword ? 'text' : 'password'}
                            value={formData.parentConfirmPassword || ''}
                            onChange={(e) => setFormData({ ...formData, parentConfirmPassword: e.target.value })}
                            error={formData.createParentAccount && (formData.parentPassword !== formData.parentConfirmPassword)}
                            helperText={formData.createParentAccount && (formData.parentPassword !== formData.parentConfirmPassword) ? 'Passwords do not match' : 'Re-enter the password to confirm'}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    onClick={() => setFormData({ ...formData, showParentConfirmPassword: !formData.showParentConfirmPassword })}
                                    onMouseDown={(e) => e.preventDefault()}
                                    edge="end"
                                  >
                                    {formData.showParentConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                  </IconButton>
                                </InputAdornment>
                              )
                            }}
                            required
                          />
                        </Grid>
                        
                        {/* Password Generation - EXACT MATCH */}
                        <Grid item xs={12}>
                          <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                              Password Generation
                            </Typography>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                <Button
                                  variant="contained"
                                  startIcon={<RefreshIcon />}
                                  onClick={() => {
                                    const words = [
                                      'Apple', 'Beach', 'Cloud', 'Dance', 'Eagle', 'Flame', 'Grace', 'Happy',
                                      'Island', 'Jungle', 'Knight', 'Light', 'Magic', 'Night', 'Ocean', 'Peace',
                                      'Quick', 'River', 'Smile', 'Trust', 'Unity', 'Voice', 'Water', 'Youth'
                                    ];
                                    const word = words[Math.floor(Math.random() * words.length)];
                                    const numbers = Math.floor(1000 + Math.random() * 9000);
                                    const symbols = ['!', '@', '#', '$', '%'];
                                    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
                                    const newPassword = `${word}${numbers}${symbol}`;
                                    
                                    setFormData({ 
                                      ...formData, 
                                      parentPassword: newPassword,
                                      parentConfirmPassword: newPassword,
                                      parentPasswordGenerated: true,
                                      parentGeneratedPassword: newPassword
                                    });
                                  }}
                                  sx={{ minWidth: 'auto' }}
                                >
                                  Generate Easy Password
                                </Button>
                                
                                {formData.parentPasswordGenerated && (
                                  <Button
                                    variant="outlined"
                                    startIcon={<ContentCopyIcon />}
                                    onClick={async () => {
                                      try {
                                        await navigator.clipboard.writeText(formData.parentGeneratedPassword);
                                        // You can add toast notification here if needed
                                      } catch (error) {
                                        console.error('Failed to copy password');
                                      }
                                    }}
                                    size="small"
                                  >
                                    Copy Password
                                  </Button>
                                )}
                              </Box>
                              
                              {formData.parentPasswordGenerated && (
                                <Box>
                                  <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Generated Password Options:
                                  </Typography>
                                  
                                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <FormControlLabel
                                      control={
                                        <Switch
                                          checked={formData.showParentCredentials || false}
                                          onChange={(e) => setFormData({ ...formData, showParentCredentials: e.target.checked })}
                                          color="primary"
                                        />
                                      }
                                      label="Show Credentials to Admin"
                                    />
                                    
                                    <FormControlLabel
                                      control={
                                        <Switch
                                          checked={formData.parentEmailCredentials || false}
                                          onChange={(e) => setFormData({ ...formData, parentEmailCredentials: e.target.checked })}
                                          color="primary"
                                        />
                                      }
                                      label="Email Credentials to User"
                                    />
                                  </Box>
                                  
                                  {formData.showParentCredentials && (
                                    <Alert severity="info" sx={{ mt: 2 }}>
                                      <Typography variant="body2">
                                        <strong>Parent Login Credentials:</strong><br/>
                                        Email: {formData.parentEmail || (formData.email ? `parent.${formData.email}` : '')}<br/>
                                        Password: {formData.parentGeneratedPassword}
                                      </Typography>
                                    </Alert>
                                  )}
                                  
                                  {formData.parentEmailCredentials && (
                                    <Alert severity="success" sx={{ mt: 2 }}>
                                      <Typography variant="body2">
                                        📧 Parent will receive login credentials via email after account creation.
                                      </Typography>
                                    </Alert>
                                  )}
                                </Box>
                              )}
                            </Box>
                          </Paper>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
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
