import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { token, officer } = useAuth();

  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && officer && !allowedRoles.includes(officer.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
