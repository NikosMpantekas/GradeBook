import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  useTheme,
  useMediaQuery,
  FormControl,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import {
  Info as InfoIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  School as SchoolIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';

const TestDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useSelector((state) => state.auth);
  const { darkMode } = useSelector((state) => state.ui);

  // Mock data for demonstration
  const [notifications] = useState([
    {
      id: 1,
      title: "New grade posted for Mathematics",
      content: "Your grade for the recent Mathematics assignment has been posted.",
      author: "You",
      date: "February 12, 12:00",
      isImportant: true
    },
    {
      id: 2,
      title: "Class schedule updated",
      content: "The schedule for Physics class has been updated for next week.",
      author: "Mrs. Johnson",
      date: "February 12, 12:00",
      isImportant: false
    }
  ]);

  const [upcomingClasses] = useState([
    {
      id: 1,
      subject: "Mathematics",
      teacher: "Mr. Smith",
      time: "09:00 - 10:30",
      room: "Room 201",
      status: "For checking",
      group: "Class A • 1st period"
    },
    {
      id: 2,
      subject: "Physics",
      teacher: "Mrs. Johnson",
      time: "11:00 - 12:30",
      room: "Lab 105",
      status: "Accepted",
      group: "Class B • 2nd period"
    },
    {
      id: 3,
      subject: "English Literature",
      teacher: "Ms. Davis",
      time: "14:00 - 15:30",
      room: "Room 305",
      status: "Under revision",
      group: "Class A • 3rd period"
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'For checking':
        return 'warning';
      case 'Accepted':
        return 'success';
      case 'Under revision':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusDot = (status) => {
    const color = getStatusColor(status);
    return (
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: `${color}.main`,
          mr: 1
        }}
      />
    );
  };

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Grid container spacing={3} sx={{ height: '100%' }}>
        {/* Left Sidebar - Student Profile */}
        <Grid item xs={12} md={3}>
          <Card 
            sx={{ 
              height: '100%',
              bgcolor: darkMode ? 'background.paper' : 'background.default',
              border: darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.12)'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              {/* Back Button */}
              <Button
                variant="text"
                startIcon={<Box component="span" sx={{ transform: 'rotate(180deg)' }}>→</Box>}
                sx={{ mb: 3, color: 'text.secondary' }}
              >
                Back
              </Button>

              {/* Student Profile */}
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mx: 'auto',
                    mb: 2,
                    bgcolor: 'primary.main'
                  }}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || 'S'}
                </Avatar>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                  {user?.name || 'Student Name'}
                </Typography>
                <Chip
                  label="Active"
                  color="success"
                  size="small"
                  sx={{ mb: 2 }}
                />
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Group: Class A
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Experience: Current Year
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Timezone: Local Time
                  </Typography>
                </Box>
              </Box>

              {/* Communication Tools */}
              <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 3 }}>
                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                  <Box component="span" sx={{ fontSize: '0.875rem' }}>📱</Box>
                </IconButton>
                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                  <Box component="span" sx={{ fontSize: '0.875rem' }}>📧</Box>
                </IconButton>
                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                  <Box component="span" sx={{ fontSize: '0.875rem' }}>📚</Box>
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Main Content Area */}
        <Grid item xs={12} md={9}>
          <Grid container spacing={3} sx={{ height: '100%' }}>
            {/* Flow Analytics Panel */}
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  height: '100%',
                  bgcolor: darkMode ? 'background.paper' : 'background.default',
                  border: darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.12)'
                }}
              >
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', flex: 1 }}>
                      Flow Analytics
                    </Typography>
                    <IconButton size="small" sx={{ color: 'text.secondary' }}>
                      <InfoIcon />
                    </IconButton>
                  </Box>

                  {/* Performance Metrics */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      85% Overall Performance Average
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      82% Overall performance this week
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      +8% Forecast of overall performance in the next module
                    </Typography>
                  </Box>

                  {/* Chart Placeholder */}
                  <Box
                    sx={{
                      flex: 1,
                      bgcolor: 'primary.main',
                      borderRadius: 2,
                      position: 'relative',
                      overflow: 'hidden',
                      minHeight: 200
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                        opacity: 0.8
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: 'white',
                        textAlign: 'center'
                      }}
                    >
                      <TrendingUpIcon sx={{ fontSize: 48, mb: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Performance Chart
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Visual representation of your progress
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Notifications Panel */}
            <Grid item xs={12} md={6}>
              <Card 
                sx={{ 
                  height: '100%',
                  bgcolor: darkMode ? 'background.paper' : 'background.default',
                  border: darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.12)'
                }}
              >
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', flex: 1 }}>
                      Notifications
                    </Typography>
                  </Box>

                  <List sx={{ flex: 1, overflow: 'auto' }}>
                    {notifications.map((notification, index) => (
                      <React.Fragment key={notification.id}>
                        <ListItem sx={{ px: 0, py: 1 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                              <PersonIcon fontSize="small" />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  {notification.title}
                                </Typography>
                                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  {notification.content}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {notification.author} • {notification.date}
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < notifications.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>

                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Add new +
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Upcoming Classes Panel */}
            <Grid item xs={12}>
              <Card 
                sx={{ 
                  bgcolor: darkMode ? 'background.paper' : 'background.default',
                  border: darkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.12)'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mr: 2 }}>
                        Upcoming Classes
                      </Typography>
                      <IconButton size="small" sx={{ color: 'text.secondary' }}>
                        <InfoIcon />
                      </IconButton>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>All modules</InputLabel>
                        <Select value="" label="All modules">
                          <MenuItem value="">All modules</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>All tasks</InputLabel>
                        <Select value="" label="All tasks">
                          <MenuItem value="">All tasks</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>

                  <List>
                    {upcomingClasses.map((classItem, index) => (
                      <React.Fragment key={classItem.id}>
                        <ListItem sx={{ px: 0, py: 1 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'info.main' }}>
                              <ScheduleIcon fontSize="small" />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  {getStatusDot(classItem.status)}
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {classItem.subject}
                                  </Typography>
                                </Box>
                                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  {classItem.teacher} • {classItem.time} • {classItem.room}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {classItem.group} • {classItem.date || 'Today'}
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < upcomingClasses.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TestDashboard; 