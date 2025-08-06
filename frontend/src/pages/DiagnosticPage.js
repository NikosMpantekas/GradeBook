import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { API_URL } from '../config/appConfig';
import { 
  Box, 
  Typography, 
  Paper, 
  Container, 
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
  Alert,
  TextField,
  Card,
  CardContent
} from '@mui/material';
import OfflineTest from '../components/OfflineTest';

// This diagnostic page will help identify authentication issues
const DiagnosticPage = () => {
  const [localStorageData, setLocalStorageData] = useState('');
  const [sessionStorageData, setSessionStorageData] = useState('');
  const [manualChecks, setManualChecks] = useState({});
  const [apiResponse, setApiResponse] = useState(null);
  const [error, setError] = useState(null);
  
  // Get auth state from Redux
  const auth = useSelector((state) => state.auth);
  
  useEffect(() => {
    // Load data from storage
    try {
      const localUser = localStorage.getItem('user');
      const sessionUser = sessionStorage.getItem('user');
      
      setLocalStorageData(localUser ? JSON.parse(localUser) : 'No data found');
      setSessionStorageData(sessionUser ? JSON.parse(sessionUser) : 'No data found');
      
      // Perform manual checks
      setManualChecks({
        hasLocalStorage: !!localUser,
        hasSessionStorage: !!sessionUser,
        reduxHasUser: !!auth.user,
        tokenInRedux: auth.user?.token ? 'Present' : 'Missing',
        userRole: auth.user?.role || 'Unknown',
        reduxAuthState: {
          isLoading: auth.isLoading,
          isError: auth.isError,
          isSuccess: auth.isSuccess,
          message: auth.message
        }
      });
    } catch (err) {
      setError('Error accessing storage: ' + err.message);
    }
  }, [auth]);
  
  // Test API call
  const testApiCall = async () => {
    try {
      setApiResponse({ status: 'loading' });
      
      // Get token from either Redux or storage
      const token = auth.user?.token || 
        JSON.parse(localStorage.getItem('user'))?.token || 
        JSON.parse(sessionStorage.getItem('user'))?.token;
      
      if (!token) {
        setApiResponse({ 
          status: 'error', 
          message: 'No authentication token found in Redux or storage' 
        });
        return;
      }
      
      // Test call to a protected endpoint (using API_URL to ensure HTTPS in production)
      console.log('Using API_URL for diagnostic check:', API_URL);
      const response = await fetch(`${API_URL}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      setApiResponse({
        status: 'success',
        statusCode: response.status,
        data
      });
    } catch (err) {
      setApiResponse({
        status: 'error',
        message: err.message
      });
    }
  };
  
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          GradeBook Authentication Diagnostic
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          This page displays authentication status directly on screen rather than in console logs
        </Alert>
        
        <Divider sx={{ mb: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          Redux Authentication State
        </Typography>
        
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="User Authentication Status" 
                  secondary={auth.user ? "Authenticated" : "Not Authenticated"} 
                />
              </ListItem>
              
              {auth.user && (
                <>
                  <ListItem>
                    <ListItemText 
                      primary="User ID" 
                      secondary={auth.user._id} 
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText 
                      primary="User Name" 
                      secondary={auth.user.name} 
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText 
                      primary="User Role" 
                      secondary={auth.user.role} 
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText 
                      primary="Token Status" 
                      secondary={auth.user.token ? "Present" : "Missing"} 
                    />
                  </ListItem>
                  
                  {auth.user.token && (
                    <ListItem>
                      <ListItemText 
                        primary="Token Preview" 
                        secondary={auth.user.token.substring(0, 20) + '...'} 
                      />
                    </ListItem>
                  )}
                </>
              )}
              
              <ListItem>
                <ListItemText 
                  primary="Loading State" 
                  secondary={auth.isLoading ? "Loading" : "Not Loading"} 
                />
              </ListItem>
              
              <ListItem>
                <ListItemText 
                  primary="Error State" 
                  secondary={auth.isError ? "Error: " + auth.message : "No Error"} 
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
        
        <Typography variant="h6" gutterBottom>
          Storage Checks
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1">Local Storage User Data:</Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={JSON.stringify(localStorageData, null, 2)}
            InputProps={{ readOnly: true }}
            sx={{ mb: 2 }}
          />
          
          <Typography variant="subtitle1">Session Storage User Data:</Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={JSON.stringify(sessionStorageData, null, 2)}
            InputProps={{ readOnly: true }}
          />
        </Box>
        
        <Typography variant="h6" gutterBottom>
          API Connection Test
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Button 
            variant="contained" 
            onClick={testApiCall}
            disabled={apiResponse?.status === 'loading'}
            sx={{ mb: 2 }}
          >
            Test Protected API Call
          </Button>
          
          {apiResponse && (
            <Alert severity={apiResponse.status === 'success' ? 'success' : 'error'}>
              <Typography variant="subtitle1">
                Status: {apiResponse.status}
              </Typography>
              {apiResponse.status === 'success' ? (
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                  value={JSON.stringify(apiResponse.data, null, 2)}
                  InputProps={{ readOnly: true }}
                  sx={{ mt: 1 }}
                />
              ) : (
                <Typography>
                  {apiResponse.message}
                </Typography>
              )}
            </Alert>
          )}
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Divider sx={{ mb: 3 }} />
        
        <Typography variant="h6" gutterBottom>
          Actions
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => {
              localStorage.removeItem('user');
              sessionStorage.removeItem('user');
              window.location.href = '/login';
            }}
          >
            Clear Storage & Redirect to Login
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </Box>
        
        <Divider sx={{ mb: 3, mt: 3 }} />
        
        <OfflineTest />
      </Paper>
    </Container>
  );
};

export default DiagnosticPage;
