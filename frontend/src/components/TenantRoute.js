import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Component to restrict routes to superadmin or school owner users only
const TenantRoute = ({ children, requireSuperAdmin }) => {
  const { user } = useSelector((state) => state.auth);

  // Check if user is authenticated and has the required role
  if (!user) {
    // Not logged in at all
    return <Navigate to="/login" />;
  }

  if (requireSuperAdmin && user.role !== 'superadmin') {
    // Restricted to superadmin only and user is not superadmin
    return <Navigate to="/dashboard" />;
  }

  if (!requireSuperAdmin && user.role !== 'superadmin' && user.role !== 'school_owner') {
    // Restricted to superadmin or school owner, but user is neither
    return <Navigate to="/dashboard" />;
  }

  // User has the required role, render the protected component
  return children;
};

export default TenantRoute;
