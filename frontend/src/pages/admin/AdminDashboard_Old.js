import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Fade
} from '@mui/material';
import {
  WelcomePanel,
  ProfileInfoPanel,
  RecentNotificationsPanel,
  RecentGradesPanel,
  UpcomingClassesPanel
} from '../../components/dashboard/DashboardComponents';
import { useFeatureToggles } from '../../context/FeatureToggleContext';
import axios from 'axios';
import { API_URL } from '../../config/appConfig';
import { toast } from 'react-toastify';

/**
 * AdminDashboard Component
 * Rebuilt from scratch with proper permission checking
 * Shows: Welcome, Profile, Recent Notifications, Recent Grades, Upcoming Classes
 */
const AdminDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isFeatureEnabled, loading: featuresLoading } = useFeatureToggles();
  
  // Component state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    notifications: [],
    grades: [],
    classes: [],
    stats: {}
  });
  
  // Loading states for individual panels
  const [panelLoading, setPanelLoading] = useState({
    notifications: false,
    grades: false,
    classes: false
  });
  

  // Check authentication and role
  useEffect(() => {
    if (!user) {
      console.log('AdminDashboard: No user found, redirecting to login');
      navigate('/login');
      return;
    }
    
    if (user.role !== 'admin') {
      console.log('AdminDashboard: User is not admin, redirecting');
      toast.error('Access denied. Admin privileges required.');
      navigate('/app/dashboard');
      return;
    }
    
    console.log('AdminDashboard: Admin user authenticated:', user.email);
  }, [user, navigate]);

  // Fetch dashboard data
  useEffect(() => {
    if (user && user.role === 'admin' && !featuresLoading) {
      fetchDashboardData();
    }
  }, [user, featuresLoading]);

  const getAuthConfig = () => {
    return {
      headers: {
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('AdminDashboard: Fetching dashboard data...');
      
      const promises = [];
      const dataKeys = [];
      
      // Only fetch data for enabled features
      if (isFeatureEnabled('enableNotifications')) {
        setPanelLoading(prev => ({ ...prev, notifications: true }));
        promises.push(fetchNotifications());
        dataKeys.push('notifications');
      }
      
      if (isFeatureEnabled('enableGrades')) {
        setPanelLoading(prev => ({ ...prev, grades: true }));
        promises.push(fetchRecentGrades());
        dataKeys.push('grades');
      }
      
      if (isFeatureEnabled('enableClasses') || isFeatureEnabled('enableSchedule')) {
        setPanelLoading(prev => ({ ...prev, classes: true }));
        promises.push(fetchUpcomingClasses());
        dataKeys.push('classes');
      }
      
      // Execute all enabled data fetches
      const results = await Promise.allSettled(promises);
      
      // Process results
      const newData = { ...dashboardData };
      results.forEach((result, index) => {
        const key = dataKeys[index];
        if (result.status === 'fulfilled') {
          newData[key] = result.value;
        } else {
          console.error(`AdminDashboard: Error fetching ${key}:`, result.reason);
          newData[key] = [];
        }
      });
      
      setDashboardData(newData);
      console.log('AdminDashboard: Dashboard data loaded successfully');
      
    } catch (error) {
      console.error('AdminDashboard: Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
      setPanelLoading({ notifications: false, grades: false, classes: false });
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/notifications?limit=10`, getAuthConfig());
      return response.data || [];
    } catch (error) {
      console.error('AdminDashboard: Error fetching notifications:', error);
      return [];
    }
  };

  const fetchRecentGrades = async () => {
    try {
      // For admin, get recent grades from all students in their school
      const response = await axios.get(`${API_URL}/api/grades/recent?limit=10`, getAuthConfig());
      return response.data || [];
    } catch (error) {
      console.error('AdminDashboard: Error fetching recent grades:', error);
      return [];
    }
  };

  const fetchUpcomingClasses = async () => {
    try {
      // For admin, get upcoming classes from their school
      const response = await axios.get(`${API_URL}/api/classes/upcoming?limit=10`, getAuthConfig());
      return response.data || [];
    } catch (error) {
      console.error('AdminDashboard: Error fetching upcoming classes:', error);
      return [];
    }
  };

  // Navigation handlers
  const handleViewAllNotifications = () => {
    navigate('/app/admin/notifications/manage');
  };

  const handleViewAllGrades = () => {
    navigate('/app/admin/grades/manage');
  };

  const handleViewAllClasses = () => {
    navigate('/app/admin/classes');
  };

  // Show loading state
  if (featuresLoading || loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  // Show error state
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  // Show access denied if not admin
  if (!user || user.role !== 'admin') {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Access denied. Administrator privileges required.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Fade in={true} timeout={800}>
        <Box>
          {/* Welcome Panel - Always shown */}
          <WelcomePanel user={user} />
          
          <Grid container spacing={3}>
            {/* Profile Information - Always shown */}
            <Grid item xs={12} md={4}>
              <ProfileInfoPanel user={user} loading={false} />
            </Grid>
            
            {/* Recent Notifications - Only if feature enabled */}
            <Grid item xs={12} md={8}>
              <RecentNotificationsPanel 
                notifications={dashboardData.notifications}
                loading={panelLoading.notifications}
                onViewAll={handleViewAllNotifications}
              />
            </Grid>
            
            {/* Recent Grades - Only if feature enabled */}
            <Grid item xs={12} md={6}>
              <RecentGradesPanel 
                grades={dashboardData.grades}
                loading={panelLoading.grades}
                onViewAll={handleViewAllGrades}
                userRole="admin"
              />
            </Grid>
            
            {/* Upcoming Classes - Only if feature enabled */}
            <Grid item xs={12} md={6}>
              <UpcomingClassesPanel 
                classes={dashboardData.classes}
                loading={panelLoading.classes}
                onViewAll={handleViewAllClasses}
                userRole="admin"
              />
            </Grid>
          </Grid>
          
          {/* Show message if no features are enabled */}
          {!isFeatureEnabled('enableNotifications') && 
           !isFeatureEnabled('enableGrades') && 
           !isFeatureEnabled('enableClasses') && 
           !isFeatureEnabled('enableSchedule') && (
            <Alert severity="info" sx={{ mt: 3 }}>
              Some dashboard features are currently disabled. Contact your system administrator to enable additional features.
            </Alert>
          )}
        </Box>
      </Fade>
    </Container>
  );
};
      
      // Process schedule data - get today's and upcoming classes
      if (response.data) {
        const allClasses = Object.values(response.data).flat();
        // Filter and sort upcoming classes (next 3 classes)
        const upcoming = allClasses
          .filter(cls => cls && cls.subject && cls.startTime)
          .slice(0, 3);
        
        setUpcomingClasses(upcoming);
        console.log('Admin Dashboard - Upcoming classes:', upcoming);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setUpcomingClasses([]);
    } finally {
      setScheduleLoading(false);
    }
  };
  
  // Fetch data on component mount with force refresh  
  useEffect(() => {
    console.log('AdminDashboard - Initial data fetch');
    
    // Now fetch fresh data
    dispatch(getUsers());
    dispatch(getSchools());
    dispatch(getMyNotifications());
    
    // Fetch upcoming classes
    if (user?.token) {
      fetchUpcomingClasses();
    }
  }, [dispatch, user?.token]);
  
  // Function to retry loading data
  const handleRetryDataLoad = () => {
    console.log('Retrying data load...');
    try {
      localStorage.removeItem('persist:users');
      localStorage.removeItem('persist:schools');
      localStorage.removeItem('persist:notifications');
    } catch (e) {
      console.warn('Could not clear localStorage:', e);
    }
    
    // Re-dispatch actions to fetch fresh data
    dispatch(getUsers());
    dispatch(getSchools());
    dispatch(getMyNotifications());
    
    // Retry upcoming classes fetch
    if (user?.token) {
      fetchUpcomingClasses();
    }
  };
  
  // Pie chart data for user roles
  const userRolesData = {
    labels: ['Students', 'Teachers', 'Admins'],
    datasets: [
      {
        data: [stats.totalStudents, stats.totalTeachers, 1], // Assuming 1 admin (the current user)
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Bar chart data for entity counts
  const entitiesData = {
    labels: ['Schools', 'Notifications'],
    datasets: [
      {
        label: 'Count',
        data: [stats.totalSchools, stats.totalNotifications],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  // Bar chart options
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  // Show loading indicator
  if (isLoading) {
    return (
      <Box sx={{ width: '100%' }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Loading dashboard data...
          </Typography>
        </Box>
      </Box>
    );
  }
  
  // Improved error handling logic
  // 1. Check if we have at least some data to display
  const hasUsers = Array.isArray(users) && users.length > 0;
  const hasSchools = Array.isArray(schools) && schools.length > 0;
  const hasNotifications = Array.isArray(notifications) && notifications.length > 0;
  
  // 2. Check if ALL data is missing - only show full error state in this case
  const allDataMissing = !hasUsers && !hasSchools && !hasNotifications;
  
  // 3. Check if we have partial data load success
  const hasPartialData = (hasUsers || hasSchools || hasNotifications);
  
  // Log the data availability for debugging
  console.log('Data availability:', {
    hasUsers,
    hasSchools,
    hasNotifications,
    hasPartialData,
    allDataMissing
  });
  
  // Only show complete error state when ALL data is missing
  if (hasError && allDataMissing) {
    return (
      <Box sx={{ width: '100%' }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            There was a problem loading the dashboard data.
          </Alert>
          <Typography variant="body1" paragraph>
            This might be due to network issues or the server might be temporarily unavailable.
            You can try again or access other parts of the application from the sidebar.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleRetryDataLoad}
          >
            Retry Loading Data
          </Button>
        </Paper>
      </Box>
    );
  }

  // Main dashboard content
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      
      {/* Show a warning banner when some data failed to load but we can still show partial data */}
      {hasError && hasPartialData && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={handleRetryDataLoad}
            >
              Retry
            </Button>
          }
        >
          Some data could not be loaded. The dashboard is showing partial information.
        </Alert>
      )}
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.light', color: 'white', height: '100%' }}>
            <CardContent>
              <Typography variant="h5" component="div">
                Students
              </Typography>
              <Typography variant="h3" sx={{ my: 2 }}>
                {stats.totalStudents}
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth 
                component={RouterLink}
                to="/app/admin/users?role=student"
              >
                Manage Students
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'secondary.light', color: 'white', height: '100%' }}>
            <CardContent>
              <Typography variant="h5" component="div">
                Teachers
              </Typography>
              <Typography variant="h3" sx={{ my: 2 }}>
                {stats.totalTeachers}
              </Typography>
              <Button 
                variant="contained" 
                color="secondary" 
                fullWidth 
                component={RouterLink}
                to="/app/admin/users?role=teacher"
              >
                Manage Teachers
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.light', color: 'white', height: '100%' }}>
            <CardContent>
              <Typography variant="h5" component="div">
                Schools
              </Typography>
              <Typography variant="h3" sx={{ my: 2 }}>
                {stats.totalSchools}
              </Typography>
              <Button 
                variant="contained" 
                color="success" 
                fullWidth 
                component={RouterLink}
                to="/app/admin/schools"
              >
                Manage Schools
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.light', color: 'white', height: '100%' }}>
            <CardContent>
              <Typography variant="h5" component="div">
                Notifications
              </Typography>
              <Typography variant="h3" sx={{ my: 2 }}>
                {stats.totalNotifications}
              </Typography>
              <Button 
                variant="contained" 
                color="info" 
                fullWidth 
                component={RouterLink}
                to="/app/admin/notifications"
              >
                Manage Notifications
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Recent Notifications - Full Width */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%', overflow: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <NotificationsIcon sx={{ mr: 1 }} />
              Recent Notifications
            </Typography>
            
            {hasNotifications ? (
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {notifications.slice(0, 10).map((notification, index) => (
                  <React.Fragment key={notification._id}>
                    <ListItem alignItems="flex-start">
                      <ListItemIcon>
                        <NotificationsIcon 
                          color={notification.isRead ? 'disabled' : 'primary'}
                          sx={{ fontSize: 20 }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                fontWeight: notification.isRead ? 'normal' : 'bold',
                                flex: 1 
                              }}
                            >
                              {notification.title}
                            </Typography>
                            {notification.urgent && (
                              <Chip 
                                label="Urgent" 
                                size="small" 
                                color="error" 
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                            {!notification.isRead && (
                              <Chip 
                                label="New" 
                                size="small" 
                                color="primary" 
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {notification.message?.substring(0, 100)}{notification.message?.length > 100 ? '...' : ''}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString()}
                            </Typography>
                          </Box>
                        }
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        component={RouterLink}
                        to={`/app/admin/notifications/manage`}
                        startIcon={<ArrowForwardIcon />}
                        sx={{ ml: 2, alignSelf: 'center' }}
                      >
                        View All
                      </Button>
                    </ListItem>
                    {index < Math.min(notifications.length, 10) - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No recent notifications
                </Typography>
                <Button
                  variant="outlined"
                  component={RouterLink}
                  to="/app/admin/notifications/create"
                  startIcon={<SendIcon />}
                  sx={{ mt: 2 }}
                >
                  Create Notification
                </Button>
              </Box>
            )}

          </Paper>
        </Grid>
      </Grid>
      
      {/* Upcoming Classes */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <ScheduleIcon sx={{ mr: 1 }} />
              Upcoming Classes
            </Typography>
            
            {scheduleLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
              </Box>
            ) : upcomingClasses.length > 0 ? (
              <List>
                {upcomingClasses.map((classItem, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemIcon>
                        <ScheduleIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={classItem.subject?.name || classItem.subject || 'Unknown Subject'}
                        secondary={`${classItem.startTime || 'TBD'} - ${classItem.endTime || 'TBD'} | ${classItem.day || 'TBD'}`}
                      />
                    </ListItem>
                    {index < upcomingClasses.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ScheduleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  No upcoming classes
                </Typography>
                <Button
                  variant="outlined"
                  component={RouterLink}
                  to="/app/admin/schedule"
                  startIcon={<ScheduleIcon />}
                  sx={{ mt: 2 }}
                >
                  View Schedule
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Quick Actions Only */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  component={RouterLink}
                  to="/app/admin/users/create"
                  startIcon={<PersonIcon />}
                  sx={{ py: 1.5, justifyContent: 'flex-start' }}
                >
                  Add New User
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  component={RouterLink}
                  to="/app/admin/schools"
                  startIcon={<SchoolIcon />}
                  sx={{ py: 1.5, justifyContent: 'flex-start' }}
                >
                  Manage Schools
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  component={RouterLink}
                  to="/app/notifications/create"
                  startIcon={<SendIcon />}
                  sx={{ py: 1.5, justifyContent: 'flex-start' }}
                >
                  Send Notification
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  component={RouterLink}
                  to="/app/admin/classes"
                  startIcon={<ClassIcon />}
                  sx={{ py: 1.5, justifyContent: 'flex-start' }}
                >
                  Manage Classes
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
