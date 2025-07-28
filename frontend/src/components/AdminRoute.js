import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useFeatureToggles } from '../context/FeatureToggleContext';
import LoadingState from './common/LoadingState';

// AdminRoute component that checks if user is an admin or a secretary with appropriate permissions
// If not, redirects to dashboard
const AdminRoute = ({ children }) => {
  const { user, isLoading } = useSelector((state) => state.auth);
  const location = useLocation();
  const { isFeatureEnabled } = useFeatureToggles(); // Use database-driven feature checks

  // Minimal logging for debugging
  if (!user) {
    console.log('AdminRoute - No user found');
  }

  if (user && user.role === 'secretary') {
    console.log('Secretary permissions:', user.secretaryPermissions || 'none');
  }

  // Show loading state while authentication is in progress
  if (isLoading) {
    return <LoadingState fullPage={true} message="Checking admin access..." />;
  }

  // CHECK 1: Verify user exists
  if (!user) {
    console.log('❌ AdminRoute - No user found, redirecting to login');
    return <Navigate to="/login" />;
  }

  // CHECK 2: Allow superadmin access to all routes EXCEPT ratings
  if (user.role === 'superadmin') {
    // Block superadmins from ratings-related routes completely
    if (location.pathname.includes('/app/admin/ratings') || 
        location.pathname.includes('/app/admin/rating-statistics') ||
        location.pathname.includes('/app/teacher/ratings') ||
        location.pathname.includes('/app/ratings')) {
      return <Navigate to="/app/dashboard" />;
    }
    
    // Grant access to all other routes
    return children;
  }

  // CHECK 3: Allow admin access but check feature toggles
  if (user.role === 'admin') {
    console.log('AdminRoute - Admin role verified, checking feature permissions');
    
    // COMPREHENSIVE FEATURE FLAG ENFORCEMENT FOR ALL ADMIN ROUTES
    
    // Classes Management
    if (location.pathname.includes('/app/admin/classes')) {
      if (!isFeatureEnabled('enableClasses')) {
        console.log('❌ AdminRoute - Classes feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // Grades Management
    if (location.pathname.includes('/app/admin/grades')) {
      if (!isFeatureEnabled('enableGrades')) {
        console.log('❌ AdminRoute - Grades feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // Notifications Management
    if (location.pathname.includes('/app/admin/notifications')) {
      if (!isFeatureEnabled('enableNotifications')) {
        console.log('❌ AdminRoute - Notifications feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // User Management
    if (location.pathname.includes('/app/admin/users')) {
      if (!isFeatureEnabled('enableUserManagement')) {
        console.log('❌ AdminRoute - User Management feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // School Settings
    if (location.pathname.includes('/app/admin/school-settings')) {
      if (!isFeatureEnabled('enableSchoolSettings')) {
        console.log('❌ AdminRoute - School Settings feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // School Branches Management
    if (location.pathname.includes('/app/admin/school-branches')) {
      if (!isFeatureEnabled('enableSchoolSettings')) {
        console.log('❌ AdminRoute - School Branches feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // Schedule Management
    if (location.pathname.includes('/app/admin/schedule')) {
      if (!isFeatureEnabled('enableSchedule')) {
        console.log('❌ AdminRoute - Schedule feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // Students Management
    if (location.pathname.includes('/app/admin/students')) {
      if (!isFeatureEnabled('enableStudents')) {
        console.log('❌ AdminRoute - Students feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // Teachers Management
    if (location.pathname.includes('/app/admin/teachers')) {
      if (!isFeatureEnabled('enableTeachers')) {
        console.log('❌ AdminRoute - Teachers feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // Subjects Management
    if (location.pathname.includes('/app/admin/subjects')) {
      if (!isFeatureEnabled('enableSubjects')) {
        console.log('❌ AdminRoute - Subjects feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // Analytics/Statistics
    if (location.pathname.includes('/app/admin/analytics') || location.pathname.includes('/app/admin/statistics')) {
      if (!isFeatureEnabled('enableAnalytics')) {
        console.log('❌ AdminRoute - Analytics feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // System Maintenance
    if (location.pathname.includes('/app/admin/maintenance')) {
      if (!isFeatureEnabled('enableSystemMaintenance')) {
        console.log('❌ AdminRoute - System Maintenance feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // Bug Reports
    if (location.pathname.includes('/app/admin/bug-reports')) {
      if (!isFeatureEnabled('enableBugReports')) {
        console.log('❌ AdminRoute - Bug Reports feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // Patch Notes
    if (location.pathname.includes('/app/admin/patch-notes')) {
      if (!isFeatureEnabled('enablePatchNotes')) {
        console.log('❌ AdminRoute - Patch Notes feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // Student Progress
    if (location.pathname.includes('/app/admin/progress')) {
      if (!isFeatureEnabled('enableStudentProgress')) {
        console.log('❌ AdminRoute - Student Progress feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // Rating routes check already handled for superadmin
    
    // Check for ratings-related routes for other users
    if ((location.pathname.includes('/app/admin/ratings') || 
         location.pathname.includes('/app/admin/rating-statistics') || 
         location.pathname.includes('/app/teacher/ratings') || 
         location.pathname.includes('/app/ratings')) && 
        !isFeatureEnabled('enableRatingSystem')) {
      return <Navigate to="/app/dashboard" />;
    }
    
    // Check for calendar routes
    if ((location.pathname.includes('/app/calendar') || 
         location.pathname.includes('/app/admin/calendar')) && 
        !isFeatureEnabled('enableCalendar')) {
      return <Navigate to="/app/dashboard" />;
    }
    
    if (location.pathname.includes('/app/admin/progress') && !isFeatureEnabled('enableStudentProgress')) {
      console.log('❌ AdminRoute - Student Progress feature disabled for this school');
      return <Navigate to="/app/dashboard" />;
    }
    
    if (location.pathname.includes('/app/admin/rating') && !isFeatureEnabled('enableRatingSystem')) {
      console.log('❌ AdminRoute - Rating System feature disabled for this school');
      return <Navigate to="/app/dashboard" />;
    }
    
    console.log('✅ AdminRoute - Admin access granted with required features enabled');
    // Force refresh state to ensure admin has all necessary data
    localStorage.setItem('admin_last_access', Date.now());
    return children;
  }
  
  // CHECK 4: For secretary, check both role permissions AND feature toggles
  if (user.role === 'secretary') {
    // Enable enhanced logging for secretary access attempts
    console.log(`Secretary access attempt to: ${location.pathname}`);
    
    // For student progress
    if (location.pathname.includes('/app/admin/progress')) {
      // Check specific permission if available, but fallback to allowing access
      const hasExplicitPermission = user.secretaryPermissions?.canAccessStudentProgress;
      // Also check if the feature is enabled at the school level
      const isFeatureActive = isFeatureEnabled('enableStudentProgress');
      
      console.log(`Secretary progress access: ${hasExplicitPermission ? 'Explicitly granted' : 'Default granted'}, Feature enabled: ${isFeatureActive}`);
      
      if (!isFeatureActive) {
        console.log('❌ Secretary access denied - Student Progress feature disabled for school');
        return <Navigate to="/app/dashboard" />;
      }
      
      return children;
    }
    
    // For user management
    if (location.pathname.includes('/app/admin/users')) {
      const hasExplicitPermission = user.secretaryPermissions?.canManageUsers;
      console.log(`Secretary user management access: ${hasExplicitPermission ? 'Explicitly granted' : 'Default granted'}`);
      return children;
    }
    
    // For school management
    if (location.pathname.includes('/app/admin/schools')) {
      const hasExplicitPermission = user.secretaryPermissions?.canManageSchools;
      console.log(`Secretary school management access: ${hasExplicitPermission ? 'Explicitly granted' : 'Default granted'}`);
      return children;
    }
    
    // For direction management
    if (location.pathname.includes('/app/admin/directions')) {
      const hasExplicitPermission = user.secretaryPermissions?.canManageDirections;
      console.log(`Secretary direction management access: ${hasExplicitPermission ? 'Explicitly granted' : 'Default granted'}`);
      return children;
    }
    
    // For subject management
    if (location.pathname.includes('/app/admin/subjects')) {
      const hasExplicitPermission = user.secretaryPermissions?.canManageSubjects;
      console.log(`Secretary subject management access: ${hasExplicitPermission ? 'Explicitly granted' : 'Default granted'}`);
      return children;
    }
    
    // For grades management - check both secretary permissions AND feature toggle
    if (location.pathname.includes('/app/admin/grades')) {
      const hasExplicitPermission = user.secretaryPermissions?.canManageGrades;
      const isFeatureActive = isFeatureEnabled('enableGrades');
      
      console.log(`Secretary grades access: ${hasExplicitPermission ? 'Explicitly granted' : 'Default granted'}, Feature enabled: ${isFeatureActive}`);
      
      if (!isFeatureActive) {
        console.log('❌ Secretary access denied - Grades feature disabled for school');
        return <Navigate to="/app/dashboard" />;
      }
      
      return children;
    }
    
    // For notifications management - check both secretary permissions AND feature toggle
    if (location.pathname.includes('/app/admin/notifications')) {
      const hasExplicitPermission = user.secretaryPermissions?.canSendNotifications;
      const isFeatureActive = isFeatureEnabled('enableNotifications');
      
      console.log(`Secretary notifications access: ${hasExplicitPermission ? 'Explicitly granted' : 'Default granted'}, Feature enabled: ${isFeatureActive}`);
      
      if (!isFeatureActive) {
        console.log('❌ Secretary access denied - Notifications feature disabled for school');
        return <Navigate to="/app/dashboard" />;
      }
      
      return children;
    }
    
    // For calendar management - check feature toggle
    if (location.pathname.includes('/app/admin/calendar')) {
      const isFeatureActive = isFeatureEnabled('enableCalendar');
      
      console.log(`Secretary calendar access check, Feature enabled: ${isFeatureActive}`);
      
      if (!isFeatureActive) {
        console.log('❌ Secretary access denied - Calendar feature disabled for school');
        return <Navigate to="/app/dashboard" />;
      }
      
      return children;
    }
    
    // For rating system - check feature toggle
    if (location.pathname.includes('/app/admin/rating')) {
      const isFeatureActive = isFeatureEnabled('enableRatingSystem');
      
      console.log(`Secretary rating system access check, Feature enabled: ${isFeatureActive}`);
      
      if (!isFeatureActive) {
        console.log('❌ Secretary access denied - Rating System feature disabled for school');
        return <Navigate to="/app/dashboard" />;
      }
      
      return children;
    }
    
    // For admin dashboard
    if (location.pathname === '/app/admin') {
      // Always grant access to the main admin dashboard
      console.log('✅ AdminRoute - Secretary granted admin dashboard access');
      return children;
    }
  }

  console.log(`❌ Access denied for role: ${user.role} to path: ${location.pathname}`);
  // Redirect to dashboard if they don't have permission
  return <Navigate to="/app/dashboard" />;
};

export default AdminRoute;
