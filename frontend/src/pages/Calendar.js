import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  CircularProgress, 
  Grid, 
  Alert,
  useMediaQuery,
  useTheme,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Event as EventIcon,
  Add as AddIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { format, addMonths, subMonths, parseISO, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import { getEvents, deleteEvent, reset } from '../features/events/eventSlice';
import { toast } from 'react-toastify';
import logger from '../services/loggerService';
import CalendarGrid from '../components/calendar/CalendarGrid';
import CalendarEventDialog from '../components/calendar/CalendarEventDialog';
import CalendarFilterDialog from '../components/calendar/CalendarFilterDialog';
import DayDetailsDialog from '../components/calendar/DayDetailsDialog';
import ErrorBoundary from '../components/common/ErrorBoundary';

const Calendar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { events, isLoading, isError, message } = useSelector((state) => state.events);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [isDayDetailsDialogOpen, setIsDayDetailsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filter, setFilter] = useState({
    tags: [],
    audience: null
  });

  // Can the user create events?
  const canCreateEvents = user && (
    user.role === 'superadmin' || 
    user.role === 'admin' || 
    user.role === 'teacher' || 
    (user.role === 'secretary' && user.secretaryPermissions?.canSendNotifications)
  );

  // Log component rendering
  logger.info('CALENDAR', 'Calendar component rendering', {
    user: user ? { id: user._id, role: user.role } : 'No user',
    eventsCount: events ? events.length : 0,
    currentMonth: format(currentMonth, 'MMMM yyyy')
  });

  // Fetch events when month changes and reset state when component unmounts
  useEffect(() => {
    if (user) {
      const startDate = startOfMonth(currentMonth).toISOString();
      const endDate = endOfMonth(currentMonth).toISOString();
      
      dispatch(getEvents({ startDate, endDate }));
    }
    
    // Clear any success/error states on component mount
    dispatch(reset());
    
    return () => {
      // Clean up when component unmounts
      dispatch(reset());
    };
  }, [user, dispatch, currentMonth]);

  // Handle errors
  useEffect(() => {
    if (isError) {
      toast.error(message);
      logger.error('CALENDAR', 'Error fetching events', {
        message,
        userId: user?._id,
        userRole: user?.role
      });
    }
  }, [isError, message, user]);

  // Navigate to previous month
  const handlePrevMonth = () => {
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  };

  // Navigate to next month
  const handleNextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };

  // Go to current month
  const handleCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  // Open day details dialog when clicking on a day
  const handleDayClick = (date) => {
    setSelectedDate(date);
    setIsDayDetailsDialogOpen(true);
  };
  
  // Close day details dialog
  const handleCloseDayDetailsDialog = () => {
    setIsDayDetailsDialogOpen(false);
  };
  
  // Create new event from day details dialog
  const handleCreateEventFromDayDetails = (date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setIsEventDialogOpen(true);
  };

  // Open event dialog with selected event for editing
  const handleEventEdit = (event) => {
    setSelectedEvent(event);
    setSelectedDate(parseISO(event.startDate));
    setIsEventDialogOpen(true);
    setIsDayDetailsDialogOpen(false);
  };
  
  // Handle event deletion
  const handleEventDelete = (eventId) => {
    // Implement deletion logic with confirmation
    if (window.confirm('Are you sure you want to delete this event?')) {
      dispatch(deleteEvent(eventId));
      toast.success('Event deleted successfully');
      setIsDayDetailsDialogOpen(false);
    }
  };

  // Close event dialog
  const handleCloseEventDialog = () => {
    setIsEventDialogOpen(false);
    setSelectedEvent(null);
    setSelectedDate(null);
  };

  // Filter events for a specific day
  const getEventsForDay = useCallback((day) => {
    if (!events) return [];
    
    return events.filter(event => {
      const eventDate = parseISO(event.startDate);
      return isSameDay(day, eventDate);
    }).filter(event => {
      // Apply tag filter if set
      if (filter.tags && filter.tags.length > 0) {
        const eventHasMatchingTag = event.tags && event.tags.some(tag => 
          filter.tags.includes(tag)
        );
        if (!eventHasMatchingTag) return false;
      }
      
      // Apply audience filter if set
      if (filter.audience) {
        if (event.audience.targetType !== filter.audience) return false;
      }
      
      return true;
    });
  }, [events, filter]);

  // Open filter dialog
  const handleOpenFilterDialog = () => {
    setIsFilterDialogOpen(true);
  };

  // Close filter dialog
  const handleCloseFilterDialog = () => {
    setIsFilterDialogOpen(false);
  };

  // Apply filters
  const handleApplyFilter = (newFilter) => {
    setFilter(newFilter);
    setIsFilterDialogOpen(false);
  };

  // Clear filters
  const handleClearFilter = () => {
    setFilter({
      tags: [],
      audience: null
    });
    setIsFilterDialogOpen(false);
  };

  // Show loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading calendar...
        </Typography>
      </Box>
    );
  }

  return (
    <ErrorBoundary componentName="Calendar">
      <Box sx={{ p: 2 }}>
        {/* Header section */}
        <Paper elevation={3} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Grid container alignItems="center" spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="h5" component="h1" gutterBottom>
                <EventIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Calendar
              </Typography>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              {canCreateEvents && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setSelectedDate(new Date());
                    setSelectedEvent(null);
                    setIsEventDialogOpen(true);
                  }}
                  sx={{ mr: 1 }}
                >
                  {isMobile ? 'Add' : 'Add Event'}
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={handleOpenFilterDialog}
                sx={{ mr: 1 }}
              >
                {isMobile ? '' : 'Filter'}
                {isMobile && <FilterListIcon />}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Calendar navigation */}
        <Paper elevation={3} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item>
              <IconButton onClick={handlePrevMonth} color="primary">
                <ChevronLeftIcon />
              </IconButton>
            </Grid>
            <Grid item>
              <Typography variant="h6" component="span">
                {format(currentMonth, 'MMMM yyyy')}
              </Typography>
            </Grid>
            <Grid item>
              <IconButton onClick={handleNextMonth} color="primary">
                <ChevronRightIcon />
              </IconButton>
            </Grid>
            <Grid item sx={{ ml: 2 }}>
              <Tooltip title="Go to current month">
                <Button size="small" onClick={handleCurrentMonth} variant="outlined">
                  Today
                </Button>
              </Tooltip>
            </Grid>
          </Grid>
        </Paper>

        {/* Active filter indicators */}
        {(filter.tags.length > 0 || filter.audience) && (
          <Paper elevation={3} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Active Filters:
            </Typography>
            <Grid container spacing={1}>
              {filter.tags.map(tag => (
                <Grid item key={tag}>
                  <Chip label={tag} onDelete={() => {
                    setFilter({
                      ...filter,
                      tags: filter.tags.filter(t => t !== tag)
                    });
                  }} />
                </Grid>
              ))}
              {filter.audience && (
                <Grid item>
                  <Chip label={`Audience: ${filter.audience}`} onDelete={() => {
                    setFilter({
                      ...filter,
                      audience: null
                    });
                  }} />
                </Grid>
              )}
              <Grid item>
                <Button size="small" onClick={handleClearFilter} color="primary">
                  Clear All
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Calendar grid */}
        <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
          <CalendarGrid 
            currentMonth={currentMonth}
            events={events}
            getEventsForDay={getEventsForDay}
            onDayClick={handleDayClick}
            isMobile={isMobile}
          />
        </Paper>

        {/* Event dialog */}
        <CalendarEventDialog
          open={isEventDialogOpen}
          onClose={handleCloseEventDialog}
          event={selectedEvent}
          date={selectedDate}
          canEdit={canCreateEvents}
        />

        {/* Filter dialog */}
        <CalendarFilterDialog 
          open={isFilterDialogOpen}
          onClose={handleCloseFilterDialog}
          filter={filter}
          onApply={handleApplyFilter}
          onClear={handleClearFilter}
          events={events}
        />
        
        {/* Day details dialog */}
        <DayDetailsDialog
          open={isDayDetailsDialogOpen}
          onClose={handleCloseDayDetailsDialog}
          selectedDate={selectedDate || new Date()}
          events={events || []}
          onEdit={handleEventEdit}
          onDelete={handleEventDelete}
          onCreateEvent={handleCreateEventFromDayDetails}
        />
      </Box>
    </ErrorBoundary>
  );
};

const CalendarWithErrorBoundary = () => (
  <ErrorBoundary componentName="Calendar">
    <Calendar />
  </ErrorBoundary>
);

export default CalendarWithErrorBoundary;
