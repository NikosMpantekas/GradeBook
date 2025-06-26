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
  Button
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  MenuBook as SubjectIcon,
  Grade as GradeIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config/appConfig';

const StudentDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    studentInfo: null,
    grades: [],
    notifications: [],
    subjects: [],
    upcomingClasses: []
  });
  
  const { user, token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Fetch student profile info
      const profileResponse = await axios.get(`${API_URL}/api/users/profile`, config);
      console.log('Student profile data:', profileResponse.data);

      // Fetch recent grades
      const gradesResponse = await axios.get(`${API_URL}/api/grades/student`, config);
      console.log('Student grades data:', gradesResponse.data);

      // Fetch recent notifications
      const notificationsResponse = await axios.get(`${API_URL}/api/notifications?limit=5`, config);
      console.log('Student notifications data:', notificationsResponse.data);

      // Fetch student's subjects from their classes
      const classesResponse = await axios.get(`${API_URL}/api/classes/my-classes`, config);
      console.log('Student classes data:', classesResponse.data);

      // Fetch schedule for upcoming classes
      const scheduleResponse = await axios.get(`${API_URL}/api/schedule`, config);
      console.log('Student schedule data:', scheduleResponse.data);

      setDashboardData({
        studentInfo: profileResponse.data,
        grades: gradesResponse.data?.grades?.slice(0, 5) || [],
        notifications: notificationsResponse.data?.notifications?.slice(0, 3) || [],
        subjects: classesResponse.data?.map(cls => cls.subject).filter((subject, index, self) => 
          self.findIndex(s => s._id === subject._id) === index
        ) || [],
        upcomingClasses: scheduleResponse.data ? Object.values(scheduleResponse.data).flat().slice(0, 3) : []
      });

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
          Welcome back, {dashboardData.studentInfo?.name || 'Student'}!
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Student Info Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  mx: 'auto', 
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '2rem'
                }}
              >
                {dashboardData.studentInfo?.name?.charAt(0) || 'S'}
              </Avatar>
              <Typography variant="h6" gutterBottom>
                {dashboardData.studentInfo?.name || 'Student Name'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {dashboardData.studentInfo?.email || 'No email'}
              </Typography>
              
              {/* School Branch Info */}
              {dashboardData.studentInfo?.schoolBranch && (
                <Box sx={{ mt: 2 }}>
                  <Chip
                    icon={<SchoolIcon />}
                    label={dashboardData.studentInfo.schoolBranch.name || 'School Branch'}
                    color="primary"
                    variant="outlined"
                    sx={{ mb: 1 }}
                  />
                </Box>
              )}
              
              <Button
                variant="contained"
                startIcon={<PersonIcon />}
                onClick={() => navigate('/app/profile')}
                sx={{ mt: 2 }}
                fullWidth
              >
                View Profile
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Academic Overview */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon sx={{ mr: 1 }} />
                Academic Overview
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                    <Typography variant="h4" fontWeight="bold">
                      {dashboardData.grades.length}
                    </Typography>
                    <Typography variant="body2">
                      Total Grades
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
                    <Typography variant="h4" fontWeight="bold">
                      {getGradeAverage()}
                    </Typography>
                    <Typography variant="body2">
                      Average Grade
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'info.contrastText' }}>
                    <Typography variant="h4" fontWeight="bold">
                      {dashboardData.subjects.length}
                    </Typography>
                    <Typography variant="body2">
                      Subjects
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                    <Typography variant="h4" fontWeight="bold">
                      {dashboardData.notifications.filter(n => !n.isRead).length}
                    </Typography>
                    <Typography variant="body2">
                      Unread Notifications
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* My Subjects */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <SubjectIcon sx={{ mr: 1 }} />
                My Subjects
              </Typography>
              
              {dashboardData.subjects.length > 0 ? (
                <List dense>
                  {dashboardData.subjects.map((subject, index) => (
                    <ListItem key={subject._id || index} divider={index < dashboardData.subjects.length - 1}>
                      <ListItemIcon>
                        <SubjectIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={subject.name || 'Unknown Subject'}
                        secondary={subject.description || 'No description'}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No subjects found
                </Typography>
              )}
              
              <Button
                variant="outlined"
                startIcon={<ScheduleIcon />}
                onClick={() => navigate('/app/schedule')}
                fullWidth
                sx={{ mt: 2 }}
              >
                View Schedule
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Grades */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <GradeIcon sx={{ mr: 1 }} />
                Recent Grades
              </Typography>
              
              {dashboardData.grades.length > 0 ? (
                <List dense>
                  {dashboardData.grades.map((grade, index) => (
                    <ListItem key={grade._id || index} divider={index < dashboardData.grades.length - 1}>
                      <ListItemText
                        primary={grade.subject?.name || 'Unknown Subject'}
                        secondary={`Grade: ${grade.value}/20 - ${new Date(grade.createdAt).toLocaleDateString()}`}
                      />
                      <Chip
                        label={grade.value}
                        color={grade.value >= 15 ? 'success' : grade.value >= 10 ? 'warning' : 'error'}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No grades yet
                </Typography>
              )}
              
              <Button
                variant="outlined"
                startIcon={<GradeIcon />}
                onClick={() => navigate('/app/grades')}
                fullWidth
                sx={{ mt: 2 }}
              >
                View All Grades
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Notifications */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <NotificationsIcon sx={{ mr: 1 }} />
                Recent Notifications
              </Typography>
              
              {dashboardData.notifications.length > 0 ? (
                <List>
                  {dashboardData.notifications.map((notification, index) => (
                    <ListItem key={notification._id || index} divider={index < dashboardData.notifications.length - 1}>
                      <ListItemText
                        primary={notification.title || 'No title'}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {notification.message || 'No message'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(notification.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                      {!notification.isRead && (
                        <Chip label="New" color="primary" size="small" />
                      )}
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No notifications
                </Typography>
              )}
              
              <Button
                variant="outlined"
                startIcon={<NotificationsIcon />}
                onClick={() => navigate('/app/notifications')}
                fullWidth
                sx={{ mt: 2 }}
              >
                View All Notifications
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default StudentDashboard;
