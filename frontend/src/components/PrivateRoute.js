import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

// PrivateRoute component that checks if user is logged in
// If not, redirects to login page
const PrivateRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children ? children : <Outlet />;
};

export default PrivateRoute;
