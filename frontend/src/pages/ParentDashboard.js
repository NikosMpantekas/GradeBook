import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Avatar
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Person as PersonIcon,
  School as SchoolIcon,
  Grade as GradeIcon,
  Notifications as NotificationIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { API_URL } from '../config/appConfig';

const ParentDashboard = () => {
  const [studentsData, setStudentsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    // Only fetch data when token is available
    if (token && user) {
      console.log('[ParentDashboard] Token available, fetching students data...');
      fetchStudentsData();
    } else {
      console.log('[ParentDashboard] Token or user not available yet:', { hasToken: !!token, hasUser: !!user });
      setLoading(false);
      setError('Authentication required. Please refresh the page.');
    }
  }, [token, user]); // Add token and user as dependencies

  const fetchStudentsData = async () => {
    // Add token validation before making request
    if (!token) {
      console.error('[ParentDashboard] No token available for API request');
      setError('Authentication token missing. Please login again.');
      setLoading(false);
      return;
    }

    console.log('[ParentDashboard] Making API request with token length:', token.length);
    
    try {
      const response = await fetch(`${API_URL}/api/users/parent/students-data`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch students data');
      }

      const data = await response.json();
      setStudentsData(data);
    } catch (err) {
      console.error('Error fetching students data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!studentsData) {
    return (
      <Box p={3}>
        <Alert severity="info">No students data available</Alert>
      </Box>
    );
  }

  const { studentsCount, studentsData: students, combinedRecentGrades, combinedRecentNotifications } = studentsData;
  const studentNames = students.map(s => s.student.name).join(', ');

  return (
    <Box p={3}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 60, height: 60 }}>
            <PersonIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Welcome, {user?.name}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Parent/Guardian of {studentNames}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {studentsCount} {studentsCount === 1 ? 'Student' : 'Students'} • {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Students Overview */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <SchoolIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  My {studentsCount === 1 ? 'Student' : 'Students'} ({studentsCount})
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {students.map((studentData, index) => (
                <Accordion key={studentData.student._id} defaultExpanded={studentsCount === 1}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center" gap={2} width="100%">
                      <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                        <PersonIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight="medium">
                          {studentData.student.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {studentData.recentGrades.length} recent grades • {studentData.recentNotifications.length} notifications
                        </Typography>
                      </Box>
                      <Box ml="auto">
                        <Chip 
                          label={studentData.student.active ? 'Active' : 'Inactive'} 
                          color={studentData.student.active ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                          Contact Information
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <EmailIcon fontSize="small" color="action" />
                          <Typography variant="body2">{studentData.student.email}</Typography>
                        </Box>
                        {studentData.student.mobilePhone && (
                          <Box display="flex" alignItems="center" gap={1}>
                            <PhoneIcon fontSize="small" color="action" />
                            <Typography variant="body2">{studentData.student.mobilePhone}</Typography>
                          </Box>
                        )}
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                          Recent Grades
                        </Typography>
                        {studentData.recentGrades.length > 0 ? (
                          studentData.recentGrades.slice(0, 3).map((grade) => (
                            <Box key={grade._id} display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                              <Typography variant="body2">{grade.subject}</Typography>
                              <Chip label={grade.value} size="small" color="primary" />
                            </Box>
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">No recent grades</Typography>
                        )}
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Combined Recent Grades */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <GradeIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Recent Grades (All Students)
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {combinedRecentGrades && combinedRecentGrades.length > 0 ? (
                <List dense>
                  {combinedRecentGrades.slice(0, 8).map((grade) => (
                    <ListItem key={grade._id} divider>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body1" fontWeight="medium">
                              {grade.subject}
                            </Typography>
                            <Chip 
                              label={grade.value} 
                              color="primary" 
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Student: {grade.studentName} • Teacher: {grade.teacher}
                            </Typography>
                            {grade.description && (
                              <Typography variant="body2" color="text.secondary">
                                {grade.description}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary">
                              {new Date(grade.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                  No recent grades available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Combined Recent Notifications */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <NotificationIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Recent Notifications (All Students)
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {combinedRecentNotifications && combinedRecentNotifications.length > 0 ? (
                <List dense>
                  {combinedRecentNotifications.slice(0, 8).map((notification) => (
                    <ListItem key={notification._id} divider>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body1" fontWeight="medium">
                              {notification.title}
                            </Typography>
                            <Chip 
                              label={notification.priority || 'Normal'} 
                              color={notification.priority === 'high' ? 'error' : 'default'}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {notification.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              From: {notification.sender} • {new Date(notification.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                  No recent notifications available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ParentDashboard;
