import React from 'react';
import { AppShellFrame } from '../app/AppShellLayout';

// Compatibility wrapper for tests and any feature not migrated yet.
export default function AppShell({ children }) {
  return <AppShellFrame>{children}</AppShellFrame>;
}
