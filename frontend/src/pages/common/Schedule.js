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
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Subject as SubjectIcon,
  School as SchoolIcon,
  ExpandMore as ExpandMoreIcon,
  AccessTime as TimeIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';

const Schedule = () => {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { user, token } = useSelector((state) => state.auth);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  useEffect(() => {
    fetchScheduleData();
  }, []);
  
  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      const response = await axios.get('/api/schedule', config);
      console.log('Schedule data received:', response.data);
      
      setScheduleData(response.data);
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setError(err.response?.data?.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };
  
  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };
  
  const getTimeRange = (startTime, endTime) => {
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };
  
  const getRoleSpecificInfo = (classInfo) => {
    if (user.role === 'student') {
      return {
        title: classInfo.subject,
        subtitle: classInfo.className,
        details: classInfo.teachers?.map(t => t.name).join(', ') || 'No teacher assigned',
        icon: <SubjectIcon />,
        color: 'primary'
      };
    } else if (user.role === 'teacher') {
      return {
        title: classInfo.subject,
        subtitle: classInfo.className,
        details: `${classInfo.studentCount || 0} students`,
        icon: <GroupIcon />,
        color: 'secondary'
      };
    } else if (user.role === 'admin') {
      return {
        title: classInfo.subject,
        subtitle: classInfo.className,
        details: `${classInfo.teacherCount || 0} teachers, ${classInfo.studentCount || 0} students`,
        icon: <SchoolIcon />,
        color: 'success'
      };
    }
  };
  
  const ClassCard = ({ classInfo }) => {
    const roleInfo = getRoleSpecificInfo(classInfo);
    
    return (
      <Card 
        sx={{ 
          mb: 1, 
          border: `2px solid ${theme.palette[roleInfo.color].light}`,
          borderRadius: 2,
          '&:hover': {
            boxShadow: theme.shadows[4],
            transform: 'translateY(-2px)',
            transition: 'all 0.2s ease-in-out'
          }
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box display="flex" alignItems="center" mb={1}>
            {roleInfo.icon}
            <Typography variant="h6" sx={{ ml: 1, fontWeight: 'bold' }}>
              {roleInfo.title}
            </Typography>
          </Box>
          
          <Typography variant="subtitle2" color="textSecondary" mb={1}>
            {roleInfo.subtitle}
          </Typography>
          
          <Box display="flex" alignItems="center" mb={1}>
            <TimeIcon fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="body2" fontWeight="medium">
              {getTimeRange(classInfo.startTime, classInfo.endTime)}
            </Typography>
          </Box>
          
          <Typography variant="body2" color="textSecondary" mb={1}>
            {roleInfo.details}
          </Typography>
          
          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip 
              label={classInfo.schoolBranch} 
              size="small" 
              color={roleInfo.color}
              variant="outlined"
            />
            <Chip 
              label={classInfo.direction} 
              size="small" 
              color="default"
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>
    );
  };
  
  const DaySchedule = ({ day, classes }) => {
    const hasClasses = classes && classes.length > 0;
    
    if (isMobile) {
      return (
        <Accordion sx={{ mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" width="100%">
              <CalendarIcon sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                {day}
              </Typography>
              <Chip 
                label={hasClasses ? `${classes.length} classes` : 'No classes'} 
                size="small" 
                color={hasClasses ? 'primary' : 'default'}
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {hasClasses ? (
              classes.map((classInfo, index) => (
                <ClassCard key={index} classInfo={classInfo} />
              ))
            ) : (
              <Typography variant="body2" color="textSecondary" textAlign="center" py={2}>
                No classes scheduled
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>
      );
    }
    
    return (
      <Paper elevation={2} sx={{ p: 2, height: '100%', borderRadius: 2 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <CalendarIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight="bold">
            {day}
          </Typography>
          <Chip 
            label={hasClasses ? `${classes.length}` : '0'} 
            size="small" 
            color={hasClasses ? 'primary' : 'default'}
            sx={{ ml: 'auto' }}
          />
        </Box>
        
        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
          {hasClasses ? (
            classes.map((classInfo, index) => (
              <ClassCard key={index} classInfo={classInfo} />
            ))
          ) : (
            <Typography variant="body2" color="textSecondary" textAlign="center" py={4}>
              No classes scheduled
            </Typography>
          )}
        </Box>
      </Paper>
    );
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }
  
  const getRoleTitle = () => {
    switch (user.role) {
      case 'student':
        return 'My Class Schedule';
      case 'teacher':
        return 'My Teaching Schedule';
      case 'admin':
        return 'School Schedule Overview';
      default:
        return 'Schedule';
    }
  };
  
  const getRoleIcon = () => {
    switch (user.role) {
      case 'student':
        return <PersonIcon />;
      case 'teacher':
        return <SubjectIcon />;
      case 'admin':
        return <SchoolIcon />;
      default:
        return <ScheduleIcon />;
    }
  };
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={4}>
        {getRoleIcon()}
        <Typography variant="h4" sx={{ ml: 2, fontWeight: 'bold' }}>
          {getRoleTitle()}
        </Typography>
        <Chip 
          label={`${scheduleData?.totalClasses || 0} total classes`}
          color="primary"
          sx={{ ml: 'auto' }}
        />
      </Box>
      
      {/* Schedule Grid */}
      {isMobile ? (
        <Box>
          {daysOfWeek.map((day) => (
            <DaySchedule 
              key={day} 
              day={day} 
              classes={scheduleData?.schedule?.[day] || []} 
            />
          ))}
        </Box>
      ) : (
        <Grid container spacing={2}>
          {daysOfWeek.map((day) => (
            <Grid item xs={12} sm={6} md={4} lg={12/7} key={day}>
              <DaySchedule 
                day={day} 
                classes={scheduleData?.schedule?.[day] || []} 
              />
            </Grid>
          ))}
        </Grid>
      )}
      
      {scheduleData?.totalClasses === 0 && (
        <Box textAlign="center" py={8}>
          <ScheduleIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" color="textSecondary" mb={1}>
            No Classes Scheduled
          </Typography>
          <Typography variant="body1" color="textSecondary">
            {user.role === 'student' 
              ? "You don't have any classes scheduled yet."
              : user.role === 'teacher'
              ? "You don't have any teaching assignments yet."
              : "No classes are scheduled in your school yet."
            }
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default Schedule;
