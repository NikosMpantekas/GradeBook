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
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Grade as GradeIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  Subject as SubjectIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { API_URL } from '../../config/appConfig';

const ParentGrades = () => {
  const [studentsData, setStudentsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    // More robust token retrieval with debugging
    console.log('[ParentGrades] Redux auth state:', {
      hasUser: !!user,
      hasToken: !!token,
      userRole: user?.role,
      userId: user?._id,
      tokenLength: token?.length
    });
    
    // Fallback token retrieval from localStorage/sessionStorage
    let authToken = token;
    if (!authToken && user) {
      try {
        const localUser = localStorage.getItem('user');
        const sessionUser = sessionStorage.getItem('user');
        const userData = localUser ? JSON.parse(localUser) : sessionUser ? JSON.parse(sessionUser) : null;
        authToken = userData?.token;
        console.log('[ParentGrades] Fallback token from storage:', {
          hasLocalUser: !!localUser,
          hasSessionUser: !!sessionUser,
          hasFallbackToken: !!authToken,
          fallbackTokenLength: authToken?.length
        });
      } catch (error) {
        console.error('[ParentGrades] Error parsing stored user data:', error);
      }
    }
    
    if (authToken && user) {
      console.log('[ParentGrades] Token available, fetching students data...');
      fetchStudentsData(authToken);
    } else {
      console.log('[ParentGrades] Token or user not available:', { 
        hasAuthToken: !!authToken, 
        hasUser: !!user,
        userRole: user?.role 
      });
      setLoading(false);
      setError('Authentication required. Please refresh the page.');
    }
  }, [token, user]);

  const fetchStudentsData = async (authToken) => {
    const tokenToUse = authToken || token;
    
    if (!tokenToUse) {
      console.error('[ParentGrades] No token available for API request');
      setError('Authentication token missing. Please login again.');
      setLoading(false);
      return;
    }

    console.log('[ParentGrades] Making API request with token length:', tokenToUse.length);
    
    try {
      const response = await fetch(`${API_URL}/api/users/parent/students-data`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenToUse}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch students data');
      }

      const data = await response.json();
      console.log('[ParentGrades] Students data received:', data);
      setStudentsData(data);
    } catch (err) {
      console.error('Error fetching students data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
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

  if (!studentsData || !studentsData.studentsData || studentsData.studentsData.length === 0) {
    return (
      <Box p={3}>
        <Alert severity="info">No students data available</Alert>
      </Box>
    );
  }

  const { studentsData: students, combinedRecentGrades } = studentsData;
  const studentNames = students.map(s => s.student.name).join(', ');

  return (
    <Box p={3}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 60, height: 60 }}>
            <GradeIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Students Grades
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Academic Performance for {studentNames}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {students.length} {students.length === 1 ? 'Student' : 'Students'} • {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Navigation Tabs */}
      <Paper elevation={1} sx={{ mb: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange} variant="fullWidth">
          <Tab label="All Grades Combined" />
          {students.map((studentData, index) => (
            <Tab key={studentData.student._id} label={`${studentData.student.name}'s Grades`} />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {selectedTab === 0 ? (
        // Combined grades view
        <Paper elevation={2} sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" gap={2} mb={3}>
            <GradeIcon color="primary" />
            <Typography variant="h5" fontWeight="bold">
              All Recent Grades ({combinedRecentGrades?.length || 0})
            </Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />

          {combinedRecentGrades && combinedRecentGrades.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Student</strong></TableCell>
                    <TableCell><strong>Subject</strong></TableCell>
                    <TableCell><strong>Grade</strong></TableCell>
                    <TableCell><strong>Teacher</strong></TableCell>
                    <TableCell><strong>Description</strong></TableCell>
                    <TableCell><strong>Date</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {combinedRecentGrades.map((grade, index) => (
                    <TableRow key={grade._id || index}>
                      <TableCell>{grade.studentName}</TableCell>
                      <TableCell>{grade.subject}</TableCell>
                      <TableCell>
                        <Chip 
                          label={grade.value} 
                          color="primary" 
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{grade.teacher}</TableCell>
                      <TableCell>{grade.description || 'No description'}</TableCell>
                      <TableCell>{new Date(grade.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">No grades available for any of your students yet.</Alert>
          )}
        </Paper>
      ) : (
        // Individual student grades view
        <Paper elevation={2} sx={{ p: 3 }}>
          {(() => {
            const studentIndex = selectedTab - 1;
            const studentData = students[studentIndex];
            if (!studentData) return <Alert severity="error">Student data not found</Alert>;

            return (
              <Box>
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 50, height: 50 }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight="bold">
                      {studentData.student.name}'s Grades
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {studentData.recentGrades?.length || 0} recent grades
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 3 }} />

                {studentData.recentGrades && studentData.recentGrades.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Subject</strong></TableCell>
                          <TableCell><strong>Grade</strong></TableCell>
                          <TableCell><strong>Teacher</strong></TableCell>
                          <TableCell><strong>Description</strong></TableCell>
                          <TableCell><strong>Date</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {studentData.recentGrades.map((grade, index) => (
                          <TableRow key={grade._id || index}>
                            <TableCell>{grade.subject}</TableCell>
                            <TableCell>
                              <Chip 
                                label={grade.value} 
                                color="primary" 
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{grade.teacher}</TableCell>
                            <TableCell>{grade.description || 'No description'}</TableCell>
                            <TableCell>{new Date(grade.createdAt).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">No grades available for {studentData.student.name} yet.</Alert>
                )}
              </Box>
            );
          })()}
        </Paper>
      )}
    </Box>
  );
};

export default ParentGrades;
