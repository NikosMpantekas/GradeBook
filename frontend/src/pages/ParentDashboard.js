import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Fade
} from '@mui/material';
import {
  WelcomePanel,
  ProfileInfoPanel,
  RecentNotificationsPanel,
  RecentGradesPanel,
  UpcomingClassesPanel
} from '../components/dashboard/DashboardComponents';
import { useFeatureToggles } from '../context/FeatureToggleContext';
import axios from 'axios';
import { API_URL } from '../config/appConfig';
import { toast } from 'react-toastify';

/**
 * ParentDashboard Component
 * Rebuilt from scratch with same structure as AdminDashboard
 * Shows: Welcome, Profile, Recent Notifications, Recent Grades, Upcoming Classes
 */
const ParentDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isFeatureEnabled, loading: featuresLoading } = useFeatureToggles();
  
  // Component state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    notifications: [],
    grades: [],
    classes: [],
    stats: {}
  });
  
  // Loading states for individual panels
  const [panelLoading, setPanelLoading] = useState({
    notifications: false,
    grades: false,
    classes: false
  });

  // Check authentication and role
  useEffect(() => {
    if (!user) {
      console.log('ParentDashboard: No user found, redirecting to login');
      navigate('/login');
      return;
    }
    
    if (user.role !== 'parent') {
      console.log('ParentDashboard: User is not parent, redirecting');
      toast.error('Access denied. Parent privileges required.');
      navigate('/app/dashboard');
      return;
    }
    
    console.log('ParentDashboard: Parent user authenticated:', user.email);
  }, [user, navigate]);

  // Fetch dashboard data
  useEffect(() => {
    if (user && user.role === 'parent' && !featuresLoading) {
      fetchDashboardData();
    }
  }, [user, featuresLoading]);

  const getAuthConfig = () => {
    return {
      headers: {
        Authorization: `Bearer ${user.token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('ParentDashboard: Fetching dashboard data...');
      
      const promises = [];
      const dataKeys = [];
      
      // Only fetch data for enabled features
      if (isFeatureEnabled('enableNotifications')) {
        setPanelLoading(prev => ({ ...prev, notifications: true }));
        promises.push(fetchNotifications());
        dataKeys.push('notifications');
      }
      
      if (isFeatureEnabled('enableGrades')) {
        setPanelLoading(prev => ({ ...prev, grades: true }));
        promises.push(fetchRecentGrades());
        dataKeys.push('grades');
      }
      
      if (isFeatureEnabled('enableSchedule')) {
        setPanelLoading(prev => ({ ...prev, classes: true }));
        promises.push(fetchUpcomingClasses());
        dataKeys.push('classes');
      }
      
      // Execute all enabled data fetches
      const results = await Promise.allSettled(promises);
      
      // Process results
      const newData = { ...dashboardData };
      results.forEach((result, index) => {
        const key = dataKeys[index];
        if (result.status === 'fulfilled') {
          newData[key] = result.value;
        } else {
          console.error(`ParentDashboard: Error fetching ${key}:`, result.reason);
          newData[key] = [];
        }
      });
      
      setDashboardData(newData);
      console.log('ParentDashboard: Dashboard data loaded successfully');
      
    } catch (err) {
      console.error('ParentDashboard: Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
      // Clear all panel loading states
      setPanelLoading({
        notifications: false,
        grades: false,
        classes: false
      });
    }
  };

  const fetchNotifications = async () => {
    try {
      console.log('ParentDashboard: Fetching notifications...');
      const response = await axios.get(`${API_URL}/api/notifications`, getAuthConfig());
      return response.data.slice(0, 5); // Recent 5 notifications
    } catch (error) {
      console.error('ParentDashboard: Error fetching notifications:', error);
      return [];
    }
  };

  const fetchRecentGrades = async () => {
    try {
      console.log('ParentDashboard: Fetching recent grades...');
      const response = await axios.get(`${API_URL}/api/users/parent/students-data`, getAuthConfig());
      return response.data.combinedRecentGrades?.slice(0, 5) || []; // Recent 5 grades
    } catch (error) {
      console.error('ParentDashboard: Error fetching grades:', error);
      return [];
    }
  };

  const fetchUpcomingClasses = async () => {
    try {
      console.log('ParentDashboard: Fetching upcoming classes...');
      const response = await axios.get(`${API_URL}/api/schedule`, getAuthConfig());
      
      // Get today's day name
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      console.log('ParentDashboard: Today is:', today);
      
      if (response.data && typeof response.data === 'object') {
        const todayClasses = response.data[today] || response.data[today.charAt(0).toUpperCase() + today.slice(1)] || [];
        console.log('ParentDashboard: Today\'s classes found:', todayClasses.length);
        return todayClasses;
      }
      
      return [];
    } catch (error) {
      console.error('ParentDashboard: Error fetching upcoming classes:', error);
      return [];
    }
  };

  // Loading state
  if (loading && featuresLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Box textAlign="center" mt={2}>
          <Typography variant="body2">
            Having trouble? Try refreshing the page or contact support.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Welcome Panel */}
        <Grid item xs={12}>
          <Fade in={!loading}>
            <WelcomePanel 
              user={user} 
              userType="parent"
              subtitle={`Managing your student${dashboardData.stats.studentsCount !== 1 ? 's' : ''}'s academic progress`}
            />
          </Fade>
        </Grid>

        {/* Profile Information Panel */}
        <Grid item xs={12} md={6}>
          <Fade in={!loading}>
            <ProfileInfoPanel user={user} userType="parent" />
          </Fade>
        </Grid>

        {/* Recent Notifications Panel - if notifications are enabled */}
        {isFeatureEnabled('enableNotifications') && (
          <Grid item xs={12} md={6}>
            <Fade in={!panelLoading.notifications}>
              <RecentNotificationsPanel 
                notifications={dashboardData.notifications}
                loading={panelLoading.notifications}
                userType="parent"
                onViewAll={() => navigate('/app/notifications')}
              />
            </Fade>
          </Grid>
        )}

        {/* Recent Grades Panel - if grades are enabled */}
        {isFeatureEnabled('enableGrades') && (
          <Grid item xs={12} md={6}>
            <Fade in={!panelLoading.grades}>
              <RecentGradesPanel 
                grades={dashboardData.grades}
                loading={panelLoading.grades}
                userType="parent"
                onViewAll={() => navigate('/app/parent/grades')}
              />
            </Fade>
          </Grid>
        )}

        {/* Upcoming Classes Panel - if schedule is enabled */}
        {isFeatureEnabled('enableSchedule') && (
          <Grid item xs={12} md={6}>
            <Fade in={!panelLoading.classes}>
              <UpcomingClassesPanel 
                classes={dashboardData.classes}
                loading={panelLoading.classes}
                userType="parent"
                onViewAll={() => navigate('/app/schedule')}
              />
            </Fade>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default ParentDashboard;
