import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import {
  Container,
  Box,
  Avatar,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { LockOutlined as LockOutlinedIcon } from '@mui/icons-material';
import { logout } from '../features/auth/authSlice';
import { API_URL } from '../config/appConfig';

const PasswordChange = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { currentPassword, newPassword, confirmPassword } = formData;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const validateForm = () => {
    const newErrors = {};

    if (!currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (currentPassword === newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
    
    // Clear error for this field when user starts typing
    if (errors[e.target.name]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [e.target.name]: '',
      }));
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/users/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Password changed successfully');
        toast.success('Password changed successfully! Please log in with your new password.');
        
        // Log out the user so they can log in with new password
        dispatch(logout());
        navigate('/login');
      } else {
        console.error('Password change failed:', data.message);
        toast.error(data.message || 'Failed to change password');
        
        if (data.message && data.message.includes('current password')) {
          setErrors({ currentPassword: 'Current password is incorrect' });
        }
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('An error occurred while changing password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // If this is a forced password change, don't allow cancel
    if (user?.requirePasswordChange || user?.isFirstLogin) {
      toast.warning('You must change your password before continuing');
      return;
    }
    
    // Navigate back to appropriate dashboard
    const redirectPath = user?.role === 'superadmin' 
      ? '/superadmin/dashboard' 
      : `/app/${user?.role}`;
    navigate(redirectPath);
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper 
        elevation={6} 
        sx={{ 
          mt: 8, 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          borderRadius: 2,
        }}
      >
        <Avatar sx={{ m: 1, bgcolor: 'warning.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          {user?.requirePasswordChange || user?.isFirstLogin 
            ? 'Password Change Required' 
            : 'Change Password'}
        </Typography>
        
        {(user?.requirePasswordChange || user?.isFirstLogin) && (
          <Alert severity="warning" sx={{ mt: 2, mb: 2, width: '100%' }}>
            You must change your password before continuing to use the system.
          </Alert>
        )}

        <Box component="form" onSubmit={onSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            name="currentPassword"
            label="Current Password"
            type="password"
            id="currentPassword"
            autoComplete="current-password"
            value={currentPassword}
            onChange={onChange}
            error={!!errors.currentPassword}
            helperText={errors.currentPassword}
            autoFocus
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="newPassword"
            label="New Password"
            type="password"
            id="newPassword"
            autoComplete="new-password"
            value={newPassword}
            onChange={onChange}
            error={!!errors.newPassword}
            helperText={errors.newPassword}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm New Password"
            type="password"
            id="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={onChange}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
          />
          
          <Box sx={{ display: 'flex', gap: 2, mt: 3, mb: 2 }}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading}
              sx={{ py: 1.2 }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Change Password'
              )}
            </Button>
            
            {!(user?.requirePasswordChange || user?.isFirstLogin) && (
              <Button
                fullWidth
                variant="outlined"
                onClick={handleCancel}
                disabled={isLoading}
                sx={{ py: 1.2 }}
              >
                Cancel
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
      
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          &copy; {new Date().getFullYear()} GradeBook PWA 
          Created by Nikos Mpantekas
        </Typography>
      </Box>
    </Container>
  );
};

export default PasswordChange;
