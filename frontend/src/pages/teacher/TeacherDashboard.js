import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Paper,
  CircularProgress,
  Alert,
  Container,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  Chip,
  Stack,
  Avatar
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  Class as ClassIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  Today as TodayIcon,
  Assignment as GradeIcon,
  Send as SendIcon,
  School as SchoolIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config/appConfig';

const TeacherDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [teacherStats, setTeacherStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    pendingGrades: 0
  });
  
  const { user } = useSelector((state) => state.auth);
  const token = user?.token;
  const navigate = useNavigate();

  console.log('TEACHER DASHBOARD - Component mounted');
  console.log('TEACHER DASHBOARD - User:', user);
  console.log('TEACHER DASHBOARD - Token:', token ? 'Present' : 'Missing');

  useEffect(() => {
    if (!user || !token) {
      console.error('TEACHER DASHBOARD - No user or token, redirecting to login');
      navigate('/login');
      return;
    }
    
    if (user.role !== 'teacher' && user.role !== 'admin') {
      console.error('TEACHER DASHBOARD - User is not teacher or admin, redirecting to dashboard');
      navigate('/app/dashboard');
      return;
    }

    fetchTeacherDashboardData();
  }, [user, token, navigate]);

  const fetchTeacherDashboardData = async () => {
    try {
      console.log('TEACHER DASHBOARD - Starting data fetch');
      setLoading(true);
      setError(null);
      
      const config = {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      console.log('TEACHER DASHBOARD - Today:', todayStr, 'Day:', dayOfWeek);

      // Fetch today's schedule and notifications in parallel
      const promises = [
        // Get today's schedule
        axios.get(`${API_URL}/api/schedule`, config)
          .then(response => {
            console.log('TEACHER DASHBOARD - Schedule response:', response.data);
            // Extract today's classes from the schedule
            const scheduleData = response.data || {};
            const todayClasses = scheduleData[dayOfWeek] || [];
            return todayClasses;
          })
          .catch(error => {
            console.error('TEACHER DASHBOARD - Schedule fetch error:', error);
            return [];
          }),
        
        // Get unread notifications
        axios.get(`${API_URL}/api/notifications?unread=true&limit=5`, config)
          .then(response => {
            console.log('TEACHER DASHBOARD - Notifications response:', response.data);
            return response.data?.notifications || response.data || [];
          })
          .catch(error => {
            console.error('TEACHER DASHBOARD - Notifications fetch error:', error);
            return [];
          }),
          
        // Get basic teacher stats (optional - won't fail if endpoints don't exist)
        axios.get(`${API_URL}/api/classes/teacher/count`, config)
          .then(response => response.data?.count || 0)
          .catch(() => 0),
          
        axios.get(`${API_URL}/api/students/teacher/count`, config)
          .then(response => response.data?.count || 0)
          .catch(() => 0)
      ];

      const [schedule, notifications, classCount, studentCount] = await Promise.all(promises);
      
      console.log('TEACHER DASHBOARD - Processed data:', {
        schedule,
        notifications,
        classCount,
        studentCount
      });

      setTodaySchedule(schedule);
      setUnreadNotifications(notifications);
      setTeacherStats({
        totalClasses: classCount,
        totalStudents: studentCount,
        pendingGrades: 0 // Can be enhanced later
      });

    } catch (error) {
      console.error('TEACHER DASHBOARD - Error fetching data:', error);
      setError('Unable to load dashboard data. Some features may be unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    const name = user?.name || 'Teacher';
    
    if (hour < 12) return `Good morning, ${name}!`;
    if (hour < 17) return `Good afternoon, ${name}!`;
    return `Good evening, ${name}!`;
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return 'Time TBD';
    try {
      const [hours, minutes] = timeStr.split(':');
      const time = new Date();
      time.setHours(parseInt(hours), parseInt(minutes));
      return time.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (error) {
      return timeStr;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Loading your dashboard...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Welcome Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', color: 'white' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
            <DashboardIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold">
              {getWelcomeMessage()}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Teacher Dashboard - {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <ClassIcon color="primary" fontSize="large" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {teacherStats.totalClasses}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Classes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <PersonIcon color="success" fontSize="large" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {teacherStats.totalStudents}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Students
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <NotificationsIcon color="warning" fontSize="large" />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {unreadNotifications.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Unread Notifications
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Today's Schedule */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title={
                <Box display="flex" alignItems="center" gap={1}>
                  <TodayIcon color="primary" />
                  <Typography variant="h6">Today's Schedule</Typography>
                </Box>
              }
              action={
                <Button 
                  size="small" 
                  onClick={() => navigate('/app/teacher/schedule')}
                  startIcon={<ScheduleIcon />}
                >
                  View Full Schedule
                </Button>
              }
            />
            <CardContent>
              {todaySchedule.length > 0 ? (
                <List>
                  {todaySchedule.map((classItem, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemIcon>
                          <TimeIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {classItem.subject?.name || classItem.subject || 'Subject'}
                              </Typography>
                              <Chip 
                                label={`${formatTime(classItem.startTime)} - ${formatTime(classItem.endTime)}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary">
                              {classItem.class?.name || classItem.className || 'Class'} • 
                              {classItem.room || 'Room TBD'}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {index < todaySchedule.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={4}>
                  <ScheduleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No classes scheduled for today
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enjoy your free day!
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Unread Notifications */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title={
                <Box display="flex" alignItems="center" gap={1}>
                  <NotificationsIcon color="warning" />
                  <Typography variant="h6">Recent Notifications</Typography>
                </Box>
              }
              action={
                <Button 
                  size="small" 
                  onClick={() => navigate('/app/teacher/notifications')}
                  startIcon={<NotificationsIcon />}
                >
                  View All
                </Button>
              }
            />
            <CardContent>
              {unreadNotifications.length > 0 ? (
                <List>
                  {unreadNotifications.map((notification, index) => (
                    <React.Fragment key={notification._id || index}>
                      <ListItem>
                        <ListItemIcon>
                          <NotificationsIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" fontWeight="bold">
                              {notification.title || 'Notification'}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {notification.message || notification.content || 'No content'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {notification.createdAt ? 
                                  new Date(notification.createdAt).toLocaleDateString() : 
                                  'Recent'
                                }
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < unreadNotifications.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={4}>
                  <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No unread notifications
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    You're all caught up!
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title={
                <Box display="flex" alignItems="center" gap={1}>
                  <SchoolIcon color="primary" />
                  <Typography variant="h6">Quick Actions</Typography>
                </Box>
              }
            />
            <CardContent>
              <Stack direction="row" spacing={2} flexWrap="wrap" gap={2}>
                <Button
                  variant="contained"
                  startIcon={<GradeIcon />}
                  onClick={() => navigate('/app/teacher/grades/create')}
                  size="large"
                >
                  Add Grades
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<GradeIcon />}
                  onClick={() => navigate('/app/teacher/grades/manage')}
                  size="large"
                >
                  Manage Grades
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SendIcon />}
                  onClick={() => navigate('/app/teacher/notifications/create')}
                  size="large"
                >
                  Send Notification
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ScheduleIcon />}
                  onClick={() => navigate('/app/teacher/schedule')}
                  size="large"
                >
                  View Schedule
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TeacherDashboard;
