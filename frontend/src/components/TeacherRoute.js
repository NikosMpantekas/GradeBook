import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useFeatureToggles } from '../context/FeatureToggleContext';
import LoadingState from './common/LoadingState';

// TeacherRoute component that checks if user is a teacher and enforces feature flags
// Only allows access to teacher-specific features that are enabled for their school
const TeacherRoute = ({ children }) => {
  const { user, isLoading } = useSelector((state) => state.auth);
  const location = useLocation();
  const { isFeatureEnabled } = useFeatureToggles(); // Use database-driven feature checks

  // Show loading state while authentication is in progress
  if (isLoading) {
    return <LoadingState fullPage={true} message="Checking teacher access..." />;
  }

  // CHECK 1: Verify user exists
  if (!user) {
    console.log('❌ TeacherRoute - No user found, redirecting to login');
    return <Navigate to="/login" />;
  }

  // CHECK 2: Allow admin access to teacher routes (for management purposes)
  if (user.role === 'admin' || user.role === 'superadmin') {
    console.log('✅ TeacherRoute - Admin/SuperAdmin granted teacher route access');
    return children;
  }

  // TEMPORARY: Allow ALL account types access for testing (not just teacher)
  if (user.role === 'teacher' || user.role === 'admin' || user.role === 'student' || user.role === 'secretary') {
    console.log('TeacherRoute - Teacher role verified, checking feature permissions');
    
    // COMPREHENSIVE FEATURE FLAG ENFORCEMENT FOR TEACHER ROUTES
    
    // Teacher Grades Management
    if (location.pathname.includes('/app/teacher/grades') || location.pathname.includes('/app/grades')) {
      if (!isFeatureEnabled('enableGrades')) {
        console.log('❌ TeacherRoute - Grades feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // Teacher Notifications
    if (location.pathname.includes('/app/teacher/notifications') || location.pathname.includes('/app/notifications')) {
      if (!isFeatureEnabled('enableNotifications')) {
        console.log('❌ TeacherRoute - Notifications feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
      // Additional check for teacher notification permission
      if (user.canSendNotifications === false) {
        console.log('❌ TeacherRoute - Teacher does not have notification permission');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // Teacher Classes Management
    if (location.pathname.includes('/app/teacher/classes') || location.pathname.includes('/app/classes')) {
      if (!isFeatureEnabled('enableClasses')) {
        console.log('❌ TeacherRoute - Classes feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // Teacher Students Management
    if (location.pathname.includes('/app/teacher/students') || location.pathname.includes('/app/students')) {
      if (!isFeatureEnabled('enableStudents')) {
        console.log('❌ TeacherRoute - Students feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // Teacher Schedule/Calendar
    if (location.pathname.includes('/app/teacher/schedule') || 
        location.pathname.includes('/app/teacher/calendar') ||
        location.pathname.includes('/app/schedule') ||
        location.pathname.includes('/app/calendar')) {
      if (!isFeatureEnabled('enableCalendar')) {
        console.log('❌ TeacherRoute - Calendar feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // Teacher Rating System
    if (location.pathname.includes('/app/teacher/ratings') || location.pathname.includes('/app/ratings')) {
      if (!isFeatureEnabled('enableRatingSystem')) {
        console.log('❌ TeacherRoute - Rating System feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // Teacher Progress Tracking
    if (location.pathname.includes('/app/teacher/progress') || location.pathname.includes('/app/progress')) {
      if (!isFeatureEnabled('enableStudentProgress')) {
        console.log('❌ TeacherRoute - Student Progress feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    console.log('✅ TeacherRoute - Access granted to teacher route');
    return children;
  }
  
  // CHECK 4: Allow secretary access with permission and feature flag checks
  if (user.role === 'secretary') {
    console.log('TeacherRoute - Secretary role verified, checking permissions and features');
    
    // Secretary Grades Management
    if (location.pathname.includes('/grades')) {
      if (!isFeatureEnabled('enableGrades')) {
        console.log('❌ TeacherRoute - Grades feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
      if (!user.secretaryPermissions?.canManageGrades) {
        console.log('❌ TeacherRoute - Secretary does not have grades permission');
        return <Navigate to="/app/dashboard" />;
      }
      return children;
    }
    
    // Secretary Notifications
    if (location.pathname.includes('/notifications')) {
      if (!isFeatureEnabled('enableNotifications')) {
        console.log('❌ TeacherRoute - Notifications feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
      if (!user.secretaryPermissions?.canSendNotifications) {
        console.log('❌ TeacherRoute - Secretary does not have notifications permission');
        return <Navigate to="/app/dashboard" />;
      }
      return children;
    }
    
    // If no matching permission, redirect to dashboard
    console.log('❌ TeacherRoute - Secretary access denied for this route');
    return <Navigate to="/app/dashboard" />;
  }

  // Default: redirect to dashboard for any other role
  console.log(`❌ TeacherRoute - Invalid role: ${user.role}, redirecting to dashboard`);
  return <Navigate to="/app/dashboard" />;
};

export default TeacherRoute;
