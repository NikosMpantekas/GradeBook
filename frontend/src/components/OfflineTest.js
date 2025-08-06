import React, { useState } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import offlineManager from '../utils/offlineManager';

const OfflineTest = () => {
  const [currentState, setCurrentState] = useState('online');

  const simulateOffline = () => {
    offlineManager.setOfflineState(true);
    setCurrentState('offline');
  };

  const simulateOnline = () => {
    offlineManager.setOfflineState(false);
    setCurrentState('online');
  };

  const simulateNetworkFailure = () => {
    // Simulate a network failure by calling the offline manager
    offlineManager.handleRequestFailure({ response: null });
    setCurrentState('checking...');
  };

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Typography variant="h6" gutterBottom>
        Offline Detection Test
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Current State: {currentState}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={simulateOnline}
        >
          Simulate Online
        </Button>
        
        <Button 
          variant="contained" 
          color="error" 
          onClick={simulateOffline}
        >
          Simulate Offline
        </Button>
        
        <Button 
          variant="outlined" 
          onClick={simulateNetworkFailure}
        >
          Simulate Network Failure
        </Button>
      </Box>
      
      <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
        Use these buttons to test the offline detection system. 
        The offline message should appear when you simulate offline or network failure.
      </Typography>
    </Paper>
  );
};

export default OfflineTest; 