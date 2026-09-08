import React from 'react';
import styles from './feedback.module.css';
export default function EmptyState({ title, description, action }) { return <section className={styles.empty}><h2>{title}</h2>{description && <p>{description}</p>}{action}</section>; }
