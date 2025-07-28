import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useFeatureToggles } from '../context/FeatureToggleContext';
import LoadingState from './common/LoadingState';

// StudentRoute component that checks if user is a student and enforces feature flags
// Only allows access to student-specific features that are enabled for their school
const StudentRoute = ({ children }) => {
  const { user, isLoading } = useSelector((state) => state.auth);
  const location = useLocation();
  const { isFeatureEnabled } = useFeatureToggles(); // Use database-driven feature checks

  // Show loading state while authentication is in progress
  if (isLoading) {
    return <LoadingState fullPage={true} message="Checking student access..." />;
  }

  // CHECK 1: Verify user exists
  if (!user) {
    console.log('❌ StudentRoute - No user found, redirecting to login');
    return <Navigate to="/login" />;
  }

  // CHECK 2: Allow admin access to student routes (for testing/management)
  if (user.role === 'admin' || user.role === 'superadmin') {
    // Admins can access student routes for testing purposes
    console.log('✅ StudentRoute - Admin/SuperAdmin granted student route access');
    return children;
  }

  // TEMPORARY: Allow ALL account types access for testing (not just students)
  // if (user.role !== 'student') {
  //   console.log(`❌ StudentRoute - Invalid role: ${user.role}, redirecting to dashboard`);
  //   return <Navigate to="/app/dashboard" />;
  // }

  // TEMPORARY: Allow all roles to access student routes for testing
  console.log(`StudentRoute - ${user.role} role access granted for testing, checking feature permissions`);
  
  // COMPREHENSIVE FEATURE FLAG ENFORCEMENT FOR STUDENT ROUTES
  
  // Student Grades
  if (location.pathname.includes('/app/grades') || location.pathname.includes('/app/student/grades')) {
    if (!isFeatureEnabled('enableGrades')) {
      console.log('❌ StudentRoute - Grades feature disabled for this school');
      return <Navigate to="/app/dashboard" />;
    }
  }
  
  // Student Notifications
  if (location.pathname.includes('/app/notifications') || location.pathname.includes('/app/student/notifications')) {
    if (!isFeatureEnabled('enableNotifications')) {
      console.log('❌ StudentRoute - Notifications feature disabled for this school');
      return <Navigate to="/app/dashboard" />;
    }
  }
  
  // Student Progress
  if (location.pathname.includes('/app/progress') || location.pathname.includes('/app/student/progress')) {
    if (!isFeatureEnabled('enableStudentProgress')) {
      console.log('❌ StudentRoute - Student Progress feature disabled for this school');
      return <Navigate to="/app/dashboard" />;
    }
  }
  
  // Student Calendar/Schedule
  if (location.pathname.includes('/app/calendar') || 
      location.pathname.includes('/app/schedule') || 
      location.pathname.includes('/app/student/calendar') ||
      location.pathname.includes('/app/student/schedule')) {
    if (!isFeatureEnabled('enableCalendar')) {
      console.log('❌ StudentRoute - Calendar feature disabled for this school');
      return <Navigate to="/app/dashboard" />;
    }
  }
  
  // Student Rating System
  if (location.pathname.includes('/app/ratings') || 
      location.pathname.includes('/app/student/ratings')) {
    if (!isFeatureEnabled('enableRatingSystem')) {
      console.log('❌ StudentRoute - Rating System feature disabled for this school');
      return <Navigate to="/app/dashboard" />;
    }
  }
  
  // Student Classes View
  if (location.pathname.includes('/app/classes') || 
      location.pathname.includes('/app/student/classes')) {
    if (!isFeatureEnabled('enableClasses')) {
      console.log('❌ StudentRoute - Classes feature disabled for this school');
      return <Navigate to="/app/dashboard" />;
    }
  }
  
  // Student Profile/Settings
  if (location.pathname.includes('/app/profile') || 
      location.pathname.includes('/app/student/profile') ||
      location.pathname.includes('/app/student/settings')) {
    // Profile access might not need a specific feature flag, but let's check if user management is enabled
    if (!isFeatureEnabled('enableUserManagement')) {
      console.log('❌ StudentRoute - User Management feature disabled for this school');
      return <Navigate to="/app/dashboard" />;
    }
  }

  // If all checks pass, grant access
  console.log('✅ StudentRoute - Access granted to student route');
  return children;
};

export default StudentRoute;
