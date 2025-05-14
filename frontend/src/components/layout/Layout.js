import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import { useSelector } from 'react-redux';

import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { darkMode } = useSelector((state) => state.ui);

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
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
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
