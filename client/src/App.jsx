import React from 'react';
import { AuthProvider } from './auth/AuthContext';
import AppRouter from './app/AppRouter';
import './styles/design.css';

export default function App() {
  return <AuthProvider><AppRouter /></AuthProvider>;
}
