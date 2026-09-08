import React, { forwardRef } from 'react';
import styles from './FormField.module.css';

const Select = forwardRef(function Select({ className = '', children, ...selectProps }, ref) {
  return <select ref={ref} className={`${styles.control} ${className}`.trim()} {...selectProps}>{children}</select>;
});

export default Select;
