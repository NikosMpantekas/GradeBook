import React, { useState, useEffect } from 'react';
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
  useMediaQuery
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
  Class as ClassIcon
} from '@mui/icons-material';
import { format, isValid, parseISO } from 'date-fns';
import { useFeatureToggles } from '../../context/FeatureToggleContext';

/**
 * Welcome Panel Component
 * Shows current time, date, and personalized greeting
 */
export const WelcomePanel = ({ user }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

  return (
    <Card 
      sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        mb: 3
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 0 } }}>
          <Box>
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
            sx={{ 
              width: { xs: 60, sm: 80 }, 
              height: { xs: 60, sm: 80 },
              bgcolor: 'rgba(255,255,255,0.2)',
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>
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

  return (
    <Card>
      <CardHeader 
        title="Profile Information" 
        avatar={<PersonIcon color="primary" />}
      />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
          <List sx={{ py: 0 }}>
            {notifications.slice(0, 5).map((notification, index) => (
              <ListItem key={notification._id || index} sx={{ px: 0 }}>
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
                        fontWeight: notification.isRead ? 'normal' : 'bold',
                        flex: 1
                      }}>
                        {notification.title}
                      </Typography>
                      {notification.isImportant && (
                        <Chip label="Important" size="small" color="warning" variant="outlined" />
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(notification.createdAt)}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
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
          <List sx={{ py: 0 }}>
            {grades.slice(0, 5).map((grade, index) => (
              <ListItem key={grade._id || index} sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar sx={{ 
                    bgcolor: `${getGradeColor(grade.value)}.main`,
                    width: 36,
                    height: 36
                  }}>
                    <GradeIcon fontSize="small" />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {grade.subject?.name || grade.subjectName || 'Unknown Subject'}
                      {userRole !== 'student' && grade.student && (
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          - {grade.student.name}
                        </Typography>
                      )}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(grade.createdAt)} • {grade.description || 'No description'}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <Chip 
                    label={grade.value} 
                    color={getGradeColor(grade.value)}
                    size="small"
                    variant="filled"
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
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
            >
              View All
            </Button>
          )
        }
      />
      <CardContent sx={{ pt: 0 }}>
        {classes.length === 0 ? (
          <Alert severity="info" sx={{ mt: 1 }}>
            No upcoming classes scheduled
          </Alert>
        ) : (
          <List sx={{ py: 0 }}>
            {classes.slice(0, 5).map((classItem, index) => (
              <ListItem key={classItem._id || index} sx={{ px: 0 }}>
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
                      {classItem.subject || classItem.className || 'Unknown Subject'}
                      {userRole === 'admin' && classItem.teacher && (
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          - {classItem.teacher.name}
                        </Typography>
                      )}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {classItem.startTime && classItem.endTime ? (
                          `${formatTime(classItem.startTime)} - ${formatTime(classItem.endTime)}`
                        ) : (
                          'Time not specified'
                        )}
                      </Typography>
                      {classItem.room && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          • Room {classItem.room}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};
