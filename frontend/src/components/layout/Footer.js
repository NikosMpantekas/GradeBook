import React from 'react';
import { Box, Typography, Link } from '@mui/material';

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
        {'Built with '}
        <Link color="inherit" href="https://reactjs.org/" target="_blank" rel="noopener">
          React
        </Link>
        {', '}
        <Link color="inherit" href="https://mui.com/" target="_blank" rel="noopener">
          Material UI
        </Link>
        {' and '}
        <Link color="inherit" href="https://mongodb.com/" target="_blank" rel="noopener">
          MongoDB
        </Link>
      </Typography>
    </Box>
  );
};

export default Footer;
