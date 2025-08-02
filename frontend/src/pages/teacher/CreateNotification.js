import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { reset } from '../../features/notifications/notificationSlice';
import { toast } from 'react-toastify';

// Material UI imports
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Container,
  Card,
  CardContent,
  Divider,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Notifications as NotificationsIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  School as SchoolIcon,
  Send as SendIcon
} from '@mui/icons-material';

// Import our custom components
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import NotificationForm from './components/NotificationForm';
import NotificationRecipients from './components/NotificationRecipients';
import NotificationService from './components/NotificationService';

/**
 * CreateNotification - Main component for creating notifications
 * Integrates NotificationForm and NotificationRecipients components with class-based filtering
 */
const CreateNotification = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Redux state
  const { user } = useSelector((state) => state.auth);
  const { isLoading, isError, isSuccess, message } = useSelector((state) => state.notifications);
  
  // Component state
  const [formData, setFormData] = useState({
    recipients: [],         // Array of recipient IDs (multiple selection)
    title: '',
    message: '',
    isImportant: false      // Whether this is an important notification
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertState, setAlertState] = useState({ open: false, message: '', severity: 'info' });
  
  // Refs to track component state
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
        navigate('/app/admin/notifications/manage');
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
  }, [isSuccess, dispatch, navigate, user]);

  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    console.log(`Form field changed: ${name} = ${type === 'checkbox' ? checked : value}`);
    
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear related errors when user starts typing
    if (formErrors[name]) {
      setFormErrors(prevErrors => ({
        ...prevErrors,
        [name]: ''
      }));
    }
  };

  // Handle recipients selection change
  const handleRecipientsChange = (e) => {
    const selectedRecipients = e.target.value;
    console.log('Recipients changed:', selectedRecipients);
    
    setFormData(prevState => ({
      ...prevState,
      recipients: selectedRecipients
    }));
    
    // Clear recipients error when user selects recipients
    if (formErrors.recipients) {
      setFormErrors(prevErrors => ({
        ...prevErrors,
        recipients: ''
      }));
    }
  };

  // Validate form before submission
  const validateForm = () => {
    const errors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    }
    
    if (!formData.recipients || formData.recipients.length === 0) {
      errors.recipients = 'At least one recipient must be selected';
    }
    
    console.log('Form validation:', { isValid: Object.keys(errors).length === 0, errors });
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fix the form errors before submitting');
      return;
    }
    
    setIsSubmitting(true);
    hasSubmitted.current = true;
    
    console.log('[NOTIFICATION CREATION] Starting submission process with data:', formData);
    console.log('[NOTIFICATION CREATION] User context:', { role: user?.role, id: user?.id });
    
    // Use the NotificationService to send the notification with proper callback handling
    NotificationService.sendNotification(
      dispatch,
      formData,
      user,
      // Success callback
      (result) => {
        console.log('[NOTIFICATION CREATION] Notification sent successfully:', result);
        toast.success('Notification sent successfully!');
        
        // Reset form
        setFormData({
          recipients: [],
          title: '',
          message: '',
          isImportant: false,
          filterByRole: '',
          sendToAll: false
        });
        setFormErrors({});
        hasSubmitted.current = false;
        
        // Navigate back to notifications list
        handleBack();
      },
      // Error callback
      (error) => {
        console.error('[NOTIFICATION CREATION] Failed to send notification:', error);
        toast.error(error.message || 'Failed to send notification');
        hasSubmitted.current = false;
      },
      // Complete callback (always called)
      () => {
        console.log('[NOTIFICATION CREATION] Submission process completed');
        setIsSubmitting(false);
      }
    );
  };

  // Handle back navigation
  const handleBack = () => {
    if (user?.role === 'admin') {
      navigate('/app/admin/notifications/manage');
    } else {
      navigate('/app/teacher/notifications');
    }
  };

  // Show loading state
  if (isLoading || isSubmitting) {
    return <LoadingState message={isSubmitting ? "Sending notification..." : "Loading..."} />;
  }

  // Show error state
  if (isError) {
    return <ErrorState message={message || "Failed to load notification data"} />;
  }

  // Handle alert close
  const handleAlertClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setAlertState({ ...alertState, open: false });
  };

  return (
    <Container maxWidth="lg" sx={{ width: '100%', px: { xs: 1, sm: 2, md: 3 } }}>
      <Card sx={{ mb: { xs: 2, sm: 4 } }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 1, sm: 2 }, 
            mb: { xs: 2, sm: 3 },
            flexDirection: { xs: 'column', sm: 'row' },
            textAlign: { xs: 'center', sm: 'left' }
          }}>
            <NotificationsIcon 
              color="primary" 
              sx={{ 
                fontSize: { xs: 32, sm: 40 },
                mb: { xs: 1, sm: 0 }
              }} 
            />
            <Box>
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                Create Notification
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                Send a new notification to students, teachers, or parents
              </Typography>
            </Box>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ 
              mb: { xs: 2, sm: 3 },
              minWidth: { xs: '100%', sm: 'auto' },
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            Back
          </Button>
        </CardContent>
      </Card>

      <NotificationForm 
        onSubmit={handleSubmit}
        loading={isSubmitting}
        user={user}
      />

      <Card sx={{ mt: { xs: 2, sm: 4 } }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 1, sm: 2 },
            flexDirection: { xs: 'column', sm: 'row' },
            textAlign: { xs: 'center', sm: 'left' }
          }}>
            <SendIcon 
              color="primary" 
              sx={{ 
                fontSize: { xs: 24, sm: 28 },
                mb: { xs: 1, sm: 0 }
              }} 
            />
            <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Ready to Send
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            Review your notification details above and click "Send Notification" when ready.
          </Typography>
        </CardContent>
      </Card>

      <Snackbar
        open={alertState.open}
        autoHideDuration={6000}
        onClose={handleAlertClose}
      >
        <Alert 
          onClose={handleAlertClose} 
          severity={alertState.severity} 
          elevation={6} 
          variant="filled"
        >
          {alertState.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CreateNotification;
