import React from 'react';
import styles from './DataTable.module.css';
export default function SearchToolbar({ label = 'Tìm kiếm', query, onQueryChange, children }) { return <div className={styles.toolbar}><label>{label}<input type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} /></label>{children}</div>; }
