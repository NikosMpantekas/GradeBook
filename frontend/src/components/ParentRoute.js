import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ParentRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  // Check if user is authenticated and has parent role
  if (!user || !user.token) {
    console.log('ParentRoute: No authenticated user, redirecting to login');
    return <Navigate to="/login" />;
  }

  if (user.role !== 'parent') {
    console.log('ParentRoute: User is not a parent, redirecting to appropriate dashboard');
    // Redirect to appropriate dashboard based on role
    switch (user.role) {
      case 'superadmin':
        return <Navigate to="/superadmin/dashboard" />;
      case 'admin':
        return <Navigate to="/app/admin" />;
      case 'teacher':
        return <Navigate to="/app/teacher" />;
      case 'student':
        return <Navigate to="/app/student" />;
      default:
        return <Navigate to="/login" />;
    }
  }

  console.log('ParentRoute: Parent access granted for:', user.name);

  return children;
};

export default ParentRoute;
