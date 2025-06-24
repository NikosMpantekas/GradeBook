import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createNotification, reset } from '../../features/notifications/notificationSlice';
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
    filterByRole: user?.role === 'teacher' ? 'student' : 'student', // Default to student role
    isImportant: false      // Whether this is an important notification
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user?.role === 'teacher' ? 'student' : 'student');
  
  // Refs to track component state
  const isInitialMount = useRef(true);
  const hasSubmitted = useRef(false);
  
  // Check if teacher has permission to send notifications
  useEffect(() => {
    // Only applies to teachers, not admins
    if (user?.role === 'teacher' && user?.canSendNotifications === false) {
      // Teacher doesn't have permission to send notifications
      toast.error('You do not have permission to send notifications');
      navigate('/app/teacher/dashboard');
    }
  }, [user, navigate]);

  // Handle notification creation success
  useEffect(() => {
    if (isSuccess && hasSubmitted.current) {
      toast.success('Notification sent successfully');
      navigate('/app/teacher/notifications');
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
    
    // Only fetch users if we have a valid role
    if (formData.filterByRole && ['student', 'teacher', 'admin', 'parent', 'secretary'].includes(formData.filterByRole)) {
      console.log(`Fetching users with role: ${formData.filterByRole}`);
      
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
    } else {
      console.error(`Invalid role specified: ${formData.filterByRole}`);
      // Default to students if role is invalid
      setFormData(prev => ({
        ...prev,
        filterByRole: 'student'
      }));
    }
  }, [dispatch, formData.filterByRole]);
  
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
  
  // Form validation
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
  
  // Form submission
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
        // Send to all users (filtered by role and teacher class access)
        notificationData.sendToAll = true;
        console.log(`Sending to all users with role: ${formData.filterByRole}`);
        // Class filtering will be applied in backend for teachers
      } else {
        // Send to specific recipients (multiple selection supported)
        notificationData.recipients = formData.recipients;
        console.log(`Sending to ${formData.recipients.length} specific recipients`);
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
  
  // Navigation
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
