import React, { cloneElement, isValidElement } from 'react';
import styles from './FormField.module.css';

export default function FormField({ id, label, hint, error, required = false, children }) {
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
  if (!isValidElement(children)) throw new Error('FormField requires one native control child.');
  const control = cloneElement(children, {
    id: children.props.id || id,
    required: required || children.props.required,
    'aria-invalid': error ? 'true' : children.props['aria-invalid'],
    'aria-describedby': [children.props['aria-describedby'], describedBy].filter(Boolean).join(' ') || undefined,
  });

  return <div className={styles.field}>
    <label className={styles.label} htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>
    {control}
    {hint && <p className={styles.hint} id={`${id}-hint`}>{hint}</p>}
    {error && <p className={styles.error} id={`${id}-error`} role="alert">{error}</p>}
  </div>;
}
