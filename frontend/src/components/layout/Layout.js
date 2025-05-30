import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import { useSelector } from 'react-redux';

import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

const Layout = () => {
  const location = useLocation();
  // Check if we're on a mobile device
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  
  // Retrieve previous mobileOpen state from localStorage with smart defaults
  const [mobileOpen, setMobileOpen] = useState(() => {
    const savedState = localStorage.getItem('sidebarOpen');
    const isMobileDevice = window.innerWidth <= 600;
    
    if (savedState !== null) {
      // Honor saved state if it exists
      return savedState === 'true';
    } else {
      // Default to closed on mobile, open on desktop
      return !isMobileDevice;
    }
  });
  
  // Handle screen size changes
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 600;
      setIsMobile(mobile);
    };
    
    window.addEventListener('resize', handleResize);
    // Run once on mount
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { darkMode } = useSelector((state) => state.ui);
  const { user } = useSelector((state) => state.auth);

  // Debug logging for layout rendering
  useEffect(() => {
    console.log('Layout component rendering at path:', location.pathname);
    console.log('Current user data:', user ? {
      id: user._id,
      name: user.name,
      role: user.role,
      hasToken: !!user.token
    } : 'No user');
    console.log('Sidebar state on render:', mobileOpen);
  }, [location.pathname, user, mobileOpen]);

  // Enhanced drawer toggle that also persists the state
  const handleDrawerToggle = () => {
    const newState = !mobileOpen;
    setMobileOpen(newState);
    // Persist the state in localStorage
    localStorage.setItem('sidebarOpen', newState.toString());
  };

  // Sidebar width for layout spacing
  const drawerWidth = 240;

  // Check for special user roles and routes
  const isSuperAdmin = user && user.role === 'superadmin';
  const isAdmin = user && (user.role === 'admin' || user.role === 'superadmin');
  const isSuperAdminRoute = location.pathname.includes('/superadmin/');
  const isAdminRoute = location.pathname.includes('/admin/') || isSuperAdminRoute;

  // Store the current section in localStorage to maintain context across refreshes
  useEffect(() => {
    if (isSuperAdminRoute) {
      localStorage.setItem('currentSection', 'superadmin');
    } else if (isAdminRoute) {
      localStorage.setItem('currentSection', 'admin');
    }
  }, [isSuperAdminRoute, isAdminRoute]);

  // Always ensure sidebar remains open for superadmin/admin users only on desktop
  useEffect(() => {
    // Check if this is a desktop device (width > 600px)
    const isDesktop = window.innerWidth > 600;
    
    // Only force sidebar open for admin/superadmin on desktop devices
    if ((isSuperAdmin || isAdmin) && !mobileOpen && isDesktop) {
      console.log('FIXING SIDEBAR: Ensuring sidebar stays open for admin/superadmin on desktop');
      setMobileOpen(true);
      localStorage.setItem('sidebarOpen', 'true');
    }
    
    // For mobile devices, we should respect the user's preference
    // Add a listener to detect screen size changes
    const handleResize = () => {
      const isMobile = window.innerWidth <= 600;
      // If mobile and sidebar is open, close it for better UX
      if (isMobile && mobileOpen) {
        console.log('Mobile device detected, allowing sidebar to be closed');
        // Don't automatically close here, just allow it to be closed
      }
    };
    
    window.addEventListener('resize', handleResize);
    // Run once on mount
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, [isSuperAdmin, isAdmin, mobileOpen, location.pathname]);
  
  // Force sidebar open when navigating between admin and superadmin sections
  useEffect(() => {
    const currentSection = localStorage.getItem('currentSection');
    
    // When switching between admin/superadmin sections, ensure sidebar stays open
    if (
      (isSuperAdminRoute && currentSection !== 'superadmin') ||
      (isAdminRoute && !isSuperAdminRoute && currentSection !== 'admin')
    ) {
      console.log('Section changed, ensuring sidebar remains open');
      setMobileOpen(true);
      localStorage.setItem('sidebarOpen', 'true');
    }
  }, [location.pathname, isSuperAdminRoute, isAdminRoute]);

  // This ensures we have persistent sidebar state regardless of navigation
  useEffect(() => {
    // Save sidebar state on route change
    localStorage.setItem('sidebarOpen', mobileOpen.toString());
    
    // Set up listener for browser back/forward navigation
    const handlePopState = () => {
      // Restore sidebar state from localStorage
      const savedState = localStorage.getItem('sidebarOpen');
      if (savedState !== null) {
        setMobileOpen(savedState === 'true');
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [mobileOpen, location.pathname]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: darkMode ? 'background.default' : '#f5f5f5' }}>
      <Header 
        drawerWidth={drawerWidth} 
        handleDrawerToggle={handleDrawerToggle} 
      />
      <Sidebar 
        drawerWidth={drawerWidth} 
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
        // Only set permanent=true for admin users on desktop for better UX
        permanent={isAdmin && !isMobile}
        isMobile={isMobile}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, sm: 3 }, 
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
