import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { API_URL } from '../../config/appConfig';

// Material UI imports
import { 
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert
} from '@mui/material';

// Icons
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import ClassIcon from '@mui/icons-material/Class';
import SettingsIcon from '@mui/icons-material/Settings';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SubjectIcon from '@mui/icons-material/Subject';
import BusinessIcon from '@mui/icons-material/Business';
// Removed unused icons: MenuBookIcon, DashboardIcon, AddCircleOutlineIcon

const SchoolOwnerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalAdmins: 0
  });

  useEffect(() => {
    let isMounted = true; // Flag to prevent memory leaks
    let controller; // For aborting fetch requests
    
    const fetchTenantInfo = async () => {
      // Create abort controller for this request cycle
      controller = new AbortController();
      
      try {
        // Only set loading if component is mounted
        if (isMounted) {
          setLoading(true);
          setError(null);
        }
        
        // Validate authentication
        if (!user?.token) {
          if (isMounted) {
            console.error('Missing authentication token in SchoolOwnerDashboard');
            setError('Authentication information missing');
            setLoading(false);
          }
          return;
        }
        
        // Configure request with timeout and abort signal
        const config = {
          headers: { Authorization: `Bearer ${user.token}` },
          timeout: 8000, // 8 second timeout
          signal: controller.signal
        };
        
        console.log(`[${new Date().toISOString()}] SchoolOwnerDashboard: Fetching tenant information...`);
        
        // First, fetch tenant information with proper error handling
        let tenantResponse;
        try {
          tenantResponse = await axios.get(`${API_URL}/tenants/owner`, config);
          console.log(`[${new Date().toISOString()}] Tenant information fetched successfully:`, 
            tenantResponse.status,
            tenantResponse.data?._id ? 'Valid tenant data' : 'Invalid tenant data');
        } catch (tenantError) {
          console.error(`[${new Date().toISOString()}] Failed to fetch tenant:`, tenantError.message);
          if (isMounted) {
            setError(tenantError.response?.data?.message || 'Failed to load tenant information');
            setLoading(false);
          }
          return; // Exit early - can't proceed without tenant info
        }
        
        // Update tenant info if valid and component is mounted
        if (tenantResponse?.data && isMounted) {
          setTenantInfo(tenantResponse.data);
          
          // Then fetch tenant stats with separate try/catch to isolate failures
          try {
            console.log(`[${new Date().toISOString()}] Fetching tenant statistics for tenant:`, tenantResponse.data._id);
            
            const statsResponse = await axios.get(
              `${API_URL}/tenants/${tenantResponse.data._id}/stats`, 
              config
            );
            
            console.log(`[${new Date().toISOString()}] Tenant statistics fetched successfully`);
            
            // Only update state if component is still mounted
            if (isMounted) {
              setStats(statsResponse.data || {
                totalUsers: 0,
                totalStudents: 0,
                totalTeachers: 0,
                totalAdmins: 0
              });
            }
          } catch (statsErr) {
            console.error(`[${new Date().toISOString()}] Error fetching stats:`, statsErr.message);
            
            // Don't fail entire component if just stats fail, use default values
            if (isMounted) {
              // Set default stats
              setStats({
                totalUsers: 0,
                totalStudents: 0,
                totalTeachers: 0,
                totalAdmins: 0
              });
            }
          }
        }
      } catch (err) {
        // Handle unexpected errors
        console.error(`[${new Date().toISOString()}] Critical error in SchoolOwnerDashboard:`, err);
        
        if (isMounted) {
          if (axios.isCancel(err)) {
            console.log('Request was cancelled');
          } else if (err.code === 'ECONNABORTED') {
            setError('Request timed out. The server is taking too long to respond.');
          } else if (err.response) {
            const status = err.response.status;
            const message = err.response.data?.message || err.response.statusText || 'Unknown error';
            
            if (status === 401 || status === 403) {
              setError(`Access denied: ${message}. Please check you have the correct permissions.`);
            } else {
              setError(`Server error (${status}): ${message}`);
            }
          } else if (err.request) {
            setError('Network error: No response received from server. Please check your connection.');
          } else {
            setError(`Error: ${err.message || 'An unknown error occurred'}`);
          }
        }
      } finally {
        // Final cleanup - only update state if still mounted
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchTenantInfo();
    
    // Cleanup function to abort any pending requests and prevent memory leaks
    return () => {
      isMounted = false;
      if (controller) {
        controller.abort();
      }
      console.log('Cleaning up SchoolOwnerDashboard component');
    };
  }, [user]);
  
  // Helper function for navigating to different sections
  const navigateTo = (path) => () => {
    navigate(path);
  };
  
  if (loading) {
    return (
      <Container sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading school information...
        </Typography>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Header/Welcome Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BusinessIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  {tenantInfo?.name || 'School Dashboard'}
                </Typography>
                <Typography variant="subtitle1" color="textSecondary">
                  Welcome to your school management dashboard
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        {/* Quick Stats */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ pl: 1 }}>
              School Stats
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                  <Typography variant="h5">{stats.totalUsers || 0}</Typography>
                  <Typography variant="body2" color="textSecondary">Total Users</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <PersonIcon sx={{ fontSize: 40, color: 'secondary.main' }} />
                  <Typography variant="h5">{stats.totalStudents || 0}</Typography>
                  <Typography variant="body2" color="textSecondary">Students</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <SchoolIcon sx={{ fontSize: 40, color: 'success.main' }} />
                  <Typography variant="h5">{stats.totalTeachers || 0}</Typography>
                  <Typography variant="body2" color="textSecondary">Teachers</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 1 }}>
                  <AdminPanelSettingsIcon sx={{ fontSize: 40, color: 'info.main' }} />
                  <Typography variant="h5">{stats.totalAdmins || 0}</Typography>
                  <Typography variant="body2" color="textSecondary">Admins</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        {/* Tenant Info */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ pl: 1 }}>
              School Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List dense>
              <ListItem>
                <ListItemIcon><BusinessIcon /></ListItemIcon>
                <ListItemText 
                  primary="School Name" 
                  secondary={tenantInfo?.name || 'N/A'} 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><PersonIcon /></ListItemIcon>
                <ListItemText 
                  primary="Contact Email" 
                  secondary={tenantInfo?.contactEmail || 'N/A'} 
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><SettingsIcon /></ListItemIcon>
                <ListItemText 
                  primary="School Status" 
                  secondary={(tenantInfo?.status || 'N/A').toUpperCase()} 
                />
              </ListItem>
              <ListItem>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  startIcon={<SettingsIcon />}
                  onClick={navigateTo('/app/tenant/profile')}
                  fullWidth
                >
                  Manage School Settings
                </Button>
              </ListItem>
            </List>
          </Paper>
        </Grid>
        
        {/* Quick Access Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ pl: 1 }}>
              Quick Actions
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h6" component="div">
                      Manage Users
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Add, edit or remove users in your school
                    </Typography>
                    <Button 
                      variant="contained" 
                      fullWidth
                      onClick={navigateTo('/app/school-owner/users')}
                    >
                      Access
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <ClassIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                    <Typography variant="h6" component="div">
                      Manage Schools
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Organize your educational institutions
                    </Typography>
                    <Button 
                      variant="contained" 
                      fullWidth
                      onClick={navigateTo('/app/school-owner/schools')}
                    >
                      Access
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <SubjectIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                    <Typography variant="h6" component="div">
                      Manage Subjects
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Create and organize academic subjects
                    </Typography>
                    <Button 
                      variant="contained" 
                      fullWidth
                      onClick={navigateTo('/app/school-owner/subjects')}
                    >
                      Access
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <NotificationsIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                    <Typography variant="h6" component="div">
                      School Announcements
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Send announcements to your school
                    </Typography>
                    <Button 
                      variant="contained" 
                      fullWidth
                      onClick={navigateTo('/app/school-owner/notifications')}
                    >
                      Access
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SchoolOwnerDashboard;
