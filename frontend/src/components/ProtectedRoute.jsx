import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Guard routes to prevent unauthenticated access or unauthorized role access.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  // Show a basic loader while resolving context state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'sans-serif',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading session...
      </div>
    );
  }

  // Redirect to login if user session is empty
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to dashboard if user has insufficient roles
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
