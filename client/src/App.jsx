import React from 'react';
import { AuthProvider } from './auth/AuthContext';
import AppRouter from './app/AppRouter';

export default function App() {
  return <AuthProvider><AppRouter /></AuthProvider>;
}
