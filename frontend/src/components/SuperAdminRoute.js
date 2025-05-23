import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoadingState from './common/LoadingState';
import logger from '../services/loggerService';
import ErrorBoundary from './common/ErrorBoundary';

// Protected route component for superadmin-only access
const SuperAdminRoute = ({ children }) => {
  const { user, isLoading } = useSelector((state) => state.auth);
  
  // Enhanced logging for debugging - detailed info about the current state
  logger.info('ROUTE', 'SuperAdminRoute auth check', { 
    user: user ? { 
      id: user._id, 
      role: user.role, 
      name: user.name,
      hasToken: !!user.token,
      currentPath: window.location.pathname
    } : 'No user', 
    isLoading,
    hasLocalStorage: !!localStorage.getItem('user'),
    hasSessionStorage: !!sessionStorage.getItem('user'),
    userKeys: user ? Object.keys(user) : []  // Log available properties on user
  });

  // Show loading state while auth is being determined
  if (isLoading) {
    logger.debug('ROUTE', 'SuperAdminRoute showing loading state');
    return <LoadingState fullPage={true} message="Authenticating..." />;
  }

  // Check if user is logged in
  if (!user) {
    logger.warn('ROUTE', 'SuperAdminRoute access denied: Not authenticated');
    return <Navigate to="/login" />;
  }
  
  // Detailed validation of user object to help diagnose issues
  if (!user._id && !user.id) {
    logger.error('ROUTE', 'User object missing ID property', { userObject: user });
  }
  
  if (!user.token) {
    logger.error('ROUTE', 'User object missing token', { 
      userHasToken: !!user.token,
      tokenLength: user.token?.length
    });
  }
  
  // Role-based access control check
  if (user.role !== 'superadmin') {
    logger.warn('ROUTE', `SuperAdminRoute access denied: User is not a superadmin`, {
      actualRole: user.role,
      userId: user._id || user.id
    });
    return <Navigate to="/app/dashboard" />;
  }

  logger.info('ROUTE', 'SuperAdmin access granted', {
    name: user.name,
    id: user._id || user.id,
    targetPath: window.location.pathname
  });
  
  // Wrap in ErrorBoundary to catch any rendering errors
  return (
    <ErrorBoundary componentName="SuperAdminRoute">
      {children || <Outlet />}
    </ErrorBoundary>
  );
};

export default SuperAdminRoute;
