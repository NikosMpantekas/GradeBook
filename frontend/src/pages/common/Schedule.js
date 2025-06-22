import React, { useState, useEffect, Fragment } from 'react';
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
  
  // Store branch names for display (mapping branch IDs to names)
  const [branchNames, setBranchNames] = useState({});
  
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

  // Fetch branch names for display from their IDs
  const fetchBranchNames = async (branchIds) => {
    if (!branchIds || branchIds.length === 0) return;
    
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      
      const response = await axios.post('/api/branches/batch', { branchIds }, config);
      
      if (response.data && Array.isArray(response.data)) {
        const branchNameMap = {};
        response.data.forEach(branch => {
          branchNameMap[branch._id] = branch.name;
        });
        
        setBranchNames(branchNameMap);
        console.log('Branch names loaded:', branchNameMap);
      }
    } catch (error) {
      console.error('Error fetching branch names:', error);
    }
  };
  
  // Load filter options for admins and teachers
  const loadFilterOptions = async () => {
    setLoadingFilters(true);
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      
      console.log('Loading filter options for role:', user?.role);
      
      const response = await axios.get('/api/students/teacher/filters', config);
      console.log('Filter API response:', response.data);
      
      const { schoolBranches = [] } = response.data;
      
      // For admins, also fetch teachers
      let teacherOptions = [];
      if (user?.role === 'admin') {
        console.log('Loading teacher options for admin');
        const teachersResponse = await axios.get('/api/users/teachers', config);
        console.log('Teachers API response:', teachersResponse.data);
        
        teacherOptions = teachersResponse.data.map(teacher => ({
          value: teacher._id,
          label: teacher.name
        }));
      }
      
      const branches = schoolBranches || [];
      console.log('Setting filter options - branches:', branches);
      console.log('Setting filter options - teachers:', teacherOptions);
      
      setFilterOptions({
        schoolBranches: branches,
        teachers: teacherOptions
      });
      
      // Fetch branch names for display if we have branch IDs
      if (branches.length > 0) {
        const branchIds = branches.map(branch => branch.value);
        console.log('Fetching branch names for IDs:', branchIds);
        fetchBranchNames(branchIds);
      } else {
        console.warn('No branch IDs available to fetch names');
      }
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
      
      console.log('Fetching schedule data from URL:', url);
      const response = await axios.get(url, config);
      
      // Ensure we have the right data structure
      if (response.data && response.data.schedule) {
        console.log('Schedule data loaded:', response.data.schedule);
        
        // Extract branch IDs from schedule data for name resolution
        const branchIds = new Set();
        
        // Process each day's events
        Object.keys(response.data.schedule).forEach(day => {
          const events = response.data.schedule[day];
          if (Array.isArray(events)) {
            events.forEach(event => {
              if (event.schoolBranch) {
                branchIds.add(event.schoolBranch);
              }
            });
          }
        });
        
        // Fetch branch names for all events if not already loaded
        if (branchIds.size > 0) {
          console.log('Fetching branch names for events:', Array.from(branchIds));
          fetchBranchNames(Array.from(branchIds));
        }
        
        setScheduleData(response.data.schedule);
      } else {
        console.warn('Unexpected schedule data format:', response.data);
        setScheduleData({});
      }
      
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

  // Apply filters and trigger data refresh when filters change
  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'teacher') {
      fetchScheduleData();
      
      // Debug log current filter state
      console.log('Current filters:', filters);
      console.log('Current filter options:', filterOptions);
    }
  }, [filters.schoolBranch, filters.teacher]);

  // Handle event click
  const handleEventClick = (event) => {
    console.log('Event clicked:', event);
    
    // Ensure we have all needed properties for display
    const enhancedEvent = {
      ...event,
      // Ensure we have arrays for teachers and students
      teacherNames: event.teacherNames || [],
      studentNames: event.studentNames || [],
      // Calculate counts if not provided
      teacherCount: event.teacherCount || (event.teacherNames ? event.teacherNames.length : 0),
      studentCount: event.studentCount || (event.studentNames ? event.studentNames.length : 0)
    };
    
    console.log('Enhanced event for dialog:', enhancedEvent);
    setSelectedEvent(enhancedEvent);
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
    
    // Get branch name if available from our mapping
    const branchName = event.schoolBranch ? 
      (branchNames[event.schoolBranch] || event.schoolBranch) : 
      'Unknown Branch';
    
    // Handle teacher display
    const teacherDisplay = event.teacherNames?.length > 0 ? 
      ` • ${event.teacherNames[0]}${event.teacherNames.length > 1 ? ` +${event.teacherNames.length - 1}` : ''}` : 
      '';
      
    return (
      <Card
        key={event._id}
        sx={{
          mb: 0.5,
          cursor: 'pointer',
          bgcolor: 'primary.light',
          color: 'primary.contrastText',
          p: isCompact ? 0.5 : 1,
          '&:hover': { boxShadow: 3 },
          overflow: 'hidden'
        }}
        onClick={() => handleEventClick(event)}
      >
        <CardContent sx={{ p: isCompact ? '4px !important' : '8px !important' }}>
          <Typography variant={isCompact ? 'caption' : 'subtitle2'} noWrap fontWeight="bold">
            {event.subject} 
          </Typography>
          {!isCompact && (
            <>
              <Typography variant="caption" noWrap display="block">
                {formatTime(event.startTime)} - {formatTime(event.endTime)}
                {teacherDisplay}
              </Typography>
              <Typography variant="caption" noWrap display="block" sx={{ opacity: 0.8 }}>
                {branchName}
              </Typography>
            </>
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
                        {/* Display branch name from mapping if available, otherwise use label */}
                        {branchNames[branch.value] || branch.label}
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
          <Box sx={{ overflow: 'auto', minWidth: '1200px' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '100px repeat(7, 1fr)', gap: 0 }}>
              {/* Time column header */}
              <Box sx={{ 
                position: 'sticky', 
                left: 0, 
                backgroundColor: 'background.paper', 
                zIndex: 2,
                borderBottom: '2px solid',
                borderColor: 'primary.main'
              }}>
                <Typography variant="h6" sx={{ p: 1, height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Time
                </Typography>
              </Box>

              {/* Day headers */}
              {daysOfWeek.map((day) => (
                <Box key={`header-${day}`} sx={{
                  borderBottom: '2px solid',
                  borderColor: 'primary.main',
                  backgroundColor: 'primary.light'
                }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      p: 1, 
                      textAlign: 'center', 
                      height: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: { xs: '0.9rem', sm: '1.1rem' }
                    }}
                  >
                    {day}
                  </Typography>
                </Box>
              ))}

              {/* Time slots */}
              {timeSlots.map((timeSlot) => (
                <React.Fragment key={timeSlot}>
                  {/* Time label */}
                  <Box sx={{
                    height: '80px',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    px: 1,
                    position: 'sticky',
                    left: 0,
                    backgroundColor: 'background.paper',
                    zIndex: 1
                  }}>
                    <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                      {formatTime(timeSlot)}
                    </Typography>
                  </Box>

                  {/* Day cells for this time slot */}
                  {daysOfWeek.map((day) => {
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
                          backgroundColor: events.length > 0 ? 'action.hover' : 'transparent',
                          overflow: 'hidden'
                        }}
                      >
                        {events.map((event) => renderEvent(event))}
                      </Box>
                    );
                  })}
                </React.Fragment>
              ))}
            </Box>
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
                    School Branch: {branchNames[selectedEvent.schoolBranch] || selectedEvent.schoolBranch}
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
