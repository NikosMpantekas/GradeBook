import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
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
  Card,
  CardContent,
  CardActions,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ExitToApp as LogoutIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon,
  SupervisorAccount as AdminIcon,
  Group as TeacherIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { logout } from '../features/auth/authSlice';

const StandaloneDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [anchorEl, setAnchorEl] = useState(null);
  
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
  
  // Direct navigation with explicit full paths
  const navigateToApp = () => {
    console.log('Navigating to: /app/dashboard');
    navigate('/app/dashboard');
  };
  
  const navigateToProfile = () => {
    console.log('Navigating to: /app/profile');
    navigate('/app/profile');
  };
  
  const navigateToNotifications = () => {
    console.log('Navigating to: /app/notifications');
    navigate('/app/notifications');
  };
  
  const navigateToGrades = () => {
    console.log('Navigating to: /app/grades');
    navigate('/app/grades');
  };
  
  const navigateToTeacherDashboard = () => {
    console.log('Navigating to: /app/teacher');
    navigate('/app/teacher');
  };
  
  const navigateToAdminDashboard = () => {
    console.log('Navigating to: /app/admin');
    navigate('/app/admin');
  };
  
  // Teacher specific routes
  const navigateToTeacherGrades = () => {
    console.log('Navigating to: /app/teacher/grades/manage');
    navigate('/app/teacher/grades/manage');
  };
  
  const navigateToTeacherNotifications = () => {
    console.log('Navigating to: /app/teacher/notifications');
    navigate('/app/teacher/notifications');
  };
  
  // Admin specific routes 
  const navigateToManageUsers = () => {
    console.log('Navigating to: /app/admin/users');
    navigate('/app/admin/users');
  };
  
  const navigateToCreateUser = () => {
    console.log('Navigating to: /app/admin/users/create');
    navigate('/app/admin/users/create');
  };
  
  const navigateToManageSchools = () => {
    console.log('Navigating to: /app/admin/schools');
    navigate('/app/admin/schools');
  };
  
  const navigateToManageDirections = () => {
    console.log('Navigating to: /app/admin/directions');
    navigate('/app/admin/directions');
  };
  
  const openMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const closeMenu = () => {
    setAnchorEl(null);
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
            Dashboard
          </Button>
          <Button color="inherit" onClick={navigateToProfile} startIcon={<PersonIcon />}>
            Profile
          </Button>
          <Button color="inherit" onClick={navigateToNotifications} startIcon={<NotificationsIcon />}>
            Notifications
          </Button>
          <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
      >
        <MenuItem onClick={() => { closeMenu(); navigateToProfile(); }}>
          <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { closeMenu(); navigateToNotifications(); }}>
          <ListItemIcon><NotificationsIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Notifications</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { closeMenu(); handleLogout(); }}>
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
      
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {user?.name}!
        </Typography>
        
        <Grid container spacing={3}>
          {/* User Info Card */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                User Information
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1">Name: {user?.name}</Typography>
                <Typography variant="body1">Email: {user?.email}</Typography>
                <Typography variant="body1">Role: {user?.role}</Typography>
              </Box>
            </Paper>
          </Grid>
          
          {/* Quick Actions Card */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <PersonIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h6">Profile</Typography>
                      <Typography variant="body2" color="text.secondary">
                        View and update your profile information
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small" onClick={navigateToProfile}>View Profile</Button>
                    </CardActions>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <NotificationsIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h6">Notifications</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Check your latest notifications
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small" onClick={navigateToNotifications}>View Notifications</Button>
                    </CardActions>
                  </Card>
                </Grid>
                
                {user?.role === 'student' && (
                  <Grid item xs={12} sm={6} md={4}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <AssignmentIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h6">Grades</Typography>
                        <Typography variant="body2" color="text.secondary">
                          View your academic grades
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button size="small" onClick={navigateToGrades}>View Grades</Button>
                      </CardActions>
                    </Card>
                  </Grid>
                )}
                
                {user?.role === 'teacher' && (
                  <>
                    <Grid item xs={12} sm={6} md={4}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <TeacherIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="h6">Teacher Dashboard</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Main teacher portal for all functions
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <Button size="small" onClick={navigateToTeacherDashboard}>Go to Dashboard</Button>
                        </CardActions>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={4}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <AssignmentIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="h6">Manage Grades</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Record and edit student grades
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <Button size="small" onClick={navigateToTeacherGrades}>Manage Grades</Button>
                        </CardActions>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={4}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <NotificationsIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="h6">Send Notifications</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Create and send notifications to students
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <Button size="small" onClick={navigateToTeacherNotifications}>Notifications</Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  </>
                )}
                
                {user?.role === 'admin' && (
                  <>
                    <Grid item xs={12} sm={6} md={4}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <AdminIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="h6">Admin Dashboard</Typography>
                          <Typography variant="body2" color="text.secondary">
                            View stats and system overview
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <Button size="small" onClick={navigateToAdminDashboard}>Go to Admin Panel</Button>
                        </CardActions>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={4}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <SchoolIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="h6">Manage Schools</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Add, edit, and delete schools
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <Button size="small" onClick={navigateToManageSchools}>Manage Schools</Button>
                        </CardActions>
                      </Card>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={4}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <PersonIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                          <Typography variant="h6">Manage Users</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Add, edit, and delete users
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <Button size="small" onClick={navigateToManageUsers}>All Users</Button>
                          <Button size="small" onClick={navigateToCreateUser}>Add User</Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  </>
                )}
              </Grid>
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>
                Navigation Help
              </Typography>
              <Typography variant="body1" paragraph>
                If you're seeing this page, authentication is working correctly! Use the buttons above to navigate to different parts of the application.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={navigateToApp}
                  startIcon={<DashboardIcon />}
                >
                  Go to Main App
                </Button>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={() => {
                    console.log('Navigating to: /diagnostics');
                    navigate('/diagnostics'); // Keep as is - diagnostics is a public route
                  }}
                  startIcon={<SettingsIcon />}
                >
                  View Diagnostics
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default StandaloneDashboard;
