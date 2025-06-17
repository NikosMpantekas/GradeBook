import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getUserData } from '../features/auth/authSlice';
import logger from '../services/loggerService';
import ErrorBoundary from '../components/common/ErrorBoundary';
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
  Chip,
  Stack,
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
import { useRef } from 'react';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { notifications, isLoading: notificationsLoading } = useSelector((state) => state.notifications);
  
  // Enhanced logging for component rendering and user state
  logger.info('DASHBOARD', 'Component rendering', {
    user: user ? {
      id: user._id || user.id,
      role: user.role,
      name: user.name,
      hasToken: !!user.token,
      tokenLength: user.token?.length,
      hasSchoolFeatures: !!user.schoolFeatures
    } : 'No user',
    currentPath: window.location.pathname,
    previousPath: window.history?.state?.prev || 'Unknown'
  });
  
  // Check if features are enabled based on school settings
  const isFeatureEnabled = (featureName) => {
    // Superadmin and admin always have access to all features
    if (user && (user.role === 'superadmin' || user.role === 'admin')) {
      return true;
    }
    
    // Print debug info about schoolFeatures structure
    logger.info('FEATURE CHECK', `Checking feature: ${featureName}`, {
      hasSchoolFeatures: !!user?.schoolFeatures,
      schoolFeaturesType: user?.schoolFeatures ? typeof user.schoolFeatures : 'undefined',
      isArray: user?.schoolFeatures ? Array.isArray(user.schoolFeatures) : false,
      featureContent: user?.schoolFeatures ? JSON.stringify(user.schoolFeatures).substring(0, 100) : 'No features'
    });
    
    // For other users, check if the feature is enabled at the school level
    if (user && user.schoolFeatures) {
      // The backend sends schoolFeatures as an array of enabled feature names
      if (Array.isArray(user.schoolFeatures)) {
        const featureMap = {
          'notifications': 'enableNotifications',
          'grades': 'enableGrades',
          'rating': 'enableRatingSystem',
          'calendar': 'enableCalendar',
          'progress': 'enableStudentProgress'
        };
        
        // Check if the feature name exists in the array
        return user.schoolFeatures.includes(featureMap[featureName]);
      }
      // Legacy support for object format with boolean properties
      else if (typeof user.schoolFeatures === 'object') {
        switch (featureName) {
          case 'notifications':
            return user.schoolFeatures.enableNotifications === true;
          case 'grades':
            return user.schoolFeatures.enableGrades === true;
          case 'rating':
            return user.schoolFeatures.enableRatingSystem === true;
          case 'calendar':
            return user.schoolFeatures.enableCalendar === true;
          case 'progress':
            return user.schoolFeatures.enableStudentProgress === true;
          default:
            return true; // Default to showing if feature check isn't implemented
        }
      }
    }
    
    // Default to showing if no school features data exists
    return true;
  };
  
  // Create a memoized error handler for navigation
  const handleNavigationError = useCallback((destination, error) => {
    logger.error('NAVIGATION', `Failed to navigate to ${destination}`, {
      error: error.message,
      stack: error.stack,
      from: window.location.pathname,
      to: destination,
      user: user ? { id: user._id, role: user.role } : 'No user'
    });
  }, [user]);
  
  // Basic navigation functions with error handling
  const goToProfile = () => {
    try {
      navigate('/app/profile');
    } catch (error) {
      handleNavigationError('/app/profile', error);
    }
  };
  
  const goToNotifications = () => {
    try {
      navigate('/app/notifications');
    } catch (error) {
      handleNavigationError('/app/notifications', error);
    }
  };
  
  const goToGrades = () => {
    try {
      navigate('/app/grades');
    } catch (error) {
      handleNavigationError('/app/grades', error);
    }
  };
  
  const goToTeacherDashboard = () => {
    try {
      navigate('/app/teacher');
    } catch (error) {
      handleNavigationError('/app/teacher', error);
    }
  };
  
  const goToAdminDashboard = () => {
    try {
      navigate('/app/admin');
    } catch (error) {
      handleNavigationError('/app/admin', error);
    }
  };
  const { grades, isLoading: gradesLoading } = useSelector((state) => state.grades);
  const { subjects } = useSelector((state) => state.subjects);
  const { schools } = useSelector((state) => state.schools);
  const { directions } = useSelector((state) => state.directions);

  const [recentNotifications, setRecentNotifications] = useState([]);
  const [recentGrades, setRecentGrades] = useState([]);
  const [userSchools, setUserSchools] = useState([]);
  const [userDirections, setUserDirections] = useState([]);
  const [userSubjects, setUserSubjects] = useState([]);

  // Use a ref to track whether we've loaded data
  const dataLoaded = React.useRef(false);
  const [loadingErrors, setLoadingErrors] = useState({});
  const [showErrorWarning, setShowErrorWarning] = useState(false);

  // Enhanced superadmin redirection with comprehensive error logging
  useEffect(() => {
    if (user && user.role === 'superadmin') {
      logger.info('SUPERADMIN', 'Superadmin detected in Dashboard component', {
        id: user._id || user.id || 'MISSING_ID',
        name: user.name || 'MISSING_NAME',
        currentPath: window.location.pathname,
        hasToken: !!user.token,
        tokenLength: user.token?.length,
        userProperties: Object.keys(user),
        storageType: localStorage.getItem('user') ? 'localStorage' : 
                    sessionStorage.getItem('user') ? 'sessionStorage' : 'none'
      });
      
      // Extensive logging and error handling for the critical redirection
      try {
        // Check if already on target page to prevent loops
        if (window.location.pathname !== '/superadmin/dashboard') {
          logger.info('NAVIGATION', 'Redirecting superadmin to dashboard', {
            from: window.location.pathname,
            to: '/superadmin/dashboard',
            replace: true
          });
          
          // Actual navigation with error catching
          navigate('/superadmin/dashboard', { replace: true });
          
          // Log success after navigation attempt
          logger.info('NAVIGATION', 'Superadmin redirect initiated successfully');
        } else {
          logger.info('NAVIGATION', 'Superadmin already on dashboard page, skipping redirect');
        }
      } catch (error) {
        // Critical error logging for navigation failures
        logger.critical('NAVIGATION', 'Failed to redirect superadmin to dashboard', {
          error: error.message,
          stack: error.stack,
          user: {
            id: user._id || user.id,
            role: user.role,
            hasToken: !!user.token
          },
          currentPath: window.location.pathname,
          navigationState: window.history?.state || 'No history state'
        });
        
        // Fallback redirect attempt using window.location as a last resort
        setTimeout(() => {
          logger.warn('NAVIGATION', 'Attempting fallback navigation using window.location');
          window.location.href = '/superadmin/dashboard';
        }, 500);
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user && !dataLoaded.current) {
      // Set flag to prevent infinite reload
      dataLoaded.current = true;
      
      // Skip data loading for superadmin users
      if (user.role === 'superadmin') {
        console.log('Skipping standard data loading for superadmin user');
        return;
      }
      
      // Fetch initial data only once - with error handling
      const loadData = async () => {
        const errors = {};
        
        try {
          await dispatch(getMyNotifications()).unwrap();
        } catch (error) {
          console.error('Failed to load notifications:', error);
          errors.notifications = true;
        }
        
        try {
          await dispatch(getSchools()).unwrap();
        } catch (error) {
          console.error('Failed to load schools:', error);
          errors.schools = true;
        }
        
        try {
          await dispatch(getDirections()).unwrap();
        } catch (error) {
          console.error('Failed to load directions:', error);
          errors.directions = true;
        }
        
        try {
          await dispatch(getSubjects()).unwrap();
        } catch (error) {
          console.error('Failed to load subjects:', error);
          errors.subjects = true;
        }
        
        // Only fetch grades for students
        if (user.role === 'student') {
          try {
            await dispatch(getStudentGrades(user._id)).unwrap();
          } catch (error) {
            console.error('Failed to load grades:', error);
            errors.grades = true;
          }
        }
        
        // Get populated user data only if we don't already have it
        if (!(user.school && typeof user.school === 'object') || 
            !(user.direction && typeof user.direction === 'object')) {
          try {
            await dispatch(getUserData()).unwrap();
          } catch (error) {
            console.error('Failed to load user data:', error);
            errors.userData = true;
          }
        }
        
        // Set errors and show warning if any errors occurred
        if (Object.keys(errors).length > 0) {
          setLoadingErrors(errors);
          setShowErrorWarning(true);
        }
      };
      
      loadData();
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

    // Set user's schools from populated user data - supporting both old and new field names
    if (user) {
      // New: First check for schools[] array (new field for teachers)
      if (user.schools && user.schools.length > 0) {
        console.log('Dashboard: Found schools data in new field name', user.schools);
        // Process data from new field name
        if (typeof user.schools[0] === 'object') {
          // Schools are populated objects
          setUserSchools(user.schools);
        } else if (schools && schools.length > 0) {
          // Schools are just IDs, find the full objects
          const schoolObjects = user.schools.map(schoolId => 
            schools.find(s => s._id === schoolId)
          ).filter(Boolean);
          setUserSchools(schoolObjects);
        }
      }
      // Check for old field name as fallback
      else if (user.school) {
        // Handle both single school and multiple schools
        if (Array.isArray(user.school)) {
          // Array of schools
          console.log('Dashboard: Using legacy field school as array');
          if (user.school.length > 0 && typeof user.school[0] === 'object') {
            // Schools are populated objects
            setUserSchools(user.school);
          } else if (schools && schools.length > 0) {
            // Schools are just IDs, find the full objects
            const schoolObjects = user.school.map(schoolId => 
              schools.find(s => s._id === schoolId)
            ).filter(Boolean);
            setUserSchools(schoolObjects);
          }
        } else {
          // Single school (for students)
          console.log('Dashboard: Using single school value (student format)');
          if (typeof user.school === 'object' && user.school !== null) {
            // School is a populated object
            setUserSchools([user.school]);
          } else if (schools && typeof user.school === 'string') {
            // School is just an ID, find the full object as fallback
            const school = schools.find(s => s._id === user.school);
            if (school) setUserSchools([school]);
          }
        }
      }
    }

    // Set user's directions from populated user data - supporting both old and new field names
    if (user) {
      // New: First check for directions[] array (new field for teachers)
      if (user.directions && user.directions.length > 0) {
        console.log('Dashboard: Found directions data in new field name', user.directions);
        // Process data from new field name
        if (typeof user.directions[0] === 'object') {
          // Directions are populated objects
          setUserDirections(user.directions);
        } else if (directions && directions.length > 0) {
          // Directions are just IDs, find the full objects
          const directionObjects = user.directions.map(directionId => 
            directions.find(d => d._id === directionId)
          ).filter(Boolean);
          setUserDirections(directionObjects);
        }
      }
      // Check for old field name as fallback
      else if (user.direction) {
        // Handle both single direction and multiple directions
        if (Array.isArray(user.direction)) {
          // Array of directions
          console.log('Dashboard: Using legacy field direction as array');
          if (user.direction.length > 0 && typeof user.direction[0] === 'object') {
            // Directions are populated objects
            setUserDirections(user.direction);
          } else if (directions && directions.length > 0) {
            // Directions are just IDs, find the full objects
            const directionObjects = user.direction.map(directionId => 
              directions.find(d => d._id === directionId)
            ).filter(Boolean);
            setUserDirections(directionObjects);
          }
        } else {
          // Single direction (for students)
          console.log('Dashboard: Using single direction value (student format)');
          if (typeof user.direction === 'object' && user.direction !== null) {
            // Direction is a populated object
            setUserDirections([user.direction]);
          } else if (directions && typeof user.direction === 'string') {
            // Direction is just an ID, find the full object as fallback
            const direction = directions.find(d => d._id === user.direction);
            if (direction) setUserDirections([direction]);
          }
        }
      }
    }

    // Get user's subjects
    if (subjects && user && user.subjects) {
      // Handle both cases: when subjects are objects or just IDs
      if (user.subjects[0] && typeof user.subjects[0] === 'object') {
        // Subjects are already populated objects
        setUserSubjects(user.subjects);
      } else if (subjects.length > 0 && user.subjects.length > 0) {
        // Subjects are just IDs, need to match with full objects
        const userSubjectsData = subjects.filter(subject => 
          user.subjects.some(userSubject => 
            (typeof userSubject === 'string' ? userSubject : userSubject._id) === subject._id
          )
        );
        setUserSubjects(userSubjectsData);
      }
    }
  }, [notifications, grades, schools, directions, subjects, user]);

  const getWelcomeMessage = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // If data is still loading, show loading state
  if ((notificationsLoading || gradesLoading) && !user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Error warning banner */}
      {showErrorWarning && (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, 
            mb: 3, 
            bgcolor: 'warning.light', 
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'warning.main'
          }}
        >
          <Typography variant="body1" color="warning.dark">
            Some data could not be loaded. The dashboard is showing partial information.
          </Typography>
          <Button 
            size="small" 
            onClick={() => window.location.reload()} 
            sx={{ mt: 1 }}
          >
            Refresh Page
          </Button>
        </Paper>
      )}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Welcome Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{
            p: { xs: 1.5, sm: 2 }, 
            height: '100%', 
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
          <Paper elevation={2} sx={{ p: { xs: 1.5, sm: 2 }, height: '100%', borderRadius: 2 }}>
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
              {(user?.role === 'student' || user?.role === 'teacher') && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="body1">
                      <strong>School{userSchools.length > 1 ? 's' : ''}:</strong>
                      {userSchools && userSchools.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {userSchools.map(school => (
                            <Chip key={school._id} label={school.name} size="small" variant="outlined" sx={{ color: 'white', bgcolor: 'primary.main' }} />
                          ))}
                        </Box>
                      ) : (
                        user?.school ? 'Loading...' : 'Not assigned'
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body1">
                      <strong>Direction{userDirections.length > 1 ? 's' : ''}:</strong>
                      {userDirections && userDirections.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {userDirections.map(direction => (
                            <Chip key={direction._id} label={direction.name} size="small" variant="outlined" sx={{ color: 'white', bgcolor: 'secondary.main' }} />
                          ))}
                        </Box>
                      ) : (
                        user?.direction ? 'Loading...' : 'Not assigned'
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body1">
                      <strong>Subjects:</strong> 
                      {userSubjects && userSubjects.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {userSubjects.map(subject => (
                            <Chip key={subject._id} label={subject.name} size="small" variant="outlined" />
                          ))}
                        </Box>
                      ) : (
                        user?.subjects && user.subjects.length > 0 ? 'Loading...' : 'Not assigned'
                      )}
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
                    onClick={() => navigate('/app/grades')}
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
                      onClick={() => navigate('/app/teacher/grades/manage')}
                      fullWidth
                    >
                      Manage Grades
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Button 
                      variant="outlined" 
                      startIcon={<NotificationsIcon />}
                      onClick={() => navigate('/app/teacher/notifications/create')}
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
                      onClick={() => navigate('/app/admin/users')}
                      fullWidth
                    >
                      Manage Users
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Button 
                      variant="outlined" 
                      startIcon={<SchoolIcon />}
                      onClick={() => navigate('/app/admin/schools')}
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
                  onClick={() => {
                    // Use the appropriate navigation based on user role
                    if (user?.role === 'teacher') {
                      navigate('/app/teacher/notifications');
                    } else if (user?.role === 'student') {
                      // Use the goToNotifications function for students
                      goToNotifications();
                    } else {
                      // Fallback for other roles
                      navigate('/app/notifications');
                    }
                  }}
                  fullWidth
                >
                  View Notifications
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Recent Notifications Section */}
        {isFeatureEnabled('notifications') && (
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, minHeight: '120px' }}>
            <Typography variant="h6" gutterBottom>
              Notifications
            </Typography>
            {notificationsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress />
              </Box>
            ) : loadingErrors.notifications ? (
              <Typography color="error">
                Error loading notifications
              </Typography>
            ) : (
              <>
                {recentNotifications.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No recent notifications
                  </Typography>
                ) : (
                  <Box>
                    {recentNotifications.map((notification, index) => (
                      <Box key={index} sx={{ mb: 1 }}>
                        <Typography variant="body2" gutterBottom>
                          {notification.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(notification.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<NotificationsIcon />}
                  onClick={goToNotifications}
                  sx={{ mt: 2 }}
                >
                  View All
                </Button>
              </>
            )}
          </Paper>
        </Grid>
        )}

        {/* Recent Grades Section (Students only) */}
        {user?.role === 'student' && isFeatureEnabled('grades') && (
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 2, minHeight: '120px' }}>
            <Typography variant="h6" gutterBottom>
              Recent Grades
            </Typography>
            {gradesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress />
              </Box>
            ) : loadingErrors.grades ? (
              <Typography color="error">
                Error loading grades
              </Typography>
            ) : (
              <>
                {recentGrades.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No recent grades
                  </Typography>
                ) : (
                  <Box>
                    {recentGrades.map((grade, index) => (
                      <Box key={index} sx={{ mb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">
                            {grade.subject?.name || 'Unknown Subject'}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {grade.value}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(grade.date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AssignmentIcon />}
                  onClick={goToGrades}
                  sx={{ mt: 2 }}
                >
                  View All
                </Button>
              </>
            )}
          </Paper>
        </Grid>
        )}
      </Grid>
    </Box>
  );
};

// Wrap the Dashboard component with an ErrorBoundary for comprehensive error catching
const DashboardWithErrorBoundary = () => (
  <ErrorBoundary componentName="Dashboard">
    <Dashboard />
  </ErrorBoundary>
);

export default DashboardWithErrorBoundary;
