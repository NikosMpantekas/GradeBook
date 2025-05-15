import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  Typography, 
  Box, 
  Button, 
  Container,
  Paper,
  Grid,
  AppBar,
  Toolbar,
  CssBaseline,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ExitToApp as LogoutIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { logout } from '../features/auth/authSlice';
import { useDispatch } from 'react-redux';

const StandaloneDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  useEffect(() => {
    // Debug logging to help diagnose rendering issues
    console.log('StandaloneDashboard rendering with user:', user ? {
      id: user._id,
      name: user.name,
      role: user.role
    } : 'No user');
    
    // If no user, redirect to login
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };
  
  const navigateToApp = () => {
    navigate('/app');
  };

  // If not logged in, don't render anything
  if (!user) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            GradeBook
          </Typography>
          <Button color="inherit" onClick={navigateToApp} startIcon={<DashboardIcon />}>
            Full Dashboard
          </Button>
          <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      
      <Container component="main" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Paper sx={{ p: 4, borderRadius: 2 }}>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Welcome, {user.name}!
            </Typography>
            <Typography variant="body1">
              You are logged in as: <strong>{user.role.toUpperCase()}</strong>
            </Typography>
          </Box>
          
          <Grid container spacing={3} justifyContent="center">
            <Grid item xs={12} md={6}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={navigateToApp}
                startIcon={<DashboardIcon />}
                sx={{ py: 2 }}
              >
                Go to Main Dashboard
              </Button>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={() => navigate('/app/profile')}
                startIcon={<PersonIcon />}
                sx={{ py: 2 }}
              >
                View Profile
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Container>
      
      <Box component="footer" sx={{ py: 3, bgcolor: 'background.paper', mt: 'auto' }}>
        <Container maxWidth="sm">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} GradeBook - All rights reserved
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default StandaloneDashboard;
