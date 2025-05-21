import React from 'react';
import { Box, CircularProgress, Typography, Paper } from '@mui/material';

/**
 * A reusable loading state component
 * @param {Object} props - Component props
 * @param {string} [props.message="Loading..."] - Message to display while loading
 * @param {boolean} [props.fullPage=false] - Whether to display as a full page overlay
 * @param {string} [props.size="medium"] - Size of the loading spinner (small, medium, large)
 */
const LoadingState = ({ message = "Loading...", fullPage = false, size = "medium" }) => {
  // Determine spinner size based on the size prop
  const spinnerSize = {
    small: 24,
    medium: 40,
    large: 60
  }[size] || 40;

  const content = (
    <Box 
      display="flex" 
      flexDirection="column"
      justifyContent="center" 
      alignItems="center" 
      sx={{ 
        p: 4,
        minHeight: fullPage ? '60vh' : '200px',
        width: '100%'
      }}
    >
      <CircularProgress size={spinnerSize} />
      <Typography variant="h6" sx={{ mt: 2 }}>
        {message}
      </Typography>
    </Box>
  );

  // If it's a full page loading state, show it directly
  if (fullPage) {
    return content;
  }

  // Otherwise wrap it in a Paper component
  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      {content}
    </Paper>
  );
};

export default LoadingState;
