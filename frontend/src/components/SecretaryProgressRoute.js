import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Custom route component for Student Progress access
// Allows admin users and secretaries with the canAccessStudentProgress permission
const SecretaryProgressRoute = ({ children }) => {
  // Access the current user from Redux store
  const currentUser = useSelector((state) => state.auth.user);
  
  // For debugging
  console.log('SecretaryProgressRoute - Current user:', {
    user: currentUser,
    role: currentUser?.role,
    hasPermission: currentUser?.role === 'secretary' && currentUser?.secretaryPermissions?.canAccessStudentProgress
  });

  // Make sure user is authenticated
  if (!currentUser) {
    console.log('SecretaryProgressRoute - Not authenticated, redirecting to login');
    return <Navigate to="/login" />;
  }

  // Allow admin access
  if (currentUser.role === 'admin') {
    console.log('SecretaryProgressRoute - Admin access granted');
    return children;
  }

  // Allow secretary access only if they have the right permission
  if (currentUser.role === 'secretary' && currentUser.secretaryPermissions?.canAccessStudentProgress) {
    console.log('SecretaryProgressRoute - Secretary access granted');
    return children;
  }

  // Otherwise redirect to dashboard
  console.log('SecretaryProgressRoute - Access denied, redirecting to dashboard');
  return <Navigate to="/app/dashboard" />;
};

export default SecretaryProgressRoute;
