import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * A full-screen loading component
 * @param {Object} props
 * @param {string} [props.message='Loading...'] - Optional message to display
 */
const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '70vh',
        width: '100%',
      }}
    >
      <CircularProgress size={60} thickness={4} />
      <Typography variant="h6" sx={{ mt: 2 }}>
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingScreen;
