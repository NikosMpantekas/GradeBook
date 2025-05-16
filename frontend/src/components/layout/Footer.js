import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { APP_VERSION } from '../../config/appConfig';

// Log the version to verify it's loading correctly
console.log('Current APP_VERSION from config:', APP_VERSION);

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        textAlign: 'center',
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {'© '}
        {new Date().getFullYear()}
        {' GradeBook - Progressive Web App'}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {'Version: '}{APP_VERSION}
      </Typography>
    </Box>
  );
};

export default Footer;
