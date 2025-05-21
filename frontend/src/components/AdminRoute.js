import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoadingState from './common/LoadingState';

// AdminRoute component that checks if user is an admin or a secretary with appropriate permissions
// If not, redirects to dashboard
const AdminRoute = ({ children }) => {
  const { user, isLoading } = useSelector((state) => state.auth);
  const location = useLocation();

  // Enhanced logging for debugging admin access issues
  console.log('AdminRoute check - User:', user ? {
    id: user._id,
    name: user.name,
    role: user.role,
    token: user.token ? 'present' : 'missing',
    schoolId: user.schoolId || 'not set'
  } : 'No user');

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

  // CHECK 3: Always allow admin access to all routes
  if (user.role === 'admin') {
    console.log('✅ AdminRoute - Admin access granted');
    // Force refresh state to ensure admin has all necessary data
    localStorage.setItem('admin_last_access', Date.now());
    return children;
  }
  
  // CHECK 4: For secretary, check permissions with detailed verification
  if (user.role === 'secretary') {
    // Enable enhanced logging for secretary access attempts
    console.log(`Secretary access attempt to: ${location.pathname}`);
    
    // For student progress
    if (location.pathname.includes('/app/admin/progress')) {
      // Check specific permission if available, but fallback to allowing access
      const hasExplicitPermission = user.secretaryPermissions?.canAccessStudentProgress;
      console.log(`Secretary progress access: ${hasExplicitPermission ? 'Explicitly granted' : 'Default granted'}`);
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
