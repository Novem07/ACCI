import React from 'react';
import styles from './feedback.module.css';

export default function Alert({ tone = 'info', title, children }) { return <div className={`${styles.alert} ${styles[tone] || styles.info}`} role={tone === 'danger' ? 'alert' : 'status'}>{title && <strong>{title}</strong>}<span>{children}</span></div>; }
