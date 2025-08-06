import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const BACKEND_HEALTH_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const useBackendHealthCheck = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isCheckingRef = useRef(false);
  const checkIntervalRef = useRef(null);

  useEffect(() => {
    // Don't check if we're already on maintenance page
    if (location.pathname === '/maintenance') {
      return;
    }

    // Don't check on public pages that don't need backend
    const publicPages = ['/home', '/about', '/contact', '/login', '/register'];
    if (publicPages.includes(location.pathname)) {
      return;
    }

    // Only check on protected routes that need backend
    const protectedRoutes = ['/app', '/dashboard', '/superadmin', '/profile', '/notifications'];
    const isProtectedRoute = protectedRoutes.some(route => location.pathname.startsWith(route));
    if (!isProtectedRoute) {
      return;
    }

    const checkBackendHealth = async () => {
      // Prevent multiple simultaneous checks
      if (isCheckingRef.current) {
        return;
      }

      isCheckingRef.current = true;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(`${BACKEND_HEALTH_URL}/api/health`, {
          method: 'GET',
          cache: 'no-cache',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        clearTimeout(timeoutId);

        // If backend is down (5xx errors or network issues), redirect to maintenance
        if (!response.ok) {
          console.log('Backend health check failed:', response.status, response.statusText);
          navigate('/maintenance', { replace: true });
          return;
        }

        // Backend is healthy, clear any existing interval
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }

      } catch (error) {
        console.log('Backend health check error:', error);
        
        // Only redirect on network errors, not on aborted requests
        if (error.name !== 'AbortError') {
          navigate('/maintenance', { replace: true });
        }
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Initial check
    checkBackendHealth();

    // Set up periodic checks every 30 seconds
    checkIntervalRef.current = setInterval(checkBackendHealth, 30000);

    // Cleanup function
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [location.pathname, navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, []);
};

export default useBackendHealthCheck; 