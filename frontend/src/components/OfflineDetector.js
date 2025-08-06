import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { styled } from '@mui/material/styles';
import offlineManager from '../utils/offlineManager';
import axios from 'axios';
import RefreshIcon from "@mui/icons-material/Refresh";

// Styled component for the offline message container with watermark
const OfflineContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '60vh',
  textAlign: 'center',
  position: 'relative',
  padding: theme.spacing(3),
  
  // Watermark styling
  '&::before': {
    content: '"</>"',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '8rem',
    fontWeight: 'bold',
    color: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.03)' 
      : 'rgba(0, 0, 0, 0.03)',
    zIndex: 0,
    userSelect: 'none',
    pointerEvents: 'none',
  },
  
  // Ensure content is above watermark
  '& > *': {
    position: 'relative',
    zIndex: 1,
  }
}));

const OfflineDetector = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  // Listen to global offline manager
  useEffect(() => {
    const handleOfflineStateChange = (isOffline) => {
      console.log('OfflineDetector: State changed to', isOffline ? 'offline' : 'online');
      setIsOnline(!isOffline);
      if (!isOffline) {
        setRetryCount(0);
      }
    };

    // Subscribe to offline manager
    offlineManager.addListener(handleOfflineStateChange);

    return () => {
      offlineManager.removeListener(handleOfflineStateChange);
    };
  }, []);

  // Simple connectivity check function
  const checkConnectivity = async () => {
    try {
      // Try multiple endpoints to be more robust
      const endpoints = ['/api/health', '/api/users/me', '/api/schools'];
      
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, {
            timeout: 3000
          });
          
          if (response.status === 200) {
            offlineManager.setOfflineState(false);
            return true;
          }
        } catch (error) {
          console.log(`Failed to reach ${endpoint}:`, error.message);
          continue;
        }
      }
      
      // If we get here, all endpoints failed
      offlineManager.setOfflineState(true);
      return false;
    } catch (error) {
      console.log('All connectivity checks failed:', error.message);
      offlineManager.setOfflineState(true);
      return false;
    }
  };

  // Listen for browser online/offline events as backup
  useEffect(() => {
    const handleOnline = async () => {
      console.log('Browser reports online, checking connectivity...');
      setIsChecking(true);
      await checkConnectivity();
      setIsChecking(false);
    };

    const handleOffline = () => {
      console.log('Browser reports offline');
      offlineManager.setOfflineState(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle retry button click
  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    setIsChecking(true);
    
    // Reset the offline manager and try to connect
    offlineManager.reset();
    await checkConnectivity();
    setIsChecking(false);
  };

  // If online, render children normally
  if (isOnline) {
    return children;
  }

  // If offline, show offline message
  return (
    <Container maxWidth="sm">
      <OfflineContainer>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 'bold',
            color: 'primary.main',
            mb: 2
          }}
        >
          Είστε εκτός σύνδεσης
        </Typography>
        
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ 
            mb: 4,
            fontSize: '1.1rem',
            lineHeight: 1.6
          }}
        >
          Συνδεθείτε στο ίντερνετ και προσπαθήστε ξανά.
        </Typography>
        
        <Button
          variant="contained"
          size="large"
          onClick={handleRetry}
          disabled={isChecking}
          startIcon={<RefreshIcon />}
          sx={{
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 'medium',
            borderRadius: 2,
            boxShadow: 2,
            '&:hover': {
              boxShadow: 4,
            }
          }}
        >
          {isChecking ? 'Περιμένετε...' : 'ΔΟΚΙΜΑΣΤΕ ΞΑΝΑ'}
        </Button>
        
        {retryCount > 0 && (
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ mt: 2, opacity: 0.7 }}
          >
            Επιχειρήσεις επανασύνδεσης: {retryCount}
          </Typography>
        )}
      </OfflineContainer>
    </Container>
  );
};

export default OfflineDetector; 