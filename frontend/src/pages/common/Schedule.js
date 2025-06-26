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
  Divider,
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
  AccessTime as TimeIcon,
  CalendarMonth as CalendarIcon,
  AdminPanelSettings as AdminIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon
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
  
  // Store subject colors for consistent coloring
  const [subjectColors, setSubjectColors] = useState({});
  
  // Event rendering reference to avoid duplicates
  const renderedEventsRef = React.useRef(new Set());
  
  const { user, token } = useSelector((state) => state.auth);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', 
    '21:00', '22:00', '23:00'
  ];
  
  // Generate consistent color for a subject based on its name
  const getSubjectColor = (subjectName) => {
    if (!subjectName) return theme.palette.primary.main;
    
    if (subjectColors[subjectName]) {
      return subjectColors[subjectName];
    }
    
    // Generate a consistent color based on subject name
    const colors = [
      '#1976d2', '#d32f2f', '#388e3c', '#f57c00', '#7b1fa2',
      '#0288d1', '#c2185b', '#00796b', '#5d4037', '#455a64',
      '#e64a19', '#512da8', '#00695c', '#6a1b9a', '#f9a825'
    ];
    
    // Simple hash function to get consistent color for same subject
    let hash = 0;
    for (let i = 0; i < subjectName.length; i++) {
      hash = subjectName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colors.length;
    const color = colors[colorIndex];
    
    setSubjectColors(prev => ({ ...prev, [subjectName]: color }));
    return color;
  };
  
  // Merge consecutive time slots for the same class/subject
  const mergeConsecutiveClasses = (events) => {
    if (!events || events.length === 0) return events;
    
    // Sort events by start time
    const sortedEvents = [...events].sort((a, b) => a.startTime.localeCompare(b.startTime));
    const mergedEvents = [];
    
    for (let i = 0; i < sortedEvents.length; i++) {
      const currentEvent = sortedEvents[i];
      
      // Look for the next event that might be a continuation
      let endTime = currentEvent.endTime;
      let mergedEvent = { ...currentEvent };
      
      // Check if next events are consecutive and same subject/class
      for (let j = i + 1; j < sortedEvents.length; j++) {
        const nextEvent = sortedEvents[j];
        
        // Check if this is a consecutive time slot for the same class
        if (
          nextEvent.startTime === endTime &&
          nextEvent.subject === currentEvent.subject &&
          nextEvent.schoolBranch === currentEvent.schoolBranch &&
          nextEvent.direction === currentEvent.direction
        ) {
          // Merge this event
          endTime = nextEvent.endTime;
          mergedEvent.endTime = endTime;
          
          // Merge teacher and student arrays
          if (nextEvent.teacherNames) {
            mergedEvent.teacherNames = [...new Set([
              ...(mergedEvent.teacherNames || []),
              ...nextEvent.teacherNames
            ])];
          }
          if (nextEvent.studentNames) {
            mergedEvent.studentNames = [...new Set([
              ...(mergedEvent.studentNames || []),
              ...nextEvent.studentNames
            ])];
          }
          
          // Update counts
          mergedEvent.teacherCount = mergedEvent.teacherNames?.length || 0;
          mergedEvent.studentCount = mergedEvent.studentNames?.length || 0;
          
          // Skip this event in the next iteration
          i = j;
        } else {
          break;
        }
      }
      
      mergedEvents.push(mergedEvent);
    }
    
    return mergedEvents;
  };
  
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
      
      console.log('Fetching branch names for IDs:', branchIds);
      const response = await axios.post('/api/branches/batch', { branchIds }, config);
      
      if (response.data && Array.isArray(response.data)) {
        const branchNameMap = {};
        response.data.forEach(branch => {
          if (branch && branch._id && branch.name) {
            branchNameMap[branch._id] = branch.name;
          }
        });
        
        setBranchNames(prev => ({ ...prev, ...branchNameMap }));
        console.log('Branch names loaded:', branchNameMap);
      } else {
        console.warn('Invalid branch data format received:', response.data);
      }
    } catch (error) {
      console.error('Error fetching branch names:', error);
      // Set fallback branch names to avoid showing IDs
      const fallbackNames = {};
      branchIds.forEach(id => {
        if (id && !branchNames[id]) {
          fallbackNames[id] = `Branch ${id.slice(-4)}`;
        }
      });
      if (Object.keys(fallbackNames).length > 0) {
        setBranchNames(prev => ({ ...prev, ...fallbackNames }));
      }
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
        try {
          console.log('Loading teacher options for admin');
          
          // Use regular users endpoint and filter for teachers
          const teachersResponse = await axios.get('/api/users', config);
          console.log('Users API response found:', teachersResponse.data?.length || 0, 'users');
          
          // Extract only teachers from the response
          const teachers = teachersResponse.data?.filter(user => user.role === 'teacher') || [];
          console.log('Filtered', teachers.length, 'teachers from users list');
          
          teacherOptions = teachers.map(teacher => ({
            value: teacher._id,
            label: teacher.name
          }));
        } catch (error) {
          console.error('Error fetching teachers:', error);
        }
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
        const branchIds = branches.map(branch => branch.value || branch._id || branch.id).filter(Boolean);
        if (branchIds.length > 0) {
          console.log('Fetching branch names for filter IDs:', branchIds);
          fetchBranchNames(branchIds);
        }
      } else {
        console.warn('No branch data available in filter options');
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
      setError('Failed to load filter options. Some features may not work properly.');
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
      
      console.log('Schedule - Fetching data for role:', user?.role);
      console.log('Schedule - Request URL:', url);
      console.log('Schedule - Current filters:', filters);
      
      const response = await axios.get(url, config);
      
      // Ensure we have the right data structure
      if (response.data && response.data.schedule) {
        console.log('Schedule - API success, raw data:', response.data);
        console.log('Schedule - Total classes reported by API:', response.data.totalClasses || 0);
        
        // Check if we have any classes at all
        let totalEvents = 0;
        Object.keys(response.data.schedule).forEach(day => {
          const events = response.data.schedule[day];
          if (Array.isArray(events)) {
            totalEvents += events.length;
            console.log(`Schedule - Day ${day}: ${events.length} events`);
          }
        });
        console.log('Schedule - Total events across all days:', totalEvents);
        
        // Process schedule data and ensure each event has a unique ID
        const processedSchedule = {};
        Object.keys(response.data.schedule).forEach(day => {
          const events = response.data.schedule[day];
          if (Array.isArray(events)) {
            processedSchedule[day] = events.map((event, index) => {
              // Ensure each event has a unique ID for rendering
              return { 
                ...event,
                _id: event._id || event.classId || `event-${day}-${index}`
              };
            });
          } else {
            processedSchedule[day] = [];
          }
        });
        
        // Extract branch IDs from schedule data for name resolution
        const branchIds = new Set();
        Object.keys(processedSchedule).forEach(day => {
          const events = processedSchedule[day];
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
          console.log('Schedule - Fetching branch names for events:', Array.from(branchIds));
          fetchBranchNames(Array.from(branchIds));
        }
        
        setScheduleData(processedSchedule);
        console.log('Schedule - Data processed and set to state');
      } else {
        console.warn('Schedule - Unexpected data format received:', response.data);
        setScheduleData({});
      }
      
      setError(null);
    } catch (error) {
      console.error('Schedule - Error fetching data:', error);
      setError(`Failed to load schedule data: ${error.message || 'Unknown error'}`);
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

  // Clear rendered events ref when schedule data changes
  useEffect(() => {
    renderedEventsRef.current = new Set();
    fetchScheduleData();
    loadFilterOptions();
  }, [user?.role, filters]);

  // Load filter options once on component mount
  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'teacher') {
      loadFilterOptions();
    }
  }, [user?.role]);

  // Reset rendered events on each render
  useEffect(() => {
    renderedEventsRef.current = new Set();
  });

  // Handle event click
  const handleEventClick = (event) => {
    console.log('Event clicked:', event);
    
    // Log branch info for debugging
    if (event.schoolBranch) {
      console.log('School branch ID:', event.schoolBranch);
      console.log('Mapped branch name:', branchNames[event.schoolBranch] || 'Not found in mapping');
    }
    
    // Enhanced event processing for dialog display
    const enhancedEvent = {
      ...event,
      // Handle teachers data - check multiple possible formats
      teacherNames: event.teacherNames || 
                   (event.teachers ? event.teachers.map(t => t.name || t) : []) ||
                   (event.teacher ? [typeof event.teacher === 'object' ? event.teacher.name : event.teacher] : []),
      
      // Handle students data - check multiple possible formats  
      studentNames: event.studentNames || 
                   (event.students ? event.students.map(s => s.name || s) : []) ||
                   (event.student ? [typeof event.student === 'object' ? event.student.name : event.student] : []),
      
      // Calculate counts if not provided
      teacherCount: event.teacherCount || 
                   (event.teacherNames ? event.teacherNames.length : 0) ||
                   (event.teachers ? event.teachers.length : 0) ||
                   (event.teacher ? 1 : 0),
                   
      studentCount: event.studentCount || 
                   (event.studentNames ? event.studentNames.length : 0) ||
                   (event.students ? event.students.length : 0) ||
                   (event.student ? 1 : 0),
      
      // Ensure branch name is resolved
      schoolBranchName: branchNames[event.schoolBranch] || event.schoolBranch || 'Unknown Branch'
    };
    
    console.log('Enhanced event for dialog:', enhancedEvent);
    console.log('Teachers data:', {
      original: event.teachers || event.teacher || event.teacherNames,
      processed: enhancedEvent.teacherNames,
      count: enhancedEvent.teacherCount
    });
    console.log('Students data:', {
      original: event.students || event.student || event.studentNames,
      processed: enhancedEvent.studentNames,
      count: enhancedEvent.studentCount
    });
    
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

  // Get events for a specific day and time slot - UPDATED to prevent splitting
  const getEventsForTimeSlot = (day, timeSlot) => {
    if (!scheduleData || !scheduleData[day]) {
      console.log(`Schedule - No data for day: ${day}`);
      return [];
    }
    
    // Only return events that START at this time slot (not events that span through it)
    const timeSlotHour = parseInt(timeSlot.split(':')[0]);
    const events = scheduleData[day].filter(event => {
      const startHour = parseInt(event.startTime.split(':')[0]);
      const startMinute = parseInt(event.startTime.split(':')[1]);
      
      // Only include events that start exactly at this hour (regardless of minutes)
      return startHour === timeSlotHour;
    });
    
    if (events.length > 0) {
      console.log(`Schedule - Day: ${day}, TimeSlot: ${timeSlot}, Events starting at this hour: ${events.length}`);
      console.log('Schedule - Event subjects:', events.map(e => `${e.subject} (${e.startTime}-${e.endTime})`).join(', '));
    }
    
    return events;
  };

  // Calculate how many time slots an event spans and its exact positioning
  const calculateEventDimensions = (event) => {
    const [startHour, startMin] = event.startTime.split(':').map(Number);
    const [endHour, endMin] = event.endTime.split(':').map(Number);
    
    // Calculate total duration in minutes
    const startTotalMinutes = startHour * 60 + startMin;
    const endTotalMinutes = endHour * 60 + endMin;
    const durationMinutes = endTotalMinutes - startTotalMinutes;
    
    // Calculate fractional positioning within the hour slot
    const minuteOffset = startMin; // How many minutes past the hour does this event start
    const fractionalOffset = (minuteOffset / 60) * 60; // Convert to pixels (assuming 60px per hour)
    
    // Calculate height based on actual duration (60px = 1 hour)
    const height = (durationMinutes / 60) * 60;
    
    console.log(`Schedule - Event ${event.subject}: Start ${event.startTime}, End ${event.endTime}`);
    console.log(`Schedule - Calculated: offset=${fractionalOffset}px, height=${height}px, duration=${durationMinutes}min`);
    
    return {
      height,
      topOffset: fractionalOffset,
      durationMinutes
    };
  };

  // Utility function to determine if a color is light or dark
  const isLightBackground = (color) => {
    // For hex colors
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 128;
    }
    // For named colors or rgb/rgba format, default to assuming it's dark
    return false;
  };

  // Utility function to get appropriate text color based on background
  const getTextColor = (backgroundColor) => {
    return isLightBackground(backgroundColor) ? '#000000' : '#ffffff';
  };

  // Mobile-specific event rendering function to prevent floating classes
  const renderMobileEvent = (event, index) => {
    const backgroundColor = getSubjectColor(event.subject);
    const textColor = getTextColor(backgroundColor);
    const isLightColor = isLightBackground(backgroundColor);
    
    // Get teacher and student counts
    const teacherCount = event.teacherNames ? event.teacherNames.length : 0;
    const studentCount = event.studentNames ? event.studentNames.length : 0;
    const teacherDisplay = event.teacherNames && event.teacherNames.length > 0 
      ? event.teacherNames.slice(0, 2).join(', ') + (event.teacherNames.length > 2 ? '...' : '')
      : null;

    return (
      <Card
        key={`mobile-${event._id}-${index}`}
        sx={{
          mb: 1.5,
          bgcolor: backgroundColor,
          color: textColor,
          cursor: 'pointer',
          '&:hover': { 
            boxShadow: 3,
            transform: 'translateY(-2px)',
            transition: 'all 0.2s ease-in-out'
          },
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 2
        }}
        onClick={() => handleEventClick(event)}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography 
              variant="subtitle1" 
              fontWeight="bold"
              sx={{ 
                color: textColor,
                textShadow: isLightColor ? 'none' : '0 1px 2px rgba(0,0,0,0.3)'
              }}
            >
              {event.subject}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: textColor,
                opacity: 0.9,
                textShadow: isLightColor ? 'none' : '0 1px 2px rgba(0,0,0,0.3)',
                fontWeight: 'bold'
              }}
            >
              {event.startTime} - {event.endTime}
            </Typography>
          </Box>
          
          {teacherDisplay && (
            <Typography 
              variant="body2" 
              sx={{ 
                color: textColor,
                opacity: 0.9,
                mb: 1,
                textShadow: isLightColor ? 'none' : '0 1px 2px rgba(0,0,0,0.3)'
              }}
            >
              👨‍🏫 {teacherDisplay}
            </Typography>
          )}
          
          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            {teacherCount > 0 && (
              <Chip
                size="small"
                icon={<PersonIcon sx={{ fontSize: '14px !important' }} />}
                label={`${teacherCount} Teacher${teacherCount > 1 ? 's' : ''}`}
                sx={{
                  height: '20px',
                  '& .MuiChip-label': { fontSize: '0.75rem', px: 0.5 },
                  '& .MuiChip-icon': { fontSize: '12px', ml: 0.5 },
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: textColor
                }}
              />
            )}
            {studentCount > 0 && (
              <Chip
                size="small"
                icon={<GroupIcon sx={{ fontSize: '14px !important' }} />}
                label={`${studentCount} Student${studentCount > 1 ? 's' : ''}`}
                sx={{
                  height: '20px',
                  '& .MuiChip-label': { fontSize: '0.75rem', px: 0.5 },
                  '& .MuiChip-icon': { fontSize: '12px', ml: 0.5 },
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: textColor
                }}
              />
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Render event in calendar with proper fractional positioning
  const renderEvent = (event, isCompact = false) => {
    if (!event) {
      console.log('Schedule - Attempt to render null event');
      return null;
    }
    
    // Calculate precise dimensions and positioning
    const { height, topOffset } = calculateEventDimensions(event);
    const teacherCount = event.teacherNames?.length || 0;
    const studentCount = event.studentNames?.length || 0;
    
    console.log(`Schedule - Rendering event: ${event.subject} at ${event.startTime}-${event.endTime}, ID: ${event._id}`);
    console.log(`Schedule - Position: top=${topOffset}px, height=${height}px`);
    
    // Get branch name if available from our mapping
    const branchName = event.schoolBranch ? 
      (branchNames[event.schoolBranch] || event.schoolBranch) : 
      'Unknown Branch';
      
    // Handle teacher display
    const teacherDisplay = event.teacherNames?.length > 0 ? 
      ` • ${event.teacherNames[0]}${event.teacherNames.length > 1 ? ` +${event.teacherNames.length - 1}` : ''}` : 
      '';
    
    // Determine color based on subject
    const backgroundColor = getSubjectColor(event.subject);
    
    // Check if it's a light color for contrast
    const isLightColor = ['#f9a825', '#ffc107', '#ffeb3b'].includes(backgroundColor);
    
    // Calculate contrast color for text based on background color
    const getContrastText = (hexColor) => {
      // Convert hex to RGB
      const r = parseInt(hexColor.slice(1, 3), 16);
      const g = parseInt(hexColor.slice(3, 5), 16);
      const b = parseInt(hexColor.slice(5, 7), 16);
      
      // Calculate luminance - lighter colors need dark text
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.5 ? '#000000' : '#ffffff';
    };
    
    const textColor = getContrastText(backgroundColor);
    
    return (
      <Card
        key={event._id}
        sx={{
          position: 'absolute',
          top: `${topOffset}px`,
          left: '2px',
          right: '2px',
          cursor: 'pointer',
          bgcolor: backgroundColor,
          color: textColor,
          p: isCompact ? 0.5 : 1,
          height: `${height - 4}px`,
          minHeight: `${height - 4}px`,
          zIndex: 3,
          '&:hover': { 
            boxShadow: 3,
            transform: 'scale(1.02)',
            transition: 'all 0.2s ease-in-out',
            zIndex: 4
          },
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
        onClick={() => handleEventClick(event)}
      >
        <CardContent sx={{ 
          p: isCompact ? '4px !important' : '8px !important',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <Typography 
            variant={isCompact ? 'caption' : 'subtitle2'} 
            noWrap 
            fontWeight="bold"
            sx={{ 
              color: textColor,
              textShadow: isLightColor ? 'none' : '0 1px 2px rgba(0,0,0,0.3)'
            }}
          >
            {event.subject}
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '0.7rem',
                opacity: 0.9,
                color: textColor,
                display: 'block',
                lineHeight: 1.2
              }}
            >
              {event.startTime} - {event.endTime}
            </Typography>
          </Typography>
          {!isCompact && teacherDisplay && (
            <Typography 
              variant="caption" 
              noWrap
              sx={{ 
                color: textColor,
                opacity: 0.9,
                textShadow: isLightColor ? 'none' : '0 1px 2px rgba(0,0,0,0.3)'
              }}
            >
              {teacherDisplay}
            </Typography>
          )}
          {!isCompact && (teacherCount > 0 || studentCount > 0) && (
            <Box sx={{ 
              display: 'flex', 
              gap: 0.5, 
              mt: 0.5,
              flexWrap: 'wrap'
            }}>
              {teacherCount > 0 && (
                <Chip
                  size="small"
                  icon={<PersonIcon sx={{ fontSize: '12px !important' }} />}
                  label={teacherCount}
                  sx={{
                    height: '16px',
                    '& .MuiChip-label': { fontSize: '0.65rem', px: 0.5 },
                    '& .MuiChip-icon': { fontSize: '10px', ml: 0.5 },
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: textColor
                  }}
                />
              )}
              {studentCount > 0 && (
                <Chip
                  size="small"
                  icon={<GroupIcon sx={{ fontSize: '12px !important' }} />}
                  label={studentCount}
                  sx={{
                    height: '16px',
                    '& .MuiChip-label': { fontSize: '0.65rem', px: 0.5 },
                    '& .MuiChip-icon': { fontSize: '10px', ml: 0.5 },
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: textColor
                  }}
                />
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    );
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
      <Paper sx={{ p: 2, borderRadius: 2, overflowX: 'auto' }}>
        {isMobile ? (
          // Mobile view - Improved day by day list
          <Box>
            {daysOfWeek.map((day) => (
              <Accordion key={day} sx={{ mb: 1 }} defaultExpanded>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&.Mui-expanded': {
                      minHeight: 48,
                    },
                    '& .MuiAccordionSummary-content': {
                      '&.Mui-expanded': {
                        margin: '12px 0',
                      },
                    },
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {day}
                  </Typography>
                  {scheduleData && scheduleData[day] && scheduleData[day].length > 0 && (
                    <Chip
                      size="small"
                      label={`${scheduleData[day].length} class${scheduleData[day].length > 1 ? 'es' : ''}`}
                      sx={{ 
                        ml: 2, 
                        bgcolor: 'rgba(255,255,255,0.2)', 
                        color: 'primary.contrastText',
                        fontSize: '0.7rem'
                      }}
                    />
                  )}
                </AccordionSummary>
                <AccordionDetails sx={{ p: 2, bgcolor: 'background.paper' }}>
                  {scheduleData && scheduleData[day] && scheduleData[day].length > 0 ? (
                    <Box>
                      {mergeConsecutiveClasses(scheduleData[day])
                        .sort((a, b) => {
                          // Sort by start time
                          const timeA = parseInt(a.startTime.replace(':', ''));
                          const timeB = parseInt(b.startTime.replace(':', ''));
                          return timeA - timeB;
                        })
                        .map((event, index) => renderMobileEvent(event, index))
                      }
                    </Box>
                  ) : (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                      py: 3,
                      color: 'text.secondary'
                    }}>
                      <CalendarIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                      <Typography variant="body1" color="text.secondary">
                        No classes scheduled
                      </Typography>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        ) : (
          // Desktop view - Calendar grid
          <Box sx={{ 
            overflow: 'auto', 
            minWidth: '100%',
            maxWidth: '100%',
            width: '100%'
          }}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: '80px repeat(7, minmax(120px, 1fr))', 
              gap: 0,
              minWidth: 'fit-content',
              width: '100%'
            }}>
              {/* Time column header */}
              <Box sx={{ 
                position: 'sticky', 
                left: 0, 
                backgroundColor: 'background.paper', 
                zIndex: 2,
                borderBottom: '2px solid',
                borderColor: 'primary.main',
                borderRight: '1px solid',
                borderRightColor: 'divider'
              }}>
                <Typography variant="subtitle1" sx={{ 
                  p: 1, 
                  height: '50px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: 'bold'
                }}>
                  Time
                </Typography>
              </Box>

              {/* Day headers */}
              {daysOfWeek.map((day) => (
                <Box key={`header-${day}`} sx={{
                  borderBottom: '2px solid',
                  borderColor: 'primary.main',
                  borderRight: '1px solid',
                  borderRightColor: 'divider',
                  backgroundColor: theme.palette.mode === 'dark' ? 'background.default' : 'primary.main',
                }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      p: 1, 
                      textAlign: 'center', 
                      height: '50px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      color: theme.palette.mode === 'dark' ? 'primary.contrastText' : 'primary.contrastText'
                    }}
                  >
                    {day}
                  </Typography>
                </Box>
              ))}

              {/* Time slots and events */}
              {timeSlots.map((timeSlot) => (
                <React.Fragment key={timeSlot}>
                  {/* Time label */}
                  <Box sx={{
                    borderRight: '1px solid',
                    borderRightColor: 'divider',
                    borderBottom: '1px solid',
                    borderBottomColor: 'divider',
                    backgroundColor: theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50',
                    color: theme.palette.text.primary,
                    position: 'sticky',
                    left: 0,
                    zIndex: 1
                  }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        p: 1, 
                        textAlign: 'center',
                        display: 'block',
                        fontWeight: 500,
                        minHeight: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {formatTime(timeSlot)}
                    </Typography>
                  </Box>

                  {/* Day columns */}
                  {daysOfWeek.map((day) => {
                    const events = getEventsForTimeSlot(day, timeSlot);
                    const mergedEvents = mergeConsecutiveClasses(events);
                    
                    return (
                      <Box
                        key={`${day}-${timeSlot}`}
                        sx={{
                          borderRight: '1px solid',
                          borderRightColor: 'divider',
                          borderBottom: '1px solid',
                          borderBottomColor: 'divider',
                          minHeight: '60px',
                          backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.background.paper,
                          position: 'relative',
                          overflow: 'visible' // Changed from 'hidden' to allow absolute positioned events
                        }}
                      >
                        {mergedEvents.map((event) => {
                          const eventKey = `${event._id}-${timeSlot}`;
                          if (renderedEventsRef.current.has(eventKey)) return null;
                          renderedEventsRef.current.add(eventKey);
                          return renderEvent(event, true);
                        })}
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
                    School Branch: {selectedEvent.schoolBranch ? (
                      branchNames[selectedEvent.schoolBranch] || selectedEvent.schoolBranchName || selectedEvent.schoolBranch
                    ) : 'Unknown Branch'}
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
