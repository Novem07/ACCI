import React from 'react';
import styles from './feedback.module.css';
export default function LoadingState({ label = 'Đang tải dữ liệu…' }) { return <div className={styles.loading} role="status"><span aria-hidden="true" />{label}</div>; }
