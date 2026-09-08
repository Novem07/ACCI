import React from 'react';
import styles from './DataTable.module.css';
export default function DataTable({ label, columns, rows, getRowKey, renderRow }) { return <div className={styles.scroll}><table className={styles.table}><caption className="srOnly">{label}</caption><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={getRowKey(row)}>{renderRow(row)}</tr>)}</tbody></table></div>; }
