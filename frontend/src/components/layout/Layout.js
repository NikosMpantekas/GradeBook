import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [drawerPosition, setDrawerPosition] = useState(0); // 0 = closed, 1 = fully open
  const touchStartTime = useRef(0);
  const lastTouchX = useRef(0);
  const animationFrameId = useRef(null);

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
  const handleDrawerToggle = useCallback(() => {
    const newState = !mobileOpen;
    setMobileOpen(newState);
    setDrawerPosition(newState ? 1 : 0);
    // Persist the state in localStorage
    localStorage.setItem('sidebarOpen', newState.toString());
  }, [mobileOpen]);

  // Animate drawer to target position
  const animateDrawer = useCallback((targetPosition) => {
    const startPosition = drawerPosition;
    const startTime = performance.now();
    const duration = 300; // 300ms animation

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      
      const currentPosition = startPosition + (targetPosition - startPosition) * easeOutCubic;
      setDrawerPosition(currentPosition);
      
      if (progress < 1) {
        animationFrameId.current = requestAnimationFrame(animate);
      } else {
        setDrawerPosition(targetPosition);
        if (targetPosition === 0) {
          setMobileOpen(false);
        } else if (targetPosition === 1) {
          setMobileOpen(true);
        }
      }
    };
    
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    animationFrameId.current = requestAnimationFrame(animate);
  }, [drawerPosition, mobileOpen]);

  // Touch event handlers
  const handleTouchStart = useCallback((e) => {
    if (!isMobile) return;
    
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    lastTouchX.current = touch.clientX;
    touchStartTime.current = Date.now();
    isSwiping.current = false;
    
    // Cancel any ongoing animation
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
  }, [isMobile]);

  const handleTouchMove = useCallback((e) => {
    if (!isMobile) return;
    
    const touch = e.touches[0];
    const currentX = touch.clientX;
    const currentY = touch.clientY;
    const deltaX = currentX - touchStartX.current;
    const deltaY = Math.abs(currentY - touchStartY.current);
    const deltaTime = Date.now() - touchStartTime.current;
    
    // Determine if this is a horizontal swipe
    const isHorizontalSwipe = Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 10;
    const isRightSwipe = deltaX > 0;
    const isLeftSwipe = deltaX < 0;
    
    // ALWAYS prevent default for horizontal movements to stop browser navigation
    if (Math.abs(deltaX) > 5) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Handle right swipe to open sidebar
    if (isHorizontalSwipe && isRightSwipe && !mobileOpen) {
      isSwiping.current = true;
      
      // Calculate progress based on swipe distance
      const maxSwipeDistance = 200; // Distance needed for full open
      const progress = Math.min(Math.max(deltaX / maxSwipeDistance, 0), 1);
      setDrawerPosition(progress);
    }
    // Handle left swipe to close sidebar
    else if (isHorizontalSwipe && isLeftSwipe && mobileOpen) {
      isSwiping.current = true;
      
      // Calculate progress based on swipe distance
      const maxSwipeDistance = 200; // Distance needed for full close
      const progress = Math.max(1 - (Math.abs(deltaX) / maxSwipeDistance), 0);
      setDrawerPosition(progress);
    }
    
    lastTouchX.current = currentX;
  }, [isMobile, mobileOpen]);

  const handleTouchEnd = useCallback((e) => {
    if (!isMobile) {
      return;
    }
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaTime = Date.now() - touchStartTime.current;
    
    // Always prevent default for horizontal movements
    if (Math.abs(deltaX) > 5) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Only handle if we were actually swiping
    if (!isSwiping.current) {
      return;
    }
    
    // Determine if swipe was far enough to complete the action
    const threshold = 100; // Minimum distance to trigger action
    const isRightSwipe = deltaX > 0;
    const isLeftSwipe = deltaX < 0;
    
    if (isRightSwipe && !mobileOpen && deltaX > threshold) {
      // Complete opening
      animateDrawer(1);
    } else if (isLeftSwipe && mobileOpen && Math.abs(deltaX) > threshold) {
      // Complete closing
      animateDrawer(0);
    } else {
      // Spring back to original position
      animateDrawer(mobileOpen ? 1 : 0);
    }
    
    isSwiping.current = false;
  }, [isMobile, mobileOpen, animateDrawer]);

  const handleTouchCancel = useCallback((e) => {
    if (isSwiping.current) {
      e.preventDefault();
      e.stopPropagation();
    }
    isSwiping.current = false;
    // Spring back to original position
    animateDrawer(mobileOpen ? 1 : 0);
  }, [mobileOpen, animateDrawer]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  // Add document-level touch handling to prevent browser navigation
  useEffect(() => {
    if (!isMobile) return;

    const handleDocumentTouchStart = (e) => {
      const touch = e.touches[0];
      if (touch && touch.clientX < 100) { // Only handle touches from left side
        touchStartX.current = touch.clientX;
        touchStartY.current = touch.clientY;
        lastTouchX.current = touch.clientX;
        touchStartTime.current = Date.now();
        isSwiping.current = false;
      }
    };

    const handleDocumentTouchMove = (e) => {
      const touch = e.touches[0];
      if (!touch) return;
      
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = Math.abs(touch.clientY - touchStartY.current);
      
      // Prevent browser navigation for horizontal movements
      if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 10) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const handleDocumentTouchEnd = (e) => {
      const touch = e.changedTouches[0];
      if (!touch) return;
      
      const deltaX = touch.clientX - touchStartX.current;
      
      // Prevent browser navigation for horizontal movements
      if (Math.abs(deltaX) > 10) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Add passive: false to allow preventDefault
    document.addEventListener('touchstart', handleDocumentTouchStart, { passive: false });
    document.addEventListener('touchmove', handleDocumentTouchMove, { passive: false });
    document.addEventListener('touchend', handleDocumentTouchEnd, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleDocumentTouchStart);
      document.removeEventListener('touchmove', handleDocumentTouchMove);
      document.removeEventListener('touchend', handleDocumentTouchEnd);
    };
  }, [isMobile]);

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
        // Prevent browser navigation gestures
        overscrollBehavior: 'none',
        WebkitOverscrollBehavior: 'none',
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
          // Prevent browser navigation gestures
          overscrollBehavior: 'none',
          WebkitOverscrollBehavior: 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
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
