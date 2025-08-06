import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { styled } from '@mui/material/styles';

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
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      console.log('Connection restored');
      setIsOnline(true);
      setRetryCount(0);
    };

    const handleOffline = () => {
      console.log('Connection lost');
      setIsOnline(false);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    
    // Check if we're back online
    if (navigator.onLine) {
      setIsOnline(true);
      setRetryCount(0);
    } else {
      // If still offline, try to detect connectivity
      // This can help in cases where the browser's online status is delayed
      setTimeout(() => {
        if (navigator.onLine) {
          setIsOnline(true);
          setRetryCount(0);
        }
      }, 1000);
    }
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
          Δοκιμάστε ξανά
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