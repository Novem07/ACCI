import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div role="status">Đang kiểm tra phiên đăng nhập...</div>;
  if (!user) return <Navigate to="/" replace state={{ from: location.pathname }} />;
  return children;
}
