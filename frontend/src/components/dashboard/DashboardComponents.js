import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  IconButton,
  Skeleton,
  Alert,
  Grid,
  Divider,
  Button,
  useTheme,
  useMediaQuery,
  ListItemButton
} from '@mui/material';
import {
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Grade as GradeIcon,
  Schedule as ScheduleIcon,
  School as SchoolIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon,
  NotificationsActive as NotificationsActiveIcon,
  Class as ClassIcon,
  ShowChart as ShowChartIcon
} from '@mui/icons-material';
import { format, isValid, parseISO, subDays } from 'date-fns';
import { useFeatureToggles } from '../../context/FeatureToggleContext';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * Welcome Panel Component
 * Shows current time, date, and personalized greeting
 */
export const WelcomePanel = ({ user }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'teacher': return 'Teacher';
      case 'student': return 'Student';
      case 'superadmin': return 'Super Administrator';
      default: return role;
    }
  };

  const handleProfileClick = () => {
    navigate('/app/profile');
  };

  return (
    <Card 
      sx={{ 
        background: theme => `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 50%, ${theme.palette.primary.dark} 100%)`,
        color: 'white',
        mb: 3
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          flexDirection: { xs: 'column', md: 'row' }, 
          gap: { xs: 2, md: 0 } 
        }}>
          {/* Mobile Layout: Time/Date only, no monogram */}
          {isMobile ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'flex-start',
              width: '100%'
            }}>
              <Typography variant="h4" component="h1" gutterBottom sx={{ 
                fontWeight: 'bold', 
                fontSize: { xs: '1.5rem', sm: '2.125rem' },
                textAlign: 'left'
              }}>
                {getGreeting()}, {user?.name || 'User'}! 👋
              </Typography>
              <Typography variant="h6" sx={{ 
                opacity: 0.9, 
                mb: 1, 
                fontSize: { xs: '1rem', sm: '1.25rem' },
                textAlign: 'left'
              }}>
                Welcome to your {getRoleDisplayName(user?.role)} Dashboard
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 1
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarIcon sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }} />
                  <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    {format(currentTime, 'EEEE, MMMM do, yyyy')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TimeIcon sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }} />
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: { xs: '0.875rem', sm: '1.1rem' } }}>
                    {format(currentTime, 'HH:mm:ss')}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ) : (
            /* Desktop Layout: Original layout */
            <>
          <Box sx={{ width: '100%' }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
              {getGreeting()}, {user?.name || 'User'}! 👋
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Welcome to your {getRoleDisplayName(user?.role)} Dashboard
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              flexDirection: { xs: 'column', md: 'row' },
              textAlign: { xs: 'center', md: 'left' }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarIcon sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }} />
                <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  {format(currentTime, 'EEEE, MMMM do, yyyy')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TimeIcon sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }} />
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: { xs: '0.875rem', sm: '1.1rem' } }}>
                  {format(currentTime, 'HH:mm:ss')}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Avatar 
                onClick={handleProfileClick}
            sx={{ 
              width: { xs: 60, sm: 80 }, 
              height: { xs: 60, sm: 80 },
              bgcolor: 'rgba(255,255,255,0.2)',
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    bgcolor: 'rgba(255,255,255,0.3)',
                    boxShadow: theme => `0 4px 8px ${theme.palette.primary.dark}40`
                  }
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * Profile Information Panel Component
 * Shows user profile details and school information
 */
export const ProfileInfoPanel = ({ user, loading = false }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card>
        <CardHeader title="Profile Information" />
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Skeleton variant="text" width="60%" height={30} />
            <Skeleton variant="text" width="80%" height={25} />
            <Skeleton variant="text" width="70%" height={25} />
            <Skeleton variant="text" width="50%" height={25} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'teacher': return 'warning';
      case 'student': return 'primary';
      case 'superadmin': return 'secondary';
      default: return 'default';
    }
  };

  const handleProfileClick = () => {
    navigate('/app/profile');
  };

  return (
    <Card>
      <CardHeader 
        title="Profile Information" 
        avatar={<PersonIcon color="primary" />}
      />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box 
            onClick={handleProfileClick}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              cursor: 'pointer',
              p: 1,
              borderRadius: 1,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: theme => theme.palette.action.hover,
                transform: 'translateY(-1px)',
                boxShadow: theme => `0 2px 4px ${theme.palette.primary.main}20`
              }
            }}
          >
            <Avatar sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
            <Box>
              <Typography variant="h6" gutterBottom>
                {user?.name || 'Unknown User'}
              </Typography>
              <Chip 
                label={user?.role?.toUpperCase() || 'USER'} 
                color={getRoleColor(user?.role)}
                size="small"
                variant="outlined"
              />
            </Box>
          </Box>

          <Divider />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {user?.email && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
              </Box>
            )}

            {user?.phone && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneIcon color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  {user.phone}
                </Typography>
              </Box>
            )}

            {(user?.schoolId?.name || user?.school?.name) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SchoolIcon color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  {user.schoolId?.name || user.school?.name}
                </Typography>
              </Box>
            )}

            {user?.location && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationIcon color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  {user.location}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * Recent Notifications Panel Component
 * Shows recent notifications with permission checking
 */
export const RecentNotificationsPanel = ({ notifications = [], loading = false, onViewAll }) => {
  const { isFeatureEnabled } = useFeatureToggles();
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // Check if notifications feature is enabled
  if (!isFeatureEnabled('enableNotifications')) {
    return null; // Hide panel if notifications are disabled
  }

  if (loading) {
    return (
      <Card>
        <CardHeader title="Recent Notifications" />
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[1, 2, 3].map((i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="80%" height={20} />
                  <Skeleton variant="text" width="60%" height={16} />
                </Box>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString) => {
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
      if (!isValid(date)) return 'Invalid date';
      return format(date, 'MMM dd, HH:mm');
    } catch (error) {
      return 'Date error';
    }
  };

  const handleNotificationClick = (notification) => {
    // Navigate to the specific notification detail page
    const userRole = user?.role;
    const notificationId = notification?._id;
    
    if (notificationId) {
      if (userRole === 'student') {
        navigate(`/app/student/notifications/${notificationId}`);
      } else if (userRole === 'teacher') {
        navigate(`/app/notifications/${notificationId}`);
      } else if (userRole === 'admin') {
        navigate(`/app/notifications/${notificationId}`);
      } else if (userRole === 'parent') {
        navigate(`/app/parent/notifications/${notificationId}`);
      } else {
        navigate(`/app/notifications/${notificationId}`);
      }
    } else {
      // Fallback to notifications list if no ID
      if (userRole === 'student') {
        navigate('/app/student/notifications');
      } else if (userRole === 'teacher') {
        navigate('/app/teacher/notifications');
      } else if (userRole === 'admin') {
        navigate('/app/admin/notifications/manage');
      } else if (userRole === 'parent') {
        navigate('/app/parent/notifications');
      } else {
        navigate('/app/notifications');
      }
    }
  };

  return (
    <Card>
      <CardHeader 
        title="Recent Notifications" 
        avatar={<NotificationsIcon color="primary" />}
        action={
          notifications.length > 0 && (
            <Button 
              size="small" 
              onClick={onViewAll}
              startIcon={<VisibilityIcon />}
              sx={{
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme => `${theme.palette.primary.main}10`
                }
              }}
            >
              View All
            </Button>
          )
        }
      />
      <CardContent sx={{ pt: 0 }}>
        {notifications.length === 0 ? (
          <Alert severity="info" sx={{ mt: 1 }}>
            No recent notifications
          </Alert>
        ) : (
          <List sx={{ py: 0, position: 'relative' }} disablePadding>
            {notifications.slice(0, 5).map((notification, index) => {
              // Defensive rendering to prevent null access
              const safeNotification = notification || {};
              const uniqueKey = safeNotification._id || `notification-${index}-${Date.now()}`;
              
              return (
                <ListItemButton
                  key={uniqueKey} 
                  onClick={() => handleNotificationClick(safeNotification)}
                  sx={{ 
                    px: 0,
                    borderRadius: 1,
                    mb: 0.5,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: theme => `${theme.palette.primary.main}10`,
                      transform: 'translateX(4px)'
                    }
                  }}
                >
                <ListItemAvatar>
                  <Avatar sx={{ 
                    bgcolor: notification.isImportant ? 'warning.main' : 'primary.main',
                    width: 36,
                    height: 36
                  }}>
                    {notification.isImportant ? (
                      <NotificationsActiveIcon fontSize="small" />
                    ) : (
                      <NotificationsIcon fontSize="small" />
                    )}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ 
                        fontWeight: safeNotification.isRead ? 'normal' : 'bold',
                        flex: 1
                      }}>
                        {safeNotification.title || 'No title'}
                      </Typography>
                      {safeNotification.isImportant && (
                        <Chip label="Important" size="small" color="warning" variant="outlined" />
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(safeNotification.createdAt)}
                    </Typography>
                  }
                />
                </ListItemButton>
              );
            })}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Recent Grades Panel Component
 * Shows recent grades with permission checking
 */
export const RecentGradesPanel = ({ grades = [], loading = false, onViewAll, userRole }) => {
  const { isFeatureEnabled } = useFeatureToggles();
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // Check if grades feature is enabled
  if (!isFeatureEnabled('enableGrades')) {
    return null; // Hide panel if grades are disabled
  }

  if (loading) {
    return (
      <Card>
        <CardHeader title="Recent Grades" />
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[1, 2, 3].map((i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="70%" height={20} />
                  <Skeleton variant="text" width="50%" height={16} />
                </Box>
                <Skeleton variant="rectangular" width={60} height={30} />
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  }

  const getGradeColor = (value) => {
    if (value >= 18) return 'success';
    if (value >= 15) return 'warning';
    if (value >= 10) return 'info';
    return 'error';
  };

  const formatDate = (dateString) => {
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
      if (!isValid(date)) return 'Invalid date';
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      return 'Date error';
    }
  };

  const handleGradeClick = (grade) => {
    // Navigate to the specific grade detail page
    const userRole = user?.role;
    const gradeId = grade?._id;
    
    if (gradeId) {
      if (userRole === 'student') {
        navigate(`/app/student/grades/${gradeId}`);
      } else if (userRole === 'parent') {
        navigate(`/app/parent/grades/${gradeId}`);
      } else {
        navigate(`/app/grades/${gradeId}`);
      }
    } else {
      // Fallback to grades list if no ID
      if (userRole === 'student') {
        navigate('/app/student/grades');
      } else if (userRole === 'parent') {
        navigate('/app/parent/grades');
      } else {
        navigate('/app/grades');
      }
    }
  };

  return (
    <Card>
      <CardHeader 
        title="Recent Grades" 
        avatar={<GradeIcon color="primary" />}
        action={
          grades.length > 0 && (
            <Button 
              size="small" 
              onClick={onViewAll}
              startIcon={<VisibilityIcon />}
              sx={{
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme => `${theme.palette.primary.main}10`
                }
              }}
            >
              View All
            </Button>
          )
        }
      />
      <CardContent sx={{ pt: 0 }}>
        {grades.length === 0 ? (
          <Alert severity="info" sx={{ mt: 1 }}>
            No recent grades available
          </Alert>
        ) : (
          <List sx={{ py: 0, position: 'relative' }} disablePadding>
            {grades.slice(0, 5).map((grade, index) => {
              // Defensive rendering to prevent null access
              const safeGrade = grade || {};
              const uniqueKey = safeGrade._id || `grade-${index}-${Date.now()}`;
              
              return (
                <ListItemButton
                  key={uniqueKey} 
                  onClick={() => handleGradeClick(safeGrade)}
                  sx={{ 
                    px: 0,
                    borderRadius: 1,
                    mb: 0.5,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: theme => `${theme.palette.primary.main}10`,
                      transform: 'translateX(4px)'
                    }
                  }}
                >
                <ListItemAvatar>
                  <Avatar sx={{ 
                      bgcolor: `${getGradeColor(safeGrade.value || 0)}.main`,
                    width: 36,
                    height: 36
                  }}>
                    <GradeIcon fontSize="small" />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {safeGrade.subject?.name || safeGrade.subjectName || 'Unknown Subject'}
                        {userRole !== 'student' && safeGrade.student && (
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            - {safeGrade.student.name}
                        </Typography>
                      )}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                        {formatDate(safeGrade.createdAt)} • {safeGrade.description || 'No description'}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <Chip 
                      label={safeGrade.value || 0} 
                      color={getGradeColor(safeGrade.value || 0)}
                    size="small"
                    variant="filled"
                  />
                </ListItemSecondaryAction>
                </ListItemButton>
              );
            })}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Upcoming Classes Panel Component
 * Shows upcoming classes with permission checking
 */
export const UpcomingClassesPanel = ({ classes = [], loading = false, onViewAll, userRole }) => {
  const { isFeatureEnabled } = useFeatureToggles();
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // Check if classes/schedule feature is enabled
  if (!isFeatureEnabled('enableClasses') && !isFeatureEnabled('enableSchedule')) {
    return null; // Hide panel if classes/schedule are disabled
  }

  if (loading) {
    return (
      <Card>
        <CardHeader title="Upcoming Classes" />
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[1, 2, 3].map((i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="80%" height={20} />
                  <Skeleton variant="text" width="60%" height={16} />
                </Box>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    );
  }

  const formatTime = (timeString) => {
    try {
      if (!timeString) return 'No time';
      // Handle different time formats
      const date = new Date(`2000-01-01T${timeString}`);
      if (!isValid(date)) return timeString;
      return format(date, 'HH:mm');
    } catch (error) {
      return timeString || 'Time error';
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
      if (!isValid(date)) return 'Invalid date';
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      return 'Date error';
    }
  };

  const handleClassClick = (classItem) => {
    // Navigate to the schedule page
    const userRole = user?.role;
    
    if (userRole === 'student') {
      navigate('/app/student/schedule');
    } else if (userRole === 'teacher') {
      navigate('/app/teacher/schedule');
    } else if (userRole === 'admin') {
      navigate('/app/admin/schedule');
    } else if (userRole === 'parent') {
      navigate('/app/parent/schedule');
    } else {
      navigate('/app/schedule');
    }
  };

  return (
    <Card>
      <CardHeader 
        title="Upcoming Classes" 
        avatar={<ScheduleIcon color="primary" />}
        action={
          classes.length > 0 && (
            <Button 
              size="small" 
              onClick={onViewAll}
              startIcon={<VisibilityIcon />}
              sx={{
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme => `${theme.palette.primary.main}10`
                }
              }}
            >
              View All
            </Button>
          )
        }
      />
      <CardContent sx={{ pt: 0 }}>
        {classes.length === 0 ? (
          <Alert 
            severity="info" 
            sx={{ 
              mt: 1,
              backgroundColor: theme => `${theme.palette.primary.main}20`,
              color: theme => theme.palette.mode === 'dark' ? 'white' : 'black',
              '& .MuiAlert-icon': {
                color: theme => theme.palette.mode === 'dark' ? 'white' : 'black',
              },
              border: theme => `1px solid ${theme.palette.primary.main}40`,
            }}
          >
            No upcoming classes scheduled
          </Alert>
        ) : (
          <List sx={{ py: 0, position: 'relative' }} disablePadding>
            {classes.slice(0, 5).map((classItem, index) => {
              // Defensive rendering to prevent null access
              const safeClassItem = classItem || {};
              const uniqueKey = safeClassItem._id || `class-${index}-${Date.now()}`;
              
              return (
                <ListItemButton
                  key={uniqueKey} 
                  onClick={() => handleClassClick(safeClassItem)}
                  sx={{ 
                    px: 0,
                    borderRadius: 1,
                    mb: 0.5,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: theme => `${theme.palette.primary.main}10`,
                      transform: 'translateX(4px)'
                    }
                  }}
                >
                <ListItemAvatar>
                  <Avatar sx={{ 
                    bgcolor: 'info.main',
                    width: 36,
                    height: 36
                  }}>
                    <ClassIcon fontSize="small" />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {safeClassItem.subject || safeClassItem.className || 'Unknown Subject'}
                        {userRole === 'admin' && safeClassItem.teacher && (
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            - {safeClassItem.teacher.name}
                        </Typography>
                      )}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                          {safeClassItem.startTime && safeClassItem.endTime ? (
                            `${formatTime(safeClassItem.startTime)} - ${formatTime(safeClassItem.endTime)}`
                        ) : (
                          'Time not specified'
                        )}
                      </Typography>
                        {safeClassItem.room && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            • Room {safeClassItem.room}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                </ListItemButton>
              );
            })}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Grades Over Time Panel Component
 * Shows a line graph of grades over the last 7 days
 */
export const GradesOverTimePanel = ({ grades = [], loading = false, onViewAll }) => {
  const { isFeatureEnabled } = useFeatureToggles();
  const theme = useTheme();
  const navigate = useNavigate();
  const pathRef = useRef(null);
  const [dashLength, setDashLength] = useState(0);
  const [dashOffset, setDashOffset] = useState(0);

  // Check if grades feature is enabled
  if (!isFeatureEnabled('enableGrades')) {
    return null; // Hide panel if grades are disabled
  }

  if (loading) {
    return (
      <Card>
        <CardHeader title="Grades Overview" />
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Skeleton variant="rectangular" width="100%" height={200} />
            <Skeleton variant="text" width="60%" height={20} />
            <Skeleton variant="text" width="40%" height={16} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Process grades data for the graph
  const processGradesForGraph = () => {
    if (!grades || grades.length === 0) return [];

    // Map each grade to a point and sort chronologically (no daily grouping)
    const mapped = grades
      .filter(g => g && g.createdAt)
      .map(g => {
        const dt = typeof g.createdAt === 'string' ? parseISO(g.createdAt) : new Date(g.createdAt);
        return {
          date: format(dt, 'MM-dd'),
          dateTime: dt,
          label: format(dt, 'MM-dd HH:mm'),
          grade: typeof g.value === 'number' ? g.value : Number(g.value) || 0,
        };
      })
      .sort((a, b) => a.dateTime - b.dateTime);

    return mapped;
  };

  const graphData = processGradesForGraph();

  // Animate the line drawing from left to right on mount / data change
  useEffect(() => {
    if (pathRef.current) {
      try {
        const length = pathRef.current.getTotalLength();
        setDashLength(length);
        setDashOffset(length);
        requestAnimationFrame(() => {
          setDashOffset(0);
        });
      } catch (e) {
        // Fallback: no animation if measurement fails
        setDashLength(0);
        setDashOffset(0);
      }
    }
  }, [graphData.length]);

  // Helper functions to create a smooth curve through points using cubic Bezier segments
  const lineProps = (pointA, pointB) => {
    const lengthX = pointB.x - pointA.x;
    const lengthY = pointB.y - pointA.y;
    return {
      length: Math.hypot(lengthX, lengthY),
      angle: Math.atan2(lengthY, lengthX)
    };
  };

  const controlPoint = (current, previous, next, reverse = false, smoothing = 0.2) => {
    const p = previous || current;
    const n = next || current;
    const { length, angle } = lineProps(p, n);
    const adjustedAngle = angle + (reverse ? Math.PI : 0);
    const adjustedLength = length * smoothing;
    return {
      x: current.x + Math.cos(adjustedAngle) * adjustedLength,
      y: current.y + Math.sin(adjustedAngle) * adjustedLength
    };
  };

  const generateSmoothPath = (pts) => {
    if (pts.length === 0) return '';
    return pts.reduce((path, point, i, a) => {
      if (i === 0) {
        return `M ${point.x} ${point.y}`;
      }
      const cps = controlPoint(a[i - 1], a[i - 2], point, false);
      const cpe = controlPoint(point, a[i - 1], a[i + 1], true);
      return `${path} C ${cps.x} ${cps.y}, ${cpe.x} ${cpe.y}, ${point.x} ${point.y}`;
    }, '');
  };

  // Create smooth SVG line graph
  const renderLineGraph = () => {
    if (graphData.length === 0) {
      return (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: 200,
          color: 'text.secondary'
        }}>
          <Typography variant="body2">No grade data available</Typography>
        </Box>
      );
    }

    const width = 400;
    const height = 220;
    const padding = 40;
    const graphWidth = width - 2 * padding;
    const graphHeight = height - 2 * padding;

    // Fixed grade scale to 0–100
    const yMin = 0;
    const yMax = 100;
    const safeRange = Math.max(yMax - yMin, 1);

    // Create points for the curve using raw grade values (0–100)
    const points = graphData.map((data, index) => {
      const x = padding + (index / Math.max(graphData.length - 1, 1)) * graphWidth;
      const value = typeof data.grade === 'number' ? data.grade : Number(data.grade) || 0;
      const clamped = Math.min(yMax, Math.max(yMin, value));
      const y = height - padding - ((clamped - yMin) / safeRange) * graphHeight;
      return { x, y, value, ...data };
    });

    // Smooth curve path
    const smoothPath = generateSmoothPath(points);

    // Area fill path based on smooth curve
    const areaPathData = `${smoothPath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    // Compute label indices to avoid clutter (max ~6 labels)
    const maxLabels = 6;
    const step = Math.max(1, Math.ceil(points.length / maxLabels));

    return (
      <Box sx={{ position: 'relative', width: '100%', height: 220 }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>          
          {/* Grid lines */}
          {Array.from({ length: 5 }, (_, i) => {
            const y = padding + (i / 4) * graphHeight;
            return (
              <line
                key={`grid-${i}`}
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke={theme.palette.divider}
                strokeWidth="1"
                opacity={0.3}
              />
            );
          })}

          {/* Y-axis labels (0–100) */}
          {Array.from({ length: 5 }, (_, i) => {
            const y = padding + (i / 4) * graphHeight;
            const value = yMax - (i / 4) * (yMax - yMin);
            return (
              <text
                key={`y-label-${i}`}
                x={padding - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="12"
                fill={theme.palette.text.secondary}
              >
                {Math.round(value)}
              </text>
            );
          })}

          {/* X-axis labels (sparse) */}
          {points.map((point, index) => (
            (index % step === 0 || index === points.length - 1) && (
              <text
                key={`x-label-${index}`}
                x={point.x}
                y={height - padding + 20}
                textAnchor="middle"
                fontSize="10"
                fill={theme.palette.text.secondary}
              >
                {point.date}
              </text>
            )
          ))}

          {/* Filled area under curve */}
          <path
            d={areaPathData}
            fill={theme.palette.primary.main}
            opacity={0.2}
          />

          {/* Smooth curve */}
          <path
            ref={pathRef}
            d={smoothPath}
            stroke={theme.palette.primary.main}
            strokeWidth="3"
            fill="none"
            style={{
              strokeDasharray: dashLength,
              strokeDashoffset: dashOffset,
              transition: 'stroke-dashoffset 900ms ease-out'
            }}
          />

          {/* Data points */}
          {points.map((point, index) => (
            <circle
              key={`point-${index}`}
              cx={point.x}
              cy={point.y}
              r="4"
              fill={theme.palette.primary.main}
              stroke={theme.palette.background.paper}
              strokeWidth="2"
            />
          ))}
        </svg>
      </Box>
    );
  };

  return (
    <Card>
      <CardHeader 
        title="Grades Overview" 
        avatar={<ShowChartIcon color="primary" />}
        action={
          <Button 
            size="small" 
            onClick={onViewAll}
            startIcon={<VisibilityIcon />}
            sx={{
              color: theme.palette.primary.main,
              '&:hover': {
                backgroundColor: theme => `${theme.palette.primary.main}10`
              }
            }}
          >
            View All
          </Button>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        {renderLineGraph()}
      </CardContent>
    </Card>
  );
};


