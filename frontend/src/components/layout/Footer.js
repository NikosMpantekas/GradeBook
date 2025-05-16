import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { APP_VERSION } from '../../config/appConfig';

// Log the version to verify it's loading correctly
console.log('Current APP_VERSION from config:', APP_VERSION);

const Footer = () => {
  // Use state to store the version and force re-render if needed
  const [version, setVersion] = useState(APP_VERSION);
  
  // Force refresh of version on component mount to avoid caching issues
  useEffect(() => {
    // This will ensure we're always using the latest version from the config
    setVersion(APP_VERSION);
    
    // Add a debug message to help troubleshoot
    console.log('Footer component mounted, APP_VERSION:', APP_VERSION);
    
    // Check if there's a version mismatch and warn in console
    if (version !== APP_VERSION) {
      console.warn(`Version mismatch detected! Displayed: ${version}, Config: ${APP_VERSION}`);
    }
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
        {' GradeBook - Progressive Web App'}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {'Version: '}{version} {/* Use the state variable instead of directly using APP_VERSION */}
      </Typography>
    </Box>
  );
};

export default Footer;
