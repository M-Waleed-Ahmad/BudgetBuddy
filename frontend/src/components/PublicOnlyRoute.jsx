import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPostLoginPath } from '../utils/navigation';

/** For login/signup/reset pages: signed-in users are redirected into the app. */
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (isAuthenticated) return <Navigate to={getPostLoginPath(location)} replace />;
  return children;
};

export default PublicOnlyRoute;
