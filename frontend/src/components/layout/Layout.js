import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, Container, Typography } from '@mui/material';
import { useSelector } from 'react-redux';

import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

const Layout = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { darkMode } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);

  // Add debugging for layout rendering
  useEffect(() => {
    console.log('Layout component rendering at path:', location.pathname);
    console.log('Current user data:', user ? {
      id: user._id,
      name: user.name,
      role: user.role,
      hasToken: !!user.token
    } : 'No user');
  }, [location.pathname, user]);
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Sidebar width for layout spacing
  const drawerWidth = 240;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: darkMode ? 'background.default' : '#f5f5f5' }}>
      <Header drawerWidth={drawerWidth} handleDrawerToggle={handleDrawerToggle} />
      <Sidebar 
        drawerWidth={drawerWidth} 
        mobileOpen={mobileOpen} 
        handleDrawerToggle={handleDrawerToggle} 
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, sm: 3 }, // Less padding on mobile for more content space
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          overflowX: 'hidden', // Prevent horizontal scrolling
        }}
      >
        <Container sx={{ mt: 8, mb: 2, flexGrow: 1 }}>
          <Outlet />
        </Container>
        <Footer />
      </Box>
    </Box>
  );
};

export default Layout;
