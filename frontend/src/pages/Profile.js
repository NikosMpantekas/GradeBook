import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  CircularProgress,
  Divider,
  Switch,
  FormControlLabel,
  Card,
  CardContent
} from '@mui/material';
import { 
  Save as SaveIcon,
  Email as EmailIcon,
  Security as SecurityIcon,
  Help as HelpIcon,
  BugReport as BugReportIcon,
  ReportProblem as ReportProblemIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  School as SchoolIcon,
  Close as CloseIcon,
  SaveAlt as SaveAltIcon
} from '@mui/icons-material';
import { updateProfile, reset } from '../features/auth/authSlice';
import ContactDeveloper from '../components/ContactDeveloper';
import BugReportsPanel from '../components/BugReportsPanel';

const Profile = () => {
  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );
  const { darkMode } = useSelector((state) => state.ui);
  
  // Initialize with empty data, will be updated when user data is available
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password2: '',
    darkMode: darkMode,
    saveCredentials: false,
  });
  
  // Set form data when user data becomes available
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        saveCredentials: user.saveCredentials || false
      }));
    }
  }, [user]);

  const { name, email, password, password2, saveCredentials } = formData;

  // Contact Developer dialog state
  const [contactOpen, setContactOpen] = useState(false);

  const dispatch = useDispatch();

  // Track if form has been submitted
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  const handleEditSave = () => {
    onSubmit();
  };
  
  // Contact Developer handlers
  const handleOpenContact = () => {
    setContactOpen(true);
  };
  
  const handleCloseContact = () => {
    setContactOpen(false);
  };

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }

    // Only show success message if the form was actually submitted
    if (isSuccess && hasSubmitted) {
      toast.success('Profile updated successfully');
      setHasSubmitted(false); // Reset after showing message
    }

    dispatch(reset());
  }, [isError, isSuccess, message, dispatch, hasSubmitted]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }));
  };

  const onSubmit = (e) => {
    if (e) e.preventDefault();

    if (password !== password2) {
      toast.error('Passwords do not match');
      return;
    }
    
    const userData = {
      name,
      email,
      saveCredentials,
    };

    if (password) {
      userData.password = password;
    }

    // Set flag to indicate form was submitted to trigger success message
    setHasSubmitted(true);
    dispatch(updateProfile(userData));
  };

  return (
    <Container component="main" maxWidth="md">
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          borderRadius: 2,
        }}
      >
        <Typography component="h1" variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
          My Profile
        </Typography>
        
        <Grid container spacing={2}>
          {/* User Info */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 0.5 }}>
                {user?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
              </Typography>
            </Box>
          </Grid>
          
          {/* Profile Form */}
          <Grid item xs={12}>
            <Box component="form" onSubmit={onSubmit} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="Full Name"
                name="name"
                autoComplete="name"
                value={name}
                onChange={onChange}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={email}
                onChange={onChange}
              />
              
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>
                Change Password
              </Typography>
              
              <TextField
                margin="normal"
                fullWidth
                name="password"
                label="New Password"
                type="password"
                id="password"
                autoComplete="new-password"
                value={password}
                onChange={onChange}
                helperText="Leave blank to keep current password"
              />
              <TextField
                margin="normal"
                fullWidth
                name="password2"
                label="Confirm New Password"
                type="password"
                id="password2"
                value={password2}
                onChange={onChange}
              />
              
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>
                <Box display="flex" alignItems="center">
                  <SecurityIcon color="primary" sx={{ mr: 1 }} />
                  Security & Preferences
                </Box>
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={saveCredentials}
                        onChange={onChange}
                        name="saveCredentials"
                        color="primary"
                      />
                    }
                    label="Remember me on this device"
                  />
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 4, mt: -0.5 }}>
                    Keeps you logged in across browser sessions
                  </Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>
                <Box display="flex" alignItems="center">
                  <HelpIcon color="primary" sx={{ mr: 1 }} />
                  Support
                </Box>
              </Typography>
              
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <BugReportIcon color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Need help or found a bug?</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Contact our development team for assistance with technical issues or to suggest new features.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    onClick={handleOpenContact}
                    startIcon={<EmailIcon />}
                  >
                    Contact Developer
                  </Button>
                </CardContent>
              </Card>
              
              {/* Bug Reports Panel */}
              <BugReportsPanel openContactForm={handleOpenContact} />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                startIcon={<SaveIcon />}
                sx={{ mt: 3, mb: 2, py: 1.2 }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Save Changes'
                )}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      {/* Contact Developer Dialog */}
      <ContactDeveloper open={contactOpen} onClose={handleCloseContact} />
    </Container>
  );
};

export default Profile;
