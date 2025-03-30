import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
// import LoadingSpinner from './LoadingSpinner';

const loadingContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  width: '100vw',
  backgroundColor: '#f0f2f5'
};

/**
 * ProtectedRoute component that restricts access to authenticated users only
 * and redirects unauthenticated users to the login page.
 */
const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { currentUser, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while authentication state is being determined
  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <div>Loading...</div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login page
  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If roles are specified and user doesn't have any of the required roles, show access denied
  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser?.role)) {
    return <Navigate to="/access-denied" replace />;
  }

  // User is authenticated and authorized, render the protected component
  return <Outlet />;
};

export default ProtectedRoute;