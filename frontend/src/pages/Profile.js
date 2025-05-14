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
  Avatar,
  IconButton,
  CircularProgress,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { PhotoCamera, Save as SaveIcon } from '@mui/icons-material';
import { updateProfile, reset } from '../features/auth/authSlice';

const Profile = () => {
  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );
  const { darkMode } = useSelector((state) => state.ui);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    password2: '',
    avatar: user?.avatar || '',
    darkMode: darkMode,
    saveCredentials: user?.saveCredentials || false,
  });

  const { name, email, password, password2, avatar, saveCredentials } = formData;

  const dispatch = useDispatch();

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }

    if (isSuccess) {
      toast.success('Profile updated successfully');
    }

    dispatch(reset());
  }, [isError, isSuccess, message, dispatch]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();

    if (password !== password2) {
      toast.error('Passwords do not match');
    } else {
      const userData = {
        name,
        email,
        darkMode: formData.darkMode,
        saveCredentials,
      };

      if (password) {
        userData.password = password;
      }

      dispatch(updateProfile(userData));
    }
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
        
        <Grid container spacing={4}>
          {/* Profile Photo Section */}
          <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar 
              src={avatar} 
              alt={name} 
              sx={{ width: 100, height: 100, mb: 2 }}
            />
            <Typography variant="body1" sx={{ mb: 1, textAlign: 'center' }}>
              {user?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
            </Typography>
            
            <IconButton 
              color="primary" 
              aria-label="upload picture" 
              component="label"
              sx={{ mb: 2 }}
            >
              <input hidden accept="image/*" type="file" />
              <PhotoCamera />
            </IconButton>
            
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
              Upload a new profile picture (coming soon)
            </Typography>
          </Grid>
          
          {/* Profile Form */}
          <Grid item xs={12} md={8}>
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
                Preferences
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.darkMode}
                        onChange={(e) => setFormData({ ...formData, darkMode: e.target.checked })}
                        name="darkMode"
                        color="primary"
                      />
                    }
                    label="Dark Mode"
                  />
                </Grid>
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
                </Grid>
              </Grid>
              
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
    </Container>
  );
};

export default Profile;
