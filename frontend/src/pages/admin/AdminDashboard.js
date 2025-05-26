import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Typography, 
  Grid, 
  Paper, 
  Box, 
  Card, 
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
  Alert
} from '@mui/material';
import {
  School as SchoolIcon,
  Group as GroupIcon,
  MenuBook as MenuBookIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  ArrowForward as ArrowForwardIcon,
  PeopleAlt as PeopleAltIcon,
  SupervisorAccount as SupervisorAccountIcon,
  Face as FaceIcon,
  Assessment as AssessmentIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Import action creators
import { getUsers } from '../../features/users/userSlice';
import { getSchools } from '../../features/schools/schoolSlice';
import { getSubjects } from '../../features/subjects/subjectSlice';
import { getDirections } from '../../features/directions/directionSlice';
import { getMyNotifications } from '../../features/notifications/notificationSlice';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  // Get data from Redux store
  const { users } = useSelector((state) => state.users);
  const { schools } = useSelector((state) => state.schools);
  const { subjects } = useSelector((state) => state.subjects);
  const { directions } = useSelector((state) => state.directions);
  const { notifications } = useSelector((state) => state.notifications);
  
  // Loading and error states
  const { isLoading: usersLoading, isError: usersError } = useSelector((state) => state.users);
  const { isLoading: schoolsLoading, isError: schoolsError } = useSelector((state) => state.schools);
  const { isLoading: subjectsLoading, isError: subjectsError } = useSelector((state) => state.subjects);
  const { isLoading: directionsLoading, isError: directionsError } = useSelector((state) => state.directions);
  const { isLoading: notificationsLoading, isError: notificationsError } = useSelector((state) => state.notifications);
  
  const isLoading = usersLoading || schoolsLoading || subjectsLoading || directionsLoading || notificationsLoading;
  const hasError = usersError || schoolsError || subjectsError || directionsError || notificationsError;
  
  // Debug logs to track data loading
  console.log('Admin Dashboard state:', {
    dataLoading: isLoading, 
    dataError: hasError,
    users: users ? users.length : 'null/undefined',
    schools: schools ? schools.length : 'null/undefined',
    subjects: subjects ? subjects.length : 'null/undefined',
    directions: directions ? directions.length : 'null/undefined',
    notifications: notifications ? notifications.length : 'null/undefined'
  });
  
  // Calculate stats from real data
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalSchools: 0,
    totalSubjects: 0,
    totalDirections: 0,
    totalNotifications: 0,
    recentUsers: []
  });
  
  // Filter state for user contact directory
  const [userFilter, setUserFilter] = useState(null);
  const [schoolFilter, setSchoolFilter] = useState(null);
  const [directionFilter, setDirectionFilter] = useState(null);
  
  // Filtered users for contact directory
  const filteredUsers = React.useMemo(() => {
    if (!Array.isArray(users)) return [];
    
    return users.filter(user => {
      // Filter by role
      if (userFilter && user.role !== userFilter) return false;
      
      // Filter by school
      if (schoolFilter && (!user.schools || !user.schools.includes(schoolFilter))) return false;
      
      // Filter by direction
      if (directionFilter && (!user.directions || !user.directions.includes(directionFilter))) return false;
      
      return true;
    });
  }, [users, userFilter, schoolFilter, directionFilter]);
  
  // Update stats when data changes
  useEffect(() => {
    // Safely calculate counts even if data is missing
    const studentCount = Array.isArray(users) ? users.filter(user => user && user.role === 'student').length : 0;
    const teacherCount = Array.isArray(users) ? users.filter(user => user && user.role === 'teacher').length : 0;
    const schoolCount = Array.isArray(schools) ? schools.length : 0;
    const subjectCount = Array.isArray(subjects) ? subjects.length : 0;
    const directionCount = Array.isArray(directions) ? directions.length : 0;
    const notificationCount = Array.isArray(notifications) ? notifications.length : 0;
    
    // Get recent users (at most 5)
    let recentUsersList = [];
    if (Array.isArray(users) && users.length > 0) {
      // Sort users by creation date (newest first)
      const sortedUsers = [...users]
        .filter(user => user && user.createdAt)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Take the first 5
      recentUsersList = sortedUsers.slice(0, 5).map(user => ({
        id: user._id,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        email: user.email,
        createdAt: user.createdAt
      }));
    }
    
    setStats({
      totalStudents: studentCount,
      totalTeachers: teacherCount,
      totalSchools: schoolCount,
      totalSubjects: subjectCount,
      totalDirections: directionCount,
      totalNotifications: notificationCount,
      recentUsers: recentUsersList
    });
  }, [users, schools, subjects, directions, notifications]);
  
  // Fetch data on component mount with force refresh  
  useEffect(() => {
    console.log('AdminDashboard - Initial data fetch');
    
    // Now fetch fresh data
    dispatch(getUsers());
    dispatch(getSchools());
    dispatch(getSubjects());
    dispatch(getDirections());
    dispatch(getMyNotifications());
  }, [dispatch]);
  
  // Function to retry loading data
  const handleRetryDataLoad = () => {
    console.log('Retrying data load...');
    // Force clear any persisted data that might be causing issues
    try {
      localStorage.removeItem('persist:users');
      localStorage.removeItem('persist:schools');
      localStorage.removeItem('persist:subjects');
      localStorage.removeItem('persist:directions');
      localStorage.removeItem('persist:notifications');
    } catch (e) {
      console.error('Error clearing localStorage:', e);
    }
    
    // Dispatch data loading actions again
    dispatch(getUsers());
    dispatch(getSchools());
    dispatch(getSubjects());
    dispatch(getDirections());
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
    labels: ['Schools', 'Directions', 'Subjects', 'Notifications'],
    datasets: [
      {
        label: 'Count',
        data: [stats.totalSchools, stats.totalDirections, stats.totalSubjects, stats.totalNotifications],
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
  const hasSubjects = Array.isArray(subjects) && subjects.length > 0;
  const hasDirections = Array.isArray(directions) && directions.length > 0;
  const hasNotifications = Array.isArray(notifications) && notifications.length > 0;
  
  // 2. Check if ALL data is missing - only show full error state in this case
  const allDataMissing = !hasUsers && !hasSchools && !hasSubjects && !hasDirections && !hasNotifications;
  
  // 3. Check if we have partial data load success
  const hasPartialData = (hasUsers || hasSchools || hasSubjects || hasDirections || hasNotifications);
  
  // Log the data availability for debugging
  console.log('Data availability:', {
    hasUsers,
    hasSchools,
    hasSubjects,
    hasDirections,
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
                Subjects
              </Typography>
              <Typography variant="h3" sx={{ my: 2 }}>
                {stats.totalSubjects}
              </Typography>
              <Button 
                variant="contained" 
                color="success" 
                fullWidth 
                component={RouterLink}
                to="/app/admin/subjects"
              >
                Manage Subjects
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.light', color: 'white', height: '100%' }}>
            <CardContent>
              <Typography variant="h5" component="div">
                Directions
              </Typography>
              <Typography variant="h3" sx={{ my: 2 }}>
                {stats.totalDirections}
              </Typography>
              <Button 
                variant="contained" 
                color="info" 
                fullWidth 
                component={RouterLink}
                to="/app/admin/directions"
              >
                Manage Directions
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Charts and Recent Users */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              User Distribution
            </Typography>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              <Pie data={userRolesData} />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%', overflow: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <PeopleAltIcon sx={{ mr: 1 }} />
              User Contact Directory
            </Typography>
            
            {/* Filtering Options */}
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Button 
                variant={!userFilter ? "contained" : "outlined"}
                size="small"
                onClick={() => setUserFilter(null)}
              >
                All Users
              </Button>
              <Button 
                variant={userFilter === 'student' ? "contained" : "outlined"}
                size="small"
                color="primary"
                onClick={() => setUserFilter('student')}
              >
                Students
              </Button>
              <Button 
                variant={userFilter === 'teacher' ? "contained" : "outlined"}
                size="small"
                color="secondary"
                onClick={() => setUserFilter('teacher')}
              >
                Teachers
              </Button>
            </Box>
            
            {/* School and Direction Filters */}
            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Button 
                variant={schoolFilter ? "contained" : "outlined"}
                size="small"
                color="success"
                endIcon={schoolFilter ? <CloseIcon /> : undefined}
                onClick={() => setSchoolFilter(schoolFilter ? null : (schools && schools.length > 0 ? schools[0]._id : null))}
              >
                {schoolFilter ? 
                  `School: ${(schools || []).find(s => s._id === schoolFilter)?.name || 'Unknown'}` : 
                  'Filter by School'}
              </Button>
              
              <Button 
                variant={directionFilter ? "contained" : "outlined"}
                size="small"
                color="info"
                endIcon={directionFilter ? <CloseIcon /> : undefined}
                onClick={() => setDirectionFilter(directionFilter ? null : (directions && directions.length > 0 ? directions[0]._id : null))}
              >
                {directionFilter ? 
                  `Direction: ${(directions || []).find(d => d._id === directionFilter)?.name || 'Unknown'}` : 
                  'Filter by Direction'}
              </Button>
            </Box>
            
            {/* User Contact List */}
            <List sx={{ maxHeight: 350, overflow: 'auto' }}>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <ListItem key={user._id} divider>
                    <ListItemIcon>
                      <Avatar sx={{ 
                        bgcolor: user.role === 'student' ? 'primary.main' : 
                                 user.role === 'teacher' ? 'secondary.main' : 
                                 user.role === 'admin' ? 'success.main' : 'grey.500'
                      }}>
                        {user.name ? user.name[0].toUpperCase() : '?'}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText 
                      primary={user.name} 
                      secondary={
                        <React.Fragment>
                          <Typography component="span" variant="body2" color="text.primary">
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </Typography>
                          {user.email && (
                            <Typography component="span" variant="body2" display="block">
                              <EmailIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: '1rem' }} />
                              {user.email}
                            </Typography>
                          )}
                          {user.phone && (
                            <Typography component="span" variant="body2" display="block">
                              <PhoneIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: '1rem' }} />
                              {user.phone}
                            </Typography>
                          )}
                          {Array.isArray(user.schools) && user.schools.length > 0 && (
                            <Typography component="span" variant="body2" display="block">
                              <SchoolIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: '1rem' }} />
                              {(schools || []).filter(s => user.schools.includes(s._id)).map(s => s.name).join(', ')}
                            </Typography>
                          )}
                        </React.Fragment>
                      } 
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No users match the current filters" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Recent Users
            </Typography>
            <List>
              {stats.recentUsers.length > 0 ? (
                stats.recentUsers.map((user) => (
                  <ListItem key={user.id} divider>
                    <ListItemIcon>
                      <Avatar>
                        {user.name ? user.name[0].toUpperCase() : '?'}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText 
                      primary={user.name} 
                      secondary={`${user.role.charAt(0).toUpperCase() + user.role.slice(1)} • ${user.email}`} 
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem>
                  <ListItemText primary="No recent users found" />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
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
              <Grid item xs={12} sm={6}>
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
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  component={RouterLink}
                  to="/app/admin/subjects"
                  startIcon={<MenuBookIcon />}
                  sx={{ py: 1.5, justifyContent: 'flex-start' }}
                >
                  Manage Subjects
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  component={RouterLink}
                  to="/app/admin/directions"
                  startIcon={<TrendingUpIcon />}
                  sx={{ py: 1.5, justifyContent: 'flex-start' }}
                >
                  Manage Directions
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
