import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useSelector, useDispatch } from 'react-redux';

// Layout Components
import Layout from './components/layout/Layout';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import SuperAdminRoute from './components/SuperAdminRoute';
import TeacherRoute from './components/TeacherRoute';
import StudentProgressRoute from './components/StudentProgressRoute';

// Public Pages
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

// Common Pages
import Dashboard from './pages/Dashboard';
import StandaloneDashboard from './pages/StandaloneDashboard';
import DiagnosticPage from './pages/DiagnosticPage';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import NotificationDetail from './pages/NotificationDetail';

// Student Pages
import StudentGrades from './pages/student/StudentGrades';
import GradeDetail from './pages/student/GradeDetail';

// Teacher Pages
import TeacherGrades from './pages/teacher/TeacherGrades';
import ManageGrades from './pages/teacher/ManageGrades';
import CreateGrade from './pages/teacher/CreateGrade';
import TeacherNotifications from './pages/teacher/TeacherNotifications';
import CreateNotification from './pages/teacher/CreateNotification';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import CreateUser from './pages/admin/CreateUser';
import EditUser from './pages/admin/EditUser';
import ManageSchools from './pages/admin/ManageSchools';
import ManageDirections from './pages/admin/ManageDirections';
import ManageSubjects from './pages/admin/ManageSubjects';
import StudentProgress from './pages/admin/StudentProgress';
import ContactMessages from './pages/admin/ContactMessages';

// SuperAdmin Pages
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import CreateSchoolOwner from './pages/superadmin/CreateSchoolOwner';

// Push notification service
import { setupPushNotifications } from './services/pushNotificationService';
import setupAxios from './app/setupAxios';

// Custom components
import HomeScreenPrompt from './components/HomeScreenPrompt';
import AndroidInstallPrompt from './components/AndroidInstallPrompt';

function App() {
  const dispatch = useDispatch();
  const { darkMode } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);
  
  // Initialize axios interceptors for token management
  useEffect(() => {
    console.log('Setting up global axios interceptors');
    setupAxios();
  }, []);

  // Add service worker update handling
  useEffect(() => {
    // This effect handles service worker updates for PWA
    if ('serviceWorker' in navigator) {
      // Listen for service worker controller changes (which happen after updates)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker controller changed - new version available');
        // Optional: can reload automatically or show a notification
        // window.location.reload();
      });
      
      // Force update check on page load (for home screen launches)
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CHECK_UPDATE' });
      }
    }
  }, []);
  
  // Special initialization to ensure Redux is synced with storage
  useEffect(() => {
    // If Redux has no user but session storage does, we need to forcibly sync
    if (!user) {
      try {
        const sessionUser = sessionStorage.getItem('user');
        const localUser = localStorage.getItem('user');
        
        let userData = null;
        if (sessionUser) {
          userData = JSON.parse(sessionUser);
          console.log('Found user in sessionStorage, syncing with Redux');
        } else if (localUser) {
          userData = JSON.parse(localUser);
          console.log('Found user in localStorage, syncing with Redux');
        }
        
        if (userData && userData.token) {
          // Create a manual login action to update Redux state
          dispatch({
            type: 'auth/login/fulfilled',
            payload: userData
          });
        }
      } catch (err) {
        console.error('Error syncing storage with Redux:', err);
      }
    }
  }, [user, dispatch]);

  // Create theme based on dark mode preference
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#f50057',
      },
    },
    typography: {
      fontFamily: 'Roboto, Arial, sans-serif',
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
    },
  });

  // Set up push notifications if user is logged in
  useEffect(() => {
    if (user) {
      setupPushNotifications();
    }
  }, [user]);

  // Console log initial state - helps with debugging
  console.log('App rendering with auth state:', { isLoggedIn: !!user });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HomeScreenPrompt />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/diagnostics" element={<DiagnosticPage />} />
          
          {/* Default root route - redirects to app dashboard if logged in, otherwise to login */}
          <Route path="/" element={
            user ? <Navigate to="/app/dashboard" replace /> : <Navigate to="/login" replace />
          } />
          
          {/* Simple direct Dashboard route - using standalone component designed to work without Layout */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <StandaloneDashboard />
            </PrivateRoute>
          } />
          
          {/* Protected Routes with Layout */}
          <Route element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }>
            <Route path="/app/dashboard" element={<Dashboard />} />
            <Route path="/app/profile" element={<Profile />} />
            {/* General notifications route */}
            <Route path="/app/notifications" element={<Notifications />} />
            {/* Notification detail route still available for deep linking */}
            <Route path="/app/notifications/:id" element={<NotificationDetail />} />
            
            {/* Student Routes */}
            <Route path="/app/grades" element={<StudentGrades />} />
            <Route path="/app/grades/:id" element={<GradeDetail />} />
            
            {/* Teacher Routes */}
            <Route path="/app/teacher" element={
              <TeacherRoute>
                <TeacherGrades />
              </TeacherRoute>
            } />
            <Route path="/app/teacher/grades/manage" element={
              <TeacherRoute>
                <ManageGrades />
              </TeacherRoute>
            } />
            <Route path="/app/teacher/grades/create" element={
              <TeacherRoute>
                <CreateGrade />
              </TeacherRoute>
            } />
            <Route path="/app/teacher/notifications" element={
              <TeacherRoute>
                <TeacherNotifications />
              </TeacherRoute>
            } />
            <Route path="/app/teacher/notifications/create" element={
              <TeacherRoute>
                <CreateNotification />
              </TeacherRoute>
            } />
            
            {/* Admin Routes */}
            {/* Admin Dashboard - add both /app/admin and /app/admin/dashboard routes */}
            <Route path="/app/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/app/admin/dashboard" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="/app/admin/users" element={
              <AdminRoute>
                <ManageUsers />
              </AdminRoute>
            } />
            <Route path="/app/admin/progress" element={
              <AdminRoute>
                <StudentProgress />
              </AdminRoute>
            } />
            <Route path="/app/admin/progress/:studentId" element={
              <AdminRoute>
                <StudentProgress />
              </AdminRoute>
            } />
            <Route path="/app/admin/users/create" element={
              <AdminRoute>
                <CreateUser />
              </AdminRoute>
            } />

            <Route path="/app/admin/users/:id" element={
              <AdminRoute>
                <EditUser />
              </AdminRoute>
            } />
            {/* Contact Messages moved to superadmin - route left here for backward compatibility */}
            <Route path="/app/admin/contact" element={
              <AdminRoute>
                <Navigate to="/superadmin/contact" replace />
              </AdminRoute>
            } />
            <Route path="/app/admin/schools" element={
              <AdminRoute>
                <ManageSchools />
              </AdminRoute>
            } />
            <Route path="/app/admin/directions" element={
              <AdminRoute>
                <ManageDirections />
              </AdminRoute>
            } />
            <Route path="/app/admin/subjects" element={
              <AdminRoute>
                <ManageSubjects />
              </AdminRoute>
            } />
          </Route>

          {/* SuperAdmin Routes - Using PrivateRoute + Layout + SuperAdminRoute pattern */}
          <Route element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }>
            <Route path="/superadmin/dashboard" element={
              <SuperAdminRoute>
                <SuperAdminDashboard />
              </SuperAdminRoute>
            } />
            <Route path="/superadmin/new-school-owner" element={
              <SuperAdminRoute>
                <CreateSchoolOwner />
              </SuperAdminRoute>
            } />
            <Route path="/superadmin/contact" element={
              <SuperAdminRoute>
                <ContactMessages />
              </SuperAdminRoute>
            } />
          </Route>
          
          {/* 404 Page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={3000} />
      {/* Android PWA Installation Prompt */}
      <AndroidInstallPrompt />
    </ThemeProvider>
  );
}

export default App;
