import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
// Import with dynamic import to prevent caching

const Footer = () => {
  // Use state to store the version
  const [version, setVersion] = useState('');
  
  // Force refresh of version on every component mount
  useEffect(() => {
    // Dynamic import to bypass caching issues
    import('../../config/appConfig.js')
      .then(module => {
        // Get fresh version directly from module
        setVersion(module.appConfig.version);
        console.log('Footer - dynamically loaded version:', module.appConfig.version);
      })
      .catch(error => {
        console.error('Failed to load appConfig:', error);
        // Fallback if import fails
        setVersion('0.0.0');
      });
  }, []);
  
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
        {' GradeBook - Progressive Web App \n Created by the GradeBook Team'}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {'Version: '}{version} {/* Use the state variable instead of directly using APP_VERSION */}
      </Typography>
    </Box>
  );
};

export default Footer;
