import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Typography, Box, Paper, Button, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';

/**
 * Debug component to check secretary permissions
 * This component will help diagnose why student progress isn't working for secretary accounts
 */
const SecretaryPermissionDebugger = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  
  // Force console output on load to help diagnose issues
  useEffect(() => {
    console.group('🔍 SECRETARY PERMISSIONS DEBUG INFO');
    console.log('Current user:', user);
    console.log('User role:', user?.role);
    console.log('Secretary permissions object:', user?.secretaryPermissions);
    console.log('Can access student progress:', user?.secretaryPermissions?.canAccessStudentProgress);
    
    // Check localStorage directly
    try {
      const localStorageUser = JSON.parse(localStorage.getItem('user'));
      console.log('User from localStorage:', localStorageUser);
      console.log('localStorage secretary permissions:', localStorageUser?.secretaryPermissions);
      console.log('localStorage progress permission:', localStorageUser?.secretaryPermissions?.canAccessStudentProgress);
    } catch (e) {
      console.log('Error reading localStorage:', e);
    }
    
    // Check sessionStorage directly
    try {
      const sessionStorageUser = JSON.parse(sessionStorage.getItem('user'));
      console.log('User from sessionStorage:', sessionStorageUser);
      console.log('sessionStorage secretary permissions:', sessionStorageUser?.secretaryPermissions);
      console.log('sessionStorage progress permission:', sessionStorageUser?.secretaryPermissions?.canAccessStudentProgress);
    } catch (e) {
      console.log('Error reading sessionStorage:', e);
    }
    console.groupEnd();
  }, [user]);
  
  if (!user) {
    return (
      <Alert severity="error">
        Not logged in. Please log in first.
      </Alert>
    );
  }
  
  // Try to access student progress
  const handleTryAccess = () => {
    navigate('/app/admin/progress');
  };
  
  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Secretary Permission Debugger
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Current User Information
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1"><strong>Name:</strong> {user.name}</Typography>
          <Typography variant="body1"><strong>Email:</strong> {user.email}</Typography>
          <Typography variant="body1"><strong>Role:</strong> {user.role}</Typography>
        </Box>
        
        <Typography variant="h6" gutterBottom>
          Secretary Permissions
        </Typography>
        
        {user.role !== 'secretary' ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Current user is not a secretary. This page is meant for debugging secretary permissions.
          </Alert>
        ) : (
          <Box>
            <Alert 
              severity={user.secretaryPermissions?.canAccessStudentProgress ? "success" : "error"}
              sx={{ mb: 2 }}
            >
              <Typography variant="body1">
                <strong>Can Access Student Progress:</strong> {" "}
                {user.secretaryPermissions?.canAccessStudentProgress ? "YES ✅" : "NO ❌"}
              </Typography>
            </Alert>
            
            <Typography variant="body2" sx={{ mb: 2 }}>
              Other permissions:
            </Typography>
            
            <ul>
              <li>Can Manage Grades: {user.secretaryPermissions?.canManageGrades ? "Yes" : "No"}</li>
              <li>Can Send Notifications: {user.secretaryPermissions?.canSendNotifications ? "Yes" : "No"}</li>
              <li>Can Manage Users: {user.secretaryPermissions?.canManageUsers ? "Yes" : "No"}</li>
              <li>Can Manage Schools: {user.secretaryPermissions?.canManageSchools ? "Yes" : "No"}</li>
              <li>Can Manage Directions: {user.secretaryPermissions?.canManageDirections ? "Yes" : "No"}</li>
              <li>Can Manage Subjects: {user.secretaryPermissions?.canManageSubjects ? "Yes" : "No"}</li>
            </ul>
          </Box>
        )}
      </Paper>
      
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Test Access
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleTryAccess}
          sx={{ mr: 2 }}
        >
          Try to Access Student Progress
        </Button>
        
        <Button 
          variant="outlined"
          onClick={() => navigate('/app/admin/users')}
        >
          Back to User Management
        </Button>
        
        <Box sx={{ mt: 2 }}>
          <Alert severity="info">
            <Typography variant="body2">
              Click the button above to test access to the Student Progress page. Check the browser console (F12) for detailed debug information.
            </Typography>
          </Alert>
        </Box>
      </Paper>
    </Box>
  );
};

export default SecretaryPermissionDebugger;
