import React, { createContext, useContext, useMemo, useState } from 'react';

const fallback = { isDirty: false, setDirty: () => {} };
const UnsavedChangesContext = createContext(fallback);

export function UnsavedChangesProvider({ children }) {
  const [isDirty, setDirty] = useState(false);
  const value = useMemo(() => ({ isDirty, setDirty }), [isDirty]);
  return <UnsavedChangesContext.Provider value={value}>{children}</UnsavedChangesContext.Provider>;
}

export function useUnsavedChanges() {
  return useContext(UnsavedChangesContext);
}
