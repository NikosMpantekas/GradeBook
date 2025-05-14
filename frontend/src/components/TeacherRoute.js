import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// TeacherRoute component that checks if user is a teacher or admin
// If not, redirects to dashboard
const TeacherRoute = ({ children }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
    return <Navigate to="/" />;
  }

  return children;
};

export default TeacherRoute;
