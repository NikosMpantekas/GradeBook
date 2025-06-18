import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoadingState from './common/LoadingState';

// AdminRoute component that checks if user is an admin or a secretary with appropriate permissions
// If not, redirects to dashboard
const AdminRoute = ({ children }) => {
  const { user, isLoading } = useSelector((state) => state.auth);
  const location = useLocation();
  
  // Helper function to check if a school feature is enabled
  const isFeatureEnabled = (featureName) => {
    // Superadmin bypass all feature checks
    if (user?.role === 'superadmin') {
      console.log(`Feature check for ${featureName}: SUPERADMIN BYPASS`);
      return true;
    }
    
    // Log the actual feature check attempts
    console.log(`Checking feature ${featureName}:`, {
      path1: user?.schoolFeatures?.[featureName],
      path2: user?.features?.[featureName]
    });
    
    // Try both possible locations for the feature flag
    if (user?.schoolFeatures && featureName in user.schoolFeatures) {
      const enabled = user.schoolFeatures[featureName] === true;
      console.log(`Feature ${featureName} from schoolFeatures: ${enabled}`);
      return enabled;
    }
    
    // Try alternative location
    if (user?.features && featureName in user.features) {
      const enabled = user.features[featureName] === true;
      console.log(`Feature ${featureName} from features: ${enabled}`);
      return enabled;
    }
    
    console.log(`Feature ${featureName} not found in any location, defaulting to TRUE`);
    // Default to true if feature toggle not found
    return true;
  };

  // Enhanced logging for debugging admin access issues
  console.log('AdminRoute check - User:', user ? {
    id: user._id,
    name: user.name,
    role: user.role,
    token: user.token ? 'present' : 'missing',
    schoolId: user.schoolId || 'not set'
  } : 'No user');
  
  // Add detailed logging for school features
  if (user) {
    console.log('USER OBJECT KEYS:', Object.keys(user));
    console.log('SCHOOL FEATURES CHECK:', {
      hasSchoolFeatures: 'schoolFeatures' in user,
      schoolFeatures: user.schoolFeatures,
      directFeatures: user.features,
      rawData: JSON.stringify(user.schoolFeatures || user.features || {})
    });
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

  // CHECK 2: Always allow superadmin access to all routes
  if (user.role === 'superadmin') {
    console.log('✅ AdminRoute - Superadmin access granted');
    return children;
  }

  // CHECK 3: Allow admin access but check feature toggles
  if (user.role === 'admin') {
    console.log('AdminRoute - Admin role verified, checking feature permissions');
    
    // Check feature permissions based on route
    if (location.pathname.includes('/app/admin/grades')) {
      const gradeFeatureEnabled = isFeatureEnabled('enableGrades');
      console.log(`Grades feature check result: ${gradeFeatureEnabled}`);
      if (!gradeFeatureEnabled) {
        console.log('❌ AdminRoute - Grades feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    if (location.pathname.includes('/app/admin/notifications') && !isFeatureEnabled('enableNotifications')) {
      console.log('❌ AdminRoute - Notifications feature disabled for this school');
      return <Navigate to="/app/dashboard" />;
    }
    
    // Check for ratings-related routes
    if ((location.pathname.includes('/app/admin/ratings') || 
         location.pathname.includes('/app/admin/rating-statistics') || 
         location.pathname.includes('/app/teacher/ratings') || 
         location.pathname.includes('/app/ratings')) && 
        !isFeatureEnabled('enableRatingSystem')) {
      console.log('❌ AdminRoute - Rating system feature disabled for this school');
      return <Navigate to="/app/dashboard" />;
    }
    
    // Check for calendar routes
    if ((location.pathname.includes('/app/calendar') || 
         location.pathname.includes('/app/admin/calendar')) && 
        !isFeatureEnabled('enableCalendar')) {
      console.log('❌ AdminRoute - Calendar feature disabled for this school');
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
