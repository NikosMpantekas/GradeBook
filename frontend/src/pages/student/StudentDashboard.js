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
} from '../../components/dashboard/DashboardComponents';
import { useFeatureToggles } from '../../context/FeatureToggleContext';
import axios from 'axios';
import { API_URL } from '../../config/appConfig';
import { toast } from 'react-toastify';

/**
 * StudentDashboard Component
 * Rebuilt to match AdminDashboard design exactly
 * Shows: Welcome, Profile, Recent Notifications, Recent Grades, Upcoming Classes
 */
const StudentDashboard = () => {
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
      console.log('StudentDashboard: No user found, redirecting to login');
      navigate('/login');
      return;
    }
    
    if (user.role !== 'student' && user.role !== 'admin') {
      console.log('StudentDashboard: User is not student or admin, redirecting');
      toast.error('Access denied. Student privileges required.');
      navigate('/app/dashboard');
      return;
    }
    
    console.log('StudentDashboard: Student user authenticated:', user.email);
  }, [user, navigate]);

  // Fetch dashboard data
  useEffect(() => {
    if (user && (user.role === 'student' || user.role === 'admin') && !featuresLoading) {
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
      
      console.log('StudentDashboard: Fetching dashboard data...');
      
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
      
      if (isFeatureEnabled('enableClasses') || isFeatureEnabled('enableSchedule')) {
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
          console.error(`StudentDashboard: Error fetching ${key}:`, result.reason);
          newData[key] = [];
        }
      });
      
      setDashboardData(newData);
      console.log('StudentDashboard: Dashboard data loaded successfully');
      
    } catch (error) {
      console.error('StudentDashboard: Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
      setPanelLoading({ notifications: false, grades: false, classes: false });
    }
  };

  const fetchNotifications = async () => {
    try {
      // For student, get their received notifications
      const response = await axios.get(`${API_URL}/api/notifications?limit=10`, getAuthConfig());
      return response.data || [];
    } catch (error) {
      console.error('StudentDashboard: Error fetching notifications:', error);
      return [];
    }
  };

  const fetchRecentGrades = async () => {
    try {
      // For student, get their grades
      const response = await axios.get(`${API_URL}/api/grades/student?limit=10`, getAuthConfig());
      return response.data || [];
    } catch (error) {
      console.error('StudentDashboard: Error fetching recent grades:', error);
      return [];
    }
  };

  const fetchUpcomingClasses = async () => {
    try {
      // For student, get their upcoming classes
      const response = await axios.get(`${API_URL}/api/schedule`, getAuthConfig());
      
      // Process schedule data to get upcoming classes
      if (response.data) {
        const today = new Date();
        const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        
        let scheduleData = response.data;
        if (scheduleData && scheduleData.schedule) {
          scheduleData = scheduleData.schedule;
        }
        
        const todayClasses = scheduleData[dayOfWeek] || [];
        return todayClasses.slice(0, 10); // Limit to 10 classes
      }
      
      return [];
    } catch (error) {
      console.error('StudentDashboard: Error fetching upcoming classes:', error);
      return [];
    }
  };

  // Navigation handlers
  const handleViewAllNotifications = () => {
    navigate('/app/student/notifications');
  };

  const handleViewAllGrades = () => {
    navigate('/app/student/grades');
  };

  const handleViewAllClasses = () => {
    navigate('/app/student/schedule');
  };

  // Show loading state
  if (featuresLoading || loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  // Show error state
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  // Show access denied if not student or admin
  if (!user || (user.role !== 'student' && user.role !== 'admin')) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          Access denied. Student privileges required.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Fade in={true} timeout={800}>
        <Box>
          {/* Welcome Panel - Always shown */}
          <WelcomePanel user={user} />
          
          <Grid container spacing={3}>
            {/* Profile Information - Always shown */}
            <Grid item xs={12} md={4}>
              <ProfileInfoPanel user={user} loading={false} />
            </Grid>
            
            {/* Recent Notifications - Only if feature enabled */}
            <Grid item xs={12} md={8}>
              <RecentNotificationsPanel 
                notifications={dashboardData.notifications}
                loading={panelLoading.notifications}
                onViewAll={handleViewAllNotifications}
              />
            </Grid>
            
            {/* Recent Grades - Only if feature enabled */}
            <Grid item xs={12} md={6}>
              <RecentGradesPanel 
                grades={dashboardData.grades}
                loading={panelLoading.grades}
                onViewAll={handleViewAllGrades}
                userRole="student"
              />
            </Grid>
            
            {/* Upcoming Classes - Only if feature enabled */}
            <Grid item xs={12} md={6}>
              <UpcomingClassesPanel 
                classes={dashboardData.classes}
                loading={panelLoading.classes}
                onViewAll={handleViewAllClasses}
                userRole="student"
              />
            </Grid>
          </Grid>
          
          {/* Show message if no features are enabled */}
          {!isFeatureEnabled('enableNotifications') && 
           !isFeatureEnabled('enableGrades') && 
           !isFeatureEnabled('enableClasses') && 
           !isFeatureEnabled('enableSchedule') && (
            <Alert severity="info" sx={{ mt: 3 }}>
              Some dashboard features are currently disabled. Contact your system administrator to enable additional features.
            </Alert>
          )}
        </Box>
      </Fade>
    </Container>
  );
};

export default StudentDashboard;
