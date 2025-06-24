import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { reset } from '../../features/notifications/notificationSlice';
import { getUsersByRole } from '../../features/users/userSlice';
import { toast } from 'react-toastify';

// Material UI imports
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress
} from '@mui/material';
import { 
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';

// Import our custom components
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import NotificationForm from './components/NotificationForm';
import NotificationRecipients from './components/NotificationRecipients';
import NotificationService from './components/NotificationService';

/**
 * CreateNotification - Main component for creating notifications
 * Integrates NotificationForm and NotificationRecipients components
 */
const CreateNotification = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Redux state
  const { user } = useSelector((state) => state.auth);
  const { isLoading, isError, isSuccess, message } = useSelector((state) => state.notifications);
  const { users, filteredUsers, isLoading: isUsersLoading } = useSelector((state) => state.users);
  
  // Component state
  const [availableUsers, setAvailableUsers] = useState([]);
  const [formData, setFormData] = useState({
    recipients: [],         // Array of recipient IDs (multiple selection)
    title: '',
    message: '',
    sendToAll: false,
    filterByRole: 'student', // Default to student role for all user types
    isImportant: false      // Whether this is an important notification
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState('student'); // Default to student role
  
  // Refs to track component state
  const isInitialMount = useRef(true);
  const hasSubmitted = useRef(false);
  
  // Check if user has permission to send notifications
  useEffect(() => {
    if (user?.role === 'teacher' && user?.canSendNotifications === false) {
      // Teacher doesn't have permission to send notifications
      toast.error('You do not have permission to send notifications');
      navigate('/app/teacher/dashboard');
    } else if (user?.role === 'admin') {
      // Admin always has permission, nothing to check
      console.log('Admin user accessing notification creation');
    } else if (user?.role === 'secretary' && !user?.secretaryPermissions?.canSendNotifications) {
      // Secretary without proper permissions
      toast.error('You do not have permission to send notifications');
      navigate('/app/admin');
    }
  }, [user, navigate]);

  // Handle notification creation success
  useEffect(() => {
    if (isSuccess && hasSubmitted.current) {
      toast.success('Notification sent successfully');
      // Dynamic navigation based on user role
      if (user?.role === 'admin') {
        navigate('/app/admin/notifications');
      } else {
        navigate('/app/teacher/notifications');
      }
    }
    
    return () => {
      // Reset the notification state when component unmounts
      if (isSuccess) {
        dispatch(reset());
      }
    };
  }, [isSuccess, dispatch, navigate]);
  
  // Fetch data when component mounts - simplified to only users based on role
  useEffect(() => {
    console.log('Fetching data for notification creation...');
    
    // Explicitly set default role for consistency
    const role = formData.filterByRole || 'student';
    
    // Only fetch users if we have a valid role
    if (['student', 'teacher', 'admin', 'parent', 'secretary'].includes(role)) {
      console.log(`Fetching users with role: ${role}`);
      
      // Load users based on user role - respecting class-based filtering
      dispatch(getUsersByRole(role))
        .unwrap()
        .then(users => {
          console.log(`Loaded ${users?.length || 0} ${role}s`);
          // Users will be filtered by class in backend for teachers
          if (users?.length === 0) {
            console.log(`No ${role}s found but API call was successful`);
          }
        })
        .catch(error => {
          // Add detailed error logging
          console.error(`Failed to load ${role}s:`, error);
          console.error('Error details:', {
            status: error.status || error.response?.status,
            message: error.message,
            data: error.response?.data
          });
          
          // If we get a 404 for 'all', try 'student' instead
          if ((error.response?.status === 404 || error.status === 404) && role !== 'student') {
            console.log('Falling back to role="student" after 404 error');
            setFormData(prev => ({
              ...prev,
              filterByRole: 'student'
            }));
          } else {
            toast.error(`Failed to load users: ${error.message || 'Unknown error'}`);
          }
        });
    } else {
      console.error(`Invalid role specified: ${role}`);
      // Default to students if role is invalid
      setFormData(prev => ({
        ...prev,
        filterByRole: 'student'
      }));
    }
  }, [dispatch, formData.filterByRole]);
  
  // Update availableUsers when users are loaded from Redux
  useEffect(() => {
    if (users && Array.isArray(users)) {
      console.log(`Updating availableUsers with ${users.length} users from Redux store`);
      setAvailableUsers(users);
    } else {
      console.log('Users from Redux store is not an array:', users);
      setAvailableUsers([]);
    }
  }, [users]);
  
  // Function to handle role change and trigger re-fetching of users
  const handleRoleChange = (role) => {
    if (['student', 'teacher', 'admin', 'parent', 'secretary'].includes(role)) {
      setFormData(prev => ({
        ...prev,
        filterByRole: role
      }));
    }
  };

  // Update available users when filteredUsers data changes
  useEffect(() => {
    if (filteredUsers && Array.isArray(filteredUsers)) {
      console.log(`Setting ${filteredUsers.length} users for role ${formData.filterByRole}`);
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

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Handle switch toggles (sendToAll, isImportant)
  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    
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
  
  // Handle recipients selection change
  const handleRecipientsChange = (e) => {
    const { value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      recipients: value
    }));
    
    // Clear any errors related to recipients
    if (formErrors.recipients) {
      setFormErrors(prev => ({
        ...prev,
        recipients: ''
      }));
    }
  };
  
  // Form validation using NotificationService
  const validate = () => {
    const errors = NotificationService.validate(formData);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Form submission using NotificationService
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submission attempted');
    
    setIsSubmitting(true);
    hasSubmitted.current = true;
    
    // Use NotificationService to validate and send the notification
    const result = NotificationService.sendNotification(
      dispatch,
      formData,
      user,
      // Success callback
      (result) => {
        console.log('Notification created successfully:', result);
        // Success handling is done in the useEffect
      },
      // Error callback
      (error) => {
        console.error('Failed to create notification:', error);
        hasSubmitted.current = false;
      },
      // Complete callback
      () => {
        setIsSubmitting(false);
      }
    );
    
    // Update form errors if validation failed
    if (!result.valid) {
      setFormErrors(result.errors);
      setIsSubmitting(false);
      console.log('Form validation failed');
    }
  };
  
  // Navigation with role-based paths
  const handleBack = () => {
    // Dynamic navigation based on user role
    if (user?.role === 'admin') {
      console.log('Admin navigating back to admin notifications');
      navigate('/app/admin/notifications');
    } else {
      console.log('Teacher navigating back to teacher notifications');
      navigate('/app/teacher/notifications');
    }
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
          {/* Notification Form Component */}
          <NotificationForm 
            formData={formData}
            formErrors={formErrors}
            handleChange={handleChange}
            handleSwitchChange={handleSwitchChange}
            disabled={isSubmitting}
            user={user}
          />
          
          {/* Recipients Selection - Only show if NOT sending to all */}
          {!formData.sendToAll && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Select Recipients
              </Typography>
              
              <NotificationRecipients 
                availableUsers={availableUsers}
                selectedRecipients={formData.recipients}
                onRecipientsChange={handleRecipientsChange}
                error={formErrors.recipients}
                disabled={isSubmitting}
                loading={isUsersLoading}
              />
            </Box>
          )}
          
          {/* Submit Button */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              startIcon={isSubmitting ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? 'Sending...' : 'Send Notification'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default CreateNotification;
