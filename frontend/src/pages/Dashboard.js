import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Typography, 
  Grid, 
  Paper, 
  Box, 
  Button, 
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Divider,
} from '@mui/material';
import {
  AssignmentTurnedIn as AssignmentIcon,
  Notifications as NotificationsIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { getMyNotifications } from '../features/notifications/notificationSlice';
import { getStudentGrades } from '../features/grades/gradeSlice';
import { getSchools } from '../features/schools/schoolSlice';
import { getDirections } from '../features/directions/directionSlice';
import { getSubjects } from '../features/subjects/subjectSlice';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { notifications, isLoading: notificationsLoading } = useSelector((state) => state.notifications);
  
  // Add debug log to track component mounting
  console.log('Dashboard component rendering with user:', user ? { role: user.role, name: user.name } : 'No user');
  
  // Basic navigation functions to ensure we have functionality even without Layout
  const goToProfile = () => navigate('/app/profile');
  const goToNotifications = () => navigate('/app/notifications');
  const goToGrades = () => navigate('/app/grades');
  const goToTeacherDashboard = () => navigate('/app/teacher');
  const goToAdminDashboard = () => navigate('/app/admin');
  const { grades, isLoading: gradesLoading } = useSelector((state) => state.grades);
  const { subjects } = useSelector((state) => state.subjects);
  const { schools } = useSelector((state) => state.schools);
  const { directions } = useSelector((state) => state.directions);

  const [recentNotifications, setRecentNotifications] = useState([]);
  const [recentGrades, setRecentGrades] = useState([]);
  const [userSchool, setUserSchool] = useState(null);
  const [userDirection, setUserDirection] = useState(null);
  const [userSubjects, setUserSubjects] = useState([]);

  useEffect(() => {
    if (user) {
      dispatch(getMyNotifications());
      
      if (user.role === 'student') {
        dispatch(getStudentGrades(user._id));
      }
      
      dispatch(getSchools());
      dispatch(getDirections());
      dispatch(getSubjects());
    }
  }, [user, dispatch]);

  useEffect(() => {
    // Get recent notifications (last 3)
    if (notifications && notifications.length > 0) {
      setRecentNotifications(notifications.slice(0, 3));
    }

    // Get recent grades (last 3)
    if (grades && grades.length > 0) {
      setRecentGrades(grades.slice(0, 3));
    }

    // Get user's school
    if (schools && user && user.school) {
      const school = schools.find(s => s._id === user.school);
      setUserSchool(school);
    }

    // Get user's direction
    if (directions && user && user.direction) {
      const direction = directions.find(d => d._id === user.direction);
      setUserDirection(direction);
    }

    // Get user's subjects
    if (subjects && user && user.subjects && user.subjects.length > 0) {
      const userSubjectsData = subjects.filter(s => user.subjects.includes(s._id));
      setUserSubjects(userSubjectsData);
    }
  }, [notifications, grades, schools, directions, subjects, user]);

  const getWelcomeMessage = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (notificationsLoading || gradesLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={3}>
        {/* Welcome Card */}
        <Grid item xs={12}>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              display: 'flex', 
              flexDirection: 'column',
              borderRadius: 2,
              background: theme => theme.palette.mode === 'dark' 
                ? 'linear-gradient(to right, #1e3c72, #2a5298)'
                : 'linear-gradient(to right, #4b6cb7, #182848)',
              color: 'white'
            }}
          >
            <Typography variant="h5" sx={{ mb: 1 }}>
              {getWelcomeMessage()}, {user?.name}!
            </Typography>
            <Typography variant="body1">
              Welcome to GradeBook - Your educational progress at a glance.
            </Typography>
          </Paper>
        </Grid>

        {/* User Info Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, height: '100%', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              My Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body1">
                  <strong>Role:</strong> {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1">
                  <strong>Email:</strong> {user?.email}
                </Typography>
              </Grid>
              {user?.role === 'student' && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="body1">
                      <strong>School:</strong> {userSchool ? userSchool.name : 'Not assigned'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body1">
                      <strong>Direction:</strong> {userDirection ? userDirection.name : 'Not assigned'}
                    </Typography>
                  </Grid>
                </>
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* Recent Activity Card */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, height: '100%', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Quick Links
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {user?.role === 'student' && (
                <Grid item xs={12}>
                  <Button 
                    variant="outlined" 
                    startIcon={<AssignmentIcon />}
                    onClick={() => navigate('/grades')}
                    fullWidth
                  >
                    View All Grades
                  </Button>
                </Grid>
              )}
              {user?.role === 'teacher' && (
                <>
                  <Grid item xs={12}>
                    <Button 
                      variant="outlined" 
                      startIcon={<AssignmentIcon />}
                      onClick={() => navigate('/teacher/grades/manage')}
                      fullWidth
                    >
                      Manage Grades
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Button 
                      variant="outlined" 
                      startIcon={<NotificationsIcon />}
                      onClick={() => navigate('/teacher/notifications/create')}
                      fullWidth
                    >
                      Send Notification
                    </Button>
                  </Grid>
                </>
              )}
              {user?.role === 'admin' && (
                <>
                  <Grid item xs={12}>
                    <Button 
                      variant="outlined" 
                      startIcon={<SchoolIcon />}
                      onClick={() => navigate('/admin/users')}
                      fullWidth
                    >
                      Manage Users
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Button 
                      variant="outlined" 
                      startIcon={<SchoolIcon />}
                      onClick={() => navigate('/admin/schools')}
                      fullWidth
                    >
                      Manage Schools
                    </Button>
                  </Grid>
                </>
              )}
              <Grid item xs={12}>
                <Button 
                  variant="outlined" 
                  startIcon={<NotificationsIcon />}
                  onClick={() => navigate('/notifications')}
                  fullWidth
                >
                  View Notifications
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Recent Notifications Section */}
        <Grid item xs={12} md={user?.role === 'student' ? 6 : 12}>
          <Paper elevation={2} sx={{ p: 2, height: '100%', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Recent Notifications
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {recentNotifications.length > 0 ? (
              <Grid container spacing={2}>
                {recentNotifications.map((notification) => (
                  <Grid item xs={12} key={notification._id}>
                    <Card variant="outlined">
                      <CardContent sx={{ py: 1.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {notification.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(notification.createdAt).toLocaleString()}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button 
                          size="small" 
                          onClick={() => navigate(`/notifications/${notification._id}`)}
                        >
                          View
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body1" color="text.secondary">
                No recent notifications.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Recent Grades Section (Students only) */}
        {user?.role === 'student' && (
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, height: '100%', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Recent Grades
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {recentGrades.length > 0 ? (
                <Grid container spacing={2}>
                  {recentGrades.map((grade) => (
                    <Grid item xs={12} key={grade._id}>
                      <Card variant="outlined">
                        <CardContent sx={{ py: 1.5 }}>
                          <Grid container alignItems="center">
                            <Grid item xs={8}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                {grade.subject?.name || 'Subject'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {grade.description || 'No description'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(grade.date).toLocaleDateString()}
                              </Typography>
                            </Grid>
                            <Grid item xs={4} sx={{ textAlign: 'center' }}>
                              <Typography 
                                variant="h5" 
                                sx={{ 
                                  fontWeight: 'bold',
                                  color: grade.value >= 50 ? 'success.main' : 'error.main',
                                }}
                              >
                                {grade.value}
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  No recent grades.
                </Typography>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard;
