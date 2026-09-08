import React from 'react';
import styles from './Page.module.css';
export default function Card({ as: Tag = 'section', className = '', children, ...props }) { return <Tag className={`${styles.card} ${className}`.trim()} {...props}>{children}</Tag>; }
