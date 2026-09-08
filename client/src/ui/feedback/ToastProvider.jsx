import React, { createContext, useContext, useMemo, useState } from 'react';
import Alert from './Alert';
import styles from './feedback.module.css';
const ToastContext = createContext(null);
export function ToastProvider({ children }) { const [toasts, setToasts] = useState([]); const value = useMemo(() => ({ notify(toast) { const id = crypto.randomUUID(); setToasts((items) => [...items, { id, ...toast }]); setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 4000); } }), []); return <ToastContext.Provider value={value}>{children}<div className={styles.toasts} aria-live="polite">{toasts.map((toast) => <Alert key={toast.id} tone={toast.tone} title={toast.title}>{toast.message}</Alert>)}</div></ToastContext.Provider>; }
export function useToast() { const value = useContext(ToastContext); if (!value) throw new Error('useToast must be used inside ToastProvider.'); return value; }
