import React from 'react';
import styles from './DataTable.module.css';
export default function StatusBadge({ tone = 'neutral', children }) { return <span className={`${styles.badge} ${styles[tone] || styles.neutral}`}>{children}</span>; }
