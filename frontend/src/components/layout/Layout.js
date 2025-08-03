import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, Container, Drawer, useTheme, useMediaQuery } from '@mui/material';
import { useSelector } from 'react-redux';

import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';

const Layout = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Retrieve previous mobileOpen state from localStorage to prevent it from resetting on navigation
  const [mobileOpen, setMobileOpen] = useState(() => {
    const savedState = localStorage.getItem('sidebarOpen');
    // Always default to false for mobile, true for desktop
    return window.innerWidth < 600 ? false : (savedState ? savedState === 'true' : true);
  });

  // Swipe functionality refs and state
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);
  const swipeThreshold = 50; // Minimum distance to trigger swipe
  const [drawerPosition, setDrawerPosition] = useState(0); // Track drawer position during swipe
  const touchStartTime = useRef(0);

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
    setDrawerPosition(0); // Reset drawer position
    // Persist the state in localStorage
    localStorage.setItem('sidebarOpen', newState.toString());
  };

  // Swipe handlers
  const handleTouchStart = (e) => {
    if (!isMobile) return;
    
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    isSwiping.current = false;
    setDrawerPosition(0); // Reset position on new touch
  };

  const handleTouchMove = (e) => {
    if (!isMobile) return;
    
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;
    const deltaX = touchX - touchStartX.current;
    const deltaY = Math.abs(touchY - touchStartY.current);
    const deltaTime = Date.now() - touchStartTime.current;
    
    // Only consider it a swipe if it's more horizontal than vertical and started from left edge
    if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 10 && touchStartX.current < 50) {
      isSwiping.current = true;
      e.preventDefault(); // Prevent scrolling during swipe
      e.stopPropagation(); // Prevent other touch handlers
      
      // Calculate drawer position based on swipe
      if (!mobileOpen) {
        // Opening drawer - follow the swipe
        const progress = Math.min(Math.max(deltaX / 200, 0), 1); // Normalize to 0-1
        setDrawerPosition(progress);
      }
    } else if (mobileOpen && deltaX < 0 && Math.abs(deltaX) > 10) {
      // Closing drawer - follow the swipe from right
      isSwiping.current = true;
      e.preventDefault();
      e.stopPropagation();
      
      const progress = Math.min(Math.max(-deltaX / 200, 0), 1); // Normalize to 0-1
      setDrawerPosition(1 - progress);
    }
  };

  const handleTouchEnd = (e) => {
    if (!isMobile) {
      setDrawerPosition(0); // Reset position if not mobile
      return;
    }
    
    const touchX = e.changedTouches[0].clientX;
    const deltaX = touchX - touchStartX.current;
    const deltaTime = Date.now() - touchStartTime.current;
    
    // Only handle if we were actually swiping
    if (!isSwiping.current) {
      setDrawerPosition(0); // Reset position if not swiping
      return;
    }
    
    // Swipe from left edge to open sidebar
    if (deltaX > swipeThreshold && touchStartX.current < 50 && !mobileOpen) {
      handleDrawerToggle();
    }
    // Swipe from right to close sidebar
    else if (deltaX < -swipeThreshold && mobileOpen) {
      handleDrawerToggle();
    }
    
    isSwiping.current = false;
    setDrawerPosition(0); // Reset position after swipe
  };

  // Prevent native browser back gesture when swiping
  const handleTouchCancel = (e) => {
    if (isSwiping.current) {
      e.preventDefault();
      e.stopPropagation();
    }
    isSwiping.current = false;
    setDrawerPosition(0);
  };

  // Sidebar width for layout spacing
  const drawerWidth = 240;

  // Store the current section in localStorage to maintain context across refreshes
  useEffect(() => {
    if (location.pathname.includes('/superadmin/')) {
      localStorage.setItem('currentSection', 'superadmin');
    } else if (location.pathname.includes('/admin/')) {
      localStorage.setItem('currentSection', 'admin');
    }
  }, [location.pathname]);

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
    <Box 
      sx={{ 
        display: 'flex', 
        minHeight: '100vh', 
        bgcolor: darkMode ? 'background.default' : '#f5f5f5',
        touchAction: 'pan-y', // Allow vertical scrolling, prevent horizontal
        WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
      }}
    >
      <Header 
        drawerWidth={drawerWidth} 
        handleDrawerToggle={handleDrawerToggle} 
      />
      <Sidebar 
        drawerWidth={drawerWidth} 
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
        drawerPosition={drawerPosition}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          overflowX: 'hidden', // Prevent horizontal scrolling
          overflowY: 'auto', // Enable vertical scrolling for desktop
          touchAction: 'pan-y', // Allow vertical scrolling, prevent horizontal
        }}
        onTouchStart={(e) => {
          // Only handle touches from the left edge for sidebar
          if (e.touches[0].clientX < 50) {
            handleTouchStart(e);
          }
        }}
        onTouchMove={(e) => {
          // Only handle touches from the left edge for sidebar
          if (touchStartX.current < 50) {
            handleTouchMove(e);
          }
        }}
        onTouchEnd={(e) => {
          // Only handle touches from the left edge for sidebar
          if (touchStartX.current < 50) {
            handleTouchEnd(e);
          }
        }}
      >
        {/* Main content area */}
        <Box
          sx={{
            flexGrow: 1,
            mt: { xs: 7, sm: 8 }, // Account for header height
            p: { xs: 1, sm: 2, md: 3 },
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
          }}
        >
          <Outlet />
        </Box>
        
        {/* Footer - positioned outside main content */}
        <Footer />
      </Box>
    </Box>
  );
};

export default Layout;
