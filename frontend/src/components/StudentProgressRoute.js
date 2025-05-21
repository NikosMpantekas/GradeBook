import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';

/**
 * StudentProgressRoute - A comprehensive route component for student progress tracking access
 * 
 * This component has been completely redesigned to be more reliable by:
 * 1. Using the most direct method to check permissions
 * 2. Adding a loading state to ensure permissions are fully loaded
 * 3. Providing detailed error messages when access is denied
 * 4. Checking both localStorage and sessionStorage as backup
 */
const StudentProgressRoute = ({ children }) => {
  // Access the current user from Redux store
  const user = useSelector((state) => state.auth.user);
  const [isChecking, setIsChecking] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [checkCompleted, setCheckCompleted] = useState(false);
  
  // Comprehensive permission check that doesn't rely solely on Redux state
  useEffect(() => {
    console.group('🔄 STUDENT PROGRESS ACCESS CHECK');
    console.log('Current time:', new Date().toISOString());
    console.log('Redux state user:', user);
    
    let hasAccess = false;
    let secretaryWithPermission = false;
    
    // 1. Check if the user is an admin (always has access)
    if (user?.role === 'admin') {
      console.log('✅ Access granted: User is an admin');
      hasAccess = true;
    }
    // 2. Check if user is a secretary with proper permission
    else if (user?.role === 'secretary') {
      console.log('Secretary permissions from Redux:', user.secretaryPermissions);
      
      // Primary check from Redux state
      if (user.secretaryPermissions?.canAccessStudentProgress === true) {
        console.log('✅ Access granted: Secretary with canAccessStudentProgress permission');
        secretaryWithPermission = true;
        hasAccess = true;
      }
      // Fallback check from localStorage (in case Redux state is stale)
      else {
        try {
          const localUser = JSON.parse(localStorage.getItem('user'));
          const sessionUser = JSON.parse(sessionStorage.getItem('user'));
          
          console.log('Fallback check - localStorage user:', localUser?.secretaryPermissions);
          console.log('Fallback check - sessionStorage user:', sessionUser?.secretaryPermissions);
          
          if (localUser?.secretaryPermissions?.canAccessStudentProgress === true ||
              sessionUser?.secretaryPermissions?.canAccessStudentProgress === true) {
            console.log('✅ Access granted via storage fallback check');
            secretaryWithPermission = true;
            hasAccess = true;
          } else {
            console.log('❌ Secretary lacks required permission');
          }
        } catch (error) {
          console.error('Error in fallback permission check:', error);
        }
      }
    } else {
      console.log('❌ Access denied: User is neither admin nor secretary');
    }
    
    // Set state based on check results
    setAccessGranted(hasAccess);
    setIsChecking(false);
    setCheckCompleted(true);
    
    // Log final decision
    console.log('Final access decision:', hasAccess ? 'GRANTED ✅' : 'DENIED ❌');
    console.groupEnd();
    
    // Save permission debug info to help troubleshoot
    const debugData = {
      timestamp: new Date().toISOString(),
      userRole: user?.role,
      permissions: user?.secretaryPermissions,
      hasAccess,
      secretaryWithPermission
    };
    
    try {
      // Store for later debugging if needed
      localStorage.setItem('progress_access_debug', JSON.stringify(debugData));
    } catch (e) {}
    
  }, [user]);
  
  // Loading state while checking permissions
  if (isChecking) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={40} sx={{ mr: 2 }} />
        <Typography variant="h6">Checking permissions...</Typography>
      </Box>
    );
  }
  
  // Provide children if access is granted
  if (accessGranted) {
    return children;
  }
  
  // Detailed error message before redirecting
  if (checkCompleted && !accessGranted) {
    console.error('Access to Student Progress denied - insufficient permissions');
    
    if (user?.role === 'secretary') {
      console.log('Secretary permissions that would be needed:', {
        canAccessStudentProgress: true,
        currentPermissions: user.secretaryPermissions
      });
    }
    
    // Short delay before redirecting to show the error
    setTimeout(() => {
      // This will cleanup nicely
    }, 100);  
    
    return <Navigate to="/app/dashboard" />;
  }
  
  // Default fallback (should never reach this)
  return <Navigate to="/app/dashboard" />;
};

export default StudentProgressRoute;
