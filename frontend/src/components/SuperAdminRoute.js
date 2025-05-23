import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoadingState from './common/LoadingState';

// Protected route component for superadmin-only access
const SuperAdminRoute = ({ children }) => {
  const { user, isLoading } = useSelector((state) => state.auth);
  
  // Enhanced logging for debugging
  console.log('SuperAdminRoute checking auth:', { 
    user: user ? { id: user._id, role: user.role, name: user.name } : 'No user', 
    isLoading 
  });

  if (isLoading) {
    return <LoadingState fullPage={true} message="Authenticating..." />;
  }

  // Check if user is logged in and has the superadmin role
  if (!user) {
    console.log('Access denied: Not authenticated');
    return <Navigate to="/login" />;
  }
  
  if (user.role !== 'superadmin') {
    console.log(`Access denied: User is not a superadmin (role: ${user.role})`);
    return <Navigate to="/app/dashboard" />;
  }
  
  // Verify the user has the necessary properties
  if (!user._id || !user.name || !user.email) {
    console.error('Superadmin user object is missing required properties:', user);
    // Still allow access since role check passed, but log the error
  }

  console.log('SuperAdmin access granted for:', user.name);
  
  // Return children if they exist, otherwise return the Outlet
  return children || <Outlet />;
};

export default SuperAdminRoute;
