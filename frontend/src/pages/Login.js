import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import {
  Container,
  Box,
  Avatar,
  Typography,
  TextField,
  Button,
  Grid,
  Link,
  Paper,
  FormControlLabel,
  Checkbox,
  CircularProgress,
} from '@mui/material';
import { LockOutlined as LockOutlinedIcon } from '@mui/icons-material';
import { login, reset } from '../features/auth/authSlice';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    saveCredentials: false,
  });

  const [version, setVersion] = useState('');

  const { email, password, saveCredentials } = formData;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    // Debug the login state
    console.log('=== LOGIN COMPONENT AUTH STATE CHECK ===');
    console.log('Login component - Auth state:', { 
      isSuccess, 
      isError, 
      user: !!user,
      userRole: user?.role,
      hasToken: !!user?.token 
    });
    console.log('Current URL:', window.location.href);
    
    if (isError) {
      console.error('Login error:', message);
      toast.error(message);
    }

    if (isSuccess || user) {
      console.log('=== LOGIN SUCCESSFUL - DETERMINING REDIRECT ===');
      console.log('User role:', user?.role);
      console.log('Password change required:', user?.requirePasswordChange);
      console.log('Is first login:', user?.isFirstLogin);
      
      // Check if password change is required
      if (user?.requirePasswordChange || user?.isFirstLogin) {
        console.log('PASSWORD CHANGE REQUIRED - Redirecting to password change page');
        navigate('/change-password');
        return;
      }
      
      // Navigate directly to role-specific route instead of /app/dashboard
      // This prevents redirect loops through /app/dashboard
      let redirectPath;
      switch (user?.role) {
        case 'superadmin':
          redirectPath = '/superadmin/dashboard';
          break;
        case 'admin':
          redirectPath = '/app/admin';
          break;
        case 'teacher':
          redirectPath = '/app/teacher';
          break;
        case 'student':
          redirectPath = '/app/student';
          break;
        case 'parent':
          redirectPath = '/app/parent';
          break;
        default:
          console.error('Unknown user role:', user?.role);
          redirectPath = '/app/dashboard'; // Fallback
      }
      
      console.log('LOGIN REDIRECT: Navigating to', redirectPath);
      navigate(redirectPath);
    }

    return () => {
      // Only reset when the component unmounts or when an error/success occurs
      if (isError || isSuccess) {
        dispatch(reset());
      }
    };
  }, [user, isError, isSuccess, message, navigate, dispatch]);

  // Load version dynamically like the Footer component
  useEffect(() => {
    import('../config/appConfig.js')
      .then(module => {
        setVersion(module.appConfig.version);
      })
      .catch(error => {
        console.error('Failed to load appConfig:', error);
        setVersion('0.0.0');
      });
  }, []);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();

    const userData = {
      email,
      password,
      saveCredentials,
    };

    dispatch(login(userData));
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
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          GradeBook Login
        </Typography>
        <Box component="form" onSubmit={onSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={onChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={onChange}
          />
          <FormControlLabel
            control={
              <Checkbox 
                value="remember" 
                color="primary" 
                name="saveCredentials"
                checked={saveCredentials}
                onChange={onChange}
              />
            }
            label="Remember me"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.2 }}
            disabled={isLoading}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Sign In'
            )}
          </Button>
          {/* Sign-up option removed as accounts are admin-created only */}
        </Box>
      </Paper>
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {'© '}
          {new Date().getFullYear()}
          {' GradeBook - Progressive Web App \n Created by the GradeBook Team'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {'Version: '}{version}
        </Typography>
      </Box>
    </Container>
  );
};

export default Login;
