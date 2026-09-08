import React from 'react';
import styles from './Button.module.css';

export default function Button({ variant = 'primary', size = 'md', loading = false, disabled = false, className = '', children, ...buttonProps }) {
  const classes = [styles.button, styles[variant], styles[size], className].filter(Boolean).join(' ');
  return <button {...buttonProps} className={classes} disabled={disabled || loading} aria-busy={loading || undefined}>{loading ? 'Đang xử lý…' : children}</button>;
}
