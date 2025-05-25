import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Divider,
  IconButton,
  Box,
  Chip,
  Tooltip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Event as EventIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  EventAvailable as EventAvailableIcon,
  Group as GroupIcon,
  Tag as TagIcon
} from '@mui/icons-material';
import { format, isToday, isSameDay } from 'date-fns';
import { useSelector } from 'react-redux';

const DayDetailsDialog = ({ open, onClose, selectedDate, events = [], onEdit, onDelete, onCreateEvent }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useSelector((state) => state.auth);
  
  // Filter events for the selected date
  const dayEvents = events.filter(event => {
    const eventStartDate = new Date(event.startDate);
    const eventEndDate = new Date(event.endDate);
    
    // Check if selectedDate falls within the event's date range
    return (
      isSameDay(selectedDate, eventStartDate) || 
      isSameDay(selectedDate, eventEndDate) ||
      (selectedDate >= eventStartDate && selectedDate <= eventEndDate)
    );
  });

  // Check if user can edit the event based on their role and the event creator
  const canEditEvent = (event) => {
    if (!user) return false;
    
    // Superadmins can edit any event
    if (user.role === 'superadmin') return true;
    
    // Admins and secretaries can edit events created by them or teachers
    if ((user.role === 'admin' || user.role === 'secretary') && 
        (event.creator._id === user._id || event.creator.role === 'teacher')) {
      return true;
    }
    
    // Teachers can only edit their own events
    if (user.role === 'teacher' && event.creator._id === user._id) {
      return true;
    }
    
    return false;
  };

  // Get color for event based on audience type
  const getEventColor = (event) => {
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

  // Format date for display
  const formatDate = (date) => {
    return format(new Date(date), "EEEE, MMMM do, yyyy");
  };

  // Format audience for display
  const formatAudience = (audience) => {
    if (!audience) return 'Everyone';
    
    switch (audience.targetType) {
      case 'all':
        return 'Everyone';
      case 'school':
        return audience.schoolName || 'Specific School';
      case 'direction':
        return audience.directionName || 'Specific Direction';
      case 'teacher':
        return 'Teachers';
      case 'student':
        return 'Students';
      default:
        return 'Custom Audience';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <EventIcon sx={{ mr: 1 }} />
          <Typography variant="h6">
            {format(selectedDate, "MMMM d, yyyy")}
            {isToday(selectedDate) && (
              <Chip 
                label="Today" 
                color="primary" 
                size="small" 
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {dayEvents.length > 0 ? (
          <List>
            {dayEvents.map((event, index) => (
              <React.Fragment key={event._id}>
                {index > 0 && <Divider variant="inset" component="li" />}
                <ListItem
                  disablePadding
                  sx={{
                    borderLeft: `4px solid ${getEventColor(event)}`,
                    pl: 1,
                    mb: 1
                  }}
                >
                  <ListItemButton>
                    <ListItemIcon>
                      <EventAvailableIcon style={{ color: getEventColor(event) }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" fontWeight="bold">
                          {event.title}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {event.description.length > 100 
                              ? `${event.description.substring(0, 100)}...` 
                              : event.description}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                            {event.startDate !== event.endDate && (
                              <Chip 
                                size="small"
                                icon={<EventIcon fontSize="small" />}
                                label={`${formatDate(event.startDate)} - ${formatDate(event.endDate)}`}
                                variant="outlined"
                              />
                            )}
                            
                            <Tooltip title={`For: ${formatAudience(event.audience)}`}>
                              <Chip 
                                size="small"
                                icon={<GroupIcon fontSize="small" />}
                                label={formatAudience(event.audience)}
                                variant="outlined"
                              />
                            </Tooltip>
                            
                            {event.tags && event.tags.length > 0 && (
                              <Tooltip title="Tags">
                                <Chip 
                                  size="small"
                                  icon={<TagIcon fontSize="small" />}
                                  label={event.tags.join(', ')}
                                  variant="outlined"
                                />
                              </Tooltip>
                            )}
                          </Box>
                        </Box>
                      }
                    />
                    
                    {canEditEvent(event) && (
                      <Box>
                        <Tooltip title="Edit Event">
                          <IconButton onClick={(e) => {
                            e.stopPropagation();
                            onEdit(event);
                          }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Event">
                          <IconButton onClick={(e) => {
                            e.stopPropagation();
                            onDelete(event._id);
                          }} color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </ListItemButton>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <EventIcon color="disabled" sx={{ fontSize: 40, mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Events
            </Typography>
            <Typography variant="body2" color="text.secondary">
              There are no events scheduled for this day.
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button onClick={onClose}>
          Close
        </Button>
        
        {user && user.role !== 'student' && (
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<EventIcon />}
            onClick={() => {
              onCreateEvent(selectedDate);
              onClose();
            }}
          >
            Create Event
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default DayDetailsDialog;
