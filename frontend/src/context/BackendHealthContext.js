import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const BackendHealthContext = createContext();

export const useBackendHealth = () => {
  const context = useContext(BackendHealthContext);
  if (!context) {
    throw new Error('useBackendHealth must be used within a BackendHealthProvider');
  }
  return context;
};

export const BackendHealthProvider = ({ children, config = {} }) => {
  const [isBackendOnline, setIsBackendOnline] = useState(true);
  const [lastCheckTime, setLastCheckTime] = useState(null);
  const [errorCount, setErrorCount] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  
  // Configuration with defaults
  const {
    healthEndpoint = '/api/health',
    baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000',
    checkInterval = 5000, // 5 seconds
    timeout = 3000, // 3 seconds
    maxRetries = 3,
    retryDelay = 1000, // 1 second
    publicRoutes = ['/home', '/about', '/contact', '/login', '/register', '/maintenance'],
    protectedRoutes = ['/app', '/dashboard', '/superadmin', '/profile', '/notifications']
  } = config;

  const isPublicRoute = (pathname) => {
    return publicRoutes.some(route => pathname === route || pathname.startsWith(route));
  };

  const isProtectedRoute = (pathname) => {
    return protectedRoutes.some(route => pathname.startsWith(route));
  };

  const shouldCheckHealth = (pathname) => {
    // Don't check on public routes or maintenance page
    if (isPublicRoute(pathname)) {
      return false;
    }
    
    // Only check on protected routes that need backend
    return isProtectedRoute(pathname);
  };

  const checkBackendHealth = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    
    try {
      const controller = new AbortController();
      timeoutRef.current = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${baseUrl}${healthEndpoint}`, {
        method: 'GET',
        cache: 'no-cache',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;

      if (response.ok) {
        // Backend is healthy
        setIsBackendOnline(true);
        setErrorCount(0);
        setLastCheckTime(new Date());
      } else {
        // Backend returned error status
        console.warn('Backend health check failed with status:', response.status);
        setIsBackendOnline(false);
        setErrorCount(prev => prev + 1);
        setLastCheckTime(new Date());
      }
    } catch (error) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      
      if (error.name === 'AbortError') {
        // Timeout - don't count as error, just log
        console.warn('Backend health check timed out');
      } else {
        // Network error or other issue
        console.warn('Backend health check error:', error);
        setIsBackendOnline(false);
        setErrorCount(prev => prev + 1);
        setLastCheckTime(new Date());
      }
    } finally {
      setIsChecking(false);
    }
  };

  // Start health monitoring
  const startHealthMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Initial check
    checkBackendHealth();
    
    // Set up periodic checks
    intervalRef.current = setInterval(checkBackendHealth, checkInterval);
  };

  // Stop health monitoring
  const stopHealthMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Manual health check
  const performHealthCheck = () => {
    checkBackendHealth();
  };

  // Context value
  const value = {
    isBackendOnline,
    lastCheckTime,
    errorCount,
    isChecking,
    performHealthCheck,
    startHealthMonitoring,
    stopHealthMonitoring,
    shouldCheckHealth
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopHealthMonitoring();
    };
  }, []);

  return (
    <BackendHealthContext.Provider value={value}>
      {children}
    </BackendHealthContext.Provider>
  );
}; 