import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Typography, 
  Grid, 
  Paper, 
  Box, 
  Card, 
  Chip,
  CardContent,
  CardHeader,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Divider,
  Avatar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import {
  School as SchoolIcon,
  Group as GroupIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  ArrowForward as ArrowForwardIcon,
  PeopleAlt as PeopleAltIcon,
  SupervisorAccount as SupervisorAccountIcon,
  Face as FaceIcon,
  Assessment as AssessmentIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Class as ClassIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Import action creators
import { getUsers } from '../../features/users/userSlice';
import { getSchools } from '../../features/schools/schoolSlice';
import { getMyNotifications } from '../../features/notifications/notificationSlice';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  // Get data from Redux store
  const { users } = useSelector((state) => state.users);
  const { schools } = useSelector((state) => state.schools);
  const { notifications } = useSelector((state) => state.notifications);
  
  // Loading and error states
  const { isLoading: usersLoading, isError: usersError } = useSelector((state) => state.users);
  const { isLoading: schoolsLoading, isError: schoolsError } = useSelector((state) => state.schools);
  const { isLoading: notificationsLoading, isError: notificationsError } = useSelector((state) => state.notifications);
  
  const isLoading = usersLoading || schoolsLoading || notificationsLoading;
  const hasError = usersError || schoolsError || notificationsError;
  
  // Debug logs to track data loading
  console.log('Admin Dashboard state:', {
    dataLoading: isLoading, 
    dataError: hasError,
    users: users ? users.length : 'null/undefined',
    schools: schools ? schools.length : 'null/undefined',
    notifications: notifications ? notifications.length : 'null/undefined'
  });
  
  // Calculate stats from real data
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalSchools: 0,
    totalNotifications: 0
  });
  
  // Search state for user contact directory
  const [nameSearch, setNameSearch] = useState('');
  
  // Filtered users for contact directory
  const getFilteredUsers = useCallback(() => {
    if (!Array.isArray(users)) return [];
    
    console.log('Filtering users with search term:', nameSearch);
    console.log('Sample user data:', users.length > 0 ? users[0] : 'No users');
    
    return users.filter(user => {
      // Filter by name search
      if (nameSearch && nameSearch.trim() !== '') {
        const searchTerm = nameSearch.toLowerCase().trim();
        const userName = (user.name || '').toLowerCase();
        const userEmail = (user.email || '').toLowerCase();
        
        return userName.includes(searchTerm) || userEmail.includes(searchTerm);
      }
      
      return true;
    });
  }, [users, nameSearch]);
  
  // Update stats when data changes
  useEffect(() => {
    // Safely calculate counts even if data is missing
    const studentCount = Array.isArray(users) ? users.filter(user => user && user.role === 'student').length : 0;
    const teacherCount = Array.isArray(users) ? users.filter(user => user && user.role === 'teacher').length : 0;
    const schoolCount = Array.isArray(schools) ? schools.length : 0;
    const notificationCount = Array.isArray(notifications) ? notifications.length : 0;
    
    setStats({
      totalStudents: studentCount,
      totalTeachers: teacherCount,
      totalSchools: schoolCount,
      totalNotifications: notificationCount
    });
  }, [users, schools, notifications]);
  
  // Fetch data on component mount with force refresh  
  useEffect(() => {
    console.log('AdminDashboard - Initial data fetch');
    
    // Now fetch fresh data
    dispatch(getUsers());
    dispatch(getSchools());
    dispatch(getMyNotifications());
  }, [dispatch]);
  
  // Function to retry loading data
  const handleRetryDataLoad = () => {
    console.log('Retrying data load...');
    // Force clear any persisted data that might be causing issues
    try {
      localStorage.removeItem('persist:users');
      localStorage.removeItem('persist:schools');
      localStorage.removeItem('persist:notifications');
    } catch (e) {
      console.error('Error clearing localStorage:', e);
    }
    
    // Dispatch data loading actions again
    dispatch(getUsers());
    dispatch(getSchools());
    dispatch(getMyNotifications());
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
      
      {/* User Contact Directory - Full Width */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%', overflow: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <PeopleAltIcon sx={{ mr: 1 }} />
              User Contact Directory
            </Typography>
            
            {/* Name Search Bar */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder="Search users by name or email..."
                  value={nameSearch}
                  onChange={(e) => setNameSearch(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                  }}
                />
              </Grid>
            </Grid>
            
            {/* User Contact List */}
            <Typography variant="subtitle1" gutterBottom>Contact Information Directory</Typography>
            <List sx={{ maxHeight: 500, overflow: 'auto', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 2 }}>
              {getFilteredUsers().length > 0 ? (
                getFilteredUsers().map((user) => (
                  <ListItem key={user._id} divider>
                    <ListItemIcon>
                      <Avatar sx={{ 
                        width: 48, 
                        height: 48,
                        bgcolor: user.role === 'student' ? 'primary.main' : 
                                 user.role === 'teacher' ? 'secondary.main' : 
                                 user.role === 'admin' ? 'success.main' : 
                                 user.role === 'secretary' ? 'info.main' : 'grey.500',
                        borderRadius: 2,
                        fontWeight: 'bold'
                      }}>
                        {user.name ? user.name[0].toUpperCase() : '?'}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold' }}>
                          {user.name} 
                          <Chip 
                            label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            size="small"
                            sx={{ 
                              ml: 1, 
                              height: 24,
                              fontSize: '0.75rem',
                              bgcolor: user.role === 'student' ? 'primary.light' : 
                                       user.role === 'teacher' ? 'secondary.light' : 
                                       user.role === 'admin' ? 'success.light' : 
                                       user.role === 'secretary' ? 'info.light' : 'grey.200'
                            }}
                          />
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { xs: 'flex-start', sm: 'center' } }}>
                            {/* Email */}
                            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                              <EmailIcon fontSize="small" sx={{ color: 'primary.main', mr: 1 }} />
                              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                {user.personalEmail || user.email || 'No email provided'}
                              </Typography>
                            </Box>
                            
                            {/* Phone */}
                            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                              <PhoneIcon fontSize="small" sx={{ color: 'secondary.main', mr: 1 }} />
                              <Typography variant="body2">
                                {user.mobilePhone || user.phone || 'No phone provided'}
                              </Typography>
                            </Box>
                          </Box>
                          
                          {/* School Information */}
                          {Array.isArray(user.schools) && user.schools.length > 0 && (
                            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                              <SchoolIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                              {(schools || []).filter(s => user.schools.includes(s._id)).map(s => (
                                <Chip 
                                  key={s._id} 
                                  label={s.name} 
                                  size="small" 
                                  variant="outlined" 
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
                      } 
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText 
                    primary={nameSearch ? "No users match your search" : "No users found"} 
                    sx={{ textAlign: 'center', py: 4 }}
                  />
                </ListItem>
              )}
            </List>
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
