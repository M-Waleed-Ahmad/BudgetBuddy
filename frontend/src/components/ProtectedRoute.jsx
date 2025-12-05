import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loadCurrentUser } from '../features/auth/authSlice.js';

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, token, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && !isAuthenticated && !loading) {
      dispatch(loadCurrentUser());
    }
  }, [dispatch, token, isAuthenticated, loading]);

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
