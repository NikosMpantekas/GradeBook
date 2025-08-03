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
  Tab,
  Container,
  Stack,
  useTheme,
  useMediaQuery
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
  
  // Mobile-responsive design hooks
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // Mobile/tablet view
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm')); // Small mobile view

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
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
      <Typography variant={isSmallScreen ? "h5" : "h4"} gutterBottom fontWeight="bold" textAlign="center">
        📚 My Students' Grades
      </Typography>
      
      {/* Tab Navigation - Mobile Optimized */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={selectedTab} 
          onChange={handleTabChange} 
          aria-label="student grades tabs"
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : false}
          sx={{
            '& .MuiTabs-flexContainer': {
              flexDirection: 'row'
            }
          }}
        >
          <Tab 
            label={
              <Stack direction="row" alignItems="center" spacing={1}>
                <SchoolIcon fontSize="small" />
                <Box textAlign="left">
                  <Typography variant="caption" display="block">
                    All Students
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    ({students?.length || 0} students)
                  </Typography>
                </Box>
              </Stack>
            } 
            sx={{ minWidth: isMobile ? 120 : 160 }}
          />
          {students?.map((studentData, index) => (
            <Tab 
              key={studentData.student._id}
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <PersonIcon fontSize="small" />
                  <Box textAlign="left">
                    <Typography variant="caption" display="block" noWrap>
                      {isSmallScreen ? studentData.student.name.split(' ')[0] : studentData.student.name}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      ({studentData.recentGrades?.length || 0} grades)
                    </Typography>
                  </Box>
                </Stack>
              } 
              sx={{ minWidth: isMobile ? 100 : 140 }}
            />
          ))}
        </Tabs>
      </Box>

      {selectedTab === 0 ? (
        // Combined grades view - Mobile Optimized
        <Box>
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.main', color: 'white' }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <GradeIcon />
              <Box>
                <Typography variant={isSmallScreen ? "h6" : "h5"} fontWeight="bold">
                  All Recent Grades
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {combinedRecentGrades?.length || 0} total grades across all students
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {combinedRecentGrades && combinedRecentGrades.length > 0 ? (
            <Box>
              {combinedRecentGrades.map((grade, index) => (
                <GradeCard key={grade._id || index} grade={grade} showStudentName={true} />
              ))}
            </Box>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Alert severity="info" sx={{ border: 'none', bgcolor: 'transparent' }}>
                📚 No grades available for any of your students yet.
              </Alert>
            </Paper>
          )}
        </Box>
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
                  <Box>
                    {studentData.recentGrades.map((grade, index) => (
                      <GradeCard key={grade._id || index} grade={grade} showStudentName={false} />
                    ))}
                  </Box>
                ) : (
                  <Alert severity="info">No grades available for {studentData.student.name} yet.</Alert>
                )}
              </Box>
            );
          })()}
        </Paper>
      )}
    </Container>
  );
};

export default ParentGrades;
