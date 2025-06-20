import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useFeatureToggles } from '../../context/FeatureToggleContext';

const FeatureDebug = () => {
  // Get the features from the context
  const { features, loading, error } = useFeatureToggles();

  return (
    <Paper elevation={3} sx={{ p: 2, m: 2, maxWidth: 500 }}>
      <Typography variant="h6" gutterBottom>Feature Toggle Debug</Typography>
      
      {loading ? (
        <Typography>Loading features...</Typography>
      ) : error ? (
        <Typography color="error">Error loading features: {error}</Typography>
      ) : (
        <>
          <Typography variant="subtitle1">Available Features:</Typography>
          <Box component="pre" sx={{ 
            p: 2, 
            bgcolor: 'grey.100', 
            borderRadius: 1,
            overflow: 'auto',
            maxHeight: 300
          }}>
            {JSON.stringify(features, null, 2)}
          </Box>
        </>
      )}
    </Paper>
  );
};

export default FeatureDebug;
