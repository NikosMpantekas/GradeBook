import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * A reusable error state component
 * @param {Object} props - Component props
 * @param {string} [props.message="Something went wrong"] - Error message to display
 * @param {boolean} [props.fullPage=false] - Whether to display as a full page overlay
 * @param {Function} [props.onRetry=null] - Retry function to call when retry button is clicked
 * @param {string} [props.retryText="Try Again"] - Text for the retry button
 */
const ErrorState = ({ 
  message = "Something went wrong", 
  fullPage = false, 
  onRetry = null,
  retryText = "Try Again"
}) => {
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
      <ErrorOutlineIcon color="error" sx={{ fontSize: 60 }} />
      <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
        {message}
      </Typography>
      {onRetry && (
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<RefreshIcon />} 
          onClick={onRetry}
          sx={{ mt: 3 }}
        >
          {retryText}
        </Button>
      )}
    </Box>
  );

  // If it's a full page error state, show it directly
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

export default ErrorState;
