import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

// TeacherRoute component that checks if user is a teacher, admin, or secretary with appropriate permissions
// If not, redirects to dashboard
const TeacherRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  // Check if user exists
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Allow admin access to all routes
  if (user.role === 'admin') {
    return children;
  }

  // Allow teacher access (with notification permission check when needed)
  if (user.role === 'teacher') {
    const path = location.pathname;
    
    // For notification routes, check if teacher has notification permission
    if (path.includes('/notifications') && user.canSendNotifications === false) {
      return <Navigate to="/app/dashboard" />;
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
