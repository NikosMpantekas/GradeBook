import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';

// PrivateRoute component that checks if user is logged in
// If not, redirects to login page
const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  
  // Debug logging for authentication and routing
  useEffect(() => {
    console.log('PrivateRoute rendered at:', location.pathname);
    console.log('Auth state:', { 
      isAuthenticated: !!user, 
      userRole: user?.role || 'none',
      tokenExists: user?.token ? 'yes' : 'no'
    });
    
    // Check both localStorage and sessionStorage
    const localUser = localStorage.getItem('user');
    const sessionUser = sessionStorage.getItem('user');
    console.log('localStorage has user:', !!localUser);
    console.log('sessionStorage has user:', !!sessionUser);
    
    if (!user) {
      console.log('No user found in Redux state, checking storages...');
      if (localUser) {
        console.log('User found in localStorage but not in Redux state!');
      }
      if (sessionUser) {
        console.log('User found in sessionStorage but not in Redux state!');
      }
    }
  }, [user, location.pathname]);

  if (!user) {
    console.log('Not authenticated! Redirecting to login...');
    return <Navigate to="/login" />;
  }

  console.log('User authenticated, rendering protected content');
  // Support for render prop pattern or regular children
  if (typeof children === 'function') {
    return <div className="private-route-content">{children({ user })}</div>;
  } else if (children) {
    return <div className="private-route-content">{children}</div>;
  } else {
    return <div className="private-route-outlet"><Outlet /></div>;
  }
};

export default PrivateRoute;
