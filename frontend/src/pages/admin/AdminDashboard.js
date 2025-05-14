import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Typography, 
  Grid, 
  Paper, 
  Box, 
  Card, 
  CardContent,
  CardHeader,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Divider,
  Avatar
} from '@mui/material';
import {
  School as SchoolIcon,
  Group as GroupIcon,
  MenuBook as MenuBookIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  ArrowForward as ArrowForwardIcon,
  PeopleAlt as PeopleAltIcon,
  SupervisorAccount as SupervisorAccountIcon,
  Face as FaceIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(false);
  
  // Sample data - in a real application, this would come from your Redux store
  const [stats, setStats] = useState({
    totalStudents: 120,
    totalTeachers: 15,
    totalSchools: 3,
    totalSubjects: 24,
    totalDirections: 6,
    totalNotifications: 78,
    recentUsers: [
      { id: 1, name: 'John Doe', role: 'student', avatar: null, date: '2025-05-12' },
      { id: 2, name: 'Mary Smith', role: 'teacher', avatar: null, date: '2025-05-11' },
      { id: 3, name: 'Alex Johnson', role: 'student', avatar: null, date: '2025-05-10' },
      { id: 4, name: 'Sarah Wilson', role: 'teacher', avatar: null, date: '2025-05-09' }
    ]
  });
  
  // Pie chart data for user roles
  const userRolesData = {
    labels: ['Students', 'Teachers', 'Admins'],
    datasets: [
      {
        data: [stats.totalStudents, stats.totalTeachers, 1], // Assuming 1 admin (the current user)
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Bar chart data for entity counts
  const entitiesData = {
    labels: ['Schools', 'Directions', 'Subjects', 'Notifications'],
    datasets: [
      {
        label: 'Count',
        data: [stats.totalSchools, stats.totalDirections, stats.totalSubjects, stats.totalNotifications],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  // Bar chart options
  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Entity Distribution',
      },
    },
  };
  
  useEffect(() => {
    // In a real app, you would fetch dashboard data here
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Simulating data fetch
  }, [dispatch]);
  
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Admin Dashboard
      </Typography>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                <FaceIcon fontSize="large" />
              </Avatar>
              <Typography variant="h5" component="div" fontWeight="bold">
                {stats.totalStudents}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Students
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'secondary.main', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                <SupervisorAccountIcon fontSize="large" />
              </Avatar>
              <Typography variant="h5" component="div" fontWeight="bold">
                {stats.totalTeachers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Teachers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                <SchoolIcon fontSize="large" />
              </Avatar>
              <Typography variant="h5" component="div" fontWeight="bold">
                {stats.totalSchools}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Schools
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ borderRadius: 2, height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                <MenuBookIcon fontSize="large" />
              </Avatar>
              <Typography variant="h5" component="div" fontWeight="bold">
                {stats.totalSubjects}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Subjects
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Charts and Recent Users */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              User Distribution
            </Typography>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              <Pie data={userRolesData} />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Entity Statistics
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar options={barOptions} data={entitiesData} />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Recent Users
            </Typography>
            <List>
              {stats.recentUsers.map((user, index) => (
                <React.Fragment key={user.id}>
                  <ListItem disablePadding>
                    <ListItemButton>
                      <ListItemIcon>
                        <Avatar>
                          {user.role === 'student' ? <FaceIcon /> : <SupervisorAccountIcon />}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText 
                        primary={user.name} 
                        secondary={`${user.role.charAt(0).toUpperCase() + user.role.slice(1)} • Joined on ${new Date(user.date).toLocaleDateString()}`} 
                      />
                    </ListItemButton>
                  </ListItem>
                  {index < stats.recentUsers.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                component={RouterLink} 
                to="/admin/users" 
                endIcon={<ArrowForwardIcon />}
                size="small"
              >
                View All Users
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  component={RouterLink}
                  to="/admin/users/create"
                  startIcon={<PersonIcon />}
                  sx={{ py: 1.5, justifyContent: 'flex-start' }}
                >
                  Add New User
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  component={RouterLink}
                  to="/admin/schools"
                  startIcon={<SchoolIcon />}
                  sx={{ py: 1.5, justifyContent: 'flex-start' }}
                >
                  Manage Schools
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  component={RouterLink}
                  to="/admin/subjects"
                  startIcon={<MenuBookIcon />}
                  sx={{ py: 1.5, justifyContent: 'flex-start' }}
                >
                  Manage Subjects
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  component={RouterLink}
                  to="/admin/directions"
                  startIcon={<TrendingUpIcon />}
                  sx={{ py: 1.5, justifyContent: 'flex-start' }}
                >
                  Manage Directions
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;
