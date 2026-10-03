import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Renders its children only for signed-in users. Others are sent to /login with the
 * requested location in `state.from` so they return there after logging in.
 * Token expiry is handled by AuthContext (on load) and the API client (401 responses).
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

export default ProtectedRoute;
