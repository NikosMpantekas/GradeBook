import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
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
  Stack
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Grade as GradeIcon,
  Notifications as NotificationsIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config/appConfig';

const StudentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentGrades, setRecentGrades] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  
  const { user } = useSelector((state) => state.auth);
  const token = user?.token;
  const navigate = useNavigate();

  console.log('STUDENT DASHBOARD - Component mounted');
  console.log('STUDENT DASHBOARD - User:', user);
  console.log('STUDENT DASHBOARD - Token:', token ? 'Present' : 'Missing');

  useEffect(() => {
    if (!user || !token) {
      console.error('STUDENT DASHBOARD - No user or token, redirecting to login');
      navigate('/login');
      return;
    }
    
    if (user.role !== 'student' && user.role !== 'admin') {
      console.error('STUDENT DASHBOARD - User is not student or admin, redirecting to dashboard');
      navigate('/app/dashboard');
      return;
    }

    fetchStudentDashboardData();
  }, [user, token, navigate]);

  const fetchStudentDashboardData = async () => {
    try {
      console.log('STUDENT DASHBOARD - Starting data fetch');
      setLoading(true);
      setError(null);
      
      const config = {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      // Fetch recent grades and notifications in parallel
      const promises = [
        // Get recent grades
        axios.get(`${API_URL}/api/grades/student`, config)
          .then(response => {
            console.log('STUDENT DASHBOARD - Grades response:', response.data);
            const grades = response.data?.grades || response.data || [];
            return Array.isArray(grades) ? grades.slice(0, 5) : [];
          })
          .catch(error => {
            console.error('STUDENT DASHBOARD - Grades fetch error:', error);
            return [];
          }),
        
        // Get received notifications
        axios.get(`${API_URL}/api/notifications?limit=5`, config)
          .then(response => {
            console.log('STUDENT DASHBOARD - Notifications response:', response.data);
            const notifications = response.data?.notifications || response.data || [];
            return Array.isArray(notifications) ? notifications.filter(n => !n.isRead) : [];
          })
          .catch(error => {
            console.error('STUDENT DASHBOARD - Notifications fetch error:', error);
            return [];
          })
      ];

      const [grades, notifications] = await Promise.all(promises);
      
      console.log('STUDENT DASHBOARD - Processed data:', { grades, notifications });
      
      setRecentGrades(grades);
      setUnreadNotifications(notifications);

    } catch (error) {
      console.error('STUDENT DASHBOARD - Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getGradeAverage = () => {
    if (recentGrades.length === 0) return 'N/A';
    const sum = recentGrades.reduce((acc, grade) => acc + grade.value, 0);
    return (sum / recentGrades.length).toFixed(1);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ my: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ my: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <DashboardIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            Student Dashboard
          </Typography>
        </Box>
        <Typography variant="h6" color="text.secondary">
          {getWelcomeMessage()}, {user?.name || 'Student'}! Here's your academic overview.
        </Typography>
      </Box>

      <Grid container spacing={3}>

        {/* Recent Grades */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title={
                <Box display="flex" alignItems="center" gap={1}>
                  <GradeIcon color="primary" />
                  <Typography variant="h6">Recent Grades</Typography>
                </Box>
              }
              action={
                <Button
                  variant="text"
                  size="small"
                  onClick={() => navigate('/app/student/grades')}
                  sx={{ minWidth: 'auto' }}
                >
                  View All
                </Button>
              }
            />
            <CardContent>
              {recentGrades.length > 0 ? (
                <List>
                  {recentGrades.map((grade, index) => (
                    <React.Fragment key={grade._id || index}>
                      <ListItem>
                        <ListItemIcon>
                          <AssignmentIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" fontWeight="bold">
                              {grade.subject?.name || 'Unknown Subject'}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Grade: {grade.value}/20
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {grade.createdAt ? 
                                  new Date(grade.createdAt).toLocaleDateString() : 
                                  'Recent'
                                }
                              </Typography>
                            </Box>
                          }
                        />
                        <Chip
                          label={grade.value}
                          color={grade.value >= 15 ? 'success' : grade.value >= 10 ? 'warning' : 'error'}
                          size="small"
                        />
                      </ListItem>
                      {index < recentGrades.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={4}>
                  <GradeIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No grades yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Your grades will appear here once teachers add them
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Notifications */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title={
                <Box display="flex" alignItems="center" gap={1}>
                  <NotificationsIcon color="primary" />
                  <Typography variant="h6">Recent Notifications</Typography>
                </Box>
              }
              action={
                <Button
                  variant="text"
                  size="small"
                  onClick={() => navigate('/app/student/notifications')}
                  sx={{ minWidth: 'auto' }}
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
                  onClick={() => navigate('/app/student/grades')}
                  size="large"
                >
                  View My Grades
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<NotificationsIcon />}
                  onClick={() => navigate('/app/student/notifications')}
                  size="large"
                >
                  View Notifications
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default StudentDashboard;
