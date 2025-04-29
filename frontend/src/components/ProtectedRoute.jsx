import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const location = useLocation(); // Get current location

  if (!token) {
    // User not logged in, redirect them to the login page
    // Pass the current location state so we can redirect back after login (optional)
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is logged in, render the component they requested
  return children;
};

export default ProtectedRoute;