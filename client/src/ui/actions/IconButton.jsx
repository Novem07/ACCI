import React from 'react';
import styles from './Button.module.css';

export default function IconButton({ label, size = 'md', className = '', children, ...buttonProps }) {
  const classes = [styles.iconButton, styles[`icon${size.charAt(0).toUpperCase()}${size.slice(1)}`], className].filter(Boolean).join(' ');
  return <button {...buttonProps} className={classes} type={buttonProps.type || 'button'} aria-label={label}>{children}</button>;
}
