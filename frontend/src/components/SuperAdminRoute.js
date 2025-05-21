import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoadingState from './common/LoadingState';

// Protected route component for superadmin-only access
const SuperAdminRoute = ({ children }) => {
  const { user, isLoading } = useSelector((state) => state.auth);

  if (isLoading) {
    return <LoadingState fullPage={true} message="Authenticating..." />;
  }

  // Check if user is logged in and has the superadmin role
  if (!user || user.role !== 'superadmin') {
    console.log('Access denied: User is not a superadmin');
    return <Navigate to="/" />;
  }

  // Return children if they exist, otherwise return the Outlet
  return children || <Outlet />;
};

export default SuperAdminRoute;
