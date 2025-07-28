import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useFeatureToggles } from '../context/FeatureToggleContext';
import LoadingState from './common/LoadingState';

// TeacherRoute component that checks if user is a teacher, admin, or secretary with appropriate permissions
// If not, redirects to dashboard
const TeacherRoute = ({ children }) => {
  const { user, isLoading } = useSelector((state) => state.auth);
  const location = useLocation();
  const { isFeatureEnabled } = useFeatureToggles(); // Use database-driven feature checks

  // Show loading state while authentication is in progress
  if (isLoading) {
    return <LoadingState fullPage={true} message="Checking teacher access..." />;
  }

  // Check if user exists
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Allow admin access to all routes
  if (user.role === 'admin') {
    return children;
  }

  // COMPREHENSIVE FEATURE FLAG ENFORCEMENT FOR ALL TEACHER ROUTES
  if (user.role === 'teacher') {
    
    // Classes Management
    if (location.pathname.includes('/app/teacher/classes')) {
      if (!isFeatureEnabled('enableClasses')) {
        console.log('❌ TeacherRoute - Classes feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // Grades Management
    if (location.pathname.includes('/app/teacher/grades')) {
      if (!isFeatureEnabled('enableGrades')) {
        console.log('❌ TeacherRoute - Grades feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // Notifications Management
    if (location.pathname.includes('/app/teacher/notifications')) {
      if (!isFeatureEnabled('enableNotifications')) {
        console.log('❌ TeacherRoute - Notifications feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // User Management
    if (location.pathname.includes('/app/teacher/users')) {
      if (!isFeatureEnabled('enableUserManagement')) {
        console.log('❌ TeacherRoute - User Management feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // Students Management
    if (location.pathname.includes('/app/teacher/students')) {
      if (!isFeatureEnabled('enableStudents')) {
        console.log('❌ TeacherRoute - Students feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // Teachers Management
    if (location.pathname.includes('/app/teacher/teachers')) {
      if (!isFeatureEnabled('enableTeachers')) {
        console.log('❌ TeacherRoute - Teachers feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // School Branches Management
    if (location.pathname.includes('/app/teacher/schools')) {
      if (!isFeatureEnabled('enableSchoolSettings')) {
        console.log('❌ TeacherRoute - School Settings feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // Schedule Management
    if (location.pathname.includes('/app/teacher/schedule')) {
      if (!isFeatureEnabled('enableSchedule')) {
        console.log('❌ TeacherRoute - Schedule feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    return children;
  }
  
  // For secretary role, check specific permissions based on the route
  if (user.role === 'secretary') {
    const path = location.pathname;
    
    // Check permissions based on the path
    if (path.includes('/grades') && user.secretaryPermissions?.canManageGrades) {
      return children;
    }
    
    if (path.includes('/notifications') && user.secretaryPermissions?.canSendNotifications) {
      return children;
    }
    
    // If no matching permission, redirect to dashboard
    return <Navigate to="/app/dashboard" />;
  }

  // Default: redirect to dashboard
  return <Navigate to="/app/dashboard" />;
};

export default TeacherRoute;
