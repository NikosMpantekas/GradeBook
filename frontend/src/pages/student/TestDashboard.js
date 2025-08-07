import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  useTheme,
  useMediaQuery,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Info as InfoIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  AccessTime as TimeIcon,
  Grade as GradeIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { format } from 'date-fns';
import axios from 'axios';
import { API_URL } from '../../config/appConfig';

const TestDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, token } = useSelector((state) => state.auth);
  const { darkMode } = useSelector((state) => state.ui);
  const dispatch = useDispatch();

  // State for real data
  const [notifications, setNotifications] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };

        // Fetch notifications
        const notificationsResponse = await axios.get(`${API_URL}/api/notifications`, config);
        setNotifications(notificationsResponse.data.slice(0, 5)); // Limit to 5

        // Fetch grades for chart
        const gradesResponse = await axios.get(`${API_URL}/api/grades`, config);
        setGrades(gradesResponse.data);

        // Fetch schedule for upcoming classes
        const scheduleResponse = await axios.get(`${API_URL}/api/schedule`, config);
        const scheduleData = scheduleResponse.data.schedule || {};
        
        // Convert schedule to upcoming classes format
        const classes = [];
        Object.keys(scheduleData).forEach(day => {
          const dayClasses = scheduleData[day] || [];
          dayClasses.forEach(classItem => {
            classes.push({
              id: classItem._id || Math.random(),
              subject: classItem.subject || 'Unknown Subject',
              teacher: classItem.teacherNames?.[0] || 'Unknown Teacher',
              time: `${classItem.startTime || '09:00'} - ${classItem.endTime || '10:30'}`,
              room: classItem.room || 'TBD',
              status: 'Scheduled',
              group: `${classItem.direction || 'Class'} • ${day}`
            });
          });
        });
        setUpcomingClasses(classes.slice(0, 5)); // Limit to 5

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user && token) {
      fetchData();
    }
  }, [user, token]);

  // Calculate grades statistics
  const calculateGradesStats = () => {
    if (!grades || grades.length === 0) return { average: 0, recent: 0, trend: 0 };
    
    const allGrades = grades.map(grade => grade.value || 0).filter(grade => grade > 0);
    const average = allGrades.length > 0 ? allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length : 0;
    
    // Recent grades (last 7 days)
    const recentGrades = grades
      .filter(grade => new Date(grade.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .map(grade => grade.value || 0)
      .filter(grade => grade > 0);
    const recent = recentGrades.length > 0 ? recentGrades.reduce((sum, grade) => sum + grade, 0) / recentGrades.length : 0;
    
    // Trend calculation
    const trend = recent > 0 && average > 0 ? ((recent - average) / average) * 100 : 0;
    
    return {
      average: Math.round(average),
      recent: Math.round(recent),
      trend: Math.round(trend)
    };
  };

  const stats = calculateGradesStats();

  const getStatusColor = (status) => {
    switch (status) {
      case 'For checking':
        return 'warning';
      case 'Accepted':
        return 'success';
      case 'Under revision':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusDot = (status) => {
    const color = getStatusColor(status);
    return (
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: `${color}.main`,
          mr: 1
        }}
      />
    );
  };

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Grid container spacing={3} sx={{ height: '100%' }}>
        {/* Left Sidebar - Student Profile */}
        <Grid item xs={12} md={3}>
          <Card 
            sx={{ 
              height: '100%',
              bgcolor: darkMode ? 'background.paper' : 'background.default',
              border: darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.12)'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              {/* Student Profile */}
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mx: 'auto',
                    mb: 2,
                    bgcolor: 'primary.main'
                  }}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                </Avatar>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                  {user?.name || 'Student Name'}
                </Typography>
                <Chip
                  label="Active"
                  color="success"
                  size="small"
                  sx={{ mb: 2 }}
                />
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Group: Class A
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Experience: Current Year
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Timezone: Local Time
                  </Typography>
                </Box>
              </Box>

              {/* Communication Tools */}
              <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 3 }}>
                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                  <Box component="span" sx={{ fontSize: '0.875rem' }}>📱</Box>
                </IconButton>
                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                  <Box component="span" sx={{ fontSize: '0.875rem' }}>📧</Box>
                </IconButton>
                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                  <Box component="span" sx={{ fontSize: '0.875rem' }}>📚</Box>
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Main Content Area */}
        <Grid item xs={12} md={9}>
          <Grid container spacing={3} sx={{ height: '100%' }}>
            {/* Flow Analytics Panel */}
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  height: '100%',
                  bgcolor: darkMode ? 'background.paper' : 'background.default',
                  border: darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.12)'
                }}
              >
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', flex: 1 }}>
                      Flow Analytics
                    </Typography>
                    <IconButton size="small" sx={{ color: 'text.secondary' }}>
                      <InfoIcon />
                    </IconButton>
                  </Box>

                  {/* Performance Metrics */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {stats.average}% Overall Grade Average
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {stats.recent}% Recent grades average
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {stats.trend >= 0 ? '+' : ''}{stats.trend}% Grade trend this week
                    </Typography>
                  </Box>

                  {/* Grades Chart */}
                  <Box
                    sx={{
                      flex: 1,
                      bgcolor: 'primary.main',
                      borderRadius: 2,
                      position: 'relative',
                      overflow: 'hidden',
                      minHeight: 200,
                      p: 2
                    }}
                  >
                    {grades.length > 0 ? (
                      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <Typography variant="h4" sx={{ color: 'white', textAlign: 'center', mb: 1, fontWeight: 'bold' }}>
                          {stats.average}%
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'white', textAlign: 'center', opacity: 0.8, mb: 2 }}>
                          Average Grade
                        </Typography>
                        
                        {/* Simple bar chart of recent grades */}
                        <Box sx={{ display: 'flex', alignItems: 'end', justifyContent: 'center', gap: 1, height: 80 }}>
                          {grades.slice(-5).map((grade, index) => (
                            <Box
                              key={index}
                              sx={{
                                width: 20,
                                height: `${(grade.value || 0) * 2}px`,
                                bgcolor: 'white',
                                borderRadius: '2px 2px 0 0',
                                opacity: 0.8,
                                minHeight: 4
                              }}
                            />
                          ))}
                        </Box>
                        
                        <Typography variant="caption" sx={{ color: 'white', textAlign: 'center', opacity: 0.6, mt: 1 }}>
                          Recent Grades
                        </Typography>
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          color: 'white',
                          textAlign: 'center'
                        }}
                      >
                        <GradeIcon sx={{ fontSize: 48, mb: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          No Grades Yet
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                          Your grades will appear here
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Notifications Panel */}
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  height: '100%',
                  bgcolor: darkMode ? 'background.paper' : 'background.default',
                  border: darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.12)'
                }}
              >
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', flex: 1 }}>
                      Notifications
                    </Typography>
                  </Box>

                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : error ? (
                    <Alert severity="error" sx={{ flex: 1 }}>
                      {error}
                    </Alert>
                  ) : notifications.length > 0 ? (
                    <List sx={{ flex: 1, overflow: 'auto' }}>
                      {notifications.map((notification, index) => (
                        <React.Fragment key={notification._id || index}>
                          <ListItem sx={{ px: 0, py: 1 }}>
                            <ListItemAvatar>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: notification.isImportant ? 'warning.main' : 'primary.main' }}>
                                <NotificationsIcon fontSize="small" />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {notification.title || 'No title'}
                                  </Typography>
                                  <IconButton size="small" sx={{ color: 'text.secondary' }}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {notification.content || notification.message || 'No content'}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">
                                      {notification.sender?.name || 'System'} • {format(new Date(notification.createdAt), 'MMM dd, HH:mm')}
                                    </Typography>
                                  </Box>
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < notifications.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        No notifications
                      </Typography>
                    </Box>
                  )}

                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Add new +
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Upcoming Classes Panel */}
            <Grid item xs={12}>
              <Card 
                sx={{ 
                  bgcolor: darkMode ? 'background.paper' : 'background.default',
                  border: darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.12)'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mr: 2 }}>
                        Upcoming Classes
                      </Typography>
                      <IconButton size="small" sx={{ color: 'text.secondary' }}>
                        <InfoIcon />
                      </IconButton>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>All modules</InputLabel>
                        <Select value="" label="All modules">
                          <MenuItem value="">All modules</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>All tasks</InputLabel>
                        <Select value="" label="All tasks">
                          <MenuItem value="">All tasks</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>

                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : error ? (
                    <Alert severity="error">
                      {error}
                    </Alert>
                  ) : upcomingClasses.length > 0 ? (
                    <List>
                      {upcomingClasses.map((classItem, index) => (
                        <React.Fragment key={classItem.id}>
                          <ListItem sx={{ px: 0, py: 1 }}>
                            <ListItemAvatar>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: 'info.main' }}>
                                <ScheduleIcon fontSize="small" />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {getStatusDot(classItem.status)}
                                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                      {classItem.subject}
                                    </Typography>
                                  </Box>
                                  <IconButton size="small" sx={{ color: 'text.secondary' }}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {classItem.teacher} • {classItem.time} • {classItem.room}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary">
                                      {classItem.group}
                                    </Typography>
                                  </Box>
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < upcomingClasses.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No upcoming classes
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TestDashboard; 