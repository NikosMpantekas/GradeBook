import React, { useEffect } from 'react';
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
import TeacherRoute from './components/TeacherRoute';

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

// Push notification service
import { setupPushNotifications } from './services/pushNotificationService';

function App() {
  const { darkMode } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);
  
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
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/diagnostics" element={<DiagnosticPage />} />
          
          {/* Default root route - redirects to dashboard if logged in, otherwise to login */}
          <Route path="/" element={
            user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          } />
          
          {/* Simple direct Dashboard route - using standalone component designed to work without Layout */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <StandaloneDashboard />
            </PrivateRoute>
          } />
          
          {/* Protected Routes with Layout */}
          <Route path="/app" element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="notifications/:id" element={<NotificationDetail />} />
            
            {/* Student Routes */}
            <Route path="grades" element={<StudentGrades />} />
            <Route path="grades/:id" element={<GradeDetail />} />
            
            {/* Teacher Routes */}
            <Route path="teacher" element={
              <TeacherRoute>
                <TeacherGrades />
              </TeacherRoute>
            } />
            <Route path="teacher/grades/manage" element={
              <TeacherRoute>
                <ManageGrades />
              </TeacherRoute>
            } />
            <Route path="teacher/grades/create" element={
              <TeacherRoute>
                <CreateGrade />
              </TeacherRoute>
            } />
            <Route path="teacher/notifications" element={
              <TeacherRoute>
                <TeacherNotifications />
              </TeacherRoute>
            } />
            <Route path="teacher/notifications/create" element={
              <TeacherRoute>
                <CreateNotification />
              </TeacherRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            <Route path="admin/users" element={
              <AdminRoute>
                <ManageUsers />
              </AdminRoute>
            } />
            <Route path="admin/users/create" element={
              <AdminRoute>
                <CreateUser />
              </AdminRoute>
            } />
            <Route path="admin/users/:id/edit" element={
              <AdminRoute>
                <EditUser />
              </AdminRoute>
            } />
            <Route path="admin/schools" element={
              <AdminRoute>
                <ManageSchools />
              </AdminRoute>
            } />
            <Route path="admin/directions" element={
              <AdminRoute>
                <ManageDirections />
              </AdminRoute>
            } />
            <Route path="admin/subjects" element={
              <AdminRoute>
                <ManageSubjects />
              </AdminRoute>
            } />
          </Route>
          
          {/* 404 Page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={3000} />
    </ThemeProvider>
  );
}

export default App;
