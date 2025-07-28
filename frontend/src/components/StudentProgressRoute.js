import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useFeatureToggles } from '../context/FeatureToggleContext';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import LoadingState from './common/LoadingState';

/**
 * StudentProgressRoute - Route component for student access with comprehensive feature flag enforcement
 * 
 * Updated to use the same database-driven permission system as AdminRoute and TeacherRoute
 */
const StudentProgressRoute = ({ children }) => {
  const { user, isLoading } = useSelector((state) => state.auth);
  const location = useLocation();
  const { isFeatureEnabled } = useFeatureToggles(); // Use database-driven feature checks

  // Show loading state while authentication is in progress
  if (isLoading) {
    return <LoadingState fullPage={true} message="Checking student access..." />;
  }

  // Check if user exists
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Allow admin access to all routes
  if (user.role === 'admin') {
    return children;
  }

  // COMPREHENSIVE FEATURE FLAG ENFORCEMENT FOR ALL STUDENT ROUTES
  if (user.role === 'student') {
    
    // Classes Management
    if (location.pathname.includes('/app/student/classes')) {
      if (!isFeatureEnabled('enableClasses')) {
        console.log('❌ StudentRoute - Classes feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // Grades Management
    if (location.pathname.includes('/app/student/grades')) {
      if (!isFeatureEnabled('enableGrades')) {
        console.log('❌ StudentRoute - Grades feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // Notifications Management
    if (location.pathname.includes('/app/student/notifications')) {
      if (!isFeatureEnabled('enableNotifications')) {
        console.log('❌ StudentRoute - Notifications feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // User Management
    if (location.pathname.includes('/app/student/users')) {
      if (!isFeatureEnabled('enableUserManagement')) {
        console.log('❌ StudentRoute - User Management feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // Students Management
    if (location.pathname.includes('/app/student/students')) {
      if (!isFeatureEnabled('enableStudents')) {
        console.log('❌ StudentRoute - Students feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // Teachers Management
    if (location.pathname.includes('/app/student/teachers')) {
      if (!isFeatureEnabled('enableTeachers')) {
        console.log('❌ StudentRoute - Teachers feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // School Branches Management
    if (location.pathname.includes('/app/student/schools')) {
      if (!isFeatureEnabled('enableSchoolSettings')) {
        console.log('❌ StudentRoute - School Settings feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    // Schedule Management
    if (location.pathname.includes('/app/student/schedule')) {
      if (!isFeatureEnabled('enableSchedule')) {
        console.log('❌ StudentRoute - Schedule feature disabled for this school');
        return <Navigate to="/app/dashboard" />;
      }
    }
    
    return children;
  }
  
  // For secretary role, maintain existing permissions but add feature flag checks
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

export default StudentProgressRoute;
