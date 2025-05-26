import React from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  Paper, 
  useTheme, 
  Badge,
  useMediaQuery,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  parseISO
} from 'date-fns';

const CalendarGrid = ({ 
  currentMonth, 
  events = [],
  getEventsForDay,
  onDayClick, 
  isMobile 
}) => {
  const theme = useTheme();
  
  // Generate the days of the week header
  const renderDaysOfWeek = () => {
    const dateFormat = isMobile ? 'EEEEE' : 'EEEE'; // Use shorter day names on mobile
    const days = [];
    const startDate = startOfWeek(currentMonth, { weekStartsOn: 1 }); // Week starts on Monday

    for (let i = 0; i < 7; i++) {
      const day = addDays(startDate, i);
      days.push(
        <Grid item xs key={i}>
          <Typography 
            align="center"
            sx={{ 
              fontWeight: 'bold',
              display: 'block',
              p: 1,
              bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
              borderRadius: 1
            }}
          >
            {format(day, dateFormat)}
          </Typography>
        </Grid>
      );
    }

    return <Grid container spacing={1}>{days}</Grid>;
  };

  // Generate the days of the month
  const renderDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Week starts on Monday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, 'd');
        const cloneDay = day;
        const eventsForDay = getEventsForDay(day);
        
        days.push(
          <Grid item xs key={day.toString()}>
            <Paper
              elevation={isSameDay(day, new Date()) ? 3 : 1}
              sx={{
                p: 1,
                height: isMobile ? 70 : 100,
                opacity: !isSameMonth(day, monthStart) ? 0.5 : 1,
                border: isSameDay(day, new Date()) 
                  ? `2px solid ${theme.palette.primary.main}` 
                  : 'none',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'grey.800' 
                    : 'grey.100',
                  transform: 'translateY(-2px)',
                }
              }}
              onClick={() => onDayClick(cloneDay)}
            >
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%' 
              }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: isSameDay(day, new Date()) ? 'bold' : 'normal',
                    mb: 0.5
                  }}
                >
                  {formattedDate}
                </Typography>
                
                {/* Event dots/badges */}
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 0.5,
                  overflow: 'hidden',
                  justifyContent: 'center'
                }}>
                  {eventsForDay.slice(0, isMobile ? 3 : 5).map((event) => {
                    // Get the event color, prioritizing custom color if available
                    const getEventColor = () => {
                      // If event has a custom color, use it
                      if (event.color) return event.color;
                      
                      // Otherwise use audience-based color
                      if (!event.audience || !event.audience.targetType) return theme.palette.primary.main;
                      
                      switch (event.audience.targetType) {
                        case 'all':
                          return theme.palette.info.main;
                        case 'school':
                          return theme.palette.success.main;
                        case 'direction':
                          return theme.palette.warning.main;
                        case 'teacher':
                          return theme.palette.secondary.main;
                        case 'student':
                          return theme.palette.error.main;
                        default:
                          return theme.palette.primary.main;
                      }
                    };
                    
                    // Get contrast color for border
                    const getContrastBorderColor = () => {
                      const color = getEventColor();
                      // Simple approach to determine if color is light or dark
                      const isLight = color.match(/^#[0-9A-F]{6}$/i) ? 
                        parseInt(color.substring(1), 16) > 0xffffff/2 : true;
                      return isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)';
                    };
                    
                    return (
                      <Tooltip 
                        key={event._id} 
                        title={event.title}
                        arrow
                      >
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            bgcolor: getEventColor(),
                            cursor: 'pointer',
                            border: `1.5px solid ${getContrastBorderColor()}`,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            '&:hover': {
                              transform: 'scale(1.2)',
                              transition: 'transform 0.2s ease-in-out'
                            }
                          }}
                        />
                      </Tooltip>
                    );
                  })}
                  
                  {/* Show count indicator if more events */}
                  {eventsForDay.length > (isMobile ? 3 : 5) && (
                    <Tooltip title={`${eventsForDay.length - (isMobile ? 3 : 5)} more events`}>
                      <Avatar 
                        sx={{ 
                          width: 16, 
                          height: 16, 
                          fontSize: '0.6rem',
                          bgcolor: theme.palette.secondary.main,
                          ml: 0.5
                        }}
                      >
                        +{eventsForDay.length - (isMobile ? 3 : 5)}
                      </Avatar>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            </Paper>
          </Grid>
        );
        day = addDays(day, 1);
      }
      
      rows.push(
        <Grid container spacing={1} key={day.toString()}>
          {days}
        </Grid>
      );
      
      days = [];
    }

    return <Box sx={{ mt: 1 }}>{rows}</Box>;
  };

  return (
    <Box>
      {renderDaysOfWeek()}
      {renderDays()}
    </Box>
  );
};

export default CalendarGrid;
