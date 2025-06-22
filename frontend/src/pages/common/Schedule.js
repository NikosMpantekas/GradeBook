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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Subject as SubjectIcon,
  School as SchoolIcon,
  AccessTime as TimeIcon,
  CalendarMonth as CalendarIcon,
  AdminPanelSettings as AdminIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import axios from 'axios';

const Schedule = () => {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Filter states for admin and teacher
  const [filters, setFilters] = useState({
    schoolBranch: '',
    teacher: ''
  });
  const [filterOptions, setFilterOptions] = useState({
    schoolBranches: [],
    teachers: []
  });
  const [loadingFilters, setLoadingFilters] = useState(false);
  
  const { user, token } = useSelector((state) => state.auth);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];
  
  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'teacher') {
      loadFilterOptions();
    }
    fetchScheduleData();
  }, []);

  // Load filter options for admins and teachers
  const loadFilterOptions = async () => {
    setLoadingFilters(true);
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      
      const response = await axios.get('/api/students/teacher/filters', config);
      const { schoolBranches, teachers = [] } = response.data;
      
      // For admins, also fetch teachers
      let teacherOptions = [];
      if (user?.role === 'admin') {
        const teachersResponse = await axios.get('/api/users/teachers', config);
        teacherOptions = teachersResponse.data.map(teacher => ({
          value: teacher._id,
          label: teacher.name
        }));
      }
      
      setFilterOptions({
        schoolBranches: schoolBranches || [],
        teachers: teacherOptions
      });
    } catch (error) {
      console.error('Error loading filter options:', error);
    } finally {
      setLoadingFilters(false);
    }
  };
  
  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      
      // Build query parameters for filters
      const queryParams = new URLSearchParams();
      if (filters.schoolBranch) queryParams.append('schoolBranch', filters.schoolBranch);
      if (filters.teacher) queryParams.append('teacherId', filters.teacher);
      
      const queryString = queryParams.toString();
      const url = `/api/schedule${queryString ? `?${queryString}` : ''}`;
      
      const response = await axios.get(url, config);
      setScheduleData(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setError('Failed to load schedule data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  // Apply filters
  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'teacher') {
      fetchScheduleData();
    }
  }, [filters.schoolBranch, filters.teacher]);

  // Handle event click
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setDialogOpen(true);
  };

  // Format time to 12-hour format
  const formatTime = (time24) => {
    const [hours, minutes] = time24.split(':');
    const hour12 = parseInt(hours) % 12 || 12;
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Get events for a specific day and time slot
  const getEventsForTimeSlot = (day, timeSlot) => {
    if (!scheduleData || !scheduleData[day]) return [];
    
    return scheduleData[day].filter(event => {
      const eventStartHour = parseInt(event.startTime.split(':')[0]);
      const slotHour = parseInt(timeSlot.split(':')[0]);
      const eventEndHour = parseInt(event.endTime.split(':')[0]);
      
      return eventStartHour <= slotHour && slotHour < eventEndHour;
    });
  };

  // Render event in calendar
  const renderEvent = (event, isCompact = false) => {
    const duration = calculateDuration(event.startTime, event.endTime);
    
    return (
      <Card
        key={`${event.classId}-${event.startTime}`}
        sx={{
          mb: 0.5,
          cursor: 'pointer',
          backgroundColor: theme.palette.primary.light,
          '&:hover': {
            backgroundColor: theme.palette.primary.main,
            color: 'white'
          },
          minHeight: isCompact ? 'auto' : `${duration * 40}px`,
          transition: 'all 0.2s ease'
        }}
        onClick={() => handleEventClick(event)}
      >
        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
          <Typography variant="caption" component="div" sx={{ fontWeight: 'bold' }}>
            {event.subject}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatTime(event.startTime)} - {formatTime(event.endTime)}
          </Typography>
          {!isCompact && (
            <Typography variant="caption" display="block">
              {event.teacherNames?.join(', ') || 'No teacher assigned'}
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  };

  // Calculate duration in hours
  const calculateDuration = (startTime, endTime) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    return (endHour * 60 + endMin - startHour * 60 - startMin) / 60;
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ my: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ my: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ my: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <CalendarIcon color="primary" sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Weekly Schedule
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {user?.role === 'student' && 'Your class timetable for the week'}
              {user?.role === 'teacher' && 'Your teaching schedule and classes'}
              {user?.role === 'admin' && 'School-wide class schedules and timetables'}
            </Typography>
          </Box>
        </Box>

        {/* Filters for Admin and Teacher */}
        {(user?.role === 'admin' || user?.role === 'teacher') && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Filter Schedule
            </Typography>
            <Grid container spacing={2}>
              {/* School Branch Filter */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>School Branch</InputLabel>
                  <Select
                    value={filters.schoolBranch}
                    onChange={(e) => handleFilterChange('schoolBranch', e.target.value)}
                    label="School Branch"
                    disabled={loadingFilters}
                  >
                    <MenuItem value="">
                      <em>All Branches</em>
                    </MenuItem>
                    {filterOptions.schoolBranches.map((branch) => (
                      <MenuItem key={branch.value} value={branch.value}>
                        {branch.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Teacher Filter (Admin only) */}
              {user?.role === 'admin' && (
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Teacher</InputLabel>
                    <Select
                      value={filters.teacher}
                      onChange={(e) => handleFilterChange('teacher', e.target.value)}
                      label="Teacher"
                      disabled={loadingFilters}
                    >
                      <MenuItem value="">
                        <em>All Teachers</em>
                      </MenuItem>
                      {filterOptions.teachers.map((teacher) => (
                        <MenuItem key={teacher.value} value={teacher.value}>
                          {teacher.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Calendar Grid */}
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        {isMobile ? (
          // Mobile view - Day by day accordion
          <Box>
            {daysOfWeek.map((day) => (
              <Card key={day} sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {day}
                  </Typography>
                  {scheduleData && scheduleData[day] && scheduleData[day].length > 0 ? (
                    scheduleData[day].map((event, index) => renderEvent(event, true))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No classes scheduled
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          // Desktop view - Calendar grid
          <Box sx={{ overflow: 'auto' }}>
            <Grid container>
              {/* Time column */}
              <Grid item xs={1}>
                <Box sx={{ position: 'sticky', left: 0, backgroundColor: 'background.paper', zIndex: 1 }}>
                  <Typography variant="body2" sx={{ p: 1, height: '60px', display: 'flex', alignItems: 'center' }}>
                    Time
                  </Typography>
                  {timeSlots.map((timeSlot) => (
                    <Box
                      key={timeSlot}
                      sx={{
                        height: '80px',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        alignItems: 'center',
                        px: 1
                      }}
                    >
                      <Typography variant="caption">
                        {formatTime(timeSlot)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>

              {/* Days columns */}
              {daysOfWeek.map((day) => (
                <Grid item xs key={day} sx={{ minWidth: '150px' }}>
                  <Box>
                    {/* Day header */}
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        p: 1, 
                        textAlign: 'center', 
                        borderBottom: '2px solid',
                        borderColor: 'primary.main',
                        backgroundColor: 'primary.light',
                        height: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {day}
                    </Typography>
                    
                    {/* Time slots for this day */}
                    {timeSlots.map((timeSlot) => {
                      const events = getEventsForTimeSlot(day, timeSlot);
                      return (
                        <Box
                          key={`${day}-${timeSlot}`}
                          sx={{
                            height: '80px',
                            borderBottom: '1px solid',
                            borderRight: '1px solid',
                            borderColor: 'divider',
                            p: 0.5,
                            backgroundColor: events.length > 0 ? 'action.hover' : 'transparent'
                          }}
                        >
                          {events.map((event) => renderEvent(event))}
                        </Box>
                      );
                    })}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Event Details Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Class Details</Typography>
          <IconButton onClick={() => setDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    <SubjectIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Subject: {selectedEvent.subject}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <TimeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Time: {formatTime(selectedEvent.startTime)} - {formatTime(selectedEvent.endTime)}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    School Branch: {selectedEvent.schoolBranch}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Direction: {selectedEvent.direction}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Teachers ({selectedEvent.teacherCount || 0}):
                  </Typography>
                  {selectedEvent.teacherNames && selectedEvent.teacherNames.length > 0 ? (
                    selectedEvent.teacherNames.map((teacher, index) => (
                      <Chip key={index} label={teacher} sx={{ mr: 1, mb: 1 }} />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No teachers assigned
                    </Typography>
                  )}
                  
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    <GroupIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Students ({selectedEvent.studentCount || 0}):
                  </Typography>
                  {selectedEvent.studentNames && selectedEvent.studentNames.length > 0 ? (
                    <Box sx={{ maxHeight: '200px', overflow: 'auto' }}>
                      {selectedEvent.studentNames.slice(0, 10).map((student, index) => (
                        <Chip key={index} label={student} sx={{ mr: 1, mb: 1 }} size="small" />
                      ))}
                      {selectedEvent.studentNames.length > 10 && (
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                          and {selectedEvent.studentNames.length - 10} more students...
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No students enrolled
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Schedule;
