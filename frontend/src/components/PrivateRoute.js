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
    console.log('=== PRIVATE ROUTE EFFECT START ===');
    console.log('PrivateRoute rendered at:', location.pathname);
    console.log('Current URL:', window.location.href);
    console.log('Auth state:', { 
      isAuthenticated: !!user, 
      userRole: user?.role || 'none',
      tokenExists: user?.token ? 'yes' : 'no',
      userId: user?._id || 'none'
    });
    
    // Check both localStorage and sessionStorage
    const localUser = localStorage.getItem('user');
    const sessionUser = sessionStorage.getItem('user');
    console.log('localStorage has user:', !!localUser);
    console.log('sessionStorage has user:', !!sessionUser);
    
    if (!user) {
      console.error('=== PRIVATE ROUTE: NO USER DETECTED ===');
      console.error('Redux auth state is empty!');
      if (localUser) {
        console.error('User found in localStorage but not in Redux state!');
        try {
          const parsedLocalUser = JSON.parse(localUser);
          console.error('localStorage user data:', {
            hasId: !!parsedLocalUser._id,
            hasToken: !!parsedLocalUser.token,
            role: parsedLocalUser.role
          });
        } catch (e) {
          console.error('Failed to parse localStorage user:', e);
        }
      }
      if (sessionUser) {
        console.error('User found in sessionStorage but not in Redux state!');
        try {
          const parsedSessionUser = JSON.parse(sessionUser);
          console.error('sessionStorage user data:', {
            hasId: !!parsedSessionUser._id,
            hasToken: !!parsedSessionUser.token,
            role: parsedSessionUser.role
          });
        } catch (e) {
          console.error('Failed to parse sessionStorage user:', e);
        }
      }
    } else {
      console.log('=== PRIVATE ROUTE: USER AUTHENTICATED ===');
      console.log('User details:', {
        id: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
        hasToken: !!user.token,
        tokenLength: user.token ? user.token.length : 0
      });
    }
    console.log('=== PRIVATE ROUTE EFFECT END ===');
  }, [user, location.pathname]);

  if (!user) {
    console.error('=== PRIVATE ROUTE: REDIRECTING TO LOGIN ===');
    console.error('From path:', location.pathname);
    console.error('To path: /login');
    console.error('Reason: No authenticated user found');
    return <Navigate to="/login" />;
  }

  console.log('=== PRIVATE ROUTE: USER AUTHENTICATED, RENDERING CONTENT ===');
  console.log('User role:', user.role);
  console.log('Current path:', location.pathname);
  
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
