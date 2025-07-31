import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Paper,
  CircularProgress,
  Alert,
  Container,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  CardHeader,
  CardActions,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  ListItemButton
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  MenuBook as SubjectIcon,
  Grade as GradeIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  PeopleAlt as PeopleAltIcon,
  SupervisorAccount as SupervisorAccountIcon,
  Face as FaceIcon,
  Assessment as AssessmentIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Send as SendIcon,
  Class as ClassIcon,
  Search as SearchIcon,
  ArrowForward as ArrowForwardIcon,
  AssignmentTurnedIn as AssignmentIcon,
  AdminPanelSettings as AdminIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/appConfig';

const UnifiedDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    userInfo: null,
    grades: [],
    notifications: [],
    subjects: [],
    upcomingClasses: [],
    stats: {},
    users: [],
    quickActions: []
  });
  
  const { user } = useSelector((state) => state.auth);
  const token = user?.token; // Token is INSIDE user object, not separate field
  const navigate = useNavigate();

  // Debug logging
  console.log('UNIFIED DASHBOARD - Component mounted');
  console.log('UNIFIED DASHBOARD - User:', user);
  console.log('UNIFIED DASHBOARD - Token from user object:', token ? 'Present' : 'Missing');
  console.log('UNIFIED DASHBOARD - User role:', user?.role);
  console.log('UNIFIED DASHBOARD - Current URL:', window.location.href);
  console.log('UNIFIED DASHBOARD - Current pathname:', window.location.pathname);

  useEffect(() => {
    console.log('=== UNIFIED DASHBOARD useEffect START ===');
    console.log('UNIFIED DASHBOARD - useEffect triggered at:', new Date().toISOString());
    console.log('UNIFIED DASHBOARD - User in useEffect:', user);
    console.log('UNIFIED DASHBOARD - Token from user object:', token ? 'Present' : 'Missing');
    console.log('UNIFIED DASHBOARD - Current location:', window.location.href);
    
    // Emergency check for authentication state
    const localUser = localStorage.getItem('user');
    const sessionUser = sessionStorage.getItem('user');
    console.log('UNIFIED DASHBOARD - localStorage user exists:', !!localUser);
    console.log('UNIFIED DASHBOARD - sessionStorage user exists:', !!sessionUser);
    
    if (!user || !token) {
      console.error('=== EMERGENCY: NO USER OR TOKEN DETECTED ===');
      console.error('User object:', user);
      console.error('Token value (from user.token):', token);
      console.error('About to redirect to /login from:', window.location.pathname);
      console.error('Redux auth state might be corrupted or not hydrated');
      
      // Don't navigate if we're already at login to prevent loops
      if (window.location.pathname !== '/login') {
        console.error('NAVIGATING TO LOGIN...');
        navigate('/login');
      } else {
        console.error('ALREADY AT LOGIN - NOT NAVIGATING');
      }
      return;
    }
    
    console.log('=== AUTH CHECK PASSED - FETCHING DATA ===');
    console.log('User role confirmed:', user.role);
    console.log('Token confirmed present from user object');
    
    fetchDashboardData();
    console.log('=== UNIFIED DASHBOARD useEffect END ===');
  }, [user, token]);

  const fetchDashboardData = async () => {
    try {
      console.log('UNIFIED DASHBOARD - Starting fetchDashboardData');
      console.log('UNIFIED DASHBOARD - API_URL:', API_URL);
      
      setLoading(true);
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      console.log('UNIFIED DASHBOARD - Request config:', config);
      console.log('Fetching dashboard data for role:', user?.role);
      
      const notificationsEndpoint = user?.role === 'student'
        ? `${API_URL}/api/notifications?limit=5`
        : `${API_URL}/api/notifications?limit=5`;

      // Common data for all roles
      console.log('UNIFIED DASHBOARD - Making common API calls...');
      const commonPromises = [
        axios.get(`${API_URL}/api/users/profile`, config),
        axios.get(notificationsEndpoint, config),
        axios.get(`${API_URL}/api/schedule`, config)
      ];

      // Role-specific data
      let roleSpecificPromises = [];
      
      console.log('UNIFIED DASHBOARD - Setting up role-specific calls for:', user?.role);
      if (user?.role === 'student') {
        console.log('UNIFIED DASHBOARD - Adding student-specific API calls');
        roleSpecificPromises = [
          axios.get(`${API_URL}/api/grades/student`, config),
          axios.get(`${API_URL}/api/classes/my-classes`, config)
        ];
      } else if (user?.role === 'teacher') {
        console.log('UNIFIED DASHBOARD - Adding teacher-specific API calls');
        roleSpecificPromises = [
          axios.get(`${API_URL}/api/grades/teacher`, config),
          axios.get(`${API_URL}/api/classes/my-teaching-classes`, config)
        ];
      } else if (user?.role === 'admin') {
        console.log('UNIFIED DASHBOARD - Adding admin-specific API calls');
        roleSpecificPromises = [
          axios.get(`${API_URL}/api/users`, config),
          axios.get(`${API_URL}/api/stats/overview`, config).catch(() => ({ data: {} }))
        ];
      }

      console.log('UNIFIED DASHBOARD - Making all API calls...');
      const [profileResponse, notificationsResponse, scheduleResponse, ...roleData] = await Promise.all([
        ...commonPromises,
        ...roleSpecificPromises
      ]);

      console.log('UNIFIED DASHBOARD - API responses received');
      console.log('Profile data:', profileResponse.data);
      console.log('Notifications data:', notificationsResponse.data);
      console.log('Schedule data:', scheduleResponse.data);
      console.log('Role-specific data count:', roleData.length);

      // Process schedule data (robust to both possible API shapes)
      const weekDays = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
      let scheduleObj = null;
      if (scheduleResponse.data && scheduleResponse.data.schedule) {
        scheduleObj = scheduleResponse.data.schedule;
      } else if (scheduleResponse.data && scheduleResponse.data.success && typeof scheduleResponse.data === 'object') {
        // If top-level keys are weekdays, extract them
        scheduleObj = Object.fromEntries(Object.entries(scheduleResponse.data).filter(([k]) => weekDays.includes(k)));
      }
      const upcomingClasses = scheduleObj
        ? Object.values(scheduleObj).flat().slice(0, 3)
        : [];

      let processedData = {
        userInfo: profileResponse.data,
        notifications: notificationsResponse.data?.notifications?.slice(0, 3) || [],
        upcomingClasses,
        grades: [],
        subjects: [],
        users: [],
        stats: {}
      };

      // Process role-specific data
      if (user?.role === 'student' && roleData.length >= 2) {
        const [gradesResponse, classesResponse] = roleData;
        processedData.grades = gradesResponse.data?.grades?.slice(0, 5) || [];
        processedData.subjects = classesResponse.data?.map(cls => cls.subject).filter((subject, index, self) => 
          self.findIndex(s => s._id === subject._id) === index
        ) || [];
        console.log('Student classes data:', classesResponse.data);
        console.log('Student subjects:', processedData.subjects);
      } else if (user?.role === 'teacher' && roleData.length >= 2) {
        const [gradesResponse, classesResponse] = roleData;
        processedData.grades = gradesResponse.data?.grades?.slice(0, 5) || [];
        processedData.subjects = classesResponse.data?.map(cls => cls.subject).filter((subject, index, self) => 
          self.findIndex(s => s._id === subject._id) === index
        ) || [];
      } else if (user?.role === 'admin' && roleData.length >= 1) {
        const [usersResponse, statsResponse] = roleData;
        processedData.users = usersResponse.data?.slice(0, 5) || [];
        processedData.stats = statsResponse?.data || {};
      }

      setDashboardData(processedData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getGradeAverage = () => {
    if (dashboardData.grades.length === 0) return 'N/A';
    const sum = dashboardData.grades.reduce((acc, grade) => acc + grade.value, 0);
    return (sum / dashboardData.grades.length).toFixed(1);
  };

  const getWelcomeMessage = () => {
    const role = user?.role;
    const name = user?.name || 'User';
    
    switch (role) {
      case 'student':
        return `Welcome back, ${name}! Ready to learn?`;
      case 'teacher':
        return `Welcome back, ${name}! Ready to teach?`;
      case 'admin':
        return `Welcome back, ${name}! School management at your fingertips.`;
      default:
        return `Welcome back, ${name}!`;
    }
  };

  const getQuickActions = () => {
    const role = user?.role;
    
    switch (role) {
      case 'student':
        return [
          { label: 'View My Grades', icon: <GradeIcon />, path: '/app/grades' },
          { label: 'My Schedule', icon: <ScheduleIcon />, path: '/app/schedule' },
          { label: 'Submit Rating', icon: <AssignmentIcon />, path: '/app/ratings' },
          { label: 'View Notifications', icon: <NotificationsIcon />, path: '/app/notifications' }
        ];
      case 'teacher':
        return [
          { label: 'Manage Grades', icon: <GradeIcon />, path: '/app/teacher/grades/manage' },
          { label: 'Create Grade', icon: <AssignmentIcon />, path: '/app/teacher/grades/create' },
          { label: 'Send Notification', icon: <NotificationsIcon />, path: '/app/teacher/notifications/create' },
          { label: 'View Schedule', icon: <ScheduleIcon />, path: '/app/schedule' }
        ];
      case 'admin':
        return [
          { label: 'Manage Users', icon: <GroupIcon />, path: '/app/admin/users' },
          { label: 'Manage Classes', icon: <ClassIcon />, path: '/app/admin/classes' },
          { label: 'Send Notification', icon: <NotificationsIcon />, path: '/app/admin/notifications/create' },
          { label: 'View Statistics', icon: <BarChartIcon />, path: '/app/admin/student-stats' }
        ];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 2, mb: 2, px: { xs: 2, sm: 3 } }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 2, mb: 2, px: { xs: 2, sm: 3 } }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 2, px: { xs: 2, sm: 3 } }}>
      {/* Header Section */}
      <Box sx={{ mb: { xs: 2, sm: 4 } }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          <DashboardIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          {getWelcomeMessage()}
        </Typography>
      </Box>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* User Info Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <PersonIcon />
                </Avatar>
              }
              title="Profile Information"
              subheader={`${user?.role?.charAt(0).toUpperCase()}${user?.role?.slice(1)} Account`}
            />
            <CardContent>
              <Typography variant="body1" gutterBottom>
                <strong>Name:</strong> {dashboardData.userInfo?.name || user?.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Email:</strong> {dashboardData.userInfo?.email || user?.email}
              </Typography>
              {dashboardData.userInfo?.schoolBranch && (
                <Typography variant="body1" gutterBottom>
                  <strong>School Branch:</strong> {dashboardData.userInfo.schoolBranch.name}
                </Typography>
              )}
              {user?.role === 'student' && (
                <Typography variant="body1" gutterBottom>
                  <strong>Grade Average:</strong> {getGradeAverage()}
                </Typography>
              )}
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => navigate('/app/profile')}>
                View Full Profile
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="Quick Actions" sx={{ pb: { xs: 1, sm: 2 } }} />
            <CardContent>
              <Grid container spacing={{ xs: 1, sm: 2 }}>
                {getQuickActions().map((action, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={action.icon}
                      onClick={() => navigate(action.path)}
                      sx={{ 
                        py: { xs: 1, sm: 1.5 },
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        minHeight: { xs: '40px', sm: '48px' }
                      }}
                    >
                      {action.label}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Notifications */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Recent Notifications" 
              sx={{ pb: { xs: 1, sm: 2 } }}
              action={
                <Button 
                  size="small" 
                  onClick={() => navigate('/app/notifications')}
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  View All
                </Button>
              }
            />
            <CardContent sx={{ pt: { xs: 1, sm: 2 } }}>
              {dashboardData.notifications.length > 0 ? (
                <List>
                  {dashboardData.notifications.map((notification, index) => (
                    <React.Fragment key={notification._id}>
                      <ListItem sx={{ px: { xs: 1, sm: 2 } }}>
                        <ListItemIcon>
                          <NotificationsIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={notification.title}
                          primaryTypographyProps={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                          secondary={new Date(notification.createdAt).toLocaleDateString()}
                          secondaryTypographyProps={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                        />
                      </ListItem>
                      {index < dashboardData.notifications.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No recent notifications
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Role-specific content */}
        {user?.role === 'student' && (
          <>
            {/* Student Subjects */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="My Subjects" sx={{ pb: { xs: 1, sm: 2 } }} />
                <CardContent sx={{ pt: { xs: 1, sm: 2 } }}>
                  {dashboardData.subjects.length > 0 ? (
                    <Stack direction="row" spacing={{ xs: 0.5, sm: 1 }} flexWrap="wrap" gap={{ xs: 0.5, sm: 1 }}>
                      {dashboardData.subjects.map((subject) => (
                        <Chip
                          key={subject._id}
                          label={subject.name}
                          icon={<SubjectIcon />}
                          variant="outlined"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                        />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No subjects found
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Grades */}
            <Grid item xs={12}>
              <Card>
                <CardHeader 
                  title="Recent Grades" 
                  sx={{ pb: { xs: 1, sm: 2 } }}
                  action={
                    <Button 
                      size="small" 
                      onClick={() => navigate('/app/grades')}
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      View All
                    </Button>
                  }
                />
                <CardContent sx={{ pt: { xs: 1, sm: 2 } }}>
                  {dashboardData.grades.length > 0 ? (
                    <List>
                      {dashboardData.grades.map((grade, index) => (
                        <React.Fragment key={grade._id}>
                          <ListItem sx={{ px: { xs: 1, sm: 2 } }}>
                            <ListItemIcon>
                              <GradeIcon />
                            </ListItemIcon>
                            <ListItemText
                              primary={`${grade.subject?.name} - ${grade.value}/10`}
                              primaryTypographyProps={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                              secondary={`${grade.category} - ${new Date(grade.createdAt).toLocaleDateString()}`}
                              secondaryTypographyProps={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                            />
                          </ListItem>
                          {index < dashboardData.grades.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No grades available
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </>
        )}

        {user?.role === 'teacher' && (
          <>
            {/* Teacher Subjects */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Teaching Subjects" sx={{ pb: { xs: 1, sm: 2 } }} />
                <CardContent sx={{ pt: { xs: 1, sm: 2 } }}>
                  {dashboardData.subjects.length > 0 ? (
                    <Stack direction="row" spacing={{ xs: 0.5, sm: 1 }} flexWrap="wrap" gap={{ xs: 0.5, sm: 1 }}>
                      {dashboardData.subjects.map((subject) => (
                        <Chip
                          key={subject._id}
                          label={subject.name}
                          icon={<SubjectIcon />}
                          variant="outlined"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                        />
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No assigned subjects
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </>
        )}

        {user?.role === 'admin' && (
          <>
            {/* User Overview */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader 
                  title="User Overview" 
                  sx={{ pb: { xs: 1, sm: 2 } }}
                  action={
                    <Button 
                      size="small" 
                      onClick={() => navigate('/app/admin/users')}
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Manage Users
                    </Button>
                  }
                />
                <CardContent sx={{ pt: { xs: 1, sm: 2 } }}>
                  {dashboardData.users.length > 0 ? (
                    <List>
                      {dashboardData.users.map((user, index) => (
                        <React.Fragment key={user._id}>
                          <ListItem sx={{ px: { xs: 1, sm: 2 } }}>
                            <ListItemIcon>
                              {user.role === 'student' ? <FaceIcon /> : 
                               user.role === 'teacher' ? <SupervisorAccountIcon /> : <AdminIcon />}
                            </ListItemIcon>
                            <ListItemText
                              primary={user.name}
                              primaryTypographyProps={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                              secondary={`${user.role} - ${user.email}`}
                              secondaryTypographyProps={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                            />
                          </ListItem>
                          {index < dashboardData.users.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No users found
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </>
        )}

        {/* Upcoming Classes */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Upcoming Classes" 
              sx={{ pb: { xs: 1, sm: 2 } }}
              action={
                <Button 
                  size="small" 
                  onClick={() => navigate('/app/schedule')}
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  View Schedule
                </Button>
              }
            />
            <CardContent sx={{ pt: { xs: 1, sm: 2 } }}>
              {dashboardData.upcomingClasses.length > 0 ? (
                <List>
                  {dashboardData.upcomingClasses.map((classItem, index) => (
                    <React.Fragment key={index}>
                      <ListItem sx={{ px: { xs: 1, sm: 2 } }}>
                        <ListItemIcon>
                          <ScheduleIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={classItem.subject}
                          primaryTypographyProps={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                          secondary={`${classItem.startTime} - ${classItem.endTime} | ${classItem.day}`}
                          secondaryTypographyProps={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                        />
                      </ListItem>
                      {index < dashboardData.upcomingClasses.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No upcoming classes
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UnifiedDashboard;
