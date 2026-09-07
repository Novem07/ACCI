import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';

export default function RoleRoute({ roles, children }) {
  return (
    <ProtectedRoute>
      <RoleContent roles={roles}>{children}</RoleContent>
    </ProtectedRoute>
  );
}

function RoleContent({ roles, children }) {
  const { user } = useAuth();
  if (!roles.includes(user.role)) return <Navigate to="/home" replace />;
  return children;
}
