import React from 'react';
import styles from './Page.module.css';
export default function Page({ title, description, actions, children }) { return <main className={styles.page}><header className={styles.header}><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className={styles.actions}>{actions}</div>}</header>{children}</main>; }
