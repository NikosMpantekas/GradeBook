import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Component to restrict routes to school owner users only
const SchoolOwnerRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  // Check if user is authenticated and has the required role
  if (!user) {
    // Not logged in at all
    return <Navigate to="/login" />;
  }

  if (user.role !== 'school_owner' && user.role !== 'superadmin') {
    // User is not a school owner or superadmin
    return <Navigate to="/dashboard" />;
  }

  // User is a school owner or superadmin, render the protected component
  return children;
};

export default SchoolOwnerRoute;
