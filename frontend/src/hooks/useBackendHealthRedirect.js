import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBackendHealth } from '../context/BackendHealthContext';

export const useBackendHealthRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isBackendOnline, shouldCheckHealth, startHealthMonitoring, stopHealthMonitoring } = useBackendHealth();

  useEffect(() => {
    // Determine if we should monitor health on current route
    const shouldMonitor = shouldCheckHealth(location.pathname);
    
    if (shouldMonitor) {
      // Start monitoring when on protected routes
      startHealthMonitoring();
      
      // If backend is down, redirect to maintenance
      if (!isBackendOnline) {
        console.log('Backend is offline, redirecting to maintenance');
        navigate('/maintenance', { replace: true });
      }
    } else {
      // Stop monitoring on public routes
      stopHealthMonitoring();
    }

    // Cleanup function
    return () => {
      if (shouldMonitor) {
        stopHealthMonitoring();
      }
    };
  }, [location.pathname, isBackendOnline, shouldCheckHealth, startHealthMonitoring, stopHealthMonitoring, navigate]);

  // Effect to handle backend coming back online
  useEffect(() => {
    if (isBackendOnline && location.pathname === '/maintenance') {
      // Backend is back online and we're on maintenance page
      console.log('Backend is back online, redirecting to home');
      navigate('/home', { replace: true });
    }
  }, [isBackendOnline, location.pathname, navigate]);

  return {
    isBackendOnline,
    shouldCheckHealth: shouldCheckHealth(location.pathname)
  };
}; 